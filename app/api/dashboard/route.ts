import { NextRequest, NextResponse } from "next/server";
import { completeDashboardTask, getDashboardData } from "@/lib/dashboard-data";
import { ensureActiveProgress, ensureTodayPlan } from "@/lib/learner-provisioning";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  try {
    await ensureActiveProgress(email);
    await ensureTodayPlan(email);
    const dashboard = await getDashboardData(email);
    return dashboard ? NextResponse.json(dashboard) : NextResponse.json({ error: "No active roadmap found" }, { status: 404 });
  } catch (error) {
    console.error("GET /api/dashboard failed", error);
    return NextResponse.json({ error: "Dashboard data is unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: string; taskId?: string; completed?: boolean } | null;
  if (!body?.email || !body.taskId || typeof body.completed !== "boolean") return NextResponse.json({ error: "email, taskId, and completed are required" }, { status: 400 });
  try {
    const task = await completeDashboardTask(body.email, body.taskId, body.completed);
    return task ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Task not found" }, { status: 404 });
  } catch (error) {
    console.error("PATCH /api/dashboard failed", error);
    return NextResponse.json({ error: "Dashboard data is unavailable" }, { status: 503 });
  }
}
