import type { Account } from "@/lib/finance/types";

export const accounts: Account[] = [
  {
    id: "revolut-current",
    name: "Revolut Current",
    type: "current",
    balance: 2171,
    currency: "EUR",
    includeInAvailableCash: true,
  },
];