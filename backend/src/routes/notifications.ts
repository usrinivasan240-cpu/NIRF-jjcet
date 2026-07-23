import { Router, Request, Response } from "express";
import { getDb } from "../config/firebase";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const db = getDb();

    const snapshot = await db
      .collection("notifications")
      .where("userId", "==", user.id)
      .orderBy("createdAt", "desc")
      .get();

    const notifications = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.put("/:id/read", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const doc = await db.collection("notifications").doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    await db.collection("notifications").doc(id).update({ read: true });

    res.json({ id, ...doc.data(), read: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const doc = await db.collection("notifications").doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    const user = (req as any).user;
    const data = doc.data();
    if (data?.userId !== user.id && user.role !== "SUPER_ADMIN") {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await db.collection("notifications").doc(id).delete();
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;
