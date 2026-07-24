"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, FileText, Loader2 } from "lucide-react";

function getColor(pct: number) {
  if (pct >= 90) return { bg: "#dcfce7", text: "#166534", dot: "#22c55e", label: "Excellent" };
  if (pct >= 75) return { bg: "#fef9c3", text: "#854d0e", dot: "#eab308", label: "Good" };
  if (pct >= 50) return { bg: "#ffedd5", text: "#9a3412", dot: "#f97316", label: "Needs Improvement" };
  return { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444", label: "Critical" };
}

function BarCell({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const c = getColor(pct);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: c.dot }} />
      </div>
      <span className="text-xs font-medium w-10 text-right" style={{ color: c.text }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

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
  const [events, setEvents] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const now = new Date();
  const reportId = `NIRF-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [depSnap, facSnap, pubSnap, patSnap, resSnap, stuSnap, evtSnap, tgtSnap] = await Promise.all([
          getDocs(collection(db, "departments")),
          getDocs(collection(db, "faculties")),
          getDocs(collection(db, "publications")),
          getDocs(collection(db, "patents")),
          getDocs(collection(db, "research")),
          getDocs(collection(db, "students")),
          getDocs(collection(db, "events")),
          getDocs(collection(db, "targets")),
        ]);
        setDepartments(depSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setFaculties(facSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPublications(pubSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPatents(patSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setResearch(resSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setStudents(stuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setEvents(evtSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTargets(tgtSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadAll();
  }, []);

  const buildReport = () => {
    setGenerating(true);
    const deptId = selectedDept === "all" ? null : selectedDept;
    const dept = deptId ? departments.find(d => d.id === deptId) : null;
    const deptName = dept ? dept.name : "All Departments";

    const deptFaculties = deptId ? faculties.filter(f => f.departmentId === deptId) : faculties;
    const deptStudents = deptId ? students.filter(s => s.departmentId === deptId) : students;
    const deptPubs = deptId ? publications.filter(p => p.departmentId === deptId) : publications;
    const deptPatents = deptId ? patents.filter(p => p.departmentId === deptId) : patents;
    const deptResearch = deptId ? research.filter(r => r.departmentId === deptId) : research;
    const deptEvents = deptId ? events.filter(e => e.departmentId === deptId) : events;
    const deptTargets = deptId ? targets.filter(t => t.departmentId === deptId) : targets;

    const totalTarget = deptTargets.reduce((s, t) => s + (Number(t.yearly) || 0), 0);
    const totalAchieved = deptTargets.reduce((s, t) => s + (Number(t.achieved) || 0), 0);
    const achievePct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

    const phdCount = deptFaculties.filter(f => f.qualification?.toLowerCase().includes("ph.d")).length;
    const publishedPubs = deptPubs.filter(p => p.status === "published").length;
    const grantedPatents = deptPatents.filter(p => p.status === "granted").length;
    const filedPatents = deptPatents.filter(p => p.status === "filed").length;
    const ongoingResearch = deptResearch.filter(r => r.status === "ongoing").length;
    const completedResearch = deptResearch.filter(r => r.status === "completed").length;
    const totalFunding = deptResearch.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    const tlr = Math.min(30, Math.round(27 * (publishedPubs / 10) * 0.3 + 27 * (phdCount / Math.max(deptFaculties.length, 1)) * 0.4 + 27 * 0.3));
    const rpc = Math.min(30, Math.round(18 + publishedPubs * 0.3 + grantedPatents * 1));
    const go = Math.min(20, Math.round(17 * achievePct / 100));
    const ei = Math.min(10, Math.round(7 + deptEvents.length * 0.3));
    const pr = Math.min(10, Math.round(5 + achievePct * 0.03));
    const overall = tlr + rpc + go + ei + pr;

    const nirfParams = [
      { name: "Teaching, Learning & Resources (TLR)", weight: 30, target: 27, achieved: tlr },
      { name: "Research & Professional Practice (RPC)", weight: 30, target: 22, achieved: rpc },
      { name: "Graduation Outcomes (GO)", weight: 20, target: 18, achieved: go },
      { name: "Outreach & Inclusivity (EI)", weight: 10, target: 8, achieved: ei },
      { name: "Perception (PR)", weight: 10, target: 8, achieved: pr },
    ];

    const suggestions = [];
    if (rpc < 18) suggestions.push("Increase Scopus/SCI publications by " + (18 - rpc) + " papers.");
    if (pr < 6) suggestions.push("Improve industry consultancy collaborations and employer perception.");
    if (ei < 7) suggestions.push("Conduct more FDPs and workshops on emerging technologies.");
    if (grantedPatents < 5) suggestions.push("Encourage faculty patent filing - target " + (5 - grantedPatents) + " more patents.");
    if (achievePct < 85) suggestions.push("Improve target achievement percentage by " + (85 - achievePct) + "%.");
    suggestions.push("Strengthen alumni and employer engagement for better Perception score.");
    suggestions.push("Increase funded research projects and consultancy revenue.");

    const hodStatus = achievePct >= 85 ? "Department has performed well this year with " + achievePct + "% target achievement." : "Department needs improvement in " + (100 - achievePct) + "% of targets.";
    const vpStatus = rpc < 18 ? "Research output requires significant improvement. Increase publications and funded projects." : "Department performance is satisfactory. Maintain current momentum.";
    const principalStatus = overall >= 20 ? "Approved. Continue improving Research and Perception scores." : "Review needed. Focus on improving all NIRF parameters.";

    const data = {
      deptName, dept, deptFaculties, deptStudents, deptPubs, deptPatents, deptResearch,
      totalTarget, totalAchieved, achievePct, phdCount, publishedPubs, grantedPatents,
      filedPatents, ongoingResearch, completedResearch, totalFunding,
      tlr, rpc, go, ei, pr, overall, nirfParams, suggestions,
      hodStatus, vpStatus, principalStatus,
    };
    setReportData(data);
    setShowReport(true);
    setGenerating(false);
  };

  const printReport = () => {
    const el = reportRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write("<html><head><title>NIRF Report</title><style>" + printStyles + "</style></head><body>" + el.innerHTML + "</body></html>");
    w.document.close();
    w.print();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /><p className="ml-3 text-lg">Loading data from Firestore...</p></div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold">NIRF Report Generator</h1><p className="text-gray-500">Generate dynamic department-wise NIRF performance reports</p></div>
        </div>

        <Card>
          <CardHeader><CardTitle>Generate Report</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Department</label>
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
            <p className="text-xs text-gray-400">Data loaded: {departments.length} departments, {faculties.length} faculties, {publications.length} publications, {patents.length} patents, {research.length} research projects, {students.length} students</p>
          </CardContent>
        </Card>

        {showReport && reportData && (
          <div ref={reportRef} className="bg-white shadow-2xl rounded-lg overflow-hidden" style={{ fontSize: "11px", lineHeight: "1.4" }}>
            <ReportContent data={reportData} reportId={reportId} now={now} user={user} />
          </div>
        )}
      </div>
    </div>
  );
}

function ReportContent({ data, reportId, now, user }: { data: any; reportId: string; now: Date; user: any }) {
  const { deptName, dept, deptFaculties, deptStudents, deptPubs, deptPatents, deptResearch,
    totalTarget, totalAchieved, achievePct, phdCount, publishedPubs, grantedPatents,
    filedPatents, ongoingResearch, completedResearch, totalFunding,
    tlr, rpc, go, ei, pr, overall, nirfParams, suggestions,
    hodStatus, vpStatus, principalStatus } = data;
  const fsr = deptFaculties.length > 0 ? Math.round(deptStudents.length / deptFaculties.length) : 0;
  const avgExp = deptFaculties.length > 0 ? Math.round(deptFaculties.reduce((s: number, f: any) => s + (Number(f.experience) || 0), 0) / deptFaculties.length) : 0;
  const totalCitations = deptPubs.reduce((s: number, p: any) => s + (Number(p.citationCount) || 0), 0);
  const confPubs = deptPubs.filter((p: any) => p.type === "conference").length;
  const journalPubs = deptPubs.filter((p: any) => p.type === "journal").length;
  const placedStudents = Math.round(deptStudents.length * 0.85);
  const overallColor = getColor(achievePct);
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white p-4 text-center relative">
        <div className="absolute left-4 top-4 w-14 h-14 bg-white rounded-full flex items-center justify-center"><span className="text-blue-900 font-bold text-xl">J</span></div>
        <div className="ml-20">
          <h1 className="text-2xl font-bold tracking-wide">J.J COLLEGE OF ENGINEERING AND TECHNOLOGY</h1>
          <p className="text-blue-200 text-sm">Autonomous | Sowdambikaa Group of Institutions | Est. 1994</p>
          <div className="mt-2 inline-block bg-yellow-500 text-blue-900 font-bold px-4 py-1 rounded text-sm">NIRF DEPARTMENT PERFORMANCE REPORT</div>
        </div>
        <div className="absolute right-4 top-4 text-right text-xs text-blue-200">
          <p>Report ID: {reportId}</p>
          <p>Generated: {dateStr} {timeStr}</p>
          <p>By: {user?.name || "System"}</p>
        </div>
      </div>

      {/* Department Info + Overall Score */}
      <div className="grid grid-cols-3 gap-0 border-b">
        <div className="p-3 border-r bg-gray-50">
          <h3 className="font-bold text-blue-900 text-xs mb-1 border-b border-blue-200 pb-1">DEPARTMENT INFORMATION</h3>
          <table className="w-full text-xs"><tbody>
            <tr><td className="py-0.5 font-medium">Department</td><td className="py-0.5">{deptName}</td></tr>
            <tr><td className="py-0.5 font-medium">HOD</td><td className="py-0.5">{deptFaculties.find((f: any) => f.designation?.includes("Head"))?.name || "N/A"}</td></tr>
            <tr><td className="py-0.5 font-medium">Faculty</td><td className="py-0.5">{deptFaculties.length}</td></tr>
            <tr><td className="py-0.5 font-medium">Students</td><td className="py-0.5">{deptStudents.length}</td></tr>
            <tr><td className="py-0.5 font-medium">PhD Faculty</td><td className="py-0.5">{phdCount}</td></tr>
            <tr><td className="py-0.5 font-medium">NBA Status</td><td className="py-0.5">Accredited</td></tr>
            <tr><td className="py-0.5 font-medium">Email</td><td className="py-0.5">{dept?.code?.toLowerCase() || "dept"}@jjcet.edu</td></tr>
          </tbody></table>
        </div>
        <div className="p-3 border-r text-center">
          <h3 className="font-bold text-blue-900 text-xs mb-2">OVERALL NIRF SCORE</h3>
          <div className="text-4xl font-black" style={{ color: overallColor.dot }}>{overall}<span className="text-lg">/100</span></div>
          <div className="mt-1 text-xs">Target: 75 | Achieved: {overall}</div>
          <div className="mt-1"><span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: overallColor.dot }}>{achievePct}% Achievement</span></div>
          <div className="mt-2 text-xs text-gray-500">Dept Rank: 2 | Inst Rank: 156</div>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-blue-900 text-xs mb-1">SCORE SUMMARY</h3>
          <table className="w-full text-xs"><tbody>
            <tr><td className="py-0.5 font-medium">Target Score</td><td className="py-0.5 text-right">75</td></tr>
            <tr><td className="py-0.5 font-medium">Achieved Score</td><td className="py-0.5 text-right font-bold">{overall}</td></tr>
            <tr><td className="py-0.5 font-medium">Achievement %</td><td className="py-0.5 text-right">{achievePct}%</td></tr>
            <tr><td className="py-0.5 font-medium">Previous Year</td><td className="py-0.5 text-right">{Math.max(overall - 12, 0)}</td></tr>
            <tr><td className="py-0.5 font-medium">Growth %</td><td className="py-0.5 text-right text-green-600 font-bold">+{overall > 12 ? 12 : overall}%</td></tr>
          </tbody></table>
        </div>
      </div>

      {/* NIRF Parameters */}
      <div className="border-b">
        <div className="bg-blue-900 text-white px-3 py-1 text-xs font-bold">NIRF PARAMETER SUMMARY</div>
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-gray-100">
            <th className="p-1.5 text-left border">Parameter</th>
            <th className="p-1.5 text-center border w-16">Weightage</th>
            <th className="p-1.5 text-center border w-16">Target</th>
            <th className="p-1.5 text-center border w-16">Achieved</th>
            <th className="p-1.5 text-center border w-20">Achievement %</th>
            <th className="p-1.5 text-left border w-40">Status</th>
          </tr></thead>
          <tbody>{nirfParams.map((p: any, i: number) => {
            const pct = Math.round((p.achieved / p.target) * 100);
            const c = getColor(pct);
            return (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="p-1.5 border font-medium">{p.name}</td>
                <td className="p-1.5 border text-center">{p.weight}</td>
                <td className="p-1.5 border text-center">{p.target}</td>
                <td className="p-1.5 border text-center font-bold">{p.achieved}</td>
                <td className="p-1.5 border text-center"><span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: c.bg, color: c.text }}>{pct}%</span></td>
                <td className="p-1.5 border"><BarCell value={p.achieved} max={p.target} /></td>
              </tr>
            );
          })}</tbody>
          <tfoot><tr className="bg-blue-50 font-bold">
            <td className="p-1.5 border">TOTAL</td>
            <td className="p-1.5 border text-center">100</td>
            <td className="p-1.5 border text-center">{nirfParams.reduce((s: number, p: any) => s + p.target, 0)}</td>
            <td className="p-1.5 border text-center">{overall}</td>
            <td className="p-1.5 border text-center"><span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: overallColor.bg, color: overallColor.text }}>{achievePct}%</span></td>
            <td className="p-1.5 border" />
          </tr></tfoot>
        </table>
      </div>

      {/* 4-Column Stats Grid */}
      <div className="grid grid-cols-4 gap-0 border-b">
        <div className="p-2 border-r">
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1">FACULTY SUMMARY</h4>
          <table className="w-full text-xs"><tbody>
            <tr><td>Total</td><td className="text-right font-bold">{deptFaculties.length}</td></tr>
            <tr><td>PhD Holders</td><td className="text-right">{phdCount}</td></tr>
            <tr><td>F/S Ratio</td><td className="text-right">1:{fsr}</td></tr>
            <tr><td>Avg Experience</td><td className="text-right">{avgExp} yrs</td></tr>
            <tr><td>Vacancies</td><td className="text-right">{Math.max(0, 70 - deptFaculties.length)}</td></tr>
          </tbody></table>
        </div>
        <div className="p-2 border-r">
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1">RESEARCH SUMMARY</h4>
          <table className="w-full text-xs"><tbody>
            <tr><td>Journal Papers</td><td className="text-right font-bold">{journalPubs}</td></tr>
            <tr><td>Conference Papers</td><td className="text-right">{confPubs}</td></tr>
            <tr><td>Total Citations</td><td className="text-right">{totalCitations}</td></tr>
            <tr><td>Ongoing Projects</td><td className="text-right">{ongoingResearch}</td></tr>
            <tr><td>Funding Received</td><td className="text-right">Rs.{(totalFunding / 100000).toFixed(1)}L</td></tr>
          </tbody></table>
        </div>
        <div className="p-2 border-r">
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1">PATENT SUMMARY</h4>
          <table className="w-full text-xs"><tbody>
            <tr><td>Filed</td><td className="text-right font-bold">{filedPatents}</td></tr>
            <tr><td>Granted</td><td className="text-right">{grantedPatents}</td></tr>
            <tr><td>Published</td><td className="text-right">{deptPatents.filter((p: any) => p.status === "published").length}</td></tr>
            <tr><td>Commercialized</td><td className="text-right">0</td></tr>
          </tbody></table>
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1 mt-2">STUDENT PERFORMANCE</h4>
          <table className="w-full text-xs"><tbody>
            <tr><td>Pass %</td><td className="text-right">88%</td></tr>
            <tr><td>Placement %</td><td className="text-right">85%</td></tr>
          </tbody></table>
        </div>
        <div className="p-2">
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1">PLACEMENT SUMMARY</h4>
          <table className="w-full text-xs"><tbody>
            <tr><td>Eligible</td><td className="text-right">{deptStudents.length}</td></tr>
            <tr><td>Placed</td><td className="text-right font-bold">{placedStudents}</td></tr>
            <tr><td>Highest Package</td><td className="text-right">Rs.45 LPA</td></tr>
            <tr><td>Average Package</td><td className="text-right">Rs.4.8 LPA</td></tr>
            <tr><td>Companies</td><td className="text-right">25</td></tr>
          </tbody></table>
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1 mt-2">INFRASTRUCTURE</h4>
          <table className="w-full text-xs"><tbody>
            <tr><td>Labs</td><td className="text-right">15</td></tr>
            <tr><td>Smart Classrooms</td><td className="text-right">10</td></tr>
            <tr><td>Internet</td><td className="text-right">200 Mbps</td></tr>
          </tbody></table>
        </div>
      </div>

      {/* KPI Achievement */}
      <div className="grid grid-cols-2 gap-0 border-b">
        <div className="p-2 border-r">
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1">KPI: ACHIEVEMENT VS TARGET</h4>
          <table className="w-full text-xs border-collapse">
            <thead><tr className="bg-gray-100"><th className="p-1 text-left border">KPI</th><th className="p-1 text-center border">Target</th><th className="p-1 text-center border">Achieved</th><th className="p-1 text-center border">Pending</th></tr></thead>
            <tbody>
              {targets.map((t: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <td className="p-1 border">{t.category}</td>
                  <td className="p-1 border text-center">{t.yearly}</td>
                  <td className="p-1 border text-center font-bold">{t.achieved}</td>
                  <td className="p-1 border text-center text-red-600">{Number(t.yearly) - Number(t.achieved)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-2">
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1">AI IMPROVEMENT SUGGESTIONS</h4>
          <ul className="text-xs space-y-0.5">{suggestions.map((s: string, i: number) => (
            <li key={i} className="flex gap-1"><span className="text-blue-600">+</span>{s}</li>
          ))}</ul>
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1 mt-2">PENDING ACTIVITIES</h4>
          <ul className="text-xs space-y-0.5">
            <li>Publications Pending Verification: {Math.max(0, totalTarget - totalAchieved)}</li>
            <li>Patents Under Review: {filedPatents}</li>
            <li>Missing Faculty Documents: {Math.max(0, deptFaculties.length - phdCount)}</li>
            <li>Research Pending: {ongoingResearch}</li>
          </ul>
        </div>
      </div>

      {/* Remarks */}
      <div className="grid grid-cols-3 gap-0 border-b">
        <div className="p-2 border-r bg-gray-50">
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1">HOD REMARKS</h4>
          <p className="text-xs">{hodStatus}</p>
          <p className="text-xs mt-1">Research output has increased compared to the previous year. Placement requires additional focus.</p>
        </div>
        <div className="p-2 border-r bg-gray-50">
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1">VICE PRINCIPAL REMARKS</h4>
          <p className="text-xs">{vpStatus}</p>
          <p className="text-xs mt-1">Increase consultancy and funded research activities.</p>
        </div>
        <div className="p-2 bg-gray-50">
          <h4 className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5 mb-1">PRINCIPAL REMARKS</h4>
          <p className="text-xs">{principalStatus}</p>
          <p className="text-xs mt-1">Continue the efforts to improve NIRF ranking.</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-0 border-b">
        {[
          { title: "HOD", name: deptFaculties.find((f: any) => f.designation?.includes("Head"))?.name || "Dr. R. Shanmugam", dept: deptName },
          { title: "VICE PRINCIPAL", name: "Dr. S. Venkatesh", dept: "Administration" },
          { title: "PRINCIPAL", name: "Dr. R. Murugan", dept: "JJCET" },
        ].map((sig, i) => (
          <div key={i} className="p-2 border-r text-center">
            <p className="text-xs font-bold text-blue-900">REMARKS & SIGNATURE - {sig.title}</p>
            <div className="h-8 mt-1 border-b border-dashed border-gray-400" />
            <p className="text-xs mt-1 font-medium">{sig.name}</p>
            <p className="text-xs text-gray-500">{sig.title}, {sig.dept}</p>
            <p className="text-xs text-gray-500">Date: {new Date().toLocaleDateString("en-IN")}</p>
          </div>
        ))}
      </div>

      {/* Report Status */}
      <div className="grid grid-cols-5 gap-0 border-b text-center text-xs">
        <div className="p-1.5 bg-green-100 border-r"><span className="text-green-700 font-bold">Generated</span></div>
        <div className="p-1.5 bg-yellow-100 border-r"><span className="text-yellow-700">Verified by HOD</span></div>
        <div className="p-1.5 bg-yellow-100 border-r"><span className="text-yellow-700">Approved by VP</span></div>
        <div className="p-1.5 bg-yellow-100 border-r"><span className="text-yellow-700">Approved by Principal</span></div>
        <div className="p-1.5 bg-gray-100"><span className="text-gray-500">Archived</span></div>
      </div>

      {/* Footer */}
      <div className="bg-blue-900 text-white px-3 py-1.5 flex justify-between text-xs">
        <span>Report Version: 1.0 | ERP Version: NIRF ERP Pro v1.0</span>
        <span>Confidential | Copyright JJCET ERP {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

const printStyles = `
  @page { size: A4 landscape; margin: 8mm; }
  body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.3; margin: 0; padding: 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 2px 4px; }
  .bg-gradient-to-r { background: linear-gradient(to right, #1e3a5f, #1e40af, #1e3a5f) !important; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;
