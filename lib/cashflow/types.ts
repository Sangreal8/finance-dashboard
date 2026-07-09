export type CashFlowCategory =
  | "Income"
  | "Housing"
  | "Utilities"
  | "Debt"
  | "Food"
  | "Transport"
  | "Legal"
  | "Childcare"
  | "Savings"
  | "Lifestyle"
  | "Other";

export interface CashFlowEvent {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  amount: number; // positive = income, negative = expense
  category: CashFlowCategory;
  mandatory: boolean;
  fixed: boolean;
}

export interface CashFlowProjection {
  date: string;
  name: string;
  amount: number;
  balanceAfter: number;
  category: CashFlowCategory;
  mandatory: boolean;
  fixed: boolean;
}