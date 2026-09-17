export type Level = "Beginner" | "Basic" | "Intermediate" | "Advanced";
export type TaskKind = "learn" | "practice" | "assessment" | "review";
export type TopicId = "complexity" | "arrays" | "strings" | "hashing" | "two-pointers" | "sliding-window" | "binary-search" | "linked-lists" | "stack" | "queue" | "recursion" | "backtracking" | "trees" | "bst" | "heap" | "graphs" | "greedy" | "dynamic-programming";
export type Subject = "DSA" | "Web Development" | "Machine Learning" | "Java" | "Python" | "Cybersecurity" | "System Design";
export type LearningGoal = "College exams" | "Placements" | "Technical interviews" | "Competitive programming" | "Personal learning" | "Placement";
export type LearningPreference = "Video" | "Reading" | "Practice" | "Project-based" | "Mixed" | "Video-first";
export interface CustomResource { id: string; type: "YouTube playlist" | "Course" | "Custom"; title: string; url: string; }
export interface Profile { subject?: Subject; language: string; level: Level; goal: LearningGoal; dailyMinutes: number; deadline: string; preference: LearningPreference; resources?: CustomResource[]; completedAt?: string; }
export interface Topic { id: TopicId; name: string; description: string; estimatedMinutes: number; }
export interface Resource { id: string; title: string; type: "YouTube playlist" | "Video" | "Article" | "Course" | "Problem sheet" | "Documentation"; url: string; topicIds: TopicId[]; sections?: string; }
export interface LearningTask { id: string; topicId: TopicId; title: string; kind: TaskKind; minutes: number; completed: boolean; }
export interface TopicProgress { topicId: TopicId; completed: number; practiceAccuracy?: number; assessmentScore?: number; timeSpent: number; mistakes: number; }
export interface PlannerState { profile?: Profile; tasks: LearningTask[]; progress: TopicProgress[]; resources: Resource[]; }
