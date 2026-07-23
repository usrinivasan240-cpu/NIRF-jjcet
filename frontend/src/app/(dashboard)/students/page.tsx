"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, GraduationCap } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function StudentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", rollNumber: "", email: "", category: "", title: "", year: "", departmentId: "", guideName: "", status: "ongoing" });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = async () => {
    try {
      const [sRes, dRes] = await Promise.all([fetch(`${API}/students`, { headers }), fetch(`${API}/departments`, { headers })]);
      const sData = await sRes.json();
      const dData = await dRes.json();
      if (sData.success) setItems(sData.data || []);
      if (dData.success) setDepartments(dData.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        name: item.name || "", rollNumber: item.rollNumber || "", email: item.email || "",
        category: item.category || "", title: item.title || "", year: item.year || "",
        departmentId: item.departmentId || "", guideName: item.guideName || "", status: item.status || "ongoing",
      });
    } else {
      setEditingId(null);
      setForm({ name: "", rollNumber: "", email: "", category: "", title: "", year: "", departmentId: "", guideName: "", status: "ongoing" });
    }
    setShowForm(true);
  };

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API}/students/${editingId}` : `${API}/students`;
    try {
      await fetch(url, { method, headers, body: JSON.stringify(form) });
      setShowForm(false); setEditingId(null); load();
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    try { await fetch(`${API}/students/${id}`, { method: "DELETE", headers }); load(); } catch {}
  };

  const deptName = (id: string) => departments.find(d => d.id === id)?.name || "N/A";
  const catColors: Record<string, string> = {UG: "bg-blue-100 text-blue-800", PG: "bg-purple-100 text-purple-800", PhD: "bg-green-100 text-green-800"};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">Students</h1><p className="text-muted-foreground">Manage student records and achievements</p></div>
          <Button onClick={() => openForm()}><Plus className="h-4 w-4 mr-2" />Add Student</Button>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />No student records yet. Click &quot;Add Student&quot; to get started.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Roll No</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Title</th>
                  <th className="p-4 text-left">Year</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr></thead>
                <tbody>{items.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{s.name}</td>
                    <td className="p-4">{s.rollNumber}</td>
                    <td className="p-4"><Badge className={catColors[s.category] || ""}>{s.category || "N/A"}</Badge></td>
                    <td className="p-4 max-w-[200px] truncate">{s.title || "N/A"}</td>
                    <td className="p-4">{s.year}</td>
                    <td className="p-4"><Badge variant={s.status === "completed" ? "default" : "secondary"}>{s.status}</Badge></td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openForm(s)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? "Edit Student" : "Add Student"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Roll Number</Label><Input value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Category</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select</option><option value="UG">UG</option><option value="PG">PG</option><option value="PhD">PhD</option>
                  </select>
                </div>
              </div>
              <div><Label>Title / Project</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project or achievement title" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Year</Label><Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g. 2024-25" /></div>
                <div><Label>Department</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="">Select</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Guide Name</Label><Input value={form.guideName} onChange={(e) => setForm({ ...form, guideName: e.target.value })} /></div>
                <div><Label>Status</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="ongoing">Ongoing</option><option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save} disabled={!form.name}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
