import Link from "next/link";

export function AuthLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#fbfbfe] px-5 py-10"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9"><Link href="/" className="inline-flex items-center gap-2 font-extrabold tracking-tight text-slate-900"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs text-white">↗</span>pathwise<span className="-ml-2 text-indigo-600">.</span></Link><h1 className="mt-8 text-3xl font-extrabold tracking-tight text-slate-950">{title}</h1><p className="mt-2 leading-7 text-slate-600">{description}</p>{children}</section></main>;
}
