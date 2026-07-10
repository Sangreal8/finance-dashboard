export type Currency = "EUR" | "GBP";

export type AccountType =
  | "current"
  | "savings"
  | "credit_card"
  | "investment";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  includeInAvailableCash: boolean;
}

export type CommitmentType =
  | "essential"
  | "debt"
  | "subscription"
  | "childcare"
  | "legal"
  | "savings"
  | "discretionary";

export interface Commitment {
  id: string;
  name: string;
  amount: number;
  type: CommitmentType;
  dueDay: number;
  fixed: boolean;
  mandatory: boolean;
}

export interface IncomeItem {
  id: string;
  name: string;
  amount: number;
  expectedDay: number;
  confidence: "confirmed" | "estimated";
}

export interface ForecastItem {
  id: string;
  name: string;
  amount: number;
  type: CommitmentType;
  confidence: "known" | "estimated" | "optional";
}

export interface MonthlyPlan {
  month: string;
  commitments: Commitment[];
  income: IncomeItem[];
  forecastItems: ForecastItem[];
  safetyBuffer: number;
}

export type FinancialHealth = "healthy" | "warning" | "critical";

export interface FinancialStatus {
  health: FinancialHealth;
  title: string;
  description: string;
}

export interface FinancialPosition {
  availableToday: number;
  knownCommitments: number;
  estimatedRemainingSpend: number;
  safetyBuffer: number;
  safeToSpend: number;
  expectedIncome: number;
  projectedMonthEnd: number;
  financialStatus: FinancialStatus;
}

export interface FinanceTimelineEvent {
  id: string;
  date: string;
  name: string;
  amount: number;
  balanceAfter: number;
  category: string;
  confidence: "confirmed" | "estimated";
}