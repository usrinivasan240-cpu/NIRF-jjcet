import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import { v4 as uuid } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const departmentScope = (req as any).departmentScope;
    const db = getDb();

    let query: FirebaseFirestore.Query = db.collection("documents");
    if (departmentScope) {
      query = query.where("departmentId", "==", departmentScope);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const documents = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const doc = await db.collection("documents").doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && doc.data()?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, description, fileName, fileUrl, fileType, fileSize, departmentId } = req.body;

    if (!title || !fileName || !fileUrl || !departmentId) {
      res.status(400).json({ error: "Title, fileName, fileUrl, and departmentId are required" });
      return;
    }

    const db = getDb();
    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) {
      res.status(403).json({ error: "Cannot upload document to another department" });
      return;
    }

    const user = (req as any).user;
    const id = uuid();

    const documentData = {
      title,
      description: description || null,
      fileName,
      fileUrl,
      fileType: fileType || null,
      fileSize: fileSize ? parseInt(fileSize) : null,
      departmentId,
      uploadedBy: user.id,
      createdAt: new Date().toISOString(),
    };

    await db.collection("documents").doc(id).set(documentData);

    res.status(201).json({ id, ...documentData });
  } catch (error) {
    res.status(500).json({ error: "Failed to create document" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const doc = await db.collection("documents").doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && doc.data()?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await db.collection("documents").doc(id).delete();
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete document" });
  }
});

export default router;
