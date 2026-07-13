import type {
  NormalisedTransaction,
} from "@/lib/import";
import {
  createMerchantId,
} from "./library";
import type {
  EnrichedTransaction,
  MerchantDefinition,
  MerchantProfile,
} from "./types";

function findMerchantProfile(
  transaction: NormalisedTransaction,
  profiles: MerchantProfile[]
): MerchantProfile | undefined {
  const merchantId = createMerchantId(
    transaction.merchantName
  );

  return profiles.find(
    (profile) =>
      profile.id === merchantId
  );
}

export function enrichTransaction(
  transaction: NormalisedTransaction,
  profiles: MerchantProfile[]
): EnrichedTransaction {
  const merchantId = createMerchantId(
    transaction.merchantName
  );

  const profile = findMerchantProfile(
    transaction,
    profiles
  );

  return {
    ...transaction,

    merchantId,

    category:
      profile?.category ??
      "Uncategorised",

    recurring:
      profile?.recurring ??
      false,

    includeInForecast:
      profile?.includeInForecast ??
      false,

    ignored:
      profile?.ignored ??
      false,

    userDefined:
      profile?.userDefined ??
      false,
  };
}

export function enrichTransactions(
  transactions: NormalisedTransaction[],
  profiles: MerchantProfile[]
): EnrichedTransaction[] {
  return transactions.map(
    (transaction) =>
      enrichTransaction(
        transaction,
        profiles
      )
  );
}

export function applyDefinitionsToTransactions(
  transactions: NormalisedTransaction[],
  definitions: Record<
    string,
    MerchantDefinition
  >,
  profiles: MerchantProfile[]
): EnrichedTransaction[] {
  return transactions.map((transaction) => {
    const merchantId = createMerchantId(
      transaction.merchantName
    );

    const definition =
      definitions[merchantId];

    const profile = profiles.find(
      (candidate) =>
        candidate.id === merchantId
    );

    return {
      ...transaction,

      merchantId,

      category:
        definition?.category ??
        profile?.category ??
        "Uncategorised",

      recurring:
        definition?.recurring ??
        profile?.recurring ??
        false,

      includeInForecast:
        definition?.includeInForecast ??
        profile?.includeInForecast ??
        false,

      ignored:
        definition?.ignored ??
        profile?.ignored ??
        false,

      userDefined:
        Boolean(definition),
    };
  });
}