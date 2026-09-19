export type RecommendedProblem = {
  id: string;
  topicId: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  solved: boolean;
  attempts: number;
};

export function targetDifficulty(accuracy?: number | null): RecommendedProblem["difficulty"] {
  if (accuracy === undefined || accuracy === null || accuracy < 60) return "EASY";
  if (accuracy < 80) return "MEDIUM";
  return "HARD";
}

/** Stable ranking: current topic first, then weak areas, unsolved work, and adaptive difficulty. */
export function rankProblems(problems: RecommendedProblem[], currentTopicId: string, weakTopicIds: string[], accuracy?: number | null) {
  const target = targetDifficulty(accuracy);
  return [...problems].sort((a, b) => {
    const score = (problem: RecommendedProblem) =>
      (problem.topicId === currentTopicId ? 100 : 0) +
      (weakTopicIds.includes(problem.topicId) ? 40 : 0) +
      (!problem.solved ? 20 : 0) +
      (problem.difficulty === target ? 15 : 0) -
      problem.attempts;
    return score(b) - score(a) || a.id.localeCompare(b.id);
  });
}
