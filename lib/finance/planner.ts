import { getAvailableCash } from "./position";
import type {
  Account,
  FinanceTimelineEvent,
  MonthlyPlan,
} from "./types";

function buildDate(month: string, day: number) {
  return `${month}-${String(day).padStart(2, "0")}`;
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
    date: buildDate(plan.month, commitment.dueDay),
    name: commitment.name,
    amount: -commitment.amount,
    category: commitment.type,
    confidence: commitment.fixed ? "confirmed" : "estimated",
  }));

  const incomeEvents: Omit<
    FinanceTimelineEvent,
    "balanceAfter"
  >[] = plan.income.map((income) => ({
    id: income.id,
    date: buildDate(plan.month, income.expectedDay),
    name: income.name,
    amount: income.amount,
    category: "income",
    confidence: income.confidence,
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