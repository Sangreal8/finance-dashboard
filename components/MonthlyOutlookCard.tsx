import { getCashFlowPlan } from "@/lib/cashflow";

interface MonthlyOutlookCardProps {
  currentBalance: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MonthlyOutlookCard({
  currentBalance,
}: MonthlyOutlookCardProps) {
  const plan = getCashFlowPlan(currentBalance);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-sm text-zinc-500">Monthly Outlook</p>
        <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
          {plan.remainingAfterMandatory >= 0
            ? "You’re on track this month"
            : "This month needs attention"}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-zinc-500">Projected after bills</p>
          <p className="mt-1 text-xl font-semibold text-zinc-950">
            {formatCurrency(plan.remainingAfterMandatory)}
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Lowest projected balance</p>
          <p className="mt-1 text-xl font-semibold text-zinc-950">
            {formatCurrency(plan.lowestBalance)}
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Next payment</p>
          <p className="mt-1 text-xl font-semibold text-zinc-950">
            {plan.nextEvent?.name ?? "None"}
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Amount</p>
          <p className="mt-1 text-xl font-semibold text-zinc-950">
            {plan.nextEvent ? formatCurrency(plan.nextEvent.amount) : "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
