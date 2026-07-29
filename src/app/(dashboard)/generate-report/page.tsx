"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, FileText, Loader2, Download, ChevronLeft } from "lucide-react";
import NirfReportTemplate from "@/components/reports/NirfReportTemplate";
import FacultyReport from "@/components/reports/FacultyReport";
import DepartmentAnnualReport from "@/components/reports/DepartmentAnnualReport";
import PublicationReport from "@/components/reports/PublicationReport";
import ConsultancyReport from "@/components/reports/ConsultancyReport";
import StudentAchievementReport from "@/components/reports/StudentAchievementReport";
import NAACReport from "@/components/reports/NAACReport";
import IQACReport from "@/components/reports/IQACReport";
import TargetReport from "@/components/reports/TargetReport";
import MonthlyReviewReport from "@/components/reports/MonthlyReviewReport";
import type { ReportConfig, ReportData, ReportMeta } from "@/components/reports/NirfReportTemplate";

function safe(v: number) { return isNaN(v) || !isFinite(v) ? 0 : v; }

const REPORT_TYPES = [
  { id: "nirf", name: "Department NIRF Performance Report", desc: "NIRF parameter scores, targets, KPIs", icon: "📊" },
  { id: "faculty", name: "Faculty Performance Report", desc: "Individual faculty research & activity report", icon: "👨‍🏫" },
  { id: "annual", name: "Department Annual Report", desc: "Complete yearly department summary", icon: "📋" },
  { id: "publication", name: "Publication Report", desc: "All journal & conference publications", icon: "📄" },
  { id: "consultancy", name: "Consultancy Report", desc: "Industry consultancy projects", icon: "🤝" },
  { id: "student", name: "Student Achievement Report", desc: "Projects, internships, placements, awards", icon: "🎓" },
  { id: "naac", name: "NAAC Report", desc: "NAAC criterion-wise assessment data", icon: "🏅" },
  { id: "iqac", name: "IQAC Report", desc: "Quality initiatives, audits, feedback", icon: "✅" },
  { id: "target", name: "Target Achievement Report", desc: "KPI targets vs actual performance", icon: "🎯" },
  { id: "monthly", name: "Monthly Review Report", desc: "Department-wise monthly KPI review (PDF format)", icon: "📅" },
];

const DEFAULT_CONFIG: ReportConfig = {
  academicYear: "2024-25",
  rankBand: "151 – 200",
  hodName: "Dr. A. HOD Name",
  hodRemark: "",
  vpName: "Dr. B. Vice Principal",
  vpRemark: "",
  principalName: "Dr. C. Principal",
  principalRemark: "",
  remarks: ["", "", "", ""],
  sections: { summary: true, deptTable: true, progress: true, trend: true, remarks: true, signatures: true, pendingActivities: true, supportingDocs: true },
};

export default function ReportGeneratorPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [departments, setDepartments] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [patents, setPatents] = useState<any[]>([]);
  const [research, setResearch] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [monthlyReviews, setMonthlyReviews] = useState<any[]>([]);
  const [logoUrl, setLogoUrl] = useState("/images/jjcet-logo.png");
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;

  useEffect(() => {
    const loadAll = async () => {
      try {
        const snaps = await Promise.all([
          getDocs(collection(db, "departments")),
          getDocs(collection(db, "faculties")),
          getDocs(collection(db, "publications")),
          getDocs(collection(db, "patents")),
          getDocs(collection(db, "research")),
          getDocs(collection(db, "students")),
          getDocs(collection(db, "targets")),
          getDocs(collection(db, "monthlyReviews")),
          getDoc(doc(db, "appSettings", "main")),
        ]);
        setDepartments(snaps[0].docs.map(d => ({ id: d.id, ...d.data() })));
        setFaculties(snaps[1].docs.map(d => ({ id: d.id, ...d.data() })));
        setPublications(snaps[2].docs.map(d => ({ id: d.id, ...d.data() })));
        setPatents(snaps[3].docs.map(d => ({ id: d.id, ...d.data() })));
        setResearch(snaps[4].docs.map(d => ({ id: d.id, ...d.data() })));
        setStudents(snaps[5].docs.map(d => ({ id: d.id, ...d.data() })));
        setTargets(snaps[6].docs.map(d => ({ id: d.id, ...d.data() })));
        setMonthlyReviews(snaps[7].docs.map(d => ({ id: d.id, ...d.data() })));
        if (snaps[8].exists() && snaps[8].data().logoUrl) setLogoUrl(snaps[8].data().logoUrl);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadAll();
  }, []);

  const filterByDept = <T extends { departmentId?: string }>(items: T[]): T[] => {
    return selectedDept === "all" ? items : items.filter(i => i.departmentId === selectedDept);
  };

  const deptName = selectedDept === "all" ? "All Departments" : departments.find(d => d.id === selectedDept)?.name || "Unknown";
  const deptCode = selectedDept === "all" ? "ALL" : departments.find(d => d.id === selectedDept)?.code || "ALL";

  const now = new Date();
  const reportId = `RPT-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  const generatedOn = now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const generatedAt = now.toLocaleTimeString("en-IN");

  const buildNirfData = (): ReportData => {
    const f = filterByDept(faculties);
    const p = filterByDept(publications);
    const pat = filterByDept(patents);
    const r = filterByDept(research);
    const s = filterByDept(students);
    const t = filterByDept(targets);
    const deptRows = departments.map(dept => {
      const dF = faculties.filter(x => x.departmentId === dept.id);
      const dP = publications.filter(x => x.departmentId === dept.id);
      const dPat = patents.filter(x => x.departmentId === dept.id);
      const dR = research.filter(x => x.departmentId === dept.id);
      const dT = targets.filter(x => x.departmentId === dept.id);
      const phd = dF.filter(x => x.qualification?.toLowerCase().includes("ph.d")).length;
      const pubs = dP.filter(x => x.status === "published").length;
      const granted = dPat.filter(x => x.status === "granted").length;
      const tlr = Math.min(30, 22 * (pubs / 8) * 0.4 + 22 * (phd / Math.max(dF.length, 1)) * 0.6);
      const rpc = Math.min(30, 15 + pubs * 0.4 + granted * 1.5);
      const go = Math.min(20, 14 + dT.reduce((s: number, x: any) => s + Number(x.achieved || 0), 0) / Math.max(dT.reduce((s: number, x: any) => s + Number(x.yearly || 0), 0), 1) * 4);
      const oi = Math.min(10, 7 + dF.length * 0.1);
      const pr = Math.min(10, 5 + (pubs + granted) * 0.2);
      const total = tlr + rpc + go + oi + pr;
      return { dept, dF, dP, dPat, dR, dT, phd, pubs, granted, tlr, rpc, go, oi, pr, total, target: 70, achieved: total, pct: Math.round((total / 70) * 100) };
    });
    const len = Math.max(deptRows.length, 1);
    return {
      deptRows,
      instTlr: safe(deptRows.reduce((s, r) => s + r.tlr, 0) / len),
      instRpc: safe(deptRows.reduce((s, r) => s + r.rpc, 0) / len),
      instGo: safe(deptRows.reduce((s, r) => s + r.go, 0) / len),
      instOi: safe(deptRows.reduce((s, r) => s + r.oi, 0) / len),
      instPr: safe(deptRows.reduce((s, r) => s + r.pr, 0) / len),
      instTotal: 0,
      allPubs: p, allPats: pat, allRes: r, allFac: f, allStu: s, allTgt: t,
      totalTarget: t.reduce((s: number, x: any) => s + (Number(x.yearly) || 0), 0),
      totalAchieved: t.reduce((s: number, x: any) => s + (Number(x.achieved) || 0), 0),
      categories: {
        faculty: f.length, students: s.length,
        publications: p.filter((x: any) => x.status === "published").length,
        scopus: p.filter((x: any) => x.isScopus).length,
        patents: pat.filter((x: any) => x.status === "granted").length,
        researchProjects: r.length,
        consultancy: 0, placements: 0, higherStudies: 0, mous: 0,
        events: 0, fdp: 0, workshops: 0, seminars: 0,
      },
      deptId: selectedDept === "all" ? null : selectedDept,
    };
  };

  const buildNirfMeta = (): ReportMeta => ({
    reportId, generatedOn, generatedAt,
    generatedBy: user?.name || "System",
    deptName, deptCode,
    deptId: selectedDept === "all" ? null : selectedDept,
    hodName: DEFAULT_CONFIG.hodName,
    facultyCount: filterByDept(faculties).length,
    studentCount: filterByDept(students).length,
    phdCount: filterByDept(faculties).filter((f: any) => f.qualification?.toLowerCase().includes("ph.d")).length,
  });

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setShowReport(true); setGenerating(false); }, 500);
  };

  const printReport = () => {
    const el = reportRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) { alert("Pop-up blocked. Please allow pop-ups."); return; }
    w.document.write(`<!DOCTYPE html><html><head><title>NIRF Report</title>
<style>@page{size:A4 portrait;margin:12mm 15mm;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;font-size:10px;line-height:1.4;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}table{page-break-inside:avoid;}tr{page-break-inside:avoid;}</style></head><body>` + el.innerHTML + `</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const renderReport = () => {
    if (!showReport) return null;
    switch (selectedType) {
      case "nirf": {
        const data = buildNirfData();
        const meta = buildNirfMeta();
        const instTotal = data.instTlr + data.instRpc + data.instGo + data.instOi + data.instPr;
        data.instTotal = instTotal;
        return <NirfReportTemplate config={DEFAULT_CONFIG} data={data} meta={meta} logoUrl={logoUrl} />;
      }
      case "faculty": {
        const f = filterByDept(faculties)[0];
        if (!f) return <p className="p-8 text-center text-muted-foreground">No faculty data available.</p>;
        const fPubs = publications.filter((p: any) => p.facultyId === f.id || p.authorId === f.id);
        const fPats = patents.filter((p: any) => p.facultyId === f.id || p.inventors?.includes(f.name));
        const fRes = research.filter((r: any) => r.facultyId === f.id || r.pi === f.name);
        const facultyData = {
          faculty: { name: f.name, designation: f.designation || "", department: departments.find(d => d.id === f.departmentId)?.name || "", qualification: f.qualification || "", experience: Number(f.experience) || 0, email: f.email || "", phone: f.phone || "" },
          publications: fPubs.length, patents: fPats.length, books: 0, bookChapters: 0,
          consultancy: 0, sponsoredProjects: fRes.length, fdps: 0, workshops: 0, seminars: 0,
          guestLectures: 0, researchGuidance: 0, studentProjectsGuided: 0,
          awards: [] as string[], professionalMemberships: [] as string[],
          targetVsAchieved: [{ category: "Publications", target: 5, achieved: fPubs.length }, { category: "Patents", target: 1, achieved: fPats.length }],
          pendingActivities: fPubs.length < 5 ? ["Need more publications"] : [],
          verificationStatus: "Pending",
        };
        return <FacultyReport logoUrl={logoUrl} data={facultyData} />;
      }
      case "annual": {
        const f = filterByDept(faculties);
        const p = filterByDept(publications);
        const pat = filterByDept(patents);
        const r = filterByDept(research);
        const s = filterByDept(students);
        const t = filterByDept(targets);
        const annualData = {
          department: { name: deptName, code: deptCode },
          academicYear: DEFAULT_CONFIG.academicYear,
          facultySummary: { total: f.length, phd: f.filter((x: any) => x.qualification?.toLowerCase().includes("ph.d")).length, male: 0, female: 0 },
          studentSummary: { total: s.length, ug: s.filter((x: any) => x.category === "UG").length, pg: s.filter((x: any) => x.category === "PG").length, phd: s.filter((x: any) => x.category === "PhD").length },
          researchOutput: { projects: r.length, funded: r.filter((x: any) => x.status === "completed").length, amount: r.reduce((s: number, x: any) => s + (Number(x.amount) || 0), 0) },
          publications: { journal: p.filter((x: any) => x.type === "journal").length, conference: p.filter((x: any) => x.type === "conference").length, total: p.length },
          patents: { filed: pat.length, granted: pat.filter((x: any) => x.status === "granted").length },
          consultancy: { projects: 0, amount: 0 },
          placementStatistics: { placed: 0, total: s.length, percentage: 0 },
          higherStudies: 0, infrastructure: [] as string[], events: { conferences: 0, workshops: 0, seminars: 0, fdp: 0 },
          budgetSummary: { allocated: 0, spent: 0 },
          targetAchievement: t.map((x: any) => ({ category: x.category || "", target: Number(x.yearly) || 0, achieved: Number(x.achieved) || 0 })),
          documentVerification: [] as any[],
        };
        return <DepartmentAnnualReport logoUrl={logoUrl} data={annualData} />;
      }
      case "publication": {
        const p = filterByDept(publications);
        const pubData = {
          publications: p.map((x: any) => ({
            title: x.title || "", authors: x.authors || "", journal: x.journal || "",
            type: x.type || "journal", year: x.year || "", department: departments.find(d => d.id === x.departmentId)?.name || "",
            doi: x.doi || "", issn: x.issn || "", indexing: x.indexing || "",
            citationCount: Number(x.citationCount) || 0, verificationStatus: x.status || "pending",
          })),
          summary: { total: p.length, journal: p.filter((x: any) => x.type === "journal").length, conference: p.filter((x: any) => x.type === "conference").length, scopus: p.filter((x: any) => x.isScopus).length, webOfScience: 0, ugcCare: 0 },
        };
        return <PublicationReport logoUrl={logoUrl} data={pubData} />;
      }
      case "consultancy": {
        const conData = { projects: [] as any[], summary: { totalProjects: 0, totalAmount: 0, completed: 0, ongoing: 0 } };
        return <ConsultancyReport logoUrl={logoUrl} data={conData} />;
      }
      case "student": {
        const s = filterByDept(students);
        const studentData = {
          department: deptName, academicYear: DEFAULT_CONFIG.academicYear,
          projects: s.filter((x: any) => x.category === "project").map((x: any) => ({ title: x.title || "", students: x.name || "", guide: x.guideName || "", status: x.status || "" })),
          internships: [] as any[], certifications: [] as any[], hackathons: [] as any[], competitions: [] as any[],
          higherStudies: s.filter((x: any) => x.status === "higher_studies").map((x: any) => ({ student: x.name || "", university: "", program: "" })),
          awards: [] as any[], placements: s.filter((x: any) => x.status === "placed").map((x: any) => ({ student: x.name || "", company: "", package: "" })),
        };
        return <StudentAchievementReport logoUrl={logoUrl} data={studentData} />;
      }
      case "naac": {
        const naacData = {
          academicYear: DEFAULT_CONFIG.academicYear,
          criteria: [
            { name: "Curricular Aspects", score: 85, maxScore: 100, weightage: 10, keyIndicators: [{ name: "Curriculum Design", score: 80, maxScore: 100 }] },
            { name: "Teaching-Learning", score: 80, maxScore: 100, weightage: 35, keyIndicators: [{ name: "Student Performance", score: 82, maxScore: 100 }] },
            { name: "Research & Innovation", score: 70, maxScore: 100, weightage: 15, keyIndicators: [{ name: "Research Output", score: 68, maxScore: 100 }] },
            { name: "Infrastructure", score: 88, maxScore: 100, weightage: 10, keyIndicators: [{ name: "Learning Resources", score: 90, maxScore: 100 }] },
            { name: "Student Support", score: 82, maxScore: 100, weightage: 10, keyIndicators: [{ name: "Student Progression", score: 85, maxScore: 100 }] },
            { name: "Governance", score: 86, maxScore: 100, weightage: 10, keyIndicators: [{ name: "Institutional Values", score: 88, maxScore: 100 }] },
            { name: "Institutional Values", score: 84, maxScore: 100, weightage: 10, keyIndicators: [{ name: "Best Practices", score: 86, maxScore: 100 }] },
          ],
          ssrSummary: [{ metric: "Overall Score", score: 82, maxScore: 100 }],
          aqarData: [{ metric: "Student Strength", value: String(students.length) }, { metric: "Faculty Strength", value: String(faculties.length) }],
          supportingDocuments: [] as any[],
          departmentContributions: departments.map(d => ({ department: d.name, contribution: "Data collection and reporting", score: 80 })),
          overallGrade: "A", overallScore: 82,
        };
        return <NAACReport logoUrl={logoUrl} data={naacData} />;
      }
      case "iqac": {
        const iqacData = {
          academicYear: DEFAULT_CONFIG.academicYear,
          academicAudit: departments.map(d => ({ department: d.name, auditDate: generatedOn, findings: "Satisfactory", compliance: "Compliant" })),
          qualityInitiatives: [] as any[], feedback: [] as any[],
          actionTaken: [] as any[], bestPractices: [] as any[],
        };
        return <IQACReport logoUrl={logoUrl} data={iqacData} />;
      }
      case "target": {
        const t = filterByDept(targets);
        const targetData = {
          academicYear: DEFAULT_CONFIG.academicYear, department: deptName,
          targets: t.map((x: any) => ({
            kpi: x.category || "", category: x.category || "",
            annualTarget: Number(x.yearly) || 0, currentAchievement: Number(x.achieved) || 0,
            pending: Math.max(0, (Number(x.yearly) || 0) - (Number(x.achieved) || 0)),
            completionPct: safe(((Number(x.achieved) || 0) / Math.max(Number(x.yearly) || 1, 1)) * 100),
            status: (Number(x.achieved) || 0) >= (Number(x.yearly) || 1) ? "Achieved" : "In Progress",
          })),
          summary: { totalKpis: t.length, achieved: t.filter((x: any) => (Number(x.achieved) || 0) >= (Number(x.yearly) || 1)).length, inProgress: 0, behind: 0 },
        };
        return <TargetReport logoUrl={logoUrl} data={targetData} />;
      }
      case "monthly": {
        const dept = departments.find((d: any) => d.id === selectedDept);
        const reviews = monthlyReviews.filter((r: any) => r.departmentId === selectedDept);
        const reviewData = {
          department: { name: dept?.name || "All Departments", code: dept?.code || "ALL" },
          month: "JUNE",
          year: "2026",
          kpis: reviews.flatMap((r: any) => r.kpis || []),
          actionTaken: reviews.flatMap((r: any) => r.actionTaken || []),
          hodName: dept?.hodName || "",
          principalName: "Dr. R. Venkatesan",
        };
        return <MonthlyReviewReport data={reviewData} logoUrl={logoUrl} />;
      }
      default:
        return null;
    }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /><p className="ml-3">Loading...</p></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Report Generator</h1>
          <p className="text-muted-foreground">Select report type and generate professional A4 reports</p>
        </div>

        {!showReport ? (
          <>
            <Card>
              <CardHeader><CardTitle>Select Report Type</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {REPORT_TYPES.map(rt => (
                    <button key={rt.id} onClick={() => setSelectedType(rt.id)} className={`p-4 rounded-lg border-2 text-left transition-all ${selectedType === rt.id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-400"}`}>
                      <div className="text-2xl mb-1">{rt.icon}</div>
                      <div className="font-semibold text-sm">{rt.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{rt.desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedType && (
              <Card>
                <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
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
                    <div>
                      <Label className="text-xs mb-1 block">Academic Year</Label>
                      <Input value={DEFAULT_CONFIG.academicYear} readOnly />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleGenerate} disabled={generating} className="w-full" size="lg">
                        {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><FileText className="h-4 w-4 mr-2" />Generate Report</>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Button variant="outline" onClick={() => setShowReport(false)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
              <h2 className="text-lg font-bold flex-1">{REPORT_TYPES.find(r => r.id === selectedType)?.name}</h2>
              <Button onClick={printReport}><Printer className="h-4 w-4 mr-2" />Print / Save PDF</Button>
            </div>
            <div ref={reportRef} className="bg-white shadow-2xl rounded overflow-hidden">
              {renderReport()}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
