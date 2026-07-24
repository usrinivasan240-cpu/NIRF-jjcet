"use client";
import { cn } from "@/lib/utils";
export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode }) {
  if (!open) return null;
  return (<div className="fixed inset-0 z-50"><div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} /><div className="fixed inset-0 flex items-center justify-center p-4"><div className="relative z-50 w-full max-w-lg">{children}</div></div></div>);
}
export function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("rounded-lg border bg-white p-6 shadow-lg", className)} {...props} />; }
export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("flex flex-col space-y-1.5", className)} {...props} />; }
export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) { return <h2 className={cn("text-lg font-semibold", className)} {...props} />; }
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("flex justify-end gap-2 mt-4", className)} {...props} />; }
