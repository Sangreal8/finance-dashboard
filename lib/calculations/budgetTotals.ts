import type { BudgetItem } from "@/types/budget";

export function getMonthlyBudgetTotal(
  budgetItems: BudgetItem[],
  month: string
) {
  return budgetItems
    .filter((item) => item.month === month)
    .reduce((sum, item) => sum + item.plannedAmount, 0);
}