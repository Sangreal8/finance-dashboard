export type Obligation = "required" | "optional";

export type Variability = "fixed" | "variable";

export type BudgetItem = {
  id: string;
  month: string;
  categoryId: string;
  name: string;
  plannedAmount: number;
  obligation: Obligation;
  variability: Variability;
};