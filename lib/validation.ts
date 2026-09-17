import { z } from "zod";
export const onboardingSchema = z.object({
  subject: z.enum(["DSA", "Web Development", "Machine Learning", "Java", "Python", "Cybersecurity", "System Design"]),
  language: z.enum(["Java", "C++", "Python", "JavaScript"]),
  level: z.enum(["Beginner", "Basic", "Intermediate", "Advanced"]),
  goal: z.enum(["College exams", "Placements", "Technical interviews", "Competitive programming", "Personal learning"]),
  dailyMinutes: z.number().min(30).max(480),
  deadline: z.string().min(1),
  preference: z.enum(["Video", "Reading", "Practice", "Project-based", "Mixed"]),
  resources: z.array(z.object({ id: z.string(), type: z.enum(["YouTube playlist", "Course", "Custom"]), title: z.string().min(1), url: z.string().url() })).default([]),
  completedAt: z.string(),
});
