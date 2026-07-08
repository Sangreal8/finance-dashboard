export type TransactionType = "income" | "expense";

export type TransactionCategory =
  | "Income"
  | "Groceries"
  | "Bills"
  | "Fuel"
  | "Eating out"
  | "Shopping"
  | "Legal"
  | "Savings"
  | "Other";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: TransactionCategory;
  amount: number;
  type: TransactionType;
  account: string;
  notes?: string;
  recurring?: boolean;
  cleared: boolean;
};