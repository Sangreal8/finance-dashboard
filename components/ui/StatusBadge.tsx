import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  children: React.ReactNode;
  tone?: "default" | "muted" | "success" | "warning" | "info";
  className?: string;
}

export function StatusBadge({
  children,
  tone = "default",
  className,
}: StatusBadgeProps) {
  const toneClasses = {
    default: "bg-zinc-100 text-zinc-700",
    muted: "bg-zinc-50 text-zinc-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-sky-50 text-sky-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
