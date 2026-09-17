export interface AiPlanner { explainRecommendation(input: { topic: string; score?: number }): Promise<string>; }
export const demoAiPlanner: AiPlanner = { async explainRecommendation({ topic, score }) { return score && score < 60 ? `Your ${topic} score shows a foundation gap. Focus on one worked example, then retake the quiz.` : `Keep building momentum in ${topic} with deliberate practice.`; } };
