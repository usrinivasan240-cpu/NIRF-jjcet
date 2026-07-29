"use client";

import { REPORT_STYLES, ReportHeader, SectionTitle, ReportFooter } from "./ReportLayout";

interface PublicationReportData {
  publications: {
    title: string;
    authors: string;
    journal: string;
    type: "journal" | "conference";
    year: string;
    department: string;
    doi: string;
    issn: string;
    indexing: string;
    citationCount: number;
    verificationStatus: string;
  }[];
  summary: {
    total: number;
    journal: number;
    conference: number;
    scopus: number;
    webOfScience: number;
    ugcCare: number;
  };
}

export default function PublicationReport({
  data,
  logoUrl,
}: {
  data: PublicationReportData;
  logoUrl?: string;
}) {
  const logo = logoUrl || "/images/jjcet-logo.png";
  const { publications, summary } = data;

  return (
    <div style={REPORT_STYLES.page}>
      <ReportHeader
        logoUrl={logo}
        title="Publication Report"
        subtitle="NIRF Research Publications Summary"
        meta={{
          reportId: "NIRF-PUB-2026",
          generatedOn: new Date().toLocaleDateString(),
          generatedAt: new Date().toLocaleTimeString(),
        }}
      />

      <SectionTitle num={1} title="PUBLICATION SUMMARY" />
      <table style={REPORT_STYLES.table}>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "700", width: "50%" }}>Total Publications</td>
            <td style={REPORT_STYLES.td}>{summary.total}</td>
          </tr>
          <tr>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "700" }}>Journal Publications</td>
            <td style={REPORT_STYLES.td}>{summary.journal}</td>
          </tr>
          <tr>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "700" }}>Conference Publications</td>
            <td style={REPORT_STYLES.td}>{summary.conference}</td>
          </tr>
          <tr>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "700" }}>Scopus Indexed</td>
            <td style={REPORT_STYLES.td}>{summary.scopus}</td>
          </tr>
          <tr>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "700" }}>Web of Science</td>
            <td style={REPORT_STYLES.td}>{summary.webOfScience}</td>
          </tr>
          <tr>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "700" }}>UGC Care Listed</td>
            <td style={REPORT_STYLES.td}>{summary.ugcCare}</td>
          </tr>
        </tbody>
      </table>

      <SectionTitle num={2} title="PUBLICATION LIST" />
      <div style={{ overflowX: "auto" }}>
        <table style={{ ...REPORT_STYLES.table, fontSize: "8px" }}>
          <thead>
            <tr>
              <th style={{ ...REPORT_STYLES.th, width: "4%" }}>S.No</th>
              <th style={{ ...REPORT_STYLES.th, width: "20%" }}>Title</th>
              <th style={{ ...REPORT_STYLES.th, width: "14%" }}>Authors</th>
              <th style={{ ...REPORT_STYLES.th, width: "12%" }}>Journal</th>
              <th style={{ ...REPORT_STYLES.th, width: "6%" }}>Type</th>
              <th style={{ ...REPORT_STYLES.th, width: "5%" }}>Year</th>
              <th style={{ ...REPORT_STYLES.th, width: "8%" }}>Dept</th>
              <th style={{ ...REPORT_STYLES.th, width: "10%" }}>DOI</th>
              <th style={{ ...REPORT_STYLES.th, width: "8%" }}>Indexing</th>
              <th style={{ ...REPORT_STYLES.th, width: "5%" }}>Citations</th>
              <th style={{ ...REPORT_STYLES.th, width: "8%" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {publications.map((pub, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
                <td style={REPORT_STYLES.td}>{i + 1}</td>
                <td style={REPORT_STYLES.td}>{pub.title}</td>
                <td style={REPORT_STYLES.td}>{pub.authors}</td>
                <td style={REPORT_STYLES.td}>{pub.journal}</td>
                <td style={REPORT_STYLES.td}>{pub.type}</td>
                <td style={REPORT_STYLES.td}>{pub.year}</td>
                <td style={REPORT_STYLES.td}>{pub.department}</td>
                <td style={REPORT_STYLES.td}>{pub.doi}</td>
                <td style={REPORT_STYLES.td}>{pub.indexing}</td>
                <td style={REPORT_STYLES.td}>{pub.citationCount}</td>
                <td style={REPORT_STYLES.td}>{pub.verificationStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReportFooter />
    </div>
  );
}
