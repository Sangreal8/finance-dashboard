import { cashFlowEvents } from "@/data/cashFlowEvents";
import { transactions } from "@/data/transactions";
import {
  buildCashFlowProjection,
  getLowestProjectedBalance,
  getNextCashFlowEvent,
  getRemainingAfterMandatoryEvents,
} from "@/lib/cashflow/planner";

function getCurrentBalance() {
  return transactions
    .filter((transaction) => transaction.cleared)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function getSafeDailySpend(remainingAfterMandatory: number) {
  const today = new Date();
  const nextPayday = cashFlowEvents.find((event) => event.amount > 0);

  if (!nextPayday) return null;

  const payday = new Date(nextPayday.date);
  const daysUntilPayday = Math.max(
    1,
    Math.ceil(
      (payday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  return Math.floor(remainingAfterMandatory / daysUntilPayday);
}

export function getDashboardSummary() {
  const currentBalance = getCurrentBalance();
  const projection = buildCashFlowProjection(currentBalance, cashFlowEvents);
  const remainingAfterMandatory = getRemainingAfterMandatoryEvents(
    currentBalance,
    cashFlowEvents
  );

  return {
    currentBalance,
    transactionsLoaded: transactions.length,
    projection,
    nextEvent: getNextCashFlowEvent(projection),
    lowestBalance: getLowestProjectedBalance(currentBalance, projection),
    remainingAfterMandatory,
    safeDailySpend: getSafeDailySpend(remainingAfterMandatory),
  };
}