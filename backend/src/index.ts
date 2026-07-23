import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { initFirebase } from "./config/firebase";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { authenticate, enforceDepartmentScope } from "./middleware/auth";

import authRoutes from "./routes/auth";
import departmentRoutes from "./routes/departments";
import facultyRoutes from "./routes/faculty";
import publicationRoutes from "./routes/publications";
import patentRoutes from "./routes/patents";
import researchRoutes from "./routes/research";
import studentRoutes from "./routes/students";
import eventRoutes from "./routes/events";
import targetRoutes from "./routes/targets";
import reportRoutes from "./routes/reports";
import approvalRoutes from "./routes/approvals";
import signatureRoutes from "./routes/signatures";
import notificationRoutes from "./routes/notifications";
import userRoutes from "./routes/users";
import analyticsRoutes from "./routes/analytics";
import documentRoutes from "./routes/documents";

initFirebase();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (_req, res) => { res.json({ status: "ok", timestamp: new Date().toISOString() }); });

app.use("/api/auth", authRoutes);
app.use("/api/departments", authenticate, enforceDepartmentScope, departmentRoutes);
app.use("/api/faculty", authenticate, enforceDepartmentScope, facultyRoutes);
app.use("/api/publications", authenticate, enforceDepartmentScope, publicationRoutes);
app.use("/api/patents", authenticate, enforceDepartmentScope, patentRoutes);
app.use("/api/research", authenticate, enforceDepartmentScope, researchRoutes);
app.use("/api/students", authenticate, enforceDepartmentScope, studentRoutes);
app.use("/api/events", authenticate, enforceDepartmentScope, eventRoutes);
app.use("/api/targets", authenticate, enforceDepartmentScope, targetRoutes);
app.use("/api/reports", authenticate, enforceDepartmentScope, reportRoutes);
app.use("/api/approvals", authenticate, enforceDepartmentScope, approvalRoutes);
app.use("/api/signatures", authenticate, enforceDepartmentScope, signatureRoutes);
app.use("/api/notifications", authenticate, enforceDepartmentScope, notificationRoutes);
app.use("/api/users", authenticate, enforceDepartmentScope, userRoutes);
app.use("/api/analytics", authenticate, enforceDepartmentScope, analyticsRoutes);
app.use("/api/documents", authenticate, enforceDepartmentScope, documentRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`NIRF ERP Pro API running on port ${config.port}`);
});
