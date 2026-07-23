import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "nirf-jwt-secret-key-2024";

const mockUsers = [
  {
    id: "1",
    email: "admin@jjcet.edu",
    password: "admin123",
    name: "Admin User",
    role: "SUPER_ADMIN" as const,
    departmentId: null,
  },
  {
    id: "2",
    email: "principal@jjcet.edu",
    password: "principal123",
    name: "Principal",
    role: "PRINCIPAL" as const,
    departmentId: null,
  },
  {
    id: "3",
    email: "vp@jjcet.edu",
    password: "vp123",
    name: "Vice Principal",
    role: "VICE_PRINCIPAL" as const,
    departmentId: null,
  },
  {
    id: "4",
    email: "hod@jjcet.edu",
    password: "hod123",
    name: "HOD IT",
    role: "HOD" as const,
    departmentId: "dept-it-001",
  },
  {
    id: "5",
    email: "staff@jjcet.edu",
    password: "staff123",
    name: "Staff IT",
    role: "DEPARTMENT_STAFF" as const,
    departmentId: "dept-it-001",
  },
];

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/profile", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = mockUsers.find((u) => u.id === decoded.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
