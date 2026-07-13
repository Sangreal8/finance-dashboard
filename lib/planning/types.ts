import type {
  CategoryForecast,
  SpendingProfileSummary,
} from "@/lib/forecasting";
import type {
  Account,
  FinanceTimelineEvent,
  FinancialPosition,
  ForecastItem,
  MonthlyPlan,
  Reserve,
} from "@/lib/finance/types";
import type {
  StoredAibImportSnapshot,
} from "@/lib/import";
import type {
  EnrichedTransaction,
  MerchantProfile,
} from "@/lib/merchants";
import type {
  ReconciliationSummary,
} from "@/lib/reconciliation";

export type PlanningDataSource =
  | "manual"
  | "aib-import";

export interface PlanningDataFreshness {
  source: PlanningDataSource;
  importedAt?: string;
  sourceFileName?: string;
  latestTransactionDate?: string;
  latestBalanceDate?: string;
}

export interface PlanningForecasts {
  /**
   * Existing manually maintained forecast items.
   * These remain the trusted values used by the finance engine.
   */
  active: ForecastItem[];

  /**
   * Forecasts calculated from transaction history.
   * These are currently informational and do not alter Safe to Spend.
   */
  calculated: CategoryForecast[];

  /**
   * Calculated forecasts that meet the minimum confidence threshold.
   * These can replace manual forecasts in a later commit.
   */
  eligible: ForecastItem[];

  mode: "manual";
}

export interface PlanningSnapshot {
  generatedAt: string;
  referenceDate: string;

  dataFreshness: PlanningDataFreshness;

  accounts: Account[];
  plan: MonthlyPlan;
  reserves: Reserve[];

  position: FinancialPosition;
  timeline: FinanceTimelineEvent[];

  importedSnapshot: StoredAibImportSnapshot | null;

  transactions: EnrichedTransaction[];
  merchantProfiles: MerchantProfile[];

  spendingProfiles: SpendingProfileSummary | null;
  forecasts: PlanningForecasts;

  reconciliation: ReconciliationSummary | null;
}