import { Transaction } from "@/types/transaction";

export function totalIncome(transactions: Transaction[]) {
  return transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}