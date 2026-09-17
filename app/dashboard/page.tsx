import { AppShell } from "@/components/app-shell"; import { PlannerGuard } from "@/components/planner-guard"; import { Dashboard } from "@/components/dashboard";
export default function Page(){return <PlannerGuard><AppShell><Dashboard /></AppShell></PlannerGuard>}
