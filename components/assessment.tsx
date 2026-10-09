"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { currentUser } from "@/lib/auth-store";

type Question = { id: string; position: number; prompt: string; options: string[] };
type AssessmentData = { assessment: { id: string; title: string; topicId: string; topic: string; passingScore: number; estimatedMinutes: number; questions: Question[] } };
type SubmitResult = { score: number; rawScore: number; maxScore: number; passed: boolean; topicMastery: number; weakAreas: { id: string; name: string; score: number }[]; recommendation: string };

export function Assessment() {
  const [data, setData] = useState<AssessmentData | null>(null);
  const [message, setMessage] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    const user = currentUser();
    if (!user) return;
    fetch(`/api/assessment?email=${encodeURIComponent(user.email)}`)
      .then(async (response) => (response.ok ? (response.json() as Promise<AssessmentData>) : Promise.reject()))
      .then(setData)
      .catch(() => setMessage("Your assessment needs an active database roadmap."));
  }, []);

  async function submit() {
    const user = currentUser();
    if (!user || !data) return;
    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, assessmentId: data.assessment.id, answers }),
    });
    setSubmitting(false);
    if (!response.ok) {
      setMessage("We couldn’t submit your assessment. Please try again.");
      return;
    }
    setResult((await response.json()) as SubmitResult);
  }

  if (!data) {
    return (
      <section className="card max-w-2xl">
        <p className="section-label">Assessment</p>
        <h1 className="mt-2 text-2xl font-bold">Preparing your checkpoint…</h1>
        <p className="mt-2 text-slate-600">{message || "Loading your current topic's assessment."}</p>
      </section>
    );
  }

  const { assessment } = data;
  const questions = assessment.questions;

  if (result) {
    return (
      <div className="mx-auto max-w-2xl pb-8">
        <p className="section-label">{assessment.topic} assessment · Result</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{result.passed ? "Checkpoint passed" : "Keep practicing"}</h1>
        <section className="card mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Score</p>
            <p className="mt-1 text-3xl font-extrabold text-indigo-700">{result.score}%</p>
            <p className="mt-1 text-sm text-slate-500">{result.rawScore}/{result.maxScore} correct</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Topic mastery</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-950">{result.topicMastery}%</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${result.topicMastery}%` }} /></div>
          </div>
        </section>
        <section className="card mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Weak areas</p>
          {result.weakAreas.length ? (
            <ul className="mt-3 space-y-2">
              {result.weakAreas.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 text-sm"><span className="font-semibold text-slate-900">{item.name}</span><span className="text-amber-700">{item.score}%</span></li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-6 text-slate-600">No weak areas detected — nice work.</p>
          )}
        </section>
        <section className="card mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recommended next action</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{result.recommendation}</p>
        </section>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/learn" className="btn-secondary">Back to learning</Link>
          <Link href="/practice" className="btn">Go to practice</Link>
        </div>
      </div>
    );
  }

  const current = questions[index];
  const answeredCount = Object.keys(answers).length;
  const isLast = index === questions.length - 1;

  if (!current) {
    return (
      <section className="card max-w-2xl">
        <p className="section-label">{assessment.topic} assessment</p>
        <h1 className="mt-2 text-2xl font-bold">No questions are available yet.</h1>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <p className="section-label">{assessment.topic} assessment</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">{assessment.title}</h1>
        <span className="text-sm font-semibold text-slate-500">Question {index + 1}/{questions.length}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>

      <section className="card mt-6">
        <h2 className="text-lg font-bold text-slate-950">{current.prompt}</h2>
        <div className="mt-4 space-y-2">
          {current.options.map((option) => (
            <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-medium transition ${answers[current.id] === option ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-slate-200 text-slate-700 hover:border-indigo-200"}`}>
              <input type="radio" name={current.id} checked={answers[current.id] === option} onChange={() => setAnswers((state) => ({ ...state, [current.id]: option }))} />
              {option}
            </label>
          ))}
        </div>
      </section>

      {message && <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{message}</p>}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40">
          Previous
        </button>
        <p className="text-xs font-semibold text-slate-500">{answeredCount}/{questions.length} answered</p>
        {isLast ? (
          <button type="button" disabled={submitting || answeredCount < questions.length} onClick={submit} className="btn disabled:cursor-not-allowed disabled:opacity-40">
            {submitting ? "Submitting…" : "Submit assessment"}
          </button>
        ) : (
          <button type="button" onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))} className="btn">
            Next
          </button>
        )}
      </div>
    </div>
  );
}
