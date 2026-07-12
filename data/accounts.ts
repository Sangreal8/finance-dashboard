import type { Account } from "@/lib/finance/types";

export const accounts: Account[] = [
  {
    id: "aib-current",
    name: "AIB Current",
    type: "current",
    balance: 894,
    currency: "EUR",
    includeInAvailableCash: true,
  },
  {
    id: "revolut-current",
    name: "Revolut Current",
    type: "current",
    balance: 2,
    currency: "EUR",
    includeInAvailableCash: true,
  },
  {
    id: "revolut-solicitors-pocket",
    name: "Solicitors Pocket",
    type: "savings",
    balance: 590,
    currency: "EUR",
    includeInAvailableCash: false,
  },
  {
    id: "revolut-sweepstake-pocket",
    name: "World Cup Sweepstake",
    type: "savings",
    balance: 160,
    currency: "EUR",
    includeInAvailableCash: false,
  },
  {
    id: "revolut-credit-card",
    name: "Revolut Credit Card",
    type: "credit_card",
    balance: -5004.95,
    currency: "EUR",
    includeInAvailableCash: false,
  },
];