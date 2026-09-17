import { describe, expect, it } from "vitest";
import { generateRoadmap } from "@/lib/roadmap-engine";
describe("roadmap engine",()=>it("creates learn, practice, review and assessment for each topic",()=>{const plan=generateRoadmap({language:"Java",level:"Beginner",goal:"Placement",dailyMinutes:120,deadline:"2027-01-01",preference:"Video-first"});expect(plan).toHaveLength(72);expect(plan.slice(0,4).map(t=>t.kind)).toEqual(["learn","practice","review","assessment"])}));
