"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Download, FileText, Upload, Eye } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

const DOC_CATEGORIES = ["Policy", "Circular", "Minutes", "Accreditation", "NIRF", "NAAC", "NBA", "AICTE", "General", "Template", "Report"];

export default function DocumentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "General", description: "", fileUrl: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = async () => {
    try {
      const r = await fetch(`${API}/documents`, { headers });
      const d = await r.json();
      if (d.success) setItems(d.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const body = { ...form };
      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          body.fileUrl = reader.result as string;
          await fetch(`${API}/documents`, { method: "POST", headers, body: JSON.stringify(body) });
          setShowForm(false); setForm({ title: "", category: "General", description: "", fileUrl: "" }); setSelectedFile(null); load();
        };
        reader.readAsDataURL(selectedFile);
      } else {
        await fetch(`${API}/documents`, { method: "POST", headers, body: JSON.stringify(body) });
        setShowForm(false); setForm({ title: "", category: "General", description: "", fileUrl: "" }); load();
      }
    } catch {}
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try { await fetch(`${API}/documents/${id}`, { method: "DELETE", headers }); load(); } catch {}
  };

  const catColors: Record<string, string> = {
    Policy: "bg-red-100 text-red-800", Circular: "bg-orange-100 text-orange-800",
    Minutes: "bg-yellow-100 text-yellow-800", Accreditation: "bg-green-100 text-green-800",
    NIRF: "bg-blue-100 text-blue-800", NAAC: "bg-purple-100 text-purple-800",
    NBA: "bg-pink-100 text-pink-800", AICTE: "bg-teal-100 text-teal-800",
    General: "bg-gray-100 text-gray-800", Template: "bg-indigo-100 text-indigo-800",
    Report: "bg-cyan-100 text-cyan-800",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">Documents</h1><p className="text-muted-foreground">Manage institutional documents and policies</p></div>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Upload Document</Button>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />No documents uploaded yet. Click &quot;Upload Document&quot; to get started.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((d) => (
              <Card key={d.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <Badge className={catColors[d.category] || "bg-gray-100 text-gray-800"}>{d.category}</Badge>
                      </div>
                      <h3 className="font-medium">{d.title}</h3>
                      {d.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.description}</p>}
                      <p className="text-xs text-muted-foreground mt-2">
                        Uploaded: {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {d.fileUrl && (
                        <Button size="sm" variant="ghost" onClick={() => window.open(d.fileUrl, "_blank")}><Eye className="h-4 w-4" /></Button>
                      )}
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
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Document Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Anti-Ragging Policy 2024" /></div>
              <div><Label>Category</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><Label>Description</Label><textarea className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." /></div>
              <div>
                <Label>File</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="flex-1" />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                {selectedFile && <p className="text-xs text-muted-foreground mt-1">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>}
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save} disabled={!form.title}>Upload</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
