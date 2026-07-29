"use client";

import { REPORT_STYLES, SectionTitle, ReportFooter } from "./ReportLayout";

interface ConsultancyReportData {
  projects: {
    company: string;
    project: string;
    faculty: string;
    department: string;
    amount: number;
    duration: string;
    status: string;
    startDate: string;
    completionDate: string;
  }[];
  summary: {
    totalProjects: number;
    totalAmount: number;
    completed: number;
    ongoing: number;
  };
}

export default function ConsultancyReport({
  data,
  logoUrl,
}: {
  data: ConsultancyReportData;
  logoUrl?: string;
}) {
  const logo = logoUrl || "/images/jjcet-logo.png";
  const { projects = [], summary } = data || {};
  const s = summary || { totalProjects: 0, totalAmount: 0, completed: 0, ongoing: 0 };

  return (
    <div style={REPORT_STYLES.page}>
      <div style={REPORT_STYLES.header}>
        <div style={REPORT_STYLES.headerRow}>
          <img src={logo} alt="JJCET" style={REPORT_STYLES.logo} />
          <div style={REPORT_STYLES.headerText}>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: "800", letterSpacing: "0.5px" }}>
              J.J. College of Engineering & Technology
            </h1>
            <p style={{ margin: 0, fontSize: "9px", opacity: 0.9 }}>
              An Autonomous Institution | Tiruchirappalli – 621013
            </p>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: "700", marginTop: "4px" }}>
              CONSULTANCY REPORT
            </p>
          </div>
        </div>
      </div>

      <SectionTitle num={1} title="CONSULTANCY SUMMARY" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>Total Projects</th>
            <th style={REPORT_STYLES.th}>Total Amount (₹)</th>
            <th style={REPORT_STYLES.th}>Completed</th>
            <th style={REPORT_STYLES.th}>Ongoing</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700", color: "#0D47A1" }}>
              {s.totalProjects}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700", color: "#0D47A1" }}>
              ₹{s.totalAmount.toLocaleString("en-IN")}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700", color: "#2E7D32" }}>
              {s.completed}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700", color: "#F57C00" }}>
              {s.ongoing}
            </td>
          </tr>
        </tbody>
      </table>

      <SectionTitle num={2} title="PROJECT LIST" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "30px" }}>S.No</th>
            <th style={REPORT_STYLES.th}>Company</th>
            <th style={REPORT_STYLES.th}>Project</th>
            <th style={REPORT_STYLES.th}>Faculty</th>
            <th style={REPORT_STYLES.th}>Dept</th>
            <th style={{ ...REPORT_STYLES.th, textAlign: "right" }}>Amount (₹)</th>
            <th style={REPORT_STYLES.th}>Duration</th>
            <th style={REPORT_STYLES.th}>Status</th>
            <th style={REPORT_STYLES.th}>Start</th>
            <th style={REPORT_STYLES.th}>Completion</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
              <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>{i + 1}</td>
              <td style={REPORT_STYLES.td}>{p.company}</td>
              <td style={REPORT_STYLES.td}>{p.project}</td>
              <td style={REPORT_STYLES.td}>{p.faculty}</td>
              <td style={REPORT_STYLES.td}>{p.department}</td>
              <td style={{ ...REPORT_STYLES.td, textAlign: "right" }}>₹{p.amount.toLocaleString("en-IN")}</td>
              <td style={REPORT_STYLES.td}>{p.duration}</td>
              <td style={{ ...REPORT_STYLES.td, color: p.status === "Completed" ? "#2E7D32" : p.status === "Ongoing" ? "#F57C00" : "#0D47A1", fontWeight: "600" }}>
                {p.status}
              </td>
              <td style={REPORT_STYLES.td}>{p.startDate}</td>
              <td style={REPORT_STYLES.td}>{p.completionDate}</td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={10} style={{ ...REPORT_STYLES.td, textAlign: "center", color: "#999", padding: "12px" }}>
                No consultancy projects available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ReportFooter />
    </div>
  );
}
