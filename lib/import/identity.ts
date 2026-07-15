/**
 * Generates a compact deterministic identifier from
 * provider-specific transaction identity fields.
 *
 * The caller remains responsible for deciding which fields
 * form the identity. This utility only centralises the hash
 * implementation so every importer uses the same algorithm.
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
