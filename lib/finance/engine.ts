import { accounts } from "@/data/accounts";
import { buildMonthlyPlan } from "@/data/monthlyPlan";
import { reserves } from "@/data/reserves";
import { buildFinanceTimeline } from "./planner";
import { buildFinancialPosition } from "./position";

function formatLocalDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getPlanForDate(referenceDate: Date) {
  return buildMonthlyPlan(formatLocalDate(referenceDate).slice(0, 7));
}

export function getFinancialPosition(referenceDate = new Date()) {
  return buildFinancialPosition(
    accounts,
    getPlanForDate(referenceDate),
    reserves,
    referenceDate,
  );
}

export function getFinanceTimeline(referenceDate = new Date()) {
  return buildFinanceTimeline(
    accounts,
    getPlanForDate(referenceDate),
    formatLocalDate(referenceDate),
  );
}

export function getAccounts() {
  return accounts;
}

export function getMonthlyPlan(referenceDate = new Date()) {
  return getPlanForDate(referenceDate);
}

export function getReserves() {
  return reserves;
}
