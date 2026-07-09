import { MonthlyOutlookCard } from "@/components/MonthlyOutlookCard";

export default function DashboardPage() {
  const currentBalance = 3164;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm text-zinc-500">Finance Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Good evening, Josh
          </h1>
        </header>

        <MonthlyOutlookCard currentBalance={currentBalance} />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Current balance</p>
            <p className="mt-2 text-2xl font-semibold">€3,164</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Disposable</p>
            <p className="mt-2 text-2xl font-semibold">Coming soon</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Bills remaining</p>
            <p className="mt-2 text-2xl font-semibold">Coming soon</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Safe daily spend</p>
            <p className="mt-2 text-2xl font-semibold">Coming soon</p>
          </div>
        </section>
      </div>
    </main>
  );
}
