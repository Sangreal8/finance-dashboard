import type { ImportResult } from "./types";

export function parseRevolutCsv(
  _csv: string
): ImportResult {
  return {
    source: "revolut",
    accounts: [],
    transactions: [],
    warnings: [
      {
        code: "unsupported-row",
        message:
          "Revolut CSV import has not been implemented yet.",
      },
    ],
  };
}

export function parseRevolutCreditCardCsv(
  _csv: string
): ImportResult {
  return {
    source: "revolut-credit-card",
    accounts: [],
    transactions: [],
    warnings: [
      {
        code: "unsupported-row",
        message:
          "Revolut credit-card CSV import has not been implemented yet.",
      },
    ],
  };
}