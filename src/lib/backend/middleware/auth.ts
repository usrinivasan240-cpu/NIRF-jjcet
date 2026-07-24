import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { JwtPayload, Role } from "../types";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const enforceDepartmentScope = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as JwtPayload;
  if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
  if ([Role.SUPER_ADMIN, Role.PRINCIPAL, Role.VICE_PRINCIPAL].includes(user.role)) {
    (req as any).departmentScope = null;
    return next();
  }
  if (!user.departmentId) {
    return res.status(403).json({ success: false, message: "Access Denied. No department assigned." });
  }
  (req as any).departmentScope = user.departmentId;
  next();
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as any);
};
