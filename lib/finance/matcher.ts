import type { Transaction } from "@/types/transaction";
import type { PlannedCommitment } from "./types";

const DATE_WINDOW_DAYS = 5;
const AMOUNT_TOLERANCE = 0.01;

function differenceInDays(firstDate: string, secondDate: string) {
  const first = new Date(`${firstDate}T12:00:00`);
  const second = new Date(`${secondDate}T12:00:00`);

  return Math.abs(
    Math.round(
      (first.getTime() - second.getTime()) / (1000 * 60 * 60 * 24)
    )
  );
}

function amountMatches(
  commitment: PlannedCommitment,
  transaction: Transaction
) {
  return (
    Math.abs(Math.abs(transaction.amount) - commitment.amount) <=
    AMOUNT_TOLERANCE
  );
}

function merchantMatches(
  commitment: PlannedCommitment,
  transaction: Transaction
) {
  const patterns =
    commitment.merchantPatterns?.length
      ? commitment.merchantPatterns
      : [commitment.name];

  const description = transaction.description.toLowerCase();

  return patterns.some((pattern) =>
    description.includes(pattern.toLowerCase())
  );
}

function transactionMatches(
  commitment: PlannedCommitment,
  transaction: Transaction
) {
  if (transaction.type !== "expense") {
    return false;
  }

  if (!amountMatches(commitment, transaction)) {
    return false;
  }

  if (
    differenceInDays(commitment.dueDate, transaction.date) >
    DATE_WINDOW_DAYS
  ) {
    return false;
  }

  return merchantMatches(commitment, transaction);
}

export function matchCommitmentsToTransactions(
  commitments: PlannedCommitment[],
  transactions: Transaction[]
): PlannedCommitment[] {
  const usedTransactionIds = new Set<string>();

  return commitments.map((commitment) => {
    const matchingTransaction = transactions.find(
      (transaction) =>
        !usedTransactionIds.has(transaction.id) &&
        transactionMatches(commitment, transaction)
    );

    if (!matchingTransaction) {
      return commitment;
    }

    usedTransactionIds.add(matchingTransaction.id);

    return {
      ...commitment,
      status: matchingTransaction.cleared ? "paid" : "matched",
      matchedTransactionId: matchingTransaction.id,
    };
  });
}