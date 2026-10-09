import { describe, expect, it } from "vitest";
import {
  calculateMastery, canProgress, defaultMasteryRules, derivePracticeAccuracy, detectWeakTopics, evaluateProgression,
  type MasteryResult, type MasteryRules, type TopicPerformance,
} from "./mastery-engine";

const performance = (overrides: Partial<TopicPerformance> = {}): TopicPerformance => ({
  topicId: "recursion", topicName: "Recursion", learningCompleted: true, practiceCompleted: true,
  assessmentScore: 90, attemptCount: 10, mistakeCount: 0, timeSpent: 60, confidence: null,
  ...overrides,
});

describe("derivePracticeAccuracy", () => {
  it("is null with no recorded attempts", () => { expect(derivePracticeAccuracy(0, 0)).toBeNull(); });
  it("is the share of attempts without a mistake", () => { expect(derivePracticeAccuracy(11, 5)).toBe(55); });
  it("never reports accuracy below zero even if mistakes exceed attempts", () => { expect(derivePracticeAccuracy(2, 5)).toBe(0); });
});

describe("mastery calculation", () => {
  it("matches the documented example shape: an explainable revision recommendation for a struggling topic", () => {
    const result = calculateMastery(performance({ assessmentScore: 60, attemptCount: 11, mistakeCount: 5, confidence: null }));
    // (60*0.5 + 55*0.35) / 0.85 = 57.94 → round 58, then -12 for 3 mistakes beyond the free allowance of 2 → 46
    expect(result.mastery).toBe(46);
    expect(result.band).toBe("revision");
    expect(result.practiceAccuracy).toBe(55);
    expect(result.reasons).toEqual([
      { label: "Assessment: 60%" },
      { label: "Practice accuracy: 55%", detail: "11 attempt(s) recorded" },
      { label: "Repeated mistakes: 5", detail: "-12 mastery points for 3 mistake(s) beyond the expected learning curve" },
    ]);
    expect(result.recommendation).toEqual({
      summary: "Needs revision before moving on",
      actions: ["Review Recursion basics", "Solve 3 easy problems", "Retake the assessment"],
    });
  });

  it("recommends additional practice in the 60–80 band", () => {
    const result = calculateMastery(performance({ assessmentScore: 70, attemptCount: 10, mistakeCount: 2, confidence: 60 }));
    expect(result.band).toBe("practice");
    expect(result.mastery).toBeGreaterThanOrEqual(60);
    expect(result.mastery).toBeLessThan(80);
    expect(result.recommendation.summary).toMatch(/more practice/i);
  });

  it("allows progression at 80% and above", () => {
    const result = calculateMastery(performance({ assessmentScore: 95, attemptCount: 10, mistakeCount: 0, confidence: 90 }));
    expect(result.band).toBe("progression");
    expect(result.mastery).toBeGreaterThanOrEqual(80);
    expect(result.recommendation.summary).toMatch(/ready to progress/i);
  });

  it("treats a handful of mistakes as part of the normal learning curve with no mastery penalty", () => {
    const result = calculateMastery(performance({ assessmentScore: 90, attemptCount: 10, mistakeCount: 2, confidence: null }));
    // (90*0.5 + 80*0.35) / 0.85 = 85.88 → round 86, with no penalty subtracted since 2 mistakes is within the free allowance
    expect(result.mastery).toBe(86);
    expect(result.reasons).toContainEqual({ label: "Mistakes: 2", detail: "Within the normal learning curve — no mastery penalty applied" });
    expect(result.reasons.some((reason) => reason.label.startsWith("Repeated mistakes"))).toBe(false);
  });

  it("caps mastery while the learning step itself is incomplete, regardless of assessment score", () => {
    const result = calculateMastery(performance({ assessmentScore: 100, attemptCount: 10, mistakeCount: 0, learningCompleted: false }));
    expect(result.mastery).toBe(defaultMasteryRules.learningGate.capWithoutLearning);
    expect(result.band).toBe("revision");
    expect(result.reasons.some((reason) => reason.label.includes("Learning step not yet marked complete"))).toBe(true);
  });

  it("starts at zero mastery with no assessment, practice, or confidence signal at all", () => {
    const result = calculateMastery(performance({ assessmentScore: null, attemptCount: 0, mistakeCount: 0, confidence: null, learningCompleted: false }));
    expect(result.mastery).toBe(0);
    expect(result.band).toBe("revision");
    expect(result.practiceAccuracy).toBeNull();
    expect(result.reasons).toEqual(expect.arrayContaining([{ label: "Assessment: not yet attempted" }, { label: "Practice accuracy: no attempts recorded yet" }]));
  });

  it("falls back to a generic topic label when no topicName is supplied", () => {
    const result = calculateMastery({ topicId: "x", learningCompleted: true, practiceCompleted: true, assessmentScore: 30, attemptCount: 0, mistakeCount: 0, timeSpent: 10, confidence: null });
    expect(result.recommendation.actions[0]).toBe("Review this topic basics");
  });

  it("is configurable: tightening the progression threshold changes the band for the same inputs", () => {
    const stricter: MasteryRules = { ...defaultMasteryRules, thresholds: { ...defaultMasteryRules.thresholds, practiceBelow: 95 } };
    const input = performance({ assessmentScore: 85, attemptCount: 10, mistakeCount: 0, confidence: 85 });
    expect(calculateMastery(input).band).toBe("progression");
    expect(calculateMastery(input, stricter).band).toBe("practice");
  });

  it("is configurable: weighting assessment more heavily shifts the score toward the assessment signal", () => {
    const assessmentHeavy: MasteryRules = { ...defaultMasteryRules, weights: { assessment: 0.9, practice: 0.1, confidence: 0 } };
    const input = performance({ assessmentScore: 95, attemptCount: 10, mistakeCount: 8, confidence: null });
    const defaultResult = calculateMastery(input);
    const heavyResult = calculateMastery(input, assessmentHeavy);
    expect(heavyResult.mastery).toBeGreaterThan(defaultResult.mastery);
  });
});

describe("weak-topic detection", () => {
  it("returns only topics below the progression band, weakest first", () => {
    const results = detectWeakTopics([
      performance({ topicId: "strong", assessmentScore: 95, mistakeCount: 0 }),
      performance({ topicId: "weakest", assessmentScore: 40, attemptCount: 5, mistakeCount: 3 }),
      performance({ topicId: "middling", assessmentScore: 70, attemptCount: 10, mistakeCount: 1 }),
    ]);
    expect(results.map((result) => result.topicId)).toEqual(["weakest", "middling"]);
  });

  it("respects a configurable limit", () => {
    const performances = ["a", "b", "c", "d"].map((topicId) => performance({ topicId, assessmentScore: 30 }));
    expect(detectWeakTopics(performances, defaultMasteryRules, 2)).toHaveLength(2);
  });

  it("returns an empty list when every topic has already reached progression", () => {
    const results = detectWeakTopics([performance({ assessmentScore: 92 }), performance({ topicId: "other", assessmentScore: 88, confidence: 90 })]);
    expect(results).toEqual([]);
  });
});

describe("progression", () => {
  it("canProgress is true only in the progression band", () => {
    expect(canProgress(calculateMastery(performance({ assessmentScore: 85 })))).toBe(true);
    expect(canProgress(calculateMastery(performance({ assessmentScore: 65, attemptCount: 10, mistakeCount: 1 })))).toBe(false);
    expect(canProgress(calculateMastery(performance({ assessmentScore: 40 })))).toBe(false);
  });

  it("blocks progression when a prerequisite has not reached the progression band, even if the topic itself has", () => {
    const resultsByTopicId = new Map<string, MasteryResult>([
      ["recursion", calculateMastery(performance({ topicId: "recursion", assessmentScore: 90 }))],
      ["backtracking", calculateMastery(performance({ topicId: "backtracking", assessmentScore: 90 }))],
    ]);
    const evaluation = evaluateProgression({ topicId: "backtracking", prerequisites: ["recursion"] }, resultsByTopicId);
    expect(evaluation.canProgress).toBe(true);

    resultsByTopicId.set("recursion", calculateMastery(performance({ topicId: "recursion", assessmentScore: 40 })));
    const blocked = evaluateProgression({ topicId: "backtracking", prerequisites: ["recursion"] }, resultsByTopicId);
    expect(blocked.canProgress).toBe(false);
    expect(blocked.blockedBy).toEqual(["recursion"]);
  });

  it("reports the topic itself as blocking when it has no mastery result yet", () => {
    const evaluation = evaluateProgression({ topicId: "graphs", prerequisites: [] }, new Map());
    expect(evaluation).toEqual({ topicId: "graphs", canProgress: false, blockedBy: ["graphs"] });
  });
});

describe("revision recommendations", () => {
  it("below 60% recommends review, easy practice, and a retake in that order", () => {
    const result = calculateMastery(performance({ assessmentScore: 45, attemptCount: 5, mistakeCount: 2 }));
    expect(result.band).toBe("revision");
    expect(result.recommendation.actions).toEqual(["Review Recursion basics", "Solve 3 easy problems", "Retake the assessment"]);
  });

  it("honors a configurable revision problem count", () => {
    const rules: MasteryRules = { ...defaultMasteryRules, recommendedProblemCount: { ...defaultMasteryRules.recommendedProblemCount, revision: 5 } };
    const result = calculateMastery(performance({ assessmentScore: 45, attemptCount: 0 }), rules);
    expect(result.band).toBe("revision");
    expect(result.recommendation.actions[1]).toBe("Solve 5 easy problems");
  });
});
