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
import { Plus, Trash2, Edit, Users } from "lucide-react";

export default function FacultyPage() {
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", designation: "", qualification: "", experience: "", departmentId: "", employeeId: "" });

  const load = async () => {
    try {
      const [fSnap, dSnap] = await Promise.all([
        getDocs(collection(db, "faculties")),
        getDocs(collection(db, "departments")),
      ]);
      setItems(fSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setDepartments(dSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Load error:", e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        name: item.name || "", email: item.email || "", phone: item.phone || "",
        designation: item.designation || "", qualification: item.qualification || "",
        experience: String(item.experience || ""), departmentId: item.departmentId || "",
        employeeId: item.employeeId || "",
      });
    } else {
      setEditingId(null);
      setForm({ name: "", email: "", phone: "", designation: "", qualification: "", experience: "", departmentId: "", employeeId: "" });
    }
    setShowForm(true);
  };

  const save = async () => {
    const id = editingId || "fac-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    try {
      await setDoc(doc(db, "faculties", id), { ...form, experience: parseInt(form.experience) || 0, updatedAt: new Date().toISOString() }, { merge: true });
      setShowForm(false); setEditingId(null); load();
    } catch (e) { console.error("Save error:", e); }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this faculty member?")) return;
    try { await deleteDoc(doc(db, "faculties", id)); load(); } catch (e) { console.error("Delete error:", e); }
  };

  const deptName = (id: string) => departments.find(d => d.id === id)?.name || "N/A";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">Faculty</h1><p className="text-muted-foreground">Manage faculty members and their profiles</p></div>
          <Button onClick={() => openForm()}><Plus className="h-4 w-4 mr-2" />Add Faculty</Button>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-50" />No faculty members yet. Click &quot;Add Faculty&quot; to get started.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Designation</th>
                  <th className="p-4 text-left">Department</th>
                  <th className="p-4 text-left">Experience</th>
                  <th className="p-4 text-right">Actions</th>
                </tr></thead>
                <tbody>{items.map((f) => (
                  <tr key={f.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{f.name}</td>
                    <td className="p-4">{f.email}</td>
                    <td className="p-4"><Badge variant="secondary">{f.designation}</Badge></td>
                    <td className="p-4">{deptName(f.departmentId)}</td>
                    <td className="p-4">{f.experience} yrs</td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openForm(f)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogHeader><DialogTitle>{editingId ? "Edit Faculty" : "Add Faculty Member"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dr. R. Kumar" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="faculty@jjcet.ac.in" /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Employee ID</Label><Input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="e.g. JJCET-CS-001" /></div>
                <div><Label>Department</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div><Label>Designation</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}>
                  <option value="">Select designation</option>
                  <option value="Professor">Professor</option><option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option><option value="Lecturer">Lecturer</option>
                  <option value="HOD">Head of Department</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Qualification</Label><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. Ph.D, M.Tech" /></div>
                <div><Label>Experience (years)</Label><Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save} disabled={!form.name || !form.email}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
