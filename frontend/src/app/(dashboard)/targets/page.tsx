"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Target } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const CATEGORIES = [
  "Publications", "Patents", "Funded Projects", "Conferences", "Workshops",
  "Student Projects", "Placements", "Industry Collaborations", "Consultancy",
  "MoUs", "Faculty Development", "Guest Lectures"
];

export default function TargetsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: "", yearly: "", achieved: "0", year: "2024-25", departmentId: "" });
  const [departments, setDepartments] = useState<any[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = async () => {
    try {
      const [tRes, dRes] = await Promise.all([fetch(`${API}/targets`, { headers }), fetch(`${API}/departments`, { headers })]);
      const tData = await tRes.json();
      const dData = await dRes.json();
      if (tData.success) setItems(tData.data || []);
      if (dData.success) setDepartments(dData.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        category: item.category || "", yearly: String(item.yearly || ""),
        achieved: String(item.achieved || 0), year: item.year || "2024-25",
        departmentId: item.departmentId || "",
      });
    } else {
      setEditingId(null);
      setForm({ category: "", yearly: "", achieved: "0", year: "2024-25", departmentId: "" });
    }
    setShowForm(true);
  };

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API}/targets/${editingId}` : `${API}/targets`;
    try {
      await fetch(url, {
        method, headers,
        body: JSON.stringify({ ...form, yearly: parseInt(form.yearly) || 0, achieved: parseInt(form.achieved) || 0 }),
      });
      setShowForm(false); setEditingId(null); load();
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this target?")) return;
    try { await fetch(`${API}/targets/${id}`, { method: "DELETE", headers }); load(); } catch {}
  };

  const getProgress = (target: any) => {
    if (!target.yearly) return 0;
    return Math.min(100, Math.round(((target.achieved || 0) / target.yearly) * 100));
  };

  const getProgressColor = (pct: number) => pct >= 100 ? "bg-green-500" : pct >= 75 ? "bg-blue-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  const deptName = (id: string) => departments.find(d => d.id === id)?.name || "All Departments";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">Targets</h1><p className="text-muted-foreground">Set and track annual performance targets</p></div>
          <Button onClick={() => openForm()}><Plus className="h-4 w-4 mr-2" />Add Target</Button>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Target className="h-12 w-12 mx-auto mb-4 opacity-50" />No targets set yet. Click &quot;Add Target&quot; to get started.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => {
              const pct = getProgress(t);
              return (
                <Card key={t.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold">{t.category}</h3>
                        <p className="text-xs text-muted-foreground">{deptName(t.departmentId)} | {t.year}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openForm(t)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span>Target</span><span className="font-medium">{t.yearly}</span></div>
                      <div className="flex justify-between text-sm"><span>Achieved</span><span className="font-medium">{t.achieved || 0}</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className={`${getProgressColor(pct)} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground text-right"><Badge variant={pct >= 100 ? "default" : "secondary"}>{pct}%</Badge></p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit Target" : "Add Target"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Category</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select category</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Target Count</Label><Input type="number" value={form.yearly} onChange={(e) => setForm({ ...form, yearly: e.target.value })} placeholder="e.g. 50" /></div>
                <div><Label>Achieved Count</Label><Input type="number" value={form.achieved} onChange={(e) => setForm({ ...form, achieved: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Academic Year</Label><Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
                <div><Label>Department</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="">All Departments</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save} disabled={!form.category || !form.yearly}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
