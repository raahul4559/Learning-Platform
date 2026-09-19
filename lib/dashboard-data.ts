import { ProgressStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardTask = { id: string; title: string; kind: "learn" | "practice" | "review" | "assessment"; minutes: number; completed: boolean; topicId: string; moduleId?: string };
export type DashboardData = {
  source: "database" | "demo";
  learnerName: string;
  today: DashboardTask[];
  todayCompleted: number;
  todayTotal: number;
  streak: number;
  weeklyCompleted: number;
  weeklyTotal: number;
  currentModule?: string;
  currentTopic?: { id: string; name: string; description?: string };
  nextTopic?: { id: string; name: string };
  weakTopics: { id: string; name: string; score: number }[];
  deadline?: string;
};

const startOfDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export async function getDashboardData(email: string, now = new Date()): Promise<DashboardData | null> {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const weekStart = addDays(today, -6);
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      progressRecords: {
        where: { status: { in: [ProgressStatus.IN_PROGRESS, ProgressStatus.NOT_STARTED] } },
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          roadmap: {
            include: {
              learningGoal: true,
              modules: { orderBy: { position: "asc" }, include: { topics: { orderBy: { position: "asc" } } } },
            },
          },
          topics: { include: { topic: true } },
        },
      },
      dailyTasks: { where: { dueDate: { gte: weekStart, lt: tomorrow } }, orderBy: [{ dueDate: "asc" }, { position: "asc" }] },
      studySessions: { where: { startedAt: { gte: addDays(today, -90), lt: tomorrow } }, orderBy: { startedAt: "desc" } },
    },
  });
  if (!user) return null;

  const progress = user.progressRecords[0];
  const todayTasks = user.dailyTasks.filter((task) => task.dueDate >= today && task.dueDate < tomorrow);
  const weeklyTasks = user.dailyTasks;
  const completed = (status: ProgressStatus) => status === ProgressStatus.COMPLETED;
  const topicProgress = progress?.topics ?? [];
  const currentProgress = topicProgress.find((item) => !completed(item.status));
  const orderedTopics = progress?.roadmap.modules.flatMap((module) => module.topics.map((topic) => ({ ...topic, module: module.title }))) ?? [];
  const currentTopic = currentProgress?.topic ?? orderedTopics.find((topic) => topic.id === todayTasks[0]?.topicId) ?? orderedTopics[0];
  const currentIndex = orderedTopics.findIndex((topic) => topic.id === currentTopic?.id);
  const weakTopics = topicProgress
    .map((item) => ({ id: item.topic.id, name: item.topic.title, score: Math.min(item.assessmentScore ?? 100, item.practiceAccuracy ?? 100) }))
    .filter((item) => item.score < 80)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const studiedDays = new Set(user.studySessions.map((session) => isoDay(session.startedAt)));
  let streak = 0;
  for (let day = today; studiedDays.has(isoDay(day)); day = addDays(day, -1)) streak += 1;

  return {
    source: "database",
    learnerName: user.displayName ?? user.email.split("@")[0],
    today: todayTasks.map((task) => ({ id: task.id, title: task.title, kind: task.type.toLowerCase() as DashboardTask["kind"], minutes: task.estimatedMinutes, completed: completed(task.status), topicId: task.topicId ?? "", moduleId: progress?.roadmap.modules.find((module) => module.topics.some((topic) => topic.id === task.topicId))?.id })),
    todayCompleted: todayTasks.filter((task) => completed(task.status)).length,
    todayTotal: todayTasks.length,
    streak,
    weeklyCompleted: weeklyTasks.filter((task) => completed(task.status)).length,
    weeklyTotal: weeklyTasks.length,
    currentModule: orderedTopics.find((topic) => topic.id === currentTopic?.id)?.module,
    currentTopic: currentTopic ? { id: currentTopic.id, name: currentTopic.title, description: currentTopic.description ?? undefined } : undefined,
    nextTopic: currentIndex >= 0 && orderedTopics[currentIndex + 1] ? { id: orderedTopics[currentIndex + 1].id, name: orderedTopics[currentIndex + 1].title } : undefined,
    weakTopics,
    deadline: progress?.roadmap.learningGoal.targetDate?.toISOString().slice(0, 10),
  };
}

export async function completeDashboardTask(email: string, taskId: string, completed: boolean) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
  if (!user) return null;
  const task = await prisma.dailyTask.findFirst({ where: { id: taskId, userId: user.id } });
  if (!task) return null;
  return prisma.dailyTask.update({ where: { id: task.id }, data: { status: completed ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS, completedAt: completed ? new Date() : null } });
}
