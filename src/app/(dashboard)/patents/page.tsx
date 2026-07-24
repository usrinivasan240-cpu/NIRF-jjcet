"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Award } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function PatentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", patentNumber: "", country: "India", status: "filed", isGranted: false, filingDate: "", grantDate: "", inventors: "", abstract: "" });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = async () => {
    try {
      const r = await fetch(`${API}/patents`, { headers });
      const d = await r.json();
      if (d.success) setItems(d.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        title: item.title || "",
        patentNumber: item.patentNumber || "",
        country: item.country || "India",
        status: item.status || "filed",
        isGranted: item.isGranted || false,
        filingDate: item.filingDate ? item.filingDate.split("T")[0] : "",
        grantDate: item.grantDate ? item.grantDate.split("T")[0] : "",
        inventors: item.inventors || "",
        abstract: item.abstract || "",
      });
    } else {
      setEditingId(null);
      setForm({ title: "", patentNumber: "", country: "India", status: "filed", isGranted: false, filingDate: "", grantDate: "", inventors: "", abstract: "" });
    }
    setShowForm(true);
  };

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API}/patents/${editingId}` : `${API}/patents`;
    try {
      await fetch(url, { method, headers, body: JSON.stringify(form) });
      setShowForm(false); setEditingId(null); load();
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this patent?")) return;
    try { await fetch(`${API}/patents/${id}`, { method: "DELETE", headers }); load(); } catch {}
  };

  const statusColors: Record<string, string> = { filed: "bg-yellow-100 text-yellow-800", published: "bg-blue-100 text-blue-800", granted: "bg-green-100 text-green-800" };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">Patents</h1><p className="text-muted-foreground">Manage patent applications and grants</p></div>
          <Button onClick={() => openForm()}><Plus className="h-4 w-4 mr-2" />Add Patent</Button>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Award className="h-12 w-12 mx-auto mb-4 opacity-50" />No patents yet. Click &quot;Add Patent&quot; to get started.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="p-4 text-left">Title</th>
                  <th className="p-4 text-left">Patent No.</th>
                  <th className="p-4 text-left">Country</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Granted</th>
                  <th className="p-4 text-right">Actions</th>
                </tr></thead>
                <tbody>{items.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{p.title}</td>
                    <td className="p-4">{p.patentNumber || "N/A"}</td>
                    <td className="p-4">{p.country}</td>
                    <td className="p-4"><Badge className={statusColors[p.status] || ""}>{p.status}</Badge></td>
                    <td className="p-4">{p.isGranted ? "Yes" : "No"}</td>
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
            <DialogHeader><DialogTitle>{editingId ? "Edit Patent" : "Add Patent"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Patent title" /></div>
              <div><Label>Inventors</Label><Input value={form.inventors} onChange={(e) => setForm({ ...form, inventors: e.target.value })} placeholder="e.g. Dr. A. Kumar, Mr. B. Singh" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Patent Number</Label><Input value={form.patentNumber} onChange={(e) => setForm({ ...form, patentNumber: e.target.value })} placeholder="e.g. IN202411000001" /></div>
                <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Status</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="filed">Filed</option><option value="published">Published</option><option value="granted">Granted</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="isGranted" checked={form.isGranted} onChange={(e) => setForm({ ...form, isGranted: e.target.checked })} className="h-4 w-4" />
                  <Label htmlFor="isGranted">Is Granted</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Filing Date</Label><Input type="date" value={form.filingDate} onChange={(e) => setForm({ ...form, filingDate: e.target.value })} /></div>
                <div><Label>Grant Date</Label><Input type="date" value={form.grantDate} onChange={(e) => setForm({ ...form, grantDate: e.target.value })} /></div>
              </div>
              <div><Label>Abstract</Label><textarea className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} placeholder="Brief description of the patent..." /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save} disabled={!form.title}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
