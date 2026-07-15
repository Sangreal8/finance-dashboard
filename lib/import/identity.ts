/**
 * Generates a compact deterministic identifier from
 * provider-specific transaction identity fields.
 *
 * Callers decide which fields define an identity. This
 * utility only centralises the hashing implementation.
 */
export function generateTransactionIdentity(
  parts: Array<string | number | undefined | null>,
): string {
  const value = parts
    .map((part) => {
      if (part === undefined || part === null) {
        return "";
      }

      return String(part);
    })
    .join("|");

  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(36);
}

export function canonicaliseAibAccount(accountId: string): string {
  return accountId.replace(/\s+/g, "").trim().toUpperCase();
}

export function canonicaliseAibDescription(description: string): string {
  return description
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function generateAibTransactionIdentity({
  accountId,
  postedDate,
  amount,
  description,
  occurrence,
}: {
  accountId: string;
  postedDate: string;
  amount: number;
  description: string;
  occurrence: number;
}): string {
  return generateTransactionIdentity([
    canonicaliseAibAccount(accountId),
    postedDate,
    amount.toFixed(2),
    canonicaliseAibDescription(description),
    occurrence,
  ]);
}
