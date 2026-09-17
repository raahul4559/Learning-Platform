import { topics } from "@/lib/data";
import { LearningTask, Profile, TopicId } from "@/lib/types";
export function generateRoadmap(profile: Profile): LearningTask[] {
  const capacity = profile.dailyMinutes;
  return topics.flatMap((topic, index) => {
    const learn = Math.min(Math.max(25, Math.round(capacity * .35)), 60);
    const practice = Math.min(Math.max(30, Math.round(capacity * .4)), 75);
    const assessment = Math.min(25, Math.round(capacity * .17));
    const review = Math.max(10, capacity - learn - practice - assessment);
    const prefix = `${index + 1}-${topic.id}`;
    return [
      { id:`${prefix}-learn`, topicId:topic.id, title:`${topic.name} — Learn`, kind:"learn", minutes:learn, completed:false },
      { id:`${prefix}-practice`, topicId:topic.id, title:`Solve ${Math.max(3, Math.round(practice / 10))} ${topic.name} problems`, kind:"practice", minutes:practice, completed:false },
      { id:`${prefix}-review`, topicId:topic.id, title:"Review mistakes", kind:"review", minutes:review, completed:false },
      { id:`${prefix}-assessment`, topicId:topic.id, title:`${topic.name} checkpoint`, kind:"assessment", minutes:assessment, completed:false }
    ] as LearningTask[];
  });
}
export function currentTopicId(tasks: LearningTask[]): TopicId { return tasks.find(t => !t.completed)?.topicId ?? "dynamic-programming"; }
