import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import { v4 as uuid } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const departmentScope = (req as any).departmentScope;
    let query: any = db.collection("targets");

    if (departmentScope) {
      query = query.where("departmentId", "==", departmentScope);
    }

    const snapshot = await query.orderBy("academicYear", "desc").get();
    const targets = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const enriched = await Promise.all(
      targets.map(async (t: any) => {
        if (t.departmentId) {
          const deptDoc = await db.collection("departments").doc(t.departmentId).get();
          return { ...t, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null };
        }
        return t;
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch targets" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("targets").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Target not found" });

    const target = { id: doc.id, ...doc.data() } as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && target.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });

    if (target.departmentId) {
      const deptDoc = await db.collection("departments").doc(target.departmentId).get();
      target.department = deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null;
    }

    res.json(target);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch target" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { metric, targetValue, achievedValue, academicYear, category, departmentId, status } = req.body;
    if (!metric || !targetValue || !academicYear || !departmentId) return res.status(400).json({ error: "Metric, targetValue, academicYear, and departmentId are required" });

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) return res.status(403).json({ error: "Cannot create target for another department" });

    const id = uuid();
    const data = {
      metric, targetValue: parseFloat(targetValue),
      achievedValue: achievedValue ? parseFloat(achievedValue) : null,
      academicYear, category, departmentId, status,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    await db.collection("targets").doc(id).set(data);

    const deptDoc = await db.collection("departments").doc(departmentId).get();
    res.status(201).json({ id, ...data, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null });
  } catch (error) {
    res.status(500).json({ error: "Failed to create target" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const docRef = db.collection("targets").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Target not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });

    const { metric, targetValue, achievedValue, academicYear, category, departmentId, status } = req.body;
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (metric !== undefined) updateData.metric = metric;
    if (targetValue !== undefined) updateData.targetValue = parseFloat(targetValue);
    if (achievedValue !== undefined) updateData.achievedValue = achievedValue ? parseFloat(achievedValue) : null;
    if (academicYear !== undefined) updateData.academicYear = academicYear;
    if (category !== undefined) updateData.category = category;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (status !== undefined) updateData.status = status;

    await docRef.update(updateData);
    res.json({ id: req.params.id, ...existing, ...updateData });
  } catch (error) {
    res.status(500).json({ error: "Failed to update target" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("targets").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Target not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });

    await db.collection("targets").doc(req.params.id).delete();
    res.json({ message: "Target deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete target" });
  }
});

export default router;
