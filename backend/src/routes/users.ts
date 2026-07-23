import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

const router = Router();

const safeFields = ["id", "name", "email", "role", "departmentId", "createdAt", "updatedAt"];

function sanitizeUser(doc: FirebaseFirestore.DocumentData) {
  const data = doc.data();
  const result: Record<string, any> = {};
  for (const field of safeFields) {
    if (field === "id") {
      result.id = doc.id;
    } else if (data[field] !== undefined) {
      result[field] = data[field];
    }
  }
  return result;
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const departmentScope = (req as any).departmentScope;
    const db = getDb();

    let query: FirebaseFirestore.Query = db.collection("users");
    if (departmentScope) {
      query = query.where("departmentId", "==", departmentScope);
    }

    const snapshot = await query.orderBy("name", "asc").get();
    const users = snapshot.docs.map((d) => sanitizeUser(d));

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const doc = await db.collection("users").doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && doc.data()?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(sanitizeUser(doc));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "Name, email, password, and role are required" });
      return;
    }

    const db = getDb();
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId && departmentId !== departmentScope) {
      res.status(403).json({ error: "Cannot create user in another department" });
      return;
    }

    const existing = await db.collection("users").where("email", "==", email).get();
    if (!existing.empty) {
      res.status(400).json({ error: "Email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuid();
    const now = new Date().toISOString();

    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      departmentId: departmentId || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("users").doc(id).set(userData);

    const { password: _, ...safeData } = userData;
    res.status(201).json({ id, ...safeData });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, departmentId } = req.body;
    const db = getDb();

    const docRef = db.collection("users").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && doc.data()?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const updateData: Record<string, any> = {
      name,
      email,
      role,
      departmentId,
      updatedAt: new Date().toISOString(),
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await docRef.update(updateData);

    const updated = await docRef.get();
    res.json(sanitizeUser(updated));
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const doc = await db.collection("users").doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && doc.data()?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await db.collection("users").doc(id).delete();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
