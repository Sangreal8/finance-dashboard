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
  safetyBuffer: 250,
  commitments: matchedCommitments,

  income: [
    {
      id: "salary-july",
      name: "Salary",
      amount: 3164,
      expectedDay: 23,
      confidence: "confirmed",
    },
  ],

  forecastItems: [
    {
      id: "groceries",
      name: "Groceries",
      amount: 300,
      type: "essential",
      confidence: "estimated",
    },
    {
      id: "fuel",
      name: "Fuel",
      amount: 150,
      type: "essential",
      confidence: "estimated",
    },
    {
      id: "general-spending",
      name: "General spending",
      amount: 250,
      type: "discretionary",
      confidence: "estimated",
    },
  ],
};