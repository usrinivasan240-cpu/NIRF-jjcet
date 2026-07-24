"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store";
import { LayoutDashboard, Building2, Users, BookOpen, Lightbulb, FlaskConical, GraduationCap, Calendar, Target, FileText, CheckCircle, PenTool, FolderOpen, BarChart3, Bell, UserCog, Settings, Database, Award } from "lucide-react";
import { Role } from "@/types";

const allItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/departments", label: "Departments", icon: Building2, roles: ["SUPER_ADMIN"] },
  { href: "/faculty", label: "Faculty", icon: Users },
  { href: "/publications", label: "Publications", icon: BookOpen },
  { href: "/patents", label: "Patents", icon: Lightbulb },
  { href: "/research", label: "Research", icon: FlaskConical },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/targets", label: "Targets", icon: Target },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/nirf-report", label: "NIRF Report", icon: Award },
  { href: "/approvals", label: "Approvals", icon: CheckCircle },
  { href: "/signatures", label: "Signatures", icon: PenTool },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/users", label: "Users", icon: UserCog, roles: ["SUPER_ADMIN"] },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/seed", label: "Seed Database", icon: Database, roles: ["SUPER_ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const items = allItems.filter(i => !i.roles || i.roles.includes(user?.role));

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4">
      <div className="flex items-center gap-3 mb-8 p-2">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center"><span className="text-slate-900 font-bold text-lg">J</span></div>
        <div><p className="font-bold text-sm">NIRF ERP Pro</p><p className="text-xs text-gray-400">JJCET</p></div>
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${active ? "bg-white text-slate-900" : "text-gray-300 hover:bg-slate-800"}`}>
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
