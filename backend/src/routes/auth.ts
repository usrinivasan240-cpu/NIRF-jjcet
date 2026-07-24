import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../middleware/auth";
import { Role } from "../types";

const router = Router();
const prisma = new PrismaClient();

// NOTE: departmentId here is the human-readable Department.code ("IT", "CSE", ...),
// NOT the Prisma Department.id (a uuid). It gets resolved to the real id at login
// time below — every downstream query (enforceDepartmentScope, the report engine,
// etc.) filters on Department.id, so shipping the code straight into the JWT
// silently broke department-scoped queries for every HOD/DEPARTMENT_STAFF login.
const mockUsers: Record<string, { password: string; name: string; role: Role; departmentCode?: string }> = {
  "admin@jjcet.edu": { password: "admin123", name: "Super Admin", role: Role.SUPER_ADMIN },
  "principal@jjcet.edu": { password: "principal123", name: "Dr. Rajesh Kumar", role: Role.PRINCIPAL },
  "vp@jjcet.edu": { password: "vp123", name: "Dr. Lakshmi Devi", role: Role.VICE_PRINCIPAL },
  "hod@jjcet.edu": { password: "hod123", name: "Vanitha Madam", role: Role.HOD, departmentCode: "IT" },
  "staff@jjcet.edu": { password: "staff123", name: "Ramesh Kumar", role: Role.DEPARTMENT_STAFF, departmentCode: "IT" },
};

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = mockUsers[email];
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  let departmentId: string | undefined;
  if (user.departmentCode) {
    const dept = await prisma.department.findUnique({ where: { code: user.departmentCode } });
    if (!dept) {
      return res.status(500).json({ success: false, message: `Configured department code "${user.departmentCode}" not found. Run the Prisma seed first.` });
    }
    departmentId = dept.id;
  }

  const token = generateToken({ userId: email, email, role: user.role, departmentId });
  res.json({ success: true, message: "Login successful", data: { token, user: { email, name: user.name, role: user.role, departmentId } } });
});

router.get("/profile", (req: Request, res: Response) => {
  res.json({ success: true, message: "Profile retrieved", data: { name: "Demo User", role: "HOD" } });
});

export default router;
