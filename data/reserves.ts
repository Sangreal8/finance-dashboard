import type { Reserve } from "@/lib/finance/types";

export const reserves: Reserve[] = [
  {
    id: "solicitor-payment-balance",
    name: "Solicitor payment balance",
    amount: 584.81,
    type: "legal",
    mandatory: true,
    status: "fulfilled",
    fulfilledDate: "2026-07-14",
    confidence: "estimated",
  },
  {
    id: "credit-card-minimum-july",
    name: "Credit card minimum",
    amount: 123.81,
    type: "debt",
    dueDate: "2026-07-31",
    mandatory: true,
    status: "planned",
    confidence: "confirmed",
  },
  {
    id: "krakow-spending",
    name: "Krakow spending",
    amount: 350,
    type: "discretionary",
    dueDate: "2026-09-10",
    mandatory: false,
    status: "planned",
    confidence: "estimated",
  },
];
