import type { MonthlyPlan } from "@/lib/finance/types";

export const monthlyPlan: MonthlyPlan = {
  month: "2026-07",
  openingBalance: 2171,
  expectedIncome: 3164,
  safetyBuffer: 250,

  commitments: [
    {
      id: "mortgage",
      name: "Mortgage",
      amount: 903,
      type: "essential",
      dueDay: 11,
      fixed: true,
      mandatory: true,
    },
    {
      id: "electricity",
      name: "Electricity",
      amount: 95,
      type: "essential",
      dueDay: 15,
      fixed: false,
      mandatory: true,
    },
    {
      id: "internet",
      name: "Internet",
      amount: 40,
      type: "essential",
      dueDay: 18,
      fixed: true,
      mandatory: true,
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