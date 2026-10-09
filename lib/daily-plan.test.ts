import { describe, expect, it } from "vitest";
import { buildTodayPlan, type PlanTopic } from "./daily-plan";

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
