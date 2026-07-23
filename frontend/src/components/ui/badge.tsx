import { cn } from "@/lib/utils";
export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: string }) {
  const v: Record<string, string> = { default: "bg-slate-900 text-white", secondary: "bg-gray-100 text-gray-800", destructive: "bg-red-100 text-red-800", outline: "border border-gray-300 text-gray-700" };
  return <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", v[variant] || v.default, className)} {...props} />;
}
