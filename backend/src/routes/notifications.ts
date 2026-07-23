import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, enforceDepartmentScope } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

router.get("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    const user = (req as any).user;
    if (notification.userId !== user.id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notification" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { title, message, type, userId } = req.body;

    if (!title || !message || !userId) {
      res.status(400).json({ error: "Title, message, and userId are required" });
      return;
    }

    const notification = await prisma.notification.create({
      data: { title, message, type, userId },
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: "Failed to create notification" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, message, type, isRead } = req.body;

    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { title, message, type, isRead },
    });

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    const user = (req as any).user;
    if (existing.userId !== user.id && user.role !== "SUPER_ADMIN") {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.notification.delete({ where: { id } });
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;
