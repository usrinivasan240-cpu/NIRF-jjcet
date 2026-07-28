"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function safe(v: number) { return isNaN(v) || !isFinite(v) ? 0 : v; }

function statusLabel(pct: number) {
  if (pct >= 90) return "Excellent";
  if (pct >= 75) return "Good";
  if (pct >= 60) return "In Progress";
  if (pct >= 40) return "Behind";
  return "Critical";
}

function statusColor(pct: number) {
  if (pct >= 90) return "#2E7D32";
  if (pct >= 75) return "#1565C0";
  if (pct >= 60) return "#F57C00";
  if (pct >= 40) return "#E65100";
  return "#C62828";
}

export interface ReportConfig {
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
    pendingActivities: boolean;
    supportingDocs: boolean;
  };
}

export interface ReportData {
  deptRows: any[];
  instTlr: number;
  instRpc: number;
  instGo: number;
  instOi: number;
  instPr: number;
  instTotal: number;
  allPubs: any[];
  allPats: any[];
  allRes: any[];
  allFac: any[];
  allStu: any[];
  allTgt: any[];
  totalTarget: number;
  totalAchieved: number;
  deptId: string | null;
  categories?: {
    faculty: number;
    students: number;
    publications: number;
    scopus: number;
    patents: number;
    researchProjects: number;
    consultancy: number;
    placements: number;
    higherStudies: number;
    mous: number;
    events: number;
    fdp: number;
    workshops: number;
    seminars: number;
  };
}

export interface ReportMeta {
  reportId: string;
  generatedOn: string;
  generatedAt: string;
  generatedBy: string;
  deptName: string;
  deptCode: string;
  deptId: string | null;
  hodName: string;
  facultyCount: number;
  studentCount: number;
  phdCount: number;
}

export default function NirfReportTemplate({
  config,
  data,
  meta,
  logoUrl: logoUrlProp,
}: {
  config: ReportConfig;
  data: ReportData;
  meta: ReportMeta;
  logoUrl?: string;
}) {
  const [logoUrl, setLogoUrl] = useState(logoUrlProp || "/images/jjcet-logo.png");

  useEffect(() => {
    if (logoUrlProp) { setLogoUrl(logoUrlProp); return; }
    const fetchLogo = async () => {
      try {
        const snap = await getDoc(doc(db, "appSettings", "main"));
        if (snap.exists() && snap.data().logoUrl) setLogoUrl(snap.data().logoUrl);
      } catch {}
    };
    fetchLogo();
  }, [logoUrlProp]);
  const {
    deptRows = [],
    instTlr = 0, instRpc = 0, instGo = 0, instOi = 0, instPr = 0, instTotal = 0,
  } = data || {};

  const tlr = safe(instTlr);
  const rpc = safe(instRpc);
  const go = safe(instGo);
  const oi = safe(instOi);
  const pr = safe(instPr);
  const total = safe(instTotal);
  const totalTarget = safe(data?.totalTarget);
  const totalAchieved = safe(data?.totalAchieved);
  const overallPct = safe(totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0);
  const allFac = data?.allFac || [];
  const allStu = data?.allStu || [];
  const allPubs = data?.allPubs || [];
  const allPats = data?.allPats || [];
  const allRes = data?.allRes || [];

  const cat = data?.categories || {
    faculty: allFac.length,
    students: allStu.length,
    publications: allPubs.filter((p: any) => p.status === "published").length,
    scopus: allPubs.filter((p: any) => p.isScopus).length,
    patents: allPats.filter((p: any) => p.status === "granted").length,
    researchProjects: allRes.length,
    consultancy: 0,
    placements: 0,
    higherStudies: 0,
    mous: 0,
    events: 0,
    fdp: 0,
    workshops: 0,
    seminars: 0,
  };

  const targetRows = [
    { name: "Faculty", target: 12, achieved: cat.faculty },
    { name: "Students", target: 256, achieved: cat.students },
    { name: "Publications", target: 20, achieved: cat.publications },
    { name: "Scopus", target: 10, achieved: cat.scopus },
    { name: "Patents", target: 5, achieved: cat.patents },
    { name: "Research Projects", target: 8, achieved: cat.researchProjects },
    { name: "Consultancy", target: 5, achieved: cat.consultancy },
    { name: "Placements", target: 100, achieved: cat.placements },
    { name: "Higher Studies", target: 30, achieved: cat.higherStudies },
    { name: "MoUs", target: 5, achieved: cat.mous },
    { name: "Events", target: 10, achieved: cat.events },
    { name: "FDP", target: 15, achieved: cat.fdp },
    { name: "Workshops", target: 10, achieved: cat.workshops },
    { name: "Seminars", target: 8, achieved: cat.seminars },
  ];

  const nirfParams = [
    { name: "Teaching, Learning & Resources (TLR)", target: 30, achieved: tlr },
    { name: "Research and Professional Practice (RP)", target: 30, achieved: rpc },
    { name: "Graduation Outcomes (GO)", target: 20, achieved: go },
    { name: "Outreach and Inclusivity (OI)", target: 10, achieved: oi },
    { name: "Perception (PR)", target: 10, achieved: pr },
  ];

  const pendingItems = targetRows
    .filter(r => r.achieved < r.target)
    .map(r => `Need ${r.target - r.achieved} more ${r.name}`);

  const dName = meta?.deptName || "All Departments";
  const dCode = meta?.deptCode || "ALL";
  const now = new Date();

  return (
    <div style={{
      maxWidth: "210mm",
      width: "100%",
      margin: "0 auto",
      padding: "12px 16px",
      background: "white",
      fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      fontSize: "10px",
      lineHeight: "1.4",
      color: "#1a1a1a",
      boxSizing: "border-box" as const,
      overflowX: "hidden" as const,
    }}>
      <style>{`
        @page { size: A4 portrait; margin: 12mm 15mm; }
        @media print {
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          table { page-break-inside: avoid; }
          tr { page-break-inside: avoid; }
          h1, h2, h3, h4 { page-break-after: avoid; }
          img { max-width: 100%; }
        }
      `}</style>

      {/* ═══════════════ HEADER ═══════════════ */}
      <div style={{ background: "linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)", color: "white", padding: "12px 16px", borderRadius: "4px", marginBottom: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "65px", verticalAlign: "middle", paddingRight: "12px" }}>
                <img src={logoUrl} alt="JJCET" style={{ width: "55px", height: "55px", borderRadius: "50%", border: "2px solid white" }} />
                <p style={{ fontSize: "6px", color: "#BBDEFB", marginTop: "2px", textAlign: "center" }}>ESTD. 1994</p>
              </td>
              <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                <h1 style={{ fontSize: "16px", fontWeight: "800", margin: 0, letterSpacing: "0.5px" }}>J.J College of Engineering and Technology</h1>
                <p style={{ fontSize: "11px", margin: "1px 0", fontWeight: "600", color: "#BBDEFB" }}>(Autonomous)</p>
                <p style={{ fontSize: "12px", margin: "3px 0 0 0", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>DEPARTMENT NIRF PERFORMANCE REPORT</p>
                <p style={{ fontSize: "10px", margin: "2px 0 0 0", color: "#E3F2FD" }}>Academic Year {config.academicYear}</p>
              </td>
              <td style={{ width: "150px", verticalAlign: "middle", textAlign: "right", fontSize: "8px", color: "#E3F2FD" }}>
                <p style={{ margin: "1px 0" }}>Report ID: <strong style={{ color: "white" }}>{meta?.reportId}</strong></p>
                <p style={{ margin: "1px 0" }}>Generated On: {meta?.generatedOn}</p>
                <p style={{ margin: "1px 0" }}>Time: {meta?.generatedAt}</p>
                <p style={{ margin: "1px 0" }}>Status: <span style={{ color: "#69F0AE", fontWeight: "700" }}>FINAL</span></p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══════════════ SECTION 1: Department Information ═══════════════ */}
      {config.sections.summary && (
        <>
          <SectionTitle num={1} title="DEPARTMENT INFORMATION" />
          <table style={tableStyle}>
            <tbody>
              <tr>
                <td style={labelCellStyle}>Department</td>
                <td style={valueCellStyle}>{dName}</td>
                <td style={labelCellStyle}>Department Code</td>
                <td style={valueCellStyle}>{dCode}</td>
              </tr>
              <tr>
                <td style={labelCellStyle}>HOD</td>
                <td style={valueCellStyle}>{config.hodName || meta?.hodName || "—"}</td>
                <td style={labelCellStyle}>Academic Year</td>
                <td style={valueCellStyle}>{config.academicYear}</td>
              </tr>
              <tr>
                <td style={labelCellStyle}>Faculty Count</td>
                <td style={valueCellStyle}>{meta?.facultyCount ?? allFac.length}</td>
                <td style={labelCellStyle}>Student Count</td>
                <td style={valueCellStyle}>{meta?.studentCount ?? allStu.length}</td>
              </tr>
              <tr>
                <td style={labelCellStyle}>PhD Faculty</td>
                <td style={valueCellStyle}>{meta?.phdCount ?? 0}</td>
                <td style={labelCellStyle}>Generated By</td>
                <td style={valueCellStyle}>{meta?.generatedBy}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ SECTION 2: Executive Summary ═══════════════ */}
      {config.sections.summary && (
        <>
          <SectionTitle num={2} title="EXECUTIVE SUMMARY" />
          <table style={{ ...tableStyle, marginBottom: "8px" }}>
            <thead>
              <tr>
                <th style={thStyle}>Overall Target</th>
                <th style={thStyle}>Overall Achieved</th>
                <th style={thStyle}>Achievement %</th>
                <th style={thStyle}>Department Rank</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "800", fontSize: "14px", color: "#0D47A1" }}>{totalTarget}</td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "800", fontSize: "14px", color: "#0D47A1" }}>{totalAchieved}</td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "800", fontSize: "14px", color: statusColor(overallPct) }}>{overallPct.toFixed(1)}%</td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "800", fontSize: "14px", color: "#0D47A1" }}>{config.rankBand}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ SECTION 3: NIRF Parameter Summary ═══════════════ */}
      {config.sections.progress && (
        <>
          <SectionTitle num={3} title="NIRF PARAMETER SUMMARY" />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Parameter</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Target (Max)</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Achieved</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Achievement %</th>
              </tr>
            </thead>
            <tbody>
              {nirfParams.map((p, i) => {
                const pct = safe((p.achieved / p.target) * 100);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{p.target}</td>
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: "700" }}>{p.achieved.toFixed(2)}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{pct.toFixed(1)}%</td>
                  </tr>
                );
              })}
              <tr style={{ background: "#E8EAF6" }}>
                <td style={{ ...tdStyle, fontWeight: "800" }}>TOTAL</td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "800" }}>100</td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "800", color: "#0D47A1" }}>{total.toFixed(2)}</td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "800" }}>{safe(total).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ SECTION 4: Target vs Achievement ═══════════════ */}
      {config.sections.deptTable && (
        <>
          <SectionTitle num={4} title="DEPARTMENT TARGET vs ACHIEVEMENT" />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: "30px" }}>S.No</th>
                <th style={thStyle}>Category</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Target</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Achieved</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Pending</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Completion %</th>
              </tr>
            </thead>
            <tbody>
              {targetRows.map((r, i) => {
                const pct = safe((r.achieved / r.target) * 100);
                const pending = Math.max(0, r.target - r.achieved);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{i + 1}</td>
                    <td style={tdStyle}>{r.name}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{r.target}</td>
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: "700" }}>{r.achieved}</td>
                    <td style={{ ...tdStyle, textAlign: "center", color: pending > 0 ? "#C62828" : "#2E7D32" }}>{pending}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{pct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ SECTION 5: Pending Activities ═══════════════ */}
      {config.sections.pendingActivities && config.sections.deptTable && pendingItems.length > 0 && (
        <>
          <SectionTitle num={5} title="PENDING ACTIVITIES" />
          <div style={{ padding: "8px 12px", border: "1px solid #E0E0E0", background: "#FFF8E1", marginBottom: "8px" }}>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "9px", lineHeight: "1.6" }}>
              {pendingItems.map((item, i) => <li key={i} style={{ color: "#E65100" }}>{item}</li>)}
            </ul>
          </div>
        </>
      )}

      {/* ═══════════════ SECTION 6: Supporting Documents ═══════════════ */}
      {config.sections.supportingDocs && (
        <>
          <SectionTitle num={6} title="SUPPORTING DOCUMENTS" />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Document</th>
                <th style={thStyle}>Verified</th>
              </tr>
            </thead>
            <tbody>
              {["NIRF Data Sheet", "Faculty Details", "Publication Records", "Patent Documents", "Research Projects", "Student Records"].map((doc, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
                  <td style={tdStyle}>{doc}</td>
                  <td style={{ ...tdStyle, color: "#F57C00", fontWeight: "600" }}>Pending</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ SECTION 7: Overall Remarks ═══════════════ */}
      {config.sections.remarks && (
        <>
          <SectionTitle num={7} title="OVERALL DEPARTMENT REMARKS" />
          <div style={{ padding: "8px 12px", border: "1px solid #E0E0E0", background: "#F5F7FA", marginBottom: "8px" }}>
            {config.remarks.length > 0 && (
              <p style={{ fontSize: "9px", lineHeight: "1.5", margin: 0 }}>
                {config.remarks.join(" ")}
              </p>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ SECTION 8: Remarks ═══════════════ */}
      {config.sections.remarks && (
        <>
          <SectionTitle num={8} title="REMARKS" />
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
            <tbody>
              <tr>
                <td style={{ width: "33%", padding: "8px", border: "1px solid #E0E0E0", verticalAlign: "top", background: "#FAFAFA" }}>
                  <p style={{ fontSize: "10px", fontWeight: "700", margin: "0 0 4px 0", color: "#0D47A1" }}>HOD Remarks</p>
                  <p style={{ fontSize: "9px", fontStyle: "italic", lineHeight: "1.5", minHeight: "40px", color: "#333" }}>
                    {config.hodRemark || "No remarks provided."}
                  </p>
                  <div style={{ borderBottom: "1px dashed #999", height: "16px", marginBottom: "3px" }} />
                  <p style={{ fontSize: "9px", fontWeight: "700", margin: 0 }}>{config.hodName || "—"}</p>
                  <p style={{ fontSize: "8px", color: "#666" }}>Head of Department</p>
                </td>
                <td style={{ width: "33%", padding: "8px", border: "1px solid #E0E0E0", verticalAlign: "top", background: "#FAFAFA" }}>
                  <p style={{ fontSize: "10px", fontWeight: "700", margin: "0 0 4px 0", color: "#0D47A1" }}>Vice Principal Remarks</p>
                  <p style={{ fontSize: "9px", fontStyle: "italic", lineHeight: "1.5", minHeight: "40px", color: "#333" }}>
                    {config.vpRemark || "No remarks provided."}
                  </p>
                  <div style={{ borderBottom: "1px dashed #999", height: "16px", marginBottom: "3px" }} />
                  <p style={{ fontSize: "9px", fontWeight: "700", margin: 0 }}>{config.vpName || "—"}</p>
                  <p style={{ fontSize: "8px", color: "#666" }}>Vice Principal</p>
                </td>
                <td style={{ width: "33%", padding: "8px", border: "1px solid #E0E0E0", verticalAlign: "top", background: "#FAFAFA" }}>
                  <p style={{ fontSize: "10px", fontWeight: "700", margin: "0 0 4px 0", color: "#0D47A1" }}>Principal Remarks</p>
                  <p style={{ fontSize: "9px", fontStyle: "italic", lineHeight: "1.5", minHeight: "40px", color: "#333" }}>
                    {config.principalRemark || "No remarks provided."}
                  </p>
                  <div style={{ borderBottom: "1px dashed #999", height: "16px", marginBottom: "3px" }} />
                  <p style={{ fontSize: "9px", fontWeight: "700", margin: 0 }}>{config.principalName || "—"}</p>
                  <p style={{ fontSize: "8px", color: "#666" }}>Principal</p>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ SECTION 9: Signatures ═══════════════ */}
      {config.sections.signatures && (
        <>
          <SectionTitle num={9} title="SIGNATURES" />
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
            <tbody>
              <tr>
                {[
                  { name: config.hodName, role: "HOD" },
                  { name: config.vpName, role: "Vice Principal" },
                  { name: config.principalName, role: "Principal" },
                ].map((s, i) => (
                  <td key={i} style={{ width: "33%", padding: "10px", border: "1px solid #E0E0E0", textAlign: "center", verticalAlign: "top", background: "#FAFAFA" }}>
                    <div style={{ height: "35px", borderBottom: "1px solid #333", marginBottom: "4px" }} />
                    <p style={{ fontSize: "9px", fontWeight: "700", margin: "4px 0 1px 0" }}>Signature</p>
                    <p style={{ fontSize: "9px", fontWeight: "700", margin: 0 }}>{s.name || s.role}</p>
                    <p style={{ fontSize: "8px", color: "#666", margin: "2px 0 0 0" }}>Date: _______________</p>
                    <p style={{ fontSize: "8px", color: "#666", margin: "2px 0 0 0" }}>Seal:</p>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ FOOTER ═══════════════ */}
      <div style={{ background: "#0D47A1", color: "white", padding: "6px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "8px", marginTop: "8px", borderRadius: "0 0 4px 4px" }}>
        <span>Generated by JJCET NIRF ERP | Report v2.0 | {meta?.generatedOn}</span>
        <span>Confidential — For Official Use Only</span>
        <span>www.jjcet.ac.in | 0431 – 2660566</span>
      </div>
    </div>
  );
}

function StatusBadge({ pct }: { pct: number }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "1px 6px",
      borderRadius: "3px",
      fontSize: "8px",
      fontWeight: "700",
      color: "white",
      background: statusColor(pct),
    }}>
      {statusLabel(pct)}
    </span>
  );
}

function SectionTitle({ num, title }: { num: number; title: string }) {
  return (
    <div style={{
      background: "#0D47A1",
      color: "white",
      padding: "4px 10px",
      fontSize: "10px",
      fontWeight: "700",
      marginBottom: "4px",
      marginTop: "10px",
      letterSpacing: "0.5px",
    }}>
      {num}. {title}
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "6px",
  fontSize: "9px",
  tableLayout: "fixed",
};

const thStyle: React.CSSProperties = {
  background: "#E8EAF6",
  padding: "4px 6px",
  textAlign: "left",
  border: "1px solid #C5CAE9",
  fontWeight: "700",
  fontSize: "8px",
  color: "#0D47A1",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  wordBreak: "break-word" as const,
};

const tdStyle: React.CSSProperties = {
  padding: "4px 6px",
  border: "1px solid #E0E0E0",
  fontSize: "9px",
  wordBreak: "break-word" as const,
};

const labelCellStyle: React.CSSProperties = {
  padding: "3px 6px",
  border: "1px solid #E0E0E0",
  fontWeight: "700",
  fontSize: "8px",
  color: "#455A64",
  width: "25%",
  background: "#F5F7FA",
};

const valueCellStyle: React.CSSProperties = {
  padding: "3px 6px",
  border: "1px solid #E0E0E0",
  fontSize: "9px",
  width: "25%",
};
