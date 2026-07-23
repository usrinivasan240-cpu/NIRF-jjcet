"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/shared/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, BookOpen, Lightbulb, FlaskConical, GraduationCap, FileText, Calendar } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API}/analytics`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.data) setStats(d.data); }).catch(() => {});
    }
  }, []);

  const cards = stats ? [
    { title: "Departments", value: stats.departments || 0, icon: Building2 },
    { title: "Faculty", value: stats.faculty || 0, icon: Users },
    { title: "Publications", value: stats.publications || 0, icon: BookOpen },
    { title: "Patents", value: stats.patents || 0, icon: Lightbulb },
    { title: "Research", value: stats.research || 0, icon: FlaskConical },
    { title: "Students", value: stats.students || 0, icon: GraduationCap },
    { title: "Events", value: stats.events || 0, icon: Calendar },
    { title: "Reports", value: stats.reports || 0, icon: FileText },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Welcome, {user?.name || "User"}</h1><p className="text-gray-500">JJCET Institutional Overview</p></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{cards.map((c) => <StatsCard key={c.title} {...c} />)}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent className="space-y-2">
            <a href="/reports" className="block p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-sm font-medium">Generate New Report</a>
            <a href="/approvals" className="block p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-sm font-medium">View Pending Approvals</a>
            <a href="/signatures" className="block p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-sm font-medium">Manage E-Signatures</a>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>System Info</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-gray-500">
            <p>Role: <span className="font-medium text-gray-900">{user?.role}</span></p>
            <p>Department: <span className="font-medium text-gray-900">{user?.departmentId || "All"}</span></p>
            <p>System: NIRF ERP Pro - JJCET</p>
          </CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
