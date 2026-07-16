import type { Reserve, ReserveStatus } from "@/lib/finance/types";

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
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getStatusLabel(status: ReserveStatus) {
  const labels: Record<ReserveStatus, string> = {
    planned: "Planned",
    reserved: "Reserved",
    fulfilled: "Fulfilled",
  };

  return labels[status];
}

function getStatusClass(status: ReserveStatus) {
  if (status === "reserved") {
    return "bg-zinc-900 text-white";
  }

  if (status === "fulfilled") {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-zinc-100 text-zinc-600";
}

function ReserveRow({ reserve }: { reserve: Reserve }) {
  const dueDate = formatDate(reserve.dueDate);

  const fulfilledDate = formatDate(reserve.fulfilledDate);

  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-zinc-950">{reserve.name}</p>

          <span
            className={`rounded-full px-2 py-0.5 text-xs ${getStatusClass(
              reserve.status,
            )}`}
          >
            {getStatusLabel(reserve.status)}
          </span>
        </div>

        <p className="mt-1 text-sm text-zinc-500">
          {reserve.status === "fulfilled" && fulfilledDate
            ? `Completed ${fulfilledDate}`
            : dueDate
              ? `Due ${dueDate}`
              : "No due date"}

          {reserve.confidence === "estimated" ? " · Estimated" : ""}
        </p>
      </div>

      <p className="text-lg font-semibold text-zinc-950">
        {formatCurrency(reserve.amount)}
      </p>
    </div>
  );
}

export function ReservedMoneyCard({ reserves }: ReservedMoneyCardProps) {
  const currentlyReserved = reserves.filter(
    (reserve) => reserve.status === "reserved",
  );

  const plannedReserves = reserves.filter(
    (reserve) => reserve.status === "planned",
  );

  const fulfilledReserves = reserves.filter(
    (reserve) => reserve.status === "fulfilled",
  );

  const reservedTotal = currentlyReserved.reduce(
    (total, reserve) => total + reserve.amount,
    0,
  );

  const plannedTotal = plannedReserves.reduce(
    (total, reserve) => total + reserve.amount,
    0,
  );

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_1px_0_0_rgba(15,23,42,0.04)] sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Money reserved</p>

          <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
            {formatCurrency(reservedTotal)}
          </h2>

          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Money currently protected for future costs. Only active reserves
            reduce your Safe to Spend.
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

      {currentlyReserved.length > 0 ? (
        <div className="mt-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
            Currently reserved
          </p>

          <div className="divide-y divide-zinc-100">
            {currentlyReserved.map((reserve) => (
              <ReserveRow key={reserve.id} reserve={reserve} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
          <p className="text-sm font-medium text-zinc-950">
            No money is currently reserved
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Your planned costs remain visible below, but they do not yet reduce
            Safe to Spend.
          </p>
        </div>
      )}

      {plannedReserves.length > 0 && (
        <div className="mt-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
            Future plans
          </p>

          <div className="divide-y divide-zinc-100">
            {plannedReserves.map((reserve) => (
              <ReserveRow key={reserve.id} reserve={reserve} />
            ))}
          </div>
        </div>
      )}

      {fulfilledReserves.length > 0 && (
        <div className="mt-6 border-t border-zinc-100 pt-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
            Recently fulfilled
          </p>

          <div className="divide-y divide-zinc-100">
            {fulfilledReserves.map((reserve) => (
              <ReserveRow key={reserve.id} reserve={reserve} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
