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
import type { StoredCombinedImportSnapshot } from "@/lib/import";
import type { EnrichedTransaction, MerchantProfile } from "@/lib/merchants";
import type { ReconciliationSummary } from "@/lib/reconciliation";

export type PlanningDataSource = "manual" | "combined-import";

export interface PlanningDataFreshness {
  source: PlanningDataSource;
  importedAt?: string;
  sourceFileNames?: string[];
  latestTransactionDate?: string;
  latestBalanceDate?: string;
  includesAib?: boolean;
  includesRevolut?: boolean;
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

  importedSnapshot: StoredCombinedImportSnapshot | null;

  transactions: EnrichedTransaction[];
  merchantProfiles: MerchantProfile[];

  spendingProfiles: SpendingProfileSummary | null;
  forecasts: PlanningForecasts;

  reconciliation: ReconciliationSummary | null;
}
