export type Currency = "EUR" | "GBP";

export type AccountType = "current" | "savings" | "credit_card" | "investment";

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

export type RecurrenceFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export type AmountStrategy = "fixed" | "estimated" | "latest" | "average";

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

export type ReserveStatus = "planned" | "reserved" | "fulfilled";

export interface Reserve {
  id: string;
  name: string;
  amount: number;
  type: CommitmentType;
  dueDate?: string;
  mandatory: boolean;
  status: ReserveStatus;
  fulfilledDate?: string;
  confidence: Confidence;
}

export type AllocationSource = "commitment" | "forecast" | "reserve";

export type AllocationConfidence = Confidence | ForecastItem["confidence"];

export interface Allocation {
  id: string;
  sourceId: string;
  name: string;
  amount: number;
  type: CommitmentType;
  source: AllocationSource;
  confidence: AllocationConfidence;
  mandatory: boolean;
  dueDate?: string;
}

export type FinancialHealth = "healthy" | "warning" | "critical";

export interface FinancialStatus {
  health: FinancialHealth;
  title: string;
  description: string;
}

export interface SafeToSpendAccountRow {
  id: string;
  name: string;
  amount: number;
}

export interface SafeToSpendCommitmentRow {
  id: string;
  name: string;
  amount: number;
  dueDate?: string;
  confidence: Confidence;
}

/**
 * Factual explanation of how much cash is genuinely
 * uncommitted right now.
 *
 * Forecast spending is deliberately excluded because it
 * represents expected behaviour rather than confirmed
 * obligations.
 */
export interface SafeToSpendBreakdown {
  accountBalances: SafeToSpendAccountRow[];
  commitments: SafeToSpendCommitmentRow[];

  availableCash: number;
  remainingCommitments: number;
  reservedMoney: number;
  safetyBuffer: number;
  safeToSpend: number;
}

export type ForecastConfidence = "low" | "medium" | "high";

/**
 * Predictive view of where the user is likely to finish
 * the current month.
 *
 * This remains distinct from Safe to Spend so the UI can
 * clearly separate facts from estimates.
 */
export interface ForecastSummary {
  currentCash: number;
  expectedIncome: number;
  remainingCommitments: number;
  expectedRemainingSpend: number;
  reservedMoney: number;
  projectedMonthEndBalance: number;
  confidence: ForecastConfidence;
  confidenceScore: number;
  explanation: string[];
}

export type FinancialBreakdownRowType =
  | "starting"
  | "commitment"
  | "forecast"
  | "reserve"
  | "buffer"
  | "result";

export interface FinancialBreakdownRow {
  id: string;
  label: string;
  amount: number;
  type: FinancialBreakdownRowType;
}

export interface FinancialPosition {
  availableToday: number;

  allocations: Allocation[];
  allocatedCash: number;

  knownCommitments: number;
  estimatedRemainingSpend: number;
  reservedCash: number;

  safetyBuffer: number;
  safeToSpend: number;
  expectedIncome: number;
  projectedMonthEnd: number;

  safeToSpendBreakdown: SafeToSpendBreakdown;
  forecastSummary: ForecastSummary;

  daysUntilPayday: number;
  dailyBudget: number;

  breakdown: FinancialBreakdownRow[];

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
