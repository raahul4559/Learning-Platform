import { seededResources, topics } from "@/lib/data";
import { DailyTask, LearningPreference, LearningTask, ProblemDifficulty, Roadmap, RoadmapInput, RoadmapModule, RoadmapResource, RoadmapTopic, TopicDifficulty, TopicId, TopicStatus } from "@/lib/types";

type Definition = { id: TopicId; moduleId: string; prerequisites: TopicId[]; difficulty: TopicDifficulty; learning: number; practice: number };

const definitions: Definition[] = [
  ["complexity", "foundations", [], "Beginner", 75, 90], ["arrays", "foundations", ["complexity"], "Beginner", 100, 180], ["strings", "foundations", ["arrays"], "Beginner", 90, 180], ["hashing", "foundations", ["arrays", "strings"], "Intermediate", 100, 210], ["two-pointers", "foundations", ["arrays", "strings"], "Intermediate", 90, 210], ["sliding-window", "foundations", ["two-pointers", "hashing"], "Intermediate", 105, 240], ["binary-search", "foundations", ["complexity", "arrays"], "Intermediate", 100, 210],
  ["linked-lists", "linear", ["arrays"], "Intermediate", 105, 210], ["stack", "linear", ["arrays"], "Intermediate", 75, 180], ["queue", "linear", ["arrays"], "Intermediate", 75, 180], ["recursion", "linear", ["complexity"], "Intermediate", 110, 240], ["backtracking", "linear", ["recursion"], "Advanced", 110, 270],
  ["trees", "advanced", ["recursion", "queue"], "Intermediate", 135, 300], ["bst", "advanced", ["trees", "binary-search"], "Intermediate", 85, 210], ["heap", "advanced", ["trees"], "Advanced", 100, 240], ["graphs", "advanced", ["queue", "recursion"], "Advanced", 150, 360], ["greedy", "advanced", ["arrays"], "Advanced", 105, 270], ["dynamic-programming", "advanced", ["recursion", "arrays"], "Advanced", 165, 420],
].map(([id, moduleId, prerequisites, difficulty, learning, practice]) => ({ id, moduleId, prerequisites, difficulty, learning, practice })) as Definition[];

const moduleDetails = {
  foundations: { name: "Foundations and Patterns", description: "Analyse solutions and build array, string, and search patterns." },
  linear: { name: "Linear Structures and Search", description: "Work with pointers, stacks, queues, and recursive decision making." },
  advanced: { name: "Trees, Graphs, and Optimisation", description: "Use non-linear structures and advanced problem-solving techniques." },
} as const;
const topicById = new Map(topics.map((topic) => [topic.id, topic]));
const levelMultiplier = { Beginner: 1, Basic: 0.85, Intermediate: 0.7, Advanced: 0.6 } as const;

const dayStart = (value: string) => {
  const result = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(result.getTime())) throw new Error(`Invalid date: ${value}`);
  return result;
};
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const daysInclusive = (start: Date, end: Date) => Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

function matchesPreference(type: string, preference: LearningPreference) {
  if (preference === "Mixed") return true;
  if (preference === "Video" || preference === "Video-first") return ["YouTube playlist", "Video", "Course"].includes(type);
  if (preference === "Reading") return ["Article", "Documentation"].includes(type);
  return ["Problem sheet", "Practice platform", "Course"].includes(type);
}

function resourcesFor(topicId: TopicId, input: RoadmapInput): RoadmapResource[] {
  const selected = (input.selectedResources ?? []).map((resource) => ({ ...resource, recommendedFor: input.learningPreference }));
  const matching = seededResources.filter((resource) => resource.topicIds.includes(topicId) && matchesPreference(resource.type, input.learningPreference));
  const fallbackType = input.learningPreference === "Reading" ? "Article" : input.learningPreference === "Practice" || input.learningPreference === "Project-based" ? "Practice platform" : "Video";
  const fallback: RoadmapResource = { id: `seeded-${topicId}-${fallbackType.toLowerCase().replaceAll(" ", "-")}`, title: `${topicById.get(topicId)?.name ?? topicId} seeded guide`, type: fallbackType, url: `https://example.org/seeded/${topicId}`, recommendedFor: input.learningPreference };
  return [...selected, ...matching.map((resource) => ({ ...resource, recommendedFor: input.learningPreference })), ...(matching.length ? [] : [fallback])].slice(0, 3);
}

function buildTopic(definition: Definition, index: number, input: RoadmapInput): RoadmapTopic {
  const base = topicById.get(definition.id);
  const multiplier = levelMultiplier[input.skillLevel];
  const learning = Math.max(30, Math.round(definition.learning * multiplier));
  const practice = Math.max(45, Math.round(definition.practice * multiplier));
  const problemCount = Math.max(1, Math.ceil(practice / 30));
  const problemDifficulty: ProblemDifficulty = definition.difficulty === "Beginner" ? "Easy" : definition.difficulty === "Intermediate" ? "Medium" : "Hard";
  return {
    id: definition.id, name: base?.name ?? definition.id, description: base?.description ?? "Build a reliable problem-solving pattern.", prerequisites: definition.prerequisites, difficulty: definition.difficulty,
    estimatedLearningTime: learning, estimatedPracticeTime: practice, resources: resourcesFor(definition.id, input),
    problems: Array.from({ length: problemCount }, (_, index) => ({ id: `${definition.id}-problem-${index + 1}`, title: `${base?.name ?? definition.id} pattern ${index + 1}`, description: index ? "Solve a variation and record the invariant." : "Implement the core pattern and explain its complexity.", difficulty: problemDifficulty, estimatedMinutes: Math.ceil(practice / problemCount) })),
    assessment: { title: `${base?.name ?? definition.id} checkpoint`, description: "Check the invariant, edge cases, and complexity analysis.", estimatedMinutes: 15, passingScore: 70 },
    status: (index === 0 ? "up-next" : "locked") as TopicStatus,
  };
}

function workFor(topic: RoadmapTopic, moduleId: string): Omit<DailyTask, "date">[] {
  const chunks = Math.max(1, Math.ceil(topic.estimatedLearningTime / 30));
  const learnMinutes = Math.ceil(topic.estimatedLearningTime / chunks);
  const learn = Array.from({ length: chunks }, (_, index) => ({ id: `${topic.id}-learn-${index + 1}`, topicId: topic.id, moduleId, title: `${topic.name} — learn${chunks > 1 ? ` (part ${index + 1})` : ""}`, kind: "learn" as const, minutes: learnMinutes, completed: false, resourceIds: topic.resources.map((resource) => resource.id) }));
  const practice = topic.problems.map((problem) => ({ id: problem.id, topicId: topic.id, moduleId, title: `Practice: ${problem.title}`, kind: "practice" as const, minutes: problem.estimatedMinutes, completed: false, resourceIds: [] }));
  return [...learn, ...practice, { id: `${topic.id}-review`, topicId: topic.id, moduleId, title: `${topic.name} — review mistakes`, kind: "review" as const, minutes: 10, completed: false, resourceIds: [] }, { id: `${topic.id}-assessment`, topicId: topic.id, moduleId, title: topic.assessment.title, kind: "assessment" as const, minutes: topic.assessment.estimatedMinutes, completed: false, resourceIds: [] }];
}

function schedule(work: Omit<DailyTask, "date">[], start: Date, deadline: Date, dailyTime: number): DailyTask[] {
  const result: DailyTask[] = [];
  let index = 0;
  for (let offset = 0; offset < daysInclusive(start, deadline) && index < work.length; offset += 1) {
    const date = new Date(start); date.setUTCDate(start.getUTCDate() + offset);
    let remaining = dailyTime;
    while (index < work.length && work[index].minutes <= remaining) { result.push({ ...work[index], date: dateKey(date) }); remaining -= work[index].minutes; index += 1; }
  }
  return result;
}

function weekly(tasks: DailyTask[], start: Date) {
  const grouped = new Map<number, DailyTask[]>();
  for (const task of tasks) { const week = Math.floor((dayStart(task.date).getTime() - start.getTime()) / 604_800_000) + 1; grouped.set(week, [...(grouped.get(week) ?? []), task]); }
  return [...grouped.entries()].map(([week, weekTasks]) => { const weekStart = new Date(start); weekStart.setUTCDate(start.getUTCDate() + (week - 1) * 7); const weekEnd = new Date(weekStart); weekEnd.setUTCDate(weekStart.getUTCDate() + 6); return { week, startDate: dateKey(weekStart), endDate: dateKey(weekEnd), totalMinutes: weekTasks.reduce((sum, task) => sum + task.minutes, 0), tasks: weekTasks, focus: weekTasks[0].title.split(" — ")[0] }; });
}

/** Deterministic, prerequisite-ordered roadmap generation. No AI or external API is used. */
export function generateRoadmap(input: RoadmapInput): Roadmap {
  if (!Number.isFinite(input.dailyTime) || input.dailyTime < 30) throw new Error("dailyTime must be at least 30 minutes");
  const start = dayStart(input.startDate ?? new Date().toISOString());
  const deadline = dayStart(input.deadline);
  if (deadline < start) throw new Error("deadline must be on or after the start date");
  const roadmapTopics = definitions.map((definition, index) => buildTopic(definition, index, input));
  const modules: RoadmapModule[] = Object.entries(moduleDetails).map(([id, details]) => ({ id, ...details, topics: roadmapTopics.filter((topic) => definitions.find((definition) => definition.id === topic.id)?.moduleId === id) }));
  const dailyTasks = schedule(modules.flatMap((module) => module.topics.flatMap((topic) => workFor(topic, module.id))), start, deadline, input.dailyTime);
  const today = dailyTasks.filter((task) => task.date === dateKey(start));
  return { subject: input.subject, language: input.language, goal: input.goal, generatedAt: start.toISOString(), dailyTime: input.dailyTime, deadline: dateKey(deadline), modules, weeklySchedule: weekly(dailyTasks, start), dailyTasks, today: { date: dateKey(start), tasks: today, message: today.length ? `Today: ${today.map((task) => task.title).join(" · ")}` : dailyTasks[0] ? `Next up: ${dailyTasks[0].title}` : "Your available study time is below the first planned task." } };
}

/** Compatibility helper for the existing learning-session UI. */
export function currentTopicId(tasks: LearningTask[]): TopicId {
  return tasks.find((task) => !task.completed)?.topicId ?? "dynamic-programming";
}
