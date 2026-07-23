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

    const patents = await prisma.patent.findMany({
      where,
      include: { faculty: { include: { department: true } } },
      orderBy: { filingDate: "desc" },
    });
    res.json(patents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patents" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patent = await prisma.patent.findUnique({
      where: { id },
      include: { faculty: { include: { department: true } } },
    });

    if (!patent) {
      res.status(404).json({ error: "Patent not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && patent.faculty?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(patent);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patent" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { title, inventors, filingDate, grantDate, patentNumber, status, type, facultyId } = req.body;

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
      res.status(403).json({ error: "Cannot create patent for another department" });
      return;
    }

    const patent = await prisma.patent.create({
      data: { title, inventors, filingDate: new Date(filingDate), grantDate: grantDate ? new Date(grantDate) : null, patentNumber, status, type, facultyId },
      include: { faculty: { include: { department: true } } },
    });

    res.status(201).json(patent);
  } catch (error) {
    res.status(500).json({ error: "Failed to create patent" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, inventors, filingDate, grantDate, patentNumber, status, type, facultyId } = req.body;

    const existing = await prisma.patent.findUnique({
      where: { id },
      include: { faculty: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Patent not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.faculty?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const patent = await prisma.patent.update({
      where: { id },
      data: { title, inventors, filingDate: filingDate ? new Date(filingDate) : undefined, grantDate: grantDate ? new Date(grantDate) : undefined, patentNumber, status, type, facultyId },
      include: { faculty: { include: { department: true } } },
    });

    res.json(patent);
  } catch (error) {
    res.status(500).json({ error: "Failed to update patent" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.patent.findUnique({
      where: { id },
      include: { faculty: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Patent not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.faculty?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.patent.delete({ where: { id } });
    res.json({ message: "Patent deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete patent" });
  }
});

export default router;
