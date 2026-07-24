import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { initFirebase, getDb } from "../src/lib/backend/config/firebase";
import { authenticate, enforceDepartmentScope, generateToken } from "../src/lib/backend/middleware/auth";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

let db: ReturnType<typeof getDb>;
let app: express.Express;

function getApp(): express.Express {
  if (app) return app;

  initFirebase();
  db = getDb();

  app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: "*", credentials: true }));
  app.use(morgan("dev"));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.get("/api/health", (_req, res) => { res.json({ status: "ok", timestamp: new Date().toISOString() }); });

  // Auth
  const JWT_SECRET = process.env.JWT_SECRET || "nirf-jwt-secret-key-2024";
  const mockUsers = [
    { id: "1", email: "admin@jjcet.edu", password: "admin123", name: "Admin User", role: "SUPER_ADMIN" as const, departmentId: null },
    { id: "2", email: "principal@jjcet.edu", password: "principal123", name: "Principal", role: "PRINCIPAL" as const, departmentId: null },
    { id: "3", email: "vp@jjcet.edu", password: "vp123", name: "Vice Principal", role: "VICE_PRINCIPAL" as const, departmentId: null },
    { id: "4", email: "hod@jjcet.edu", password: "hod123", name: "HOD IT", role: "HOD" as const, departmentId: "dept-it-001" },
    { id: "5", email: "staff@jjcet.edu", password: "staff123", name: "Staff IT", role: "DEPARTMENT_STAFF" as const, departmentId: "dept-it-001" },
  ];

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) { res.status(400).json({ error: "Email and password are required" }); return; }
      const mockUser = mockUsers.find((u) => u.email === email && u.password === password);
      if (mockUser) {
        const token = jwt.sign({ id: mockUser.id, email: mockUser.email, role: mockUser.role, departmentId: mockUser.departmentId }, JWT_SECRET, { expiresIn: "24h" });
        res.json({ success: true, message: "Login successful", data: { token, user: { id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role, departmentId: mockUser.departmentId } } });
        return;
      }
      const snapshot = await db.collection("users").where("email", "==", email).where("password", "==", password).limit(1).get();
      if (snapshot.empty) { res.status(401).json({ error: "Invalid email or password" }); return; }
      const firestoreUser = snapshot.docs[0].data();
      const token = jwt.sign({ id: snapshot.docs[0].id, email: firestoreUser.email, role: firestoreUser.role, departmentId: firestoreUser.departmentId || null }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ success: true, message: "Login successful", data: { token, user: { id: snapshot.docs[0].id, email: firestoreUser.email, name: firestoreUser.name, role: firestoreUser.role, departmentId: firestoreUser.departmentId || null } } });
    } catch (error) { res.status(500).json({ error: "Login failed" }); }
  });

  app.get("/api/auth/profile", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "No token provided" }); return; }
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const mockUser = mockUsers.find((u) => u.id === decoded.id);
      if (mockUser) { res.json({ id: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role, departmentId: mockUser.departmentId }); return; }
      const doc = await db.collection("users").doc(decoded.id).get();
      if (!doc.exists) { res.status(404).json({ error: "User not found" }); return; }
      const u = doc.data()!;
      res.json({ id: doc.id, email: u.email, name: u.name, role: u.role, departmentId: u.departmentId || null });
    } catch (error) { res.status(401).json({ error: "Invalid token" }); }
  });

  // Departments
  app.get("/api/departments", authenticate, enforceDepartmentScope, async (_req, res) => {
    try {
      const snapshot = await db.collection("departments").orderBy("name", "asc").get();
      res.json(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    } catch (error) { res.status(500).json({ error: "Failed to fetch departments" }); }
  });

  app.get("/api/departments/:id", authenticate, enforceDepartmentScope, async (req, res) => {
    try {
      const doc = await db.collection("departments").doc(req.params.id).get();
      if (!doc.exists) { res.status(404).json({ error: "Department not found" }); return; }
      const dept = { id: doc.id, ...doc.data() } as any;
      const facSnap = await db.collection("faculties").where("departmentId", "==", dept.id).get();
      dept.faculties = facSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      const stuSnap = await db.collection("students").where("departmentId", "==", dept.id).get();
      dept.students = stuSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      res.json(dept);
    } catch (error) { res.status(500).json({ error: "Failed to fetch department" }); }
  });

  app.post("/api/departments", authenticate, enforceDepartmentScope, async (req, res) => {
    try {
      const { name, code, description, headId } = req.body;
      if (!name || !code) { res.status(400).json({ error: "Name and code are required" }); return; }
      const id = uuid();
      const data = { name, code, description, headId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await db.collection("departments").doc(id).set(data);
      res.status(201).json({ id, ...data });
    } catch (error) { res.status(500).json({ error: "Failed to create department" }); }
  });

  app.put("/api/departments/:id", authenticate, enforceDepartmentScope, async (req, res) => {
    try {
      const docRef = db.collection("departments").doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) { res.status(404).json({ error: "Department not found" }); return; }
      const { name, code, description, headId } = req.body;
      const updateData: any = { updatedAt: new Date().toISOString() };
      if (name !== undefined) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (description !== undefined) updateData.description = description;
      if (headId !== undefined) updateData.headId = headId;
      await docRef.update(updateData);
      res.json({ id: req.params.id, ...doc.data(), ...updateData });
    } catch (error) { res.status(500).json({ error: "Failed to update department" }); }
  });

  app.delete("/api/departments/:id", authenticate, enforceDepartmentScope, async (req, res) => {
    try {
      const doc = await db.collection("departments").doc(req.params.id).get();
      if (!doc.exists) { res.status(404).json({ error: "Department not found" }); return; }
      await db.collection("departments").doc(req.params.id).delete();
      res.json({ message: "Department deleted successfully" });
    } catch (error) { res.status(500).json({ error: "Failed to delete department" }); }
  });

  // Generic CRUD helper
  function createCrudRoutes(collection: string, requiredFields: string[], enrichFn?: (doc: any, data: any) => Promise<any>) {
    app.get(`/api/${collection}`, authenticate, enforceDepartmentScope, async (req: any, res) => {
      try {
        const departmentScope = req.departmentScope;
        let query: any = db.collection(collection);
        if (departmentScope) {
          if (["publications", "patents", "research"].includes(collection)) {
            const facSnap = await db.collection("faculties").where("departmentId", "==", departmentScope).get();
            const facIds = facSnap.docs.map((d: any) => d.id);
            if (facIds.length === 0) { res.json([]); return; }
            query = query.where("facultyId", "in", facIds);
          } else {
            query = query.where("departmentId", "==", departmentScope);
          }
        }
        const snapshot = await query.get();
        let items = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        if (enrichFn) { items = await Promise.all(items.map(async (item: any) => enrichFn(item, item))); }
        res.json(items);
      } catch (error) { res.status(500).json({ error: `Failed to fetch ${collection}` }); }
    });

    app.get(`/api/${collection}/:id`, authenticate, enforceDepartmentScope, async (req: any, res) => {
      try {
        const doc = await db.collection(collection).doc(req.params.id).get();
        if (!doc.exists) { res.status(404).json({ error: `${collection} not found` }); return; }
        let item = { id: doc.id, ...doc.data() } as any;
        if (enrichFn) { item = await enrichFn(item, item); }
        res.json(item);
      } catch (error) { res.status(500).json({ error: `Failed to fetch ${collection}` }); }
    });

    app.post(`/api/${collection}`, authenticate, enforceDepartmentScope, async (req: any, res) => {
      try {
        for (const field of requiredFields) { if (!req.body[field]) { res.status(400).json({ error: `${field} is required` }); return; } }
        const id = uuid();
        const data = { ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        await db.collection(collection).doc(id).set(data);
        res.status(201).json({ id, ...data });
      } catch (error) { res.status(500).json({ error: `Failed to create ${collection}` }); }
    });

    app.put(`/api/${collection}/:id`, authenticate, enforceDepartmentScope, async (req: any, res) => {
      try {
        const docRef = db.collection(collection).doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) { res.status(404).json({ error: `${collection} not found` }); return; }
        const updateData = { ...req.body, updatedAt: new Date().toISOString() };
        delete updateData.id;
        delete updateData.createdAt;
        await docRef.update(updateData);
        res.json({ id: req.params.id, ...doc.data(), ...updateData });
      } catch (error) { res.status(500).json({ error: `Failed to update ${collection}` }); }
    });

    app.delete(`/api/${collection}/:id`, authenticate, enforceDepartmentScope, async (req: any, res) => {
      try {
        const doc = await db.collection(collection).doc(req.params.id).get();
        if (!doc.exists) { res.status(404).json({ error: `${collection} not found` }); return; }
        await db.collection(collection).doc(req.params.id).delete();
        res.json({ message: `${collection} deleted successfully` });
      } catch (error) { res.status(500).json({ error: `Failed to delete ${collection}` }); }
    });
  }

  createCrudRoutes("faculties", ["name", "email", "departmentId"]);
  createCrudRoutes("students", ["name", "rollNumber", "departmentId"]);
  createCrudRoutes("publications", ["title", "facultyId"]);
  createCrudRoutes("patents", ["title", "facultyId"]);
  createCrudRoutes("research", ["title", "facultyId"]);
  createCrudRoutes("events", ["title", "startDate", "departmentId"]);
  createCrudRoutes("targets", ["metric", "targetValue", "academicYear", "departmentId"]);
  createCrudRoutes("notifications", ["userId", "title", "message"]);
  createCrudRoutes("documents", ["title", "fileName"]);
  createCrudRoutes("signatures", ["userId", "reportId", "signatureData"]);

  // Reports
  const reportTemplates: Record<string, string[]> = {
    staff: ["publications", "patents", "research", "events", "monthly_progress", "semester_progress", "annual_performance", "target_achievement", "pending_activities"],
    department: ["complete_report", "faculty_performance", "department_publications", "department_patents", "department_research", "student_achievements", "placement_statistics", "target_vs_achievement", "monthly_report", "semester_report", "annual_report"],
    vp: ["department_comparison", "pending_approval", "faculty_summary", "research_summary", "publication_summary", "patent_summary", "placement_summary", "target_analysis", "institutional_progress", "monthly_institutional", "annual_institutional"],
    principal: ["annual_report", "nirf_report", "naac_report", "nba_report", "iqac_report", "aicte_report", "ugc_report", "governing_council", "management_report", "accreditation_evidence"],
  };

  app.get("/api/reports/templates", authenticate, async (_req, res) => { res.json(reportTemplates); });

  app.get("/api/reports", authenticate, enforceDepartmentScope, async (req: any, res) => {
    try {
      const departmentScope = req.departmentScope;
      let query: any = db.collection("reports");
      if (departmentScope) query = query.where("departmentId", "==", departmentScope);
      const snapshot = await query.orderBy("createdAt", "desc").get();
      const reports = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      const enriched = await Promise.all(reports.map(async (r: any) => {
        const result: any = { ...r };
        if (r.departmentId) { const dd = await db.collection("departments").doc(r.departmentId).get(); result.department = dd.exists ? { id: dd.id, ...dd.data() } : null; }
        if (r.creatorId) { const cd = await db.collection("users").doc(r.creatorId).get(); if (cd.exists) { const u = cd.data()!; result.creator = { id: cd.id, name: u.name, email: u.email, role: u.role }; } }
        return result;
      }));
      res.json(enriched);
    } catch (error) { res.status(500).json({ error: "Failed to fetch reports" }); }
  });

  app.get("/api/reports/:id", authenticate, enforceDepartmentScope, async (req: any, res) => {
    try {
      const doc = await db.collection("reports").doc(req.params.id).get();
      if (!doc.exists) { res.status(404).json({ error: "Report not found" }); return; }
      const report = { id: doc.id, ...doc.data() } as any;
      if (report.departmentId) { const dd = await db.collection("departments").doc(report.departmentId).get(); report.department = dd.exists ? { id: dd.id, ...dd.data() } : null; }
      if (report.creatorId) { const cd = await db.collection("users").doc(report.creatorId).get(); if (cd.exists) { const u = cd.data()!; report.creator = { id: cd.id, name: u.name, email: u.email, role: u.role }; } }
      const approvalsSnap = await db.collection("approvals").where("reportId", "==", req.params.id).get();
      report.approvals = approvalsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      const sigsSnap = await db.collection("signatures").where("reportId", "==", req.params.id).get();
      report.signatures = sigsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      res.json(report);
    } catch (error) { res.status(500).json({ error: "Failed to fetch report" }); }
  });

  app.post("/api/reports/generate", authenticate, enforceDepartmentScope, async (req: any, res) => {
    try {
      const { title, type, category, departmentId, academicYear, content, data } = req.body;
      if (!title || !type || !departmentId) { res.status(400).json({ error: "Title, type, and departmentId are required" }); return; }
      const user = req.user;
      const id = uuid();
      const reportData = { title, type, category, departmentId, academicYear, content, data: data ? JSON.stringify(JSON.parse(data)) : null, status: "DRAFT", creatorId: user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await db.collection("reports").doc(id).set(reportData);
      res.status(201).json({ id, ...reportData });
    } catch (error) { res.status(500).json({ error: "Failed to generate report" }); }
  });

  app.put("/api/reports/:id", authenticate, enforceDepartmentScope, async (req: any, res) => {
    try {
      const docRef = db.collection("reports").doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) { res.status(404).json({ error: "Report not found" }); return; }
      const existing = doc.data() as any;
      if (existing.status === "LOCKED") { res.status(400).json({ error: "Cannot edit a locked report" }); return; }
      const { title, type, category, departmentId, academicYear, content, data } = req.body;
      const updateData: any = { updatedAt: new Date().toISOString() };
      if (title !== undefined) updateData.title = title;
      if (type !== undefined) updateData.type = type;
      if (category !== undefined) updateData.category = category;
      if (departmentId !== undefined) updateData.departmentId = departmentId;
      if (academicYear !== undefined) updateData.academicYear = academicYear;
      if (content !== undefined) updateData.content = content;
      if (data !== undefined) updateData.data = JSON.stringify(JSON.parse(data));
      await docRef.update(updateData);
      res.json({ id: req.params.id, ...existing, ...updateData });
    } catch (error) { res.status(500).json({ error: "Failed to update report" }); }
  });

  app.delete("/api/reports/:id", authenticate, enforceDepartmentScope, async (req: any, res) => {
    try {
      const doc = await db.collection("reports").doc(req.params.id).get();
      if (!doc.exists) { res.status(404).json({ error: "Report not found" }); return; }
      const existing = doc.data() as any;
      if (existing.status === "LOCKED") { res.status(400).json({ error: "Cannot delete a locked report" }); return; }
      await db.collection("reports").doc(req.params.id).delete();
      res.json({ message: "Report deleted successfully" });
    } catch (error) { res.status(500).json({ error: "Failed to delete report" }); }
  });

  app.post("/api/reports/:id/submit", authenticate, enforceDepartmentScope, async (req: any, res) => {
    try {
      const docRef = db.collection("reports").doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) { res.status(404).json({ error: "Report not found" }); return; }
      const existing = doc.data() as any;
      if (existing.status !== "DRAFT") { res.status(400).json({ error: "Only DRAFT reports can be submitted" }); return; }
      await docRef.update({ status: "SUBMITTED", submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      res.json({ id: req.params.id, ...existing, status: "SUBMITTED" });
    } catch (error) { res.status(500).json({ error: "Failed to submit report" }); }
  });

  // Approvals
  const approvalLevels = ["STAFF", "HOD", "VP", "PRINCIPAL", "LOCKED"];

  app.get("/api/approvals", authenticate, enforceDepartmentScope, async (req: any, res) => {
    try {
      const user = req.user;
      let query: any = db.collection("approvals");
      if (user.role === "HOD") query = query.where("level", "==", "HOD").where("status", "==", "PENDING");
      else if (user.role === "VICE_PRINCIPAL") query = query.where("level", "==", "VP").where("status", "==", "PENDING");
      else if (user.role === "PRINCIPAL") query = query.where("level", "==", "PRINCIPAL").where("status", "==", "PENDING");
      else if (user.role !== "SUPER_ADMIN") query = query.where("userId", "==", user.id);
      const snapshot = await query.orderBy("createdAt", "desc").get();
      const approvals = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      const enriched = await Promise.all(approvals.map(async (a: any) => {
        const result: any = { ...a };
        if (a.reportId) { const rd = await db.collection("reports").doc(a.reportId).get(); if (rd.exists) { const r = rd.data()!; let dept = null; if (r.departmentId) { const dd = await db.collection("departments").doc(r.departmentId).get(); dept = dd.exists ? { id: dd.id, ...dd.data() } : null; } result.report = { id: rd.id, ...r, department: dept }; } }
        if (a.userId) { const ud = await db.collection("users").doc(a.userId).get(); if (ud.exists) { const u = ud.data()!; result.approver = { id: ud.id, name: u.name, email: u.email, role: u.role }; } }
        return result;
      }));
      res.json(enriched);
    } catch (error) { res.status(500).json({ error: "Failed to fetch approvals" }); }
  });

  app.get("/api/approvals/:id", authenticate, enforceDepartmentScope, async (req, res) => {
    try {
      const doc = await db.collection("approvals").doc(req.params.id).get();
      if (!doc.exists) { res.status(404).json({ error: "Approval not found" }); return; }
      res.json({ id: doc.id, ...doc.data() });
    } catch (error) { res.status(500).json({ error: "Failed to fetch approval" }); }
  });

  app.post("/api/approvals", authenticate, enforceDepartmentScope, async (req: any, res) => {
    try {
      const { reportId, level, comment } = req.body;
      if (!reportId || !level) { res.status(400).json({ error: "ReportId and level are required" }); return; }
      const reportDoc = await db.collection("reports").doc(reportId).get();
      if (!reportDoc.exists) { res.status(404).json({ error: "Report not found" }); return; }
      const user = req.user;
      const id = uuid();
      const data = { reportId, userId: user.id, level, status: "PENDING", comment, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await db.collection("approvals").doc(id).set(data);
      res.status(201).json({ id, ...data });
    } catch (error) { res.status(500).json({ error: "Failed to create approval" }); }
  });

  app.put("/api/approvals/:id/approve", authenticate, enforceDepartmentScope, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const doc = await db.collection("approvals").doc(id).get();
      if (!doc.exists) { res.status(404).json({ error: "Approval not found" }); return; }
      const approval = doc.data() as any;
      if (approval.status !== "PENDING") { res.status(400).json({ error: "Approval is not pending" }); return; }
      const user = req.user;
      await db.collection("approvals").doc(id).update({ status: "APPROVED", comment, approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      const currentLevelIndex = approvalLevels.indexOf(approval.level);
      const nextLevelIndex = currentLevelIndex + 1;
      if (nextLevelIndex < approvalLevels.length) {
        const nextLevel = approvalLevels[nextLevelIndex];
        if (nextLevel === "LOCKED") {
          await db.collection("reports").doc(approval.reportId).update({ status: "LOCKED", updatedAt: new Date().toISOString() });
        } else {
          const nextApprovalId = uuid();
          await db.collection("approvals").doc(nextApprovalId).set({ reportId: approval.reportId, userId: user.id, level: nextLevel, status: "PENDING", comment: `Auto-created after ${approval.level} approval`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
      }
      res.json({ message: "Approval processed successfully" });
    } catch (error) { res.status(500).json({ error: "Failed to approve" }); }
  });

  app.put("/api/approvals/:id/reject", authenticate, enforceDepartmentScope, async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const doc = await db.collection("approvals").doc(id).get();
      if (!doc.exists) { res.status(404).json({ error: "Approval not found" }); return; }
      const approval = doc.data() as any;
      if (approval.status !== "PENDING") { res.status(400).json({ error: "Approval is not pending" }); return; }
      await db.collection("approvals").doc(id).update({ status: "REJECTED", comment, updatedAt: new Date().toISOString() });
      await db.collection("reports").doc(approval.reportId).update({ status: "DRAFT", updatedAt: new Date().toISOString() });
      res.json({ message: "Approval rejected" });
    } catch (error) { res.status(500).json({ error: "Failed to reject" }); }
  });

  // Users
  app.get("/api/users", authenticate, enforceDepartmentScope, async (req: any, res) => {
    try {
      const departmentScope = req.departmentScope;
      let query: any = db.collection("users");
      if (departmentScope) query = query.where("departmentId", "==", departmentScope);
      const snapshot = await query.get();
      const users = snapshot.docs.map((d: any) => { const u = d.data(); const { password, ...rest } = u; return { id: d.id, ...rest }; });
      res.json(users);
    } catch (error) { res.status(500).json({ error: "Failed to fetch users" }); }
  });

  app.post("/api/users", authenticate, enforceDepartmentScope, async (req, res) => {
    try {
      const { email, password, name, role, departmentId } = req.body;
      if (!email || !password || !name || !role) { res.status(400).json({ error: "Email, password, name, and role are required" }); return; }
      const existing = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!existing.empty) { res.status(400).json({ error: "Email already exists" }); return; }
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuid();
      const data = { email, password: hashedPassword, name, role, departmentId: departmentId || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await db.collection("users").doc(id).set(data);
      const { password: _, ...userWithoutPassword } = data;
      res.status(201).json({ id, ...userWithoutPassword });
    } catch (error) { res.status(500).json({ error: "Failed to create user" }); }
  });

  // Analytics
  app.get("/api/analytics/dashboard", authenticate, enforceDepartmentScope, async (req: any, res) => {
    try {
      const [facSnap, stuSnap, deptSnap, pubSnap, patSnap, evtSnap] = await Promise.all([
        db.collection("faculties").get(), db.collection("students").get(),
        db.collection("departments").get(), db.collection("publications").get(),
        db.collection("patents").get(), db.collection("events").get(),
      ]);
      res.json({
        totalFaculties: facSnap.size, totalStudents: stuSnap.size,
        totalDepartments: deptSnap.size, totalPublications: pubSnap.size,
        totalPatents: patSnap.size, totalEvents: evtSnap.size,
      });
    } catch (error) { res.status(500).json({ error: "Failed to fetch analytics" }); }
  });

  app.get("/api/analytics/department", authenticate, enforceDepartmentScope, async (_req, res) => {
    try {
      const deptSnap = await db.collection("departments").get();
      const departments = await Promise.all(deptSnap.docs.map(async (d: any) => {
        const [facSnap, stuSnap] = await Promise.all([
          db.collection("faculties").where("departmentId", "==", d.id).get(),
          db.collection("students").where("departmentId", "==", d.id).get(),
        ]);
        return { id: d.id, ...d.data(), facultyCount: facSnap.size, studentCount: stuSnap.size };
      }));
      res.json(departments);
    } catch (error) { res.status(500).json({ error: "Failed to fetch department analytics" }); }
  });

  return app;
}

export default async function handler(req: any, res: any) {
  const app = getApp();
  return app(req, res);
}
