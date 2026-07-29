"use client";

import {
  REPORT_STYLES,
  ReportHeader,
  SectionTitle,
  ReportFooter,
  SignatureBox,
} from "./ReportLayout";

interface MonthlyReviewData {
  department: { name: string; code: string };
  month: string;
  year: string;
  kpis: {
    sno: number;
    name: string;
    target: number | string;
    achievement: number;
    cumTarget: number | string;
    cumAchievement: number;
    percentage: number;
  }[];
  actionTaken: {
    sno: number;
    observation: string;
    remedialAction: string;
  }[];
  hodName?: string;
  principalName?: string;
}

function formatIndianNumber(num: number | string): string {
  if (typeof num === "string") return num;
  const str = num.toString();
  if (str.length <= 3) return str;
  const lastThree = str.slice(-3);
  const rest = str.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return formatted + "," + lastThree;
}

function getPercentageColor(pct: number): string {
  if (pct >= 75) return "#15803d";
  if (pct >= 25) return "#d97706";
  return "#dc2626";
}

export default function MonthlyReviewReport({
  data,
  logoUrl,
}: {
  data: MonthlyReviewData;
  logoUrl?: string;
}) {
  const logo = logoUrl || "/images/jjcet-logo.png";

  const kpiColumns = [
    "S.NO",
    "KPI Performance Indicator",
    "Target",
    "Achievement",
    "Cumulative Target",
    "Cumulative Achievement",
    "Percentage",
  ];

  return (
    <div style={REPORT_STYLES.page}>
      <ReportHeader
        title="DEPARTMENT MONTHLY REVIEW REPORT"
        subtitle={data.department.name}
        logoUrl={logo}
        meta={`Month: ${data.month} ${data.year}`}
      />

      {/* KPI Table */}
      <div style={{ marginBottom: 30 }}>
        <SectionTitle title="KEY PERFORMANCE INDICATORS" />
        <table
          style={{
            ...REPORT_STYLES.table,
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              {kpiColumns.map((col) => (
                <th key={col} style={REPORT_STYLES.th}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.kpis.map((kpi, idx) => (
              <tr
                key={kpi.sno}
                style={{
                  backgroundColor: idx % 2 === 0 ? "#f9fafb" : "#ffffff",
                }}
              >
                <td style={REPORT_STYLES.td}>{kpi.sno}</td>
                <td style={REPORT_STYLES.td}>{kpi.name}</td>
                <td style={REPORT_STYLES.td}>
                  {formatIndianNumber(kpi.target)}
                </td>
                <td style={REPORT_STYLES.td}>
                  {formatIndianNumber(kpi.achievement)}
                </td>
                <td style={REPORT_STYLES.td}>
                  {formatIndianNumber(kpi.cumTarget)}
                </td>
                <td style={REPORT_STYLES.td}>
                  {formatIndianNumber(kpi.cumAchievement)}
                </td>
                <td
                  style={{
                    ...REPORT_STYLES.td,
                    color: getPercentageColor(kpi.percentage),
                    fontWeight: 600,
                  }}
                >
                  {kpi.percentage.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Taken Report */}
      <div style={{ marginBottom: 30 }}>
        <SectionTitle title="ACTION TAKEN REPORT" />
        <table
          style={{
            ...REPORT_STYLES.table,
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={REPORT_STYLES.th}>S.NO</th>
              <th style={REPORT_STYLES.th}>Observations</th>
              <th style={REPORT_STYLES.th}>Remedial Action</th>
            </tr>
          </thead>
          <tbody>
            {data.actionTaken.map((item, idx) => (
              <tr
                key={item.sno}
                style={{
                  backgroundColor: idx % 2 === 0 ? "#f9fafb" : "#ffffff",
                }}
              >
                <td style={REPORT_STYLES.td}>{item.sno}</td>
                <td style={REPORT_STYLES.td}>{item.observation}</td>
                <td style={REPORT_STYLES.td}>{item.remedialAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 40,
          marginBottom: 20,
        }}
      >
        <SignatureBox title="HOD" name={data.hodName} />
        <SignatureBox title="PRINCIPAL" name={data.principalName} />
      </div>

      <ReportFooter />
    </div>
  );
}
