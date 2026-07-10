import { getAvailableCash } from "./position";
import type {
  Account,
  FinanceTimelineEvent,
  MonthlyPlan,
} from "./types";

function buildIncomeDate(month: string, day: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDayOfMonth = new Date(year, monthNumber, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), lastDayOfMonth);

  return `${month}-${String(safeDay).padStart(2, "0")}`;
}

export function buildFinanceTimeline(
  accounts: Account[],
  plan: MonthlyPlan
): FinanceTimelineEvent[] {
  const commitmentEvents: Omit<
    FinanceTimelineEvent,
    "balanceAfter"
  >[] = plan.commitments.map((commitment) => ({
    id: commitment.id,
    date: commitment.dueDate,
    name: commitment.name,
    amount:
      commitment.status === "paid" ? 0 : -commitment.amount,
    category: commitment.type,
    confidence: commitment.confidence,
    status: commitment.status,
  }));

  const incomeEvents: Omit<
    FinanceTimelineEvent,
    "balanceAfter"
  >[] = plan.income.map((income) => ({
    id: income.id,
    date: buildIncomeDate(plan.month, income.expectedDay),
    name: income.name,
    amount: income.amount,
    category: "income",
    confidence: income.confidence,
    status: "expected",
  }));

  const events = [...commitmentEvents, ...incomeEvents].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return a.amount - b.amount;
  });

  let runningBalance = getAvailableCash(accounts);

  return events.map((event) => {
    runningBalance += event.amount;

    return {
      ...event,
      balanceAfter: runningBalance,
    };
  });
}