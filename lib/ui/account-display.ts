const accountDisplayNames: Record<string, string> = {
  "aib-current": "AIB Current Account",
  "revolut-current": "Revolut",
  "revolut-credit-card": "Revolut Credit Card",
};

const accountTypeLabels: Record<string, string> = {
  current: "Current account",
  savings: "Savings account",
  credit_card: "Credit card",
  investment: "Investment account",
};

export function getFriendlyAccountName(accountId: string) {
  if (accountDisplayNames[accountId]) {
    return accountDisplayNames[accountId];
  }

  return accountId
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getAccountTypeLabel(accountId: string) {
  const matchedType = Object.keys(accountTypeLabels).find((type) =>
    accountId.includes(type),
  );

  return matchedType ? accountTypeLabels[matchedType] : "Account";
}
