"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, FileText, Loader2, AlertTriangle } from "lucide-react";
import NirfReportTemplate from "@/components/reports/NirfReportTemplate";
import type { ReportConfig, ReportData, ReportMeta } from "@/components/reports/NirfReportTemplate";

function safe(v: number) { return isNaN(v) || !isFinite(v) ? 0 : v; }

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

export default function NIRFReportPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDept, setSelectedDept] = useState("all");
  const [departments, setDepartments] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [patents, setPatents] = useState<any[]>([]);
  const [research, setResearch] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportMeta, setReportMeta] = useState<ReportMeta | null>(null);
  const [config, setConfig] = useState<ReportConfig>({ ...DEFAULT_CONFIG });

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [logoUrl, setLogoUrl] = useState("/images/jjcet-logo.png");

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [depSnap, facSnap, pubSnap, patSnap, resSnap, stuSnap, tgtSnap, settingsSnap] = await Promise.all([
          getDocs(collection(db, "departments")),
          getDocs(collection(db, "faculties")),
          getDocs(collection(db, "publications")),
          getDocs(collection(db, "patents")),
          getDocs(collection(db, "research")),
          getDocs(collection(db, "students")),
          getDocs(collection(db, "targets")),
          getDoc(doc(db, "appSettings", "main")),
        ]);
        setDepartments(depSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setFaculties(facSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPublications(pubSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPatents(patSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setResearch(resSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setStudents(stuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTargets(tgtSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        if (settingsSnap.exists() && settingsSnap.data().logoUrl) setLogoUrl(settingsSnap.data().logoUrl);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadAll();
  }, []);

  const buildReport = () => {
    setGenerating(true);
    const deptId = selectedDept === "all" ? null : selectedDept;
    const now = new Date();
    const reportId = `NIRF-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

    const deptRows = departments.map(dept => {
      const dF = faculties.filter(f => f.departmentId === dept.id);
      const dP = publications.filter(p => p.departmentId === dept.id);
      const dPat = patents.filter(p => p.departmentId === dept.id);
      const dR = research.filter(r => r.departmentId === dept.id);
      const dT = targets.filter(t => t.departmentId === dept.id);
      const phd = dF.filter(f => f.qualification?.toLowerCase().includes("ph.d")).length;
      const pubs = dP.filter(p => p.status === "published").length;
      const granted = dPat.filter(p => p.status === "granted" || p.isGranted).length;
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

    const activeRows = deptId ? deptRows.filter(r => r.dept.id === deptId) : deptRows;
    const len = Math.max(deptRows.length, 1);
    const instTlr = safe(deptRows.reduce((s, r) => s + r.tlr, 0) / len);
    const instRpc = safe(deptRows.reduce((s, r) => s + r.rpc, 0) / len);
    const instGo = safe(deptRows.reduce((s, r) => s + r.go, 0) / len);
    const instOi = safe(deptRows.reduce((s, r) => s + r.oi, 0) / len);
    const instPr = safe(deptRows.reduce((s, r) => s + r.pr, 0) / len);
    const instTotal = instTlr + instRpc + instGo + instOi + instPr;

    const allPubs = publications.filter(p => deptId ? p.departmentId === deptId : true);
    const allPats = patents.filter(p => deptId ? p.departmentId === deptId : true);
    const allRes = research.filter(r => deptId ? r.departmentId === deptId : true);
    const allFac = faculties.filter(f => deptId ? f.departmentId === deptId : true);
    const allStu = students.filter(s => deptId ? s.departmentId === deptId : true);
    const allTgt = targets.filter(t => deptId ? t.departmentId === deptId : true);
    const totalTarget = allTgt.reduce((s, t) => s + (Number(t.yearly) || 0), 0);
    const totalAchieved = allTgt.reduce((s, t) => s + (Number(t.achieved) || 0), 0);

    const dept = deptId ? departments.find(d => d.id === deptId) : null;
    const deptFac = deptId ? faculties.filter(f => f.departmentId === deptId) : allFac;
    const phdCount = deptFac.filter(f => f.qualification?.toLowerCase().includes("ph.d")).length;

    setReportData({
      deptRows: activeRows, instTlr, instRpc, instGo, instOi, instPr, instTotal,
      allPubs, allPats, allRes, allFac, allStu, allTgt,
      totalTarget, totalAchieved, deptId,
    });

    setReportMeta({
      reportId,
      generatedOn: now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
      generatedAt: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      generatedBy: user?.name || "System",
      deptName: dept?.name || "All Departments",
      deptCode: dept?.code || "ALL",
      deptId,
      hodName: config.hodName,
      facultyCount: deptFac.length,
      studentCount: deptId ? students.filter(s => s.departmentId === deptId).length : students.length,
      phdCount,
    });

    setShowReport(true);
    setGenerating(false);
  };

  const printReport = () => {
    const el = reportRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) {
      alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
      return;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>NIRF Report - JJCET</title>
<style>
@page{size:A4 portrait;margin:12mm 15mm;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;font-size:11px;line-height:1.5;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@media print{body{margin:0;padding:0;}}
table{page-break-inside:avoid;}
tr{page-break-inside:avoid;}
</style></head><body>` + el.innerHTML + `</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const updateField = (field: keyof ReportConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateSection = (field: keyof ReportConfig["sections"], value: boolean) => {
    setConfig(prev => ({ ...prev, sections: { ...prev.sections, [field]: value } }));
  };

  const updateRemark = (index: number, value: string) => {
    setConfig(prev => {
      const newRemarks = [...prev.remarks];
      newRemarks[index] = value;
      return { ...prev, remarks: newRemarks };
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="ml-3 text-lg">Loading data from Firestore...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">NIRF Report Generator</h1>
            <p className="text-gray-500">Generate professional department-wise NIRF performance reports</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Report Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Department</Label>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {isSuperAdmin && (
                <>
                  <div>
                    <Label className="text-xs mb-1 block">Academic Year</Label>
                    <Input value={config.academicYear} onChange={(e) => updateField("academicYear", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Rank Band</Label>
                    <Input value={config.rankBand} onChange={(e) => updateField("rankBand", e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {isSuperAdmin && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">HOD Name</Label>
                    <Input value={config.hodName} onChange={(e) => updateField("hodName", e.target.value)} placeholder="HOD Name" className="text-xs" />
                    <textarea className="w-full h-16 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.hodRemark} onChange={(e) => updateField("hodRemark", e.target.value)} placeholder="HOD Remark" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vice Principal Name</Label>
                    <Input value={config.vpName} onChange={(e) => updateField("vpName", e.target.value)} placeholder="VP Name" className="text-xs" />
                    <textarea className="w-full h-16 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.vpRemark} onChange={(e) => updateField("vpRemark", e.target.value)} placeholder="VP Remark" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Principal Name</Label>
                    <Input value={config.principalName} onChange={(e) => updateField("principalName", e.target.value)} placeholder="Principal Name" className="text-xs" />
                    <textarea className="w-full h-16 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none" value={config.principalRemark} onChange={(e) => updateField("principalRemark", e.target.value)} placeholder="Principal Remark" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Sections to Include</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      ["summary", "Dept Info & Summary"],
                      ["progress", "NIRF Parameters"],
                      ["deptTable", "Target vs Achievement"],
                      ["trend", "Score Trend"],
                      ["pendingActivities", "Pending Activities"],
                      ["supportingDocs", "Supporting Documents"],
                      ["remarks", "Remarks"],
                      ["signatures", "Signatures"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={config.sections[key]} onChange={(e) => updateSection(key, e.target.checked)} className="rounded" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-end">
                <Button onClick={buildReport} disabled={generating} size="lg" className="w-full">
                  {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><FileText className="h-4 w-4 mr-2" />Generate NIRF Report</>}
                </Button>
              </div>
              {showReport && (
                <div className="flex items-end">
                  <Button onClick={printReport} variant="outline" size="lg" className="w-full"><Printer className="h-4 w-4 mr-2" />Print / Save PDF</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {showReport && reportData && reportMeta && (
          <div ref={reportRef} className="bg-white shadow-2xl rounded overflow-hidden">
            <NirfReportTemplate
              config={config}
              data={reportData}
              meta={reportMeta}
              logoUrl={logoUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
}
