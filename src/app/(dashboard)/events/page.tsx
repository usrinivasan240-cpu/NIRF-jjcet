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
import { Plus, Trash2, Edit, Calendar } from "lucide-react";

export default function EventsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", type: "conference", date: "", endDate: "", venue: "", participants: "", organizer: "", status: "upcoming", description: "" });

  const load = async () => {
    try {
      const snap = await getDocs(collection(db, "events"));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Load error:", e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        title: item.title || "", type: item.type || "conference",
        date: item.date ? item.date.split("T")[0] : "", endDate: item.endDate ? item.endDate.split("T")[0] : "",
        venue: item.venue || "", participants: String(item.participants || 0),
        organizer: item.organizer || "", status: item.status || "upcoming", description: item.description || "",
      });
    } else {
      setEditingId(null);
      setForm({ title: "", type: "conference", date: "", endDate: "", venue: "", participants: "", organizer: "", status: "upcoming", description: "" });
    }
    setShowForm(true);
  };

  const save = async () => {
    const id = editingId || "evt-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    try {
      await setDoc(doc(db, "events", id), { ...form, participants: parseInt(form.participants) || 0, updatedAt: new Date().toISOString() }, { merge: true });
      setShowForm(false); setEditingId(null); load();
    } catch (e) { console.error("Save error:", e); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try { await deleteDoc(doc(db, "events", id)); load(); } catch (e) { console.error("Delete error:", e); }
  };

  const typeColors: Record<string, string> = { conference: "bg-blue-100 text-blue-800", workshop: "bg-green-100 text-green-800", seminar: "bg-purple-100 text-purple-800", fest: "bg-orange-100 text-orange-800", symposium: "bg-pink-100 text-pink-800" };
  const statusColors: Record<string, string> = { upcoming: "bg-blue-100 text-blue-800", ongoing: "bg-yellow-100 text-yellow-800", completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">Events</h1><p className="text-muted-foreground">Manage conferences, workshops, and seminars</p></div>
          <Button onClick={() => openForm()}><Plus className="h-4 w-4 mr-2" />Add Event</Button>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />No events yet. Click &quot;Add Event&quot; to get started.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="p-4 text-left">Event</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Venue</th>
                  <th className="p-4 text-left">Participants</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr></thead>
                <tbody>{items.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{e.title}</td>
                    <td className="p-4"><Badge className={typeColors[e.type] || ""}>{e.type}</Badge></td>
                    <td className="p-4">{e.date ? new Date(e.date).toLocaleDateString() : "N/A"}</td>
                    <td className="p-4">{e.venue || "N/A"}</td>
                    <td className="p-4">{e.participants || 0}</td>
                    <td className="p-4"><Badge className={statusColors[e.status] || ""}>{e.status}</Badge></td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openForm(e)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogHeader><DialogTitle>{editingId ? "Edit Event" : "Add Event"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Event Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. International Conference on AI" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Type</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="conference">Conference</option><option value="workshop">Workshop</option><option value="seminar">Seminar</option>
                    <option value="fest">Fest</option><option value="symposium">Symposium</option>
                  </select>
                </div>
                <div><Label>Status</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <div><Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. JJCET Auditorium" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Participants</Label><Input type="number" value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} /></div>
                <div><Label>Organizer</Label><Input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} placeholder="Organizing department" /></div>
              </div>
              <div><Label>Description</Label><textarea className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event details..." /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save} disabled={!form.title}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
