import { AttemptStatus, ProgressStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ensureActiveProgress, topicPerformanceFromProgress } from "@/lib/learner-provisioning";
import { calculateMastery, detectWeakTopics } from "@/lib/mastery-engine";
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

    // Mastery — not the raw pass/fail on this one quiz — decides whether the topic is actually
    // "completed": it blends this assessment score with the learner's practice history so far.
    const existingTopicProgress = progress.topics.find((item) => item.topicId === assessment.topicId);
    const mastery = calculateMastery({
      ...topicPerformanceFromProgress(existingTopicProgress ?? null, assessment.topic?.title),
      topicId: assessment.topicId, assessmentScore: percent,
    });
    const status = mastery.band === "progression" ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS;
    const topicProgress = await prisma.topicProgress.upsert({
      where: { userProgressId_topicId: { userProgressId: progress.id, topicId: assessment.topicId } },
      update: { status, completion: mastery.mastery, assessmentScore: percent, lastActivityAt: now, completedAt: status === ProgressStatus.COMPLETED ? now : null },
      create: { userProgressId: progress.id, topicId: assessment.topicId, status, completion: mastery.mastery, assessmentScore: percent, lastActivityAt: now },
    });

    const allTopicProgress = await prisma.topicProgress.findMany({ where: { userProgressId: progress.id }, include: { topic: true } });
    const weakAreas = detectWeakTopics(allTopicProgress.map((item) => topicPerformanceFromProgress(item, item.topic.title)))
      .map((result) => ({ id: result.topicId, name: allTopicProgress.find((item) => item.topicId === result.topicId)?.topic.title ?? result.topicId, score: result.mastery }));

    return NextResponse.json({ score: percent, rawScore, maxScore, passed, topicMastery: topicProgress.completion, band: mastery.band, reasons: mastery.reasons, recommendation: mastery.recommendation, weakAreas });
  } catch (error) { console.error("POST /api/assessment failed", error); return NextResponse.json({ error: "Assessment data is unavailable" }, { status: 503 }); }
}
