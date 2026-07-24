"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue>({ value: "", onValueChange: () => {}, open: false, setOpen: () => {} });

function useSelectContext() {
  return React.useContext(SelectContext);
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value = "", onValueChange = () => {}, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen, value } = useSelectContext();
  return (
    <button
      type="button"
      className={cn("flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50", className)}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelectContext();
  return <span className={cn(!value && "text-muted-foreground")}>{value || placeholder || "Select..."}</span>;
}

export function SelectContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen } = useSelectContext();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div ref={ref} className={cn("absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-md", className)}>
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: selected, onValueChange, setOpen } = useSelectContext();
  return (
    <div
      className={cn("relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm hover:bg-slate-100", selected === value && "bg-slate-100 font-medium", className)}
      onClick={() => { onValueChange(value); setOpen(false); }}
    >
      {children}
    </div>
  );
}

export interface SelectPropsCompat extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}
export function SelectCompat({ className, options, placeholder, ...props }: SelectPropsCompat) {
  return (
    <select className={cn("flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900", className)} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
