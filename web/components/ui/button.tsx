"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Segédfüggvény az osztálynevek összefűzéséhez.
 * Mivel töröltük a shadcn-t, ezt ide is beépítjük, hogy biztosan működjön.
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  // Alap stílusok: modern, kerekített, finom interakciókkal
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none shadow-sm",
  {
    variants: {
      variant: {
        // SaaS Indigo: Mély kék, belső fénnyel (indigo-400-as felső él)
        default:
          "bg-indigo-600 text-white border-t border-indigo-400/30 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:bg-indigo-500 hover:shadow-indigo-500/20",

        // SaaS Secondary/Dark: Vercel-szerű sötét gomb
        secondary:
          "bg-slate-900 text-slate-50 border border-slate-800 hover:bg-slate-800 shadow-sm",

        // SaaS Outline: Tiszta fehér, ami hoverre finoman beszürkül/kékül
        outline:
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-indigo-600",

        // SaaS Ghost: Háttér nélküli, csak hoverre jelenik meg
        ghost:
          "text-slate-600 shadow-none hover:bg-slate-100 hover:text-slate-900",

        // SaaS Destructive: Modern rose/piros
        destructive:
          "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300",
      },
      size: {
        icon: "h-10 w-10 p-0",
        sm: "h-9 px-3 text-xs tracking-wide",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-10 text-base font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

// Nagyon fontos: a Named Export, hogy az import { Button } működjön!
export { Button, buttonVariants };
