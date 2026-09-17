import { z } from "zod";
export const onboardingSchema = z.object({ language:z.string().min(1), level:z.enum(["Beginner","Intermediate","Advanced"]), goal:z.string().min(2), dailyMinutes:z.number().min(30).max(480), deadline:z.string().min(1), preference:z.string().min(1) });
