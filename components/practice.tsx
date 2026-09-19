"use client";

import { useEffect, useState } from "react";
import { currentUser } from "@/lib/auth-store";

type Problem = { id: string; title: string; description?: string; difficulty: "EASY" | "MEDIUM" | "HARD"; topic: string; subtopic?: string; platform?: string; url?: string; estimatedTime: number; tags: string[]; solved: boolean; attempts: number };
type PracticeData = { currentTopicId: string; targetDifficulty: string; problems: Problem[] };
const difficultyStyle = { EASY: "bg-emerald-50 text-emerald-700", MEDIUM: "bg-amber-50 text-amber-700", HARD: "bg-rose-50 text-rose-700" };

export function Practice() {
  const [data, setData] = useState<PracticeData | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  useEffect(() => { const user = currentUser(); if (!user) return; fetch(`/api/practice?email=${encodeURIComponent(user.email)}`).then(async (response) => response.ok ? response.json() as Promise<PracticeData> : Promise.reject()).then(setData).catch(() => setMessage("Practice recommendations need an active database roadmap.")); }, []);
  async function saveOutcome(problem: Problem, outcome: "solved" | "needs_revision") {
    const user = currentUser(); if (!user) return;
    setSaving(problem.id); setMessage("");
    const response = await fetch("/api/practice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, problemId: problem.id, outcome, durationMinutes: problem.estimatedTime }) });
    setSaving(null);
    if (!response.ok) { setMessage("We couldn’t save this attempt. Please try again."); return; }
    setData((current) => current ? { ...current, problems: current.problems.map((item) => item.id === problem.id ? { ...item, solved: outcome === "solved", attempts: item.attempts + 1 } : item) } : current);
    setMessage(outcome === "solved" ? "Attempt saved. Great job." : "Saved for revision — we’ll keep this area in your recommendations.");
  }
  if (!data) return <section className="card max-w-2xl"><p className="section-label">Practice</p><h1 className="mt-2 text-2xl font-bold">Finding the right problems…</h1><p className="mt-2 text-slate-600">{message || "Loading recommendations from your learning history."}</p></section>;
  return <div className="mx-auto max-w-5xl pb-8"><p className="section-label">Practice recommendations</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Practice the next right problem</h1><p className="mt-2 max-w-2xl text-slate-600">Ranked for your current topic, weak areas, prior attempts, and current difficulty level.</p></div><span className={`rounded-full px-3 py-1.5 text-sm font-bold ${difficultyStyle[data.targetDifficulty as keyof typeof difficultyStyle] ?? difficultyStyle.EASY}`}>Target: {data.targetDifficulty.toLowerCase()}</span></div><div className="mt-7 space-y-4">{data.problems.map((problem) => <article key={problem.id} className="card"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${difficultyStyle[problem.difficulty]}`}>{problem.difficulty.toLowerCase()}</span><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{problem.topic}{problem.subtopic ? ` · ${problem.subtopic}` : ""}</span>{problem.solved && <span className="text-xs font-bold text-emerald-700">Solved</span>}</div><h2 className="mt-3 text-lg font-bold text-slate-950">{problem.title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{problem.description}</p><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500"><span>{problem.platform ?? "External practice"}</span><span>·</span><span>{problem.estimatedTime} min</span><span>·</span><span>{problem.attempts} previous attempt{problem.attempts === 1 ? "" : "s"}</span>{problem.tags.map((tag) => <span className="rounded bg-slate-100 px-2 py-0.5" key={tag}>{tag}</span>)}</div></div><div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">{problem.url ? <a className="btn" href={problem.url} target="_blank" rel="noreferrer">Open problem <span aria-hidden>↗</span></a> : null}<button disabled={saving === problem.id} className="btn-secondary" onClick={() => saveOutcome(problem, "solved")}>Mark solved</button><button disabled={saving === problem.id} className="text-sm font-semibold text-slate-500 hover:text-indigo-700" onClick={() => saveOutcome(problem, "needs_revision")}>Need revision</button></div></div></article>)}</div>{!data.problems.length && <section className="card mt-7"><p className="font-bold">No recommendations yet.</p><p className="mt-1 text-sm text-slate-600">Complete a learning session to unlock practice suggestions.</p></section>}{message && <p role="status" className="mt-5 text-sm font-semibold text-slate-600">{message}</p>}</div>;
}
