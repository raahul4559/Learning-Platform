export type Level = "Beginner" | "Intermediate" | "Advanced";
export type TaskKind = "learn" | "practice" | "assessment" | "review";
export type TopicId = "complexity" | "arrays" | "strings" | "hashing" | "two-pointers" | "sliding-window" | "binary-search" | "linked-lists" | "stack" | "queue" | "recursion" | "backtracking" | "trees" | "bst" | "heap" | "graphs" | "greedy" | "dynamic-programming";
export interface Profile { language: string; level: Level; goal: string; dailyMinutes: number; deadline: string; preference: string; }
export interface Topic { id: TopicId; name: string; description: string; estimatedMinutes: number; }
export interface Resource { id: string; title: string; type: "YouTube playlist" | "Video" | "Article" | "Course" | "Problem sheet" | "Documentation"; url: string; topicIds: TopicId[]; sections?: string; }
export interface LearningTask { id: string; topicId: TopicId; title: string; kind: TaskKind; minutes: number; completed: boolean; }
export interface TopicProgress { topicId: TopicId; completed: number; practiceAccuracy?: number; assessmentScore?: number; timeSpent: number; mistakes: number; }
export interface PlannerState { profile?: Profile; tasks: LearningTask[]; progress: TopicProgress[]; resources: Resource[]; }
