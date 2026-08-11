import { accounts } from "@/data/accounts";
import { buildMonthlyPlan } from "@/data/monthlyPlan";
import { buildReservesForMonth } from "@/data/reserves";
import { buildFinanceTimeline } from "./planner";
import { buildFinancialPosition } from "./position";

function formatLocalDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getMonthForDate(referenceDate: Date): string {
  return formatLocalDate(referenceDate).slice(0, 7);
}

function getPlanForDate(referenceDate: Date) {
  return buildMonthlyPlan(getMonthForDate(referenceDate));
}

function getReservesForDate(referenceDate: Date) {
  return buildReservesForMonth(getMonthForDate(referenceDate));
}

export function getFinancialPosition(referenceDate = new Date()) {
  return buildFinancialPosition(
    accounts,
    getPlanForDate(referenceDate),
    getReservesForDate(referenceDate),
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

export function getReserves(referenceDate = new Date()) {
  return getReservesForDate(referenceDate);
}
