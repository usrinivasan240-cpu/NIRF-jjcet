"use client";

import { REPORT_STYLES, ReportHeader, SectionTitle, ReportFooter, SignatureBox } from "./ReportLayout";

interface DeptAnnualData {
  department: { name: string; code: string };
  academicYear: string;
  facultySummary: { total: number; phd: number; male: number; female: number };
  studentSummary: { total: number; ug: number; pg: number; phd: number };
  researchOutput: { projects: number; funded: number; amount: number };
  publications: { journal: number; conference: number; total: number };
  patents: { filed: number; granted: number };
  consultancy: { projects: number; amount: number };
  placementStatistics: { placed: number; total: number; percentage: number };
  higherStudies: number;
  infrastructure: string[];
  events: { conferences: number; workshops: number; seminars: number; fdp: number };
  budgetSummary: { allocated: number; spent: number };
  targetAchievement: { category: string; target: number; achieved: number }[];
  documentVerification: { name: string; status: string }[];
}

export default function DepartmentAnnualReport({
  data,
  logoUrl,
}: {
  data: DeptAnnualData;
  logoUrl?: string;
}) {
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

      <ReportHeader
        logoUrl={logo}
        title="J.J. College of Engineering & Technology"
        subtitle={`${data.department.name} — Department Annual Report`}
        meta={{
          reportId: `DAR-${data.department.code}-${data.academicYear.replace("-", "")}`,
          deptName: data.department.name,
          generatedOn: new Date().toLocaleDateString("en-IN"),
          generatedAt: new Date().toLocaleTimeString("en-IN"),
        }}
      />

      {/* SECTION 1: DEPARTMENT OVERVIEW */}
      <SectionTitle num={1} title="DEPARTMENT OVERVIEW" />
      <table style={REPORT_STYLES.table}>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.th, width: "25%" }}>Department</td>
            <td style={REPORT_STYLES.td}>{data.department.name}</td>
            <td style={{ ...REPORT_STYLES.th, width: "25%" }}>Department Code</td>
            <td style={REPORT_STYLES.td}>{data.department.code}</td>
          </tr>
          <tr>
            <td style={REPORT_STYLES.th}>Academic Year</td>
            <td style={{ ...REPORT_STYLES.td, fontWeight: "700" }}>{data.academicYear}</td>
            <td style={REPORT_STYLES.th}>Generated On</td>
            <td style={REPORT_STYLES.td}>{new Date().toLocaleDateString("en-IN")}</td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 2: FACULTY SUMMARY */}
      <SectionTitle num={2} title="FACULTY SUMMARY" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>Total Faculty</th>
            <th style={REPORT_STYLES.th}>PhD Holders</th>
            <th style={REPORT_STYLES.th}>Male</th>
            <th style={REPORT_STYLES.th}>Female</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700" }}>
              {data.facultySummary.total}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", color: "#0D47A1", fontWeight: "700" }}>
              {data.facultySummary.phd}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.facultySummary.male}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.facultySummary.female}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 3: STUDENT SUMMARY */}
      <SectionTitle num={3} title="STUDENT SUMMARY" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>Total Students</th>
            <th style={REPORT_STYLES.th}>UG</th>
            <th style={REPORT_STYLES.th}>PG</th>
            <th style={REPORT_STYLES.th}>PhD</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700" }}>
              {data.studentSummary.total}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.studentSummary.ug}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.studentSummary.pg}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.studentSummary.phd}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 4: RESEARCH OUTPUT */}
      <SectionTitle num={4} title="RESEARCH OUTPUT" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>Projects</th>
            <th style={REPORT_STYLES.th}>Funded Projects</th>
            <th style={REPORT_STYLES.th}>Total Funded Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700" }}>
              {data.researchOutput.projects}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.researchOutput.funded}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", color: "#0D47A1", fontWeight: "700" }}>
              ₹{data.researchOutput.amount.toLocaleString("en-IN")}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 5: PUBLICATIONS */}
      <SectionTitle num={5} title="PUBLICATIONS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>Journal Publications</th>
            <th style={REPORT_STYLES.th}>Conference Publications</th>
            <th style={REPORT_STYLES.th}>Total Publications</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.publications.journal}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.publications.conference}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700", color: "#0D47A1" }}>
              {data.publications.total}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 6: PATENTS */}
      <SectionTitle num={6} title="PATENTS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>Patents Filed</th>
            <th style={REPORT_STYLES.th}>Patents Granted</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.patents.filed}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700", color: "#2E7D32" }}>
              {data.patents.granted}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 7: CONSULTANCY & PLACEMENTS */}
      <SectionTitle num={7} title="CONSULTANCY & PLACEMENTS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>Consultancy Projects</th>
            <th style={REPORT_STYLES.th}>Consultancy Amount (₹)</th>
            <th style={REPORT_STYLES.th}>Students Placed</th>
            <th style={REPORT_STYLES.th}>Total Eligible</th>
            <th style={REPORT_STYLES.th}>Placement %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.consultancy.projects}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", color: "#0D47A1", fontWeight: "700" }}>
              ₹{data.consultancy.amount.toLocaleString("en-IN")}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.placementStatistics.placed}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              {data.placementStatistics.total}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700", color: "#2E7D32" }}>
              {data.placementStatistics.percentage.toFixed(1)}%
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ ...REPORT_STYLES.table, marginTop: "4px" }}>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.th, width: "50%" }}>Students Opted for Higher Studies</td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700" }}>
              {data.higherStudies}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 8: INFRASTRUCTURE */}
      <SectionTitle num={8} title="INFRASTRUCTURE" />
      <div style={{ padding: "8px 12px", border: "1px solid #E0E0E0", marginBottom: "8px", background: "#FAFAFA" }}>
        <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "9px", lineHeight: "1.8" }}>
          {data.infrastructure.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      {/* SECTION 9: EVENTS */}
      <SectionTitle num={9} title="EVENTS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>Conferences</th>
            <th style={REPORT_STYLES.th}>Workshops</th>
            <th style={REPORT_STYLES.th}>Seminars</th>
            <th style={REPORT_STYLES.th}>FDP</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700" }}>
              {data.events.conferences}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700" }}>
              {data.events.workshops}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700" }}>
              {data.events.seminars}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700" }}>
              {data.events.fdp}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 10: BUDGET SUMMARY */}
      <SectionTitle num={10} title="BUDGET SUMMARY" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>Allocated (₹)</th>
            <th style={REPORT_STYLES.th}>Spent (₹)</th>
            <th style={REPORT_STYLES.th}>Remaining (₹)</th>
            <th style={REPORT_STYLES.th}>Utilization %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              ₹{data.budgetSummary.allocated.toLocaleString("en-IN")}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700" }}>
              ₹{data.budgetSummary.spent.toLocaleString("en-IN")}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>
              ₹{(data.budgetSummary.allocated - data.budgetSummary.spent).toLocaleString("en-IN")}
            </td>
            <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700", color: "#0D47A1" }}>
              {data.budgetSummary.allocated > 0
                ? ((data.budgetSummary.spent / data.budgetSummary.allocated) * 100).toFixed(1)
                : "0.0"}%
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 11: TARGET vs ACHIEVEMENT */}
      <SectionTitle num={11} title="TARGET vs ACHIEVEMENT" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "4%" }}>S.No</th>
            <th style={REPORT_STYLES.th}>Category</th>
            <th style={{ ...REPORT_STYLES.th, textAlign: "center" }}>Target</th>
            <th style={{ ...REPORT_STYLES.th, textAlign: "center" }}>Achieved</th>
            <th style={{ ...REPORT_STYLES.th, textAlign: "center" }}>Completion %</th>
          </tr>
        </thead>
        <tbody>
          {data.targetAchievement.map((row, i) => {
            const pct = row.target > 0 ? (row.achieved / row.target) * 100 : 0;
            const pctColor =
              pct >= 90 ? "#2E7D32" : pct >= 75 ? "#1565C0" : pct >= 60 ? "#F57C00" : "#C62828";
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
                <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>{i + 1}</td>
                <td style={REPORT_STYLES.td}>{row.category}</td>
                <td style={{ ...REPORT_STYLES.td, textAlign: "center" }}>{row.target}</td>
                <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700" }}>
                  {row.achieved}
                </td>
                <td style={{ ...REPORT_STYLES.td, textAlign: "center", fontWeight: "700", color: pctColor }}>
                  {pct.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* SECTION 12: DOCUMENT VERIFICATION */}
      <SectionTitle num={12} title="DOCUMENT VERIFICATION" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>Document Name</th>
            <th style={REPORT_STYLES.th}>Verification Status</th>
          </tr>
        </thead>
        <tbody>
          {data.documentVerification.map((doc, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F5F7FA" }}>
              <td style={REPORT_STYLES.td}>{doc.name}</td>
              <td
                style={{
                  ...REPORT_STYLES.td,
                  fontWeight: "700",
                  color:
                    doc.status === "Verified"
                      ? "#2E7D32"
                      : doc.status === "Pending"
                      ? "#F57C00"
                      : "#C62828",
                }}
              >
                {doc.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SIGNATURES */}
      <SectionTitle num={13} title="SIGNATURES" />
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <SignatureBox name={data.department.name} role="Head of Department" />
        <SignatureBox name="Vice Principal" role="Vice Principal" />
        <SignatureBox name="Principal" role="Principal" />
      </div>

      <ReportFooter reportId={`DAR-${data.department.code}-${data.academicYear.replace("-", "")}`} />
    </div>
  );
}