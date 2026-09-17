"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/auth-store";
import { AuthLayout } from "@/components/auth-layout";

export default function Signup() {
  const router = useRouter(); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); if (password.length < 8) { setError("Use at least 8 characters for your password."); return; } setLoading(true); const result = await signup(name, email, password); setLoading(false); if (!result.user) { setError(result.error || "Could not create your account."); return; } router.replace("/onboarding"); }
  return <AuthLayout title="Create your account" description="Start with a clear plan for what to learn next."><form className="mt-7 space-y-4" onSubmit={submit}><label className="block text-sm font-semibold text-slate-700">Name<input required autoComplete="name" value={name} onChange={event => setName(event.target.value)} className="field" placeholder="Your name" /></label><label className="block text-sm font-semibold text-slate-700">Email<input required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} type="email" className="field" placeholder="you@example.com" /></label><label className="block text-sm font-semibold text-slate-700">Password<input required minLength={8} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} type="password" className="field" placeholder="At least 8 characters" /></label>{error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}<button disabled={loading} className="btn mt-2 w-full">{loading ? "Creating account…" : "Create account"}</button></form><p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link className="font-bold text-indigo-600 hover:text-indigo-700" href="/login">Log in</Link></p></AuthLayout>;
}
