/**
 * report-engine/report-builder.ts
 *
 * The orchestration layer. Nothing here queries Prisma or does arithmetic
 * directly — it calls fetcher/aggregator/calculator/formatter in sequence
 * and assembles their outputs into the DepartmentReportData /
 * InstitutionReportData shapes that a PDF/print renderer consumes.
 *
 * Per the project requirement, remarks and signatures are ALWAYS returned
 * empty/unsigned here — this engine never auto-fills a remark or a name
 * into a signature block. Those are filled in later by the actual
 * HOD/VP/Principal through the approvals workflow (see
 * backend/src/routes/approvals.ts), not generated.
 */
import { buildAllDepartmentAggregates, buildDepartmentAggregate, buildInstitutionAggregate, groupByCalendarMonth } from "./aggregator";
import { ALL_TARGET_CATEGORIES } from "./constants";
import {
  computeInstitutionTargetRollup,
  computeKpiSummary,
  computeMonthWise,
  computeOverallPerformance,
  computePendingTargets,
  computeTargetRowsWithFallback,
} from "./calculator";
import { fetchReportData, FetchScope } from "./fetcher";
import { buildReportHeader } from "./formatter";
import { bandForPercent } from "./constants";
import { round2, safeDiv } from "./helpers";
import {
  DepartmentReportData,
  InstitutionReportData,
  RawDataBundle,
  ReportEngineError,
  ReportRequestParams,
  SignatureBlock,
} from "./report-types";

const EMPTY_SIGNATURE = (designation: string): SignatureBlock => ({
  name: "",
  designation,
  date: "",
  enabled: false,
});

function emptySignatures() {
  return {
    hod: EMPTY_SIGNATURE("Head of the Department"),
    vp: EMPTY_SIGNATURE("Vice Principal"),
    principal: EMPTY_SIGNATURE("Principal"),
  };
}

function emptyRemarks() {
  return { hod: "", vp: "", principal: "" };
}

function monthNameToIndex(monthName: string | undefined): number {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const idx = monthName ? months.indexOf(monthName) : -1;
  return idx >= 0 ? idx : new Date().getMonth();
}

export async function buildDepartmentReport(params: ReportRequestParams): Promise<DepartmentReportData> {
  if (!params.departmentId) {
    throw new ReportEngineError("departmentId is required to build a department-level report", "MISSING_DEPARTMENT_ID", 422);
  }

  const scope: FetchScope = { departmentId: params.departmentId, academicYear: params.academicYear };
  const bundle = await fetchReportData(scope);

  const department = bundle.departments.find((d) => d.id === params.departmentId);
  if (!department) {
    throw new ReportEngineError(`Department ${params.departmentId} not found`, "DEPARTMENT_NOT_FOUND", 404);
  }

  return assembleDepartmentReport(department.id, bundle, params);
}

/** Shared by buildDepartmentReport() and the per-row build inside buildInstitutionReport() so ranking uses identical logic everywhere. */
function assembleDepartmentReport(
  departmentId: string,
  bundle: RawDataBundle,
  params: ReportRequestParams,
  precomputedRankList?: Array<{ departmentId: string; overallAchievedPct: number }>
): DepartmentReportData {
  const department = bundle.departments.find((d) => d.id === departmentId)!;
  const agg = buildDepartmentAggregate(department, bundle);
  const asOfMonthIndex = monthNameToIndex(params.asOfMonth);

  const targetRows = computeTargetRowsWithFallback(agg.targets, agg, ALL_TARGET_CATEGORIES, asOfMonthIndex);
  const pendingTargets = computePendingTargets(targetRows);
  const kpiSummary = computeKpiSummary(agg);

  const monthWise = computeMonthWise([
    { metric: "Publications", byCalendarMonth: sumByCalendarMonth(bundle.publications, department.id, (p) => p.publicationDate) },
    { metric: "Patents Filed", byCalendarMonth: sumByCalendarMonth(bundle.patents, department.id, (p) => p.filedDate) },
    { metric: "Events Conducted", byCalendarMonth: sumByCalendarMonth(bundle.events, department.id, (e) => e.date) },
  ]);

  const rankList =
    precomputedRankList ??
    buildAllDepartmentAggregates(bundle).map((a) => ({
      departmentId: a.department.id,
      overallAchievedPct: overallAchievedPctOf(computeTargetRowsWithFallback(a.targets, a, ALL_TARGET_CATEGORIES, asOfMonthIndex)),
    }));

  const overallPerformance = computeOverallPerformance(targetRows, rankList, department.id);

  return {
    header: buildReportHeader({
      reportType: params.reportType,
      academicYearStart: params.academicYear,
      generatedByName: params.generatedByName,
    }),
    departmentInfo: {
      deptName: department.name,
      deptCode: department.code,
      month: params.asOfMonth ?? new Date().toLocaleDateString("en-US", { month: "long" }),
      totalFaculty: agg.facultyCount,
      totalStudents: agg.studentCount,
      hodName: "", // filled by the approvals workflow, not auto-generated
      contact: "",
      reportStatus: "DRAFT",
      submittedDate: "",
    },
    overallPerformance: {
      ...overallPerformance,
      overallStatusLabel: bandForPercent(overallPerformance.overallAchievedPct),
    },
    targetVsAchievement: targetRows,
    detailedSummary: kpiSummary,
    monthWise,
    pendingTargets,
    remarks: emptyRemarks(),
    signatures: emptySignatures(),
  };
}

function overallAchievedPctOf(rows: { yearlyTarget: number; achieved: number }[]): number {
  const totalTarget = rows.reduce((s, r) => s + r.yearlyTarget, 0);
  const totalAchieved = rows.reduce((s, r) => s + r.achieved, 0);
  return round2(safeDiv(totalAchieved, totalTarget) * 100);
}

function sumByCalendarMonth<T extends { departmentId?: string | null }>(
  items: T[],
  departmentId: string,
  dateFn: (item: T) => string | null | undefined
): Map<number, number> {
  const deptItems = items.filter((i) => i.departmentId === departmentId);
  const grouped = groupByCalendarMonth(deptItems, dateFn);
  const counts = new Map<number, number>();
  grouped.forEach((bucket, month) => counts.set(month, bucket.length));
  return counts;
}

export async function buildInstitutionReport(params: ReportRequestParams): Promise<InstitutionReportData> {
  const scope: FetchScope = { departmentId: null, academicYear: params.academicYear };
  const bundle = await fetchReportData(scope);
  const institution = buildInstitutionAggregate(bundle, params.academicYear);
  const asOfMonthIndex = monthNameToIndex(params.asOfMonth);

  const rankList = institution.departmentAggregates.map((a) => ({
    departmentId: a.department.id,
    overallAchievedPct: overallAchievedPctOf(computeTargetRowsWithFallback(a.targets, a, ALL_TARGET_CATEGORIES, asOfMonthIndex)),
  }));

  const departmentRows = institution.departmentAggregates.map((agg) => {
    const targetVsAchievement = computeTargetRowsWithFallback(agg.targets, agg, ALL_TARGET_CATEGORIES, asOfMonthIndex);
    const overallAchievedPct = overallAchievedPctOf(targetVsAchievement);
    return {
      department: agg.department,
      aggregate: agg,
      targetVsAchievement,
      overallAchievedPct,
      statusLabel: bandForPercent(overallAchievedPct),
    };
  });

  return {
    header: buildReportHeader({
      reportType: params.reportType,
      academicYearStart: params.academicYear,
      generatedByName: params.generatedByName,
    }),
    departmentRows,
    institutionTotals: institution.totals,
    institutionTargetVsAchievement: computeInstitutionTargetRollup(institution, asOfMonthIndex),
    remarks: emptyRemarks(),
    signatures: emptySignatures(),
  };
}
