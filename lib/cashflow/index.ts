import { cashFlowEvents } from "@/data/cashFlowEvents";
import {
  buildCashFlowProjection,
  getLowestProjectedBalance,
  getNextCashFlowEvent,
  getRemainingAfterMandatoryEvents,
} from "./planner";

export function getCashFlowPlan(currentBalance: number) {
  const projection = buildCashFlowProjection(currentBalance, cashFlowEvents);

  return {
    projection,
    nextEvent: getNextCashFlowEvent(projection),
    lowestBalance: getLowestProjectedBalance(currentBalance, projection),
    remainingAfterMandatory: getRemainingAfterMandatoryEvents(
      currentBalance,
      cashFlowEvents
    ),
  };
}