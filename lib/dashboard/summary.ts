import { cashFlowEvents } from "@/data/cashFlowEvents";
import { transactions } from "@/data/transactions";
import {
  buildCashFlowProjection,
  getLowestProjectedBalance,
  getNextCashFlowEvent,
} from "@/lib/cashflow/planner";
import { buildFinancialPosition } from "./position";
import { getFinancialStatus } from "./status";

function getCurrentBalance() {
  return transactions
    .filter((transaction) => transaction.cleared)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function getCommittedOutgoing() {
  return Math.abs(
    cashFlowEvents
      .filter((event) => event.amount < 0 && event.mandatory)
      .reduce((sum, event) => sum + event.amount, 0)
  );
}

function getExpectedIncoming() {
  return cashFlowEvents
    .filter((event) => event.amount > 0)
    .reduce((sum, event) => sum + event.amount, 0);
}

export function getDashboardSummary() {
  const currentCash = getCurrentBalance();
  const projection = buildCashFlowProjection(currentCash, cashFlowEvents);

  const committedOutgoing = getCommittedOutgoing();
  const expectedIncoming = getExpectedIncoming();

  const projectedBalance =
    currentCash - committedOutgoing + expectedIncoming;

  const financialStatus = getFinancialStatus(projectedBalance);

  const position = buildFinancialPosition({
    currentCash,
    committedOutgoing,
    expectedIncoming,
    financialStatus,
  });

  return {
    position,
    projection,
    nextEvent: getNextCashFlowEvent(projection),
    lowestBalance: getLowestProjectedBalance(currentCash, projection),
    transactionsLoaded: transactions.length,
  };
}