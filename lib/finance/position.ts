import type { FinancialPosition, MonthlyPlan } from "./types";

export function buildFinancialPosition(
  plan: MonthlyPlan
): FinancialPosition {
  const knownCommitments = plan.commitments
    .filter((item) => item.mandatory)
    .reduce((sum, item) => sum + item.amount, 0);

  const estimatedRemainingSpend = plan.forecastItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const safeToSpend = Math.max(
    0,
    plan.openingBalance -
      knownCommitments -
      estimatedRemainingSpend -
      plan.safetyBuffer
  );

  const projectedMonthEnd =
    plan.openingBalance -
    knownCommitments -
    estimatedRemainingSpend -
    plan.safetyBuffer +
    plan.expectedIncome;

  return {
    availableToday: plan.openingBalance,
    knownCommitments,
    estimatedRemainingSpend,
    safetyBuffer: plan.safetyBuffer,
    safeToSpend,
    expectedIncome: plan.expectedIncome,
    projectedMonthEnd,
  };
}