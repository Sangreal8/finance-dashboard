export type ImportSource =
  | "aib"
  | "revolut"
  | "revolut-credit-card";

export type ImportAccountType =
  | "current"
  | "savings"
  | "credit_card";

export type TransactionKind =
  | "purchase"
  | "income"
  | "transfer"
  | "fee"
  | "refund"
  | "unknown";

export interface MerchantAliasRule {
  merchantName: string;
  kind: Exclude<TransactionKind, "unknown">;
  patterns: RegExp[];
}

export interface ImportAccount {
  source: ImportSource;
  externalAccountId?: string;
  name: string;
  type: ImportAccountType;
  currency: string;
}

export interface ImportedTransaction {
  source: ImportSource;

  /**
   * Stable identifier from the provider when one exists.
   * A deterministic identifier can be generated during parsing otherwise.
   */
  externalId: string;

  accountId: string;
  postedDate: string;

  /**
   * Original bank-provided description. This should never be overwritten.
   */
  rawDescription: string;

  /**
   * Positive values represent money entering the account.
   * Negative values represent money leaving the account.
   */
  amount: number;

  currency: string;
  balanceAfter?: number;

  /**
   * Bank-specific context that can help later matching and reconciliation.
   */
  metadata?: Record<string, string>;
}

export interface NormalisedTransaction {
  id: string;
  source: ImportSource;
  externalId: string;
  accountId: string;
  postedDate: string;

  rawDescription: string;
  normalisedDescription: string;
  merchantName: string;

  amount: number;
  currency: string;
  balanceAfter?: number;

  kind: TransactionKind;
  recognised: boolean;

  metadata?: Record<string, string>;
}

export interface ImportResult {
  source: ImportSource;
  accounts: ImportAccount[];
  transactions: ImportedTransaction[];
  warnings: ImportWarning[];
}

export interface ImportWarning {
  row?: number;
  code:
    | "missing-field"
    | "invalid-date"
    | "invalid-amount"
    | "unsupported-row"
    | "duplicate-row";
  message: string;
}

export interface CsvRow {
  [column: string]: string;
}