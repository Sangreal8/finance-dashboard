import type { CashFlowEvent, CashFlowProjection } from "./types";

export function buildCashFlowProjection(
  currentBalance: number,
  events: CashFlowEvent[]
): CashFlowProjection[] {
  let runningBalance = currentBalance;

  return [...events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((event) => {
      runningBalance += event.amount;

      return {
        date: event.date,
        name: event.name,
        amount: event.amount,
        balanceAfter: runningBalance,
        category: event.category,
        mandatory: event.mandatory,
        fixed: event.fixed,
      };
    });
}

export function getLowestProjectedBalance(
  currentBalance: number,
  projection: CashFlowProjection[]
): number {
  if (projection.length === 0) return currentBalance;

  return Math.min(
    currentBalance,
    ...projection.map((item) => item.balanceAfter)
  );
}

export function getNextCashFlowEvent(
  projection: CashFlowProjection[]
): CashFlowProjection | null {
  return projection[0] ?? null;
}

export function getRemainingAfterMandatoryEvents(
  currentBalance: number,
  events: CashFlowEvent[]
): number {
  return events
    .filter((event) => event.mandatory)
    .reduce((balance, event) => balance + event.amount, currentBalance);
}