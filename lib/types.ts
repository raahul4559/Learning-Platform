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
export type TopicDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type TopicStatus = "locked" | "available" | "up-next" | "completed";
export interface RoadmapResource { id: string; title: string; type: string; url: string; recommendedFor: LearningPreference; }
export interface PracticeTask { id: string; title: string; description: string; difficulty: TopicDifficulty; estimatedMinutes: number; }
export interface TopicAssessment { title: string; description: string; estimatedMinutes: number; passingScore: number; }
export interface RoadmapTopic { id: TopicId; name: string; description: string; prerequisites: TopicId[]; difficulty: TopicDifficulty; estimatedLearningTime: number; estimatedPracticeTime: number; resources: RoadmapResource[]; problems: PracticeTask[]; assessment: TopicAssessment; status: TopicStatus; }
export interface RoadmapModule { id: string; name: string; description: string; topics: RoadmapTopic[]; }
export interface DailyTask extends LearningTask { date: string; moduleId: string; resourceIds: string[]; }
export interface WeeklySchedule { week: number; startDate: string; endDate: string; totalMinutes: number; tasks: DailyTask[]; focus: string; }
export interface Roadmap { subject: Subject; language: string; goal: LearningGoal; generatedAt: string; dailyTime: number; deadline: string; modules: RoadmapModule[]; weeklySchedule: WeeklySchedule[]; dailyTasks: DailyTask[]; today: { date: string; tasks: DailyTask[]; message: string }; }
export interface RoadmapInput { goal: LearningGoal; subject: Subject; language: string; skillLevel: Level; dailyTime: number; deadline: string; learningPreference: LearningPreference; selectedResources?: CustomResource[]; startDate?: string; }
export interface TopicProgress { topicId: TopicId; completed: number; practiceAccuracy?: number; assessmentScore?: number; timeSpent: number; mistakes: number; }
export interface PlannerState { profile?: Profile; tasks: LearningTask[]; progress: TopicProgress[]; resources: Resource[]; }
