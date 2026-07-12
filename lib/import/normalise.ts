import type {
  ImportedTransaction,
  NormalisedTransaction,
} from "./types";

const merchantRules: Array<{
  patterns: RegExp[];
  merchantName: string;
}> = [
  {
    patterns: [
      /\bsky\b/i,
      /sky digital/i,
      /sky ireland/i,
    ],
    merchantName: "Sky",
  },
  {
    patterns: [
      /metal plan fee/i,
      /revolut metal/i,
    ],
    merchantName: "Revolut Metal",
  },
  {
    patterns: [
      /\baig\b/i,
      /revolut insurance/i,
    ],
    merchantName: "AIG Insurance",
  },
  {
    patterns: [
      /uber.*one/i,
      /one membership/i,
    ],
    merchantName: "Uber One",
  },
  {
    patterns: [
      /openai/i,
      /chatgpt/i,
    ],
    merchantName: "OpenAI",
  },
  {
    patterns: [
      /amazon prime/i,
      /amzn.*prime/i,
    ],
    merchantName: "Amazon Prime",
  },
  {
    patterns: [
      /google play/i,
      /google \*google play/i,
    ],
    merchantName: "Google Play",
  },
];

export function normaliseDescription(
  description: string
): string {
  return description
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s&.'*-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function identifyMerchant(
  description: string
): string {
  const rule = merchantRules.find(({ patterns }) =>
    patterns.some((pattern) =>
      pattern.test(description)
    )
  );

  if (rule) {
    return rule.merchantName;
  }

  return normaliseDescription(description);
}

export function normaliseTransaction(
  transaction: ImportedTransaction
): NormalisedTransaction {
  const normalisedDescription = normaliseDescription(
    transaction.rawDescription
  );

  return {
    id: `${transaction.source}-${transaction.externalId}`,
    source: transaction.source,
    externalId: transaction.externalId,
    accountId: transaction.accountId,
    postedDate: transaction.postedDate,
    rawDescription: transaction.rawDescription,
    normalisedDescription,
    merchantName: identifyMerchant(
      normalisedDescription
    ),
    amount: transaction.amount,
    currency: transaction.currency,
    balanceAfter: transaction.balanceAfter,
    metadata: transaction.metadata,
  };
}

export function normaliseTransactions(
  transactions: ImportedTransaction[]
): NormalisedTransaction[] {
  return transactions.map(normaliseTransaction);
}