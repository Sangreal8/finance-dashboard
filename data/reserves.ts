import type { Reserve } from "@/lib/finance/types";

export const reserves: Reserve[] = [
  {
    id: "legal-fees",
    name: "Legal fees",
    amount: 600,
    type: "legal",
    dueDate: "2026-08-01",
    mandatory: true,
    active: true,
    reserved: true,
    confidence: "estimated",
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