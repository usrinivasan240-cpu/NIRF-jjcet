"use client";

const LOGO_URL = "/images/jjcet-logo.png";

function safe(v: number) {
  return isNaN(v) || !isFinite(v) ? 0 : v;
}

function statusLabel(pct: number) {
  if (pct >= 90) return "Excellent";
  if (pct >= 75) return "Very Good";
  if (pct >= 60) return "Good";
  if (pct >= 40) return "Needs Improvement";
  return "Critical";
}

function statusColor(pct: number) {
  if (pct >= 90) return "#166534";
  if (pct >= 75) return "#1d4ed8";
  if (pct >= 60) return "#0f766e";
  if (pct >= 40) return "#b45309";
  return "#b91c1c";
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
}: {
  config: ReportConfig;
  data: ReportData;
  meta: ReportMeta;
}) {
  const {
    deptRows = [],
    instTlr = 0, instRpc = 0, instGo = 0, instOi = 0, instPr = 0, instTotal = 0,
    allPubs = [], allPats = [], allRes = [], allFac = [], allStu = [], allTgt = [],
    totalTarget = 0, totalAchieved = 0,
  } = data || {};

  const tlr = safe(instTlr);
  const rpc = safe(instRpc);
  const go = safe(instGo);
  const oi = safe(instOi);
  const pr = safe(instPr);
  const total = safe(instTotal);
  const overallPct = safe(totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0);

  const nirfParams = [
    { name: "Teaching, Learning & Resources (TLR)", target: 30, achieved: tlr },
    { name: "Research and Professional Practice (RP)", target: 30, achieved: rpc },
    { name: "Graduation Outcomes (GO)", target: 20, achieved: go },
    { name: "Outreach and Inclusivity (OI)", target: 10, achieved: oi },
    { name: "Perception (PR)", target: 10, achieved: pr },
  ];

  const categories = [
    { name: "Faculty", target: 4, achieved: (allFac || []).length },
    { name: "Students", target: 50, achieved: (allStu || []).length },
    { name: "Publications", target: 8, achieved: (allPubs || []).filter((p: any) => p.status === "published").length },
    { name: "Scopus Indexed", target: 5, achieved: (allPubs || []).filter((p: any) => p.isScopus).length },
    { name: "Patents", target: 3, achieved: (allPats || []).filter((p: any) => p.status === "granted" || p.isGranted).length },
    { name: "Research Projects", target: 4, achieved: (allRes || []).length },
    { name: "Events", target: 6, achieved: Math.min((allStu || []).length, 6) },
  ];

  const pendingActivities = categories
    .filter(c => c.achieved < c.target)
    .map(c => `Need ${c.target - c.achieved} more ${c.name}`);

  const dName = meta?.deptName || "All Departments";
  const dCode = meta?.deptCode || "N/A";

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
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            <td style={{ width: "60px", verticalAlign: "top", paddingRight: "10px" }}>
              <img
                src={LOGO_URL}
                alt="JJCET"
                style={{ width: "55px", height: "55px", borderRadius: "50%", border: "2px solid #1e3a8a" }}
              />
              <p style={{ fontSize: "6px", color: "#666", marginTop: "2px", textAlign: "center" }}>ESTD. 1994</p>
            </td>
            <td style={{ verticalAlign: "top", textAlign: "center" }}>
              <h1 style={{ fontSize: "15px", fontWeight: "800", color: "#1e3a8a", margin: 0, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                J.J College of Engineering and Technology
              </h1>
              <p style={{ fontSize: "11px", color: "#1e3a8a", margin: "1px 0", fontWeight: "600" }}>Autonomous</p>
              <p style={{ fontSize: "10px", color: "#333", margin: "2px 0 0 0", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Department NIRF Performance Report
              </p>
              <p style={{ fontSize: "9px", color: "#555", margin: "1px 0 0 0" }}>Academic Year {config.academicYear}</p>
            </td>
            <td style={{ width: "140px", verticalAlign: "top", textAlign: "right", fontSize: "8px", color: "#555" }}>
              <p style={{ margin: "1px 0" }}><strong>Report ID:</strong> {meta?.reportId}</p>
              <p style={{ margin: "1px 0" }}><strong>Generated:</strong> {meta?.generatedOn}</p>
              <p style={{ margin: "1px 0" }}><strong>Time:</strong> {meta?.generatedAt}</p>
              <p style={{ margin: "1px 0" }}><strong>Status:</strong> <span style={{ color: "#166534", fontWeight: "700" }}>FINAL</span></p>
            </td>
          </tr>
        </tbody>
      </table>
      <hr style={{ border: "none", borderTop: "2px solid #1e3a8a", margin: "4px 0 10px 0" }} />

      {/* ═══════════════ SECTION 1: Department Information ═══════════════ */}
      {config.sections.summary && (
        <>
          <SectionTitle num={1} title="Department Information" />
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
                <td style={valueCellStyle}>{meta?.facultyCount ?? (allFac || []).length}</td>
                <td style={labelCellStyle}>Student Count</td>
                <td style={valueCellStyle}>{meta?.studentCount ?? (allStu || []).length}</td>
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
          <SectionTitle num={2} title="Executive Summary" />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Metric</th>
                <th style={thStyle}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>Overall Target</td>
                <td style={{ ...tdStyle, fontWeight: "700" }}>{totalTarget}</td>
              </tr>
              <tr>
                <td style={tdStyle}>Overall Achieved</td>
                <td style={{ ...tdStyle, fontWeight: "700" }}>{totalAchieved}</td>
              </tr>
              <tr>
                <td style={tdStyle}>Overall Achievement %</td>
                <td style={{ ...tdStyle, fontWeight: "700", color: statusColor(overallPct) }}>{overallPct.toFixed(1)}%</td>
              </tr>
              <tr>
                <td style={tdStyle}>Department Rank</td>
                <td style={tdStyle}>{config.rankBand || "—"}</td>
              </tr>
              <tr>
                <td style={tdStyle}>Status</td>
                <td style={{ ...tdStyle, fontWeight: "700", color: statusColor(overallPct) }}>{statusLabel(overallPct)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ SECTION 3: NIRF Parameter Summary ═══════════════ */}
      {config.sections.progress && (
        <>
          <SectionTitle num={3} title="NIRF Parameter Summary" />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Parameter</th>
                <th style={thStyle}>Target (Max)</th>
                <th style={thStyle}>Achieved</th>
                <th style={thStyle}>Achievement %</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {nirfParams.map((p, i) => {
                const pct = safe((p.achieved / p.target) * 100);
                return (
                  <tr key={i}>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{p.target}</td>
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: "700" }}>{p.achieved.toFixed(2)}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{pct.toFixed(1)}%</td>
                    <td style={{ ...tdStyle, textAlign: "center", color: statusColor(pct), fontWeight: "700" }}>
                      {statusLabel(pct)}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background: "#f0f4f8" }}>
                <td style={{ ...tdStyle, fontWeight: "800" }}>TOTAL</td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "800" }}>100</td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "800" }}>{total.toFixed(2)}</td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "800" }}>{safe((total / 100) * 100).toFixed(1)}%</td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "800", color: statusColor(total) }}>
                  {statusLabel(total)}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ SECTION 4: Target vs Achievement ═══════════════ */}
      {config.sections.deptTable && (
        <>
          <SectionTitle num={4} title="Department Target vs Achievement" />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: "30px" }}>S.No</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Target</th>
                <th style={thStyle}>Achieved</th>
                <th style={thStyle}>Pending</th>
                <th style={thStyle}>Completion %</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => {
                const pct = safe((c.achieved / c.target) * 100);
                const pending = Math.max(0, c.target - c.achieved);
                return (
                  <tr key={i}>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{i + 1}</td>
                    <td style={tdStyle}>{c.name}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{c.target}</td>
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: "700" }}>{c.achieved}</td>
                    <td style={{ ...tdStyle, textAlign: "center", color: pending > 0 ? "#b91c1c" : "#166534" }}>{pending}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{pct.toFixed(1)}%</td>
                    <td style={{ ...tdStyle, textAlign: "center", color: statusColor(pct), fontWeight: "700" }}>
                      {pct >= 100 ? "Completed" : pct >= 80 ? "On Track" : "Behind"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ SECTION 5: Pending Activities ═══════════════ */}
      {config.sections.deptTable && pendingActivities.length > 0 && (
        <>
          <SectionTitle num={5} title="Pending Activities" />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>S.No</th>
                <th style={thStyle}>Pending Item</th>
              </tr>
            </thead>
            <tbody>
              {pendingActivities.map((item, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, textAlign: "center", width: "40px" }}>{i + 1}</td>
                  <td style={{ ...tdStyle, color: "#b91c1c" }}>{item}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ SECTION 6: Supporting Documents ═══════════════ */}
      {config.sections.summary && (
        <>
          <SectionTitle num={6} title="Supporting Documents" />
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Document</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Verified</th>
              </tr>
            </thead>
            <tbody>
              {["NIRF Data Sheet", "Faculty Details", "Publication Records", "Patent Documents", "Research Projects", "Student Records"].map((doc, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{doc}</td>
                  <td style={{ ...tdStyle, color: "#0f766e" }}>Available</td>
                  <td style={{ ...tdStyle, color: "#b45309" }}>Pending</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ SECTION 7: Overall Remarks ═══════════════ */}
      {config.sections.remarks && (
        <>
          <SectionTitle num={7} title="Overall Department Remarks" />
          <div style={{ padding: "8px 12px", border: "1px solid #cbd5e1", background: "#f8fafc", marginBottom: "10px" }}>
            <p style={{ fontSize: "12px", fontWeight: "700", margin: 0, color: statusColor(overallPct) }}>
              Department Status: {statusLabel(overallPct)}
            </p>
            {config.remarks.length > 0 && (
              <ul style={{ margin: "6px 0 0 0", paddingLeft: "18px", fontSize: "10px" }}>
                {config.remarks.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ SECTION 8: Remarks ═══════════════ */}
      {config.sections.remarks && (
        <>
          <SectionTitle num={8} title="Remarks" />
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
            <tbody>
              <tr>
                <td style={{ width: "33%", padding: "8px", border: "1px solid #cbd5e1", verticalAlign: "top" }}>
                  <p style={{ fontSize: "10px", fontWeight: "700", margin: "0 0 4px 0", color: "#1e3a8a" }}>HOD Remarks</p>
                  <p style={{ fontSize: "10px", fontStyle: "italic", lineHeight: "1.4", minHeight: "40px", color: "#333" }}>
                    {config.hodRemark || "No remarks provided."}
                  </p>
                  <div style={{ borderBottom: "1px dashed #999", height: "20px", marginBottom: "4px" }} />
                  <p style={{ fontSize: "9px", fontWeight: "700" }}>{config.hodName || "—"}</p>
                  <p style={{ fontSize: "8px", color: "#666" }}>Head of Department</p>
                </td>
                <td style={{ width: "33%", padding: "8px", border: "1px solid #cbd5e1", verticalAlign: "top" }}>
                  <p style={{ fontSize: "10px", fontWeight: "700", margin: "0 0 4px 0", color: "#1e3a8a" }}>Vice Principal Remarks</p>
                  <p style={{ fontSize: "10px", fontStyle: "italic", lineHeight: "1.4", minHeight: "40px", color: "#333" }}>
                    {config.vpRemark || "No remarks provided."}
                  </p>
                  <div style={{ borderBottom: "1px dashed #999", height: "20px", marginBottom: "4px" }} />
                  <p style={{ fontSize: "9px", fontWeight: "700" }}>{config.vpName || "—"}</p>
                  <p style={{ fontSize: "8px", color: "#666" }}>Vice Principal</p>
                </td>
                <td style={{ width: "33%", padding: "8px", border: "1px solid #cbd5e1", verticalAlign: "top" }}>
                  <p style={{ fontSize: "10px", fontWeight: "700", margin: "0 0 4px 0", color: "#1e3a8a" }}>Principal Remarks</p>
                  <p style={{ fontSize: "10px", fontStyle: "italic", lineHeight: "1.4", minHeight: "40px", color: "#333" }}>
                    {config.principalRemark || "No remarks provided."}
                  </p>
                  <div style={{ borderBottom: "1px dashed #999", height: "20px", marginBottom: "4px" }} />
                  <p style={{ fontSize: "9px", fontWeight: "700" }}>{config.principalName || "—"}</p>
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
          <SectionTitle num={9} title="Signature" />
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
            <tbody>
              <tr>
                <td style={{ width: "33%", padding: "10px", border: "1px solid #cbd5e1", textAlign: "center", verticalAlign: "top" }}>
                  <div style={{ height: "40px", borderBottom: "1px solid #999", marginBottom: "4px" }} />
                  <p style={{ fontSize: "9px", fontWeight: "700", margin: "4px 0 1px 0" }}>Signature</p>
                  <p style={{ fontSize: "9px", fontWeight: "700", margin: "0" }}>{config.hodName || "Head of Department"}</p>
                  <p style={{ fontSize: "8px", color: "#666", margin: "2px 0 0 0" }}>Date: _______________</p>
                  <p style={{ fontSize: "8px", color: "#666", margin: "2px 0 0 0" }}>Seal:</p>
                </td>
                <td style={{ width: "33%", padding: "10px", border: "1px solid #cbd5e1", textAlign: "center", verticalAlign: "top" }}>
                  <div style={{ height: "40px", borderBottom: "1px solid #999", marginBottom: "4px" }} />
                  <p style={{ fontSize: "9px", fontWeight: "700", margin: "4px 0 1px 0" }}>Signature</p>
                  <p style={{ fontSize: "9px", fontWeight: "700", margin: "0" }}>{config.vpName || "Vice Principal"}</p>
                  <p style={{ fontSize: "8px", color: "#666", margin: "2px 0 0 0" }}>Date: _______________</p>
                  <p style={{ fontSize: "8px", color: "#666", margin: "2px 0 0 0" }}>Seal:</p>
                </td>
                <td style={{ width: "33%", padding: "10px", border: "1px solid #cbd5e1", textAlign: "center", verticalAlign: "top" }}>
                  <div style={{ height: "40px", borderBottom: "1px solid #999", marginBottom: "4px" }} />
                  <p style={{ fontSize: "9px", fontWeight: "700", margin: "4px 0 1px 0" }}>Signature</p>
                  <p style={{ fontSize: "9px", fontWeight: "700", margin: "0" }}>{config.principalName || "Principal"}</p>
                  <p style={{ fontSize: "8px", color: "#666", margin: "2px 0 0 0" }}>Date: _______________</p>
                  <p style={{ fontSize: "8px", color: "#666", margin: "2px 0 0 0" }}>Seal:</p>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* ═══════════════ FOOTER ═══════════════ */}
      <hr style={{ border: "none", borderTop: "2px solid #1e3a8a", margin: "8px 0 6px 0" }} />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ fontSize: "8px", color: "#666", padding: "2px 0" }}>
              Generated by JJCET NIRF ERP | Report v2.0 | {meta?.generatedOn}
            </td>
            <td style={{ fontSize: "8px", color: "#666", padding: "2px 0", textAlign: "center" }}>
              Confidential — For Official Use Only
            </td>
            <td style={{ fontSize: "8px", color: "#666", padding: "2px 0", textAlign: "right" }}>
              www.jjcet.ac.in | 0431 – 2660566
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SectionTitle({ num, title }: { num: number; title: string }) {
  return (
    <div style={{
      background: "#1e3a8a",
      color: "white",
      padding: "4px 10px",
      fontSize: "11px",
      fontWeight: "700",
      marginBottom: "4px",
      marginTop: "10px",
      letterSpacing: "0.3px",
    }}>
      SECTION {num} — {title}
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
  background: "#e2e8f0",
  padding: "4px 6px",
  textAlign: "left",
  border: "1px solid #cbd5e1",
  fontWeight: "700",
  fontSize: "8px",
  color: "#1e3a8a",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  wordBreak: "break-word" as const,
};

const tdStyle: React.CSSProperties = {
  padding: "4px 6px",
  border: "1px solid #e2e8f0",
  fontSize: "9px",
  wordBreak: "break-word" as const,
};

const labelCellStyle: React.CSSProperties = {
  padding: "3px 6px",
  border: "1px solid #e2e8f0",
  fontWeight: "700",
  fontSize: "8px",
  color: "#475569",
  width: "25%",
  background: "#f8fafc",
};

const valueCellStyle: React.CSSProperties = {
  padding: "3px 6px",
  border: "1px solid #e2e8f0",
  fontSize: "9px",
  width: "25%",
};
