import * as React from "react";
import { cn } from "@/lib/utils";

const v: Record<string, string> = {
  default: "bg-slate-900 text-white hover:bg-slate-800",
  destructive: "bg-red-500 text-white hover:bg-red-600",
  outline: "border border-gray-300 bg-white hover:bg-gray-50",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  ghost: "hover:bg-gray-100",
};
const s: Record<string, string> = { default: "h-10 px-4 py-2", sm: "h-8 px-3 text-sm", lg: "h-12 px-6", icon: "h-10 w-10" };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: string; size?: string; }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button ref={ref} className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50", v[variant], s[size], className)} {...props} />
  )
);
Button.displayName = "Button";
