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
  currency: "EUR" | "GBP";
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

export interface ForecastItem {
  id: string;
  name: string;
  amount: number;
  type: CommitmentType;
  confidence: "known" | "estimated" | "optional";
}

export interface MonthlyPlan {
  month: string;
  openingBalance: number;
  expectedIncome: number;
  commitments: Commitment[];
  forecastItems: ForecastItem[];
  safetyBuffer: number;
}

export interface FinancialPosition {
  availableToday: number;
  knownCommitments: number;
  estimatedRemainingSpend: number;
  safetyBuffer: number;
  safeToSpend: number;
  expectedIncome: number;
  projectedMonthEnd: number;
}