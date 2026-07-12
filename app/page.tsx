import { FinancialSnapshot } from "@/components/dashboard/FinancialSnapshot";
import { ReservedMoneyCard } from "@/components/dashboard/ReservedMoneyCard";
import { UpcomingTimeline } from "@/components/dashboard/UpcomingTimeline";
import {
  getFinancialPosition,
  getFinanceTimeline,
  getReserves,
} from "@/lib/finance/engine";

export default function DashboardPage() {
  const position = getFinancialPosition();
  const timeline = getFinanceTimeline();
  const reserves = getReserves();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm text-zinc-500">Finance Dashboard</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Good evening, Josh
          </h1>
        </header>

        <FinancialSnapshot position={position} />

        <ReservedMoneyCard reserves={reserves} />

        <UpcomingTimeline events={timeline} />
      </div>
    </main>
  );
}
