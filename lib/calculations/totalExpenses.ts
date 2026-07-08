import { Transaction } from "@/types/transaction";

export function totalExpenses(transactions: Transaction[]) {
  return Math.abs(
    transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)
  );
}