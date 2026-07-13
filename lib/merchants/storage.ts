import type {
  MerchantDefinition,
} from "./types";

const MERCHANT_DEFINITIONS_KEY =
  "finance-dashboard:merchant-definitions:v1";

type StoredMerchantDefinitions = Record<
  string,
  MerchantDefinition
>;

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadMerchantDefinitions():
  StoredMerchantDefinitions {
  if (!isBrowser()) {
    return {};
  }

  const storedValue =
    window.localStorage.getItem(
      MERCHANT_DEFINITIONS_KEY
    );

  if (!storedValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(
      storedValue
    ) as StoredMerchantDefinitions;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

export function saveMerchantDefinition(
  definition: MerchantDefinition
): MerchantDefinition {
  const definitions =
    loadMerchantDefinitions();

  const savedDefinition = {
    ...definition,
    updatedAt: new Date().toISOString(),
  };

  definitions[definition.merchantId] =
    savedDefinition;

  window.localStorage.setItem(
    MERCHANT_DEFINITIONS_KEY,
    JSON.stringify(definitions)
  );

  return savedDefinition;
}

export function removeMerchantDefinition(
  merchantId: string
) {
  if (!isBrowser()) {
    return;
  }

  const definitions =
    loadMerchantDefinitions();

  delete definitions[merchantId];

  window.localStorage.setItem(
    MERCHANT_DEFINITIONS_KEY,
    JSON.stringify(definitions)
  );
}

export function clearMerchantDefinitions() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(
    MERCHANT_DEFINITIONS_KEY
  );
}