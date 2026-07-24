/**
 * report-engine/calculator.ts
 *
 * Everything that turns raw counts into scored, ranked, status-labeled
 * numbers lives here. Nothing in this file reads Target.achieved from the
 * database directly for display — "Achieved" is always recomputed from the
 * live collections via CATEGORY_SOURCE_MAP, per the project requirement
 * that Achieved must never be manually entered. The stored Target.achieved
 * column is treated as a legacy/manual field that this engine supersedes,
 * not a source of truth (see reconcileStoredAchieved() below if you want
 * to keep it in sync for other parts of the app that still read it).
 */
import { Target } from "@prisma/client";
import { ALL_TARGET_CATEGORIES, STATUS_THRESHOLDS, TARGET_CATEGORY, TargetCategory, bandForPercent } from "./constants";
import { round2, safeDiv } from "./helpers";
import { DepartmentAggregate, InstitutionAggregate, KpiSummary, MonthWiseRow, OverallPerformance, TargetRow } from "./report-types";
import { ReportEngineError } from "./report-types";

/**
 * Maps a canonical target category to the aggregate field(s) that determine
 * "Achieved". Adding a new category means adding both a TARGET_CATEGORY
 * constant and an entry here — the two are validated to stay in sync by
 * validateCategoryMapCompleteness() in validator.ts.
 */
export const CATEGORY_SOURCE_MAP: Record<TargetCategory, (agg: DepartmentAggregate) => number> = {
  [TARGET_CATEGORY.PUBLICATIONS]: (agg) => agg.publicationCount,
  [TARGET_CATEGORY.PATENTS]: (agg) => agg.grantedPatentCount,
  [TARGET_CATEGORY.RESEARCH]: (agg) => agg.researchCount,
  [TARGET_CATEGORY.EVENTS]: (agg) => agg.eventCount,
  [TARGET_CATEGORY.STUDENTS]: (agg) => agg.studentCount,
  [TARGET_CATEGORY.FACULTY]: (agg) => agg.facultyCount,
  [TARGET_CATEGORY.PHD_SCHOLARS]: (agg) => agg.phdScholarCount,
};

export function computeAchievedForCategory(category: string, agg: DepartmentAggregate): number {
  const selector = CATEGORY_SOURCE_MAP[category as TargetCategory];
  if (!selector) {
    throw new ReportEngineError(
      `Unknown target category "${category}" — no auto-calculation rule registered in CATEGORY_SOURCE_MAP`,
      "UNKNOWN_TARGET_CATEGORY"
    );
  }
  return selector(agg);
}

/**
 * How far through the academic year "now" is, as a 0..1 fraction, used to
 * prorate a yearly target into a "target till this month" figure. June = 0,
 * the following May = 1.
 */
export function academicYearProgressFraction(asOfCalendarMonth0to11: number): number {
  const academicIndex = (asOfCalendarMonth0to11 + 7) % 12; // Jun->0 ... May->11
  return round2((academicIndex + 1) / 12);
}

export function computeTargetRows(
  targets: Target[],
  agg: DepartmentAggregate,
  asOfCalendarMonth0to11: number = new Date().getMonth()
): TargetRow[] {
  const progressFraction = academicYearProgressFraction(asOfCalendarMonth0to11);

  return targets.map((t, i) => {
    const achieved = computeAchievedForCategory(t.category, agg);
    const targetTillMonth = Math.round(t.yearly * progressFraction);
    const pending = Math.max(0, t.yearly - achieved);
    const achievementPct = round2(safeDiv(achieved, t.yearly) * 100);
    const prorateAchievementPct = round2(safeDiv(achieved, targetTillMonth || t.yearly) * 100);

    return {
      sno: i + 1,
      category: t.category,
      metric: t.category,
      yearlyTarget: t.yearly,
      targetTillMonth,
      achieved,
      pending,
      achievementPct,
      status: prorateAchievementPct >= STATUS_THRESHOLDS.ON_TRACK_PCT ? "ON TRACK" : "BEHIND",
    };
  });
}

/** For any category with no Target row yet, still return a row with target=0 so nothing is silently omitted */
export function computeTargetRowsWithFallback(
  targets: Target[],
  agg: DepartmentAggregate,
  categories: TargetCategory[] = ALL_TARGET_CATEGORIES,
  asOfCalendarMonth0to11: number = new Date().getMonth()
): TargetRow[] {
  const byCategory = new Map(targets.map((t) => [t.category, t]));
  const withFallback: Target[] = categories.map((cat) => {
    const existing = byCategory.get(cat);
    if (existing) return existing;
    return {
      id: `virtual-${cat}`,
      category: cat,
      yearly: 0,
      achieved: 0,
      departmentId: agg.department.id,
      year: new Date().getFullYear(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Target;
  });
  return computeTargetRows(withFallback, agg, asOfCalendarMonth0to11);
}

export function computePendingTargets(rows: TargetRow[]): TargetRow[] {
  return rows.filter((r) => r.pending > 0);
}

export function computeKpiSummary(agg: DepartmentAggregate): KpiSummary {
  return {
    publications: [
      { label: "Total Publications", value: agg.publicationCount },
      { label: "SCI Indexed", value: agg.sciPublicationCount },
      { label: "Scopus Indexed", value: agg.scopusPublicationCount },
    ],
    patents: [
      { label: "Total Patents", value: agg.patentCount },
      { label: "Granted", value: agg.grantedPatentCount },
      { label: "Filed / Pending", value: agg.filedPatentCount },
    ],
    research: [
      { label: "Research Projects", value: agg.researchCount },
      { label: "Ongoing", value: agg.ongoingResearchCount },
      { label: "PhD Scholars", value: agg.phdScholarCount },
    ],
    studentActivities: [
      { label: "Total Students", value: agg.studentCount },
      { label: "Events Conducted", value: agg.eventCount },
      { label: "Faculty Strength", value: agg.facultyCount },
    ],
  };
}

/**
 * Month-wise progress table. `dateGroupsByMetric` comes from
 * aggregator.groupByCalendarMonth() per collection — this function just
 * reshapes calendar-month buckets into the June->May academic-year row
 * layout the report template expects.
 */
export function computeMonthWise(
  metricGroups: Array<{ metric: string; byCalendarMonth: Map<number, number> }>
): MonthWiseRow[] {
  return metricGroups.map(({ metric, byCalendarMonth }) => {
    const months: (number | null)[] = [];
    for (let academicIdx = 0; academicIdx < 12; academicIdx++) {
      const calendarMonth = (academicIdx + 5) % 12; // academic idx0(Jun)->calendar 5
      months.push(byCalendarMonth.get(calendarMonth) ?? 0);
    }
    return { metric, months };
  });
}

export function computeOverallPerformance(
  targetRows: TargetRow[],
  departmentRankedList: Array<{ departmentId: string; overallAchievedPct: number }>,
  currentDepartmentId: string
): OverallPerformance {
  const totalTarget = targetRows.reduce((sum, r) => sum + r.yearlyTarget, 0);
  const totalAchieved = targetRows.reduce((sum, r) => sum + r.achieved, 0);
  const overallAchievedPct = round2(safeDiv(totalAchieved, totalTarget) * 100);

  const ranked = [...departmentRankedList].sort((a, b) => b.overallAchievedPct - a.overallAchievedPct);
  const rankIndex = ranked.findIndex((d) => d.departmentId === currentDepartmentId);

  return {
    overallTargetPct: 100,
    overallAchievedPct,
    overallStatusLabel: bandForPercent(overallAchievedPct),
    departmentRank: rankIndex >= 0 ? rankIndex + 1 : null,
    institutionRank: rankIndex >= 0 ? rankIndex + 1 : null,
    totalDepartmentsRanked: ranked.length || null,
  };
}

export function computeInstitutionTargetRollup(institution: InstitutionAggregate, asOfCalendarMonth0to11 = new Date().getMonth()): TargetRow[] {
  // Merge every department's targets for the same category into one institution-wide row.
  const byCategory = new Map<string, { yearly: number; achieved: number }>();

  for (const deptAgg of institution.departmentAggregates) {
    for (const t of deptAgg.targets) {
      const achieved = computeAchievedForCategory(t.category, deptAgg);
      const existing = byCategory.get(t.category) ?? { yearly: 0, achieved: 0 };
      existing.yearly += t.yearly;
      existing.achieved += achieved;
      byCategory.set(t.category, existing);
    }
  }

  const progressFraction = academicYearProgressFraction(asOfCalendarMonth0to11);
  let sno = 0;
  const rows: TargetRow[] = [];
  byCategory.forEach((v, category) => {
    sno += 1;
    const targetTillMonth = Math.round(v.yearly * progressFraction);
    const pending = Math.max(0, v.yearly - v.achieved);
    const achievementPct = round2(safeDiv(v.achieved, v.yearly) * 100);
    const prorateAchievementPct = round2(safeDiv(v.achieved, targetTillMonth || v.yearly) * 100);
    rows.push({
      sno,
      category,
      metric: category,
      yearlyTarget: v.yearly,
      targetTillMonth,
      achieved: v.achieved,
      pending,
      achievementPct,
      status: prorateAchievementPct >= STATUS_THRESHOLDS.ON_TRACK_PCT ? "ON TRACK" : "BEHIND",
    });
  });
  return rows;
}
