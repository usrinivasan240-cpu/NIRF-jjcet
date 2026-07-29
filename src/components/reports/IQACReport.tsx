"use client";

import { REPORT_STYLES, SectionTitle, ReportFooter } from "./ReportLayout";

interface IQACReportData {
  academicYear: string;
  academicAudit: { department: string; auditDate: string; findings: string; compliance: string }[];
  qualityInitiatives: { initiative: string; description: string; status: string; impact: string }[];
  feedback: { category: string; responses: number; average: number; action: string }[];
  actionTaken: { item: string; action: string; responsible: string; status: string; deadline: string }[];
  bestPractices: { practice: string; description: string; outcome: string }[];
}

export default function IQACReport({ data, logoUrl }: { data: IQACReportData; logoUrl?: string }) {
  const logo = logoUrl || "/images/jjcet-logo.png";

  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    const color =
      status.toLowerCase() === "completed" || status.toLowerCase() === "implemented"
        ? "#2E7D32"
        : status.toLowerCase() === "in progress" || status.toLowerCase() === "ongoing"
          ? "#F57F17"
          : status.toLowerCase() === "not started" || status.toLowerCase() === "pending"
            ? "#C62828"
            : "#333";
    return { color, fontWeight: 700 };
  };

  const getComplianceBadgeStyle = (compliance: string): React.CSSProperties => {
    const color =
      compliance.toLowerCase() === "fully compliant"
        ? "#2E7D32"
        : compliance.toLowerCase() === "partially compliant"
          ? "#F57F17"
          : "#C62828";
    return { color, fontWeight: 700 };
  };

  return (
    <div style={REPORT_STYLES.page}>
      {/* Header */}
      <div style={REPORT_STYLES.header}>
        <div style={REPORT_STYLES.headerRow}>
          <img src={logo} alt="JJCET Logo" style={REPORT_STYLES.logo} />
          <div style={REPORT_STYLES.headerText}>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: "800", letterSpacing: "0.5px" }}>
              J.J. College of Engineering & Technology
            </h1>
            <p style={{ margin: 0, fontSize: "9px", opacity: 0.9 }}>
              An Autonomous Institution | Tiruchirappalli – 621013
            </p>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: "700", marginTop: "4px" }}>
              IQAC Report — Academic Year {data.academicYear}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Academic Audit */}
      <SectionTitle num={1} title="ACADEMIC AUDIT" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "6%" }}>S.No</th>
            <th style={{ ...REPORT_STYLES.th, width: "18%" }}>Department</th>
            <th style={{ ...REPORT_STYLES.th, width: "14%" }}>Audit Date</th>
            <th style={{ ...REPORT_STYLES.th, width: "34%" }}>Findings</th>
            <th style={{ ...REPORT_STYLES.th, width: "28%" }}>Compliance</th>
          </tr>
        </thead>
        <tbody>
          {data.academicAudit.map((row, i) => (
            <tr key={i}>
              <td style={REPORT_STYLES.td}>{i + 1}</td>
              <td style={REPORT_STYLES.td}>{row.department}</td>
              <td style={REPORT_STYLES.td}>{row.auditDate}</td>
              <td style={REPORT_STYLES.td}>{row.findings}</td>
              <td style={{ ...REPORT_STYLES.td, ...getComplianceBadgeStyle(row.compliance) }}>
                {row.compliance}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 2. Quality Initiatives */}
      <SectionTitle num={2} title="QUALITY INITIATIVES" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "6%" }}>S.No</th>
            <th style={{ ...REPORT_STYLES.th, width: "18%" }}>Initiative</th>
            <th style={{ ...REPORT_STYLES.th, width: "32%" }}>Description</th>
            <th style={{ ...REPORT_STYLES.th, width: "14%" }}>Status</th>
            <th style={{ ...REPORT_STYLES.th, width: "30%" }}>Impact</th>
          </tr>
        </thead>
        <tbody>
          {data.qualityInitiatives.map((row, i) => (
            <tr key={i}>
              <td style={REPORT_STYLES.td}>{i + 1}</td>
              <td style={REPORT_STYLES.td}>{row.initiative}</td>
              <td style={REPORT_STYLES.td}>{row.description}</td>
              <td style={{ ...REPORT_STYLES.td, ...getStatusBadgeStyle(row.status) }}>
                {row.status}
              </td>
              <td style={REPORT_STYLES.td}>{row.impact}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 3. Feedback Analysis */}
      <SectionTitle num={3} title="FEEDBACK ANALYSIS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "6%" }}>S.No</th>
            <th style={{ ...REPORT_STYLES.th, width: "20%" }}>Category</th>
            <th style={{ ...REPORT_STYLES.th, width: "14%" }}>Responses</th>
            <th style={{ ...REPORT_STYLES.th, width: "16%" }}>Average Score</th>
            <th style={{ ...REPORT_STYLES.th, width: "44%" }}>Action Taken</th>
          </tr>
        </thead>
        <tbody>
          {data.feedback.map((row, i) => (
            <tr key={i}>
              <td style={REPORT_STYLES.td}>{i + 1}</td>
              <td style={REPORT_STYLES.td}>{row.category}</td>
              <td style={REPORT_STYLES.td}>{row.responses}</td>
              <td style={REPORT_STYLES.td}>{row.average}</td>
              <td style={REPORT_STYLES.td}>{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. Action Taken Report */}
      <SectionTitle num={4} title="ACTION TAKEN REPORT" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "6%" }}>S.No</th>
            <th style={{ ...REPORT_STYLES.th, width: "18%" }}>Item</th>
            <th style={{ ...REPORT_STYLES.th, width: "26%" }}>Action</th>
            <th style={{ ...REPORT_STYLES.th, width: "18%" }}>Responsible</th>
            <th style={{ ...REPORT_STYLES.th, width: "14%" }}>Status</th>
            <th style={{ ...REPORT_STYLES.th, width: "18%" }}>Deadline</th>
          </tr>
        </thead>
        <tbody>
          {data.actionTaken.map((row, i) => (
            <tr key={i}>
              <td style={REPORT_STYLES.td}>{i + 1}</td>
              <td style={REPORT_STYLES.td}>{row.item}</td>
              <td style={REPORT_STYLES.td}>{row.action}</td>
              <td style={REPORT_STYLES.td}>{row.responsible}</td>
              <td style={{ ...REPORT_STYLES.td, ...getStatusBadgeStyle(row.status) }}>
                {row.status}
              </td>
              <td style={REPORT_STYLES.td}>{row.deadline}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 5. Best Practices */}
      <SectionTitle num={5} title="BEST PRACTICES" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "6%" }}>S.No</th>
            <th style={{ ...REPORT_STYLES.th, width: "22%" }}>Practice</th>
            <th style={{ ...REPORT_STYLES.th, width: "42%" }}>Description</th>
            <th style={{ ...REPORT_STYLES.th, width: "30%" }}>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {data.bestPractices.map((row, i) => (
            <tr key={i}>
              <td style={REPORT_STYLES.td}>{i + 1}</td>
              <td style={REPORT_STYLES.td}>{row.practice}</td>
              <td style={REPORT_STYLES.td}>{row.description}</td>
              <td style={REPORT_STYLES.td}>{row.outcome}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ReportFooter />
    </div>
  );
}
