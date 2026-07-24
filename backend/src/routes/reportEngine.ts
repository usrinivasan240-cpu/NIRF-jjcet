import { Router, Request, Response } from "express";
import { JwtPayload } from "../types";
import {
  generateReport,
  ReportEngineError,
  REPORT_TYPES,
  INSTITUTION_WIDE_ROLES,
} from "../lib/report-engine";

const router = Router();

/**
 * POST /api/report-engine/generate
 * Body: { reportType, departmentId?, academicYear, asOfMonth? }
 * Mounted with `authenticate` only (see index.ts) — department/role access
 * is enforced inside generateReport() itself via validator.assertDepartmentAccess,
 * since a department-scoped user must still be ALLOWED to omit departmentId
 * (meaning "my department"), which the blanket enforceDepartmentScope
 * middleware used by other routes doesn't express.
 */
router.post("/generate", async (req: Request, res: Response) => {
  const user = (req as any).user as JwtPayload;
  try {
    const report = await generateReport(
      { ...req.body, generatedByUserId: user.userId, generatedByName: req.body.generatedByName || user.email },
      { userRole: user.role, userDepartmentId: user.departmentId ?? null }
    );
    res.json({ success: true, data: report });
  } catch (error) {
    if (error instanceof ReportEngineError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, code: error.code });
    }
    console.error("Error generating report:", error);
    res.status(500).json({ success: false, message: "Failed to generate report" });
  }
});

/**
 * POST /api/report-engine/preview
 * Identical to /generate — kept as a separate, stable endpoint name so the
 * frontend can request a non-final "preview" render without implying the
 * report was logged/saved, once report persistence (a Report/history model)
 * is added.
 */
router.post("/preview", async (req: Request, res: Response) => {
  const user = (req as any).user as JwtPayload;
  try {
    const report = await generateReport(
      { ...req.body, generatedByUserId: user.userId, generatedByName: req.body.generatedByName || user.email },
      { userRole: user.role, userDepartmentId: user.departmentId ?? null }
    );
    res.json({ success: true, data: report });
  } catch (error) {
    if (error instanceof ReportEngineError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, code: error.code });
    }
    console.error("Error previewing report:", error);
    res.status(500).json({ success: false, message: "Failed to preview report" });
  }
});

/**
 * GET /api/report-engine/templates
 * Returns which report types exist and whether the caller's role may
 * request them. Lets the frontend stop hardcoding REPORT_TYPES/access
 * arrays (see frontend/src/app/(dashboard)/reports/page.tsx) and instead
 * ask the backend, which is the actual source of truth for access rules.
 */
router.get("/templates", (req: Request, res: Response) => {
  const user = (req as any).user as JwtPayload;
  const isInstitutionWide = (INSTITUTION_WIDE_ROLES as readonly string[]).includes(user.role);

  const templates = Object.entries(REPORT_TYPES).map(([key, id]) => {
    const institutionOnly = id === REPORT_TYPES.COLLEGE_PERFORMANCE || id === REPORT_TYPES.NIRF;
    return {
      key,
      id,
      institutionOnly,
      available: institutionOnly ? isInstitutionWide : true,
    };
  });

  res.json({ success: true, data: templates });
});

/**
 * NOT YET IMPLEMENTED (deliberately): /export/pdf, /export/excel, /history, /download.
 * These need a persistence layer first — there's no Report/GeneratedReport
 * table in schema.prisma yet (only Document, which is close but models
 * uploaded files, not generated reports). Wiring these up against nothing
 * would mean silently faking history/export data, which the project spec
 * explicitly prohibits ("NO DUMMY DATA"). Flagging for a follow-up once
 * you decide whether generated reports should be persisted as Document
 * rows (reusing the existing approval workflow) or a new model.
 */

export default router;
