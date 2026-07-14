export default function Header() {
  return (
    <header className="flex items-start justify-between">
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Wednesday, 8 July
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Good evening, Josh 👋
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Here&apos;s your financial snapshot.
        </p>
      </div>

      <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950 dark:text-emerald-300">
        On track
      </div>
    </header>
  );
}
