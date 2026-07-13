import type {
  ReconciliationMatch,
  ReconciliationSummary,
} from "./types";

function sumCommitmentAmounts(
  matches: ReconciliationMatch[]
): number {
  return matches.reduce(
    (total, match) =>
      total + match.commitment.amount,
    0
  );
}

export function buildReconciliationSummary(
  matches: ReconciliationMatch[]
): ReconciliationSummary {
  const paidMatches = matches.filter(
    (match) => match.status === "paid"
  );

  const upcomingMatches = matches.filter(
    (match) =>
      match.status === "upcoming"
  );

  const overdueMatches = matches.filter(
    (match) =>
      match.status === "overdue"
  );

  const cancelledMatches = matches.filter(
    (match) =>
      match.status === "cancelled"
  );

  return {
    total: matches.length,

    paid: paidMatches.length,
    upcoming: upcomingMatches.length,
    overdue: overdueMatches.length,
    cancelled: cancelledMatches.length,

    paidAmount:
      sumCommitmentAmounts(paidMatches),

    remainingAmount:
      sumCommitmentAmounts([
        ...upcomingMatches,
        ...overdueMatches,
      ]),

    overdueAmount:
      sumCommitmentAmounts(
        overdueMatches
      ),

    matches,
  };
}