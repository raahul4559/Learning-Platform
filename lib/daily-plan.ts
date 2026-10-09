import type { MasteryBand, MasteryRecommendation, MasteryResult } from "@/lib/mastery-engine";

export type PlanTaskKind = "LEARN" | "PRACTICE" | "REVIEW" | "ASSESSMENT";

export type PlanProblem = { id: string; title: string; difficulty: string; estimatedMinutes: number };
export type PlanAssessment = { id: string; title: string; estimatedMinutes: number };
export type PlanTopicMastery = { band: MasteryBand; recommendation: MasteryRecommendation };
export type PlanTopic = {
  id: string;
  title: string;
  moduleTitle: string;
  estimatedLearningMinutes: number;
  estimatedPracticeMinutes: number;
  problems: PlanProblem[];
  assessment: PlanAssessment | null;
  completed: boolean;
  /** Set once a mastery check-in exists for this topic; absent for a topic never attempted yet. */
  mastery?: PlanTopicMastery | null;
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

/**
 * When a topic's mastery check-in says it isn't ready to progress, the generic learn-first
 * flow is replaced with the mastery engine's own recommendation — review, then exactly the
 * practice it called for, then a retake — instead of marching the learner on to new material.
 */
function adaptiveTasksForTopic(topic: PlanTopic, mastery: PlanTopicMastery): DraftTask[] {
  const review: DraftTask = {
    topicId: topic.id, moduleTitle: topic.moduleTitle, topicTitle: topic.title, kind: "REVIEW",
    title: `${topic.title} — ${mastery.recommendation.summary}`, description: mastery.recommendation.actions.join(" · "), minutes: 15,
  };

  const practiceCount = mastery.band === "revision" ? 3 : 2;
  const difficulty = mastery.band === "revision" ? "EASY" : "MEDIUM";
  const perItemMinutes = Math.max(15, Math.round(topic.estimatedPracticeMinutes / practiceCount));
  const real = topic.problems.slice(0, practiceCount);
  // Pad with generic practice slots when the real catalog has fewer problems than the engine recommends,
  // so a thin catalog never silently waters down the recommended problem count.
  const practiceSource: PlanProblem[] = [
    ...real,
    ...Array.from({ length: Math.max(0, practiceCount - real.length) }, (_, index) => ({ id: "", title: `${topic.title} practice set ${real.length + index + 1}`, difficulty, estimatedMinutes: perItemMinutes })),
  ];
  const practice: DraftTask[] = practiceSource.map((problem) => ({
    topicId: topic.id, moduleTitle: topic.moduleTitle, topicTitle: topic.title, kind: "PRACTICE",
    title: `Solve: ${problem.title}`, description: `${problem.difficulty} practice for ${topic.title} — recommended by your mastery check-in.`,
    minutes: Math.max(10, problem.estimatedMinutes), problemId: problem.id || undefined,
  }));

  const assessment: DraftTask[] = topic.assessment ? [{
    topicId: topic.id, moduleTitle: topic.moduleTitle, topicTitle: topic.title, kind: "ASSESSMENT",
    title: `Retake: ${topic.assessment.title}`, description: `Retake the checkpoint once you've reviewed and practiced ${topic.title} again.`,
    minutes: Math.max(5, topic.assessment.estimatedMinutes), assessmentId: topic.assessment.id,
  }] : [];

  return [review, ...practice, ...assessment];
}

function tasksForTopic(topic: PlanTopic): DraftTask[] {
  if (topic.mastery && topic.mastery.band !== "progression") return adaptiveTasksForTopic(topic, topic.mastery);

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

/**
 * Applies mastery check-ins to a topic list before planning: a topic is only ever treated as
 * "completed" (and so skipped when picking today's work) once its mastery has actually reached
 * the progression band — never from a raw status flag — and every other topic's task list is
 * swapped for the engine's own revision/practice recommendation. This is the hook that lets
 * performance change tomorrow's plan, not just today's status label.
 */
export function adaptPlanTopics(topics: PlanTopic[], resultsByTopicId: Map<string, MasteryResult>): PlanTopic[] {
  return topics.map((topic) => {
    const result = resultsByTopicId.get(topic.id);
    if (!result) return { ...topic, mastery: null };
    return { ...topic, completed: result.band === "progression", mastery: { band: result.band, recommendation: result.recommendation } };
  });
}
