"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { hasCompletedOnboarding, login } from "@/lib/auth-store";
import { AuthLayout } from "@/components/auth-layout";

export default function Login() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); setLoading(true); const result = await login(email, password); setLoading(false); if (!result.user) { setError(result.error || "Could not sign in."); return; } router.replace(hasCompletedOnboarding() ? "/dashboard" : "/onboarding"); }
  return <AuthLayout title="Welcome back" description="Sign in to continue with your learning plan."><form className="mt-7 space-y-4" onSubmit={submit}><label className="block text-sm font-semibold text-slate-700">Email<input required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} type="email" className="field" placeholder="you@example.com" /></label><label className="block text-sm font-semibold text-slate-700">Password<input required minLength={8} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} type="password" className="field" placeholder="••••••••" /></label>{error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}<button disabled={loading} className="btn mt-2 w-full">{loading ? "Signing in…" : "Log in"}</button></form><p className="mt-6 text-center text-sm text-slate-500">New to Pathwise? <Link className="font-bold text-indigo-600 hover:text-indigo-700" href="/signup">Create an account</Link></p></AuthLayout>;
}
