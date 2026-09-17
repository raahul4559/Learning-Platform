"use client";
import { seededResources } from "@/lib/data";
import { PlannerState, Profile } from "@/lib/types";
import { currentUser } from "@/lib/auth-store";
const key = () => `pathwise-state-${currentUser()?.id || "anonymous"}`;
const empty = (): PlannerState => ({ tasks:[], progress:[], resources:seededResources });
export function getState(): PlannerState { if (typeof window === "undefined") return empty(); try { return JSON.parse(localStorage.getItem(key()) || "null") || empty(); } catch { return empty(); } }
export function saveState(state: PlannerState) { localStorage.setItem(key(), JSON.stringify(state)); }
export function saveProfile(profile: Profile) { const state = { ...getState(), profile }; saveState(state); return state; }
