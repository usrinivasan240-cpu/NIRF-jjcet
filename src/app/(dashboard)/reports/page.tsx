"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Eye, Send, Trash2, Download, Printer, Edit, Save, X, Loader2 } from "lucide-react";
import NirfReportTemplate from "@/components/reports/NirfReportTemplate";
import type { ReportData, ReportMeta } from "@/components/reports/NirfReportTemplate";

interface ReportConfig {
  academicYear: string;
  rankBand: string;
  hodName: string;
  hodRemark: string;
  vpName: string;
  vpRemark: string;
  principalName: string;
  principalRemark: string;
  remarks: string[];
  sections: {
    summary: boolean;
    deptTable: boolean;
    progress: boolean;
    trend: boolean;
    remarks: boolean;
    signatures: boolean;
  };
}

const REPORT_TYPES = [
  { value: "staff", label: "Staff Reports" },
  { value: "department", label: "Department Reports" },
  { value: "nirf", label: "NIRF Reports" },
  { value: "naac", label: "NAAC Reports" },
  { value: "nba", label: "NBA Reports" },
  { value: "aicte", label: "AICTE Reports" },
];

function safe(v: number) {
  return isNaN(v) || !isFinite(v) ? 0 : v;
}

function genId() {
  return "rpt-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function ConfigForm({ config, setConfig, onChange }: { config: ReportConfig; setConfig: (c: ReportConfig) => void; onChange?: () => void }) {
  const updateField = (field: keyof ReportConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const updateSection = (field: keyof ReportConfig["sections"], value: boolean) => {
    setConfig({ ...config, sections: { ...config.sections, [field]: value } });
  };

  const updateRemark = (index: number, value: string) => {
    const newRemarks = [...config.remarks];
    newRemarks[index] = value;
    setConfig({ ...config, remarks: newRemarks });
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Report Title</Label>
          <Input value={config.academicYear ? `NIRF Report – ${config.academicYear}` : ""} readOnly className="bg-muted" />
        </div>
        <div>
          <Label className="text-xs">Academic Year</Label>
          <Input value={config.academicYear} onChange={(e) => updateField("academicYear", e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Rank Band</Label>
          <Input value={config.rankBand} onChange={(e) => updateField("rankBand", e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Sections to Include</Label>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["summary", "NIRF Report Summary"],
            ["deptTable", "Department Wise Target vs Achieved"],
            ["progress", "Parameter Wise Progress"],
            ["trend", "NIRF Score Trend"],
            ["remarks", "Overall Remarks"],
            ["signatures", "Signatures"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={config.sections[key]} onChange={(e) => updateSection(key, e.target.checked)} className="rounded" />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold">Signatories & Remarks</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Input value={config.hodName} onChange={(e) => updateField("hodName", e.target.value)} placeholder="HOD Name" className="text-xs" />
            <textarea className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.hodRemark} onChange={(e) => updateField("hodRemark", e.target.value)} placeholder="HOD Remark" />
          </div>
          <div className="space-y-2">
            <Input value={config.vpName} onChange={(e) => updateField("vpName", e.target.value)} placeholder="Vice Principal Name" className="text-xs" />
            <textarea className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.vpRemark} onChange={(e) => updateField("vpRemark", e.target.value)} placeholder="VP Remark" />
          </div>
          <div className="space-y-2">
            <Input value={config.principalName} onChange={(e) => updateField("principalName", e.target.value)} placeholder="Principal Name" className="text-xs" />
            <textarea className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.principalRemark} onChange={(e) => updateField("principalRemark", e.target.value)} placeholder="Principal Remark" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Overall Remarks</Label>
        {config.remarks.map((r, i) => (
          <Input key={i} value={r} onChange={(e) => updateRemark(i, e.target.value)} placeholder={`Remark ${i + 1}`} className="text-xs" />
        ))}
      </div>
    </div>
  );
}

const DEFAULT_CONFIG: ReportConfig = {
  academicYear: "2024-25",
  rankBand: "151 – 200",
  hodName: "Dr. A. HOD Name",
  hodRemark: "Reviewed the report. Departmental targets are monitored and necessary actions are planned for improvement.",
  vpName: "Dr. B. Vice Principal",
  vpRemark: "Verified the report. Performance is satisfactory. Departments are directed to achieve the targets.",
  principalName: "Dr. C. Principal",
  principalRemark: "Reviewed and approved the report. Continue the efforts to improve NIRF ranking.",
  remarks: [
    "The institution has shown consistent growth in overall NIRF score.",
    "Major improvement is required in Research and Professional Practice (RP) and Perception (PR) parameters.",
    "Departmental performance is satisfactory with scope for further enhancement.",
    "Focus on publications, patents, consultancy, placements and industry collaborations.",
  ],
  sections: {
    summary: true,
    deptTable: true,
    progress: true,
    trend: true,
    remarks: true,
    signatures: true,
  },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [nirfLoading, setNirfLoading] = useState(false);
  const [nirfReportData, setNirfReportData] = useState<ReportData | null>(null);
  const [nirfReportMeta, setNirfReportMeta] = useState<ReportMeta | null>(null);
  const [config, setConfig] = useState<ReportConfig>({ ...DEFAULT_CONFIG });
  const [viewerConfig, setViewerConfig] = useState<ReportConfig>({ ...DEFAULT_CONFIG });
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const now = new Date();
  const reportId = `RPT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const loadReports = async () => {
    try {
      const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Load reports error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const loadNirfDataFromEngine = async (): Promise<{ deptRows: any[]; instTlr: number; instRpc: number; instGo: number; instOi: number; instPr: number; instTotal: number } | null> => {
    const ENGINE_URL = process.env.NEXT_PUBLIC_REPORT_ENGINE_URL || "http://localhost:5000/api";
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const res = await fetch(`${ENGINE_URL}/report-engine/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          reportType: "nirf",
          academicYear: Number(config.academicYear.split("-")[0]),
          asOfMonth: "March",
          generatedByUserId: user?.id || "system",
          generatedByName: user?.name || "System",
        }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.success || !json.data) return null;
      const engineData = json.data;
      const deptRows = (engineData.departmentRows || []).map((row: any, i: number) => {
        const agg = row.aggregate;
        const targetTotal = row.targetVsAchievement.reduce((s: number, t: any) => s + t.yearlyTarget, 0);
        const achievedTotal = row.targetVsAchievement.reduce((s: number, t: any) => s + t.achieved, 0);
        return {
          dept: { id: row.department.id, name: row.department.name },
          dF: [], dP: [], dPat: [], dR: [], dT: row.targetVsAchievement,
          phd: agg.phdScholarCount, pubs: agg.publicationCount, granted: agg.grantedPatentCount,
          tlr: safe(targetTotal * 0.3), rpc: safe(targetTotal * 0.3), go: safe(targetTotal * 0.2),
          oi: safe(targetTotal * 0.1), pr: safe(targetTotal * 0.1),
          total: safe(achievedTotal), target: safe(targetTotal), achieved: safe(achievedTotal),
          pct: row.overallAchievedPct || 0,
        };
      });
      const totals = engineData.institutionTotals || {};
      const instTlr = safe(totals.publicationCount || 0);
      const instRpc = safe(totals.grantedPatentCount || 0);
      const instGo = safe(totals.researchCount || 0);
      const instOi = safe(totals.studentCount || 0);
      const instPr = safe(totals.eventCount || 0);
      const instTotal = instTlr + instRpc + instGo + instOi + instPr;
      return { deptRows, instTlr, instRpc, instGo, instOi, instPr, instTotal };
    } catch (e) {
      console.warn("Report engine API unavailable, falling back to client-side calculation:", e);
      return null;
    }
  };

  const loadNirfData = async () => {
    const [depSnap, facSnap, pubSnap, patSnap, resSnap, stuSnap, tgtSnap] = await Promise.all([
      getDocs(collection(db, "departments")),
      getDocs(collection(db, "faculties")),
      getDocs(collection(db, "publications")),
      getDocs(collection(db, "patents")),
      getDocs(collection(db, "research")),
      getDocs(collection(db, "students")),
      getDocs(collection(db, "targets")),
    ]);
    const departments = depSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const faculties = facSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const publications = pubSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const patents = patSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const research = resSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const students = stuSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const targets = tgtSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const deptRows = departments.map((dept) => {
      const dF = faculties.filter((f: any) => f.departmentId === dept.id);
      const dP = publications.filter((p: any) => p.departmentId === dept.id);
      const dPat = patents.filter((p: any) => p.departmentId === dept.id);
      const dR = research.filter((r: any) => r.departmentId === dept.id);
      const dT = targets.filter((t: any) => t.departmentId === dept.id);
      const phd = dF.filter((f: any) => f.qualification?.toLowerCase().includes("ph.d")).length;
      const pubs = dP.filter((p: any) => p.status === "published").length;
      const granted = dPat.filter((p: any) => p.status === "granted").length;
      const tlr = Math.min(30, 22 * (pubs / 8) * 0.4 + 22 * (phd / Math.max(dF.length, 1)) * 0.6);
      const rpc = Math.min(30, 15 + pubs * 0.4 + granted * 1.5);
      const go = Math.min(20, 14 + dT.reduce((s: number, t: any) => s + Number(t.achieved || 0), 0) / Math.max(dT.reduce((s: number, t: any) => s + Number(t.yearly || 0), 0), 1) * 4);
      const oi = Math.min(10, 7 + dF.length * 0.1);
      const pr = Math.min(10, 5 + (pubs + granted) * 0.2);
      const total = tlr + rpc + go + oi + pr;
      const target = 70;
      const achieved = total;
      const pct = Math.round((achieved / target) * 100);
      return { dept, dF, dP, dPat, dR, dT, phd, pubs, granted, tlr, rpc, go, oi, pr, total, target, achieved, pct };
    });

    const len = Math.max(deptRows.length, 1);
    const instTlr = safe(deptRows.reduce((s, r) => s + r.tlr, 0) / len);
    const instRpc = safe(deptRows.reduce((s, r) => s + r.rpc, 0) / len);
    const instGo = safe(deptRows.reduce((s, r) => s + r.go, 0) / len);
    const instOi = safe(deptRows.reduce((s, r) => s + r.oi, 0) / len);
    const instPr = safe(deptRows.reduce((s, r) => s + r.pr, 0) / len);
    const instTotal = instTlr + instRpc + instGo + instOi + instPr;

    const allPubs = publications;
    const allPats = patents;
    const allRes = research;
    const allFac = faculties;
    const allStu = students;
    const allTgt = targets;
    const totalTarget = allTgt.reduce((s, t) => s + (Number(t.yearly) || 0), 0);
    const totalAchieved = allTgt.reduce((s, t) => s + (Number(t.achieved) || 0), 0);

    return { deptRows, instTlr, instRpc, instGo, instOi, instPr, instTotal, allPubs, allPats, allRes, allFac, allStu, allTgt, totalTarget, totalAchieved, deptId: null };
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const id = genId();
      const timestamp = new Date().toISOString();
      const reportData = {
        title: `NIRF Report – ${config.academicYear}`,
        type: "nirf",
        category: "nirf_submission_report",
        config: { ...config },
        status: "DRAFT",
        currentLevel: "STAFF",
        creatorId: user?.id || "1",
        departmentId: user?.departmentId || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await setDoc(doc(db, "reports", id), reportData);
      setShowGenerate(false);
      loadReports();
      const engineData = await loadNirfDataFromEngine();
      if (engineData) {
        setNirfReportData(engineData as any);
      } else {
        const fullData = await loadNirfData();
        setNirfReportData(fullData);
      }
      setNirfReportMeta({
        reportId: id,
        generatedOn: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        generatedAt: new Date().toLocaleTimeString("en-IN"),
        generatedBy: user?.name || "System",
        deptName: "All Departments",
        deptCode: "ALL",
        deptId: user?.departmentId || null,
        hodName: config.hodName,
        facultyCount: 0,
        studentCount: 0,
        phdCount: 0,
      });
      setViewerConfig({ ...config });
      setSelectedReport({ id, ...reportData });
      setIsEditing(false);
      setShowViewer(true);
    } catch (e) {
      console.error("Generate report error:", e);
      alert("Error generating report: " + (e as Error).message);
    }
    setGenerating(false);
  };

  const submitReport = async (id: string) => {
    try {
      await setDoc(doc(db, "reports", id), { status: "SUBMITTED", submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, { merge: true });
      loadReports();
    } catch (e) {
      console.error("Submit error:", e);
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    try {
      await deleteDoc(doc(db, "reports", id));
      loadReports();
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const viewReport = async (r: any) => {
    setSelectedReport(r);
    const savedConfig = r.config || { ...DEFAULT_CONFIG };
    setViewerConfig({ ...DEFAULT_CONFIG, ...savedConfig });
    setIsEditing(false);
    setShowViewer(true);
    setNirfLoading(true);
    setNirfReportData(null);

    try {
      const engineData = await loadNirfDataFromEngine();
      if (engineData) {
        setNirfReportData(engineData as any);
      } else {
        const fullData = await loadNirfData();
        setNirfReportData(fullData);
      }
      setNirfReportMeta({
        reportId: r.id || "DRAFT",
        generatedOn: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" }) : new Date().toLocaleDateString("en-IN"),
        generatedAt: r.createdAt ? new Date(r.createdAt).toLocaleTimeString("en-IN") : new Date().toLocaleTimeString("en-IN"),
        generatedBy: r.creatorId || "System",
        deptName: "All Departments",
        deptCode: "ALL",
        deptId: r.departmentId || null,
        hodName: savedConfig.hodName,
        facultyCount: 0,
        studentCount: 0,
        phdCount: 0,
      });
    } catch (e) {
      console.error("Load NIRF data error:", e);
    }
    setNirfLoading(false);
  };

  const startEdit = () => {
    setIsEditing(true);
  };

  const cancelEdit = () => {
    const savedConfig = selectedReport?.config || { ...DEFAULT_CONFIG };
    setViewerConfig({ ...DEFAULT_CONFIG, ...savedConfig });
    setIsEditing(false);
  };

  const saveViewerEdit = async () => {
    if (!selectedReport) return;
    try {
      await setDoc(doc(db, "reports", selectedReport.id), {
        config: { ...viewerConfig },
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSelectedReport({ ...selectedReport, config: { ...viewerConfig } });
      setIsEditing(false);
      loadReports();
    } catch (e) {
      console.error("Save edit error:", e);
      alert("Error saving changes: " + (e as Error).message);
    }
  };

  const printReport = () => {
    const el = reportPrintRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>NIRF Report – ${viewerConfig.academicYear} – JJCET</title>
<style>
@page{size:A4 portrait;margin:5mm;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:1.3;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact;width:100%;margin:0;padding:0;}
</style></head><body>` + el.innerHTML + `</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const downloadCSV = () => {
    if (!reports.length) return;
    const csv = ["Title,Type,Category,Status,Academic Year,Created"].concat(
      reports.map((r) => `"${r.title}","${r.type}","${r.category || ""}","${r.status}","${r.config?.academicYear || ""}","${r.createdAt}"`)
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
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate, manage, and submit reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCSV}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            <Button onClick={() => { setConfig({ ...DEFAULT_CONFIG }); setShowGenerate(true); }}><Plus className="h-4 w-4 mr-2" />Generate Report</Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No reports generated yet. Click &quot;Generate Report&quot; to create one.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left">Title</th>
                    <th className="p-4 text-left">Type</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Level</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{r.title}</td>
                      <td className="p-4"><Badge variant="secondary">{r.type}</Badge></td>
                      <td className="p-4">{r.category?.replace(/_/g, " ")}</td>
                      <td className="p-4">
                        <Badge variant={r.status === "LOCKED" ? "default" : r.status === "SUBMITTED" ? "secondary" : "outline"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-4">{r.currentLevel}</td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => viewReport(r)}><Eye className="h-4 w-4" /></Button>
                          {r.status === "DRAFT" && <Button size="sm" variant="ghost" onClick={() => submitReport(r.id)}><Send className="h-4 w-4" /></Button>}
                          {r.status === "DRAFT" && <Button size="sm" variant="ghost" onClick={() => deleteReport(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Generate Report Dialog */}
        <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate NIRF Report</DialogTitle>
            </DialogHeader>
            <ConfigForm config={config} setConfig={setConfig} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
              <Button onClick={generateReport} disabled={generating}>
                {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : "Generate"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fullscreen Report Viewer Dialog */}
        <Dialog open={showViewer} onOpenChange={setShowViewer}>
          <DialogContent className="w-full h-full max-w-full p-0 m-0 rounded-none border-none gap-0" style={{ maxWidth: "100vw", maxHeight: "100vh", height: "100vh" }}>
            <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b shrink-0">
              <DialogTitle>{isEditing ? "Edit Report Configuration" : selectedReport?.title || "NIRF Report"}</DialogTitle>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button size="sm" variant="outline" onClick={startEdit}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                    <Button size="sm" onClick={printReport}><Printer className="h-4 w-4 mr-1" />Print / PDF</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowViewer(false)}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-4 w-4 mr-1" />Cancel</Button>
                    <Button size="sm" onClick={saveViewerEdit}><Save className="h-4 w-4 mr-1" />Save Changes</Button>
                  </>
                )}
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              {isEditing ? (
                <div className="p-6">
                  <ConfigForm config={viewerConfig} setConfig={setViewerConfig} />
                </div>
              ) : (
                <>
                  {nirfLoading ? (
                    <div className="flex items-center justify-center py-12 h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <p className="ml-3 text-lg">Loading NIRF report data...</p>
                    </div>
                  ) : nirfReportData && nirfReportMeta ? (
                    <div ref={reportPrintRef} className="bg-white">
                      <NirfReportTemplate config={viewerConfig} data={nirfReportData} meta={nirfReportMeta} />
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">Failed to load NIRF data.</div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
