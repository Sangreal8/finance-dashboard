import type { Reserve } from "@/lib/finance/types";

function getMonthEnd(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  return `${month}-${String(lastDay).padStart(2, "0")}`;
}

/**
 * Builds the reserve list for a specific month.
 *
 * The credit-card minimum remains a future plan rather than active reserved
 * money, but receives a fresh month-end due date whenever the month changes.
 */
export function buildReservesForMonth(month: string): Reserve[] {
  return [
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
      id: `credit-card-minimum-${month}`,
      name: "Credit card minimum",
      amount: 123.81,
      type: "debt",
      dueDate: getMonthEnd(month),
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
}
