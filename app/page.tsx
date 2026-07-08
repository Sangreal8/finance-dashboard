const upcomingPayments = [
  { name: "Mortgage", date: "Tomorrow", amount: "€903" },
  { name: "Electricity", date: "12 Jul", amount: "€86" },
  { name: "Gym", date: "15 Jul", amount: "€45" },
];

const budgetCategories = [
  { name: "Groceries", spent: "€142", remaining: "€208" },
  { name: "Eating out", spent: "€76", remaining: "€124" },
  { name: "Fuel", spent: "€48", remaining: "€72" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 px-5 py-6 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              July 2026
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Good evening, Josh
            </h1>
          </div>

          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950 dark:text-emerald-300">
            On track
          </div>
        </header>

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Safe to spend
          </p>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-5xl font-semibold tracking-tight">€482</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                After planned bills, savings and known commitments, this is what
                you can spend without causing future-you problems.
              </p>
            </div>

            <div className="hidden rounded-2xl bg-neutral-100 px-4 py-3 text-right dark:bg-neutral-800 sm:block">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Current balance
              </p>
              <p className="mt-1 text-xl font-semibold">€3,164</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Bills remaining
            </p>
            <p className="mt-3 text-3xl font-semibold">€1,235</p>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Savings planned
            </p>
            <p className="mt-3 text-3xl font-semibold">€250</p>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Discretionary spent
            </p>
            <p className="mt-3 text-3xl font-semibold">41%</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold tracking-tight">Upcoming</h2>

            <div className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
              {upcomingPayments.map((payment) => (
                <div
                  key={payment.name}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium">{payment.name}</p>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {payment.date}
                    </p>
                  </div>
                  <p className="font-semibold">{payment.amount}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold tracking-tight">
              Spending check
            </h2>

            <div className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
              {budgetCategories.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {category.spent} spent
                    </p>
                  </div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    {category.remaining} left
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
