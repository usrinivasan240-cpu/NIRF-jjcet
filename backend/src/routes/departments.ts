import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, enforceDepartmentScope } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

router.get("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        faculties: true,
        students: true,
      },
    });

    if (!department) {
      res.status(404).json({ error: "Department not found" });
      return;
    }

    res.json(department);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch department" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { name, code, description, headId } = req.body;

    if (!name || !code) {
      res.status(400).json({ error: "Name and code are required" });
      return;
    }

    const department = await prisma.department.create({
      data: { name, code, description, headId },
    });

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ error: "Failed to create department" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, description, headId } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: { name, code, description, headId },
    });

    res.json(department);
  } catch (error) {
    res.status(500).json({ error: "Failed to update department" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete department" });
  }
});

export default router;
