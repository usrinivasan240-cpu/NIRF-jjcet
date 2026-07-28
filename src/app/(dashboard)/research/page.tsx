"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, FlaskConical } from "lucide-react";

export default function ResearchPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", pi: "", coPi: "", fundingAgency: "", amount: "", status: "ongoing", startDate: "", endDate: "", sanctionedYear: "", description: "" });

  const load = async () => {
    try {
      const snap = await getDocs(collection(db, "research"));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Load error:", e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        title: item.title || "", pi: item.pi || "", coPi: item.coPi || "",
        fundingAgency: item.fundingAgency || "", amount: String(item.amount || ""),
        status: item.status || "ongoing", startDate: item.startDate ? item.startDate.split("T")[0] : "",
        endDate: item.endDate ? item.endDate.split("T")[0] : "", sanctionedYear: item.sanctionedYear || "",
        description: item.description || "",
      });
    } else {
      setEditingId(null);
      setForm({ title: "", pi: "", coPi: "", fundingAgency: "", amount: "", status: "ongoing", startDate: "", endDate: "", sanctionedYear: "", description: "" });
    }
    setShowForm(true);
  };

  const save = async () => {
    const id = editingId || "res-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    try {
      await setDoc(doc(db, "research", id), { ...form, amount: parseFloat(form.amount) || 0, updatedAt: new Date().toISOString() }, { merge: true });
      setShowForm(false); setEditingId(null); load();
    } catch (e) { console.error("Save error:", e); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try { await deleteDoc(doc(db, "research", id)); load(); } catch (e) { console.error("Delete error:", e); }
  };

  const statusColors: Record<string, string> = { ongoing: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800", sanctioned: "bg-yellow-100 text-yellow-800" };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">Research Projects</h1><p className="text-muted-foreground">Manage funded research projects</p></div>
          <Button onClick={() => openForm()}><Plus className="h-4 w-4 mr-2" />Add Project</Button>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />No research projects yet. Click &quot;Add Project&quot; to get started.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="p-4 text-left">Title</th>
                  <th className="p-4 text-left">PI</th>
                  <th className="p-4 text-left">Funding Agency</th>
                  <th className="p-4 text-left">Amount (INR)</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr></thead>
                <tbody>{items.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{p.title}</td>
                    <td className="p-4">{p.pi}</td>
                    <td className="p-4">{p.fundingAgency}</td>
                    <td className="p-4">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                    <td className="p-4"><Badge className={statusColors[p.status] || ""}>{p.status}</Badge></td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openForm(p)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogHeader><DialogTitle>{editingId ? "Edit Project" : "Add Research Project"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Project Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Research project title" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Principal Investigator</Label><Input value={form.pi} onChange={(e) => setForm({ ...form, pi: e.target.value })} placeholder="PI name" /></div>
                <div><Label>Co-PI</Label><Input value={form.coPi} onChange={(e) => setForm({ ...form, coPi: e.target.value })} placeholder="Co-PI name" /></div>
              </div>
              <div><Label>Funding Agency</Label><Input value={form.fundingAgency} onChange={(e) => setForm({ ...form, fundingAgency: e.target.value })} placeholder="e.g. DST, AICTE, UGC" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Funding Amount (INR)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 500000" /></div>
                <div><Label>Sanctioned Year</Label><Input value={form.sanctionedYear} onChange={(e) => setForm({ ...form, sanctionedYear: e.target.value })} placeholder="e.g. 2023-24" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Status</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="sanctioned">Sanctioned</option>
                  </select>
                </div>
                <div />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <div><Label>Description</Label><textarea className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Project description..." /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save} disabled={!form.title || !form.pi}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
