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

    const publications = await prisma.publication.findMany({
      where,
      include: { faculty: { include: { department: true } } },
      orderBy: { year: "desc" },
    });
    res.json(publications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch publications" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const publication = await prisma.publication.findUnique({
      where: { id },
      include: { faculty: { include: { department: true } } },
    });

    if (!publication) {
      res.status(404).json({ error: "Publication not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && publication.faculty?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(publication);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch publication" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { title, authors, journal, year, volume, pages, doi, type, facultyId } = req.body;

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
      res.status(403).json({ error: "Cannot create publication for another department" });
      return;
    }

    const publication = await prisma.publication.create({
      data: { title, authors, journal, year, volume, pages, doi, type, facultyId },
      include: { faculty: { include: { department: true } } },
    });

    res.status(201).json(publication);
  } catch (error) {
    res.status(500).json({ error: "Failed to create publication" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, authors, journal, year, volume, pages, doi, type, facultyId } = req.body;

    const existing = await prisma.publication.findUnique({
      where: { id },
      include: { faculty: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Publication not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.faculty?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const publication = await prisma.publication.update({
      where: { id },
      data: { title, authors, journal, year, volume, pages, doi, type, facultyId },
      include: { faculty: { include: { department: true } } },
    });

    res.json(publication);
  } catch (error) {
    res.status(500).json({ error: "Failed to update publication" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.publication.findUnique({
      where: { id },
      include: { faculty: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Publication not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.faculty?.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.publication.delete({ where: { id } });
    res.json({ message: "Publication deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete publication" });
  }
});

export default router;
