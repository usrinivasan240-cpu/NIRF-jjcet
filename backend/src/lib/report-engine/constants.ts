/**
 * report-engine/constants.ts
 *
 * Single source of truth for every "magic string" the report engine uses.
 * Nothing in fetcher/aggregator/calculator/formatter should hardcode a
 * category name, month label, or threshold outside of this file.
 */

/**
 * Canonical target categories. These MUST match the values written into
 * `Target.category` (see backend/prisma/seed.ts — "Publications", "Patents",
 * "Events" already follow this convention). Any new category needs a row
 * here AND a matching selector in calculator.ts's CATEGORY_SOURCE_MAP.
 */
export const TARGET_CATEGORY = {
  PUBLICATIONS: "Publications",
  PATENTS: "Patents",
  RESEARCH: "Research",
  EVENTS: "Events",
  STUDENTS: "Students",
  FACULTY: "Faculty",
  PHD_SCHOLARS: "PhD Scholars",
} as const;

export type TargetCategory = (typeof TARGET_CATEGORY)[keyof typeof TARGET_CATEGORY];

export const ALL_TARGET_CATEGORIES: TargetCategory[] = Object.values(TARGET_CATEGORY);

/**
 * Academic year runs June -> May at JJCET (see the existing month-wise
 * table in reportGenerator.ts). Index 0 = June, index 11 = May.
 */
export const ACADEMIC_YEAR_MONTHS = [
  "June", "July", "August", "September", "October", "November",
  "December", "January", "February", "March", "April", "May",
] as const;

export const ACADEMIC_YEAR_MONTH_SHORT = [
  "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May",
] as const;

/** Calendar month index (0=Jan..11=Dec) -> position within the academic year (0=Jun..11=May) */
export function calendarMonthToAcademicIndex(calendarMonthIndex0to11: number): number {
  return (calendarMonthIndex0to11 + 7) % 12; // Jun(5)->0, Jan(0)->7, May(4)->11
}

/** Months with no working activity (exams / vacation) — excluded from month-wise progress notes */
export const NON_WORKING_MONTHS: readonly string[] = ["April", "May"];

/** Achievement-percentage thresholds used to classify a target's status */
export const STATUS_THRESHOLDS = {
  ON_TRACK_PCT: 80, // achieved >= 80% of (time-prorated) target => ON TRACK
} as const;

export type TargetStatus = "ON TRACK" | "BEHIND";

/** Overall department/institution performance bands (used for Section 7 style summaries) */
export const PERFORMANCE_BANDS = [
  { min: 90, label: "Excellent" },
  { min: 75, label: "Good" },
  { min: 60, label: "Average" },
  { min: 40, label: "Needs Improvement" },
  { min: 0, label: "Critical" },
] as const;

export function bandForPercent(pct: number): string {
  for (const b of PERFORMANCE_BANDS) {
    if (pct >= b.min) return b.label;
  }
  return PERFORMANCE_BANDS[PERFORMANCE_BANDS.length - 1].label;
}

/** Roles allowed to see institution-wide (all-department) reports vs their own department only */
export const INSTITUTION_WIDE_ROLES = ["SUPER_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"] as const;

export const REPORT_TYPES = {
  DEPARTMENT_MONTHLY: "dept_monthly",
  DEPARTMENT_ANNUAL: "dept_annual",
  TARGET_ACHIEVEMENT: "target_achievement",
  PUBLICATIONS: "publications",
  PATENTS: "patents",
  RESEARCH: "research",
  FACULTY_PERFORMANCE: "faculty_performance",
  COLLEGE_PERFORMANCE: "college_performance",
  NIRF: "nirf",
} as const;

export type ReportTypeId = (typeof REPORT_TYPES)[keyof typeof REPORT_TYPES];

/** Default page-fit limits so PDF/print output never overflows A4 (see report-builder truncation) */
export const MAX_ROWS = {
  RECENT_PUBLICATIONS: 10,
  RECENT_PATENTS: 10,
  PENDING_TARGETS: 15,
} as const;
