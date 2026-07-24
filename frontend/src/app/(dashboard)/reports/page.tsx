"use client";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Plus, Eye, Send, Trash2, Download, Printer } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

const REPORT_TYPES = [
  { value: "staff", label: "Staff Reports" },
  { value: "department", label: "Department Reports" },
  { value: "semester", label: "Semester Reports" },
  { value: "annual", label: "Annual Reports" },
  { value: "nirf", label: "NIRF Reports" },
  { value: "naac", label: "NAAC Reports" },
  { value: "nba", label: "NBA Reports" },
  { value: "aicte", label: "AICTE Reports" },
];

const TEMPLATES: Record<string, string[]> = {
  staff: ["Publications", "Patents", "Research", "Events", "Monthly Progress", "Semester Progress", "Annual Performance", "Target Achievement", "Pending Activities"],
  department: ["Complete Report", "Faculty Performance", "Department Publications", "Department Patents", "Student Achievements", "Placement Statistics", "Target vs Achievement", "Monthly Report", "Annual Report"],
  semester: ["Semester Summary", "Faculty Load", "Student Performance", "Research Output"],
  annual: ["Annual Report", "Department Comparison", "Institutional Summary"],
  nirf: ["NIRF Submission Report", "NIRF Parameter Analysis"],
  naac: ["NAAC SSR Report", "NAAC Criterion Analysis"],
  nba: ["NBA Accreditation Report"],
  aicte: ["AICTE Annual Report"],
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [form, setForm] = useState({ title: "", type: "staff", category: "", academicYear: "2024-25", content: "" });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadReports = async () => {
    try {
      const res = await fetch(`${API}/reports`, { headers });
      const data = await res.json();
      if (data.success) setReports(data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadReports(); }, []);

  const generateReport = async () => {
    try {
      const res = await fetch(`${API}/reports/generate`, {
        method: "POST", headers,
        body: JSON.stringify({ ...form, data: JSON.stringify({ generatedBy: user?.name, department: user?.departmentId || "All" }) }),
      });
      const data = await res.json();
      if (data.success) { setShowGenerate(false); loadReports(); }
    } catch {}
  };

  const submitReport = async (id: string) => {
    try {
      await fetch(`${API}/reports/${id}/submit`, { method: "POST", headers });
      loadReports();
    } catch {}
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    try {
      await fetch(`${API}/reports/${id}`, { method: "DELETE", headers });
      loadReports();
    } catch {}
  };

  const viewReport = async (id: string) => {
    try {
      const res = await fetch(`${API}/reports/${id}`, { headers });
      const data = await res.json();
      if (data.success) { setSelectedReport(data.data); setShowViewer(true); }
    } catch {}
  };

  const printReport = () => {
    if (!selectedReport) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const content = selectedReport.content || selectedReport.data || "No content";
    w.document.write(`
      <html><head><title>${selectedReport.title}</title>
      <style>body{font-family:serif;max-width:800px;margin:0 auto;padding:40px;}
      .header{text-align:center;border-bottom:2px solid #000;padding-bottom:20px;margin-bottom:20px;}
      .logo{font-size:24px;font-weight:bold;}
      .meta{font-size:12px;color:#666;margin-top:10px;}
      .content{margin-top:30px;line-height:1.8;}
      .signature-section{margin-top:60px;display:flex;justify-content:space-between;}
      .sig-box{width:200px;border-top:1px solid #000;padding-top:5px;text-align:center;font-size:12px;}
      @media print{body{padding:20px;}}</style></head><body>
      <div class="header"><div class="logo">J.J. College of Engineering & Technology</div>
      <div>NIRF ERP Pro - Official Report</div></div>
      <div class="meta">Report: ${selectedReport.title}<br>Type: ${selectedReport.type}<br>Academic Year: ${selectedReport.academicYear || "N/A"}<br>Status: ${selectedReport.status}<br>Generated: ${new Date().toLocaleString()}</div>
      <div class="content"><pre style="white-space:pre-wrap;font-family:inherit;">${content}</pre></div>
      <div class="signature-section">
        <div class="sig-box">Prepared By<br><br><br>Staff</div>
        <div class="sig-box">Verified By<br><br><br>HOD</div>
        <div class="sig-box">Verified By<br><br><br>Vice Principal</div>
        <div class="sig-box">Approved By<br><br><br>Principal</div>
      </div>
      </body></html>`);
    w.document.close();
    w.print();
  };

  const downloadCSV = () => {
    if (!reports.length) return;
    const csv = ["Title,Type,Category,Status,Academic Year,Created"].concat(
      reports.map(r => `"${r.title}","${r.type}","${r.category}","${r.status}","${r.academicYear || ""}","${r.createdAt}"`)
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "reports.csv";
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-muted-foreground">Generate, manage, and submit reports</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            <Button onClick={() => setShowGenerate(true)}><Plus className="h-4 w-4 mr-2" />Generate Report</Button>
          </div>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : reports.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />No reports generated yet. Click &quot;Generate Report&quot; to create one.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="p-4 text-left">Title</th><th className="p-4 text-left">Type</th><th className="p-4 text-left">Category</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Level</th><th className="p-4 text-right">Actions</th></tr></thead>
                <tbody>{reports.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{r.title}</td>
                    <td className="p-4"><Badge variant="secondary">{r.type}</Badge></td>
                    <td className="p-4">{r.category}</td>
                    <td className="p-4"><Badge variant={r.status === "LOCKED" ? "default" : r.status === "SUBMITTED" ? "secondary" : "outline"}>{r.status}</Badge></td>
                    <td className="p-4">{r.currentLevel}</td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => viewReport(r.id)}><Eye className="h-4 w-4" /></Button>
                        {r.status === "DRAFT" && <Button size="sm" variant="ghost" onClick={() => submitReport(r.id)}><Send className="h-4 w-4" /></Button>}
                        {r.status === "DRAFT" && <Button size="sm" variant="ghost" onClick={() => deleteReport(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
        )}

        <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate New Report</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Report Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. IT Department Annual Report 2024-25" /></div>
              <div><Label>Report Type</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: "" })}>
                  {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div><Label>Category</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select category</option>
                  {(TEMPLATES[form.type] || []).map(t => <option key={t} value={t.toLowerCase().replace(/\s+/g, "_")}>{t}</option>)}
                </select>
              </div>
              <div><Label>Academic Year</Label><Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} /></div>
              <div><Label>Content / Notes</Label><textarea className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Add report content or notes..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
              <Button onClick={generateReport} disabled={!form.title || !form.category}>Generate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showViewer} onOpenChange={setShowViewer}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedReport?.title}</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Type: <Badge variant="secondary">{selectedReport.type}</Badge></span>
                  <span>Status: <Badge>{selectedReport.status}</Badge></span>
                  <span>Level: {selectedReport.currentLevel}</span>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{selectedReport.content || "No content"}</pre>
                </div>
                {selectedReport.signatures?.length > 0 && (
                  <div><h3 className="font-semibold mb-2">Signatures</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedReport.signatures.map((s: any) => (
                        <div key={s.id} className="border rounded-lg p-3 text-center">
                          <img src={s.signatureImage} alt="Signature" className="h-16 mx-auto mb-2" />
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.designation}</p>
                          <p className="text-xs text-muted-foreground">{new Date(s.signedAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={printReport}><Printer className="h-4 w-4 mr-2" />Print / PDF</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
