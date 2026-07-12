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
        "Everything due before payday is covered, with some money still genuinely free to spend.",
    };
  }

  if (safeToSpend > 0 && projectedMonthEnd >= 0) {
    return {
      health: "warning",
      title: "Things are a little tight until payday",
      description:
        "Your essential costs are covered, but there is limited room for additional spending.",
    };
  }

  if (projectedMonthEnd >= 0) {
    return {
      health: "warning",
      title: "Everything is already spoken for",
      description:
        "You can reach payday, but there is no genuinely free spending money once your commitments and safety buffer are protected.",
    };
  }

  return {
    health: "critical",
    title: "You may need to use part of your buffer",
    description:
      "Your current plan is projected to fall short before the next income arrives.",
  };
}