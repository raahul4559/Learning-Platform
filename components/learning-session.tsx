"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { currentUser } from "@/lib/auth-store";

type SessionData = { topic: { id: string; name: string; description?: string; module: string; progress: number; estimatedMinutes: number; resources: { id: string; title: string; type: string; url: string }[]; assessment: { id: string; title: string; estimatedMinutes: number } | null } };

export function LearningSession() {
  const [data, setData] = useState<SessionData | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { const user = currentUser(); if (!user) return; fetch(`/api/learning?email=${encodeURIComponent(user.email)}`).then(async (response) => response.ok ? response.json() as Promise<SessionData> : Promise.reject()).then(setData).catch(() => setMessage("Your learning session needs an active database roadmap.")); }, []);
  async function record(outcome: "understood" | "revision") {
    const user = currentUser(); if (!user || !data) return;
    setSaving(true); setMessage("");
    const response = await fetch("/api/learning", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, topicId: data.topic.id, outcome }) });
    setSaving(false);
    if (!response.ok) { setMessage("We couldn’t save your session. Please try again."); return; }
    setData((current) => current ? { topic: { ...current.topic, progress: outcome === "understood" ? Math.max(50, current.topic.progress) : current.topic.progress } } : current);
    setMessage(outcome === "understood" ? "Nice work — your progress has been saved. Try practice next." : "Revision noted. Revisit the resource, then try one practice problem.");
  }
  if (!data) return <section className="card max-w-2xl"><p className="section-label">Learning session</p><h1 className="mt-2 text-2xl font-bold">Preparing your session…</h1><p className="mt-2 text-slate-600">{message || "Loading your current topic and resources."}</p></section>;
  const { topic } = data;
  return <div className="mx-auto max-w-5xl pb-8"><p className="section-label">Learning session · {topic.module}</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{topic.name}</h1><p className="mt-2 max-w-2xl leading-7 text-slate-600">{topic.description}</p></div><div className="rounded-xl bg-indigo-50 px-4 py-3 text-right"><p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Estimated learning time</p><p className="mt-1 text-lg font-extrabold text-indigo-950">{topic.estimatedMinutes} min</p></div></div>
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between gap-4 text-sm font-semibold"><span>Topic progress</span><span>{topic.progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${topic.progress}%` }} /></div></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-3"><section className="card lg:col-span-2"><h2 className="text-xl font-bold">Learn with a resource</h2><p className="mt-1 text-sm text-slate-600">Choose one focused resource, then come back to record how it went.</p><div className="mt-5 space-y-3">{topic.resources.map((resource) => <article key={resource.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{resource.type.replaceAll("_", " ")}</p><h3 className="mt-1 font-bold text-slate-900">{resource.title}</h3></div><a href={resource.url} target="_blank" rel="noreferrer" className="btn-secondary text-sm">Open resource <span aria-hidden>↗</span></a></div></article>)}</div>{!topic.resources.length && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No resource is mapped yet for this topic.</p>}</section>
      <aside className="card"><p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">Check your understanding</p><h2 className="mt-2 text-xl font-bold">Ready for the next step?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Save a quick signal so recommendations can adapt to you.</p><button disabled={saving} onClick={() => record("understood")} className="btn mt-6 w-full">I understood this</button><button disabled={saving} onClick={() => record("revision")} className="btn-secondary mt-3 w-full">I need revision</button>{message && <p role="status" className="mt-4 text-sm leading-6 text-slate-600">{message}</p>}<div className="mt-6 space-y-3 border-t border-slate-100 pt-5"><Link href="/practice" className="btn-secondary w-full">Start practice</Link><Link href="/assessments" className="btn-secondary w-full">{topic.assessment ? `Start assessment · ${topic.assessment.estimatedMinutes} min` : "Start assessment"}</Link></div></aside></div></div>;
}
