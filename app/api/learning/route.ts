import { ProgressStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function activeContext(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      progressRecords: {
        where: { status: { in: [ProgressStatus.IN_PROGRESS, ProgressStatus.NOT_STARTED] } }, orderBy: { updatedAt: "desc" }, take: 1,
        include: {
          topics: { include: { topic: true } },
          roadmap: { include: { modules: { orderBy: { position: "asc" }, include: { topics: { orderBy: { position: "asc" }, include: { resources: { include: { resource: true } }, assessments: { where: { isPublished: true }, take: 1 } } } } } } },
        },
      },
    },
  });
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  try {
    const user = await activeContext(email);
    const progress = user?.progressRecords[0];
    if (!user || !progress) return NextResponse.json({ error: "No active roadmap found" }, { status: 404 });
    const progressTopic = progress.topics.find((item) => item.status !== ProgressStatus.COMPLETED);
    const allTopics = progress.roadmap.modules.flatMap((module) => module.topics.map((topic) => ({ ...topic, module: module.title })));
    const topic = progressTopic?.topic ?? allTopics.find((item) => !progress.topics.some((entry) => entry.topicId === item.id && entry.status === ProgressStatus.COMPLETED)) ?? allTopics[0];
    const roadmapTopic = allTopics.find((item) => item.id === topic?.id);
    if (!topic || !roadmapTopic) return NextResponse.json({ error: "No topic found" }, { status: 404 });
    return NextResponse.json({ topic: { id: topic.id, name: topic.title, description: topic.description, module: roadmapTopic.module, progress: progressTopic?.completion ?? 0, estimatedMinutes: topic.estimatedLearningMinutes, resources: roadmapTopic.resources.map((item) => ({ id: item.resource.id, title: item.resource.title, type: item.resource.type, url: item.resource.url })), assessment: roadmapTopic.assessments[0] ? { id: roadmapTopic.assessments[0].id, title: roadmapTopic.assessments[0].title, estimatedMinutes: roadmapTopic.assessments[0].estimatedMinutes } : null } });
  } catch { return NextResponse.json({ error: "Learning data is unavailable" }, { status: 503 }); }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: string; topicId?: string; outcome?: "understood" | "revision" } | null;
  if (!body?.email || !body.topicId || !body.outcome) return NextResponse.json({ error: "email, topicId, and outcome are required" }, { status: 400 });
  try {
    const user = await activeContext(body.email);
    const progress = user?.progressRecords[0];
    if (!user || !progress) return NextResponse.json({ error: "No active roadmap found" }, { status: 404 });
    const now = new Date();
    await prisma.studySession.create({ data: { userId: user.id, userProgressId: progress.id, topicId: body.topicId, startedAt: now, endedAt: now, durationMinutes: 1, notes: body.outcome === "understood" ? "Learner marked this topic understood." : "Learner requested revision." } });
    if (body.outcome === "understood") await prisma.topicProgress.upsert({ where: { userProgressId_topicId: { userProgressId: progress.id, topicId: body.topicId } }, update: { status: ProgressStatus.IN_PROGRESS, completion: 50, lastActivityAt: now }, create: { userProgressId: progress.id, topicId: body.topicId, status: ProgressStatus.IN_PROGRESS, completion: 50, lastActivityAt: now } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Learning data is unavailable" }, { status: 503 }); }
}
