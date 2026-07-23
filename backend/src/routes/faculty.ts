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

    const faculties = await prisma.faculty.findMany({
      where,
      include: { department: true },
      orderBy: { name: "asc" },
    });
    res.json(faculties);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch faculties" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: { department: true, publications: true, patents: true },
    });

    if (!faculty) {
      res.status(404).json({ error: "Faculty not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && faculty.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch faculty" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, designation, departmentId, qualification, experience, specialization } = req.body;

    if (!name || !email || !departmentId) {
      res.status(400).json({ error: "Name, email, and departmentId are required" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) {
      res.status(403).json({ error: "Cannot create faculty in another department" });
      return;
    }

    const faculty = await prisma.faculty.create({
      data: { name, email, phone, designation, departmentId, qualification, experience, specialization },
      include: { department: true },
    });

    res.status(201).json(faculty);
  } catch (error) {
    res.status(500).json({ error: "Failed to create faculty" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, designation, departmentId, qualification, experience, specialization } = req.body;

    const existing = await prisma.faculty.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Faculty not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const faculty = await prisma.faculty.update({
      where: { id },
      data: { name, email, phone, designation, departmentId, qualification, experience, specialization },
      include: { department: true },
    });

    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: "Failed to update faculty" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.faculty.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Faculty not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.faculty.delete({ where: { id } });
    res.json({ message: "Faculty deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete faculty" });
  }
});

export default router;
