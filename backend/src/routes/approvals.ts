import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import { v4 as uuid } from "uuid";

const router = Router();
const approvalLevels = ["STAFF", "HOD", "VP", "PRINCIPAL", "LOCKED"];

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const user = (req as any).user;
    let query: any = db.collection("approvals");

    if (user.role === "HOD") {
      query = query.where("level", "==", "HOD").where("status", "==", "PENDING");
    } else if (user.role === "VICE_PRINCIPAL") {
      query = query.where("level", "==", "VP").where("status", "==", "PENDING");
    } else if (user.role === "PRINCIPAL") {
      query = query.where("level", "==", "PRINCIPAL").where("status", "==", "PENDING");
    } else if (user.role !== "SUPER_ADMIN") {
      query = query.where("userId", "==", user.id);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const approvals = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const enriched = await Promise.all(
      approvals.map(async (a: any) => {
        const result: any = { ...a };
        if (a.reportId) {
          const reportDoc = await db.collection("reports").doc(a.reportId).get();
          if (reportDoc.exists) {
            const rd = reportDoc.data()!;
            let dept = null;
            if (rd.departmentId) {
              const deptDoc = await db.collection("departments").doc(rd.departmentId).get();
              dept = deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null;
            }
            result.report = { id: reportDoc.id, ...rd, department: dept };
          }
        }
        if (a.userId) {
          const userDoc = await db.collection("users").doc(a.userId).get();
          if (userDoc.exists) {
            const ud = userDoc.data()!;
            result.approver = { id: userDoc.id, name: ud.name, email: ud.email, role: ud.role };
          }
        }
        return result;
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch approvals" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("approvals").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Approval not found" });

    const approval = { id: doc.id, ...doc.data() } as any;
    if (approval.reportId) {
      const reportDoc = await db.collection("reports").doc(approval.reportId).get();
      if (reportDoc.exists) {
        const rd = reportDoc.data()!;
        let dept = null;
        if (rd.departmentId) {
          const deptDoc = await db.collection("departments").doc(rd.departmentId).get();
          dept = deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null;
        }
        approval.report = { id: reportDoc.id, ...rd, department: dept };
      }
    }
    if (approval.userId) {
      const userDoc = await db.collection("users").doc(approval.userId).get();
      if (userDoc.exists) {
        const ud = userDoc.data()!;
        approval.approver = { id: userDoc.id, name: ud.name, email: ud.email, role: ud.role };
      }
    }

    res.json(approval);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch approval" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { reportId, level, comment } = req.body;
    if (!reportId || !level) return res.status(400).json({ error: "ReportId and level are required" });

    const reportDoc = await db.collection("reports").doc(reportId).get();
    if (!reportDoc.exists) return res.status(404).json({ error: "Report not found" });

    const user = (req as any).user;
    const id = uuid();
    const data = {
      reportId, userId: user.id, level, status: "PENDING", comment,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    await db.collection("approvals").doc(id).set(data);

    const rd = reportDoc.data()!;
    let dept = null;
    if (rd.departmentId) {
      const deptDoc = await db.collection("departments").doc(rd.departmentId).get();
      dept = deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null;
    }

    res.status(201).json({ id, ...data, report: { id: reportDoc.id, ...rd, department: dept }, approver: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: "Failed to create approval" });
  }
});

router.put("/:id/approve", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { comment } = req.body;

    const doc = await db.collection("approvals").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Approval not found" });

    const approval = doc.data() as any;
    if (approval.status !== "PENDING") return res.status(400).json({ error: "Approval is not pending" });

    const user = (req as any).user;

    await db.collection("approvals").doc(id).update({
      status: "APPROVED", comment, approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });

    const currentLevelIndex = approvalLevels.indexOf(approval.level);
    const nextLevelIndex = currentLevelIndex + 1;

    if (nextLevelIndex < approvalLevels.length) {
      const nextLevel = approvalLevels[nextLevelIndex];

      if (nextLevel === "LOCKED") {
        await db.collection("reports").doc(approval.reportId).update({ status: "LOCKED", updatedAt: new Date().toISOString() });
      } else {
        const nextApprovalId = uuid();
        await db.collection("approvals").doc(nextApprovalId).set({
          reportId: approval.reportId, userId: user.id, level: nextLevel, status: "PENDING", comment: `Auto-created after ${approval.level} approval`,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        });
      }
    }

    res.json({ message: "Approval processed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve" });
  }
});

router.put("/:id/reject", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { comment } = req.body;

    const doc = await db.collection("approvals").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Approval not found" });

    const approval = doc.data() as any;
    if (approval.status !== "PENDING") return res.status(400).json({ error: "Approval is not pending" });

    await db.collection("approvals").doc(id).update({
      status: "REJECTED", comment, updatedAt: new Date().toISOString()
    });

    await db.collection("reports").doc(approval.reportId).update({ status: "DRAFT", updatedAt: new Date().toISOString() });

    res.json({ message: "Approval rejected" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject" });
  }
});

export default router;
