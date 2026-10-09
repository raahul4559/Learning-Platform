export type PlanTaskKind = "LEARN" | "PRACTICE" | "REVIEW" | "ASSESSMENT";

export type PlanProblem = { id: string; title: string; difficulty: string; estimatedMinutes: number };
export type PlanAssessment = { id: string; title: string; estimatedMinutes: number };
export type PlanTopic = {
  id: string;
  title: string;
  moduleTitle: string;
  estimatedLearningMinutes: number;
  estimatedPracticeMinutes: number;
  problems: PlanProblem[];
  assessment: PlanAssessment | null;
  completed: boolean;
};
export type DraftTask = {
  topicId: string;
  moduleTitle: string;
  topicTitle: string;
  kind: PlanTaskKind;
  title: string;
  description: string;
  minutes: number;
  problemId?: string;
  assessmentId?: string;
};

function tasksForTopic(topic: PlanTopic): DraftTask[] {
  const learnChunks = Math.max(1, Math.ceil(topic.estimatedLearningMinutes / 30));
  const learnMinutes = Math.max(10, Math.ceil(topic.estimatedLearningMinutes / learnChunks));
  const learn: DraftTask[] = Array.from({ length: learnChunks }, (_, index) => ({
    topicId: topic.id, moduleTitle: topic.moduleTitle, topicTitle: topic.title, kind: "LEARN",
    title: topic.title, description: learnChunks > 1 ? `Learn ${topic.title} — part ${index + 1} of ${learnChunks}.` : `Learn the core ${topic.title} pattern.`,
    minutes: learnMinutes,
  }));

  const practiceSource: PlanProblem[] = topic.problems.length
    ? topic.problems
    : [{ id: "", title: `${topic.title} practice set`, difficulty: "MEDIUM", estimatedMinutes: Math.max(20, topic.estimatedPracticeMinutes) }];
  const practice: DraftTask[] = practiceSource.map((problem) => ({
    topicId: topic.id, moduleTitle: topic.moduleTitle, topicTitle: topic.title, kind: "PRACTICE",
    title: `Solve: ${problem.title}`, description: `${problem.difficulty} practice for ${topic.title}.`,
    minutes: Math.max(10, problem.estimatedMinutes), problemId: problem.id || undefined,
  }));

  const review: DraftTask[] = [{
    topicId: topic.id, moduleTitle: topic.moduleTitle, topicTitle: topic.title, kind: "REVIEW",
    title: `${topic.title} review`, description: "Review previous mistakes and misunderstood edge cases.", minutes: 15,
  }];

  const assessment: DraftTask[] = topic.assessment ? [{
    topicId: topic.id, moduleTitle: topic.moduleTitle, topicTitle: topic.title, kind: "ASSESSMENT",
    title: topic.assessment.title, description: `Checkpoint quiz for ${topic.title}.`,
    minutes: Math.max(5, topic.assessment.estimatedMinutes), assessmentId: topic.assessment.id,
  }] : [];

  return [...learn, ...practice, ...review, ...assessment];
}

/**
 * Deterministic daily-plan builder: fills today's budget starting at the learner's
 * current (first incomplete) topic, spilling into later topics only if time remains —
 * denser daily time produces a longer, not just a stretched-out, plan.
 */
export function buildTodayPlan(topics: PlanTopic[], dailyMinutes: number, startIndex = 0): DraftTask[] {
  const budget = Math.max(30, Math.round(dailyMinutes));
  const queue: DraftTask[] = [];
  for (let index = Math.max(0, startIndex); index < topics.length; index += 1) {
    if (topics[index].completed) continue;
    queue.push(...tasksForTopic(topics[index]));
  }

  const plan: DraftTask[] = [];
  let remaining = budget;
  for (const task of queue) {
    if (task.minutes > remaining) {
      if (!plan.length) plan.push({ ...task, minutes: remaining });
      break;
    }
    plan.push(task);
    remaining -= task.minutes;
    if (remaining <= 0) break;
  }
  return plan;
}
