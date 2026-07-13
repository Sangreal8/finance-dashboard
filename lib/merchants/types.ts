import type { TransactionKind } from "@/lib/import";
import type { TransactionCategory } from "@/types/transaction";

export type MerchantCategory =
  | TransactionCategory
  | "Uncategorised";

export interface MerchantProfile {
  id: string;
  name: string;

  category: MerchantCategory;
  kind: TransactionKind;

  transactionCount: number;
  outgoingTransactionCount: number;
  incomingTransactionCount: number;

  totalSpent: number;
  totalReceived: number;
  averageTransactionAmount: number;
  averageOutgoingAmount: number;

  firstSeen: string;
  lastSeen: string;

  recurring: boolean;
  includeInForecast: boolean;
  recognised: boolean;

  rawDescriptions: string[];
}

export interface MerchantLibrarySummary {
  merchants: MerchantProfile[];

  totalMerchants: number;
  recognisedMerchants: number;
  uncategorisedMerchants: number;
  recurringMerchants: number;
  forecastMerchants: number;
}