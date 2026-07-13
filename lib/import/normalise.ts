import { merchantAliases } from "@/data/merchantAliases";
import type {
  ImportedTransaction,
  NormalisedTransaction,
  TransactionKind,
} from "./types";

interface MerchantIdentification {
  merchantName: string;
  kind: TransactionKind;
  recognised: boolean;
}

export function normaliseDescription(
  description: string
): string {
  return description
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s&.'*\/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeAibPrefixes(
  description: string
): string {
  return description
    .replace(
      /^(VDA|VDC|VDP|D\/D)-?/i,
      ""
    )
    .trim();
}

function inferUnrecognisedKind(
  transaction: ImportedTransaction
): TransactionKind {
  if (transaction.amount > 0) {
    const transactionType =
      transaction.metadata?.transactionType
        ?.toLowerCase();

    if (
      transactionType?.includes("refund") ||
      transaction.rawDescription
        .toLowerCase()
        .includes("refund")
    ) {
      return "refund";
    }

    return "income";
  }

  return "unknown";
}

export function identifyMerchant(
  description: string,
  transaction?: ImportedTransaction
): MerchantIdentification {
  const rule = merchantAliases.find(
    ({ patterns }) =>
      patterns.some((pattern) =>
        pattern.test(description)
      )
  );

  if (rule) {
    return {
      merchantName: rule.merchantName,
      kind: rule.kind,
      recognised: true,
    };
  }

  const cleanedDescription =
    removeAibPrefixes(
      normaliseDescription(description)
    );

  return {
    merchantName:
      cleanedDescription || "Unknown transaction",
    kind: transaction
      ? inferUnrecognisedKind(transaction)
      : "unknown",
    recognised: false,
  };
}

export function normaliseTransaction(
  transaction: ImportedTransaction
): NormalisedTransaction {
  const normalisedDescription =
    normaliseDescription(
      transaction.rawDescription
    );

  const identification = identifyMerchant(
    normalisedDescription,
    transaction
  );

  return {
    id: `${transaction.source}-${transaction.externalId}`,
    source: transaction.source,
    externalId: transaction.externalId,
    accountId: transaction.accountId,
    postedDate: transaction.postedDate,
    rawDescription: transaction.rawDescription,
    normalisedDescription,
    merchantName:
      identification.merchantName,
    amount: transaction.amount,
    currency: transaction.currency,
    balanceAfter: transaction.balanceAfter,
    kind: identification.kind,
    recognised:
      identification.recognised,
    metadata: transaction.metadata,
  };
}

export function normaliseTransactions(
  transactions: ImportedTransaction[]
): NormalisedTransaction[] {
  return transactions.map(
    normaliseTransaction
  );
}