import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getDb } from "../config/firebase";

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

    const mockUser = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (mockUser) {
      const token = jwt.sign(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          departmentId: mockUser.departmentId,
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
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
            departmentId: mockUser.departmentId,
          },
        },
      });
      return;
    }

    const db = getDb();
    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .where("password", "==", password)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const firestoreUser = snapshot.docs[0].data();

    const token = jwt.sign(
      {
        id: snapshot.docs[0].id,
        email: firestoreUser.email,
        role: firestoreUser.role,
        departmentId: firestoreUser.departmentId || null,
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
          id: snapshot.docs[0].id,
          email: firestoreUser.email,
          name: firestoreUser.name,
          role: firestoreUser.role,
          departmentId: firestoreUser.departmentId || null,
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

    const mockUser = mockUsers.find((u) => u.id === decoded.id);
    if (mockUser) {
      res.json({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        departmentId: mockUser.departmentId,
      });
      return;
    }

    const db = getDb();
    const doc = await db.collection("users").doc(decoded.id).get();

    if (!doc.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const firestoreUser = doc.data()!;
    res.json({
      id: doc.id,
      email: firestoreUser.email,
      name: firestoreUser.name,
      role: firestoreUser.role,
      departmentId: firestoreUser.departmentId || null,
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
