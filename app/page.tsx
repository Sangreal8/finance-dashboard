import { FinancialSnapshot } from "@/components/dashboard/FinancialSnapshot";
import { UpcomingTimeline } from "@/components/dashboard/UpcomingTimeline";
import { getDashboardSummary } from "@/lib/dashboard/summary";

export default function DashboardPage() {
  const summary = getDashboardSummary();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm text-zinc-500">Finance Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Good evening, Josh
          </h1>
        </header>

        <FinancialSnapshot position={summary.position} />

        <UpcomingTimeline events={summary.projection} />
      </div>
    </main>
  );
}
