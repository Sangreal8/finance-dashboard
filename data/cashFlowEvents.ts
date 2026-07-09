import { CashFlowEvent } from "@/lib/cashflow/types";

export const cashFlowEvents: CashFlowEvent[] = [
  {
    id: "mortgage-july",
    date: "2026-07-11",
    name: "Mortgage",
    amount: -903,
    category: "Housing",
    mandatory: true,
    fixed: true,
  },
  {
    id: "electricity-july",
    date: "2026-07-15",
    name: "Electricity",
    amount: -95,
    category: "Utilities",
    mandatory: true,
    fixed: false,
  },
  {
    id: "internet-july",
    date: "2026-07-18",
    name: "Internet",
    amount: -40,
    category: "Utilities",
    mandatory: true,
    fixed: true,
  },
  {
    id: "salary-july",
    date: "2026-07-23",
    name: "Salary",
    amount: 3164,
    category: "Income",
    mandatory: true,
    fixed: true,
  },
];