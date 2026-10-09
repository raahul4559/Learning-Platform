import { ProgressStatus, RoadmapStatus } from "@prisma/client";
import { adaptPlanTopics, buildTodayPlan, type PlanTopic } from "@/lib/daily-plan";
import { calculateMastery, type MasteryResult, type TopicPerformance } from "@/lib/mastery-engine";
import { prisma } from "@/lib/prisma";

type StoredTopicProgress = { topicId: string; assessmentScore: number | null; mistakes: number; timeSpentMinutes: number; learningCompleted: boolean; practiceCompleted: boolean; attemptCount: number; confidence: number | null };

/** Maps the DB's TopicProgress row onto the mastery engine's input contract. `null` means "never attempted". */
export function topicPerformanceFromProgress(progress: StoredTopicProgress | null, topicName?: string): TopicPerformance {
  return {
    topicId: progress?.topicId ?? "",
    topicName,
    learningCompleted: progress?.learningCompleted ?? false,
    practiceCompleted: progress?.practiceCompleted ?? false,
    assessmentScore: progress?.assessmentScore ?? null,
    attemptCount: progress?.attemptCount ?? 0,
    mistakeCount: progress?.mistakes ?? 0,
    timeSpent: progress?.timeSpentMinutes ?? 0,
    confidence: progress?.confidence ?? null,
  };
}

/**
 * Signup/onboarding only persist to the browser (lib/auth-store.ts, lib/store.ts).
 * This lazily attaches an email to the shared, seeded roadmap catalog the first
 * time it's asked for learning/practice data, so those features work for any
 * signed-up learner instead of only the seeded demo account.
 */
export async function ensureActiveProgress(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.upsert({ where: { email: normalizedEmail }, update: {}, create: { email: normalizedEmail } });
  const existing = await prisma.userProgress.findFirst({ where: { userId: user.id, status: { in: [ProgressStatus.IN_PROGRESS, ProgressStatus.NOT_STARTED] } } });
  if (existing) return;
  const roadmap = await prisma.roadmap.findFirst({ where: { status: RoadmapStatus.ACTIVE }, orderBy: { createdAt: "asc" } });
  if (!roadmap) return;
  await prisma.userProgress.create({ data: { userId: user.id, roadmapId: roadmap.id, learningGoalId: roadmap.learningGoalId, status: ProgressStatus.NOT_STARTED } });
}

const startOfDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

/**
 * Materialises today's DailyTask rows from the learner's real roadmap/topic/problem/assessment
 * data the first time they're needed, so the dashboard's daily plan is always backed by the
 * database rather than improvised client-side. Deterministic and idempotent: a learner who
 * already has tasks due today is left untouched.
 */
export async function ensureTodayPlan(email: string, now = new Date()) {
  const normalizedEmail = email.trim().toLowerCase();
  const today = startOfDay(now);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, include: { profile: true, dailyTasks: { where: { dueDate: today } } } });
  if (!user || user.dailyTasks.length) return;

  const progress = await prisma.userProgress.findFirst({
    where: { userId: user.id, status: { in: [ProgressStatus.IN_PROGRESS, ProgressStatus.NOT_STARTED] } },
    orderBy: { updatedAt: "desc" },
    include: {
      topics: true,
      roadmap: { include: { modules: { orderBy: { position: "asc" }, include: { topics: { orderBy: { position: "asc" }, include: { problems: true, assessments: { where: { isPublished: true }, take: 1 } } } } } } },
    },
  });
  if (!progress) return;

  const rawTopics: PlanTopic[] = progress.roadmap.modules.flatMap((module) =>
    module.topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      moduleTitle: module.title,
      estimatedLearningMinutes: topic.estimatedLearningMinutes,
      estimatedPracticeMinutes: topic.estimatedPracticeMinutes,
      problems: topic.problems.map((problem) => ({ id: problem.id, title: problem.title, difficulty: problem.difficulty, estimatedMinutes: problem.estimatedMinutes })),
      assessment: topic.assessments[0] ? { id: topic.assessments[0].id, title: topic.assessments[0].title, estimatedMinutes: topic.assessments[0].estimatedMinutes } : null,
      completed: false,
    })),
  );
  if (!rawTopics.length) return;

  // Mastery — not the raw TopicProgress.status flag — decides which topics are actually done and
  // what today's work on an in-progress one should look like (generic next-step vs a recommended
  // revision/practice/retake sequence). This is what lets yesterday's performance change today's plan.
  const resultsByTopicId = new Map<string, MasteryResult>();
  for (const topic of rawTopics) {
    const stored = progress.topics.find((item) => item.topicId === topic.id);
    if (!stored) continue;
    resultsByTopicId.set(topic.id, calculateMastery(topicPerformanceFromProgress(stored, topic.title)));
  }
  const orderedTopics = adaptPlanTopics(rawTopics, resultsByTopicId);
  const startIndex = Math.max(0, orderedTopics.findIndex((topic) => !topic.completed));
  const dailyMinutes = user.profile?.dailyMinutes ?? 60;
  const drafts = buildTodayPlan(orderedTopics, dailyMinutes, startIndex);
  if (!drafts.length) return;

  await prisma.dailyTask.createMany({
    data: drafts.map((task, index) => ({
      userId: user.id, userProgressId: progress.id, topicId: task.topicId, title: task.title, description: task.description,
      type: task.kind, dueDate: today, estimatedMinutes: task.minutes, status: ProgressStatus.NOT_STARTED, position: index + 1,
      metadata: { problemId: task.problemId, assessmentId: task.assessmentId },
    })),
  });
}
