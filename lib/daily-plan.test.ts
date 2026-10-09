import { describe, expect, it } from "vitest";
import { adaptPlanTopics, buildTodayPlan, type PlanTopic } from "./daily-plan";
import { calculateMastery, type MasteryResult, type TopicPerformance } from "./mastery-engine";

const topic = (overrides: Partial<PlanTopic> = {}): PlanTopic => ({
  id: "arrays", title: "Arrays", moduleTitle: "Foundations", estimatedLearningMinutes: 60, estimatedPracticeMinutes: 60,
  problems: [{ id: "p1", title: "Pair Sum", difficulty: "EASY", estimatedMinutes: 30 }],
  assessment: { id: "a1", title: "Arrays check-in", estimatedMinutes: 10 },
  completed: false,
  ...overrides,
});

describe("buildTodayPlan", () => {
  it("orders a topic's work as learn, then practice, then review, then assessment", () => {
    const plan = buildTodayPlan([topic()], 240);
    expect(plan.map((task) => task.kind)).toEqual(["LEARN", "LEARN", "PRACTICE", "REVIEW", "ASSESSMENT"]);
  });

  it("packs a denser plan when more daily time is available", () => {
    const topics = [topic({ id: "arrays" }), topic({ id: "strings", title: "Strings" })];
    const light = buildTodayPlan(topics, 30);
    const dense = buildTodayPlan(topics, 240);
    expect(dense.length).toBeGreaterThan(light.length);
    expect(dense.reduce((sum, task) => sum + task.minutes, 0)).toBeGreaterThan(light.reduce((sum, task) => sum + task.minutes, 0));
  });

  it("never exceeds the daily budget", () => {
    const plan = buildTodayPlan([topic({ estimatedLearningMinutes: 60 })], 45);
    const total = plan.reduce((sum, task) => sum + task.minutes, 0);
    expect(total).toBeLessThanOrEqual(45);
  });

  it("enforces a minimum daily budget so a very small dailyTime still yields a task", () => {
    const plan = buildTodayPlan([topic()], 5);
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.reduce((sum, task) => sum + task.minutes, 0)).toBeLessThanOrEqual(30);
  });

  it("skips completed topics and starts at the first incomplete one", () => {
    const topics = [topic({ id: "arrays", completed: true }), topic({ id: "strings", title: "Strings", completed: false })];
    const plan = buildTodayPlan(topics, 240, 0);
    expect(plan.every((task) => task.topicId === "strings")).toBe(true);
  });

  it("spills into the next topic once the current one's work is exhausted", () => {
    const topics = [topic({ id: "arrays", estimatedLearningMinutes: 10, estimatedPracticeMinutes: 0, problems: [], assessment: null }), topic({ id: "strings", title: "Strings" })];
    const plan = buildTodayPlan(topics, 240);
    expect(new Set(plan.map((task) => task.topicId))).toEqual(new Set(["arrays", "strings"]));
  });
});

const performance = (overrides: Partial<TopicPerformance> = {}): TopicPerformance => ({
  topicId: "arrays", topicName: "Arrays", learningCompleted: true, practiceCompleted: true,
  assessmentScore: 90, attemptCount: 10, mistakeCount: 0, timeSpent: 60, confidence: null,
  ...overrides,
});
const mastery = (overrides: Partial<TopicPerformance> = {}): MasteryResult => calculateMastery(performance(overrides));

describe("roadmap adaptation", () => {
  it("replaces the generic learn-first flow with review, practice, and a retake once a topic needs revision", () => {
    const result = mastery({ assessmentScore: 40, attemptCount: 5, mistakeCount: 3 });
    expect(result.band).toBe("revision");
    const [adapted] = adaptPlanTopics([topic()], new Map([["arrays", result]]));
    const plan = buildTodayPlan([adapted], 240);
    expect(plan.map((task) => task.kind)).toEqual(["REVIEW", "PRACTICE", "PRACTICE", "PRACTICE", "ASSESSMENT"]);
    expect(plan[0].title).toContain("Needs revision before moving on");
    expect(plan[0].description).toContain("Retake the assessment");
    expect(plan.at(-1)?.title).toMatch(/^Retake:/);
  });

  it("recommends a lighter top-up (fewer practice tasks) for the 60–80% practice band than for revision", () => {
    const practiceBand = mastery({ assessmentScore: 70, attemptCount: 10, mistakeCount: 2, confidence: 60 });
    expect(practiceBand.band).toBe("practice");
    const [adapted] = adaptPlanTopics([topic({ problems: [
      { id: "p1", title: "Problem 1", difficulty: "EASY", estimatedMinutes: 20 },
      { id: "p2", title: "Problem 2", difficulty: "EASY", estimatedMinutes: 20 },
      { id: "p3", title: "Problem 3", difficulty: "EASY", estimatedMinutes: 20 },
    ] })], new Map([["arrays", practiceBand]]));
    const plan = buildTodayPlan([adapted], 240);
    expect(plan.filter((task) => task.kind === "PRACTICE")).toHaveLength(2);
  });

  it("leaves the generic learn-first flow untouched for a topic that has never been attempted", () => {
    const [adapted] = adaptPlanTopics([topic()], new Map());
    const plan = buildTodayPlan([adapted], 240);
    expect(plan.map((task) => task.kind)).toEqual(["LEARN", "LEARN", "PRACTICE", "REVIEW", "ASSESSMENT"]);
  });

  it("never marks a topic completed from a raw flag alone — mastery decides", () => {
    const stillWeak = mastery({ assessmentScore: 30 });
    const trulyMastered = mastery({ assessmentScore: 95, confidence: 90 });
    const [adaptedWeak, adaptedMastered] = adaptPlanTopics(
      [topic({ id: "arrays", completed: true }), topic({ id: "strings", title: "Strings", completed: false })],
      new Map([["arrays", stillWeak], ["strings", trulyMastered]]),
    );
    expect(adaptedWeak.completed).toBe(false);
    expect(adaptedMastered.completed).toBe(true);
  });

  it("skips a mastered topic and starts the day on the next one that still needs work", () => {
    const topics = [topic({ id: "arrays", completed: true }), topic({ id: "strings", title: "Strings", completed: false })];
    const adapted = adaptPlanTopics(topics, new Map([["arrays", mastery({ assessmentScore: 95, confidence: 90 })], ["strings", mastery({ topicId: "strings", assessmentScore: 50 })]]));
    const plan = buildTodayPlan(adapted, 240);
    expect(plan.every((task) => task.topicId === "strings")).toBe(true);
    expect(plan[0].kind).toBe("REVIEW");
  });

  it("still spills into the next topic once an adapted (shorter) revision plan is exhausted", () => {
    const topics = [topic({ id: "arrays", problems: [], assessment: null }), topic({ id: "strings", title: "Strings" })];
    const adapted = adaptPlanTopics(topics, new Map([["arrays", mastery({ assessmentScore: 70, attemptCount: 10, mistakeCount: 2, confidence: 60 })]]));
    const plan = buildTodayPlan(adapted, 240);
    expect(new Set(plan.map((task) => task.topicId))).toEqual(new Set(["arrays", "strings"]));
  });
});
