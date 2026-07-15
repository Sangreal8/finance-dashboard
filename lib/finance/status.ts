import type { FinancialStatus } from "./types";

interface FinancialStatusArgs {
  safeToSpend: number;
  projectedMonthEnd: number;
  knownCommitments?: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getFinancialStatus({
  safeToSpend,
  projectedMonthEnd,
  knownCommitments = 0,
}: FinancialStatusArgs): FinancialStatus {
  if (safeToSpend >= 250 && projectedMonthEnd >= 500) {
    return {
      health: "healthy",
      title: "You're on track",
      description: `After allowing for ${formatCurrency(
        knownCommitments,
      )} of known commitments, ${formatCurrency(
        safeToSpend,
      )} remains safe to spend.`,
    };
  }

  if (safeToSpend > 0 && projectedMonthEnd >= 0) {
    return {
      health: "warning",
      title: "Things are a little tight until payday",
      description: `After allowing for ${formatCurrency(
        knownCommitments,
      )} of known commitments, ${formatCurrency(
        safeToSpend,
      )} remains safe to spend.`,
    };
  }

  if (projectedMonthEnd >= 0) {
    return {
      health: "warning",
      title: "Your available cash is fully allocated",
      description: `Known commitments total ${formatCurrency(
        knownCommitments,
      )}. There is currently no genuinely uncommitted cash remaining.`,
    };
  }

  return {
    health: "critical",
    title: "Your current plan may fall short",
    description: `Known commitments currently total ${formatCurrency(
      knownCommitments,
    )}. Review upcoming costs and consider using part of your safety buffer if required.`,
  };
}
