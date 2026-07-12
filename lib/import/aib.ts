import { parseCsv } from "./csv";
import type {
  CsvRow,
  ImportedTransaction,
  ImportResult,
  ImportWarning,
} from "./types";

const DEFAULT_AIB_ACCOUNT_ID = "aib-current";

function getFirstValue(
  row: CsvRow,
  possibleHeaders: string[]
): string {
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

  const isNegative =
    value.includes("(") ||
    value.trim().startsWith("-");

  const normalised = value
    .replace(/[€£$,\s]/g, "")
    .replace(/[()]/g, "");

  const amount = Number(normalised);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return isNegative
    ? -Math.abs(amount)
    : amount;
}

function parseAibDate(value: string): string | null {
  const trimmed = value.trim();

  const dayFirstMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/
  );

  if (dayFirstMatch) {
    const [, day, month, rawYear] = dayFirstMatch;

    const year =
      rawYear.length === 2
        ? `20${rawYear}`
        : rawYear;

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
  accountId: string,
  date: string,
  description: string,
  amount: number,
  balanceAfter?: number
): string {
  const value = [
    accountId,
    date,
    description,
    amount.toFixed(2),
    balanceAfter?.toFixed(2) ?? "",
  ].join("|");

  let hash = 0;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
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

    const rawDescription = getFirstValue(row, [
      "Description",
      "Transaction Details",
      "Details",
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
        "Debit Amount",
        "Debit",
        "Money Out",
        "Paid Out",
      ])
    );

    const credit = parseMoney(
      getFirstValue(row, [
        "Credit Amount",
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
          "The debit or credit amount could not be parsed.",
      });
      return;
    }

    /**
     * AIB exports additional description lines as separate
     * zero-value rows. They are not independent transactions.
     */
    if (debit === 0 && credit === 0) {
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
      parsedBalance === null ||
      getFirstValue(row, [
        "Balance",
        "Running Balance",
      ]) === ""
        ? undefined
        : parsedBalance;

    const externalAccountId = getFirstValue(row, [
      "Posted Account",
      "Account",
      "Account Number",
    ]);

    const accountId =
      externalAccountId || DEFAULT_AIB_ACCOUNT_ID;

    transactions.push({
      source: "aib",
      externalId: createExternalId(
        accountId,
        postedDate,
        rawDescription,
        amount,
        balanceAfter
      ),
      accountId,
      postedDate,
      rawDescription,
      amount,
      currency: "EUR",
      balanceAfter,
      metadata: {
        transactionType: getFirstValue(row, [
          "Transaction Type",
        ]),
      },
    });
  });

  const accountIds = [
    ...new Set(
      transactions.map(
        (transaction) => transaction.accountId
      )
    ),
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