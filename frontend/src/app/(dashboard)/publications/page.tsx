"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, BookOpen } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function PublicationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", authors: "", journal: "", type: "journal", publisher: "", issn: "", doi: "", citationCount: "0", status: "published" });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = async () => {
    try {
      const r = await fetch(`${API}/publications`, { headers });
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
        authors: item.authors || "",
        journal: item.journal || "",
        type: item.type || "journal",
        publisher: item.publisher || "",
        issn: item.issn || "",
        doi: item.doi || "",
        citationCount: String(item.citationCount || 0),
        status: item.status || "published",
      });
    } else {
      setEditingId(null);
      setForm({ title: "", authors: "", journal: "", type: "journal", publisher: "", issn: "", doi: "", citationCount: "0", status: "published" });
    }
    setShowForm(true);
  };

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API}/publications/${editingId}` : `${API}/publications`;
    try {
      await fetch(url, { method, headers, body: JSON.stringify({ ...form, citationCount: parseInt(form.citationCount) || 0 }) });
      setShowForm(false);
      setEditingId(null);
      load();
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this publication?")) return;
    try { await fetch(`${API}/publications/${id}`, { method: "DELETE", headers }); load(); } catch {}
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">Publications</h1><p className="text-muted-foreground">Manage research publications</p></div>
          <Button onClick={() => openForm()}><Plus className="h-4 w-4 mr-2" />Add Publication</Button>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />No publications yet. Click &quot;Add Publication&quot; to get started.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="p-4 text-left">Title</th>
                  <th className="p-4 text-left">Authors</th>
                  <th className="p-4 text-left">Journal</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr></thead>
                <tbody>{items.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{p.title}</td>
                    <td className="p-4">{p.authors}</td>
                    <td className="p-4">{p.journal}</td>
                    <td className="p-4"><Badge variant="secondary">{p.type}</Badge></td>
                    <td className="p-4"><Badge>{p.status}</Badge></td>
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
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit Publication" : "Add Publication"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Publication title" /></div>
              <div><Label>Authors</Label><Input value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} placeholder="e.g. Dr. A. Kumar, Mr. B. Singh" /></div>
              <div><Label>Journal</Label><Input value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} placeholder="Journal name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Type</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="journal">Journal</option><option value="conference">Conference</option><option value="book">Book</option><option value="chapter">Book Chapter</option>
                  </select>
                </div>
                <div><Label>Status</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="published">Published</option><option value="submitted">Submitted</option><option value="accepted">Accepted</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Publisher</Label><Input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} /></div>
                <div><Label>Citation Count</Label><Input type="number" value={form.citationCount} onChange={(e) => setForm({ ...form, citationCount: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>ISSN</Label><Input value={form.issn} onChange={(e) => setForm({ ...form, issn: e.target.value })} /></div>
                <div><Label>DOI</Label><Input value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save} disabled={!form.title}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
