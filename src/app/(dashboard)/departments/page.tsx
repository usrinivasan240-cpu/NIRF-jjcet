"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Building2 } from "lucide-react";

export default function DepartmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "", hodId: "" });

  const load = async () => {
    try {
      const snap = await getDocs(collection(db, "departments"));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Load error:", e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setForm({ name: item.name || "", code: item.code || "", description: item.description || "", hodId: item.hodId || "" });
    } else {
      setEditingId(null);
      setForm({ name: "", code: "", description: "", hodId: "" });
    }
    setShowForm(true);
  };

  const save = async () => {
    const id = editingId || "dept-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    try {
      await setDoc(doc(db, "departments", id), { ...form, updatedAt: new Date().toISOString() }, { merge: true });
      setShowForm(false); setEditingId(null); load();
    } catch (e) { console.error("Save error:", e); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    try { await deleteDoc(doc(db, "departments", id)); load(); } catch (e) { console.error("Delete error:", e); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">Departments</h1><p className="text-muted-foreground">Manage academic departments</p></div>
          <Button onClick={() => openForm()}><Plus className="h-4 w-4 mr-2" />Add Department</Button>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />No departments yet. Click &quot;Add Department&quot; to get started.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => (
              <Card key={d.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{d.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Code: {d.code}</p>
                      {d.description && <p className="text-sm mt-2">{d.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openForm(d)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit Department" : "Add Department"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Department Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Science & Engineering" /></div>
              <div><Label>Department Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CSE" /></div>
              <div><Label>Description</Label><textarea className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Department description..." /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save} disabled={!form.name || !form.code}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
