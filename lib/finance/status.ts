import type { FinancialStatus } from "./types";

interface FinancialStatusArgs {
  safeToSpend: number;
  projectedMonthEnd: number;
}

export function getFinancialStatus({
  safeToSpend,
  projectedMonthEnd,
}: FinancialStatusArgs): FinancialStatus {
  if (safeToSpend >= 250 && projectedMonthEnd >= 500) {
    return {
      health: "healthy",
      title: "You're on track",
      description:
        "Your known commitments are covered, with some cash still genuinely free to spend.",
    };
  }

  if (safeToSpend > 0 && projectedMonthEnd >= 0) {
    return {
      health: "warning",
      title: "Things are a little tight until payday",
      description:
        "Your known commitments are accounted for, but there is limited room for additional spending.",
    };
  }

  if (projectedMonthEnd >= 0) {
    return {
      health: "warning",
      title: "Your available cash is fully allocated",
      description:
        "Known commitments, reserves and your safety buffer leave no genuinely free spending money.",
    };
  }

  return {
    health: "critical",
    title: "Your current plan may fall short",
    description:
      "Based on the information currently represented in the plan, you may need to review upcoming costs or use part of your buffer.",
  };
}
