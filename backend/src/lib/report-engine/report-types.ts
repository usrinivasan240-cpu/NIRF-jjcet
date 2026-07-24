/**
 * report-engine/report-types.ts
 *
 * Strict types for the report engine. Replaces the `any`-typed ReportData
 * shape in frontend/src/lib/reportGenerator.ts with real interfaces backed
 * by the actual Prisma schema (backend/prisma/schema.prisma).
 */
import type {
  Department,
  Faculty,
  Publication,
  Patent,
  Research,
  PhdScholar,
  Student,
  Event,
  Target,
} from "@prisma/client";

import type { TargetStatus, ReportTypeId } from "./constants";

/** What the caller asks the engine to build */
export interface ReportRequestParams {
  reportType: ReportTypeId;
  /** null/undefined = institution-wide (only permitted for INSTITUTION_WIDE_ROLES) */
  departmentId?: string | null;
  /** Academic year, e.g. 2025 means AY "2025-26" (June 2025 - May 2026) */
  academicYear: number;
  /** Calendar month name, required for "till this month" progress calcs */
  asOfMonth?: string;
  generatedByUserId: string;
  generatedByName: string;
}

/** Raw data pulled once from Prisma — nothing in here is pre-aggregated */
export interface RawDataBundle {
  departments: Department[];
  faculties: Faculty[];
  publications: Publication[];
  patents: Patent[];
  research: Research[];
  phdScholars: PhdScholar[];
  students: Student[];
  events: Event[];
  targets: Target[];
  fetchedAt: Date;
}

/** Per-department rollup computed by aggregator.ts */
export interface DepartmentAggregate {
  department: Department;
  facultyCount: number;
  studentCount: number;
  publicationCount: number;
  sciPublicationCount: number;
  scopusPublicationCount: number;
  patentCount: number;
  grantedPatentCount: number;
  filedPatentCount: number;
  researchCount: number;
  ongoingResearchCount: number;
  phdScholarCount: number;
  eventCount: number;
  targets: Target[];
}

/** Institution-level rollup: sum/derive across every DepartmentAggregate */
export interface InstitutionAggregate {
  academicYear: number;
  departmentAggregates: DepartmentAggregate[];
  totals: Omit<DepartmentAggregate, "department" | "targets">;
}

export interface TargetRow {
  sno: number;
  category: string;
  metric: string;
  yearlyTarget: number;
  targetTillMonth: number;
  achieved: number;
  pending: number;
  achievementPct: number; // numeric, formatter.ts turns this into "xx.xx%"
  status: TargetStatus;
}

export interface KpiItem {
  label: string;
  value: number;
}

export interface KpiSummary {
  publications: KpiItem[];
  patents: KpiItem[];
  research: KpiItem[];
  studentActivities: KpiItem[];
}

export interface MonthWiseRow {
  metric: string;
  months: (number | null)[]; // 12 entries, June..May academic order; null = no data / non-working month
}

export interface ReportHeader {
  reportId: string;
  reportType: string;
  reportTypeLabel: string;
  academicYear: string; // formatted "2025-26"
  generatedOn: string;
  generatedAt: string;
  generatedBy: string;
}

export interface DepartmentInfo {
  deptName: string;
  deptCode: string;
  month: string;
  totalFaculty: number;
  totalStudents: number;
  hodName: string;
  contact: string;
  reportStatus: string;
  submittedDate: string;
}

export interface OverallPerformance {
  overallTargetPct: number;
  overallAchievedPct: number;
  overallStatusLabel: string; // Excellent/Good/Average/Needs Improvement/Critical
  departmentRank: number | null;
  institutionRank: number | null;
  totalDepartmentsRanked: number | null;
}

/** Fully assembled, render-ready department report */
export interface DepartmentReportData {
  header: ReportHeader;
  departmentInfo: DepartmentInfo;
  overallPerformance: OverallPerformance;
  targetVsAchievement: TargetRow[];
  detailedSummary: KpiSummary;
  monthWise: MonthWiseRow[];
  pendingTargets: TargetRow[];
  remarks: {
    hod: string;
    vp: string;
    principal: string;
  };
  signatures: {
    hod: SignatureBlock;
    vp: SignatureBlock;
    principal: SignatureBlock;
  };
}

export interface SignatureBlock {
  name: string;
  designation: string;
  date: string;
  userId?: string;
  enabled: boolean;
}

/** Institution-wide report (college_performance / nirf) — one row per department + totals */
export interface InstitutionReportData {
  header: ReportHeader;
  departmentRows: Array<{
    department: Department;
    aggregate: DepartmentAggregate;
    targetVsAchievement: TargetRow[];
    overallAchievedPct: number;
    statusLabel: string;
  }>;
  institutionTotals: InstitutionAggregate["totals"];
  institutionTargetVsAchievement: TargetRow[];
  remarks: {
    hod: string;
    vp: string;
    principal: string;
  };
  signatures: {
    hod: SignatureBlock;
    vp: SignatureBlock;
    principal: SignatureBlock;
  };
}

export class ReportEngineError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode = 400) {
    super(message);
    this.name = "ReportEngineError";
  }
}
