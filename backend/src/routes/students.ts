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

    const students = await prisma.student.findMany({
      where,
      include: { department: true },
      orderBy: { name: "asc" },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && student.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { name, email, rollNumber, departmentId, program, year, semester, cgpa, status } = req.body;

    if (!name || !rollNumber || !departmentId) {
      res.status(400).json({ error: "Name, rollNumber, and departmentId are required" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) {
      res.status(403).json({ error: "Cannot create student in another department" });
      return;
    }

    const student = await prisma.student.create({
      data: { name, email, rollNumber, departmentId, program, year, semester, cgpa: cgpa ? parseFloat(cgpa) : null, status },
      include: { department: true },
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: "Failed to create student" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, rollNumber, departmentId, program, year, semester, cgpa, status } = req.body;

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const student = await prisma.student.update({
      where: { id },
      data: { name, email, rollNumber, departmentId, program, year, semester, cgpa: cgpa ? parseFloat(cgpa) : undefined, status },
      include: { department: true },
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Failed to update student" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.student.delete({ where: { id } });
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

export default router;
