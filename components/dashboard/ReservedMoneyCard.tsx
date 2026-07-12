import type { Reserve } from "@/lib/finance/types";

interface ReservedMoneyCardProps {
  reserves: Reserve[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date?: string) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

export function ReservedMoneyCard({ reserves }: ReservedMoneyCardProps) {
  const activeReserves = reserves.filter((reserve) => reserve.active);

  const reservedTotal = activeReserves
    .filter((reserve) => reserve.reserved)
    .reduce((total, reserve) => total + reserve.amount, 0);

  const plannedTotal = activeReserves
    .filter((reserve) => !reserve.reserved)
    .reduce((total, reserve) => total + reserve.amount, 0);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Money reserved</p>

          <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
            {formatCurrency(reservedTotal)}
          </h2>

          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Money you have deliberately set aside for future costs. Reserved
            amounts already reduce your Safe to Spend.
          </p>
        </div>

        {plannedTotal > 0 && (
          <div className="rounded-2xl bg-zinc-100 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Future plans
            </p>

            <p className="mt-1 text-lg font-semibold text-zinc-950">
              {formatCurrency(plannedTotal)}
            </p>

            <p className="mt-1 text-xs text-zinc-500">Not reserved yet</p>
          </div>
        )}
      </div>

      <div className="mt-6 divide-y divide-zinc-100">
        {activeReserves.map((reserve) => {
          const dueDate = formatDate(reserve.dueDate);

          return (
            <div
              key={reserve.id}
              className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-zinc-950">{reserve.name}</p>

                  <span
                    className={
                      reserve.reserved
                        ? "rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white"
                        : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                    }
                  >
                    {reserve.reserved ? "Reserved" : "Planned"}
                  </span>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  {dueDate ? `Due ${dueDate}` : "No due date"}
                  {reserve.confidence === "estimated" ? " · Estimated" : ""}
                </p>
              </div>

              <p className="text-lg font-semibold text-zinc-950">
                {formatCurrency(reserve.amount)}
              </p>
            </div>
          );
        })}

        {activeReserves.length === 0 && (
          <p className="py-4 text-sm text-zinc-500">
            You have not reserved money for any future costs yet.
          </p>
        )}
      </div>
    </section>
  );
}
