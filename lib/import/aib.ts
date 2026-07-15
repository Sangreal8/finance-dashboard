import { parseCsv } from "./csv";
import {
  canonicaliseAibAccount,
  generateAibTransactionIdentity,
} from "./identity";
import type {
  CsvRow,
  ImportedTransaction,
  ImportResult,
  ImportWarning,
} from "./types";

const DEFAULT_AIB_ACCOUNT_ID = "aib-current";

interface ParsedAibRow {
  rowNumber: number;
  accountId: string;
  postedDate: string;
  description: string;
  amount: number;
  currency: string;
  balanceAfter?: number;
  transactionType: string;
  descriptionParts: string[];
}

function getNormalisedRow(row: CsvRow): CsvRow {
  return Object.fromEntries(
    Object.entries(row).map(([header, value]) => [header.trim(), value.trim()]),
  );
}

function getFirstValue(row: CsvRow, possibleHeaders: string[]): string {
  for (const header of possibleHeaders) {
    const value = row[header];

    if (value !== undefined && value.trim() !== "") {
      return value.trim();
    }
  }

  return "";
}

function parseMoney(value: string): number | null {
  if (!value.trim()) {
    return 0;
  }

  const isNegative = value.includes("(") || value.trim().startsWith("-");

  const normalised = value.replace(/[€£$,\s]/g, "").replace(/[()]/g, "");

  const amount = Number(normalised);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return isNegative ? -Math.abs(amount) : amount;
}

function parseAibDate(value: string): string | null {
  const trimmed = value.trim();

  const dayFirstMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/,
  );

  if (dayFirstMatch) {
    const [, day, month, rawYear] = dayFirstMatch;

    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;

    return [year, month.padStart(2, "0"), day.padStart(2, "0")].join("-");
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function getAmount(row: CsvRow): number | null {
  const debit = parseMoney(
    getFirstValue(row, ["Debit Amount", "Debit", "Money Out", "Paid Out"]),
  );

  const credit = parseMoney(
    getFirstValue(row, ["Credit Amount", "Credit", "Money In", "Paid In"]),
  );

  if (debit === null || credit === null) {
    return null;
  }

  if (debit === 0 && credit === 0) {
    return 0;
  }

  return Math.abs(credit) > 0 ? Math.abs(credit) : -Math.abs(debit);
}

function getBalance(row: CsvRow): number | undefined | null {
  const rawBalance = getFirstValue(row, ["Balance", "Running Balance"]);

  if (!rawBalance) {
    return undefined;
  }

  return parseMoney(rawBalance);
}

function getHistoricalDescriptionParts(row: CsvRow): string[] {
  return [
    getFirstValue(row, ["Description1"]),
    getFirstValue(row, ["Description2"]),
    getFirstValue(row, ["Description3"]),
  ].filter(Boolean);
}

function getRegularDescription(row: CsvRow): string {
  return getFirstValue(row, [
    "Description",
    "Transaction Details",
    "Details",
    "Narrative",
  ]);
}

function joinDescriptionParts(parts: string[]): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function isHistoricalExport(rows: CsvRow[]): boolean {
  if (rows.length === 0) {
    return false;
  }

  const headers = Object.keys(getNormalisedRow(rows[0]));

  return headers.includes("Description1");
}

function parseHistoricalRows(
  rows: CsvRow[],
  warnings: ImportWarning[],
): ParsedAibRow[] {
  const parsedRows: ParsedAibRow[] = [];

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const row = getNormalisedRow(rawRow);

    const rawDate = getFirstValue(row, [
      "Posted Transactions Date",
      "Transaction Date",
      "Posted Date",
      "Date",
    ]);

    const postedDate = parseAibDate(rawDate);

    if (!postedDate) {
      warnings.push({
        row: rowNumber,
        code: "invalid-date",
        message: `Could not read transaction date "${rawDate}".`,
      });

      return;
    }

    const descriptionParts = getHistoricalDescriptionParts(row);

    const description = joinDescriptionParts(descriptionParts);

    if (!description) {
      warnings.push({
        row: rowNumber,
        code: "missing-field",
        message: "The transaction does not contain a description.",
      });

      return;
    }

    const amount = getAmount(row);

    if (amount === null) {
      warnings.push({
        row: rowNumber,
        code: "invalid-amount",
        message: "The debit or credit amount could not be parsed.",
      });

      return;
    }

    if (amount === 0) {
      return;
    }

    const balanceAfter = getBalance(row);

    if (balanceAfter === null) {
      warnings.push({
        row: rowNumber,
        code: "invalid-amount",
        message: "The running balance could not be parsed.",
      });

      return;
    }

    const rawAccountId = getFirstValue(row, [
      "Posted Account",
      "Account",
      "Account Number",
    ]);

    const accountId = canonicaliseAibAccount(
      rawAccountId || DEFAULT_AIB_ACCOUNT_ID,
    );

    const currency =
      getFirstValue(row, ["Posted Currency", "Currency"]).toUpperCase() ||
      "EUR";

    parsedRows.push({
      rowNumber,
      accountId,
      postedDate,
      description,
      amount,
      currency,
      balanceAfter,
      transactionType: getFirstValue(row, ["Transaction Type"]),
      descriptionParts,
    });
  });

  return parsedRows;
}

function parseRegularRows(
  rows: CsvRow[],
  warnings: ImportWarning[],
): ParsedAibRow[] {
  const parsedRows: ParsedAibRow[] = [];
  let pendingTransaction: ParsedAibRow | null = null;

  function flushPending() {
    if (!pendingTransaction) {
      return;
    }

    pendingTransaction.description = joinDescriptionParts(
      pendingTransaction.descriptionParts,
    );

    parsedRows.push(pendingTransaction);
    pendingTransaction = null;
  }

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const row = getNormalisedRow(rawRow);

    const rawDate = getFirstValue(row, [
      "Posted Transactions Date",
      "Transaction Date",
      "Posted Date",
      "Date",
    ]);

    const postedDate = parseAibDate(rawDate);

    if (!postedDate) {
      warnings.push({
        row: rowNumber,
        code: "invalid-date",
        message: `Could not read transaction date "${rawDate}".`,
      });

      return;
    }

    const description = getRegularDescription(row);
    const amount = getAmount(row);
    const balanceAfter = getBalance(row);

    if (amount === null || balanceAfter === null) {
      warnings.push({
        row: rowNumber,
        code: "invalid-amount",
        message: "The amount or running balance could not be parsed.",
      });

      return;
    }

    /**
     * Regular AIB exports represent extra narrative fields
     * as zero-value continuation rows immediately following
     * the financial transaction.
     */
    if (amount === 0) {
      if (pendingTransaction && pendingTransaction.postedDate === postedDate) {
        if (description) {
          pendingTransaction.descriptionParts.push(description);
        }

        if (balanceAfter !== undefined) {
          pendingTransaction.balanceAfter = balanceAfter;
        }
      }

      return;
    }

    flushPending();

    if (!description) {
      warnings.push({
        row: rowNumber,
        code: "missing-field",
        message: "The transaction does not contain a description.",
      });

      return;
    }

    const rawAccountId = getFirstValue(row, [
      "Posted Account",
      "Account",
      "Account Number",
    ]);

    const accountId = canonicaliseAibAccount(
      rawAccountId || DEFAULT_AIB_ACCOUNT_ID,
    );

    pendingTransaction = {
      rowNumber,
      accountId,
      postedDate,
      description,
      amount,
      currency: "EUR",
      balanceAfter,
      transactionType: getFirstValue(row, ["Transaction Type"]),
      descriptionParts: [description],
    };
  });

  flushPending();

  return parsedRows;
}

function buildTransactions(parsedRows: ParsedAibRow[]): ImportedTransaction[] {
  const occurrences = new Map<string, number>();

  return parsedRows.map((row) => {
    const baseOccurrenceKey = [
      row.accountId,
      row.postedDate,
      row.amount.toFixed(2),
      row.description
        .normalize("NFKC")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase(),
    ].join("|");

    const occurrence = (occurrences.get(baseOccurrenceKey) ?? 0) + 1;

    occurrences.set(baseOccurrenceKey, occurrence);

    return {
      source: "aib",
      externalId: generateAibTransactionIdentity({
        accountId: row.accountId,
        postedDate: row.postedDate,
        amount: row.amount,
        description: row.description,
        occurrence,
      }),
      accountId: row.accountId,
      postedDate: row.postedDate,
      rawDescription: row.description,
      amount: row.amount,
      currency: row.currency,
      balanceAfter: row.balanceAfter,
      metadata: {
        transactionType: row.transactionType,
        description1: row.descriptionParts[0] ?? "",
        description2: row.descriptionParts[1] ?? "",
        description3: row.descriptionParts.slice(2).join(" "),
      },
    };
  });
}

export function parseAibCsv(csv: string): ImportResult {
  const rows = parseCsv(csv);
  const warnings: ImportWarning[] = [];

  const parsedRows = isHistoricalExport(rows)
    ? parseHistoricalRows(rows, warnings)
    : parseRegularRows(rows, warnings);

  const transactions = buildTransactions(parsedRows);

  const accountIds = [
    ...new Set(transactions.map((transaction) => transaction.accountId)),
  ];

  return {
    source: "aib",
    accounts: accountIds.map((accountId) => ({
      source: "aib",
      externalAccountId: accountId,
      name: "AIB Current",
      type: "current",
      currency: "EUR",
    })),
    transactions,
    warnings,
  };
}
