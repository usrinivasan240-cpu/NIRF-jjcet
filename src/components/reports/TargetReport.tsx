"use client";

import { REPORT_STYLES, SectionTitle, ReportFooter } from "./ReportLayout";

interface TargetReportData {
  academicYear: string;
  department: string;
  targets: {
    kpi: string;
    category: string;
    annualTarget: number;
    currentAchievement: number;
    pending: number;
    completionPct: number;
    status: string;
  }[];
  summary: { totalKpis: number; achieved: number; inProgress: number; behind: number };
}

export default function TargetReport({ data, logoUrl }: { data: TargetReportData; logoUrl?: string }) {
  const logo = logoUrl || "/images/jjcet-logo.png";

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "achieved":
        return REPORT_STYLES.colors.success;
      case "in progress":
        return REPORT_STYLES.colors.warning;
      case "behind":
        return REPORT_STYLES.colors.danger;
      default:
        return REPORT_STYLES.colors.text;
    }
  };

  return (
    <div style={REPORT_STYLES.container}>
      {/* Header */}
      <div style={REPORT_STYLES.header}>
        <img src={logo} alt="JJCET Logo" style={REPORT_STYLES.logo} />
        <div>
          <h1 style={REPORT_STYLES.title}>Target Achievement Report</h1>
          <p style={REPORT_STYLES.subtitle}>JJCET College — NIRF ERP System</p>
        </div>
      </div>

      <hr style={REPORT_STYLES.divider} />

      {/* Target Overview */}
      <SectionTitle title="TARGET OVERVIEW" />
      <table style={REPORT_STYLES.table}>
        <tbody>
          <tr>
            <td style={REPORT_STYLES.tableHeader}>Academic Year</td>
            <td style={REPORT_STYLES.tableCell}>{data.academicYear}</td>
          </tr>
          <tr>
            <td style={REPORT_STYLES.tableHeader}>Department</td>
            <td style={REPORT_STYLES.tableCell}>{data.department}</td>
          </tr>
          <tr>
            <td style={REPORT_STYLES.tableHeader}>Total KPIs</td>
            <td style={REPORT_STYLES.tableCell}>{data.summary.totalKpis}</td>
          </tr>
          <tr>
            <td style={REPORT_STYLES.tableHeader}>Achieved</td>
            <td style={{ ...REPORT_STYLES.tableCell, color: REPORT_STYLES.colors.success }}>
              {data.summary.achieved}
            </td>
          </tr>
          <tr>
            <td style={REPORT_STYLES.tableHeader}>In Progress</td>
            <td style={{ ...REPORT_STYLES.tableCell, color: REPORT_STYLES.colors.warning }}>
              {data.summary.inProgress}
            </td>
          </tr>
          <tr>
            <td style={REPORT_STYLES.tableHeader}>Behind</td>
            <td style={{ ...REPORT_STYLES.tableCell, color: REPORT_STYLES.colors.danger }}>
              {data.summary.behind}
            </td>
          </tr>
        </tbody>
      </table>

      {/* KPI Tracker */}
      <SectionTitle title="KPI TRACKER" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.tableHeader}>S.No</th>
            <th style={REPORT_STYLES.tableHeader}>KPI</th>
            <th style={REPORT_STYLES.tableHeader}>Category</th>
            <th style={REPORT_STYLES.tableHeader}>Annual Target</th>
            <th style={REPORT_STYLES.tableHeader}>Current Achievement</th>
            <th style={REPORT_STYLES.tableHeader}>Pending</th>
            <th style={REPORT_STYLES.tableHeader}>Completion %</th>
            <th style={REPORT_STYLES.tableHeader}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.targets.map((item, index) => (
            <tr
              key={index}
              style={{
                backgroundColor: index % 2 === 0 ? REPORT_STYLES.colors.tableAlt : "#ffffff",
              }}
            >
              <td style={REPORT_STYLES.tableCell}>{index + 1}</td>
              <td style={REPORT_STYLES.tableCell}>{item.kpi}</td>
              <td style={REPORT_STYLES.tableCell}>{item.category}</td>
              <td style={REPORT_STYLES.tableCell}>{item.annualTarget}</td>
              <td style={REPORT_STYLES.tableCell}>{item.currentAchievement}</td>
              <td style={REPORT_STYLES.tableCell}>{item.pending}</td>
              <td style={REPORT_STYLES.tableCell}>{item.completionPct}%</td>
              <td
                style={{
                  ...REPORT_STYLES.tableCell,
                  color: getStatusColor(item.status),
                  fontWeight: 600,
                }}
              >
                {item.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <SectionTitle title="SUMMARY" />
      <div
        style={{
          ...REPORT_STYLES.card,
          padding: REPORT_STYLES.spacing.lg,
          marginTop: REPORT_STYLES.spacing.md,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ ...REPORT_STYLES.tableCell, textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: REPORT_STYLES.colors.primary }}>
                  {data.summary.totalKpis}
                </div>
                <div style={{ fontSize: "12px", color: REPORT_STYLES.colors.muted }}>Total KPIs</div>
              </td>
              <td style={{ ...REPORT_STYLES.tableCell, textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: REPORT_STYLES.colors.success }}>
                  {data.summary.achieved}
                </div>
                <div style={{ fontSize: "12px", color: REPORT_STYLES.colors.muted }}>Achieved</div>
              </td>
              <td style={{ ...REPORT_STYLES.tableCell, textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: REPORT_STYLES.colors.warning }}>
                  {data.summary.inProgress}
                </div>
                <div style={{ fontSize: "12px", color: REPORT_STYLES.colors.muted }}>In Progress</div>
              </td>
              <td style={{ ...REPORT_STYLES.tableCell, textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 700, color: REPORT_STYLES.colors.danger }}>
                  {data.summary.behind}
                </div>
                <div style={{ fontSize: "12px", color: REPORT_STYLES.colors.muted }}>Behind</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ReportFooter />
    </div>
  );
}
