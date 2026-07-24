/**
 * report-engine/formatter.ts
 *
 * Pure presentation formatting. calculator.ts produces numeric values;
 * this file is the only place that turns them into display strings, so
 * template-engine/report-builder never re-implement rounding or date
 * formatting themselves.
 */
import { academicYearLabel, formatDateIN, formatTimeIN, generateReportId } from "./helpers";
import { REPORT_TYPES } from "./constants";
import { ReportHeader, TargetRow } from "./report-types";

const REPORT_TYPE_LABELS: Record<string, string> = {
  [REPORT_TYPES.DEPARTMENT_MONTHLY]: "Department Monthly Performance Report",
  [REPORT_TYPES.DEPARTMENT_ANNUAL]: "Department Annual Report",
  [REPORT_TYPES.TARGET_ACHIEVEMENT]: "Target Achievement Report",
  [REPORT_TYPES.PUBLICATIONS]: "Publication Report",
  [REPORT_TYPES.PATENTS]: "Patent Report",
  [REPORT_TYPES.RESEARCH]: "Research Report",
  [REPORT_TYPES.FACULTY_PERFORMANCE]: "Faculty Performance Report",
  [REPORT_TYPES.COLLEGE_PERFORMANCE]: "College Performance Report",
  [REPORT_TYPES.NIRF]: "NIRF Report",
};

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatTargetRowForDisplay(row: TargetRow): TargetRow & { achievementPctLabel: string } {
  return { ...row, achievementPctLabel: formatPercent(row.achievementPct) } as TargetRow & { achievementPctLabel: string };
}

export function buildReportHeader(params: {
  reportType: string;
  academicYearStart: number;
  generatedByName: string;
}): ReportHeader {
  const now = new Date();
  return {
    reportId: generateReportId(),
    reportType: params.reportType,
    reportTypeLabel: REPORT_TYPE_LABELS[params.reportType] ?? params.reportType,
    academicYear: academicYearLabel(params.academicYearStart),
    generatedOn: formatDateIN(now),
    generatedAt: `${formatDateIN(now)} ${formatTimeIN(now)}`,
    generatedBy: params.generatedByName,
  };
}

export function statusColor(status: "ON TRACK" | "BEHIND"): string {
  return status === "ON TRACK" ? "#28a745" : "#dc3545";
}

export function bandColor(label: string): string {
  switch (label) {
    case "Excellent": return "#1e7e34";
    case "Good": return "#28a745";
    case "Average": return "#e0a800";
    case "Needs Improvement": return "#e67e22";
    default: return "#dc3545"; // Critical
  }
}
