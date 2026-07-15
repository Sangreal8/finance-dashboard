import { parseCsv } from "./csv";
import { generateTransactionIdentity } from "./identity";
import type {
  CsvRow,
  ImportedTransaction,
  ImportResult,
  ImportWarning,
} from "./types";

const DEFAULT_AIB_ACCOUNT_ID = "aib-current";

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

function getDescription(row: CsvRow): string {
  const standardDescription = getFirstValue(row, [
    "Description",
    "Transaction Details",
    "Details",
    "Narrative",
  ]);

  if (standardDescription) {
    return standardDescription;
  }

  /**
   * AIB's longer historical export separates the
   * transaction narrative across three columns.
   */
  return [
    getFirstValue(row, ["Description1"]),
    getFirstValue(row, ["Description2"]),
    getFirstValue(row, ["Description3"]),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
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

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return trimmed;
  }

  return null;
}

function createExternalId({
  accountId,
  postedDate,
  rawDescription,
  amount,
  balanceAfter,
}: {
  accountId: string;
  postedDate: string;
  rawDescription: string;
  amount: number;
  balanceAfter?: number;
}): string {
  return generateTransactionIdentity([
    accountId,
    postedDate,
    rawDescription,
    amount.toFixed(2),
    balanceAfter?.toFixed(2) ?? "",
  ]);
}

export function parseAibCsv(csv: string): ImportResult {
  const rows = parseCsv(csv);

  const transactions: ImportedTransaction[] = [];

  const warnings: ImportWarning[] = [];

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

    const rawDescription = getDescription(row);

    if (!rawDescription) {
      warnings.push({
        row: rowNumber,
        code: "missing-field",
        message: "The transaction does not contain a description.",
      });

      return;
    }

    const debit = parseMoney(
      getFirstValue(row, ["Debit Amount", "Debit", "Money Out", "Paid Out"]),
    );

    const credit = parseMoney(
      getFirstValue(row, ["Credit Amount", "Credit", "Money In", "Paid In"]),
    );

    if (debit === null || credit === null) {
      warnings.push({
        row: rowNumber,
        code: "invalid-amount",
        message: "The debit or credit amount could not be parsed.",
      });

      return;
    }

    /**
     * AIB exports can include additional description rows
     * with no financial value. They are not independent
     * transactions.
     */
    if (debit === 0 && credit === 0) {
      return;
    }

    const amount = Math.abs(credit) > 0 ? Math.abs(credit) : -Math.abs(debit);

    const rawBalance = getFirstValue(row, ["Balance", "Running Balance"]);

    const parsedBalance = parseMoney(rawBalance);

    const balanceAfter =
      parsedBalance === null || rawBalance === "" ? undefined : parsedBalance;

    const externalAccountId = getFirstValue(row, [
      "Posted Account",
      "Account",
      "Account Number",
    ]);

    const accountId = externalAccountId || DEFAULT_AIB_ACCOUNT_ID;

    const currency =
      getFirstValue(row, ["Posted Currency", "Currency"]).toUpperCase() ||
      "EUR";

    transactions.push({
      source: "aib",

      externalId: createExternalId({
        accountId,
        postedDate,
        rawDescription,
        amount,
        balanceAfter,
      }),

      accountId,
      postedDate,
      rawDescription,
      amount,
      currency,
      balanceAfter,

      metadata: {
        transactionType: getFirstValue(row, ["Transaction Type"]),

        description1: getFirstValue(row, ["Description1"]),

        description2: getFirstValue(row, ["Description2"]),

        description3: getFirstValue(row, ["Description3"]),
      },
    });
  });

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
