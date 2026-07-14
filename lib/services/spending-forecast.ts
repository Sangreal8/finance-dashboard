import {
  buildCategoryForecasts,
  buildSpendingProfileSummary,
} from "@/lib/forecasting";
import type {
  CategoryForecast,
  SpendingProfileSummary,
} from "@/lib/forecasting";
import { loadCombinedImportSnapshot } from "@/lib/import";
import {
  applyDefinitionsToTransactions,
  buildMerchantLibrary,
  loadMerchantDefinitions,
} from "@/lib/merchants";
import type { EnrichedTransaction } from "@/lib/merchants";

export interface SpendingForecastSnapshot {
  transactions: EnrichedTransaction[];
  spendingProfiles: SpendingProfileSummary;
  forecasts: CategoryForecast[];
}

function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getCurrentMonthStart(referenceDate: Date) {
  return formatLocalDate(
    new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
  );
}

function getCurrentMonthEnd(referenceDate: Date) {
  return formatLocalDate(
    new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0),
  );
}

export function buildStoredSpendingForecast(
  referenceDate = new Date(),
): SpendingForecastSnapshot | null {
  const importedSnapshot = loadCombinedImportSnapshot();

  if (!importedSnapshot) {
    return null;
  }

  const definitions = loadMerchantDefinitions();

  const merchants = buildMerchantLibrary(
    importedSnapshot.transactions,
    definitions,
  );

  const transactions = applyDefinitionsToTransactions(
    importedSnapshot.transactions,
    definitions,
    merchants,
  );

  const spendingProfiles = buildSpendingProfileSummary(transactions);

  const forecasts = buildCategoryForecasts({
    profiles: spendingProfiles.profiles,

    transactions,

    periodStartDate: getCurrentMonthStart(referenceDate),

    periodEndDate: getCurrentMonthEnd(referenceDate),
  });

  return {
    transactions,
    spendingProfiles,
    forecasts,
  };
}
