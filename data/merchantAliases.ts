import type { MerchantAliasRule } from "@/lib/import/types";

export const merchantAliases: MerchantAliasRule[] = [
  {
    merchantName: "Revolut transfer",
    kind: "transfer",
    patterns: [
      /revolut.*1773/i,
    ],
  },
  {
    merchantName: "Salary",
    kind: "income",
    patterns: [
      /^01352782\s+\d{8}$/i,
    ],
  },
  {
    merchantName: "Tesco",
    kind: "purchase",
    patterns: [
      /tesco stores/i,
    ],
  },
  {
    merchantName: "Eurospar",
    kind: "purchase",
    patterns: [
      /eurospar/i,
    ],
  },
  {
    merchantName: "Lidl",
    kind: "purchase",
    patterns: [
      /\blidl\b/i,
    ],
  },
  {
    merchantName: "Dunnes Stores",
    kind: "purchase",
    patterns: [
      /\bdunnes\b/i,
    ],
  },
  {
    merchantName: "Sky",
    kind: "purchase",
    patterns: [
      /\bsky\b/i,
      /sky digital/i,
      /sky ireland/i,
    ],
  },
  {
    merchantName: "Mortgage",
    kind: "purchase",
    patterns: [
      /d\/d bank of irelan/i,
    ],
  },
  {
    merchantName: "Electric Ireland",
    kind: "purchase",
    patterns: [
      /electric irela/i,
      /electric ireland/i,
    ],
  },
  {
    merchantName: "Aviva",
    kind: "purchase",
    patterns: [
      /d\/d aviva/i,
    ],
  },
  {
    merchantName: "Revolut Metal",
    kind: "purchase",
    patterns: [
      /metal plan fee/i,
      /revolut metal/i,
    ],
  },
  {
    merchantName: "AIG Insurance",
    kind: "purchase",
    patterns: [
      /\baig\b/i,
      /revolut insurance/i,
    ],
  },
  {
    merchantName: "Uber One",
    kind: "purchase",
    patterns: [
      /uber.*one/i,
      /one membership/i,
    ],
  },
  {
    merchantName: "OpenAI",
    kind: "purchase",
    patterns: [
      /openai/i,
      /chatgpt/i,
    ],
  },
  {
    merchantName: "Amazon",
    kind: "purchase",
    patterns: [
      /amzn/i,
      /amazon/i,
    ],
  },
  {
    merchantName: "Google Play",
    kind: "purchase",
    patterns: [
      /google play/i,
    ],
  },
  {
    merchantName: "Google One",
    kind: "purchase",
    patterns: [
      /google one/i,
    ],
  },
  {
    merchantName: "Google Workspace",
    kind: "purchase",
    patterns: [
      /google workspa/i,
      /google workspace/i,
    ],
  },
  {
    merchantName: "Netflix",
    kind: "purchase",
    patterns: [
      /netflix/i,
    ],
  },
  {
    merchantName: "HBO Max",
    kind: "purchase",
    patterns: [
      /hbomax/i,
      /help\.hbomax/i,
    ],
  },
  {
    merchantName: "LegitFit",
    kind: "purchase",
    patterns: [
      /legitfit/i,
    ],
  },
  {
    merchantName: "Humm",
    kind: "purchase",
    patterns: [
      /hummgroup/i,
    ],
  },
  {
    merchantName: "Ray Whelan",
    kind: "purchase",
    patterns: [
      /ray whelan/i,
    ],
  },
  {
    merchantName: "eFlow",
    kind: "purchase",
    patterns: [
      /\beflow\b/i,
    ],
  },
  {
    merchantName: "Perry Oil",
    kind: "purchase",
    patterns: [
      /perry oil/i,
    ],
  },
  {
    merchantName: "Woodie's",
    kind: "purchase",
    patterns: [
      /woodies/i,
    ],
  },
  {
    merchantName: "McCabes Pharmacy",
    kind: "purchase",
    patterns: [
      /mccabes pharma/i,
    ],
  },
  {
    merchantName: "Badger & Dodo",
    kind: "purchase",
    patterns: [
      /badgeranddodo/i,
    ],
  },
  {
    merchantName: "PyImageSearch",
    kind: "purchase",
    patterns: [
      /pyimagesearch/i,
    ],
  },
  {
    merchantName: "Leap Card",
    kind: "purchase",
    patterns: [
      /leap card/i,
    ],
  },
  {
    merchantName: "Burger King",
    kind: "purchase",
    patterns: [
      /burger king/i,
    ],
  },
  {
    merchantName: "Supermac's",
    kind: "purchase",
    patterns: [
      /supermacs/i,
    ],
  },
  {
    merchantName: "Centra",
    kind: "purchase",
    patterns: [
      /\bcentra\b/i,
    ],
  },
  {
    merchantName: "Bank fee",
    kind: "fee",
    patterns: [
      /^fee-/i,
      /quarterly fee/i,
    ],
  },
  {
    merchantName: "Savings transfer",
    kind: "transfer",
    patterns: [
      /^\*?mobi savings/i,
      /^savings$/i,
    ],
  },
];