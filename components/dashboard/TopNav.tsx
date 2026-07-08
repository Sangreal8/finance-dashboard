"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Today", href: "/" },
  { label: "Transactions", href: "/transactions" },
  { label: "Budget", href: "/budget" },
  { label: "Goals", href: "/goals" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between">
      <p className="text-sm font-semibold tracking-tight">Finance Dashboard</p>

      <div className="flex rounded-full bg-neutral-100 p-1 text-sm dark:bg-neutral-900">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 transition ${
                isActive
                  ? "bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-neutral-50"
                  : "text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
