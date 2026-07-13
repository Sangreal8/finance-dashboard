import type {
  NormalisedTransaction,
  TransactionKind,
} from "@/lib/import";
import type {
  MerchantCategory,
  MerchantDefinition,
  MerchantLibrarySummary,
  MerchantProfile,
} from "./types";

interface MerchantAccumulator {
  name: string;
  kinds: Map<TransactionKind, number>;

  transactionCount: number;
  outgoingTransactionCount: number;
  incomingTransactionCount: number;

  totalSpent: number;
  totalReceived: number;
  totalAbsoluteAmount: number;

  firstSeen: string;
  lastSeen: string;

  recognised: boolean;
  rawDescriptions: Set<string>;
}

export function createMerchantId(
  merchantName: string
): string {
  return merchantName
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function getDominantKind(
  kinds: Map<TransactionKind, number>
): TransactionKind {
  const entries = [...kinds.entries()];

  if (entries.length === 0) {
    return "unknown";
  }

  return entries.sort(
    (first, second) =>
      second[1] - first[1]
  )[0][0];
}

function inferCategory(
  merchantName: string,
  kind: TransactionKind
): MerchantCategory {
  const name = merchantName.toLowerCase();

  if (kind === "income") {
    return "Income";
  }

  if (kind === "transfer") {
    return "Savings";
  }

  if (
    name.includes("tesco") ||
    name.includes("dunnes") ||
    name.includes("lidl") ||
    name.includes("eurospar") ||
    name.includes("centra")
  ) {
    return "Groceries";
  }

  if (
    name.includes("perry oil") ||
    name.includes("circle k") ||
    name.includes("fuel")
  ) {
    return "Fuel";
  }

  if (
    name.includes("sky") ||
    name.includes("insurance") ||
    name.includes("mortgage") ||
    name.includes("electric") ||
    name.includes("netflix") ||
    name.includes("amazon prime") ||
    name.includes("google one") ||
    name.includes("revolut metal") ||
    name.includes("uber one") ||
    name.includes("aviva")
  ) {
    return "Bills";
  }

  if (
    name.includes("pub") ||
    name.includes("burger king") ||
    name.includes("supermac") ||
    name.includes("coffee") ||
    name.includes("badger") ||
    name.includes("restaurant") ||
    name.includes("lounge")
  ) {
    return "Eating out";
  }

  if (
    name.includes("openai") ||
    name.includes("google play") ||
    name.includes("google workspace") ||
    name.includes("pyimagesearch")
  ) {
    return "Other";
  }

  return "Uncategorised";
}

function inferRecurring(profile: {
  transactionCount: number;
  firstSeen: string;
  lastSeen: string;
  kind: TransactionKind;
}): boolean {
  if (
    profile.kind === "transfer" ||
    profile.kind === "unknown"
  ) {
    return false;
  }

  if (profile.transactionCount < 2) {
    return false;
  }

  const firstSeen = new Date(
    `${profile.firstSeen}T12:00:00`
  );

  const lastSeen = new Date(
    `${profile.lastSeen}T12:00:00`
  );

  const daysBetween = Math.round(
    Math.abs(
      lastSeen.getTime() -
        firstSeen.getTime()
    ) /
      (1000 * 60 * 60 * 24)
  );

  return daysBetween >= 20;
}

function shouldIncludeInForecast(
  category: MerchantCategory,
  kind: TransactionKind
): boolean {
  if (
    kind === "income" ||
    kind === "transfer" ||
    kind === "refund"
  ) {
    return false;
  }

  return (
    category === "Groceries" ||
    category === "Fuel" ||
    category === "Eating out"
  );
}

function createProfile(
  accumulator: MerchantAccumulator,
  definitions: Record<
    string,
    MerchantDefinition
  >
): MerchantProfile {
  const id = createMerchantId(
    accumulator.name
  );

  const kind = getDominantKind(
    accumulator.kinds
  );

  const inferredCategory = inferCategory(
    accumulator.name,
    kind
  );

  const inferredRecurring =
    inferRecurring({
      transactionCount:
        accumulator.transactionCount,
      firstSeen: accumulator.firstSeen,
      lastSeen: accumulator.lastSeen,
      kind,
    });

  const definition = definitions[id];

  const category =
    definition?.category ??
    inferredCategory;

  const recurring =
    definition?.recurring ??
    inferredRecurring;

  const includeInForecast =
    definition?.includeInForecast ??
    shouldIncludeInForecast(
      category,
      kind
    );

  const averageTransactionAmount =
    accumulator.transactionCount === 0
      ? 0
      : accumulator.totalAbsoluteAmount /
        accumulator.transactionCount;

  const averageOutgoingAmount =
    accumulator.outgoingTransactionCount === 0
      ? 0
      : accumulator.totalSpent /
        accumulator.outgoingTransactionCount;

  return {
    id,
    name: accumulator.name,
    category,
    kind,

    transactionCount:
      accumulator.transactionCount,

    outgoingTransactionCount:
      accumulator.outgoingTransactionCount,

    incomingTransactionCount:
      accumulator.incomingTransactionCount,

    totalSpent:
      accumulator.totalSpent,

    totalReceived:
      accumulator.totalReceived,

    averageTransactionAmount,
    averageOutgoingAmount,

    firstSeen:
      accumulator.firstSeen,

    lastSeen:
      accumulator.lastSeen,

    recurring,
    includeInForecast,

    ignored:
      definition?.ignored ?? false,

    recognised:
      accumulator.recognised,

    userDefined:
      Boolean(definition),

    rawDescriptions: [
      ...accumulator.rawDescriptions,
    ].sort(),
  };
}

export function buildMerchantLibrary(
  transactions: NormalisedTransaction[],
  definitions: Record<
    string,
    MerchantDefinition
  > = {}
): MerchantProfile[] {
  const merchants = new Map<
    string,
    MerchantAccumulator
  >();

  transactions.forEach((transaction) => {
    const merchantKey =
      transaction.merchantName
        .normalize("NFKC")
        .toLowerCase()
        .trim();

    const existing =
      merchants.get(merchantKey);

    if (existing) {
      existing.transactionCount += 1;

      existing.totalAbsoluteAmount +=
        Math.abs(transaction.amount);

      existing.recognised =
        existing.recognised ||
        transaction.recognised;

      existing.rawDescriptions.add(
        transaction.rawDescription
      );

      existing.firstSeen =
        transaction.postedDate <
        existing.firstSeen
          ? transaction.postedDate
          : existing.firstSeen;

      existing.lastSeen =
        transaction.postedDate >
        existing.lastSeen
          ? transaction.postedDate
          : existing.lastSeen;

      existing.kinds.set(
        transaction.kind,
        (existing.kinds.get(
          transaction.kind
        ) ?? 0) + 1
      );

      if (transaction.amount < 0) {
        existing.outgoingTransactionCount +=
          1;

        existing.totalSpent +=
          Math.abs(transaction.amount);
      } else {
        existing.incomingTransactionCount +=
          1;

        existing.totalReceived +=
          transaction.amount;
      }

      return;
    }

    merchants.set(merchantKey, {
      name: transaction.merchantName,

      kinds: new Map([
        [transaction.kind, 1],
      ]),

      transactionCount: 1,

      outgoingTransactionCount:
        transaction.amount < 0
          ? 1
          : 0,

      incomingTransactionCount:
        transaction.amount >= 0
          ? 1
          : 0,

      totalSpent:
        transaction.amount < 0
          ? Math.abs(transaction.amount)
          : 0,

      totalReceived:
        transaction.amount >= 0
          ? transaction.amount
          : 0,

      totalAbsoluteAmount:
        Math.abs(transaction.amount),

      firstSeen:
        transaction.postedDate,

      lastSeen:
        transaction.postedDate,

      recognised:
        transaction.recognised,

      rawDescriptions: new Set([
        transaction.rawDescription,
      ]),
    });
  });

  return [...merchants.values()]
    .map((merchant) =>
      createProfile(
        merchant,
        definitions
      )
    )
    .sort((first, second) => {
      if (
        first.ignored !== second.ignored
      ) {
        return first.ignored ? 1 : -1;
      }

      if (
        first.category ===
          "Uncategorised" &&
        second.category !==
          "Uncategorised"
      ) {
        return -1;
      }

      if (
        first.category !==
          "Uncategorised" &&
        second.category ===
          "Uncategorised"
      ) {
        return 1;
      }

      return (
        second.transactionCount -
        first.transactionCount
      );
    });
}

export function buildMerchantLibrarySummary(
  transactions: NormalisedTransaction[],
  definitions: Record<
    string,
    MerchantDefinition
  > = {}
): MerchantLibrarySummary {
  const merchants =
    buildMerchantLibrary(
      transactions,
      definitions
    );

  return {
    merchants,

    totalMerchants:
      merchants.length,

    recognisedMerchants:
      merchants.filter(
        (merchant) =>
          merchant.recognised
      ).length,

    uncategorisedMerchants:
      merchants.filter(
        (merchant) =>
          !merchant.ignored &&
          merchant.category ===
            "Uncategorised"
      ).length,

    recurringMerchants:
      merchants.filter(
        (merchant) =>
          !merchant.ignored &&
          merchant.recurring
      ).length,

    forecastMerchants:
      merchants.filter(
        (merchant) =>
          !merchant.ignored &&
          merchant.includeInForecast
      ).length,

    ignoredMerchants:
      merchants.filter(
        (merchant) =>
          merchant.ignored
      ).length,
  };
}