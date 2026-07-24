"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Shield } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function UsersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff", departmentId: "" });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = async () => {
    try {
      const [uRes, dRes] = await Promise.all([fetch(`${API}/users`, { headers }), fetch(`${API}/departments`, { headers })]);
      const uData = await uRes.json();
      const dData = await dRes.json();
      if (uData.success) setItems(uData.data || []);
      if (dData.success) setDepartments(dData.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setForm({ name: item.name || "", email: item.email || "", password: "", role: item.role || "staff", departmentId: item.departmentId || "" });
    } else {
      setEditingId(null);
      setForm({ name: "", email: "", password: "", role: "staff", departmentId: "" });
    }
    setShowForm(true);
  };

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API}/users/${editingId}` : `${API}/users`;
    const body: any = { ...form };
    if (!editingId && !body.password) { alert("Password is required for new users"); return; }
    if (editingId && !body.password) delete body.password;
    try {
      await fetch(url, { method, headers, body: JSON.stringify(body) });
      setShowForm(false); setEditingId(null); load();
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try { await fetch(`${API}/users/${id}`, { method: "DELETE", headers }); load(); } catch {}
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800", principal: "bg-purple-100 text-purple-800",
    vp: "bg-orange-100 text-orange-800", hod: "bg-blue-100 text-blue-800",
    staff: "bg-green-100 text-green-800"
  };
  const deptName = (id: string) => departments.find(d => d.id === id)?.name || "N/A";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">User Management</h1><p className="text-muted-foreground">Manage system users and access roles</p></div>
          <Button onClick={() => openForm()}><Plus className="h-4 w-4 mr-2" />Add User</Button>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />No users found.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">Department</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr></thead>
                <tbody>{items.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4"><Badge className={roleColors[u.role] || ""}>{u.role}</Badge></td>
                    <td className="p-4">{deptName(u.departmentId)}</td>
                    <td className="p-4"><Badge variant={u.isActive !== false ? "default" : "destructive"}>{u.isActive !== false ? "Active" : "Inactive"}</Badge></td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openForm(u)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogHeader><DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dr. R. Kumar" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@jjcet.ac.in" /></div>
              <div><Label>{editingId ? "New Password (leave blank to keep)" : "Password"}</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingId ? "Leave blank to keep current" : "Enter password"} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Role</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="staff">Staff</option><option value="hod">HOD</option><option value="vp">Vice Principal</option>
                    <option value="principal">Principal</option><option value="admin">Admin</option>
                  </select>
                </div>
                <div><Label>Department</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="">Select</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save} disabled={!form.name || !form.email}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
