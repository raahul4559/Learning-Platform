import { describe, expect, it } from "vitest";
import { generateRoadmap } from "./roadmap-engine";

const input = (overrides = {}) => ({
  goal: "Placement" as const,
  subject: "DSA" as const,
  language: "Java",
  skillLevel: "Beginner" as const,
  dailyTime: 60,
  deadline: "2026-12-31",
  learningPreference: "Video-first" as const,
  startDate: "2026-12-01",
  ...overrides,
});

describe("roadmap engine", () => {
  it("creates a prerequisite-ordered roadmap with resources, practice, and assessments", () => {
    const roadmap = generateRoadmap(input());
    const allTopics = roadmap.modules.flatMap((module) => module.topics);
    expect(allTopics).toHaveLength(18);
    expect(allTopics[0]).toMatchObject({ id: "complexity", status: "up-next", prerequisites: [] });
    expect(allTopics.find((topic) => topic.id === "sliding-window")?.prerequisites).toEqual(["two-pointers", "hashing"]);
    expect(allTopics.every((topic) => topic.resources.length > 0 && topic.problems.length > 0 && topic.assessment.passingScore === 70)).toBe(true);
  });

  it("uses learning preference and selected resources deterministically", () => {
    const roadmap = generateRoadmap(input({ learningPreference: "Reading", selectedResources: [{ id: "chosen", type: "Custom", title: "My notes", url: "https://example.test/notes" }] }));
    const arrays = roadmap.modules.flatMap((module) => module.topics).find((topic) => topic.id === "arrays");
    expect(arrays?.resources[0]).toMatchObject({ id: "chosen", title: "My notes" });
    expect(arrays?.resources.some((resource) => resource.type === "Problem sheet")).toBe(false);
  });

  it("makes a denser schedule when daily study time increases", () => {
    const light = generateRoadmap(input({ dailyTime: 60 }));
    const dense = generateRoadmap(input({ dailyTime: 180 }));
    expect(light.today.tasks.reduce((sum, task) => sum + task.minutes, 0)).toBeLessThanOrEqual(60);
    expect(dense.today.tasks.reduce((sum, task) => sum + task.minutes, 0)).toBeLessThanOrEqual(180);
    expect(dense.today.tasks.length).toBeGreaterThan(light.today.tasks.length);
    expect(dense.dailyTasks.length).toBeGreaterThan(light.dailyTasks.length);
  });

  it("adapts estimates by skill level and does not schedule beyond the deadline", () => {
    const beginner = generateRoadmap(input({ skillLevel: "Beginner" }));
    const advanced = generateRoadmap(input({ skillLevel: "Advanced" }));
    const beginnerArrays = beginner.modules.flatMap((module) => module.topics).find((topic) => topic.id === "arrays");
    const advancedArrays = advanced.modules.flatMap((module) => module.topics).find((topic) => topic.id === "arrays");
    expect(advancedArrays?.estimatedLearningTime).toBeLessThan(beginnerArrays?.estimatedLearningTime ?? Infinity);
    expect(beginner.dailyTasks.every((task) => task.date >= "2026-12-01" && task.date <= "2026-12-31")).toBe(true);
  });

  it("rejects impossible date ranges and insufficient daily time", () => {
    expect(() => generateRoadmap(input({ dailyTime: 29 }))).toThrow("dailyTime");
    expect(() => generateRoadmap(input({ deadline: "2026-11-30" }))).toThrow("deadline");
  });

  it("orders every topic strictly after all of its prerequisites", () => {
    const roadmap = generateRoadmap(input());
    const allTopics = roadmap.modules.flatMap((module) => module.topics);
    const indexById = new Map(allTopics.map((topic, index) => [topic.id, index]));
    for (const topic of allTopics) {
      for (const prerequisite of topic.prerequisites) {
        expect(indexById.get(prerequisite)).toBeLessThan(indexById.get(topic.id)!);
      }
    }
  });

  it("schedules a prerequisite's tasks on or before the dependent topic's tasks", () => {
    const roadmap = generateRoadmap(input());
    const firstDateByTopic = new Map<string, string>();
    for (const task of roadmap.dailyTasks) {
      if (!firstDateByTopic.has(task.topicId)) firstDateByTopic.set(task.topicId, task.date);
    }
    const slidingWindow = roadmap.modules.flatMap((module) => module.topics).find((topic) => topic.id === "sliding-window")!;
    for (const prerequisite of slidingWindow.prerequisites) {
      expect(firstDateByTopic.get(prerequisite)! <= firstDateByTopic.get("sliding-window")!).toBe(true);
    }
  });

  it("answers 'what should I study today' rather than only the full roadmap", () => {
    const roadmap = generateRoadmap(input());
    expect(roadmap.today.date).toBe("2026-12-01");
    expect(roadmap.today.tasks.length).toBeGreaterThan(0);
    expect(roadmap.today.tasks.every((task) => task.date === roadmap.today.date)).toBe(true);
    expect(roadmap.today.message).toContain("Today:");
  });

  it("is a pure function of its input with no AI or randomness involved", () => {
    const first = generateRoadmap(input());
    const second = generateRoadmap(input());
    expect(first).toEqual(second);
  });
});
