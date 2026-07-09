import type { FinancialPosition } from "@/lib/dashboard/position";

interface FinancialSnapshotProps {
  position: FinancialPosition;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FinancialSnapshot({ position }: FinancialSnapshotProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm text-zinc-500">Today</p>
        <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
          {position.financialStatus.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          {position.financialStatus.description}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-4">
        <div>
          <p className="text-sm text-zinc-500">Available today</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {formatCurrency(position.currentCash)}
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Already committed</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {formatCurrency(position.committedOutgoing)}
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Before payday buffer</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {formatCurrency(position.availableBeforePayday)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Keeps {formatCurrency(position.emergencyBuffer)} untouched
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Projected after salary</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-950">
            {formatCurrency(position.projectedBalance)}
          </p>
        </div>
      </div>
    </section>
  );
}
