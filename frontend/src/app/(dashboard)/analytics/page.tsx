"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Award, FlaskConical, Users, Calendar, Target, TrendingUp, BarChart3 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${API}/analytics/dashboard`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { title: "Publications", value: stats.publications || 0, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Patents", value: stats.patents || 0, icon: Award, color: "text-green-600", bg: "bg-green-50" },
    { title: "Research Projects", value: stats.research || 0, icon: FlaskConical, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Faculty", value: stats.faculty || 0, icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Events", value: stats.events || 0, icon: Calendar, color: "text-pink-600", bg: "bg-pink-50" },
    { title: "Target Achievement", value: `${stats.targetAchievement || 0}%`, icon: Target, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  const barData = [
    { label: "Publications", target: 50, achieved: stats.publications || 0 },
    { label: "Patents", target: 10, achieved: stats.patents || 0 },
    { label: "Projects", target: 15, achieved: stats.research || 0 },
    { label: "Events", target: 20, achieved: stats.events || 0 },
    { label: "Conferences", target: 12, achieved: stats.conferences || 0 },
  ];

  const maxVal = Math.max(...barData.map(b => b.target), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Analytics Dashboard</h1><p className="text-muted-foreground">Institutional performance overview for NIRF compliance</p></div>

        {loading ? <p className="text-muted-foreground">Loading analytics...</p> : (
          <>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {statCards.map((s) => (
                <Card key={s.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Target vs Achievement</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {barData.map((b) => {
                    const pct = b.target > 0 ? Math.min(100, Math.round((b.achieved / b.target) * 100)) : 0;
                    return (
                      <div key={b.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{b.label}</span>
                          <span className="text-muted-foreground">{b.achieved}/{b.target} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 75 ? "bg-blue-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Department Summary</CardTitle></CardHeader>
                <CardContent>
                  {stats.departments?.length > 0 ? (
                    <div className="space-y-3">
                      {stats.departments.map((d: any) => (
                        <div key={d.id || d.name} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium text-sm">{d.name}</span>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{d.publications || 0} pubs</span>
                            <span>{d.faculty || 0} faculty</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      <p>No department data available.</p>
                      <p className="mt-2">Add departments and faculty to see the department-wise summary here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Bar Chart - Performance Metrics</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-end gap-6 h-64 px-4">
                    {barData.map((b) => {
                      const targetH = (b.target / maxVal) * 100;
                      const achievedH = (b.achieved / maxVal) * 100;
                      return (
                        <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex gap-1 items-end" style={{ height: "200px" }}>
                            <div className="flex-1 bg-blue-200 rounded-t-md relative" style={{ height: `${targetH}%` }} title={`Target: ${b.target}`}>
                              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">{b.target}</span>
                            </div>
                            <div className="flex-1 bg-blue-600 rounded-t-md relative" style={{ height: `${achievedH}%` }} title={`Achieved: ${b.achieved}`}>
                              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium">{b.achieved}</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground mt-2">{b.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-4 justify-center text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded" />Target</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-600 rounded" />Achieved</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
