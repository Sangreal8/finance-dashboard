const budgetCategories = [
  { name: "Groceries", spent: "€142", remaining: "€208" },
  { name: "Eating out", spent: "€76", remaining: "€124" },
  { name: "Fuel", spent: "€48", remaining: "€72" },
];

export default function SpendingCheck() {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-lg font-semibold tracking-tight">Spending check</h2>

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
  );
}
