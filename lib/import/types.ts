export type ImportSource =
  | "aib"
  | "revolut"
  | "revolut-credit-card";

export type ImportAccountType =
  | "current"
  | "savings"
  | "credit_card";

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
   * Original bank-provided description. This should never be overwritten,
   * because it is useful for auditing and improving matching rules.
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
   * Additional bank-specific information that may later help matching,
   * deduplication or troubleshooting.
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

  /**
   * Allows future import runs to retain the original provider context.
   */
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