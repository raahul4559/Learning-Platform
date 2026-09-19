"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { currentUser } from "@/lib/auth-store";
import type { DashboardData, DashboardTask } from "@/lib/dashboard-data";
import { generateRoadmap } from "@/lib/roadmap-engine";
import { getState } from "@/lib/store";
import { Profile } from "@/lib/types";

const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const taskLabels = { learn: "Learn", practice: "Practice", review: "Review", assessment: "Assessment" } as const;

function minutes(value: number) {
  const hours = Math.floor(value / 60);
  return hours ? `${hours}h${value % 60 ? ` ${value % 60}m` : ""}` : `${value}m`;
}

function demoDashboard(profile: Profile, learnerName: string): DashboardData | null {
  try {
    const roadmap = generateRoadmap({ goal: profile.goal, subject: profile.subject ?? "DSA", language: profile.language, skillLevel: profile.level, dailyTime: profile.dailyMinutes, deadline: profile.deadline, learningPreference: profile.preference, selectedResources: profile.resources, startDate: new Date().toISOString().slice(0, 10) });
    const currentTask = roadmap.today.tasks[0] ?? roadmap.dailyTasks[0];
    const currentModule = roadmap.modules.find((module) => module.id === currentTask?.moduleId);
    const currentTopic = currentModule?.topics.find((topic) => topic.id === currentTask?.topicId);
    const allTopics = roadmap.modules.flatMap((module) => module.topics);
    const nextTopic = allTopics[allTopics.findIndex((topic) => topic.id === currentTopic?.id) + 1];
    const week = roadmap.weeklySchedule[0];
    return {
      source: "demo", learnerName, today: roadmap.today.tasks, todayCompleted: 0, todayTotal: roadmap.today.tasks.length,
      streak: 0, weeklyCompleted: 0, weeklyTotal: week?.tasks.length ?? 0, currentModule: currentModule?.name,
      currentTopic: currentTopic ? { id: currentTopic.id, name: currentTopic.name, description: currentTopic.description } : undefined,
      nextTopic: nextTopic ? { id: nextTopic.id, name: nextTopic.name } : undefined, weakTopics: [], deadline: roadmap.deadline,
    };
  } catch { return null; }
}

function Meter({ value, label }: { value: number; label: string }) {
  return <div className="mt-3"><div className="flex justify-between text-xs font-semibold text-slate-500"><span>{label}</span><span>{value}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${value}%` }} /></div></div>;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [savingTask, setSavingTask] = useState<string | null>(null);
  const todayMinutes = useMemo(() => data?.today.reduce((sum, task) => sum + task.minutes, 0) ?? 0, [data]);

  useEffect(() => {
    const user = currentUser();
    const profile = getState().profile;
    if (!user) return;
    fetch(`/api/dashboard?email=${encodeURIComponent(user.email)}`)
      .then(async (response) => response.ok ? response.json() as Promise<DashboardData> : Promise.reject())
      .then(setData)
      .catch(() => {
        const demo = demoMode && profile ? demoDashboard(profile, user.name) : null;
        setData(demo);
        if (!demo) setMessage("Your dashboard is waiting for an active database roadmap.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function toggleTask(task: DashboardTask) {
    if (!data || savingTask) return;
    const completed = !task.completed;
    setData({ ...data, today: data.today.map((item) => item.id === task.id ? { ...item, completed } : item), todayCompleted: data.todayCompleted + (completed ? 1 : -1) });
    if (data.source === "demo") return;
    setSavingTask(task.id);
    const user = currentUser();
    const response = await fetch("/api/dashboard", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user?.email, taskId: task.id, completed }) });
    if (!response.ok) { setMessage("We couldn’t save that task. Please try again."); setData((current) => current ? { ...current, today: current.today.map((item) => item.id === task.id ? { ...item, completed: task.completed } : item), todayCompleted: current.todayCompleted + (completed ? -1 : 1) } : current); }
    setSavingTask(null);
  }

  if (loading) return <div className="card animate-pulse"><div className="h-5 w-32 rounded bg-slate-200" /><div className="mt-5 h-32 rounded-xl bg-slate-100" /></div>;
  if (!data) return <section className="card max-w-xl"><p className="section-label">Dashboard unavailable</p><h1 className="mt-2 text-2xl font-bold">Your learning plan is not ready yet.</h1><p className="mt-2 text-slate-600">{message}</p><Link href="/onboarding" className="btn mt-5">Set up learning plan</Link></section>;

  const todayPercent = data.todayTotal ? Math.round((data.todayCompleted / data.todayTotal) * 100) : 0;
  const weeklyPercent = data.weeklyTotal ? Math.round((data.weeklyCompleted / data.weeklyTotal) * 100) : 0;
  const dueText = data.deadline ? `${data.deadline} · ${Math.max(0, Math.ceil((new Date(`${data.deadline}T00:00:00Z`).getTime() - Date.now()) / 86_400_000))} days left` : "No deadline set";

  return <div className="mx-auto max-w-6xl pb-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="section-label">{data.source === "demo" ? "DEMO LEARNING PLAN" : "YOUR PERSONAL LEARNING PLAN"}</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">What should you study today?</h1><p className="mt-2 text-slate-600">{data.learnerName}, follow the next small steps in your roadmap.</p></div><Link href="/learn" className="btn">Continue learning <span aria-hidden>→</span></Link></div>

    <div className="mt-7 grid gap-5 lg:grid-cols-3"><section className="card lg:col-span-2"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="section-label">Today&apos;s learning plan</p><h2 className="mt-1 text-2xl font-bold">{data.currentTopic?.name ?? "Your next topic"}</h2><p className="mt-1 text-sm text-slate-600">{data.today.length ? `${data.today.length} focused tasks · ${minutes(todayMinutes)}` : "No tasks are scheduled for today."}</p></div><div className="rounded-xl bg-indigo-50 px-3 py-2 text-right"><p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Today&apos;s progress</p><p className="text-lg font-extrabold text-indigo-950">{data.todayCompleted}/{data.todayTotal}</p></div></div><Meter value={todayPercent} label="Complete today" /><ol className="mt-5 space-y-3">{data.today.map((task, index) => <li key={task.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-indigo-200"><button type="button" disabled={savingTask === task.id} onClick={() => toggleTask(task)} aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${task.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-indigo-500 text-indigo-700"}`}>{task.completed ? "✓" : index + 1}</button><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{taskLabels[task.kind]}</p><p className={`truncate font-semibold ${task.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>{task.title}</p></div><span className="shrink-0 text-sm font-semibold text-slate-500">{task.minutes} min</span></li>)}</ol>{!data.today.length && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">You&apos;re clear for today. Continue learning to choose your next task.</p>}</section>
      <aside className="card bg-slate-950 text-white"><p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-300">Current focus</p><h2 className="mt-3 text-2xl font-bold">{data.currentTopic?.name ?? "No topic selected"}</h2><p className="mt-2 text-sm leading-6 text-slate-300">{data.currentTopic?.description ?? "Start your roadmap to unlock your next topic."}</p><div className="mt-7 border-t border-slate-700 pt-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Current module</p><p className="mt-1 font-semibold">{data.currentModule ?? "—"}</p><p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Next topic</p><p className="mt-1 font-semibold">{data.nextTopic?.name ?? "Complete your current topic"}</p></div></aside></div>

    <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"><section className="card"><p className="text-sm font-semibold text-slate-500">Current streak</p><p className="mt-2 text-3xl font-extrabold">{data.streak} <span className="text-base font-semibold text-slate-500">days</span></p><p className="mt-2 text-sm text-slate-500">Keep today&apos;s session going.</p></section><section className="card"><p className="text-sm font-semibold text-slate-500">Weekly progress</p><p className="mt-2 text-3xl font-extrabold">{data.weeklyCompleted}/{data.weeklyTotal}</p><Meter value={weeklyPercent} label="Tasks complete" /></section><section className="card"><p className="text-sm font-semibold text-slate-500">Upcoming deadline</p><p className="mt-2 text-lg font-extrabold">{data.deadline ?? "No deadline"}</p><p className="mt-2 text-sm text-slate-500">{dueText}</p></section><section className="card"><p className="text-sm font-semibold text-slate-500">Weak topics</p>{data.weakTopics.length ? <ul className="mt-2 space-y-1.5">{data.weakTopics.map((topic) => <li key={topic.id} className="flex justify-between gap-2 text-sm"><span className="truncate font-semibold">{topic.name}</span><span className="text-amber-700">{topic.score}%</span></li>)}</ul> : <p className="mt-2 text-sm leading-6 text-slate-500">No weak-topic signal yet. Complete practice or a quiz to calibrate this.</p>}</section></div>
  </div>;
}
