import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import { v4 as uuid } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const departmentScope = (req as any).departmentScope;
    let query: any = db.collection("patents");

    if (departmentScope) {
      const facultySnap = await db.collection("faculties").where("departmentId", "==", departmentScope).get();
      const facultyIds = facultySnap.docs.map((d: any) => d.id);
      if (facultyIds.length === 0) return res.json([]);
      query = query.where("facultyId", "in", facultyIds);
    }

    const snapshot = await query.orderBy("filingDate", "desc").get();
    const patents = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const enriched = await Promise.all(
      patents.map(async (pat: any) => {
        if (pat.facultyId) {
          const facDoc = await db.collection("faculties").doc(pat.facultyId).get();
          if (facDoc.exists) {
            const facData = facDoc.data()!;
            const deptDoc = await db.collection("departments").doc(facData.departmentId).get();
            return { ...pat, faculty: { ...facData, id: facDoc.id, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null } };
          }
        }
        return pat;
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patents" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("patents").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Patent not found" });

    const pat = { id: doc.id, ...doc.data() } as any;
    const departmentScope = (req as any).departmentScope;

    if (pat.facultyId) {
      const facDoc = await db.collection("faculties").doc(pat.facultyId).get();
      if (facDoc.exists) {
        const facData = facDoc.data()!;
        if (departmentScope && facData.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });
        const deptDoc = await db.collection("departments").doc(facData.departmentId).get();
        pat.faculty = { ...facData, id: facDoc.id, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null };
      }
    }

    res.json(pat);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patent" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { title, inventors, filingDate, grantDate, patentNumber, status, type, facultyId } = req.body;
    if (!title || !facultyId) return res.status(400).json({ error: "Title and facultyId are required" });

    const facDoc = await db.collection("faculties").doc(facultyId).get();
    if (!facDoc.exists) return res.status(404).json({ error: "Faculty not found" });

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && facDoc.data()!.departmentId !== departmentScope) return res.status(403).json({ error: "Cannot create patent for another department" });

    const id = uuid();
    const data = { title, inventors, filingDate: filingDate || null, grantDate: grantDate || null, patentNumber, status, type, facultyId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await db.collection("patents").doc(id).set(data);

    const facData = facDoc.data()!;
    const deptDoc = await db.collection("departments").doc(facData.departmentId).get();
    res.status(201).json({ id, ...data, faculty: { ...facData, id: facDoc.id, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null } });
  } catch (error) {
    res.status(500).json({ error: "Failed to create patent" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const docRef = db.collection("patents").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Patent not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.facultyId) {
      const facDoc = await db.collection("faculties").doc(existing.facultyId).get();
      if (facDoc.exists && facDoc.data()!.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });
    }

    const { title, inventors, filingDate, grantDate, patentNumber, status, type, facultyId } = req.body;
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (inventors !== undefined) updateData.inventors = inventors;
    if (filingDate !== undefined) updateData.filingDate = filingDate;
    if (grantDate !== undefined) updateData.grantDate = grantDate;
    if (patentNumber !== undefined) updateData.patentNumber = patentNumber;
    if (status !== undefined) updateData.status = status;
    if (type !== undefined) updateData.type = type;
    if (facultyId !== undefined) updateData.facultyId = facultyId;

    await docRef.update(updateData);
    res.json({ id: req.params.id, ...existing, ...updateData });
  } catch (error) {
    res.status(500).json({ error: "Failed to update patent" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("patents").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Patent not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.facultyId) {
      const facDoc = await db.collection("faculties").doc(existing.facultyId).get();
      if (facDoc.exists && facDoc.data()!.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });
    }

    await db.collection("patents").doc(req.params.id).delete();
    res.json({ message: "Patent deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete patent" });
  }
});

export default router;
