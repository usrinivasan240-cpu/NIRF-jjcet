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

    const documents = await prisma.document.findMany({
      where,
      include: { department: true, uploader: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: { department: true, uploader: { select: { id: true, name: true, email: true } } },
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && document.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { title, description, fileName, fileUrl, fileType, fileSize, category, departmentId } = req.body;

    if (!title || !fileName || !fileUrl || !departmentId) {
      res.status(400).json({ error: "Title, fileName, fileUrl, and departmentId are required" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId !== departmentScope) {
      res.status(403).json({ error: "Cannot upload document to another department" });
      return;
    }

    const user = (req as any).user;

    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileName,
        fileUrl,
        fileType,
        fileSize: fileSize ? parseInt(fileSize) : null,
        category,
        departmentId,
        uploaderId: user.id,
      },
      include: { department: true, uploader: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: "Failed to create document" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, fileName, fileUrl, fileType, fileSize, category, departmentId } = req.body;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        title,
        description,
        fileName,
        fileUrl,
        fileType,
        fileSize: fileSize ? parseInt(fileSize) : undefined,
        category,
        departmentId,
      },
      include: { department: true, uploader: { select: { id: true, name: true, email: true } } },
    });

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: "Failed to update document" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.document.delete({ where: { id } });
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete document" });
  }
});

export default router;
