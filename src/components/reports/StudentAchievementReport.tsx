"use client";

import { REPORT_STYLES, SectionTitle, ReportFooter } from "./ReportLayout";

interface StudentAchievementData {
  department: string;
  academicYear: string;
  projects: { title: string; students: string; guide: string; status: string }[];
  internships: { student: string; company: string; duration: string; status: string }[];
  certifications: { student: string; name: string; issuer: string; date: string }[];
  hackathons: { name: string; students: string; rank: string; date: string }[];
  competitions: { name: string; students: string; result: string; date: string }[];
  higherStudies: { student: string; university: string; program: string }[];
  awards: { student: string; name: string; level: string; date: string }[];
  placements: { student: string; company: string; package: string }[];
}

export default function StudentAchievementReport({
  data,
  logoUrl,
}: {
  data: StudentAchievementData;
  logoUrl?: string;
}) {
  const logo = logoUrl || "/images/jjcet-logo.png";

  return (
    <div style={REPORT_STYLES.container}>
      <div style={REPORT_STYLES.header}>
        <img src={logo} alt="JJCET Logo" style={REPORT_STYLES.logo} />
        <div style={REPORT_STYLES.headerText}>
          <h1 style={REPORT_STYLES.title}>Student Achievement Report</h1>
          <p style={REPORT_STYLES.subtitle}>
            {data.department} | {data.academicYear}
          </p>
        </div>
      </div>

      {/* STUDENT PROJECTS */}
      <SectionTitle title="STUDENT PROJECTS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>S.No</th>
            <th style={REPORT_STYLES.th}>Title</th>
            <th style={REPORT_STYLES.th}>Students</th>
            <th style={REPORT_STYLES.th}>Guide</th>
            <th style={REPORT_STYLES.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.projects.map((project, index) => (
            <tr key={index}>
              <td style={REPORT_STYLES.td}>{index + 1}</td>
              <td style={REPORT_STYLES.td}>{project.title}</td>
              <td style={REPORT_STYLES.td}>{project.students}</td>
              <td style={REPORT_STYLES.td}>{project.guide}</td>
              <td style={REPORT_STYLES.td}>{project.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* INTERNSHIPS */}
      <SectionTitle title="INTERNSHIPS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>S.No</th>
            <th style={REPORT_STYLES.th}>Student</th>
            <th style={REPORT_STYLES.th}>Company</th>
            <th style={REPORT_STYLES.th}>Duration</th>
            <th style={REPORT_STYLES.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.internships.map((internship, index) => (
            <tr key={index}>
              <td style={REPORT_STYLES.td}>{index + 1}</td>
              <td style={REPORT_STYLES.td}>{internship.student}</td>
              <td style={REPORT_STYLES.td}>{internship.company}</td>
              <td style={REPORT_STYLES.td}>{internship.duration}</td>
              <td style={REPORT_STYLES.td}>{internship.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* CERTIFICATIONS */}
      <SectionTitle title="CERTIFICATIONS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>S.No</th>
            <th style={REPORT_STYLES.th}>Student</th>
            <th style={REPORT_STYLES.th}>Certification</th>
            <th style={REPORT_STYLES.th}>Issuer</th>
            <th style={REPORT_STYLES.th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.certifications.map((cert, index) => (
            <tr key={index}>
              <td style={REPORT_STYLES.td}>{index + 1}</td>
              <td style={REPORT_STYLES.td}>{cert.student}</td>
              <td style={REPORT_STYLES.td}>{cert.name}</td>
              <td style={REPORT_STYLES.td}>{cert.issuer}</td>
              <td style={REPORT_STYLES.td}>{cert.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* HACKATHONS & COMPETITIONS */}
      <SectionTitle title="HACKATHONS & COMPETITIONS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>S.No</th>
            <th style={REPORT_STYLES.th}>Event</th>
            <th style={REPORT_STYLES.th}>Students</th>
            <th style={REPORT_STYLES.th}>Result</th>
            <th style={REPORT_STYLES.th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.hackathons.map((hack, index) => (
            <tr key={`hack-${index}`}>
              <td style={REPORT_STYLES.td}>{index + 1}</td>
              <td style={REPORT_STYLES.td}>{hack.name}</td>
              <td style={REPORT_STYLES.td}>{hack.students}</td>
              <td style={REPORT_STYLES.td}>{hack.rank}</td>
              <td style={REPORT_STYLES.td}>{hack.date}</td>
            </tr>
          ))}
          {data.competitions.map((comp, index) => (
            <tr key={`comp-${index}`}>
              <td style={REPORT_STYLES.td}>{data.hackathons.length + index + 1}</td>
              <td style={REPORT_STYLES.td}>{comp.name}</td>
              <td style={REPORT_STYLES.td}>{comp.students}</td>
              <td style={REPORT_STYLES.td}>{comp.result}</td>
              <td style={REPORT_STYLES.td}>{comp.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* HIGHER STUDIES */}
      <SectionTitle title="HIGHER STUDIES" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>S.No</th>
            <th style={REPORT_STYLES.th}>Student</th>
            <th style={REPORT_STYLES.th}>University</th>
            <th style={REPORT_STYLES.th}>Program</th>
          </tr>
        </thead>
        <tbody>
          {data.higherStudies.map((study, index) => (
            <tr key={index}>
              <td style={REPORT_STYLES.td}>{index + 1}</td>
              <td style={REPORT_STYLES.td}>{study.student}</td>
              <td style={REPORT_STYLES.td}>{study.university}</td>
              <td style={REPORT_STYLES.td}>{study.program}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* AWARDS */}
      <SectionTitle title="AWARDS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>S.No</th>
            <th style={REPORT_STYLES.th}>Student</th>
            <th style={REPORT_STYLES.th}>Award</th>
            <th style={REPORT_STYLES.th}>Level</th>
            <th style={REPORT_STYLES.th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.awards.map((award, index) => (
            <tr key={index}>
              <td style={REPORT_STYLES.td}>{index + 1}</td>
              <td style={REPORT_STYLES.td}>{award.student}</td>
              <td style={REPORT_STYLES.td}>{award.name}</td>
              <td style={REPORT_STYLES.td}>{award.level}</td>
              <td style={REPORT_STYLES.td}>{award.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PLACEMENTS */}
      <SectionTitle title="PLACEMENTS" />
      <table style={REPORT_STYLES.table}>
        <thead>
          <tr>
            <th style={REPORT_STYLES.th}>S.No</th>
            <th style={REPORT_STYLES.th}>Student</th>
            <th style={REPORT_STYLES.th}>Company</th>
            <th style={REPORT_STYLES.th}>Package</th>
          </tr>
        </thead>
        <tbody>
          {data.placements.map((placement, index) => (
            <tr key={index}>
              <td style={REPORT_STYLES.td}>{index + 1}</td>
              <td style={REPORT_STYLES.td}>{placement.student}</td>
              <td style={REPORT_STYLES.td}>{placement.company}</td>
              <td style={REPORT_STYLES.td}>{placement.package}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ReportFooter />
    </div>
  );
}
