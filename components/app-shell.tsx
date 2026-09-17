"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [["/dashboard", "Dashboard"], ["/roadmap", "Roadmap"], ["/learn", "Learn"], ["/practice", "Practice"], ["/assessments", "Assessments"], ["/progress", "Progress"]];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return <div className="min-h-screen pb-16 md:pb-0"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><Link href="/dashboard" className="text-lg font-bold tracking-tight text-indigo-700">pathwise<span className="text-slate-400">.</span></Link><nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">{links.map(([href, label]) => <Link key={href} href={href} className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${path === href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>{label}</Link>)}</nav><Link href="/" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-900 sm:block">Sign out</Link></div></header><main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">{children}</main><nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white px-2 py-2 lg:hidden">{links.slice(0, 5).map(([href, label]) => <Link key={href} href={href} className={`flex min-w-0 flex-1 justify-center rounded-md px-1 py-2 text-center text-xs font-medium ${path === href ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}>{label}</Link>)}</nav></div>;
}
