import { parseCsv } from "./csv";
import { generateTransactionIdentity } from "./identity";
import type {
  CsvRow,
  ImportedTransaction,
  ImportResult,
  ImportWarning,
  TransactionKind,
} from "./types";
import type { XlsxCellValue, XlsxWorkbook } from "./xlsx";

const REVOLUT_CURRENT_ACCOUNT_ID = "revolut-current";

const REVOLUT_SAVINGS_ACCOUNT_ID = "revolut-savings";

const REQUIRED_HEADERS = [
  "Type",
  "Product",
  "Started Date",
  "Completed Date",
  "Description",
  "Amount",
  "Fee",
  "Currency",
  "State",
  "Balance",
];

function getCell(
  row: Record<string, XlsxCellValue>,
  column: string,
): XlsxCellValue {
  return row[column] ?? null;
}

function getText(row: Record<string, XlsxCellValue>, column: string): string {
  const value = getCell(row, column);

  if (value === null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value).trim();
}

function getNumber(
  row: Record<string, XlsxCellValue>,
  column: string,
): number | null {
  const value = getCell(row, column);

  if (value === null || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalised = String(value)
    .trim()
    .replace(/[€£$,\s]/g, "")
    .replace(/[()]/g, "");

  const parsed = Number(normalised);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const isNegative =
    String(value).includes("(") || String(value).trim().startsWith("-");

  return isNegative ? -Math.abs(parsed) : parsed;
}

function formatIsoDate(year: number, month: number, day: number): string {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function parseDateValue(value: XlsxCellValue): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatIsoDate(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
    );
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);

  if (isoMatch) {
    return formatIsoDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3]),
    );
  }

  const dayFirstMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[,\s].*)?$/,
  );

  if (dayFirstMatch) {
    return formatIsoDate(
      Number(dayFirstMatch[3]),
      Number(dayFirstMatch[2]),
      Number(dayFirstMatch[1]),
    );
  }

  return null;
}

function getAccountId(product: string): string {
  return product.toLowerCase() === "savings"
    ? REVOLUT_SAVINGS_ACCOUNT_ID
    : REVOLUT_CURRENT_ACCOUNT_ID;
}

function getSuggestedKind(
  transactionType: string,
  amount: number,
): TransactionKind {
  const normalisedType = transactionType.toLowerCase();

  if (normalisedType === "card payment" || normalisedType === "rev payment") {
    return amount > 0 ? "refund" : "purchase";
  }

  if (normalisedType === "charge") {
    return "fee";
  }

  if (
    normalisedType === "transfer" ||
    normalisedType === "topup" ||
    normalisedType === "exchange"
  ) {
    return "transfer";
  }

  return "unknown";
}

function getTransactionAmount(
  transactionType: string,
  amount: number,
  fee: number,
): number {
  if (transactionType.toLowerCase() === "charge" && amount === 0 && fee > 0) {
    return -Math.abs(fee);
  }

  return amount;
}

function createMetadata(
  row: Record<string, XlsxCellValue>,
): Record<string, string> {
  return {
    transactionType: getText(row, "Type"),
    product: getText(row, "Product"),
    startedDate: getText(row, "Started Date"),
    completedDate: getText(row, "Completed Date"),
    state: getText(row, "State"),
    fee: getText(row, "Fee"),
  };
}

function buildAccounts(transactions: ImportedTransaction[]) {
  const accountIds = new Set(
    transactions.map((transaction) => transaction.accountId),
  );

  return [
    ...(accountIds.has(REVOLUT_CURRENT_ACCOUNT_ID)
      ? [
          {
            source: "revolut" as const,
            externalAccountId: REVOLUT_CURRENT_ACCOUNT_ID,
            name: "Revolut Current",
            type: "current" as const,
            currency: "EUR",
          },
        ]
      : []),

    ...(accountIds.has(REVOLUT_SAVINGS_ACCOUNT_ID)
      ? [
          {
            source: "revolut" as const,
            externalAccountId: REVOLUT_SAVINGS_ACCOUNT_ID,
            name: "Revolut Savings",
            type: "savings" as const,
            currency: "EUR",
          },
        ]
      : []),
  ];
}

function parseRevolutRows(
  headers: string[],
  rows: Array<Record<string, XlsxCellValue>>,
  fileTypeLabel: string,
): ImportResult {
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length > 0) {
    return {
      source: "revolut",
      accounts: [],
      transactions: [],
      warnings: [
        {
          code: "missing-field",
          message: `The Revolut ${fileTypeLabel} is missing required columns: ${missingHeaders.join(
            ", ",
          )}.`,
        },
      ],
    };
  }

  const transactions: ImportedTransaction[] = [];

  const warnings: ImportWarning[] = [];

  const seenExternalIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;

    const transactionType = getText(row, "Type");

    const product = getText(row, "Product");

    const rawDescription = getText(row, "Description");

    const state = getText(row, "State").toUpperCase();

    const currency = getText(row, "Currency").toUpperCase();

    if (!transactionType || !product || !rawDescription) {
      warnings.push({
        row: rowNumber,
        code: "missing-field",
        message:
          "The Revolut row is missing its type, product, or description.",
      });

      return;
    }

    if (state !== "COMPLETED") {
      warnings.push({
        row: rowNumber,
        code: "unsupported-row",
        message: `Skipped ${state || "unknown-state"} transaction "${rawDescription}".`,
      });

      return;
    }

    if (currency !== "EUR") {
      warnings.push({
        row: rowNumber,
        code: "unsupported-row",
        message: `Skipped ${currency || "unknown-currency"} transaction "${rawDescription}". Revolut Import v1 currently supports EUR only.`,
      });

      return;
    }

    const postedDate = parseDateValue(getCell(row, "Completed Date"));

    if (!postedDate) {
      warnings.push({
        row: rowNumber,
        code: "invalid-date",
        message: `Could not read the completed date for "${rawDescription}".`,
      });

      return;
    }

    const parsedAmount = getNumber(row, "Amount");

    const parsedFee = getNumber(row, "Fee");

    const parsedBalance = getNumber(row, "Balance");

    if (parsedAmount === null || parsedFee === null || parsedBalance === null) {
      warnings.push({
        row: rowNumber,
        code: "invalid-amount",
        message: `Could not read the amount, fee, or balance for "${rawDescription}".`,
      });

      return;
    }

    const amount = getTransactionAmount(
      transactionType,
      parsedAmount,
      parsedFee,
    );

    if (amount === 0) {
      warnings.push({
        row: rowNumber,
        code: "unsupported-row",
        message: `Skipped zero-value transaction "${rawDescription}".`,
      });

      return;
    }

    const accountId = getAccountId(product);

    const externalId = generateTransactionIdentity([
      accountId,
      transactionType,
      product,
      getText(row, "Started Date"),
      getText(row, "Completed Date"),
      rawDescription,
      amount.toFixed(2),
      parsedFee.toFixed(2),
      parsedBalance.toFixed(2),
      currency,
    ]);

    if (seenExternalIds.has(externalId)) {
      warnings.push({
        row: rowNumber,
        code: "duplicate-row",
        message: `Skipped duplicate Revolut transaction "${rawDescription}".`,
      });

      return;
    }

    seenExternalIds.add(externalId);

    const suggestedKind = getSuggestedKind(transactionType, amount);

    if (suggestedKind === "unknown") {
      warnings.push({
        row: rowNumber,
        code: "unsupported-row",
        message: `Imported unrecognised Revolut transaction type "${transactionType}" for review.`,
      });
    }

    transactions.push({
      source: "revolut",
      externalId,
      accountId,
      postedDate,
      rawDescription,
      amount,
      currency,
      balanceAfter: parsedBalance,
      suggestedKind,
      metadata: createMetadata(row),
    });
  });

  return {
    source: "revolut",
    accounts: buildAccounts(transactions),
    transactions,
    warnings,
  };
}

function convertCsvRows(rows: CsvRow[]): Array<Record<string, XlsxCellValue>> {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([header, value]) => [header.trim(), value]),
    ),
  );
}

export function parseRevolutWorkbook(workbook: XlsxWorkbook): ImportResult {
  return parseRevolutRows(workbook.headers, workbook.rows, "workbook");
}

export function parseRevolutCsv(csv: string): ImportResult {
  const rows = parseCsv(csv);

  if (rows.length === 0) {
    return {
      source: "revolut",
      accounts: [],
      transactions: [],
      warnings: [
        {
          code: "missing-field",
          message: "The Revolut CSV does not contain any transaction rows.",
        },
      ],
    };
  }

  const headers = Object.keys(rows[0]).map((header) => header.trim());

  return parseRevolutRows(headers, convertCsvRows(rows), "CSV");
}

export function parseRevolutCreditCardCsv(csv: string): ImportResult {
  void csv;

  return {
    source: "revolut-credit-card",
    accounts: [],
    transactions: [],
    warnings: [
      {
        code: "unsupported-row",
        message: "Revolut credit-card import has not been implemented yet.",
      },
    ],
  };
}
