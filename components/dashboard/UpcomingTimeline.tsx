import type { CashFlowProjection } from "@/lib/cashflow/types";

interface UpcomingTimelineProps {
  events: CashFlowProjection[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export function UpcomingTimeline({ events }: UpcomingTimelineProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm text-zinc-500">Upcoming</p>
        <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
          What happens next
        </h2>
      </div>

      <div className="divide-y divide-zinc-100">
        {events.map((event) => (
          <div
            key={`${event.date}-${event.name}`}
            className="grid gap-3 py-4 sm:grid-cols-[120px_1fr_auto]"
          >
            <div>
              <p className="text-sm font-medium text-zinc-950">
                {formatDate(event.date)}
              </p>
            </div>

            <div>
              <p className="font-medium text-zinc-950">{event.name}</p>
              <p className="mt-1 text-sm text-zinc-500">
                Balance after {formatCurrency(event.balanceAfter)}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-lg font-semibold text-zinc-950">
                {event.amount > 0 ? "+" : ""}
                {formatCurrency(event.amount)}
              </p>
              <p className="mt-1 text-sm text-zinc-500">{event.category}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
