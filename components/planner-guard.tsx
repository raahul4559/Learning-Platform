"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getState } from "@/lib/store";
import { currentUser, hasCompletedOnboarding } from "@/lib/auth-store";
export function PlannerGuard({ children }: { children: React.ReactNode }) { const [ready,setReady] = useState(false); const router = useRouter(); useEffect(() => { if (!currentUser()) { router.replace("/login"); return; } if (!hasCompletedOnboarding() || !getState().profile) { router.replace("/onboarding"); return; } setReady(true); },[router]); return ready ? <>{children}</> : <div className="p-10 text-center text-slate-500">Loading your account…</div>; }
