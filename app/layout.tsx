import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Pathwise | Your DSA learning plan", description: "A personalized DSA learning planner" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
