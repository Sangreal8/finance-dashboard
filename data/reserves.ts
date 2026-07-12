import type { Reserve } from "@/lib/finance/types";

export const reserves: Reserve[] = [
  {
    id: "solicitor-payment-balance",
    name: "Solicitor payment balance",
    amount: 584.81,
    type: "legal",
    mandatory: true,
    active: true,
    reserved: true,
    confidence: "estimated",
  },
  {
    id: "credit-card-minimum-july",
    name: "Credit card minimum",
    amount: 123.81,
    type: "debt",
    dueDate: "2026-07-31",
    mandatory: true,
    active: true,
    reserved: false,
    confidence: "confirmed",
  },
  {
    id: "krakow-spending",
    name: "Krakow spending",
    amount: 350,
    type: "discretionary",
    dueDate: "2026-09-10",
    mandatory: false,
    active: true,
    reserved: false,
    confidence: "estimated",
  },
];