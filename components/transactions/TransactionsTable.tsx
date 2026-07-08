import { transactions } from "@/data/transactions";
import AddTransactionDialog from "./AddTransactionDialog";

export default function TransactionsTable() {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Transactions
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Recent activity
          </h1>
        </div>

        <AddTransactionDialog />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <td className="px-4 py-4 text-neutral-500 dark:text-neutral-400">
                  {new Date(transaction.date).toLocaleDateString("en-IE", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>

                <td className="px-4 py-4 font-medium">
                  {transaction.description}
                </td>

                <td className="px-4 py-4">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {transaction.category}
                  </span>
                </td>

                <td className="px-4 py-4 text-neutral-500 dark:text-neutral-400">
                  {transaction.account}
                </td>

                <td
                  className={`px-4 py-4 text-right font-semibold ${
                    transaction.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-neutral-950 dark:text-neutral-50"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : "-"}€
                  {Math.abs(transaction.amount).toLocaleString("en-IE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
