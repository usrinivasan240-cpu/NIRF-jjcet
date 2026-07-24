import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "nirf-jjcet-secret-2024";
const PROJECT_ID = "jjcet-nirf-cdefd";

function authUser(req: NextRequest): any | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { const jwt = require("jsonwebtoken"); return jwt.verify(h.split(" ")[1], JWT_SECRET) as any; } catch { return null; }
}

let _admin: any;
let _db: any;
async function getDb() {
  if (_db) return _db;
  if (!_admin) _admin = await import("firebase-admin");
  const admin = _admin.default || _admin;
  if (admin.apps.length === 0) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (key) {
      const sa = JSON.parse(key);
      admin.initializeApp({ credential: admin.credential.cert(sa), projectId: PROJECT_ID });
    } else {
      admin.initializeApp({ projectId: PROJECT_ID });
    }
  }
  _db = admin.firestore();
  return _db;
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = authUser(req);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Super Admin only" }, { status: 401 });
  }
  try {
    const d = await getDb();
    const now = new Date().toISOString();
    let count = 0;

    const departments = [
      { id: "dept-it-001", name: "Information Technology", code: "IT", description: "Department of Information Technology" },
      { id: "dept-cse-002", name: "Computer Science & Engineering", code: "CSE", description: "Department of Computer Science & Engineering" },
      { id: "dept-ece-003", name: "Electronics & Communication Engineering", code: "ECE", description: "Department of Electronics & Communication Engineering" },
      { id: "dept-eee-004", name: "Electrical & Electronics Engineering", code: "EEE", description: "Department of Electrical & Electronics Engineering" },
      { id: "dept-mech-005", name: "Mechanical Engineering", code: "MECH", description: "Department of Mechanical Engineering" },
      { id: "dept-civil-006", name: "Civil Engineering", code: "CIVIL", description: "Department of Civil Engineering" },
    ];

    const batch1 = d.batch();
    for (const dept of departments) {
      batch1.set(d.collection("departments").doc(dept.id), { ...dept, createdAt: now, updatedAt: now });
      count++;
    }
    await batch1.commit();

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

    const batch2 = d.batch();
    for (const fac of faculties) {
      batch2.set(d.collection("faculties").doc(fac.id), { ...fac, createdAt: now, updatedAt: now });
      count++;
    }
    await batch2.commit();

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

    const batch3 = d.batch();
    for (const pub of publications) {
      batch3.set(d.collection("publications").doc(pub.id), { ...pub, createdAt: now, updatedAt: now });
      count++;
    }
    await batch3.commit();

    const patents = [
      { id: "pat-001", title: "Smart Water Quality Monitoring Device Using IoT", patentNumber: "IN202411001234", country: "India", status: "granted", isGranted: true, filingDate: "2023-06-15", grantDate: "2024-08-20", inventors: "Dr. R. Shanmugam, Mr. S. Karthik", departmentId: "dept-it-001", facultyId: "fac-001" },
      { id: "pat-002", title: "Energy Efficient Routing for WSN", patentNumber: "IN202411005678", country: "India", status: "filed", isGranted: false, filingDate: "2024-01-10", grantDate: "", inventors: "Dr. K. Priya, Ms. A. Divya", departmentId: "dept-it-001", facultyId: "fac-002" },
      { id: "pat-003", title: "Blockchain Document Verification", patentNumber: "IN202411009012", country: "India", status: "published", isGranted: false, filingDate: "2024-03-20", grantDate: "", inventors: "Dr. M. Rajesh, Mr. V. Mohan", departmentId: "dept-cse-002", facultyId: "fac-005" },
      { id: "pat-004", title: "Smart Traffic Signal Using Computer Vision", patentNumber: "US20240012345", country: "USA", status: "filed", isGranted: false, filingDate: "2024-02-15", grantDate: "", inventors: "Dr. L. Kamala, Mr. B. Suresh", departmentId: "dept-ece-003", facultyId: "fac-008" },
      { id: "pat-005", title: "Solar-Powered Automated Irrigation System", patentNumber: "IN202411003456", country: "India", status: "granted", isGranted: true, filingDate: "2023-08-10", grantDate: "2024-05-15", inventors: "Dr. N. Meena", departmentId: "dept-eee-004", facultyId: "fac-010" },
    ];

    const batch4 = d.batch();
    for (const pat of patents) {
      batch4.set(d.collection("patents").doc(pat.id), { ...pat, createdAt: now, updatedAt: now });
      count++;
    }
    await batch4.commit();

    const research = [
      { id: "res-001", title: "AI-Driven Predictive Analytics for Student Performance", pi: "Dr. R. Shanmugam", coPi: "Mr. S. Karthik", fundingAgency: "AICTE", amount: "1500000", status: "ongoing", startDate: "2024-01-15", endDate: "2025-06-30", sanctionedYear: "2024", departmentId: "dept-it-001", facultyId: "fac-001" },
      { id: "res-002", title: "Secure Fog Computing for Healthcare", pi: "Dr. K. Priya", coPi: "Ms. A. Divya", fundingAgency: "DST", amount: "2000000", status: "ongoing", startDate: "2023-07-01", endDate: "2025-12-31", sanctionedYear: "2023", departmentId: "dept-it-001", facultyId: "fac-002" },
      { id: "res-003", title: "Smart Campus IoT Infrastructure", pi: "Dr. M. Rajesh", coPi: "Dr. P. Swathi", fundingAgency: "TNSCST", amount: "800000", status: "completed", startDate: "2022-04-01", endDate: "2024-03-31", sanctionedYear: "2022", departmentId: "dept-cse-002", facultyId: "fac-005" },
      { id: "res-004", title: "5G Testbed for Rural Connectivity", pi: "Dr. L. Kamala", coPi: "Mr. B. Suresh", fundingAgency: "DIT", amount: "3500000", status: "ongoing", startDate: "2024-04-01", endDate: "2026-03-31", sanctionedYear: "2024", departmentId: "dept-ece-003", facultyId: "fac-008" },
      { id: "res-005", title: "Wind-Solar Hybrid Energy Optimization", pi: "Dr. N. Meena", coPi: "", fundingAgency: "MNRE", amount: "2500000", status: "completed", startDate: "2021-10-01", endDate: "2023-09-30", sanctionedYear: "2021", departmentId: "dept-eee-004", facultyId: "fac-010" },
      { id: "res-006", title: "Seismic Analysis with Base Isolation", pi: "Dr. T. Saranya", coPi: "", fundingAgency: "AICTE", amount: "1200000", status: "ongoing", startDate: "2023-08-01", endDate: "2025-07-31", sanctionedYear: "2023", departmentId: "dept-civil-006", facultyId: "fac-012" },
    ];

    const batch5 = d.batch();
    for (const res of research) {
      batch5.set(d.collection("research").doc(res.id), { ...res, createdAt: now, updatedAt: now });
      count++;
    }
    await batch5.commit();

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

    const batch6 = d.batch();
    for (const stu of students) {
      batch6.set(d.collection("students").doc(stu.id), { ...stu, createdAt: now, updatedAt: now });
      count++;
    }
    await batch6.commit();

    const events = [
      { id: "evt-001", title: "National Conference on AI & ML", type: "conference", date: "2024-11-15", endDate: "2024-11-16", venue: "JJCET Auditorium", participants: "150", organizer: "Dept of IT", status: "completed", departmentId: "dept-it-001" },
      { id: "evt-002", title: "Workshop on Cloud Computing with AWS", type: "workshop", date: "2024-09-20", endDate: "2024-09-21", venue: "IT Lab 1", participants: "60", organizer: "Dept of CSE", status: "completed", departmentId: "dept-cse-002" },
      { id: "evt-003", title: "Technical Symposium ELEXTRA 2024", type: "symposium", date: "2024-10-05", endDate: "2024-10-05", venue: "ECE Seminar Hall", participants: "200", organizer: "Dept of ECE", status: "completed", departmentId: "dept-ece-003" },
      { id: "evt-004", title: "FDP on IoT and Edge Computing", type: "workshop", date: "2024-12-10", endDate: "2024-12-14", venue: "CSE Lab 3", participants: "40", organizer: "Dept of CSE", status: "completed", departmentId: "dept-cse-002" },
      { id: "evt-005", title: "Industry-Academia Conclave 2024", type: "conference", date: "2025-01-20", endDate: "2025-01-20", venue: "Main Auditorium", participants: "300", organizer: "JJCET", status: "upcoming", departmentId: "dept-it-001" },
      { id: "evt-006", title: "Robotics Workshop", type: "workshop", date: "2024-08-15", endDate: "2024-08-16", venue: "Mech Workshop", participants: "50", organizer: "Dept of MECH", status: "completed", departmentId: "dept-mech-005" },
    ];

    const batch7 = d.batch();
    for (const evt of events) {
      batch7.set(d.collection("events").doc(evt.id), { ...evt, createdAt: now, updatedAt: now });
      count++;
    }
    await batch7.commit();

    const targets = [
      { id: "tgt-001", category: "Publications", yearly: 50, achieved: 10, year: "2024-25", departmentId: "dept-it-001" },
      { id: "tgt-002", category: "Patents", yearly: 10, achieved: 2, year: "2024-25", departmentId: "dept-it-001" },
      { id: "tgt-003", category: "Funded Projects", yearly: 5, achieved: 2, year: "2024-25", departmentId: "dept-cse-002" },
      { id: "tgt-004", category: "Conferences", yearly: 12, achieved: 3, year: "2024-25", departmentId: "dept-ece-003" },
      { id: "tgt-005", category: "Workshops", yearly: 8, achieved: 4, year: "2024-25", departmentId: "dept-eee-004" },
      { id: "tgt-006", category: "Publications", yearly: 40, achieved: 8, year: "2024-25", departmentId: "dept-cse-002" },
    ];

    const batch8 = d.batch();
    for (const tgt of targets) {
      batch8.set(d.collection("targets").doc(tgt.id), { ...tgt, createdAt: now, updatedAt: now });
      count++;
    }
    await batch8.commit();

    const reports = [
      { id: "rpt-001", title: "IT Department Annual Report 2024-25", type: "department", category: "annual_report", academicYear: "2024-25", status: "SUBMITTED", currentLevel: "HOD", content: "Annual report covering publications, patents, research projects, and student achievements for the IT department.", creatorId: "1" },
      { id: "rpt-002", title: "CSE Semester Report - Even Sem 2024", type: "semester", category: "semester_summary", academicYear: "2024-25", status: "DRAFT", currentLevel: "STAFF", content: "Semester performance summary for CSE department including faculty load and student performance.", creatorId: "1" },
      { id: "rpt-003", title: "NIRF Submission Report 2025", type: "nirf", category: "nirf_report", academicYear: "2024-25", status: "LOCKED", currentLevel: "LOCKED", content: "Complete NIRF submission report with all parameters including TLR, RPC, GO, EI, and PR.", creatorId: "1" },
    ];

    const batch9 = d.batch();
    for (const rpt of reports) {
      batch9.set(d.collection("reports").doc(rpt.id), { ...rpt, createdAt: now, updatedAt: now });
      count++;
    }
    await batch9.commit();

    const notifications = [
      { id: "not-001", title: "Report Approved", message: "Your IT Department Annual Report has been approved by the HOD.", type: "success", read: false, userId: "1" },
      { id: "not-002", title: "New Approval Pending", message: "A new report is awaiting your review and approval.", type: "info", read: false, userId: "2" },
      { id: "not-003", title: "Deadline Reminder", message: "NIRF data submission deadline is approaching. Please complete all pending entries.", type: "warning", read: false, userId: "1" },
    ];

    const batch10 = d.batch();
    for (const not of notifications) {
      batch10.set(d.collection("notifications").doc(not.id), { ...not, createdAt: now, updatedAt: now });
      count++;
    }
    await batch10.commit();

    return NextResponse.json({ success: true, data: { message: "Database seeded successfully", count, collections: ["departments", "faculties", "publications", "patents", "research", "students", "events", "targets", "reports", "notifications"] } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
