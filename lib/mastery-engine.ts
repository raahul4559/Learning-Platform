export type MasteryBand = "revision" | "practice" | "progression";

export type TopicPerformance = {
  topicId: string;
  topicName?: string;
  learningCompleted: boolean;
  practiceCompleted: boolean;
  assessmentScore: number | null;
  attemptCount: number;
  mistakeCount: number;
  timeSpent: number;
  confidence: number | null;
};

export type MasteryReason = { label: string; detail?: string };
export type MasteryRecommendation = { summary: string; actions: string[] };
export type MasteryResult = {
  topicId: string;
  mastery: number;
  band: MasteryBand;
  practiceAccuracy: number | null;
  reasons: MasteryReason[];
  recommendation: MasteryRecommendation;
};

export type MasteryRules = {
  weights: { assessment: number; practice: number; confidence: number };
  mistakePenalty: { freeAllowance: number; perMistake: number; max: number };
  learningGate: { enforced: boolean; capWithoutLearning: number };
  thresholds: { revisionBelow: number; practiceBelow: number };
  recommendedProblemCount: { revision: number; practice: number };
};

/** The three bands map directly to the product's stated rule: <60 revision, 60–80 practice, 80+ progression. */
export const defaultMasteryRules: MasteryRules = {
  weights: { assessment: 0.5, practice: 0.35, confidence: 0.15 },
  mistakePenalty: { freeAllowance: 2, perMistake: 4, max: 20 },
  learningGate: { enforced: true, capWithoutLearning: 40 },
  thresholds: { revisionBelow: 60, practiceBelow: 80 },
  recommendedProblemCount: { revision: 3, practice: 2 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function derivePracticeAccuracy(attemptCount: number, mistakeCount: number): number | null {
  if (attemptCount <= 0) return null;
  return clamp(Math.round(((attemptCount - mistakeCount) / attemptCount) * 100), 0, 100);
}

function recommendationFor(band: MasteryBand, input: TopicPerformance, rules: MasteryRules): MasteryRecommendation {
  const label = input.topicName ?? "this topic";
  if (band === "revision") {
    return { summary: "Needs revision before moving on", actions: [`Review ${label} basics`, `Solve ${rules.recommendedProblemCount.revision} easy problems`, "Retake the assessment"] };
  }
  if (band === "practice") {
    return { summary: "Needs more practice before progressing", actions: [`Solve ${rules.recommendedProblemCount.practice} more ${label} problems`, "Review mistakes from recent attempts"] };
  }
  return { summary: `Ready to progress past ${label}`, actions: ["Move on to the next topic in your roadmap"] };
}

/**
 * Explainable mastery score: a weighted blend of assessment score, derived practice accuracy, and
 * optional self-rated confidence (weights renormalize over whatever signals are actually present),
 * then a penalty for mistakes beyond a "normal learning curve" allowance, then a hard cap while the
 * learn step itself is incomplete. Every contributing (or missing) signal is surfaced in `reasons`
 * so the score is never a black box, and every knob lives in `rules` so the thresholds in the product
 * spec — and the weighting behind them — stay configurable rather than hardcoded.
 */
export function calculateMastery(input: TopicPerformance, rules: MasteryRules = defaultMasteryRules): MasteryResult {
  const practiceAccuracy = derivePracticeAccuracy(input.attemptCount, input.mistakeCount);
  const reasons: MasteryReason[] = [];
  const components: { value: number; weight: number }[] = [];

  if (input.assessmentScore != null) {
    components.push({ value: clamp(input.assessmentScore, 0, 100), weight: rules.weights.assessment });
    reasons.push({ label: `Assessment: ${Math.round(input.assessmentScore)}%` });
  } else {
    reasons.push({ label: "Assessment: not yet attempted" });
  }

  if (practiceAccuracy != null) {
    components.push({ value: practiceAccuracy, weight: rules.weights.practice });
    reasons.push({ label: `Practice accuracy: ${practiceAccuracy}%`, detail: `${input.attemptCount} attempt(s) recorded` });
  } else {
    reasons.push({ label: "Practice accuracy: no attempts recorded yet" });
  }

  if (input.confidence != null) {
    components.push({ value: clamp(input.confidence, 0, 100), weight: rules.weights.confidence });
    reasons.push({ label: `Self-rated confidence: ${input.confidence}%` });
  }

  let mastery = 0;
  if (components.length) {
    const totalWeight = components.reduce((sum, component) => sum + component.weight, 0);
    mastery = components.reduce((sum, component) => sum + component.value * component.weight, 0) / totalWeight;
  } else {
    reasons.push({ label: "No signal recorded yet", detail: "Treated as not started" });
  }

  const extraMistakes = Math.max(0, input.mistakeCount - rules.mistakePenalty.freeAllowance);
  if (extraMistakes > 0) {
    const penalty = Math.min(rules.mistakePenalty.max, extraMistakes * rules.mistakePenalty.perMistake);
    mastery -= penalty;
    reasons.push({ label: `Repeated mistakes: ${input.mistakeCount}`, detail: `-${penalty} mastery points for ${extraMistakes} mistake(s) beyond the expected learning curve` });
  } else if (input.mistakeCount > 0) {
    reasons.push({ label: `Mistakes: ${input.mistakeCount}`, detail: "Within the normal learning curve — no mastery penalty applied" });
  }

  if (rules.learningGate.enforced && !input.learningCompleted && mastery > rules.learningGate.capWithoutLearning) {
    mastery = rules.learningGate.capWithoutLearning;
    reasons.push({ label: "Learning step not yet marked complete", detail: `Mastery capped at ${rules.learningGate.capWithoutLearning}% until the learn step is finished` });
  }

  mastery = clamp(Math.round(mastery), 0, 100);
  const band: MasteryBand = mastery < rules.thresholds.revisionBelow ? "revision" : mastery < rules.thresholds.practiceBelow ? "practice" : "progression";
  return { topicId: input.topicId, mastery, band, practiceAccuracy, reasons, recommendation: recommendationFor(band, input, rules) };
}

/** Topics that are not yet ready to progress, weakest first — the same signal the dashboard surfaces as "weak topics". */
export function detectWeakTopics(performances: TopicPerformance[], rules: MasteryRules = defaultMasteryRules, limit = 3): MasteryResult[] {
  return performances
    .map((performance) => calculateMastery(performance, rules))
    .filter((result) => result.band !== "progression")
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, limit);
}

export function canProgress(result: MasteryResult): boolean {
  return result.band === "progression";
}

export type TopicPrerequisiteCheck = { topicId: string; prerequisites: string[] };
export type ProgressionEvaluation = { topicId: string; canProgress: boolean; blockedBy: string[] };

/** Progression is gated on the topic's own mastery AND every prerequisite's mastery — never on a raw "completed" flag. */
export function evaluateProgression(topic: TopicPrerequisiteCheck, resultsByTopicId: Map<string, MasteryResult>): ProgressionEvaluation {
  const own = resultsByTopicId.get(topic.topicId);
  const ownBlocked = !own || own.band !== "progression";
  const blockedPrerequisites = topic.prerequisites.filter((prerequisiteId) => resultsByTopicId.get(prerequisiteId)?.band !== "progression");
  return { topicId: topic.topicId, canProgress: !ownBlocked && blockedPrerequisites.length === 0, blockedBy: [...(ownBlocked ? [topic.topicId] : []), ...blockedPrerequisites] };
}
