import type {
  MerchantCategory,
} from "@/lib/merchants";

export type SpendingProfileConfidence =
  | "low"
  | "medium"
  | "high";

export interface SpendingHistoryPeriod {
  startDate: string;
  endDate: string;
  daysCovered: number;
  weeksCovered: number;
  monthsCovered: number;
}

export interface CategorySpendingProfile {
  category: MerchantCategory;

  transactionCount: number;
  merchantCount: number;

  totalSpent: number;
  averageTransactionAmount: number;

  averageDailySpend: number;
  averageWeeklySpend: number;
  averageMonthlySpend: number;

  firstSeen: string;
  lastSeen: string;

  history: SpendingHistoryPeriod;
  confidence: SpendingProfileConfidence;

  merchantIds: string[];
  merchantNames: string[];
}

export interface SpendingProfileSummary {
  profiles: CategorySpendingProfile[];

  totalCategories: number;
  totalTransactions: number;
  totalSpent: number;

  historyStartDate?: string;
  historyEndDate?: string;
  daysCovered: number;

  confidence: SpendingProfileConfidence;
}