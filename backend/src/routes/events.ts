import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, enforceDepartmentScope } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

router.get("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const departmentScope = (req as any).departmentScope;
    const where: any = {};

    if (departmentScope) {
      where.departmentId = departmentScope;
    }

    const events = await prisma.event.findMany({
      where,
      include: { department: true },
      orderBy: { startDate: "desc" },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && event.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { title, description, type, startDate, endDate, venue, organizer, participants, departmentId, status } = req.body;

    if (!title || !startDate || !departmentId) {
      res.status(400).json({ error: "Title, startDate, and departmentId are required" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) {
      res.status(403).json({ error: "Cannot create event for another department" });
      return;
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        venue,
        organizer,
        participants: participants ? parseInt(participants) : null,
        departmentId,
        status,
      },
      include: { department: true },
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type, startDate, endDate, venue, organizer, participants, departmentId, status } = req.body;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        type,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        venue,
        organizer,
        participants: participants ? parseInt(participants) : undefined,
        departmentId,
        status,
      },
      include: { department: true },
    });

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.event.delete({ where: { id } });
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
