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

    const targets = await prisma.target.findMany({
      where,
      include: { department: true },
      orderBy: { academicYear: "desc" },
    });
    res.json(targets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch targets" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const target = await prisma.target.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!target) {
      res.status(404).json({ error: "Target not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && target.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(target);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch target" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { metric, targetValue, achievedValue, academicYear, category, departmentId, status } = req.body;

    if (!metric || !targetValue || !academicYear || !departmentId) {
      res.status(400).json({ error: "Metric, targetValue, academicYear, and departmentId are required" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) {
      res.status(403).json({ error: "Cannot create target for another department" });
      return;
    }

    const target = await prisma.target.create({
      data: {
        metric,
        targetValue: parseFloat(targetValue),
        achievedValue: achievedValue ? parseFloat(achievedValue) : null,
        academicYear,
        category,
        departmentId,
        status,
      },
      include: { department: true },
    });

    res.status(201).json(target);
  } catch (error) {
    res.status(500).json({ error: "Failed to create target" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { metric, targetValue, achievedValue, academicYear, category, departmentId, status } = req.body;

    const existing = await prisma.target.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Target not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const target = await prisma.target.update({
      where: { id },
      data: {
        metric,
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        achievedValue: achievedValue ? parseFloat(achievedValue) : undefined,
        academicYear,
        category,
        departmentId,
        status,
      },
      include: { department: true },
    });

    res.json(target);
  } catch (error) {
    res.status(500).json({ error: "Failed to update target" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.target.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Target not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.target.delete({ where: { id } });
    res.json({ message: "Target deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete target" });
  }
});

export default router;
