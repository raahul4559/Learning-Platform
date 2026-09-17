"use client";
import { seededResources } from "@/lib/data";
import { generateRoadmap } from "@/lib/roadmap-engine";
import { PlannerState, Profile } from "@/lib/types";
const key = "pathwise-demo-state";
const empty = (): PlannerState => ({ tasks:[], progress:[], resources:seededResources });
export function getState(): PlannerState { if (typeof window === "undefined") return empty(); try { return JSON.parse(localStorage.getItem(key) || "null") || empty(); } catch { return empty(); } }
export function saveState(state: PlannerState) { localStorage.setItem(key, JSON.stringify(state)); }
export function startPlan(profile: Profile) { const state = { ...empty(), profile, tasks:generateRoadmap(profile) }; saveState(state); return state; }
