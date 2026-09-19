import { AttemptStatus, ProgressStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { rankProblems } from "@/lib/practice-recommendation";
import { prisma } from "@/lib/prisma";

async function contextFor(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      progressRecords: {
        where: { status: { in: [ProgressStatus.IN_PROGRESS, ProgressStatus.NOT_STARTED] } }, orderBy: { updatedAt: "desc" }, take: 1,
        include: {
          topics: { include: { topic: true } },
          roadmap: { include: { modules: { orderBy: { position: "asc" }, include: { topics: { orderBy: { position: "asc" } } } } } },
        },
      },
    },
  });
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  try {
    const user = await contextFor(email);
    const progress = user?.progressRecords[0];
    if (!user || !progress) return NextResponse.json({ error: "No active roadmap found" }, { status: 404 });
    const topicProgress = progress.topics.find((item) => item.status !== ProgressStatus.COMPLETED);
    const roadmapTopics = progress.roadmap.modules.flatMap((module) => module.topics);
    const currentTopicId = topicProgress?.topicId ?? roadmapTopics.find((topic) => !progress.topics.some((entry) => entry.topicId === topic.id && entry.status === ProgressStatus.COMPLETED))?.id ?? roadmapTopics[0]?.id;
    if (!currentTopicId) return NextResponse.json({ error: "No topic found" }, { status: 404 });
    const weakTopicIds = progress.topics.filter((item) => Math.min(item.assessmentScore ?? 100, item.practiceAccuracy ?? 100) < 80).map((item) => item.topicId);
    const problems = await prisma.problem.findMany({ where: { topicId: { in: [...new Set([currentTopicId, ...weakTopicIds])] } }, include: { topic: true, attempts: { where: { userId: user.id }, select: { isSolved: true } } } });
    const ranked = rankProblems(problems.map((problem) => ({ id: problem.id, topicId: problem.topicId, difficulty: problem.difficulty, solved: problem.attempts.some((attempt) => attempt.isSolved), attempts: problem.attempts.length })), currentTopicId, weakTopicIds, topicProgress?.practiceAccuracy);
    const byId = new Map(problems.map((problem) => [problem.id, problem]));
    return NextResponse.json({ currentTopicId, targetDifficulty: ranked[0]?.difficulty ?? "EASY", problems: ranked.map((rankedProblem) => { const problem = byId.get(rankedProblem.id)!; return { id: problem.id, title: problem.title, description: problem.description, difficulty: problem.difficulty, topic: problem.topic.title, subtopic: problem.subtopic, platform: problem.platform, url: problem.url, estimatedTime: problem.estimatedMinutes, tags: problem.tags, solved: rankedProblem.solved, attempts: rankedProblem.attempts }; }) });
  } catch { return NextResponse.json({ error: "Practice data is unavailable" }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: string; problemId?: string; outcome?: "solved" | "needs_revision"; durationMinutes?: number } | null;
  if (!body?.email || !body.problemId || !body.outcome) return NextResponse.json({ error: "email, problemId, and outcome are required" }, { status: 400 });
  try {
    const user = await contextFor(body.email);
    const progress = user?.progressRecords[0];
    const problem = await prisma.problem.findUnique({ where: { id: body.problemId } });
    if (!user || !progress || !problem) return NextResponse.json({ error: "Practice context not found" }, { status: 404 });
    const solved = body.outcome === "solved";
    await prisma.problemAttempt.create({ data: { userId: user.id, problemId: problem.id, status: AttemptStatus.GRADED, isSolved: solved, durationMinutes: Math.max(0, Math.round(body.durationMinutes ?? problem.estimatedMinutes)), startedAt: new Date(), submittedAt: new Date(), notes: solved ? "Marked solved from external practice link." : "Marked for revision from external practice link." } });
    const attempts = await prisma.problemAttempt.findMany({ where: { userId: user.id, problemId: problem.id }, select: { isSolved: true, durationMinutes: true } });
    const solvedCount = attempts.filter((attempt) => attempt.isSolved).length;
    const accuracy = Math.round((solvedCount / attempts.length) * 100);
    await prisma.topicProgress.upsert({ where: { userProgressId_topicId: { userProgressId: progress.id, topicId: problem.topicId } }, update: { status: ProgressStatus.IN_PROGRESS, practiceAccuracy: accuracy, mistakes: attempts.length - solvedCount, timeSpentMinutes: { increment: Math.max(0, Math.round(body.durationMinutes ?? problem.estimatedMinutes)) }, lastActivityAt: new Date() }, create: { userProgressId: progress.id, topicId: problem.topicId, status: ProgressStatus.IN_PROGRESS, practiceAccuracy: accuracy, mistakes: attempts.length - solvedCount, timeSpentMinutes: Math.max(0, Math.round(body.durationMinutes ?? problem.estimatedMinutes)), lastActivityAt: new Date() } });
    return NextResponse.json({ ok: true, accuracy });
  } catch { return NextResponse.json({ error: "Practice data is unavailable" }, { status: 503 }); }
}
