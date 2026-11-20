import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "destructive"
    | "success"
    | "warning";
}

const variantClasses = {
  default: "bg-indigo-100 text-indigo-700 border-indigo-200",
  secondary: "bg-slate-100 text-slate-700 border-slate-200",
  outline: "bg-transparent text-slate-700 border-slate-300",
  destructive: "bg-rose-100 text-rose-700 border-rose-200",
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
};

export function Badge({
  children,
  className,
  variant = "default",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
