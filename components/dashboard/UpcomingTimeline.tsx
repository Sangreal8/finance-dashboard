import type { FinanceTimelineEvent } from "@/lib/finance/types";

interface UpcomingTimelineProps {
  events: FinanceTimelineEvent[];
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
  }).format(new Date(`${date}T12:00:00`));
}

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function UpcomingTimeline({ events }: UpcomingTimelineProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm text-zinc-500">Coming up</p>
        <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
          What happens next
        </h2>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No planned payments or income remaining.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100">
          {events.map((event) => (
            <div
              key={event.id}
              className="grid gap-3 py-4 sm:grid-cols-[120px_1fr_auto]"
            >
              <p className="text-sm font-medium text-zinc-950">
                {formatDate(event.date)}
              </p>

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

                <p className="mt-1 text-sm text-zinc-500">
                  {formatCategory(event.category)}
                  {event.confidence === "estimated" ? " · Estimated" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
