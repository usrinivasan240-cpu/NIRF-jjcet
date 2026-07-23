import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";
import { v4 as uuid } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const departmentScope = (req as any).departmentScope;
    let query: any = db.collection("signatures");

    const snapshot = await query.orderBy("signedAt", "desc").get();
    const signatures = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const enriched = await Promise.all(
      signatures.map(async (sig: any) => {
        const result: any = { ...sig };
        if (sig.userId) {
          const userDoc = await db.collection("users").doc(sig.userId).get();
          if (userDoc.exists) {
            const ud = userDoc.data()!;
            result.user = { id: userDoc.id, name: ud.name, email: ud.email, role: ud.role };
          }
        }
        if (departmentScope && sig.userId) {
          const userDoc = await db.collection("users").doc(sig.userId).get();
          if (userDoc.exists && userDoc.data()!.departmentId !== departmentScope) {
            return null;
          }
        }
        return result;
      })
    );

    res.json(enriched.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch signatures" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("signatures").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Signature not found" });

    const sig = { id: doc.id, ...doc.data() } as any;
    if (sig.userId) {
      const userDoc = await db.collection("users").doc(sig.userId).get();
      if (userDoc.exists) {
        const ud = userDoc.data()!;
        sig.user = { id: userDoc.id, name: ud.name, email: ud.email, role: ud.role };
      }
    }

    res.json(sig);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch signature" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { userId, reportId, signatureData } = req.body;
    if (!userId || !reportId || !signatureData) return res.status(400).json({ error: "userId, reportId, and signatureData are required" });

    const id = uuid();
    const data = { userId, reportId, signatureData, signedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    await db.collection("signatures").doc(id).set(data);

    res.status(201).json({ id, ...data });
  } catch (error) {
    res.status(500).json({ error: "Failed to create signature" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection("signatures").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Signature not found" });

    await db.collection("signatures").doc(req.params.id).delete();
    res.json({ message: "Signature deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete signature" });
  }
});

export default router;
