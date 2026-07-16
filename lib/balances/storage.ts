const BALANCE_OVERRIDES_STORAGE_KEY = "finance-dashboard:balance-overrides:v1";

export interface AccountBalanceOverride {
  accountId: string;
  balance: number;
  updatedAt: string;
}

export interface StoredBalanceOverridesSnapshot {
  version: 1;
  overrides: Record<string, AccountBalanceOverride>;
}

function createEmptySnapshot(): StoredBalanceOverridesSnapshot {
  return {
    version: 1,
    overrides: {},
  };
}

export function loadBalanceOverridesSnapshot(): StoredBalanceOverridesSnapshot {
  if (typeof window === "undefined") {
    return createEmptySnapshot();
  }

  const storedValue = window.localStorage.getItem(
    BALANCE_OVERRIDES_STORAGE_KEY,
  );

  if (!storedValue) {
    return createEmptySnapshot();
  }

  try {
    const parsed = JSON.parse(storedValue) as StoredBalanceOverridesSnapshot;

    if (
      parsed.version !== 1 ||
      typeof parsed.overrides !== "object" ||
      parsed.overrides === null
    ) {
      return createEmptySnapshot();
    }

    const overrides = Object.fromEntries(
      Object.entries(parsed.overrides).filter(
        ([accountId, override]) =>
          accountId.trim() !== "" &&
          override.accountId === accountId &&
          Number.isFinite(override.balance) &&
          !Number.isNaN(Date.parse(override.updatedAt)),
      ),
    );

    return {
      version: 1,
      overrides,
    };
  } catch {
    return createEmptySnapshot();
  }
}

export function loadAccountBalanceOverride(
  accountId: string,
): AccountBalanceOverride | null {
  return loadBalanceOverridesSnapshot().overrides[accountId] ?? null;
}

export function saveAccountBalanceOverride(
  accountId: string,
  balance: number,
): AccountBalanceOverride {
  if (typeof window === "undefined") {
    throw new Error(
      "Account balance overrides can only be saved in the browser.",
    );
  }

  if (!accountId.trim()) {
    throw new Error("An account ID is required.");
  }

  if (!Number.isFinite(balance)) {
    throw new Error("The account balance must be a finite number.");
  }

  const existingSnapshot = loadBalanceOverridesSnapshot();

  const override: AccountBalanceOverride = {
    accountId,
    balance,
    updatedAt: new Date().toISOString(),
  };

  const snapshot: StoredBalanceOverridesSnapshot = {
    version: 1,
    overrides: {
      ...existingSnapshot.overrides,
      [accountId]: override,
    },
  };

  window.localStorage.setItem(
    BALANCE_OVERRIDES_STORAGE_KEY,
    JSON.stringify(snapshot),
  );

  return override;
}

export function clearAccountBalanceOverride(accountId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const existingSnapshot = loadBalanceOverridesSnapshot();

  if (!existingSnapshot.overrides[accountId]) {
    return;
  }

  const overrides = {
    ...existingSnapshot.overrides,
  };

  delete overrides[accountId];

  const snapshot: StoredBalanceOverridesSnapshot = {
    version: 1,
    overrides,
  };

  window.localStorage.setItem(
    BALANCE_OVERRIDES_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
}

export function clearAllBalanceOverrides() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(BALANCE_OVERRIDES_STORAGE_KEY);
}
