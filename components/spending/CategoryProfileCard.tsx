import type {
  CategorySpendingProfile,
  SpendingProfileConfidence,
} from "@/lib/forecasting";

interface CategoryProfileCardProps {
  profile: CategorySpendingProfile;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getConfidenceLabel(confidence: SpendingProfileConfidence) {
  const labels: Record<SpendingProfileConfidence, string> = {
    low: "Low confidence",
    medium: "Medium confidence",
    high: "High confidence",
  };

  return labels[confidence];
}

function getConfidenceClasses(confidence: SpendingProfileConfidence) {
  const classes: Record<SpendingProfileConfidence, string> = {
    low: "bg-amber-100 text-amber-800",
    medium: "bg-blue-50 text-blue-700",
    high: "bg-emerald-50 text-emerald-700",
  };

  return classes[confidence];
}

function formatCoverage(daysCovered: number) {
  if (daysCovered === 1) {
    return "1 day";
  }

  return `${daysCovered} days`;
}

export function CategoryProfileCard({ profile }: CategoryProfileCardProps) {
  return (
    <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Category</p>

          <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
            {profile.category}
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            {profile.transactionCount}{" "}
            {profile.transactionCount === 1 ? "transaction" : "transactions"}
            {" · "}
            {profile.merchantCount}{" "}
            {profile.merchantCount === 1 ? "merchant" : "merchants"}
          </p>
        </div>

        <span
          className={`self-start rounded-full px-3 py-1.5 text-xs font-medium ${getConfidenceClasses(
            profile.confidence,
          )}`}
        >
          {getConfidenceLabel(profile.confidence)}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Monthly average</p>

          <p className="mt-1 text-2xl font-semibold text-zinc-950">
            {formatCurrency(profile.averageMonthlySpend)}
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Weekly average</p>

          <p className="mt-1 text-2xl font-semibold text-zinc-950">
            {formatCurrency(profile.averageWeeklySpend)}
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Average transaction</p>

          <p className="mt-1 text-2xl font-semibold text-zinc-950">
            {formatCurrency(profile.averageTransactionAmount)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 border-t border-zinc-100 pt-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-zinc-950">
            Contributing merchants
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {profile.merchantNames.map((merchantName) => (
              <span
                key={merchantName}
                className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600"
              >
                {merchantName}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-950">History used</p>

          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Coverage</dt>

              <dd className="font-medium text-zinc-950">
                {formatCoverage(profile.history.daysCovered)}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">First transaction</dt>

              <dd className="font-medium text-zinc-950">
                {formatDate(profile.firstSeen)}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Last transaction</dt>

              <dd className="font-medium text-zinc-950">
                {formatDate(profile.lastSeen)}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Total analysed</dt>

              <dd className="font-medium text-zinc-950">
                {formatCurrency(profile.totalSpent)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}
