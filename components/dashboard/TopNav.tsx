"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryNavItems = [
  { label: "Today", href: "/" },
  { label: "Transactions", href: "/transactions" },
  { label: "Spending", href: "/spending" },
  { label: "Merchants", href: "/merchants" },
  { label: "Budget", href: "/budget" },
  { label: "Goals", href: "/goals" },
];

const secondaryNavItems = [{ label: "Import", href: "/settings/import" }];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(href);
}

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="rounded-[1.75rem] border border-zinc-200/80 bg-white/80 px-3 py-3 shadow-[0_1px_0_0_rgba(15,23,42,0.04)] backdrop-blur sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3 lg:min-w-[180px]">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.2em] text-zinc-900 uppercase"
          >
            Finance
          </Link>

          <div className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            Command centre
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {primaryNavItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${
                  active
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {secondaryNavItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${
                  active
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
