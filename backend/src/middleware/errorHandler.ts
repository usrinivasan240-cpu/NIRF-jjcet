import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err.message);
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || "Internal Server Error" });
};

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
};
