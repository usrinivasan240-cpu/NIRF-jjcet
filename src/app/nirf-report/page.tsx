"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, FileText, Loader2 } from "lucide-react";
import NirfReportTemplate from "@/components/reports/NirfReportTemplate";
import type { ReportData, ReportMeta } from "@/components/reports/NirfReportTemplate";

function safe(v: number) { return isNaN(v) || !isFinite(v) ? 0 : v; }

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

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const now = new Date();
  const reportId = `NIRF-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [depSnap, facSnap, pubSnap, patSnap, resSnap, stuSnap, tgtSnap] = await Promise.all([
          getDocs(collection(db, "departments")),
          getDocs(collection(db, "faculties")),
          getDocs(collection(db, "publications")),
          getDocs(collection(db, "patents")),
          getDocs(collection(db, "research")),
          getDocs(collection(db, "students")),
          getDocs(collection(db, "targets")),
        ]);
        setDepartments(depSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setFaculties(facSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPublications(pubSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPatents(patSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setResearch(resSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setStudents(stuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTargets(tgtSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadAll();
  }, []);

  const buildReport = () => {
    setGenerating(true);
    const deptId = selectedDept === "all" ? null : selectedDept;

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
    const deptFac = deptId ? faculties.filter(f => f.departmentId === deptId) : [];
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
      hodName: "",
      facultyCount: deptFac.length || allFac.length,
      studentCount: (deptId ? students.filter(s => s.departmentId === deptId).length : students.length),
      phdCount: phdCount || allFac.filter(f => f.qualification?.toLowerCase().includes("ph.d")).length,
    });

    setShowReport(true);
    setGenerating(false);
  };

  const printReport = () => {
    const el = reportRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>NIRF Report - JJCET</title>
<style>
@page{size:A4 portrait;margin:12mm 15mm;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;font-size:11px;line-height:1.5;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@media print{body{margin:0;padding:0;}}
</style></head><body>` + el.innerHTML + `</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
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
          <CardHeader><CardTitle>Generate Report</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Department</label>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
              config={{
                academicYear: "2024-25",
                rankBand: "151 – 200",
                hodName: "",
                hodRemark: "",
                vpName: "",
                vpRemark: "",
                principalName: "",
                principalRemark: "",
                remarks: [
                  "The institution has shown consistent growth in overall NIRF score.",
                  "Major improvement is required in Research and Professional Practice (RP) and Perception (PR) parameters.",
                  "Departmental performance is satisfactory with scope for further enhancement.",
                  "Focus on publications, patents, consultancy, placements and industry collaborations.",
                ],
                sections: { summary: true, deptTable: true, progress: true, trend: true, remarks: true, signatures: true },
              }}
              data={reportData}
              meta={reportMeta}
            />
          </div>
        )}
      </div>
    </div>
  );
}
