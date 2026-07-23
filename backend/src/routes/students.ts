import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import { v4 as uuid } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const departmentScope = (req as any).departmentScope;
    let query: any = db.collection("students");

    if (departmentScope) {
      query = query.where("departmentId", "==", departmentScope);
    }

    const snapshot = await query.orderBy("name", "asc").get();
    const students = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const enriched = await Promise.all(
      students.map(async (stu: any) => {
        if (stu.departmentId) {
          const deptDoc = await db.collection("departments").doc(stu.departmentId).get();
          return { ...stu, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null };
        }
        return stu;
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("students").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Student not found" });

    const student = { id: doc.id, ...doc.data() } as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && student.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });

    if (student.departmentId) {
      const deptDoc = await db.collection("departments").doc(student.departmentId).get();
      student.department = deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null;
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, email, rollNumber, departmentId, program, year, semester, cgpa, status } = req.body;
    if (!name || !rollNumber || !departmentId) return res.status(400).json({ error: "Name, rollNumber, and departmentId are required" });

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) return res.status(403).json({ error: "Cannot create student in another department" });

    const id = uuid();
    const data = { name, email, rollNumber, departmentId, program, year, semester, cgpa: cgpa ? parseFloat(cgpa) : null, status, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await db.collection("students").doc(id).set(data);

    const deptDoc = await db.collection("departments").doc(departmentId).get();
    res.status(201).json({ id, ...data, department: deptDoc.exists ? { id: deptDoc.id, ...deptDoc.data() } : null });
  } catch (error) {
    res.status(500).json({ error: "Failed to create student" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const docRef = db.collection("students").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Student not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });

    const { name, email, rollNumber, departmentId, program, year, semester, cgpa, status } = req.body;
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (rollNumber !== undefined) updateData.rollNumber = rollNumber;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (program !== undefined) updateData.program = program;
    if (year !== undefined) updateData.year = year;
    if (semester !== undefined) updateData.semester = semester;
    if (cgpa !== undefined) updateData.cgpa = cgpa ? parseFloat(cgpa) : null;
    if (status !== undefined) updateData.status = status;

    await docRef.update(updateData);
    res.json({ id: req.params.id, ...existing, ...updateData });
  } catch (error) {
    res.status(500).json({ error: "Failed to update student" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("students").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Student not found" });

    const existing = doc.data() as any;
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) return res.status(403).json({ error: "Access denied" });

    await db.collection("students").doc(req.params.id).delete();
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

export default router;
