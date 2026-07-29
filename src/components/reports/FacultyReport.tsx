"use client";

import { REPORT_STYLES, ReportHeader, SectionTitle, ReportFooter, SignatureBox } from "./ReportLayout";

interface FacultyReportData {
  faculty: { name: string; designation: string; department: string; qualification: string; experience: number; email: string; phone: string };
  publications: number;
  patents: number;
  books: number;
  bookChapters: number;
  consultancy: number;
  sponsoredProjects: number;
  fdps: number;
  workshops: number;
  seminars: number;
  guestLectures: number;
  researchGuidance: number;
  studentProjectsGuided: number;
  awards: string[];
  professionalMemberships: string[];
  targetVsAchieved: { category: string; target: number; achieved: number }[];
  pendingActivities: string[];
  verificationStatus: string;
}

export default function FacultyReport({ data, logoUrl }: { data: FacultyReportData; logoUrl?: string }) {
  const logo = logoUrl || "/images/jjcet-logo.png";

  return (
    <div style={REPORT_STYLES.page}>
      <ReportHeader
        logoUrl={logo}
        title="Faculty Performance Report"
        subtitle="NIRF Faculty Activity Report"
        meta={{
          reportId: `FAC-${new Date().getFullYear()}-${data.faculty.name.replace(/\s+/g, "").slice(0, 4).toUpperCase()}`,
          generatedOn: new Date().toLocaleDateString("en-IN"),
          generatedAt: new Date().toLocaleTimeString("en-IN"),
          deptName: data.faculty.department,
        }}
      />

      {/* 1. FACULTY PROFILE */}
      <SectionTitle num={1} title="FACULTY PROFILE" />
      <table style={REPORT_STYLES.table}>
        <tbody>
          <tr>
            <td style={REPORT_STYLES.th}>Name</td>
            <td style={REPORT_STYLES.td}>{data.faculty.name}</td>
            <td style={REPORT_STYLES.th}>Designation</td>
            <td style={REPORT_STYLES.td}>{data.faculty.designation}</td>
          </tr>
          <tr>
            <td style={REPORT_STYLES.th}>Department</td>
            <td style={REPORT_STYLES.td}>{data.faculty.department}</td>
            <td style={REPORT_STYLES.th}>Qualification</td>
            <td style={REPORT_STYLES.td}>{data.faculty.qualification}</td>
          </tr>
          <tr>
            <td style={REPORT_STYLES.th}>Experience (Years)</td>
            <td style={REPORT_STYLES.td}>{data.faculty.experience}</td>
            <td style={REPORT_STYLES.th}>Email</td>
            <td style={REPORT_STYLES.td}>{data.faculty.email}</td>
          </tr>
          <tr>
            <td style={REPORT_STYLES.th}>Phone</td>
            <td style={REPORT_STYLES.td} colSpan={3}>{data.faculty.phone}</td>
          </tr>
        </tbody>
      </table>

      {/* 2. RESEARCH OUTPUT */}
      <SectionTitle num={2} title="RESEARCH OUTPUT" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>Publications</th>
            <th style={REPORT_STYLES.th}>Patents</th>
            <th style={REPORT_STYLES.th}>Books</th>
            <th style={REPORT_STYLES.th}>Book Chapters</th>
            <th style={REPORT_STYLES.th}>Sponsored Projects</th>
            <th style={REPORT_STYLES.th}>Research Guidance</th>
            <th style={REPORT_STYLES.th}>Student Projects</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={REPORT_STYLES.td}>{data.publications}</td>
            <td style={REPORT_STYLES.td}>{data.patents}</td>
            <td style={REPORT_STYLES.td}>{data.books}</td>
            <td style={REPORT_STYLES.td}>{data.bookChapters}</td>
            <td style={REPORT_STYLES.td}>{data.sponsoredProjects}</td>
            <td style={REPORT_STYLES.td}>{data.researchGuidance}</td>
            <td style={REPORT_STYLES.td}>{data.studentProjectsGuided}</td>
          </tr>
        </tbody>
      </table>

      {/* 3. ACADEMIC ACTIVITIES */}
      <SectionTitle num={3} title="ACADEMIC ACTIVITIES" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>FDPs</th>
            <th style={REPORT_STYLES.th}>Workshops</th>
            <th style={REPORT_STYLES.th}>Seminars</th>
            <th style={REPORT_STYLES.th}>Guest Lectures</th>
            <th style={REPORT_STYLES.th}>Consultancy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={REPORT_STYLES.td}>{data.fdps}</td>
            <td style={REPORT_STYLES.td}>{data.workshops}</td>
            <td style={REPORT_STYLES.td}>{data.seminars}</td>
            <td style={REPORT_STYLES.td}>{data.guestLectures}</td>
            <td style={REPORT_STYLES.td}>{data.consultancy}</td>
          </tr>
        </tbody>
      </table>

      {/* 4. TARGET vs ACHIEVEMENT */}
      <SectionTitle num={4} title="TARGET vs ACHIEVEMENT" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={{ ...REPORT_STYLES.th, width: "8%" }}>S.No</th>
            <th style={{ ...REPORT_STYLES.th, width: "30%" }}>Category</th>
            <th style={{ ...REPORT_STYLES.th, width: "15%" }}>Target</th>
            <th style={{ ...REPORT_STYLES.th, width: "15%" }}>Achieved</th>
            <th style={{ ...REPORT_STYLES.th, width: "16%" }}>Completion %</th>
            <th style={{ ...REPORT_STYLES.th, width: "16%" }}>Pending</th>
          </tr>
        </thead>
        <tbody>
          {data.targetVsAchieved.map((item, i) => {
            const pct = item.target > 0 ? Math.round((item.achieved / item.target) * 100) : 0;
            return (
              <tr key={i}>
                <td style={REPORT_STYLES.td}>{i + 1}</td>
                <td style={REPORT_STYLES.td}>{item.category}</td>
                <td style={REPORT_STYLES.td}>{item.target}</td>
                <td style={REPORT_STYLES.td}>{item.achieved}</td>
                <td style={{ ...REPORT_STYLES.td, color: pct >= 100 ? "#2E7D32" : pct >= 75 ? "#F57F17" : "#C62828", fontWeight: 700 }}>
                  {pct}%
                </td>
                <td style={REPORT_STYLES.td}>{Math.max(0, item.target - item.achieved)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 5. AWARDS & MEMBERSHIPS */}
      <SectionTitle num={5} title="AWARDS & MEMBERSHIPS" />
      <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#0D47A1", marginBottom: "4px" }}>Awards & Honours</p>
          {data.awards.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "9px" }}>
              {data.awards.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: "9px", color: "#999" }}>No awards recorded</p>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "#0D47A1", marginBottom: "4px" }}>Professional Memberships</p>
          {data.professionalMemberships.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "9px" }}>
              {data.professionalMemberships.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: "9px", color: "#999" }}>No memberships recorded</p>
          )}
        </div>
      </div>

      {/* 6. PENDING ACTIVITIES */}
      <SectionTitle num={6} title="PENDING ACTIVITIES" />
      {data.pendingActivities.length > 0 ? (
        <ol style={{ margin: 0, paddingLeft: "16px", fontSize: "9px" }}>
          {data.pendingActivities.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      ) : (
        <p style={{ margin: 0, fontSize: "9px", color: "#999", padding: "4px 8px" }}>No pending activities</p>
      )}

      {/* 7. VERIFICATION STATUS */}
      <SectionTitle num={7} title="VERIFICATION STATUS" />
      <table style={REPORT_STYLES.table}>
        <tbody>
          <tr>
            <td style={{ ...REPORT_STYLES.td, fontWeight: 700 }}>Status</td>
            <td style={{ ...REPORT_STYLES.td, color: data.verificationStatus === "Verified" ? "#2E7D32" : data.verificationStatus === "Pending" ? "#F57F17" : "#C62828", fontWeight: 700 }}>
              {data.verificationStatus}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SIGNATURES */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
        <SignatureBox name={data.faculty.name} role="Faculty" />
        <SignatureBox name="HOD" role="Head of Department" />
        <SignatureBox name="Principal" role="Principal" />
      </div>

      <ReportFooter reportId={`FAC-${new Date().getFullYear()}`} version="v2.0" />
    </div>
  );
}
