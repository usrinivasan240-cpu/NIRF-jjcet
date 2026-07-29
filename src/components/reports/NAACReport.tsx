"use client";

import React from "react";
import { REPORT_STYLES, SectionTitle, ReportFooter } from "./ReportLayout";

interface NAACReportData {
  academicYear: string;
  criteria: {
    name: string;
    score: number;
    maxScore: number;
    weightage: number;
    keyIndicators: { name: string; score: number; maxScore: number }[];
  }[];
  ssrSummary: { metric: string; score: number; maxScore: number }[];
  aqarData: { metric: string; value: string }[];
  supportingDocuments: { criteria: string; document: string; status: string }[];
  departmentContributions: { department: string; contribution: string; score: number }[];
  overallGrade: string;
  overallScore: number;
}

export default function NAACReport({ data, logoUrl }: { data: NAACReportData; logoUrl?: string }) {
  const logo = logoUrl || "/images/jjcet-logo.png";

  return (
    <div style={REPORT_STYLES.page}>
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

      {/* HEADER */}
      <div style={REPORT_STYLES.header}>
        <div style={REPORT_STYLES.headerRow}>
          <img src={logo} alt="JJCET" style={REPORT_STYLES.logo} />
          <div style={REPORT_STYLES.headerText}>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: "800", letterSpacing: "0.5px" }}>
              J.J. College of Engineering &amp; Technology
            </h1>
            <p style={{ margin: 0, fontSize: "9px", opacity: 0.9 }}>An Autonomous Institution | Tiruchirappalli – 621013</p>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: "700", marginTop: "4px" }}>NAAC ACCREDITATION REPORT</p>
            <p style={{ margin: 0, fontSize: "9px", opacity: 0.85 }}>Academic Year {data.academicYear}</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: NAAC ASSESSMENT OVERVIEW */}
      <SectionTitle num={1} title="NAAC ASSESSMENT OVERVIEW" />
      <table style={REPORT_STYLES.table}>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "700", background: "#F5F7FA", width: "25%" }}>Academic Year</td>
            <td style={{ ...REPORT_STYLES.td, width: "25%" }}>{data.academicYear}</td>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "700", background: "#F5F7FA", width: "25%" }}>Overall Grade</td>
            <td style={{ ...REPORT_STYLES.td, width: "25%", fontWeight: "800", color: "#0D47A1", fontSize: "12px" }}>{data.overallGrade}</td>
          </tr>
          <tr>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "700", background: "#F5F7FA" }}>Overall Score</td>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "800", color: "#0D47A1", fontSize: "12px" }}>{data.overallScore}</td>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "700", background: "#F5F7FA" }}>Status</td>
            <td style={{ ...REPORT_STYLES.td, color: "#2E7D32", fontWeight: "700" }}>Accredited</td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 2: CRITERION-WISE SCORES */}
      <SectionTitle num={2} title="CRITERION-WISE SCORES" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "30px" }}>S.No</th>
            <th style={REPORT_STYLES.th}>Criterion</th>
            <th style={{ ...REPORT_STYLES.th, textAlign: "center" }}>Score</th>
            <th style={{ ...REPORT_STYLES.th, textAlign: "center" }}>Max</th>
            <th style={{ ...REPORT_STYLES.th, textAlign: "center" }}>Weightage</th>
          </tr>
        </thead>
        <tbody>
          {data.criteria.map((criterion, i) => (
            <React.Fragment key={i}>
              <tr style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
                <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>{i + 1}</td>
                <td style={{ ...REPORT_STYLES.td, fontWeight: "700" }}>{criterion.name}</td>
                <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "800", color: "#0D47A1" }}>{criterion.score}</td>
                <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>{criterion.maxScore}</td>
                <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>{criterion.weightage}%</td>
              </tr>
              {criterion.keyIndicators.map((ki, j) => (
                <tr key={`ki-${i}-${j}`} style={{ background: "#FAFAFA" }}>
                  <td style={{ ...REPORT_STYLES.td, textAlign: "center", color: "#999" }}>—</td>
                  <td style={{ ...REPORT_STYLES.td, paddingLeft: "20px", fontSize: "8px", color: "#555" }}>{ki.name}</td>
                  <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontSize: "8px" }}>{ki.score}</td>
                  <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontSize: "8px" }}>{ki.maxScore}</td>
                  <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontSize: "8px" }}>—</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* SECTION 3: SSR SUMMARY */}
      <SectionTitle num={3} title="SSR SUMMARY" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "30px" }}>S.No</th>
            <th style={REPORT_STYLES.th}>Metric</th>
            <th style={{ ...REPORT_STYLES.th, textAlign: "center" }}>Score</th>
            <th style={{ ...REPORT_STYLES.th, textAlign: "center" }}>Max Score</th>
          </tr>
        </thead>
        <tbody>
          {data.ssrSummary.map((item, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
              <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>{i + 1}</td>
              <td style={{ ...REPORT_STYLES.td }}>{item.metric}</td>
              <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700" }}>{item.score}</td>
              <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>{item.maxScore}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SECTION 4: AQAR DATA */}
      <SectionTitle num={4} title="AQAR DATA" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "30px" }}>S.No</th>
            <th style={REPORT_STYLES.th}>Metric</th>
            <th style={REPORT_STYLES.th}>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.aqarData.map((item, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
              <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>{i + 1}</td>
              <td style={{ ...REPORT_STYLES.td }}>{item.metric}</td>
              <td style={{ ...REPORT_STYLES.td, fontWeight: "600" }}>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SECTION 5: SUPPORTING DOCUMENTS */}
      <SectionTitle num={5} title="SUPPORTING DOCUMENTS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "30px" }}>S.No</th>
            <th style={REPORT_STYLES.th}>Criteria</th>
            <th style={REPORT_STYLES.th}>Document</th>
            <th style={REPORT_STYLES.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.supportingDocuments.map((doc, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
              <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>{i + 1}</td>
              <td style={{ ...REPORT_STYLES.td }}>{doc.criteria}</td>
              <td style={{ ...REPORT_STYLES.td }}>{doc.document}</td>
              <td style={{ ...REPORT_STYLES.td, fontWeight: "700", color: doc.status === "Verified" ? "#2E7D32" : doc.status === "Pending" ? "#F57C00" : "#C62828" }}>
                {doc.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SECTION 6: DEPARTMENT CONTRIBUTIONS */}
      <SectionTitle num={6} title="DEPARTMENT CONTRIBUTIONS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "30px" }}>S.No</th>
            <th style={REPORT_STYLES.th}>Department</th>
            <th style={REPORT_STYLES.th}>Contribution</th>
            <th style={{ ...REPORT_STYLES.th, textAlign: "center" }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {data.departmentContributions.map((dept, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
              <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>{i + 1}</td>
              <td style={{ ...REPORT_STYLES.td, fontWeight: "700" }}>{dept.department}</td>
              <td style={{ ...REPORT_STYLES.td }}>{dept.contribution}</td>
              <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "800", color: "#0D47A1" }}>{dept.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FOOTER */}
      <ReportFooter reportId="NAAC" version="v1.0" />
    </div>
  );
}
