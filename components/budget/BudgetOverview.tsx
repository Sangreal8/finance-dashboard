import { budgetItems } from "@/data/budgetItems";
import { categories } from "@/data/categories";
import { getMonthlyBudgetTotal } from "@/lib/calculations/budgetTotals";

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-IE", {
    style: "currency",
    currency: "EUR",
  });

export default function BudgetOverview() {
  const month = "2026-07";
  const monthlyTotal = getMonthlyBudgetTotal(budgetItems, month);

  const groupedItems = budgetItems
    .filter((item) => item.month === month)
    .reduce<Record<string, typeof budgetItems>>((groups, item) => {
      const category = categories.find((cat) => cat.id === item.categoryId);
      const groupName = category?.group ?? "Misc";

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(item);

      return groups;
    }, {});

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Budget</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          July plan
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Planned commitments total {formatCurrency(monthlyTotal)}
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {Object.entries(groupedItems).map(([group, items]) => {
          const total = items.reduce(
            (sum, item) => sum + item.plannedAmount,
            0,
          );

          return (
            <div key={group}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{group}</h2>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {formatCurrency(total)}
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-neutral-100 px-4 py-4 last:border-b-0 dark:border-neutral-800"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {item.obligation} · {item.variability}
                      </p>
                    </div>

                    <p className="font-semibold">
                      {formatCurrency(item.plannedAmount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
