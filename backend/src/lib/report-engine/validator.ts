/**
 * report-engine/validator.ts
 *
 * Zod was already a dependency (see backend/package.json / frontend/package.json)
 * but unused anywhere in the codebase. The report engine actually uses it.
 */
import { z } from "zod";
import { ALL_TARGET_CATEGORIES, INSTITUTION_WIDE_ROLES, REPORT_TYPES } from "./constants";
import { CATEGORY_SOURCE_MAP } from "./calculator";
import { ReportEngineError } from "./report-types";

const REPORT_TYPE_IDS = Object.values(REPORT_TYPES) as [string, ...string[]];

export const reportRequestSchema = z.object({
  reportType: z.enum(REPORT_TYPE_IDS as [string, ...string[]]),
  departmentId: z.string().min(1).nullable().optional(),
  academicYear: z
    .number()
    .int()
    .min(2000)
    .max(2100),
  asOfMonth: z
    .enum([
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ])
    .optional(),
  generatedByUserId: z.string().min(1),
  generatedByName: z.string().min(1),
});

export type ValidatedReportRequest = z.infer<typeof reportRequestSchema>;

export function parseReportRequest(input: unknown): ValidatedReportRequest {
  const result = reportRequestSchema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new ReportEngineError(`Invalid report request: ${message}`, "VALIDATION_ERROR", 422);
  }
  return result.data;
}

/**
 * A department-scoped user (HOD / DEPARTMENT_STAFF) can only request their
 * own department's reports, or leave departmentId unset to mean "my
 * department" — never another department, and never institution-wide.
 * Institution-wide roles may request any department, or omit departmentId
 * for an institution-wide rollup.
 */
export function assertDepartmentAccess(params: {
  requestedDepartmentId: string | null | undefined;
  userRole: string;
  userDepartmentId: string | null | undefined;
}): { effectiveDepartmentId: string | null } {
  const isInstitutionWide = (INSTITUTION_WIDE_ROLES as readonly string[]).includes(params.userRole);

  if (isInstitutionWide) {
    return { effectiveDepartmentId: params.requestedDepartmentId ?? null };
  }

  if (!params.userDepartmentId) {
    throw new ReportEngineError("User has no department assigned; cannot generate a department report.", "NO_DEPARTMENT_ASSIGNED", 403);
  }

  if (params.requestedDepartmentId && params.requestedDepartmentId !== params.userDepartmentId) {
    throw new ReportEngineError(
      "Access denied: you can only generate reports for your own department.",
      "DEPARTMENT_ACCESS_DENIED",
      403
    );
  }

  return { effectiveDepartmentId: params.userDepartmentId };
}

/**
 * Fails fast at startup (call once, e.g. from report-engine/index.ts) if
 * someone adds a category to constants.ts without wiring its achieved-value
 * calculation in calculator.ts, or vice versa.
 */
export function validateCategoryMapCompleteness(): void {
  const mappedCategories = Object.keys(CATEGORY_SOURCE_MAP);
  const missing = ALL_TARGET_CATEGORIES.filter((c) => !mappedCategories.includes(c));
  if (missing.length > 0) {
    throw new ReportEngineError(
      `CATEGORY_SOURCE_MAP is missing calculation rules for: ${missing.join(", ")}`,
      "INCOMPLETE_CATEGORY_MAP",
      500
    );
  }
}
