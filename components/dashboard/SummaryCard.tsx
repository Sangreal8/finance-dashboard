type SummaryCardProps = {
  safeToSpend: string;
  currentBalance: string;
};

export default function SummaryCard({
  safeToSpend,
  currentBalance,
}: SummaryCardProps) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        Safe to spend
      </p>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-5xl font-semibold tracking-tight">{safeToSpend}</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            After planned bills, savings and known commitments, this is what you
            can spend without causing future-you problems.
          </p>
        </div>

        <div className="hidden rounded-2xl bg-neutral-100 px-4 py-3 text-right dark:bg-neutral-800 sm:block">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Current balance
          </p>
          <p className="mt-1 text-xl font-semibold">{currentBalance}</p>
        </div>
      </div>
    </section>
  );
}
