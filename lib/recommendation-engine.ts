import { TopicProgress } from "@/lib/types";
import { topics } from "@/lib/data";
export function recommendationFor(progress?: TopicProgress): string {
  if (!progress) return "Start with the Learn task to build your foundation.";
  const name = topics.find(t => t.id === progress.topicId)?.name ?? "this topic";
  if ((progress.assessmentScore ?? 100) < 60) return `${name}: revisit the concept and retry the checkpoint after a short review.`;
  if ((progress.practiceAccuracy ?? 100) < 80) return `${name}: add 3 targeted practice problems before moving on.`;
  return `${name}: you’re ready to progress to the next topic.`;
}
