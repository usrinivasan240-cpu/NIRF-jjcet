import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "nirf-jwt-secret-key-2024";
const PROJECT_ID = "jjcet-nirf-cdefd";

let db: admin.firestore.Firestore;

function getDb(): admin.firestore.Firestore {
  if (db) return db;
  if (admin.apps.length === 0) {
    try {
      const key = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (key) {
        const sa = JSON.parse(key);
        admin.initializeApp({ credential: admin.credential.cert(sa), projectId: PROJECT_ID });
      } else {
        admin.initializeApp({ projectId: PROJECT_ID });
      }
    } catch {
      admin.initializeApp({ projectId: PROJECT_ID });
    }
  }
  db = admin.firestore();
  return db;
}

const mockUsers = [
  { id: "1", email: "admin@jjcet.edu", password: "admin123", name: "Admin User", role: "SUPER_ADMIN", departmentId: null },
  { id: "2", email: "principal@jjcet.edu", password: "principal123", name: "Principal", role: "PRINCIPAL", departmentId: null },
  { id: "3", email: "vp@jjcet.edu", password: "vp123", name: "Vice Principal", role: "VICE_PRINCIPAL", departmentId: null },
  { id: "4", email: "hod@jjcet.edu", password: "hod123", name: "HOD IT", role: "HOD", departmentId: "dept-it-001" },
  { id: "5", email: "staff@jjcet.edu", password: "staff123", name: "Staff IT", role: "DEPARTMENT_STAFF", departmentId: "dept-it-001" },
];

function authUser(req: NextRequest): any | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { return jwt.verify(h.split(" ")[1], JWT_SECRET) as any; } catch { return null; }
}

function deptScope(user: any): string | null {
  if (["SUPER_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"].includes(user.role)) return null;
  return user.departmentId || null;
}

const REPORT_TEMPLATES: Record<string, string[]> = {
  staff: ["publications", "patents", "research", "events", "monthly_progress", "semester_progress", "annual_performance", "target_achievement", "pending_activities"],
  department: ["complete_report", "faculty_performance", "department_publications", "department_patents", "department_research", "student_achievements", "placement_statistics", "target_vs_achievement", "monthly_report", "semester_report", "annual_report"],
  vp: ["department_comparison", "pending_approval", "faculty_summary", "research_summary", "publication_summary", "patent_summary", "placement_summary", "target_analysis", "institutional_progress", "monthly_institutional", "annual_institutional"],
  principal: ["annual_report", "nirf_report", "naac_report", "nba_report", "iqac_report", "aicte_report", "ugc_report", "governing_council", "management_report", "accreditation_evidence"],
};

const APPROVAL_LEVELS = ["STAFF", "HOD", "VP", "PRINCIPAL", "LOCKED"];

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) { return handleRoute(req, params.path, "GET"); }
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) { return handleRoute(req, params.path, "POST"); }
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) { return handleRoute(req, params.path, "PUT"); }
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) { return handleRoute(req, params.path, "DELETE"); }

async function handleRoute(req: NextRequest, path: string[], method: string): Promise<NextResponse> {
  try {
    const col = path[0]; const id = path[1]; const action = path[2];

    if (col === "health") return NextResponse.json({ status: "ok" });
    if (col === "auth") return await handleAuth(req, id, method);
    if (col === "analytics") return await handleAnalytics(id, method);

    const user = authUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const scope = deptScope(user);

    switch (col) {
      case "departments": return await handleCrud("departments", req, id, method, scope, true);
      case "faculties": return await handleCrud("faculties", req, id, method, scope, true);
      case "students": return await handleCrud("students", req, id, method, scope, true);
      case "publications": return await handleCrud("publications", req, id, method, scope, true);
      case "patents": return await handleCrud("patents", req, id, method, scope, true);
      case "research": return await handleCrud("research", req, id, method, scope, true);
      case "events": return await handleCrud("events", req, id, method, scope, true);
      case "targets": return await handleCrud("targets", req, id, method, scope, true);
      case "notifications": return await handleCrud("notifications", req, id, method, scope, false);
      case "documents": return await handleCrud("documents", req, id, method, scope, true);
      case "signatures": return await handleCrud("signatures", req, id, method, scope, false);
      case "reports": return await handleReports(req, id, action, method, user, scope);
      case "approvals": return await handleApprovals(req, id, action, method, user);
      case "users": return await handleUsers(req, id, method, scope);
      default: return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

async function handleAuth(req: NextRequest, action: string | undefined, method: string) {
  const d = getDb();
  if (action === "login" && method === "POST") {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    const mu = mockUsers.find(u => u.email === email && u.password === password);
    if (mu) {
      const token = jwt.sign({ id: mu.id, email: mu.email, role: mu.role, departmentId: mu.departmentId }, JWT_SECRET, { expiresIn: "24h" });
      return NextResponse.json({ success: true, data: { token, user: { id: mu.id, email: mu.email, name: mu.name, role: mu.role, departmentId: mu.departmentId } } });
    }
    try {
      const snap = await d.collection("users").where("email", "==", email).where("password", "==", password).limit(1).get();
      if (snap.empty) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      const u = snap.docs[0].data();
      const token = jwt.sign({ id: snap.docs[0].id, email: u.email, role: u.role, departmentId: u.departmentId || null }, JWT_SECRET, { expiresIn: "24h" });
      return NextResponse.json({ success: true, data: { token, user: { id: snap.docs[0].id, email: u.email, name: u.name, role: u.role, departmentId: u.departmentId } } });
    } catch { return NextResponse.json({ error: "Invalid credentials" }, { status: 401 }); }
  }
  if (action === "profile" && method === "GET") {
    const user = authUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const mu = mockUsers.find(u => u.id === user.id);
    if (mu) return NextResponse.json({ id: mu.id, email: mu.email, name: mu.name, role: mu.role, departmentId: mu.departmentId });
    const doc = await d.collection("users").doc(user.id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const u = doc.data()!;
    return NextResponse.json({ id: doc.id, email: u.email, name: u.name, role: u.role, departmentId: u.departmentId });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function handleAnalytics(action: string | undefined, _method: string) {
  const d = getDb();
  if (action === "dashboard") {
    const [fac, stu, dep, pub, pat, evt] = await Promise.all([
      d.collection("faculties").get(), d.collection("students").get(), d.collection("departments").get(),
      d.collection("publications").get(), d.collection("patents").get(), d.collection("events").get(),
    ]);
    return NextResponse.json({ totalFaculties: fac.size, totalStudents: stu.size, totalDepartments: dep.size, totalPublications: pub.size, totalPatents: pat.size, totalEvents: evt.size });
  }
  if (action === "department") {
    const depSnap = await d.collection("departments").get();
    const depts = await Promise.all(depSnap.docs.map(async (dd) => {
      const [f, s] = await Promise.all([d.collection("faculties").where("departmentId", "==", dd.id).get(), d.collection("students").where("departmentId", "==", dd.id).get()]);
      return { id: dd.id, ...dd.data(), facultyCount: f.size, studentCount: s.size };
    }));
    return NextResponse.json(depts);
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function handleCrud(col: string, req: NextRequest, id: string | undefined, method: string, scope: string | null, enrich: boolean) {
  const d = getDb();
  if (method === "GET" && !id) {
    let q: any = d.collection(col);
    if (scope) {
      if (["publications", "patents", "research"].includes(col)) {
        const fs = await d.collection("faculties").where("departmentId", "==", scope).get();
        const ids = fs.docs.map((dd: any) => dd.id);
        if (!ids.length) return NextResponse.json([]);
        q = q.where("facultyId", "in", ids);
      } else if (!["signatures", "notifications"].includes(col)) {
        q = q.where("departmentId", "==", scope);
      }
    }
    const snap = await q.get();
    let items = snap.docs.map((dd: any) => ({ id: dd.id, ...dd.data() }));
    if (enrich) items = await Promise.all(items.map(i => enrichItem(col, i)));
    return NextResponse.json(items);
  }
  if (method === "GET" && id) {
    const doc = await d.collection(col).doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    let item: any = { id: doc.id, ...doc.data() };
    if (enrich) item = await enrichItem(col, item);
    return NextResponse.json(item);
  }
  if (method === "POST") {
    const body = await req.json();
    const nid = uuid();
    const data = { ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await d.collection(col).doc(nid).set(data);
    return NextResponse.json({ id: nid, ...data }, { status: 201 });
  }
  if (method === "PUT" && id) {
    const body = await req.json();
    const ud = { ...body, updatedAt: new Date().toISOString() };
    delete ud.id; delete ud.createdAt;
    await d.collection(col).doc(id).update(ud);
    const doc = await d.collection(col).doc(id).get();
    return NextResponse.json({ id, ...doc.data() });
  }
  if (method === "DELETE" && id) {
    await d.collection(col).doc(id).delete();
    return NextResponse.json({ message: "Deleted" });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function enrichItem(col: string, item: any) {
  const d = getDb();
  const r = { ...item };
  if (r.departmentId && !["publications", "patents", "research"].includes(col)) {
    const dd = await d.collection("departments").doc(r.departmentId).get();
    r.department = dd.exists ? { id: dd.id, ...dd.data() } : null;
  }
  if (r.facultyId) {
    const fd = await d.collection("faculties").doc(r.facultyId).get();
    if (fd.exists) { const f = fd.data()!; const dd = await d.collection("departments").doc(f.departmentId).get(); r.faculty = { ...f, id: fd.id, department: dd.exists ? { id: dd.id, ...dd.data() } : null }; }
  }
  if (r.creatorId) {
    const cd = await d.collection("users").doc(r.creatorId).get();
    if (cd.exists) { const u = cd.data()!; r.creator = { id: cd.id, name: u.name, email: u.email, role: u.role }; }
  }
  if (r.userId && col === "approvals") {
    const ud = await d.collection("users").doc(r.userId).get();
    if (ud.exists) { const u = ud.data()!; r.approver = { id: ud.id, name: u.name, email: u.email, role: u.role }; }
  }
  return r;
}

async function handleReports(req: NextRequest, id: string | undefined, action: string | undefined, method: string, user: any, scope: string | null) {
  const d = getDb();
  if (action === "templates") return NextResponse.json(REPORT_TEMPLATES);
  if (method === "GET" && !id) {
    let q: any = d.collection("reports");
    if (scope) q = q.where("departmentId", "==", scope);
    const snap = await q.orderBy("createdAt", "desc").get();
    const items = await Promise.all(snap.docs.map(async (dd: any) => enrichItem("reports", { id: dd.id, ...dd.data() })));
    return NextResponse.json(items);
  }
  if (method === "GET" && id) {
    const doc = await d.collection("reports").doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const r = await enrichItem("reports", { id: doc.id, ...doc.data() });
    const [as, ss] = await Promise.all([d.collection("approvals").where("reportId", "==", id).get(), d.collection("signatures").where("reportId", "==", id).get()]);
    r.approvals = as.docs.map((dd: any) => ({ id: dd.id, ...dd.data() }));
    r.signatures = ss.docs.map((dd: any) => ({ id: dd.id, ...dd.data() }));
    return NextResponse.json(r);
  }
  if (method === "POST" && action === "generate") {
    const body = await req.json();
    const nid = uuid();
    const data = { ...body, status: "DRAFT", creatorId: user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await d.collection("reports").doc(nid).set(data);
    return NextResponse.json({ id: nid, ...data }, { status: 201 });
  }
  if (method === "PUT" && id && !action) {
    const doc = await d.collection("reports").doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (doc.data()?.status === "LOCKED") return NextResponse.json({ error: "Locked" }, { status: 400 });
    const body = await req.json();
    const ud = { ...body, updatedAt: new Date().toISOString() };
    delete ud.id; delete ud.createdAt; delete ud.status;
    await d.collection("reports").doc(id).update(ud);
    return NextResponse.json({ id, ...doc.data(), ...ud });
  }
  if (method === "DELETE" && id) {
    const doc = await d.collection("reports").doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (doc.data()?.status === "LOCKED") return NextResponse.json({ error: "Locked" }, { status: 400 });
    await d.collection("reports").doc(id).delete();
    return NextResponse.json({ message: "Deleted" });
  }
  if (method === "POST" && action === "submit" && id) {
    const doc = await d.collection("reports").doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (doc.data()?.status !== "DRAFT") return NextResponse.json({ error: "Only DRAFT" }, { status: 400 });
    await d.collection("reports").doc(id).update({ status: "SUBMITTED", submittedAt: new Date().toISOString() });
    return NextResponse.json({ message: "Submitted" });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function handleApprovals(req: NextRequest, id: string | undefined, action: string | undefined, method: string, user: any) {
  const d = getDb();
  if (method === "GET" && !id) {
    let q: any = d.collection("approvals");
    if (user.role === "HOD") q = q.where("level", "==", "HOD").where("status", "==", "PENDING");
    else if (user.role === "VICE_PRINCIPAL") q = q.where("level", "==", "VP").where("status", "==", "PENDING");
    else if (user.role === "PRINCIPAL") q = q.where("level", "==", "PRINCIPAL").where("status", "==", "PENDING");
    else if (user.role !== "SUPER_ADMIN") q = q.where("userId", "==", user.id);
    const snap = await q.get();
    const items = await Promise.all(snap.docs.map(async (dd: any) => enrichItem("approvals", { id: dd.id, ...dd.data() })));
    return NextResponse.json(items);
  }
  if (method === "POST" && !id) {
    const { reportId, level, comment } = await req.json();
    const nid = uuid();
    await d.collection("approvals").doc(nid).set({ reportId, userId: user.id, level, status: "PENDING", comment, createdAt: new Date().toISOString() });
    return NextResponse.json({ id: nid, reportId, level, status: "PENDING" }, { status: 201 });
  }
  if (method === "PUT" && id && action === "approve") {
    const doc = await d.collection("approvals").doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const a = doc.data()!;
    const { comment } = await req.json().catch(() => ({ comment: "" }));
    await d.collection("approvals").doc(id).update({ status: "APPROVED", comment, approvedAt: new Date().toISOString() });
    const li = APPROVAL_LEVELS.indexOf(a.level);
    if (li + 1 < APPROVAL_LEVELS.length) {
      const next = APPROVAL_LEVELS[li + 1];
      if (next === "LOCKED") await d.collection("reports").doc(a.reportId).update({ status: "LOCKED" });
      else await d.collection("approvals").doc(uuid()).set({ reportId: a.reportId, userId: user.id, level: next, status: "PENDING", comment: `Auto after ${a.level}`, createdAt: new Date().toISOString() });
    }
    return NextResponse.json({ message: "Approved" });
  }
  if (method === "PUT" && id && action === "reject") {
    const doc = await d.collection("approvals").doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const a = doc.data()!;
    const { comment } = await req.json().catch(() => ({ comment: "" }));
    await d.collection("approvals").doc(id).update({ status: "REJECTED", comment });
    await d.collection("reports").doc(a.reportId).update({ status: "DRAFT" });
    return NextResponse.json({ message: "Rejected" });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function handleUsers(req: NextRequest, id: string | undefined, method: string, scope: string | null) {
  const d = getDb();
  if (method === "GET" && !id) {
    let q: any = d.collection("users");
    if (scope) q = q.where("departmentId", "==", scope);
    const snap = await q.get();
    return NextResponse.json(snap.docs.map((dd: any) => { const { password, ...rest } = dd.data(); return { id: dd.id, ...rest }; }));
  }
  if (method === "POST" && !id) {
    const { email, password, name, role, departmentId } = await req.json();
    const hash = await bcrypt.hash(password, 10);
    const nid = uuid();
    await d.collection("users").doc(nid).set({ email, password: hash, name, role, departmentId: departmentId || null, createdAt: new Date().toISOString() });
    return NextResponse.json({ id: nid, email, name, role }, { status: 201 });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
