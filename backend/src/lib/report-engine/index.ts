/**
 * report-engine/index.ts
 *
 * Public entry point. A route handler (e.g. a future
 * backend/src/routes/reportEngine.ts on POST /api/report-engine/generate)
 * should only ever import from here — never reach into fetcher/aggregator/
 * calculator directly. That keeps every consumer going through the same
 * validation + access-control path.
 *
 * Usage:
 *   import { generateReport } from "../lib/report-engine";
 *
 *   const report = await generateReport(req.body, {
 *     userRole: user.role,
 *     userDepartmentId: user.departmentId ?? null,
 *   });
 */
import { buildDepartmentReport, buildInstitutionReport } from "./report-builder";
import { INSTITUTION_WIDE_ROLES, REPORT_TYPES } from "./constants";
import { assertDepartmentAccess, parseReportRequest, validateCategoryMapCompleteness } from "./validator";
import { DepartmentReportData, InstitutionReportData, ReportRequestParams } from "./report-types";

// Fail fast at import time if a category was added to constants.ts without a
// matching calculation rule in calculator.ts (or vice versa).
validateCategoryMapCompleteness();

export interface GenerateReportAuthContext {
  userRole: string;
  userDepartmentId: string | null;
}

const INSTITUTION_ONLY_REPORT_TYPES: string[] = [REPORT_TYPES.COLLEGE_PERFORMANCE, REPORT_TYPES.NIRF];

export async function generateReport(
  rawInput: unknown,
  auth: GenerateReportAuthContext
): Promise<DepartmentReportData | InstitutionReportData> {
  const validated = parseReportRequest(rawInput);

  const { effectiveDepartmentId } = assertDepartmentAccess({
    requestedDepartmentId: validated.departmentId,
    userRole: auth.userRole,
    userDepartmentId: auth.userDepartmentId,
  });

  const isInstitutionOnlyReport = INSTITUTION_ONLY_REPORT_TYPES.includes(validated.reportType);

  if (isInstitutionOnlyReport && !(INSTITUTION_WIDE_ROLES as readonly string[]).includes(auth.userRole)) {
    throw Object.assign(new Error(`Report type "${validated.reportType}" requires an institution-wide role.`), {
      code: "INSTITUTION_REPORT_FORBIDDEN",
      statusCode: 403,
    });
  }

  const params: ReportRequestParams = {
    reportType: validated.reportType as ReportRequestParams["reportType"],
    departmentId: effectiveDepartmentId,
    academicYear: validated.academicYear,
    asOfMonth: validated.asOfMonth,
    generatedByUserId: validated.generatedByUserId,
    generatedByName: validated.generatedByName,
  };

  if (isInstitutionOnlyReport || effectiveDepartmentId === null) {
    return buildInstitutionReport(params);
  }
  return buildDepartmentReport(params);
}

export * from "./constants";
export * from "./report-types";
export { fetchReportData, reportEnginePrisma, disconnectReportEngine } from "./fetcher";
export { buildDepartmentAggregate, buildAllDepartmentAggregates, buildInstitutionAggregate } from "./aggregator";
export {
  computeAchievedForCategory,
  computeTargetRows,
  computeTargetRowsWithFallback,
  computeKpiSummary,
  computeMonthWise,
  computeOverallPerformance,
  computeInstitutionTargetRollup,
  CATEGORY_SOURCE_MAP,
} from "./calculator";
export { buildDepartmentReport, buildInstitutionReport } from "./report-builder";
export { formatPercent, buildReportHeader, statusColor, bandColor } from "./formatter";
export { parseReportRequest, assertDepartmentAccess, validateCategoryMapCompleteness } from "./validator";
