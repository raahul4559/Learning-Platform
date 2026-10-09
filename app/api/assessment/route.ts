import { AttemptStatus, ProgressStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ensureActiveProgress } from "@/lib/learner-provisioning";
import { prisma } from "@/lib/prisma";

async function activeContext(email: string) {
  await ensureActiveProgress(email);
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      progressRecords: {
        where: { status: { in: [ProgressStatus.IN_PROGRESS, ProgressStatus.NOT_STARTED] } }, orderBy: { updatedAt: "desc" }, take: 1,
        include: {
          topics: { include: { topic: true } },
          roadmap: { include: { modules: { orderBy: { position: "asc" }, include: { topics: { orderBy: { position: "asc" }, include: { assessments: { where: { isPublished: true }, take: 1, include: { questions: { orderBy: { position: "asc" } } } } } } } } } },
        },
      },
    },
  });
}

type ProgressWithContext = NonNullable<Awaited<ReturnType<typeof activeContext>>>["progressRecords"][number];

function currentTopic(progress: ProgressWithContext) {
  const allTopics = progress.roadmap.modules.flatMap((module) => module.topics.map((topic) => ({ ...topic, module: module.title })));
  const progressTopic = progress.topics.find((item) => item.status !== ProgressStatus.COMPLETED);
  return progressTopic ? allTopics.find((item) => item.id === progressTopic.topicId)
    : allTopics.find((item) => !progress.topics.some((entry) => entry.topicId === item.id && entry.status === ProgressStatus.COMPLETED)) ?? allTopics[0];
}

function weakAreasFor(topicProgress: { topicId: string; assessmentScore: number | null; practiceAccuracy: number | null; topic: { title: string } }[]) {
  return topicProgress
    .map((item) => ({ id: item.topicId, name: item.topic.title, score: Math.min(item.assessmentScore ?? 100, item.practiceAccuracy ?? 100) }))
    .filter((item) => item.score < 80)
    .sort((a, b) => a.score - b.score);
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  try {
    const user = await activeContext(email);
    const progress = user?.progressRecords[0];
    if (!user || !progress) return NextResponse.json({ error: "No active roadmap found" }, { status: 404 });
    const topic = currentTopic(progress);
    const assessment = topic?.assessments[0];
    if (!topic || !assessment) return NextResponse.json({ error: "No assessment found for the current topic" }, { status: 404 });
    return NextResponse.json({
      assessment: {
        id: assessment.id, title: assessment.title, topicId: topic.id, topic: topic.title,
        passingScore: assessment.passingScore, estimatedMinutes: assessment.estimatedMinutes,
        questions: assessment.questions.map((question) => ({ id: question.id, position: question.position, prompt: question.prompt, options: question.options as string[] })),
      },
    });
  } catch (error) { console.error("GET /api/assessment failed", error); return NextResponse.json({ error: "Assessment data is unavailable" }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: string; assessmentId?: string; answers?: Record<string, string> } | null;
  if (!body?.email || !body.assessmentId || !body.answers) return NextResponse.json({ error: "email, assessmentId, and answers are required" }, { status: 400 });
  try {
    const user = await activeContext(body.email);
    const progress = user?.progressRecords[0];
    if (!user || !progress) return NextResponse.json({ error: "No active roadmap found" }, { status: 404 });
    const assessment = await prisma.assessment.findUnique({ where: { id: body.assessmentId }, include: { questions: { orderBy: { position: "asc" } }, topic: true } });
    if (!assessment || !assessment.topicId) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

    const answers = body.answers;
    const maxScore = assessment.questions.reduce((sum, question) => sum + question.points, 0);
    const rawScore = assessment.questions.reduce((sum, question) => sum + (answers[question.id] !== undefined && answers[question.id] === question.correctAnswer ? question.points : 0), 0);
    const percent = maxScore ? Math.round((rawScore / maxScore) * 100) : 0;
    const passed = percent >= assessment.passingScore;
    const now = new Date();

    await prisma.assessmentAttempt.create({ data: { userId: user.id, assessmentId: assessment.id, status: AttemptStatus.GRADED, score: rawScore, maxScore, answers, startedAt: now, submittedAt: now } });

    const existingTopicProgress = progress.topics.find((item) => item.topicId === assessment.topicId);
    const status = passed ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS;
    const completion = passed ? 100 : Math.max(existingTopicProgress?.completion ?? 0, 50);
    const topicProgress = await prisma.topicProgress.upsert({
      where: { userProgressId_topicId: { userProgressId: progress.id, topicId: assessment.topicId } },
      update: { status, completion, assessmentScore: percent, lastActivityAt: now, completedAt: passed ? now : null },
      create: { userProgressId: progress.id, topicId: assessment.topicId, status, completion, assessmentScore: percent, lastActivityAt: now },
    });

    const allTopicProgress = await prisma.topicProgress.findMany({ where: { userProgressId: progress.id }, include: { topic: true } });
    const weakAreas = weakAreasFor(allTopicProgress);
    const topicTitle = assessment.topic?.title ?? "this topic";
    const recommendation = percent < 60
      ? `Revisit ${topicTitle} and retry the checkpoint after a short review.`
      : !passed
        ? `Add a few targeted practice problems on ${topicTitle} before moving on.`
        : `You're ready to progress past ${topicTitle} — continue to the next topic.`;

    return NextResponse.json({ score: percent, rawScore, maxScore, passed, topicMastery: topicProgress.completion, weakAreas, recommendation });
  } catch (error) { console.error("POST /api/assessment failed", error); return NextResponse.json({ error: "Assessment data is unavailable" }, { status: 503 }); }
}
