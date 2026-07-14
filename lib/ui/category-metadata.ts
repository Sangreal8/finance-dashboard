import type { MerchantCategory } from "@/lib/merchants";

export interface CategoryPresentationMetadata {
  label: string;
  description: string;
  tone: "default" | "muted" | "success" | "warning" | "info";
  badgeClassName: string;
  surfaceClassName: string;
}

const baseBadge = "rounded-full border px-2.5 py-1 text-[11px] font-medium";
const baseSurface = "rounded-2xl border px-4 py-3";

const metadataByCategory: Record<
  MerchantCategory,
  CategoryPresentationMetadata
> = {
  Income: {
    label: "Income",
    description: "Money coming in",
    tone: "success",
    badgeClassName: `${baseBadge} border-emerald-200 bg-emerald-50 text-emerald-700`,
    surfaceClassName: `${baseSurface} border-emerald-200 bg-emerald-50/60`,
  },
  Groceries: {
    label: "Groceries",
    description: "Everyday essentials",
    tone: "info",
    badgeClassName: `${baseBadge} border-sky-200 bg-sky-50 text-sky-700`,
    surfaceClassName: `${baseSurface} border-sky-200 bg-sky-50/70`,
  },
  Bills: {
    label: "Bills",
    description: "Fixed commitments",
    tone: "warning",
    badgeClassName: `${baseBadge} border-amber-200 bg-amber-50 text-amber-700`,
    surfaceClassName: `${baseSurface} border-amber-200 bg-amber-50/70`,
  },
  Fuel: {
    label: "Fuel",
    description: "Transport spend",
    tone: "muted",
    badgeClassName: `${baseBadge} border-zinc-200 bg-zinc-100 text-zinc-700`,
    surfaceClassName: `${baseSurface} border-zinc-200 bg-zinc-50`,
  },
  "Eating out": {
    label: "Eating out",
    description: "Dining and treats",
    tone: "warning",
    badgeClassName: `${baseBadge} border-orange-200 bg-orange-50 text-orange-700`,
    surfaceClassName: `${baseSurface} border-orange-200 bg-orange-50/70`,
  },
  Shopping: {
    label: "Shopping",
    description: "Retail purchases",
    tone: "default",
    badgeClassName: `${baseBadge} border-zinc-200 bg-white text-zinc-700`,
    surfaceClassName: `${baseSurface} border-zinc-200 bg-white`,
  },
  Legal: {
    label: "Legal",
    description: "Professional or legal costs",
    tone: "info",
    badgeClassName: `${baseBadge} border-violet-200 bg-violet-50 text-violet-700`,
    surfaceClassName: `${baseSurface} border-violet-200 bg-violet-50/70`,
  },
  Savings: {
    label: "Savings",
    description: "Money set aside",
    tone: "success",
    badgeClassName: `${baseBadge} border-emerald-200 bg-emerald-50 text-emerald-700`,
    surfaceClassName: `${baseSurface} border-emerald-200 bg-emerald-50/60`,
  },
  Other: {
    label: "Other",
    description: "Miscellaneous spend",
    tone: "muted",
    badgeClassName: `${baseBadge} border-zinc-200 bg-zinc-100 text-zinc-700`,
    surfaceClassName: `${baseSurface} border-zinc-200 bg-zinc-50`,
  },
  Uncategorised: {
    label: "Uncategorised",
    description: "Needs attention",
    tone: "warning",
    badgeClassName: `${baseBadge} border-amber-200 bg-amber-50 text-amber-700`,
    surfaceClassName: `${baseSurface} border-amber-200 bg-amber-50/70`,
  },
};

export function getCategoryPresentation(category: MerchantCategory) {
  return metadataByCategory[category] ?? metadataByCategory.Other;
}
