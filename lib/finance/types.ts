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

export type RecurrenceFrequency =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type AmountStrategy =
  | "fixed"
  | "estimated"
  | "latest"
  | "average";

export type Confidence = "confirmed" | "estimated";

export type PlannedCommitmentStatus =
  | "planned"
  | "matched"
  | "paid"
  | "missed"
  | "cancelled";

export interface RecurringCommitment {
  id: string;
  name: string;
  amount: number;
  amountStrategy: AmountStrategy;
  type: CommitmentType;
  frequency: RecurrenceFrequency;

  dueDay?: number;
  dueMonth?: number;

  mandatory: boolean;
  active: boolean;

  startsOn: string;
  endsOn?: string;

  confidence: Confidence;
  paymentAccountId?: string;
  merchantPatterns?: string[];
}

export interface PlannedCommitment {
  id: string;
  recurringCommitmentId: string;
  name: string;
  amount: number;
  type: CommitmentType;
  dueDate: string;
  mandatory: boolean;
  confidence: Confidence;
  status: PlannedCommitmentStatus;
  paymentAccountId?: string;
  merchantPatterns?: string[];
  matchedTransactionId?: string;
}

export interface IncomeItem {
  id: string;
  name: string;
  amount: number;
  expectedDay: number;
  confidence: Confidence;
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
  commitments: PlannedCommitment[];
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
  confidence: Confidence;
  status: PlannedCommitmentStatus | "expected";
}