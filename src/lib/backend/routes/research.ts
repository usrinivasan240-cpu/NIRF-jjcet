import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import { v4 as uuid } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const departmentScope = (req as any).departmentScope;
    let query: any = db.collection("research");

    if (departmentScope) {
      const facultySnap = await db.collection("faculties").where("departmentId", "==", departmentScope).get();
      const facultyIds = facultySnap.docs.map((d: any) => d.id);
      if (facultyIds.length === 0) return res.json([]);
      query = query.where("facultyId", "in", facultyIds);
    }

    const snapshot = await query.orderBy("startDate", "desc").get();
    const projects = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const enriched = await Promise.all(
      projects.map(async (proj: any) => {
        if (proj.facultyId) {
          const facDoc = await db.collection("faculties").doc(proj.facultyId).get();
          if (facDoc.exists) {
            const facData = facDoc.data()!;
            const deptDoc = await db.collection("departments").doc(facData.departmentId).get();
            return { ...proj, faculty: { ...facData, id: facDoc.id, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null } };
          }
        }
        return proj;
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch research projects" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("research").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Research project not found" });

    const proj = { id: doc.id, ...doc.data() } as any;
    const departmentScope = (req as any).departmentScope;

    if (proj.facultyId) {
      const facDoc = await db.collection("faculties").doc(proj.facultyId).get();
      if (facDoc.exists) {
        const facData = facDoc.data()!;
        if (departmentScope && facData.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });
        const deptDoc = await db.collection("departments").doc(facData.departmentId).get();
        proj.faculty = { ...facData, id: facDoc.id, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null };
      }
    }

    res.json(proj);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch research project" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { title, description, fundingAgency, grantAmount, startDate, endDate, status, type, facultyId } = req.body;
    if (!title || !facultyId) return res.status(400).json({ error: "Title and facultyId are required" });

    const facDoc = await db.collection("faculties").doc(facultyId).get();
    if (!facDoc.exists) return res.status(404).json({ error: "Faculty not found" });

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && facDoc.data()!.departmentId !== departmentScope) return res.status(403).json({ error: "Cannot create research for another department" });

    const id = uuid();
    const data = {
      title, description, fundingAgency,
      grantAmount: grantAmount ? parseFloat(grantAmount) : null,
      startDate, endDate: endDate || null,
      status, type, facultyId,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    await db.collection("research").doc(id).set(data);

    const facData = facDoc.data()!;
    const deptDoc = await db.collection("departments").doc(facData.departmentId).get();
    res.status(201).json({ id, ...data, faculty: { ...facData, id: facDoc.id, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null } });
  } catch (error) {
    res.status(500).json({ error: "Failed to create research project" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const docRef = db.collection("research").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Research project not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.facultyId) {
      const facDoc = await db.collection("faculties").doc(existing.facultyId).get();
      if (facDoc.exists && facDoc.data()!.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });
    }

    const { title, description, fundingAgency, grantAmount, startDate, endDate, status, type, facultyId } = req.body;
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (fundingAgency !== undefined) updateData.fundingAgency = fundingAgency;
    if (grantAmount !== undefined) updateData.grantAmount = grantAmount ? parseFloat(grantAmount) : null;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (status !== undefined) updateData.status = status;
    if (type !== undefined) updateData.type = type;
    if (facultyId !== undefined) updateData.facultyId = facultyId;

    await docRef.update(updateData);
    res.json({ id: req.params.id, ...existing, ...updateData });
  } catch (error) {
    res.status(500).json({ error: "Failed to update research project" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("research").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Research project not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.facultyId) {
      const facDoc = await db.collection("faculties").doc(existing.facultyId).get();
      if (facDoc.exists && facDoc.data()!.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });
    }

    await db.collection("research").doc(req.params.id).delete();
    res.json({ message: "Research project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete research project" });
  }
});

export default router;
