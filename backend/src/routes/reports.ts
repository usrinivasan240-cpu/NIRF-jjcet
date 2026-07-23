import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import { v4 as uuid } from "uuid";

const router = Router();

const reportTemplates: Record<string, string[]> = {
  staff: ["publications", "patents", "research", "events", "monthly_progress", "semester_progress", "annual_performance", "target_achievement", "pending_activities"],
  department: ["complete_report", "faculty_performance", "department_publications", "department_patents", "department_research", "student_achievements", "placement_statistics", "target_vs_achievement", "monthly_report", "semester_report", "annual_report"],
  vp: ["department_comparison", "pending_approval", "faculty_summary", "research_summary", "publication_summary", "patent_summary", "placement_summary", "target_analysis", "institutional_progress", "monthly_institutional", "annual_institutional"],
  principal: ["annual_report", "nirf_report", "naac_report", "nba_report", "iqac_report", "aicte_report", "ugc_report", "governing_council", "management_report", "accreditation_evidence"],
};

router.get("/templates", async (_req: Request, res: Response) => {
  res.json(reportTemplates);
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const departmentScope = (req as any).departmentScope;
    let query: any = db.collection("reports");

    if (departmentScope) {
      query = query.where("departmentId", "==", departmentScope);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const reports = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const enriched = await Promise.all(
      reports.map(async (r: any) => {
        const result: any = { ...r };
        if (r.departmentId) {
          const deptDoc = await db.collection("departments").doc(r.departmentId).get();
          result.department = deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null;
        }
        if (r.creatorId) {
          const creatorDoc = await db.collection("users").doc(r.creatorId).get();
          if (creatorDoc.exists) {
            const cd = creatorDoc.data()!;
            result.creator = { id: creatorDoc.id, name: cd.name, email: cd.email, role: cd.role };
          }
        }
        return result;
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("reports").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Report not found" });

    const report = { id: doc.id, ...doc.data() } as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && report.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });

    if (report.departmentId) {
      const deptDoc = await db.collection("departments").doc(report.departmentId).get();
      report.department = deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null;
    }
    if (report.creatorId) {
      const creatorDoc = await db.collection("users").doc(report.creatorId).get();
      if (creatorDoc.exists) {
        const cd = creatorDoc.data()!;
        report.creator = { id: creatorDoc.id, name: cd.name, email: cd.email, role: cd.role };
      }
    }

    const approvalsSnap = await db.collection("approvals").where("reportId", "==", req.params.id).get();
    report.approvals = approvalsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const sigsSnap = await db.collection("signatures").where("reportId", "==", req.params.id).get();
    report.signatures = sigsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

router.post("/generate", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { title, type, category, departmentId, academicYear, content, data } = req.body;
    if (!title || !type || !departmentId) return res.status(400).json({ error: "Title, type, and departmentId are required" });

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) return res.status(403).json({ error: "Cannot generate report for another department" });

    const user = (req as any).user;
    const id = uuid();
    const reportData = {
      title, type, category, departmentId, academicYear, content,
      data: data ? JSON.stringify(JSON.parse(data)) : null,
      status: "DRAFT", creatorId: user.id,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    await db.collection("reports").doc(id).set(reportData);

    const deptDoc = await db.collection("departments").doc(departmentId).get();
    res.status(201).json({ id, ...reportData, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null, creator: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate report" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const docRef = db.collection("reports").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Report not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });
    if (existing.status === "LOCKED") return res.status(400).json({ error: "Cannot edit a locked report" });

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
  } catch (error) {
    res.status(500).json({ error: "Failed to update report" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("reports").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Report not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });
    if (existing.status === "LOCKED") return res.status(400).json({ error: "Cannot delete a locked report" });

    await db.collection("reports").doc(req.params.id).delete();
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete report" });
  }
});

router.post("/:id/submit", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const docRef = db.collection("reports").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Report not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });
    if (existing.status !== "DRAFT") return res.status(400).json({ error: "Only DRAFT reports can be submitted" });

    await docRef.update({ status: "SUBMITTED", submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    res.json({ id: req.params.id, ...existing, status: "SUBMITTED" });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;
