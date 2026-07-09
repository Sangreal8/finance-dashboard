export type FinancialHealth =
  | "healthy"
  | "warning"
  | "critical";

export interface FinancialStatus {
  health: FinancialHealth;
  title: string;
  description: string;
}

export function getFinancialStatus(
  projectedBalance: number
): FinancialStatus {
  if (projectedBalance >= 1000) {
    return {
      health: "healthy",
      title: "You're comfortably on track",
      description:
        "After all planned bills you'll still have money available this month.",
    };
  }

  if (projectedBalance >= 250) {
    return {
      health: "warning",
      title: "Keep an eye on spending",
      description:
        "You're on track, but there isn't much room for unexpected expenses.",
    };
  }

  return {
    health: "critical",
    title: "Cash flow needs attention",
    description:
      "Your projected balance is getting very low before payday.",
  };
}