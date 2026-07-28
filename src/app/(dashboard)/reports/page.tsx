"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, getDoc } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Eye, Send, Trash2, Download, Printer, Edit, Save, X, Loader2, AlertTriangle, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import NirfReportTemplate from "@/components/reports/NirfReportTemplate";
import type { ReportConfig, ReportData, ReportMeta } from "@/components/reports/NirfReportTemplate";

function safe(v: number) { return isNaN(v) || !isFinite(v) ? 0 : v; }
function genId() { return "rpt-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function serializeReportData(data: ReportData) {
  return {
    deptRows: (data.deptRows || []).map((r: any) => ({
      dept: r.dept ? { id: r.dept.id, name: r.dept.name, code: r.dept.code } : null,
      phd: r.phd, pubs: r.pubs, granted: r.granted,
      tlr: r.tlr, rpc: r.rpc, go: r.go, oi: r.oi, pr: r.pr,
      total: r.total, target: r.target, achieved: r.achieved, pct: r.pct,
      dFCount: r.dF?.length || 0, dPCount: r.dP?.length || 0, dPatCount: r.dPat?.length || 0, dRCount: r.dR?.length || 0, dTCount: r.dT?.length || 0,
    })),
    instTlr: data.instTlr, instRpc: data.instRpc, instGo: data.instGo, instOi: data.instOi, instPr: data.instPr, instTotal: data.instTotal,
    totalTarget: data.totalTarget, totalAchieved: data.totalAchieved,
    categories: data.categories || null,
    allFacCount: data.allFac?.length || 0, allStuCount: data.allStu?.length || 0,
    allPubsCount: data.allPubs?.length || 0, allPatsCount: data.allPats?.length || 0, allResCount: data.allRes?.length || 0,
    deptId: data.deptId || null,
  };
}

function deserializeReportData(raw: any): ReportData {
  return {
    deptRows: (raw.deptRows || []).map((r: any) => ({
      dept: r.dept, dF: Array(r.dFCount || 0).fill({}), dP: Array(r.dPCount || 0).fill({}),
      dPat: Array(r.dPatCount || 0).fill({}), dR: Array(r.dRCount || 0).fill({}), dT: Array(r.dTCount || 0).fill({}),
      phd: r.phd, pubs: r.pubs, granted: r.granted,
      tlr: r.tlr, rpc: r.rpc, go: r.go, oi: r.oi, pr: r.pr,
      total: r.total, target: r.target, achieved: r.achieved, pct: r.pct,
    })),
    instTlr: raw.instTlr || 0, instRpc: raw.instRpc || 0, instGo: raw.instGo || 0, instOi: raw.instOi || 0, instPr: raw.instPr || 0, instTotal: raw.instTotal || 0,
    totalTarget: raw.totalTarget || 0, totalAchieved: raw.totalAchieved || 0,
    categories: raw.categories || undefined,
    allPubs: Array(raw.allPubsCount || 0).fill({}), allPats: Array(raw.allPatsCount || 0).fill({}),
    allRes: Array(raw.allResCount || 0).fill({}),
    allFac: Array(raw.allFacCount || 0).fill({}), allStu: Array(raw.allStuCount || 0).fill({}),
    allTgt: [],
    deptId: raw.deptId || null,
  };
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
  sections: { summary: true, deptTable: true, progress: true, trend: true, remarks: true, signatures: true, pendingActivities: true, supportingDocs: true },
};

function ConfigStep({ config, setConfig }: { config: ReportConfig; setConfig: (c: ReportConfig) => void }) {
  const u = (f: keyof ReportConfig, v: any) => setConfig({ ...config, [f]: v });
  const uS = (f: keyof ReportConfig["sections"], v: boolean) => setConfig({ ...config, sections: { ...config.sections, [f]: v } });
  const uR = (i: number, v: string) => { const r = [...config.remarks]; r[i] = v; setConfig({ ...config, remarks: r }); };
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Academic Year</Label><Input value={config.academicYear} onChange={e => u("academicYear", e.target.value)} /></div>
        <div><Label className="text-xs">Rank Band</Label><Input value={config.rankBand} onChange={e => u("rankBand", e.target.value)} /></div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Sections to Include</Label>
        <div className="grid grid-cols-2 gap-2">
          {([["summary", "Dept Info & Summary"], ["progress", "NIRF Parameters"], ["deptTable", "Target vs Achievement"], ["trend", "Score Trend"], ["pendingActivities", "Pending Activities"], ["supportingDocs", "Supporting Documents"], ["remarks", "Remarks"], ["signatures", "Signatures"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={config.sections[k]} onChange={e => uS(k, e.target.checked)} className="rounded" />{l}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Signatories</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Input value={config.hodName} onChange={e => u("hodName", e.target.value)} placeholder="HOD Name" className="text-xs" />
            <textarea className="w-full h-16 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.hodRemark} onChange={e => u("hodRemark", e.target.value)} placeholder="HOD Remark" />
          </div>
          <div className="space-y-1">
            <Input value={config.vpName} onChange={e => u("vpName", e.target.value)} placeholder="VP Name" className="text-xs" />
            <textarea className="w-full h-16 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.vpRemark} onChange={e => u("vpRemark", e.target.value)} placeholder="VP Remark" />
          </div>
          <div className="space-y-1">
            <Input value={config.principalName} onChange={e => u("principalName", e.target.value)} placeholder="Principal Name" className="text-xs" />
            <textarea className="w-full h-16 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.principalRemark} onChange={e => u("principalRemark", e.target.value)} placeholder="Principal Remark" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Overall Remarks</Label>
        {config.remarks.map((r, i) => <Input key={i} value={r} onChange={e => uR(i, e.target.value)} placeholder={`Remark ${i + 1}`} className="text-xs" />)}
      </div>
    </div>
  );
}

function DataEditStep({ data, setData }: { data: ReportData; setData: (d: ReportData) => void }) {
  const [activeTab, setActiveTab] = useState<"departments" | "categories" | "institutional">("departments");
  const [selectedDept, setSelectedDept] = useState(0);

  const deptRows = data.deptRows || [];
  const row = deptRows[selectedDept];
  const cat = data.categories || {
    faculty: (data.allFac || []).length,
    students: (data.allStu || []).length,
    publications: (data.allPubs || []).filter((p: any) => p.status === "published").length,
    scopus: (data.allPubs || []).filter((p: any) => p.isScopus).length,
    patents: (data.allPats || []).filter((p: any) => p.status === "granted").length,
    researchProjects: (data.allRes || []).length,
    consultancy: 0, placements: 0, higherStudies: 0, mous: 0,
    events: 0, fdp: 0, workshops: 0, seminars: 0,
  };

  const updateCat = (field: string, value: number) => {
    setData({ ...data, categories: { ...cat, [field]: value } });
  };

  const updateDeptRow = (field: string, value: any) => {
    const newRows = [...deptRows];
    newRows[selectedDept] = { ...newRows[selectedDept], [field]: value };
    const len = Math.max(newRows.length, 1);
    const instTlr = safe(newRows.reduce((s: number, r: any) => s + r.tlr, 0) / len);
    const instRpc = safe(newRows.reduce((s: number, r: any) => s + r.rpc, 0) / len);
    const instGo = safe(newRows.reduce((s: number, r: any) => s + r.go, 0) / len);
    const instOi = safe(newRows.reduce((s: number, r: any) => s + r.oi, 0) / len);
    const instPr = safe(newRows.reduce((s: number, r: any) => s + r.pr, 0) / len);
    setData({ ...data, deptRows: newRows, instTlr, instRpc, instGo, instOi, instPr, instTotal: instTlr + instRpc + instGo + instOi + instPr });
  };

  const recalc = () => {
    const r = deptRows[selectedDept];
    if (!r) return;
    const dPubs = r.pubs || 0; const dPhd = r.phd || 0; const dGranted = r.granted || 0; const dFac = r.dF?.length || 1;
    const tlr = Math.min(30, 22 * (dPubs / 8) * 0.4 + 22 * (dPhd / Math.max(dFac, 1)) * 0.6);
    const rpc = Math.min(30, 15 + dPubs * 0.4 + dGranted * 1.5);
    const go = Math.min(20, 14 + (r.achieved / Math.max(r.target, 1)) * 4);
    const oi = Math.min(10, 7 + dFac * 0.1);
    const pr = Math.min(10, 5 + (dPubs + dGranted) * 0.2);
    const total = tlr + rpc + go + oi + pr;
    updateDeptRow("tlr", Math.round(tlr * 100) / 100);
    updateDeptRow("rpc", Math.round(rpc * 100) / 100);
    updateDeptRow("go", Math.round(go * 100) / 100);
    updateDeptRow("oi", Math.round(oi * 100) / 100);
    updateDeptRow("pr", Math.round(pr * 100) / 100);
    updateDeptRow("total", Math.round(total * 100) / 100);
    updateDeptRow("pct", Math.round(safe((total / 70) * 100)));
  };

  const updateInstField = (field: keyof ReportData, value: any) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="flex gap-2 border-b pb-2">
        <Button size="sm" variant={activeTab === "departments" ? "default" : "outline"} onClick={() => setActiveTab("departments")}>Department Data</Button>
        <Button size="sm" variant={activeTab === "categories" ? "default" : "outline"} onClick={() => setActiveTab("categories")}>Target Categories (14)</Button>
        <Button size="sm" variant={activeTab === "institutional" ? "default" : "outline"} onClick={() => setActiveTab("institutional")}>Institutional</Button>
      </div>

      {activeTab === "departments" && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            {deptRows.map((r: any, i: number) => (
              <Button key={i} size="sm" variant={selectedDept === i ? "default" : "outline"} onClick={() => setSelectedDept(i)} className="text-xs">
                {r.dept?.name || `Dept ${i + 1}`}
              </Button>
            ))}
          </div>
          {row && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{row.dept?.name || "Department"}</h4>
                <Button size="sm" variant="outline" onClick={recalc} className="text-xs"><RotateCcw className="h-3 w-3 mr-1" />Auto-Calculate Scores</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs">Faculty Count</Label><Input type="number" value={row.dF?.length || 0} onChange={e => updateDeptRow("dF", Array(Math.max(0, Number(e.target.value))).fill({}))} className="text-xs" /></div>
                <div><Label className="text-xs">PhD Faculty</Label><Input type="number" value={row.phd || 0} onChange={e => updateDeptRow("phd", Number(e.target.value))} className="text-xs" /></div>
                <div><Label className="text-xs">Publications</Label><Input type="number" value={row.pubs || 0} onChange={e => updateDeptRow("pubs", Number(e.target.value))} className="text-xs" /></div>
                <div><Label className="text-xs">Granted Patents</Label><Input type="number" value={row.granted || 0} onChange={e => updateDeptRow("granted", Number(e.target.value))} className="text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label className="text-xs">Target</Label><Input type="number" value={row.target || 70} onChange={e => updateDeptRow("target", Number(e.target.value))} className="text-xs" /></div>
                <div><Label className="text-xs">Achieved</Label><Input type="number" value={row.achieved || 0} onChange={e => updateDeptRow("achieved", Number(e.target.value))} className="text-xs" /></div>
              </div>
              <div className="border-t pt-3">
                <Label className="text-xs font-semibold text-blue-700">NIRF Parameter Scores</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  <div><Label className="text-xs text-muted-foreground">TLR (30)</Label><Input type="number" step="0.01" value={row.tlr || 0} onChange={e => updateDeptRow("tlr", Number(e.target.value))} className="text-xs" /></div>
                  <div><Label className="text-xs text-muted-foreground">RP (30)</Label><Input type="number" step="0.01" value={row.rpc || 0} onChange={e => updateDeptRow("rpc", Number(e.target.value))} className="text-xs" /></div>
                  <div><Label className="text-xs text-muted-foreground">GO (20)</Label><Input type="number" step="0.01" value={row.go || 0} onChange={e => updateDeptRow("go", Number(e.target.value))} className="text-xs" /></div>
                  <div><Label className="text-xs text-muted-foreground">OI (10)</Label><Input type="number" step="0.01" value={row.oi || 0} onChange={e => updateDeptRow("oi", Number(e.target.value))} className="text-xs" /></div>
                  <div><Label className="text-xs text-muted-foreground">PR (10)</Label><Input type="number" step="0.01" value={row.pr || 0} onChange={e => updateDeptRow("pr", Number(e.target.value))} className="text-xs" /></div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <span>Total: <strong>{(row.total || 0).toFixed(2)}</strong> / 100</span>
                  <span>Achievement: <strong>{row.pct || 0}%</strong></span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "categories" && (
        <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
          <h4 className="font-semibold text-sm">Target vs Achievement — All 14 Categories</h4>
          <p className="text-xs text-muted-foreground">Edit target and achieved values for each category. These appear in Section 4 of the report.</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">S.No</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-center">Target</th>
                <th className="p-2 text-center">Achieved</th>
                <th className="p-2 text-center">Pending</th>
                <th className="p-2 text-center">Completion %</th>
              </tr>
            </thead>
            <tbody>
              {([
                ["faculty", "Faculty", 12],
                ["students", "Students", 256],
                ["publications", "Publications", 20],
                ["scopus", "Scopus", 10],
                ["patents", "Patents", 5],
                ["researchProjects", "Research Projects", 8],
                ["consultancy", "Consultancy", 5],
                ["placements", "Placements", 100],
                ["higherStudies", "Higher Studies", 30],
                ["mous", "MoUs", 5],
                ["events", "Events", 10],
                ["fdp", "FDP", 15],
                ["workshops", "Workshops", 10],
                ["seminars", "Seminars", 8],
              ] as const).map(([key, label, defaultTarget], i) => {
                const achieved = cat[key] || 0;
                const targetVal = defaultTarget;
                const pending = Math.max(0, targetVal - achieved);
                const pct = safe((achieved / targetVal) * 100);
                return (
                  <tr key={key} className="border-b hover:bg-muted/30">
                    <td className="p-2 text-center">{i + 1}</td>
                    <td className="p-2 font-medium">{label}</td>
                    <td className="p-2 text-center font-bold">{targetVal}</td>
                    <td className="p-2 text-center">
                      <Input type="number" value={achieved} onChange={e => updateCat(key, Number(e.target.value))} className="text-xs w-20 text-center mx-auto" />
                    </td>
                    <td className="p-2 text-center" style={{ color: pending > 0 ? "#C62828" : "#2E7D32" }}>{pending}</td>
                    <td className="p-2 text-center">{pct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "institutional" && (
        <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
          <h4 className="font-semibold text-sm">Institution-Wide Totals</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-xs">Total Publications</Label><Input type="number" value={(data.allPubs || []).length} readOnly className="text-xs bg-muted" /></div>
            <div><Label className="text-xs">Total Patents</Label><Input type="number" value={(data.allPats || []).length} readOnly className="text-xs bg-muted" /></div>
            <div><Label className="text-xs">Total Research</Label><Input type="number" value={(data.allRes || []).length} readOnly className="text-xs bg-muted" /></div>
            <div><Label className="text-xs">Total Faculty</Label><Input type="number" value={(data.allFac || []).length} readOnly className="text-xs bg-muted" /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-xs">Total Students</Label><Input type="number" value={(data.allStu || []).length} readOnly className="text-xs bg-muted" /></div>
            <div><Label className="text-xs">Total Target</Label><Input type="number" value={data.totalTarget || 0} onChange={e => updateInstField("totalTarget", Number(e.target.value))} className="text-xs" /></div>
            <div><Label className="text-xs">Total Achieved</Label><Input type="number" value={data.totalAchieved || 0} onChange={e => updateInstField("totalAchieved", Number(e.target.value))} className="text-xs" /></div>
            <div><Label className="text-xs">Achievement %</Label><Input type="number" value={data.totalTarget > 0 ? Math.round((data.totalAchieved / data.totalTarget) * 100) : 0} readOnly className="text-xs bg-muted" /></div>
          </div>
          <div className="border-t pt-3">
            <Label className="text-xs font-semibold text-blue-700">Institution NIRF Parameter Averages</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              <div><Label className="text-xs text-muted-foreground">TLR (30)</Label><Input type="number" step="0.01" value={data.instTlr || 0} onChange={e => updateInstField("instTlr", Number(e.target.value))} className="text-xs" /></div>
              <div><Label className="text-xs text-muted-foreground">RP (30)</Label><Input type="number" step="0.01" value={data.instRpc || 0} onChange={e => updateInstField("instRpc", Number(e.target.value))} className="text-xs" /></div>
              <div><Label className="text-xs text-muted-foreground">GO (20)</Label><Input type="number" step="0.01" value={data.instGo || 0} onChange={e => updateInstField("instGo", Number(e.target.value))} className="text-xs" /></div>
              <div><Label className="text-xs text-muted-foreground">OI (10)</Label><Input type="number" step="0.01" value={data.instOi || 0} onChange={e => updateInstField("instOi", Number(e.target.value))} className="text-xs" /></div>
              <div><Label className="text-xs text-muted-foreground">PR (10)</Label><Input type="number" step="0.01" value={data.instPr || 0} onChange={e => updateInstField("instPr", Number(e.target.value))} className="text-xs" /></div>
            </div>
            <div className="mt-2 text-xs">Total Score: <strong>{(data.instTotal || 0).toFixed(2)}</strong> / 100</div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [genStep, setGenStep] = useState<"config" | "data" | null>(null);
  const [editData, setEditData] = useState<ReportData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const reportPrintRef = useRef<HTMLDivElement>(null);
  const reportIdRef = useRef<string>("");

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;

  const loadReports = async () => {
    try {
      const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Load reports error:", e); }
    setLoading(false);
  };

  useEffect(() => { loadReports(); }, []);

  const loadRawData = async (): Promise<ReportData> => {
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
    const instTotal = safe(deptRows.reduce((s, r) => s + r.tlr, 0) / len) + safe(deptRows.reduce((s, r) => s + r.rpc, 0) / len) + safe(deptRows.reduce((s, r) => s + r.go, 0) / len) + safe(deptRows.reduce((s, r) => s + r.oi, 0) / len) + safe(deptRows.reduce((s, r) => s + r.pr, 0) / len);
    const totalTarget = targets.reduce((s, t) => s + (Number((t as any).yearly) || 0), 0);
    const totalAchieved = targets.reduce((s, t) => s + (Number((t as any).achieved) || 0), 0);
    return {
      deptRows,
      instTlr: safe(deptRows.reduce((s, r) => s + r.tlr, 0) / len),
      instRpc: safe(deptRows.reduce((s, r) => s + r.rpc, 0) / len),
      instGo: safe(deptRows.reduce((s, r) => s + r.go, 0) / len),
      instOi: safe(deptRows.reduce((s, r) => s + r.oi, 0) / len),
      instPr: safe(deptRows.reduce((s, r) => s + r.pr, 0) / len),
      instTotal,
      allPubs: publications, allPats: patents, allRes: research,
      allFac: faculties, allStu: students, allTgt: targets,
      totalTarget, totalAchieved,
      categories: {
        faculty: faculties.length,
        students: students.length,
        publications: publications.filter((p: any) => p.status === "published").length,
        scopus: publications.filter((p: any) => p.isScopus).length,
        patents: patents.filter((p: any) => p.status === "granted").length,
        researchProjects: research.length,
        consultancy: 0,
        placements: 0,
        higherStudies: 0,
        mous: 0,
        events: 0,
        fdp: 0,
        workshops: 0,
        seminars: 0,
      },
      deptId: null,
    };
  };

  const handleOpenGenerate = () => {
    setConfig({ ...DEFAULT_CONFIG });
    setGenStep("config");
    setEditData(null);
    setShowGenerate(true);
  };

  const handleConfigNext = async () => {
    setLoadingData(true);
    try {
      const raw = await loadRawData();
      raw.instTotal = raw.instTlr + raw.instRpc + raw.instGo + raw.instOi + raw.instPr;
      setEditData(raw);
      setGenStep("data");
    } catch (e) {
      console.error("Load data error:", e);
      alert("Error loading data: " + (e as Error).message);
    }
    setLoadingData(false);
  };

  const handleGenerateFinal = async () => {
    if (!editData) return;
    setGenerating(true);
    setNirfLoading(true);
    try {
      const id = genId();
      reportIdRef.current = id;
      const ts = new Date().toISOString();
      const reportRecord = {
        title: `NIRF Report – ${config.academicYear}`,
        type: "nirf",
        category: "nirf_submission_report",
        config: { ...config },
        reportData: serializeReportData(editData),
        status: "DRAFT",
        currentLevel: "STAFF",
        creatorId: user?.id || "1",
        departmentId: user?.departmentId || null,
        createdAt: ts,
        updatedAt: ts,
      };
      await setDoc(doc(db, "reports", id), reportRecord);
      loadReports();

      setNirfReportData(editData);
      setNirfReportMeta(buildMeta(id, config, { id, ...reportRecord }, editData));
      setViewerConfig({ ...config });
      setSelectedReport({ id, ...reportRecord });
      setIsEditing(false);
      setShowGenerate(false);
      setShowViewer(true);
    } catch (e) {
      console.error("Generate error:", e);
      alert("Error: " + (e as Error).message);
    }
    setNirfLoading(false);
    setGenerating(false);
  };

  const buildMeta = (reportId: string, cfg: ReportConfig, report: any, data: ReportData): ReportMeta => {
    const fac = data.allFac || [];
    const stu = data.allStu || [];
    return {
      reportId,
      generatedOn: report?.createdAt ? new Date(report.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
      generatedAt: report?.createdAt ? new Date(report.createdAt).toLocaleTimeString("en-IN") : new Date().toLocaleTimeString("en-IN"),
      generatedBy: report?.creatorId || user?.name || "System",
      deptName: "All Departments",
      deptCode: "ALL",
      deptId: report?.departmentId || null,
      hodName: cfg.hodName,
      facultyCount: fac.length,
      studentCount: stu.length,
      phdCount: fac.filter((f: any) => f.qualification?.toLowerCase().includes("ph.d")).length,
    };
  };

  const submitReport = async (id: string) => {
    try {
      const ts = new Date().toISOString();
      await setDoc(doc(db, "reports", id), { status: "SUBMITTED", currentLevel: "STAFF", submittedAt: ts, updatedAt: ts }, { merge: true });
      const approvalId = "apr-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      await setDoc(doc(db, "approvals", approvalId), {
        reportId: id, userId: user?.id || "1", userName: user?.name || "Staff",
        userRole: user?.role || "DEPARTMENT_STAFF", level: "STAFF", status: "PENDING",
        comment: "Initial submission by staff", createdAt: ts,
      });
      loadReports();
    } catch (e) { console.error("Submit error:", e); }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    try { await deleteDoc(doc(db, "reports", id)); loadReports(); } catch (e) { console.error(e); }
  };

  const viewReport = async (r: any) => {
    setSelectedReport(r);
    const sc = r.config || { ...DEFAULT_CONFIG };
    setViewerConfig({ ...DEFAULT_CONFIG, ...sc });
    setIsEditing(false);
    setShowViewer(true);
    setNirfLoading(true);
    setNirfReportData(null);
    try {
      let data: ReportData;
      if (r.reportData) {
        data = deserializeReportData(r.reportData);
      } else {
        data = await loadRawData();
      }
      data.instTotal = data.instTlr + data.instRpc + data.instGo + data.instOi + data.instPr;
      setNirfReportData(data);
      setNirfReportMeta(buildMeta(r.id || "DRAFT", sc, r, data));
    } catch (e) { console.error(e); }
    setNirfLoading(false);
  };

  const printReport = () => {
    const el = reportPrintRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) { alert("Pop-up blocked. Please allow pop-ups."); return; }
    w.document.write(`<!DOCTYPE html><html><head><title>NIRF Report</title>
<style>@page{size:A4 portrait;margin:12mm 15mm;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;font-size:10px;line-height:1.4;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}table{page-break-inside:avoid;}tr{page-break-inside:avoid;}</style></head><body>` + el.innerHTML + `</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
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
            <Button variant="outline" onClick={() => { if (!reports.length) return; const csv = ["Title,Type,Status,Level"].concat(reports.map(r => `"${r.title}","${r.type}","${r.status}","${r.currentLevel || ""}"`)).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "reports.csv"; a.click(); }}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            <Button onClick={handleOpenGenerate}><Plus className="h-4 w-4 mr-2" />Generate Report</Button>
          </div>
        </div>

        {loading ? <p>Loading...</p> : reports.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />No reports yet.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left">Title</th>
                    <th className="p-4 text-left">Type</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Level</th>
                    <th className="p-4 text-left">Progress</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => {
                    const lo = ["STAFF", "HOD", "VP", "PRINCIPAL", "LOCKED"];
                    const ci = lo.indexOf(r.currentLevel || "STAFF");
                    const pct = Math.min(100, ((ci + 1) / lo.length) * 100);
                    return (
                      <tr key={r.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{r.title}</td>
                        <td className="p-4"><Badge variant="secondary">{r.type}</Badge></td>
                        <td className="p-4"><Badge className={r.status === "LOCKED" ? "bg-green-100 text-green-800" : r.status === "SUBMITTED" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>{r.status}</Badge></td>
                        <td className="p-4"><Badge className="bg-yellow-100 text-yellow-800">{r.currentLevel || "STAFF"}</Badge></td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[80px]"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: r.status === "LOCKED" ? "#22c55e" : "#3b82f6" }} /></div>
                            <span className="text-xs text-muted-foreground">{ci + 1}/{lo.length}</span>
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

        {/* Two-Step Generate Dialog */}
        <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Generate NIRF Report
                {genStep === "config" && <Badge>Step 1: Configuration</Badge>}
                {genStep === "data" && <Badge>Step 2: Edit Data</Badge>}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className={`flex items-center gap-1 text-xs ${genStep === "config" ? "text-blue-600 font-bold" : "text-green-600"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${genStep === "config" ? "bg-blue-600 text-white" : "bg-green-600 text-white"}`}>1</div>
                  Config
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <div className={`flex items-center gap-1 text-xs ${genStep === "data" ? "text-blue-600 font-bold" : "text-muted-foreground"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${genStep === "data" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
                  Edit Data
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden min-h-0">
              {genStep === "config" && <ConfigStep config={config} setConfig={setConfig} />}
              {genStep === "data" && editData && <DataEditStep data={editData} setData={setEditData} />}
              {genStep === "data" && loadingData && (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /><span className="ml-2">Loading data...</span></div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t shrink-0">
              {genStep === "config" ? (
                <>
                  <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
                  <Button onClick={handleConfigNext} disabled={loadingData}>
                    {loadingData ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</> : <>Next: Edit Data <ChevronRight className="h-4 w-4 ml-1" /></>}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setGenStep("config")}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
                    <Button onClick={handleGenerateFinal} disabled={generating}>
                      {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><FileText className="h-4 w-4 mr-2" />Generate Report</>}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Viewer Dialog */}
        <Dialog open={showViewer} onOpenChange={setShowViewer}>
          <DialogContent className="flex flex-col p-0 m-0 rounded-none border-none gap-0 w-screen h-screen max-w-full max-h-full">
            <DialogHeader className="flex flex-row items-center justify-between px-4 py-2 border-b shrink-0">
              <DialogTitle className="truncate">{isEditing ? "Edit" : selectedReport?.title || "NIRF Report"}</DialogTitle>
              <div className="flex gap-2 shrink-0">
                {!isEditing ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                    <Button size="sm" onClick={printReport}><Printer className="h-4 w-4 mr-1" />Print</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowViewer(false)}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                    <Button size="sm" onClick={async () => {
                      if (!selectedReport) return;
                      await setDoc(doc(db, "reports", selectedReport.id), {
                        config: { ...viewerConfig },
                        reportData: nirfReportData ? serializeReportData(nirfReportData) : undefined,
                        updatedAt: new Date().toISOString()
                      }, { merge: true });
                      setIsEditing(false);
                      loadReports();
                    }}><Save className="h-4 w-4 mr-1" />Save</Button>
                  </>
                )}
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-auto min-h-0">
              {isEditing ? (
                <div className="p-6"><ConfigStep config={viewerConfig} setConfig={setViewerConfig} /></div>
              ) : nirfLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /><p className="ml-3">Loading...</p></div>
              ) : nirfReportData && nirfReportMeta ? (
                <div ref={reportPrintRef} className="bg-white flex justify-center">
                  <NirfReportTemplate config={viewerConfig} data={nirfReportData} meta={nirfReportMeta} />
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground"><AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" /><p>Failed to load data.</p></div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
