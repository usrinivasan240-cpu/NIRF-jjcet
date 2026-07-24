"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number; collections: string[] } | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const seedDatabase = async () => {
    setLoading(true); setError(""); setResult(null); setProgress("Starting...");
    try {
      const now = new Date().toISOString();
      let count = 0;
      const collectionsUsed: string[] = [];

      const departments = [
        { id: "dept-it-001", name: "Information Technology", code: "IT", description: "Department of Information Technology" },
        { id: "dept-cse-002", name: "Computer Science & Engineering", code: "CSE", description: "Department of Computer Science & Engineering" },
        { id: "dept-ece-003", name: "Electronics & Communication Engineering", code: "ECE", description: "Department of Electronics & Communication Engineering" },
        { id: "dept-eee-004", name: "Electrical & Electronics Engineering", code: "EEE", description: "Department of Electrical & Electronics Engineering" },
        { id: "dept-mech-005", name: "Mechanical Engineering", code: "MECH", description: "Department of Mechanical Engineering" },
        { id: "dept-civil-006", name: "Civil Engineering", code: "CIVIL", description: "Department of Civil Engineering" },
      ];
      setProgress("Seeding departments...");
      for (const d of departments) {
        await setDoc(doc(db, "departments", d.id), { ...d, createdAt: now, updatedAt: now });
        count++;
      }
      collectionsUsed.push("departments");

      const faculties = [
        { id: "fac-001", name: "Dr. R. Shanmugam", email: "shanmugam@jjcet.edu", phone: "9876543210", designation: "Professor & Head", qualification: "Ph.D", experience: "20", departmentId: "dept-it-001", employeeId: "JJCET001" },
        { id: "fac-002", name: "Dr. K. Priya", email: "priya@jjcet.edu", phone: "9876543211", designation: "Professor", qualification: "Ph.D", experience: "15", departmentId: "dept-it-001", employeeId: "JJCET002" },
        { id: "fac-003", name: "Mr. S. Karthik", email: "karthik@jjcet.edu", phone: "9876543212", designation: "Associate Professor", qualification: "M.Tech", experience: "10", departmentId: "dept-it-001", employeeId: "JJCET003" },
        { id: "fac-004", name: "Ms. A. Divya", email: "divya@jjcet.edu", phone: "9876543213", designation: "Assistant Professor", qualification: "M.Tech", experience: "5", departmentId: "dept-it-001", employeeId: "JJCET004" },
        { id: "fac-005", name: "Dr. M. Rajesh", email: "rajesh@jjcet.edu", phone: "9876543214", designation: "Professor & Head", qualification: "Ph.D", experience: "18", departmentId: "dept-cse-002", employeeId: "JJCET005" },
        { id: "fac-006", name: "Dr. P. Swathi", email: "swathi@jjcet.edu", phone: "9876543215", designation: "Professor", qualification: "Ph.D", experience: "12", departmentId: "dept-cse-002", employeeId: "JJCET006" },
        { id: "fac-007", name: "Mr. V. Mohan", email: "mohan@jjcet.edu", phone: "9876543216", designation: "Associate Professor", qualification: "M.Tech", experience: "8", departmentId: "dept-cse-002", employeeId: "JJCET007" },
        { id: "fac-008", name: "Dr. L. Kamala", email: "kamala@jjcet.edu", phone: "9876543217", designation: "Professor & Head", qualification: "Ph.D", experience: "16", departmentId: "dept-ece-003", employeeId: "JJCET008" },
        { id: "fac-009", name: "Mr. B. Suresh", email: "suresh@jjcet.edu", phone: "9876543218", designation: "Assistant Professor", qualification: "M.Tech", experience: "4", departmentId: "dept-ece-003", employeeId: "JJCET009" },
        { id: "fac-010", name: "Dr. N. Meena", email: "meena@jjcet.edu", phone: "9876543219", designation: "Professor & Head", qualification: "Ph.D", experience: "14", departmentId: "dept-eee-004", employeeId: "JJCET010" },
        { id: "fac-011", name: "Mr. G. Ravi", email: "ravi@jjcet.edu", phone: "9876543220", designation: "Associate Professor", qualification: "M.Tech", experience: "9", departmentId: "dept-mech-005", employeeId: "JJCET011" },
        { id: "fac-012", name: "Dr. T. Saranya", email: "saranya@jjcet.edu", phone: "9876543221", designation: "Professor & Head", qualification: "Ph.D", experience: "13", departmentId: "dept-civil-006", employeeId: "JJCET012" },
      ];
      setProgress("Seeding faculties...");
      for (const f of faculties) {
        await setDoc(doc(db, "faculties", f.id), { ...f, createdAt: now, updatedAt: now });
        count++;
      }
      collectionsUsed.push("faculties");

      const publications = [
        { id: "pub-001", title: "Deep Learning for Medical Image Classification", authors: "Dr. R. Shanmugam, Mr. S. Karthik", journal: "IEEE Trans. Medical Imaging", type: "journal", publisher: "IEEE", citationCount: 25, status: "published", facultyId: "fac-001", departmentId: "dept-it-001" },
        { id: "pub-002", title: "Blockchain-Based Secure Data Sharing in IoT", authors: "Dr. K. Priya, Ms. A. Divya", journal: "Computer Networks", type: "journal", publisher: "Elsevier", citationCount: 18, status: "published", facultyId: "fac-002", departmentId: "dept-it-001" },
        { id: "pub-003", title: "Edge Computing for Real-Time Traffic Analysis", authors: "Dr. M. Rajesh, Mr. V. Mohan", journal: "Future Generation Computer Systems", type: "journal", publisher: "Elsevier", citationCount: 12, status: "published", facultyId: "fac-005", departmentId: "dept-cse-002" },
        { id: "pub-004", title: "IoT-Enabled Smart Agriculture Monitoring", authors: "Dr. P. Swathi, Dr. M. Rajesh", journal: "Sensors", type: "journal", publisher: "MDPI", citationCount: 30, status: "published", facultyId: "fac-006", departmentId: "dept-cse-002" },
        { id: "pub-005", title: "5G Network Optimization Using ML", authors: "Dr. L. Kamala, Mr. B. Suresh", journal: "IEEE Communications Magazine", type: "journal", publisher: "IEEE", citationCount: 22, status: "published", facultyId: "fac-008", departmentId: "dept-ece-003" },
        { id: "pub-006", title: "Renewable Energy Integration in Smart Grid", authors: "Dr. N. Meena", journal: "IEEE Trans. Smart Grid", type: "journal", publisher: "IEEE", citationCount: 15, status: "published", facultyId: "fac-010", departmentId: "dept-eee-004" },
        { id: "pub-007", title: "Additive Manufacturing for Aerospace", authors: "Mr. G. Ravi", journal: "Additive Manufacturing", type: "journal", publisher: "Elsevier", citationCount: 8, status: "published", facultyId: "fac-011", departmentId: "dept-mech-005" },
        { id: "pub-008", title: "Sustainable Construction Materials", authors: "Dr. T. Saranya", journal: "Construction and Building Materials", type: "journal", publisher: "Elsevier", citationCount: 10, status: "published", facultyId: "fac-012", departmentId: "dept-civil-006" },
        { id: "pub-009", title: "AI Chatbot for Student Counseling", authors: "Mr. S. Karthik, Ms. A. Divya", journal: "Intl Conf on AI", type: "conference", publisher: "Springer", citationCount: 5, status: "published", facultyId: "fac-003", departmentId: "dept-it-001" },
        { id: "pub-010", title: "Federated Learning for Healthcare Data", authors: "Dr. R. Shanmugam, Dr. K. Priya", journal: "ACM Computing Surveys", type: "journal", publisher: "ACM", citationCount: 35, status: "published", facultyId: "fac-001", departmentId: "dept-it-001" },
      ];
      setProgress("Seeding publications...");
      for (const p of publications) {
        await setDoc(doc(db, "publications", p.id), { ...p, createdAt: now, updatedAt: now });
        count++;
      }
      collectionsUsed.push("publications");

      const patents = [
        { id: "pat-001", title: "Smart Water Quality Monitoring Device Using IoT", patentNumber: "IN202411001234", country: "India", status: "granted", isGranted: true, filingDate: "2023-06-15", grantDate: "2024-08-20", inventors: "Dr. R. Shanmugam, Mr. S. Karthik", departmentId: "dept-it-001", facultyId: "fac-001" },
        { id: "pat-002", title: "Energy Efficient Routing for WSN", patentNumber: "IN202411005678", country: "India", status: "filed", isGranted: false, filingDate: "2024-01-10", grantDate: "", inventors: "Dr. K. Priya, Ms. A. Divya", departmentId: "dept-it-001", facultyId: "fac-002" },
        { id: "pat-003", title: "Blockchain Document Verification", patentNumber: "IN202411009012", country: "India", status: "published", isGranted: false, filingDate: "2024-03-20", grantDate: "", inventors: "Dr. M. Rajesh, Mr. V. Mohan", departmentId: "dept-cse-002", facultyId: "fac-005" },
        { id: "pat-004", title: "Smart Traffic Signal Using Computer Vision", patentNumber: "US20240012345", country: "USA", status: "filed", isGranted: false, filingDate: "2024-02-15", grantDate: "", inventors: "Dr. L. Kamala, Mr. B. Suresh", departmentId: "dept-ece-003", facultyId: "fac-008" },
        { id: "pat-005", title: "Solar-Powered Automated Irrigation System", patentNumber: "IN202411003456", country: "India", status: "granted", isGranted: true, filingDate: "2023-08-10", grantDate: "2024-05-15", inventors: "Dr. N. Meena", departmentId: "dept-eee-004", facultyId: "fac-010" },
      ];
      setProgress("Seeding patents...");
      for (const p of patents) {
        await setDoc(doc(db, "patents", p.id), { ...p, createdAt: now, updatedAt: now });
        count++;
      }
      collectionsUsed.push("patents");

      const research = [
        { id: "res-001", title: "AI-Driven Predictive Analytics for Student Performance", pi: "Dr. R. Shanmugam", coPi: "Mr. S. Karthik", fundingAgency: "AICTE", amount: "1500000", status: "ongoing", startDate: "2024-01-15", endDate: "2025-06-30", sanctionedYear: "2024", departmentId: "dept-it-001", facultyId: "fac-001" },
        { id: "res-002", title: "Secure Fog Computing for Healthcare", pi: "Dr. K. Priya", coPi: "Ms. A. Divya", fundingAgency: "DST", amount: "2000000", status: "ongoing", startDate: "2023-07-01", endDate: "2025-12-31", sanctionedYear: "2023", departmentId: "dept-it-001", facultyId: "fac-002" },
        { id: "res-003", title: "Smart Campus IoT Infrastructure", pi: "Dr. M. Rajesh", coPi: "Dr. P. Swathi", fundingAgency: "TNSCST", amount: "800000", status: "completed", startDate: "2022-04-01", endDate: "2024-03-31", sanctionedYear: "2022", departmentId: "dept-cse-002", facultyId: "fac-005" },
        { id: "res-004", title: "5G Testbed for Rural Connectivity", pi: "Dr. L. Kamala", coPi: "Mr. B. Suresh", fundingAgency: "DIT", amount: "3500000", status: "ongoing", startDate: "2024-04-01", endDate: "2026-03-31", sanctionedYear: "2024", departmentId: "dept-ece-003", facultyId: "fac-008" },
        { id: "res-005", title: "Wind-Solar Hybrid Energy Optimization", pi: "Dr. N. Meena", coPi: "", fundingAgency: "MNRE", amount: "2500000", status: "completed", startDate: "2021-10-01", endDate: "2023-09-30", sanctionedYear: "2021", departmentId: "dept-eee-004", facultyId: "fac-010" },
        { id: "res-006", title: "Seismic Analysis with Base Isolation", pi: "Dr. T. Saranya", coPi: "", fundingAgency: "AICTE", amount: "1200000", status: "ongoing", startDate: "2023-08-01", endDate: "2025-07-31", sanctionedYear: "2023", departmentId: "dept-civil-006", facultyId: "fac-012" },
      ];
      setProgress("Seeding research projects...");
      for (const r of research) {
        await setDoc(doc(db, "research", r.id), { ...r, createdAt: now, updatedAt: now });
        count++;
      }
      collectionsUsed.push("research");

      const students = [
        { id: "stu-001", name: "Arun Kumar S", rollNumber: "IT2022001", email: "arun@jjcet.edu", category: "M.Tech", title: "Deep Learning for Medical Image Analysis", year: "2024", departmentId: "dept-it-001", guideName: "Dr. R. Shanmugam", status: "ongoing" },
        { id: "stu-002", name: "Bhavani R", rollNumber: "IT2022002", email: "bhavani@jjcet.edu", category: "M.Tech", title: "Blockchain for Supply Chain", year: "2024", departmentId: "dept-it-001", guideName: "Dr. K. Priya", status: "completed" },
        { id: "stu-003", name: "Chandru M", rollNumber: "CSE2022001", email: "chandru@jjcet.edu", category: "M.Tech", title: "Federated Learning for Edge Devices", year: "2024", departmentId: "dept-cse-002", guideName: "Dr. M. Rajesh", status: "ongoing" },
        { id: "stu-004", name: "Deepa V", rollNumber: "CSE2022002", email: "deepa@jjcet.edu", category: "M.Tech", title: "Cloud-Native Microservices", year: "2024", departmentId: "dept-cse-002", guideName: "Dr. P. Swathi", status: "ongoing" },
        { id: "stu-005", name: "Ezhil R", rollNumber: "ECE2022001", email: "ezhil@jjcet.edu", category: "M.Tech", title: "5G MIMO Antenna Design", year: "2024", departmentId: "dept-ece-003", guideName: "Dr. L. Kamala", status: "completed" },
        { id: "stu-006", name: "Fathima S", rollNumber: "EEE2022001", email: "fathima@jjcet.edu", category: "M.Tech", title: "Smart Grid Energy Management", year: "2024", departmentId: "dept-eee-004", guideName: "Dr. N. Meena", status: "ongoing" },
        { id: "stu-007", name: "Ganesh K", rollNumber: "MECH2022001", email: "ganesh@jjcet.edu", category: "M.Tech", title: "Additive Manufacturing Optimization", year: "2024", departmentId: "dept-mech-005", guideName: "Mr. G. Ravi", status: "ongoing" },
        { id: "stu-008", name: "Hema L", rollNumber: "CIVIL2022001", email: "hema@jjcet.edu", category: "M.Tech", title: "Green Building Material Analysis", year: "2024", departmentId: "dept-civil-006", guideName: "Dr. T. Saranya", status: "completed" },
      ];
      setProgress("Seeding students...");
      for (const s of students) {
        await setDoc(doc(db, "students", s.id), { ...s, createdAt: now, updatedAt: now });
        count++;
      }
      collectionsUsed.push("students");

      const events = [
        { id: "evt-001", title: "National Conference on AI & ML", type: "conference", date: "2024-11-15", endDate: "2024-11-16", venue: "JJCET Auditorium", participants: "150", organizer: "Dept of IT", status: "completed", departmentId: "dept-it-001" },
        { id: "evt-002", title: "Workshop on Cloud Computing with AWS", type: "workshop", date: "2024-09-20", endDate: "2024-09-21", venue: "IT Lab 1", participants: "60", organizer: "Dept of CSE", status: "completed", departmentId: "dept-cse-002" },
        { id: "evt-003", title: "Technical Symposium ELEXTRA 2024", type: "symposium", date: "2024-10-05", endDate: "2024-10-05", venue: "ECE Seminar Hall", participants: "200", organizer: "Dept of ECE", status: "completed", departmentId: "dept-ece-003" },
        { id: "evt-004", title: "FDP on IoT and Edge Computing", type: "workshop", date: "2024-12-10", endDate: "2024-12-14", venue: "CSE Lab 3", participants: "40", organizer: "Dept of CSE", status: "completed", departmentId: "dept-cse-002" },
        { id: "evt-005", title: "Industry-Academia Conclave 2025", type: "conference", date: "2025-01-20", endDate: "2025-01-20", venue: "Main Auditorium", participants: "300", organizer: "JJCET", status: "upcoming", departmentId: "dept-it-001" },
        { id: "evt-006", title: "Robotics Workshop", type: "workshop", date: "2024-08-15", endDate: "2024-08-16", venue: "Mech Workshop", participants: "50", organizer: "Dept of MECH", status: "completed", departmentId: "dept-mech-005" },
      ];
      setProgress("Seeding events...");
      for (const e of events) {
        await setDoc(doc(db, "events", e.id), { ...e, createdAt: now, updatedAt: now });
        count++;
      }
      collectionsUsed.push("events");

      const targets = [
        { id: "tgt-001", category: "Publications", yearly: 50, achieved: 10, year: "2024-25", departmentId: "dept-it-001" },
        { id: "tgt-002", category: "Patents", yearly: 10, achieved: 2, year: "2024-25", departmentId: "dept-it-001" },
        { id: "tgt-003", category: "Funded Projects", yearly: 5, achieved: 2, year: "2024-25", departmentId: "dept-cse-002" },
        { id: "tgt-004", category: "Conferences", yearly: 12, achieved: 3, year: "2024-25", departmentId: "dept-ece-003" },
        { id: "tgt-005", category: "Workshops", yearly: 8, achieved: 4, year: "2024-25", departmentId: "dept-eee-004" },
        { id: "tgt-006", category: "Publications", yearly: 40, achieved: 8, year: "2024-25", departmentId: "dept-cse-002" },
      ];
      setProgress("Seeding targets...");
      for (const t of targets) {
        await setDoc(doc(db, "targets", t.id), { ...t, createdAt: now, updatedAt: now });
        count++;
      }
      collectionsUsed.push("targets");

      const reports = [
        { id: "rpt-001", title: "IT Department Annual Report 2024-25", type: "department", category: "annual_report", academicYear: "2024-25", status: "SUBMITTED", currentLevel: "HOD", content: "Annual report covering publications, patents, research projects, and student achievements for the IT department.\n\n1. Faculty Strength: 4 (1 Professor, 1 Associate Professor, 2 Assistant Professors)\n2. Publications: 10 journal papers, 1 conference paper\n3. Patents: 2 filed, 1 granted\n4. Research Projects: 2 ongoing (AICTE, DST funded)\n5. Students: 2 M.Tech scholars (1 completed, 1 ongoing)\n6. Events: 1 national conference organized\n7. Industry MoUs: 3 active collaborations\n8. Placement Rate: 92%\n9. Average CGPA: 8.2\n10. NIRF Score Contribution: 45/100", creatorId: "1", departmentId: "dept-it-001", signatures: [] },
        { id: "rpt-002", title: "CSE Semester Report - Even Sem 2024", type: "semester", category: "semester_summary", academicYear: "2024-25", status: "DRAFT", currentLevel: "STAFF", content: "Semester performance summary for CSE department.\n\n1. Total Students: 120\n2. Pass Percentage: 88%\n3. Average GPA: 7.8\n4. Faculty Load: 18 credit hours per faculty\n5. Guest Lectures Conducted: 5\n6. Workshops Organized: 2\n7. Student Projects: 15 mini projects, 8 major projects\n8. Paper Presentations: 12 by students\n9. Industry Visits: 2\n10. Remedial Classes: 8 sessions conducted", creatorId: "1", departmentId: "dept-cse-002", signatures: [] },
        { id: "rpt-003", title: "NIRF Submission Report 2025", type: "nirf", category: "nirf_report", academicYear: "2024-25", status: "LOCKED", currentLevel: "LOCKED", content: "Complete NIRF submission report for JJCET.\n\nParameter Scores:\n1. TLR (Teaching, Learning & Resources): 65/100\n   - FSR: 1:18 | FQR: 60% PhD holders | ESP: 85%\n2. RPC (Research and Professional Practice): 42/100\n   - PU: 45 | PP: 12 | FQ: 38 | CC: 250\n3. GO (Graduate Outcomes): 72/100\n   - UG: 85% | PG: 78% | Ph.D: 5 | Median: 72%\n4. EI (Outreach and Inclusivity): 55/100\n   - RD: 25% | WD: 18% | ES: 12% | PCD: 85%\n5. PR (Perception): 38/100\n   - AC: 42 | EM: 35 | PP: 38 | HU: 40\n\nOverall NIRF Rank: 156/200", creatorId: "1", signatures: [] },
        { id: "rpt-004", title: "Staff Monthly Progress Report - December 2024", type: "staff", category: "monthly_progress", academicYear: "2024-25", status: "SUBMITTED", currentLevel: "VP", content: "Monthly progress report for IT department staff - December 2024.\n\nDr. R. Shanmugam (Professor & HOD):\n- Papers Under Review: 2\n- Research Guidance: 2 scholars\n- Administrative Tasks: NAAC documentation\n- Classes Taken: 12 hours/week\n\nDr. K. Priya (Professor):\n- Papers Published: 1 (Elsevier)\n- Research Guidance: 1 scholar\n- FDP Attended: 1 (online)\n- Classes Taken: 14 hours/week\n\nMr. S. Karthik (Associate Professor):\n- Papers Published: 1 (Springer)\n- Lab Sessions: 6\n- Student Projects Guided: 3\n- Classes Taken: 15 hours/week\n\nMs. A. Divya (Assistant Professor):\n- Papers Under Review: 1\n- Workshop Organized: 1\n- Classes Taken: 16 hours/week", creatorId: "5", departmentId: "dept-it-001", signatures: [] },
        { id: "rpt-005", title: "ECE Department Faculty Performance Report", type: "department", category: "faculty_performance", academicYear: "2024-25", status: "DRAFT", currentLevel: "STAFF", content: "Faculty Performance Assessment - ECE Department\n\nDr. L. Kamala (Professor & HOD):\n- Teaching Score: 4.5/5\n- Research Score: 4.2/5\n- Admin Score: 4.0/5\n- Overall: Excellent\n\nMr. B. Suresh (Assistant Professor):\n- Teaching Score: 4.0/5\n- Research Score: 3.5/5\n- Student Feedback: 4.3/5\n- Overall: Very Good\n\nKey Highlights:\n- 5 journal papers published\n- 1 patent filed (USA)\n- 1 DST funded project ongoing\n- 25 international conference presentations by students", creatorId: "1", departmentId: "dept-ece-003", signatures: [] },
        { id: "rpt-006", title: "Patent Summary Report 2024-25", type: "department", category: "department_patents", academicYear: "2024-25", status: "SUBMITTED", currentLevel: "PRINCIPAL", content: "Patent Activity Summary 2024-25\n\nTotal Patents: 5\n- Granted: 2 (India)\n- Published: 1 (India)\n- Filed: 2 (India: 1, USA: 1)\n\nDepartment-wise Breakdown:\n- IT: 2 (1 granted, 1 filed)\n- CSE: 1 (published)\n- ECE: 1 (filed in USA)\n- EEE: 1 (granted)\n\nFinancial Summary:\n- Filing Costs: Rs. 2,50,000\n- Maintenance Costs: Rs. 75,000\n- Revenue from Licensing: Rs. 5,00,000\n- Net Income: Rs. 1,75,000\n\nKey Patents:\n1. Smart Water Quality Monitoring (Granted) - Rs. 3L licensing deal\n2. Solar-Powered Irrigation (Granted) - Under commercialization\n3. Blockchain Document Verification (Published) - Industry collaboration", creatorId: "1", signatures: [] },
        { id: "rpt-007", title: "EEE Department Research Output Report", type: "department", category: "department_publications", academicYear: "2024-25", status: "DRAFT", currentLevel: "STAFF", content: "Research Output - EEE Department 2024-25\n\nPublications:\n- Journal Papers: 3 (2 IEEE, 1 Elsevier)\n- Conference Papers: 4 (2 international, 2 national)\n- Book Chapters: 1\n\nFunded Projects:\n- Completed: 1 (MNRE - Rs. 25L)\n- Ongoing: 1 (N/A)\n- Proposed: 2\n\nResearch Highlights:\n1. Wind-Solar Hybrid Energy System Optimization - Completed\n2. Smart Grid Energy Management - Ongoing\n3. Electric Vehicle Charging Infrastructure - Proposed\n4. Microgrid Design for Rural Electrification - Proposed\n\nTotal Research Funding: Rs. 25,00,000\nPh.D Scholars: 3 (1 awarded, 2 pursuing)\nM.Tech Scholars: 4 (2 completed, 2 ongoing)", creatorId: "1", departmentId: "dept-eee-004", signatures: [] },
        { id: "rpt-008", title: "NAAC Criterion Analysis Report", type: "naac", category: "naac_criterion", academicYear: "2024-25", status: "SUBMITTED", currentLevel: "HOD", content: "NAAC SSR Criterion Analysis\n\nCriterion 1 - Curricular Aspects: 85/100\n- CBCS implemented across all programs\n- 3 new electives introduced\n- Industry-linked curriculum updated\n\nCriterion 2 - Teaching-Learning: 78/100\n- Student-Teacher Ratio: 18:1\n- ICT Usage: 75% classes\n- E-content: 200 modules\n\nCriterion 3 - Research: 52/100\n- Projects Funded: 8\n- Publications: 45\n- Patents: 5\n- Conference Proceedings: 12\n\nCriterion 4 - Infrastructure: 82/100\n- Labs: 15 (all equipped)\n- Library: 25,000+ volumes\n- Smart Classrooms: 10\n- Internet: 200 Mbps\n\nCriterion 5 - Student Support: 76/100\n- Scholarship Coverage: 25%\n- Counseling: Available\n- Placement: 85%\n- Alumni: 5000+ registered\n\nOverall Score: 74.6/100 (Accredited with B++ grade)", creatorId: "1", signatures: [] },
        { id: "rpt-009", title: "Placement Statistics Report 2024-25", type: "department", category: "placement_statistics", academicYear: "2024-25", status: "DRAFT", currentLevel: "STAFF", content: "Placement Statistics 2024-25\n\nTotal Eligible Students: 450\nStudents Placed: 382\nOverall Placement %: 84.9%\n\nDepartment-wise:\n- CSE: 92% (highest)\n- IT: 88%\n- ECE: 82%\n- EEE: 78%\n- MECH: 75%\n- CIVIL: 72%\n\nTop Recruiters:\n1. TCS - 85 students\n2. Infosys - 62 students\n3. Wipro - 45 students\n4. Cognizant - 38 students\n5. Amazon - 12 students\n6. Google - 3 students\n\nSalary Details:\n- Highest Package: Rs. 45 LPA (Google)\n- Average Package: Rs. 4.8 LPA\n- Median Package: Rs. 4.2 LPA\n- Students with 10+ LPA: 28\n\nPre-Placement Offers: 45\nInternship to PPO Conversion: 62%", creatorId: "1", signatures: [] },
        { id: "rpt-010", title: "Target vs Achievement Analysis Q3 2024", type: "department", category: "target_vs_achievement", academicYear: "2024-25", status: "SUBMITTED", currentLevel: "VP", content: "Target vs Achievement Analysis - Q3 (Oct-Dec 2024)\n\nPublications:\n- Target: 50 | Achieved: 10 | Achievement: 20%\n- Status: Below Target - Need acceleration\n\nPatents:\n- Target: 10 | Achieved: 2 | Achievement: 20%\n- Status: On Track (filing takes time)\n\nFunded Projects:\n- Target: 5 | Achieved: 2 | Achievement: 40%\n- Status: Good Progress\n\nConferences:\n- Target: 12 | Achieved: 3 | Achievement: 25%\n- Status: Below Target\n\nWorkshops:\n- Target: 8 | Achieved: 4 | Achievement: 50%\n- Status: On Track\n\nStudent Projects:\n- Target: 30 | Achieved: 15 | Achievement: 50%\n- Status: On Track\n\nOverall Achievement: 34.2%\nRecommended Actions:\n1. Increase research publication incentives\n2. Organize 2 more workshops in Q4\n3. Motivate faculty for patent filings\n4. Plan industry collaboration events", creatorId: "1", signatures: [] },
        { id: "rpt-011", title: "Annual Institutional Report 2024-25", type: "annual", category: "annual_report", academicYear: "2024-25", status: "LOCKED", currentLevel: "LOCKED", content: "JJCET Annual Institutional Report 2024-25\n\nExecutive Summary:\nJJCET has demonstrated consistent improvement across all parameters during the academic year 2024-25.\n\n1. Academic Performance:\n- Total Programs: 6 UG, 6 PG\n- Total Students: 1800+\n- Pass Rate: 87%\n- University Rank Holders: 8\n\n2. Faculty:\n- Total Faculty: 65\n- PhD Holders: 38 (58%)\n- FDP Attended: 25\n- Paper Publications: 45\n\n3. Research:\n- Funded Projects: 8 (Total Rs. 1.2 Cr)\n- Publications: 45\n- Patents: 5\n- Consultancy Revenue: Rs. 8.5 Lakhs\n\n4. Infrastructure:\n- Labs: 15\n- Library: 25000+ volumes\n- Smart Classrooms: 10\n- Wi-Fi Campus: Yes\n\n5. Placements:\n- Overall: 84.9%\n- Highest Package: Rs. 45 LPA\n- Average Package: Rs. 4.8 LPA\n\n6. Accreditation:\n- NAAC: B++ Grade (74.6%)\n- NBA: Applied for 3 programs\n- NIRF Rank: 156\n\n7. Financial Summary:\n- Revenue: Rs. 12.5 Cr\n- Expenditure: Rs. 11.8 Cr\n- Surplus: Rs. 0.7 Cr", creatorId: "1", signatures: [] },
        { id: "rpt-012", title: "Department Comparison Report 2024-25", type: "vp", category: "department_comparison", academicYear: "2024-25", status: "DRAFT", currentLevel: "STAFF", content: "Inter-Department Comparison Report 2024-25\n\nPerformance Matrix:\n\n              Publications | Patents | Research | Events | Placement\nIT:            10          |  2      |  2       |  1     |  88%\nCSE:           8           |  1      |  1       |  2     |  92%\nECE:           5           |  1      |  1       |  1     |  82%\nEEE:           3           |  1      |  1       |  1     |  78%\nMECH:          1           |  0      |  0       |  1     |  75%\nCIVIL:         1           |  0      |  1       |  0     |  72%\n\nRankings:\n1. CSE - Best overall performance\n2. IT - Strong in publications\n3. ECE - Good patent activity\n4. EEE - Strong research funding\n5. MECH - Improving\n6. CIVIL - Needs improvement\n\nRecommendations:\n1. Cross-department research collaboration\n2. Shared lab facilities\n3. Joint workshops and conferences\n4. Mentor program for low-performing departments", creatorId: "3", signatures: [] },
        { id: "rpt-013", title: "AICTE Mandatory Disclosure Report", type: "aicte", category: "aicte_report", academicYear: "2024-25", status: "SUBMITTED", currentLevel: "PRINCIPAL", content: "AICTE Mandatory Disclosure 2024-25\n\n1. Name of the Institution: J.J. College of Engineering & Technology\n2. Address: Trichy-Chennai Highway, Thuraiyur, Tiruchirappalli - 621013\n3. Approved Intake:\n- CSE: 120 | ECE: 60 | IT: 60 | EEE: 60 | MECH: 60 | CIVIL: 60\n4. Actual Admission: 382 out of 420 approved\n5. Faculty Strength: 65 (Sanctioned: 70)\n6. Library Volumes: 25,000+\n7. Lab Equipment Value: Rs. 2.5 Cr\n8. Built-up Area: 45,000 sq.m\n9. playground Area: 5 acres\n10. Total Investment: Rs. 25 Cr\n11. Bank Account: Indian Bank, Thuraiyur\n12. AICTE Fee Structure: As per Tamil Nadu Government norms\n13. Scholarship Details: 25% students on various scholarships\n14. Anti-Ragging Committee: Constituted and active\n15. Grievance Redressal: Committee formed, 15 complaints resolved", creatorId: "1", signatures: [] },
      ];
      setProgress("Seeding reports...");
      for (const r of reports) {
        await setDoc(doc(db, "reports", r.id), { ...r, createdAt: now, updatedAt: now });
        count++;
      }
      collectionsUsed.push("reports");

      const approvals = [
        { id: "apr-001", reportId: "rpt-001", userId: "5", level: "STAFF", status: "APPROVED", comment: "Report prepared and submitted", createdAt: now, approvedAt: now },
        { id: "apr-002", reportId: "rpt-001", userId: "4", level: "HOD", status: "PENDING", comment: "", createdAt: now },
        { id: "apr-003", reportId: "rpt-003", userId: "1", level: "STAFF", status: "APPROVED", comment: "NIRF data compiled", createdAt: now, approvedAt: now },
        { id: "apr-004", reportId: "rpt-003", userId: "4", level: "HOD", status: "APPROVED", comment: "Verified", createdAt: now, approvedAt: now },
        { id: "apr-005", reportId: "rpt-003", userId: "3", level: "VP", status: "APPROVED", comment: "Reviewed", createdAt: now, approvedAt: now },
        { id: "apr-006", reportId: "rpt-003", userId: "2", level: "PRINCIPAL", status: "APPROVED", comment: "Approved and locked", createdAt: now, approvedAt: now },
        { id: "apr-007", reportId: "rpt-004", userId: "5", level: "STAFF", status: "APPROVED", comment: "Monthly report submitted", createdAt: now, approvedAt: now },
        { id: "apr-008", reportId: "rpt-004", userId: "3", level: "VP", status: "PENDING", comment: "", createdAt: now },
        { id: "apr-009", reportId: "rpt-006", userId: "1", level: "STAFF", status: "APPROVED", comment: "Patent data compiled", createdAt: now, approvedAt: now },
        { id: "apr-010", reportId: "rpt-006", userId: "4", level: "HOD", status: "APPROVED", comment: "Verified", createdAt: now, approvedAt: now },
        { id: "apr-011", reportId: "rpt-006", userId: "2", level: "PRINCIPAL", status: "PENDING", comment: "", createdAt: now },
        { id: "apr-012", reportId: "rpt-010", userId: "1", level: "STAFF", status: "APPROVED", comment: "Q3 analysis done", createdAt: now, approvedAt: now },
        { id: "apr-013", reportId: "rpt-010", userId: "3", level: "VP", status: "PENDING", comment: "", createdAt: now },
        { id: "apr-014", reportId: "rpt-013", userId: "1", level: "STAFF", status: "APPROVED", comment: "AICTE data compiled", createdAt: now, approvedAt: now },
        { id: "apr-015", reportId: "rpt-013", userId: "2", level: "PRINCIPAL", status: "PENDING", comment: "", createdAt: now },
      ];
      setProgress("Seeding approvals...");
      for (const a of approvals) {
        await setDoc(doc(db, "approvals", a.id), { ...a, createdAt: now });
        count++;
      }
      collectionsUsed.push("approvals");

      const signatures = [
        { id: "sig-001", userId: "1", name: "Admin User", designation: "Super Administrator", signatureImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", createdAt: now },
        { id: "sig-002", userId: "4", name: "HOD IT", designation: "Head of Department - IT", signatureImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==", createdAt: now },
        { id: "sig-003", userId: "2", name: "Principal", designation: "Principal - JJCET", signatureImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==", createdAt: now },
      ];
      setProgress("Seeding signatures...");
      for (const s of signatures) {
        await setDoc(doc(db, "signatures", s.id), { ...s, createdAt: now });
        count++;
      }
      collectionsUsed.push("signatures");

      const notifications = [
        { id: "not-001", title: "Report Approved", message: "Your IT Department Annual Report has been approved by the HOD.", type: "success", read: false, userId: "1" },
        { id: "not-002", title: "New Approval Pending", message: "A new report is awaiting your review and approval.", type: "info", read: false, userId: "2" },
        { id: "not-003", title: "Deadline Reminder", message: "NIRF data submission deadline is approaching.", type: "warning", read: false, userId: "1" },
      ];
      setProgress("Seeding notifications...");
      for (const n of notifications) {
        await setDoc(doc(db, "notifications", n.id), { ...n, createdAt: now, updatedAt: now });
        count++;
      }
      collectionsUsed.push("notifications");

      const settings = {
        collegeName: "J.J. College of Engineering & Technology",
        collegeCode: "JJCET",
        address: "Trichy - Chennai Highway, Thuraiyur, Tiruchirappalli, Tamil Nadu 621013",
        phone: "+91 431 2550000",
        email: "info@jjcet.ac.in",
        website: "https://jjcet.ac.in",
        academicYear: "2024-25",
        currentSemester: "Even",
      };
      setProgress("Seeding settings...");
      await setDoc(doc(db, "settings", "global"), { ...settings, createdAt: now, updatedAt: now });
      count++;
      collectionsUsed.push("settings");

      setResult({ count, collections: collectionsUsed });
      setProgress("Done!");
    } catch (e: any) {
      setError(e.message || "Failed to seed database");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Seed Firestore Database</CardTitle>
          <p className="text-sm text-muted-foreground">Populate Firebase Firestore with JJCET sample data</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
            <p className="font-medium">This will create:</p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>6 Departments</li>
              <li>12 Faculties</li>
              <li>10 Publications</li>
              <li>5 Patents</li>
              <li>6 Research Projects</li>
              <li>8 Students</li>
              <li>6 Events</li>
              <li>6 Targets</li>
              <li>13 Reports (all statuses & types)</li>
              <li>15 Approvals (workflow chain)</li>
              <li>3 Signatures</li>
              <li>3 Notifications</li>
              <li>Settings</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">Writes directly to Firestore using the client SDK. Make sure Firestore rules allow write access.</p>
          {progress && <p className="text-sm text-blue-600">{progress}</p>}
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          {result && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm space-y-2">
              <div className="flex items-center gap-2 font-medium"><CheckCircle className="h-4 w-4 shrink-0" />Database seeded successfully!</div>
              <p>Created <strong>{result.count}</strong> documents across <strong>{result.collections.length}</strong> collections.</p>
              <p className="font-medium">Collections: {result.collections.join(", ")}</p>
              <a href="/dashboard" className="inline-block mt-2 text-blue-600 underline font-medium">Go to Dashboard →</a>
            </div>
          )}
          <Button onClick={seedDatabase} disabled={loading} className="w-full" size="lg">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Seeding... ({progress})</> : "Seed Database Now"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
