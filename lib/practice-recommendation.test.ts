import { describe, expect, it } from "vitest";
import { rankProblems, targetDifficulty } from "./practice-recommendation";

describe("practice recommendations", () => {
  it("selects a difficulty from prior performance", () => {
    expect(targetDifficulty(42)).toBe("EASY");
    expect(targetDifficulty(72)).toBe("MEDIUM");
    expect(targetDifficulty(91)).toBe("HARD");
  });

  it("prioritizes unsolved current-topic problems before lower-priority history", () => {
    const ranked = rankProblems([
      { id: "weak", topicId: "hashing", difficulty: "EASY", solved: false, attempts: 0 },
      { id: "current", topicId: "arrays", difficulty: "EASY", solved: false, attempts: 0 },
      { id: "done", topicId: "arrays", difficulty: "EASY", solved: true, attempts: 0 },
    ], "arrays", ["hashing"], 40);
    expect(ranked.map((problem) => problem.id)).toEqual(["current", "done", "weak"]);
  });
});
