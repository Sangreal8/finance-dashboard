import { accounts } from "@/data/accounts";
import { monthlyPlan } from "@/data/monthlyPlan";
import { buildFinanceTimeline } from "./planner";
import { buildFinancialPosition } from "./position";

export function getFinancialPosition() {
  return buildFinancialPosition(accounts, monthlyPlan);
}

export function getFinanceTimeline() {
  return buildFinanceTimeline(accounts, monthlyPlan);
}

export function getAccounts() {
  return accounts;
}

export function getMonthlyPlan() {
  return monthlyPlan;
}