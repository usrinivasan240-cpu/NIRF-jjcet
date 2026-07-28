"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Eye, Send, Trash2, Download, Printer, Edit, Save, X, Loader2, AlertTriangle } from "lucide-react";
import NirfReportTemplate from "@/components/reports/NirfReportTemplate";
import type { ReportConfig, ReportData, ReportMeta } from "@/components/reports/NirfReportTemplate";

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

function ConfigForm({ config, setConfig }: { config: ReportConfig; setConfig: (c: ReportConfig) => void }) {
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
            ["summary", "Department Info & Executive Summary"],
            ["progress", "NIRF Parameter Summary"],
            ["deptTable", "Target vs Achievement & Pending"],
            ["trend", "NIRF Score Trend"],
            ["remarks", "Remarks & Signatories"],
            ["signatures", "Signature Block"],
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
  const reportIdRef = useRef<string>("");

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;

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

  const loadNirfDataFromEngine = async (): Promise<ReportData | null> => {
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
      const deptRows = (engineData.departmentRows || []).map((row: any) => {
        const agg = row.aggregate;
        const targetTotal = row.targetVsAchievement.reduce((s: number, t: any) => s + t.yearlyTarget, 0);
        const achievedTotal = row.targetVsAchievement.reduce((s: number, t: any) => s + t.achieved, 0);
        const phd = agg.phdScholarCount;
        const pubs = agg.publicationCount;
        const granted = agg.grantedPatentCount;
        const tlr = Math.min(30, 22 * (pubs / 8) * 0.4 + 22 * (phd / Math.max(agg.facultyCount, 1)) * 0.6);
        const rpc = Math.min(30, 15 + pubs * 0.4 + granted * 1.5);
        const go = Math.min(20, 14 + safe(achievedTotal / Math.max(targetTotal, 1)) * 4);
        const oi = Math.min(10, 7 + agg.facultyCount * 0.1);
        const pr = Math.min(10, 5 + (pubs + granted) * 0.2);
        const total = tlr + rpc + go + oi + pr;
        return {
          dept: { id: row.department.id, name: row.department.name },
          dF: [], dP: [], dPat: [], dR: [], dT: row.targetVsAchievement,
          phd, pubs, granted, tlr, rpc, go, oi, pr,
          total, target: 70, achieved: total,
          pct: safe((total / 70) * 100),
        };
      });

      const allFac = engineData.faculty || [];
      const allStu = engineData.students || [];
      const allPubs = engineData.publications || [];
      const allPats = engineData.patents || [];
      const allRes = engineData.research || [];
      const allTgt = deptRows.flatMap((r: any) => r.dT);
      const totalTarget = allTgt.reduce((s: number, t: any) => s + (t.yearlyTarget || t.yearly || 0), 0);
      const totalAchieved = allTgt.reduce((s: number, t: any) => s + (t.achieved || 0), 0);
      const phdCount = allFac.filter((f: any) => f.qualification?.toLowerCase().includes("ph.d")).length;

      const len = Math.max(deptRows.length, 1);
      const instTlr = safe(deptRows.reduce((s: number, r: any) => s + r.tlr, 0) / len);
      const instRpc = safe(deptRows.reduce((s: number, r: any) => s + r.rpc, 0) / len);
      const instGo = safe(deptRows.reduce((s: number, r: any) => s + r.go, 0) / len);
      const instOi = safe(deptRows.reduce((s: number, r: any) => s + r.oi, 0) / len);
      const instPr = safe(deptRows.reduce((s: number, r: any) => s + r.pr, 0) / len);

      return {
        deptRows,
        instTlr, instRpc, instGo, instOi, instPr,
        instTotal: instTlr + instRpc + instGo + instOi + instPr,
        allPubs, allPats, allRes, allFac, allStu, allTgt,
        totalTarget, totalAchieved, deptId: null,
      };
    } catch (e) {
      console.warn("Report engine API unavailable, falling back to client-side calculation:", e);
      return null;
    }
  };

  const loadNirfData = async (): Promise<ReportData> => {
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
    const targets = targets_raw(tgtSnap);

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

    const allPubs = publications;
    const allPats = patents;
    const allRes = research;
    const allFac = faculties;
    const allStu = students;
    const allTgt = targets;
    const totalTarget = allTgt.reduce((s, t) => s + (Number((t as any).yearly) || 0), 0);
    const totalAchieved = allTgt.reduce((s, t) => s + (Number((t as any).achieved) || 0), 0);
    const phdCount = allFac.filter((f: any) => f.qualification?.toLowerCase().includes("ph.d")).length;

    return {
      deptRows,
      instTlr, instRpc, instGo, instOi, instPr,
      instTotal: instTlr + instRpc + instGo + instOi + instPr,
      allPubs, allPats, allRes, allFac, allStu, allTgt,
      totalTarget, totalAchieved, deptId: null,
    };
  };

  function targets_raw(snap: any) {
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }

  const buildMeta = (reportId: string, savedConfig: ReportConfig, report: any, data: ReportData): ReportMeta => {
    const allFac = data.allFac || [];
    const allStu = data.allStu || [];
    const phdCount = allFac.filter((f: any) => f.qualification?.toLowerCase().includes("ph.d")).length;
    return {
      reportId,
      generatedOn: report?.createdAt
        ? new Date(report.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
        : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
      generatedAt: report?.createdAt
        ? new Date(report.createdAt).toLocaleTimeString("en-IN")
        : new Date().toLocaleTimeString("en-IN"),
      generatedBy: report?.creatorId || user?.name || "System",
      deptName: "All Departments",
      deptCode: "ALL",
      deptId: report?.departmentId || null,
      hodName: savedConfig.hodName,
      facultyCount: allFac.length,
      studentCount: allStu.length,
      phdCount,
    };
  };

  const generateReport = async () => {
    setGenerating(true);
    setNirfLoading(true);
    try {
      const id = genId();
      reportIdRef.current = id;
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
      loadReports();

      const engineData = await loadNirfDataFromEngine();
      let fullData: ReportData;
      if (engineData) {
        fullData = engineData;
      } else {
        fullData = await loadNirfData();
      }
      setNirfReportData(fullData);
      setNirfReportMeta(buildMeta(id, config, { id, ...reportData }, fullData));
      setViewerConfig({ ...config });
      setSelectedReport({ id, ...reportData });
      setIsEditing(false);
      setShowGenerate(false);
      setShowViewer(true);
    } catch (e) {
      console.error("Generate report error:", e);
      alert("Error generating report: " + (e as Error).message);
    }
    setNirfLoading(false);
    setGenerating(false);
  };

  const submitReport = async (id: string) => {
    try {
      const ts = new Date().toISOString();
      await setDoc(doc(db, "reports", id), {
        status: "SUBMITTED",
        currentLevel: "STAFF",
        submittedAt: ts,
        updatedAt: ts,
      }, { merge: true });
      const approvalId = "apr-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      await setDoc(doc(db, "approvals", approvalId), {
        reportId: id,
        userId: user?.id || "1",
        userName: user?.name || "Staff",
        userRole: user?.role || "DEPARTMENT_STAFF",
        level: "STAFF",
        status: "PENDING",
        comment: "Initial submission by staff",
        createdAt: ts,
      });
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
      let fullData: ReportData;
      if (engineData) {
        fullData = engineData;
      } else {
        fullData = await loadNirfData();
      }
      setNirfReportData(fullData);
      setNirfReportMeta(buildMeta(r.id || "DRAFT", savedConfig, r, fullData));
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
    if (!w) {
      alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>NIRF Report – ${viewerConfig.academicYear} – JJCET</title>
<style>
@page{size:A4 portrait;margin:12mm 15mm;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;font-size:11px;line-height:1.5;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
table{page-break-inside:avoid;}
tr{page-break-inside:avoid;}
</style></head><body>` + el.innerHTML + `</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
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
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Workflow Level</th>
                    <th className="p-4 text-left">Progress</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => {
                    const levelOrder = ["STAFF", "HOD", "VP", "PRINCIPAL", "LOCKED"];
                    const currentIdx = levelOrder.indexOf(r.currentLevel || "STAFF");
                    const progressPct = Math.min(100, ((currentIdx + 1) / levelOrder.length) * 100);
                    const statusBadge = r.status === "LOCKED"
                      ? "bg-green-100 text-green-800"
                      : r.status === "SUBMITTED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800";
                    return (
                      <tr key={r.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{r.title}</td>
                        <td className="p-4"><Badge variant="secondary">{r.type}</Badge></td>
                        <td className="p-4">
                          <Badge className={statusBadge}>{r.status}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={levelOrder.includes(r.currentLevel) ? (r.currentLevel === "LOCKED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800") : "bg-gray-100 text-gray-800"}>
                            {r.currentLevel || "STAFF"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${progressPct}%`,
                                  backgroundColor: r.status === "LOCKED" ? "#22c55e" : r.status === "SUBMITTED" ? "#3b82f6" : "#9ca3af",
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{currentIdx + 1}/{levelOrder.length}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => viewReport(r)}><Eye className="h-4 w-4" /></Button>
                            {r.status === "DRAFT" && <Button size="sm" variant="ghost" onClick={() => submitReport(r.id)}><Send className="h-4 w-4" /></Button>}
                            {r.status === "DRAFT" && <Button size="sm" variant="ghost" onClick={() => deleteReport(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                      <p>Failed to load NIRF data. Check if data has been seeded.</p>
                    </div>
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
