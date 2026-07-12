import { accounts } from "@/data/accounts";
import { monthlyPlan } from "@/data/monthlyPlan";
import { reserves } from "@/data/reserves";
import { buildFinanceTimeline } from "./planner";
import { buildFinancialPosition } from "./position";

export function getFinancialPosition() {
  return buildFinancialPosition(
    accounts,
    monthlyPlan,
    reserves
  );
}

export function getFinanceTimeline() {
  return buildFinanceTimeline(
    accounts,
    monthlyPlan
  );
}

export function getAccounts() {
  return accounts;
}

export function getMonthlyPlan() {
  return monthlyPlan;
}

export function getReserves() {
  return reserves;
}