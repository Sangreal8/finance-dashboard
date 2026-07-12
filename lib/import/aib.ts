import { parseCsv } from "./csv";
import type {
  CsvRow,
  ImportedTransaction,
  ImportResult,
  ImportWarning,
} from "./types";

const AIB_ACCOUNT_ID = "aib-current";

function getFirstValue(
  row: CsvRow,
  possibleHeaders: string[]
): string {
  for (const header of possibleHeaders) {
    const value = row[header];

    if (value !== undefined && value !== "") {
      return value;
    }
  }

  return "";
}

function parseMoney(value: string): number | null {
  if (!value.trim()) {
    return 0;
  }

  const normalised = value
    .replace(/[€£$,\s]/g, "")
    .replace(/[()]/g, "");

  const amount = Number(normalised);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return value.includes("(")
    ? -Math.abs(amount)
    : amount;
}

function parseAibDate(value: string): string | null {
  const trimmed = value.trim();

  const dayFirstMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  );

  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;

    return [
      year,
      month.padStart(2, "0"),
      day.padStart(2, "0"),
    ].join("-");
  }

  const isoMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (isoMatch) {
    return trimmed;
  }

  return null;
}

function createExternalId(
  date: string,
  description: string,
  amount: number,
  balanceAfter?: number
): string {
  const value = [
    date,
    description,
    amount.toFixed(2),
    balanceAfter?.toFixed(2) ?? "",
  ].join("|");

  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash =
      (hash * 31 + value.charCodeAt(index)) |
      0;
  }

  return Math.abs(hash).toString(36);
}

export function parseAibCsv(
  csv: string
): ImportResult {
  const rows = parseCsv(csv);

  const transactions: ImportedTransaction[] = [];
  const warnings: ImportWarning[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;

    const rawDate = getFirstValue(row, [
      "Date",
      "Transaction Date",
      "Posted Date",
    ]);

    const postedDate = parseAibDate(rawDate);

    if (!postedDate) {
      warnings.push({
        row: rowNumber,
        code: "invalid-date",
        message: `Could not read the transaction date "${rawDate}".`,
      });
      return;
    }

    const rawDescription = getFirstValue(row, [
      "Description",
      "Details",
      "Transaction Details",
      "Narrative",
    ]);

    if (!rawDescription) {
      warnings.push({
        row: rowNumber,
        code: "missing-field",
        message:
          "The transaction does not contain a description.",
      });
      return;
    }

    const debit = parseMoney(
      getFirstValue(row, [
        "Debit",
        "Money Out",
        "Paid Out",
      ])
    );

    const credit = parseMoney(
      getFirstValue(row, [
        "Credit",
        "Money In",
        "Paid In",
      ])
    );

    if (debit === null || credit === null) {
      warnings.push({
        row: rowNumber,
        code: "invalid-amount",
        message:
          "The transaction debit or credit could not be parsed.",
      });
      return;
    }

    const amount =
      Math.abs(credit) > 0
        ? Math.abs(credit)
        : -Math.abs(debit);

    const parsedBalance = parseMoney(
      getFirstValue(row, [
        "Balance",
        "Running Balance",
      ])
    );

    const balanceAfter =
      parsedBalance === null
        ? undefined
        : parsedBalance;

    transactions.push({
      source: "aib",
      externalId: createExternalId(
        postedDate,
        rawDescription,
        amount,
        balanceAfter
      ),
      accountId: AIB_ACCOUNT_ID,
      postedDate,
      rawDescription,
      amount,
      currency: "EUR",
      balanceAfter,
    });
  });

  return {
    source: "aib",
    accounts: [
      {
        source: "aib",
        externalAccountId: AIB_ACCOUNT_ID,
        name: "AIB Current",
        type: "current",
        currency: "EUR",
      },
    ],
    transactions,
    warnings,
  };
}