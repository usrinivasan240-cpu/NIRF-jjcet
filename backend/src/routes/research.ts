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
      where.faculty = { departmentId: departmentScope };
    }

    const research = await prisma.research.findMany({
      where,
      include: { faculty: { include: { department: true } } },
      orderBy: { startDate: "desc" },
    });
    res.json(research);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch research projects" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.research.findUnique({
      where: { id },
      include: { faculty: { include: { department: true } } },
    });

    if (!project) {
      res.status(404).json({ error: "Research project not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && project.faculty?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch research project" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { title, description, fundingAgency, grantAmount, startDate, endDate, status, type, facultyId } = req.body;

    if (!title || !facultyId) {
      res.status(400).json({ error: "Title and facultyId are required" });
      return;
    }

    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty) {
      res.status(404).json({ error: "Faculty not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && faculty.departmentId !== departmentScope) {
      res.status(403).json({ error: "Cannot create research for another department" });
      return;
    }

    const project = await prisma.research.create({
      data: {
        title,
        description,
        fundingAgency,
        grantAmount: grantAmount ? parseFloat(grantAmount) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status,
        type,
        facultyId,
      },
      include: { faculty: { include: { department: true } } },
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to create research project" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, fundingAgency, grantAmount, startDate, endDate, status, type, facultyId } = req.body;

    const existing = await prisma.research.findUnique({
      where: { id },
      include: { faculty: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Research project not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.faculty?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const project = await prisma.research.update({
      where: { id },
      data: {
        title,
        description,
        fundingAgency,
        grantAmount: grantAmount ? parseFloat(grantAmount) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        type,
        facultyId,
      },
      include: { faculty: { include: { department: true } } },
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to update research project" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.research.findUnique({
      where: { id },
      include: { faculty: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Research project not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.faculty?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.research.delete({ where: { id } });
    res.json({ message: "Research project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete research project" });
  }
});

export default router;
