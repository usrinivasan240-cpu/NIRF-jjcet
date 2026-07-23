"use client";
import { useAuthStore, useAppStore } from "@/store";
import { useRouter } from "next/navigation";
import { LogOut, Sun, Moon, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">NIRF ERP Pro</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <span className="text-xs bg-slate-100 px-2 py-1 rounded">{user?.role}</span>
        <Button variant="ghost" size="sm"><Bell className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}
