import type { FinancialStatus } from "./types";

interface FinancialStatusArgs {
  safeToSpend: number;
  projectedMonthEnd: number;
}

export function getFinancialStatus({
  safeToSpend,
  projectedMonthEnd,
}: FinancialStatusArgs): FinancialStatus {
  if (safeToSpend >= 500 && projectedMonthEnd >= 1000) {
    return {
      health: "healthy",
      title: "You're comfortably on track",
      description:
        "Your current plan leaves room for your commitments, expected spending and safety buffer.",
    };
  }

  if (projectedMonthEnd >= 0) {
    return {
      health: "warning",
      title: "Keep an eye on spending",
      description:
        "Your plan remains positive, but there is limited room for unexpected costs.",
    };
  }

  return {
    health: "critical",
    title: "Cash flow needs attention",
    description:
      "Your current plan is projected to finish below zero unless something changes.",
  };
}