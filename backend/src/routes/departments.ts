import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import { v4 as uuid } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection("departments")
      .orderBy("name", "asc")
      .get();

    const departments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const doc = await db.collection("departments").doc(id).get();

    if (!doc.exists) {
      res.status(404).json({ error: "Department not found" });
      return;
    }

    const facultiesSnap = await db
      .collection("faculties")
      .where("departmentId", "==", id)
      .get();

    const studentsSnap = await db
      .collection("students")
      .where("departmentId", "==", id)
      .get();

    const department = {
      id: doc.id,
      ...doc.data(),
      faculties: facultiesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      students: studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };

    res.json(department);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch department" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, code, description, headId } = req.body;

    if (!name || !code) {
      res.status(400).json({ error: "Name and code are required" });
      return;
    }

    const id = uuid();
    const now = new Date().toISOString();

    const department = {
      id,
      name,
      code,
      description: description || null,
      headId: headId || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("departments").doc(id).set(department);

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ error: "Failed to create department" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, code, description, headId } = req.body;

    const existing = await db.collection("departments").doc(id).get();

    if (!existing.exists) {
      res.status(404).json({ error: "Department not found" });
      return;
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (headId !== undefined) updateData.headId = headId;

    await db.collection("departments").doc(id).update(updateData);

    const updated = await db.collection("departments").doc(id).get();

    res.json({ id: updated!.id, ...updated!.data() });
  } catch (error) {
    res.status(500).json({ error: "Failed to update department" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = await db.collection("departments").doc(id).get();

    if (!existing.exists) {
      res.status(404).json({ error: "Department not found" });
      return;
    }

    await db.collection("departments").doc(id).delete();

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete department" });
  }
});

export default router;
