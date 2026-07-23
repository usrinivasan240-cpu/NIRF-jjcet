import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, enforceDepartmentScope } from "../middleware/auth";
import bcrypt from "bcryptjs";

const router = Router();
const prisma = new PrismaClient();

const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  departmentId: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
};

router.get("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const departmentScope = (req as any).departmentScope;
    const where: any = {};

    if (departmentScope) {
      where.departmentId = departmentScope;
    }

    const users = await prisma.user.findMany({
      where,
      select: safeSelect,
      orderBy: { name: "asc" },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: safeSelect,
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && user.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, departmentId, phone } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "Name, email, password, and role are required" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && departmentId && departmentId !== departmentScope) {
      res.status(403).json({ error: "Cannot create user in another department" });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: "Email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, departmentId, phone },
      select: safeSelect,
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, departmentId, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const updateData: any = { name, email, role, departmentId, phone };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: safeSelect,
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/:id", authenticate, enforceDepartmentScope, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const departmentScope = (req as any).departmentScope;
    if (departmentScope && existing.departmentId !== departmentScope) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
