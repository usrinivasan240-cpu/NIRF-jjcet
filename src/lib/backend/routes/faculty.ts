import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import { v4 as uuid } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const departmentScope = (req as any).departmentScope;

    let query: FirebaseFirestore.Query = db
      .collection("faculties")
      .orderBy("name", "asc");

    if (departmentScope) {
      query = db
        .collection("faculties")
        .where("departmentId", "==", departmentScope)
        .orderBy("name", "asc");
    }

    const snapshot = await query.get();

    const faculties = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let department = null;

        if (data.departmentId) {
          const deptDoc = await db
            .collection("departments")
            .doc(data.departmentId)
            .get();

          if (deptDoc.exists) {
            department = { id: deptDoc.id, ...deptDoc.data() };
          }
        }

        return { id: doc.id, ...data, department };
      })
    );

    res.json(faculties);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch faculties" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const doc = await db.collection("faculties").doc(id).get();

    if (!doc.exists) {
      res.status(404).json({ error: "Faculty not found" });
      return;
    }

    const data = doc.data()!;
    const departmentScope = (req as any).departmentScope;

    if (departmentScope && data.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    let department = null;
    if (data.departmentId) {
      const deptDoc = await db
        .collection("departments")
        .doc(data.departmentId)
        .get();

      if (deptDoc.exists) {
        department = { id: deptDoc.id, ...deptDoc.data() };
      }
    }

    const publicationsSnap = await db
      .collection("publications")
      .where("facultyId", "==", id)
      .get();

    const patentsSnap = await db
      .collection("patents")
      .where("facultyId", "==", id)
      .get();

    const faculty = {
      id: doc.id,
      ...data,
      department,
      publications: publicationsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })),
      patents: patentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };

    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch faculty" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const {
      name,
      email,
      phone,
      designation,
      departmentId,
      qualification,
      experience,
      specialization,
    } = req.body;

    if (!name || !email || !departmentId) {
      res.status(400).json({ error: "Name, email, and departmentId are required" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) {
      res.status(403).json({ error: "Cannot create faculty in another department" });
      return;
    }

    const id = uuid();
    const now = new Date().toISOString();

    const facultyData = {
      id,
      name,
      email,
      phone: phone || null,
      designation: designation || null,
      departmentId,
      qualification: qualification || null,
      experience: experience || null,
      specialization: specialization || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("faculties").doc(id).set(facultyData);

    let department = null;
    const deptDoc = await db.collection("departments").doc(departmentId).get();
    if (deptDoc.exists) {
      department = { id: deptDoc.id, ...deptDoc.data() };
    }

    res.status(201).json({ ...facultyData, department });
  } catch (error) {
    res.status(500).json({ error: "Failed to create faculty" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      designation,
      departmentId,
      qualification,
      experience,
      specialization,
    } = req.body;

    const existing = await db.collection("faculties").doc(id).get();

    if (!existing.exists) {
      res.status(404).json({ error: "Faculty not found" });
      return;
    }

    const existingData = existing.data()!;
    const departmentScope = (req as any).departmentScope;

    if (departmentScope && existingData.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (designation !== undefined) updateData.designation = designation;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (experience !== undefined) updateData.experience = experience;
    if (specialization !== undefined) updateData.specialization = specialization;

    await db.collection("faculties").doc(id).update(updateData);

    const updated = await db.collection("faculties").doc(id).get();
    const updatedData = updated!.data()!;

    let department = null;
    if (updatedData.departmentId) {
      const deptDoc = await db
        .collection("departments")
        .doc(updatedData.departmentId)
        .get();

      if (deptDoc.exists) {
        department = { id: deptDoc.id, ...deptDoc.data() };
      }
    }

    res.json({ id: updated!.id, ...updatedData, department });
  } catch (error) {
    res.status(500).json({ error: "Failed to update faculty" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = await db.collection("faculties").doc(id).get();

    if (!existing.exists) {
      res.status(404).json({ error: "Faculty not found" });
      return;
    }

    const existingData = existing.data()!;
    const departmentScope = (req as any).departmentScope;

    if (departmentScope && existingData.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await db.collection("faculties").doc(id).delete();

    res.json({ message: "Faculty deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete faculty" });
  }
});

export default router;
