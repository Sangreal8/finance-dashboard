import { recurringCommitments } from "@/data/recurringCommitments";
import { transactions } from "@/data/transactions";
import { matchCommitmentsToTransactions } from "@/lib/finance/matcher";
import { generateCommitmentsForMonth } from "@/lib/finance/recurring";
import type { MonthlyPlan } from "@/lib/finance/types";

const month = "2026-07";

const generatedCommitments = generateCommitmentsForMonth(
  recurringCommitments,
  month
);

const matchedCommitments = matchCommitmentsToTransactions(
  generatedCommitments,
  transactions
);

export const monthlyPlan: MonthlyPlan = {
  month,
  safetyBuffer: 0,
  commitments: matchedCommitments,

  income: [
    {
      id: "salary-july",
      name: "Salary",
      amount: 3164,
      expectedDay: 28,
      confidence: "confirmed",
    },
  ],

  forecastItems: [
    {
      id: "groceries-remaining",
      name: "Groceries until payday",
      amount: 110,
      type: "essential",
      confidence: "estimated",
    },
    {
      id: "fuel-remaining",
      name: "Fuel until payday",
      amount: 30,
      type: "essential",
      confidence: "estimated",
    },
  ],
};