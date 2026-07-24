/**
 * report-engine/aggregator.ts
 *
 * Turns a RawDataBundle (flat arrays from fetcher.ts) into per-department
 * and institution-wide rollups. Pure in-memory work — no I/O here.
 */
import { Department } from "@prisma/client";
import { countWhere, groupBy, sumBy } from "./helpers";
import { DepartmentAggregate, InstitutionAggregate, RawDataBundle } from "./report-types";

export function buildDepartmentAggregate(department: Department, bundle: RawDataBundle): DepartmentAggregate {
  const inDept = <T extends { departmentId?: string | null }>(items: T[]) =>
    items.filter((i) => i.departmentId === department.id);

  const faculties = inDept(bundle.faculties);
  const publications = inDept(bundle.publications);
  const patents = inDept(bundle.patents);
  const research = inDept(bundle.research);
  const phdScholars = inDept(bundle.phdScholars);
  const students = inDept(bundle.students);
  const events = inDept(bundle.events);
  const targets = inDept(bundle.targets);

  return {
    department,
    facultyCount: faculties.length,
    studentCount: students.length,
    publicationCount: publications.length,
    sciPublicationCount: countWhere(publications, (p) => p.isSCI),
    scopusPublicationCount: countWhere(publications, (p) => p.isScopus),
    patentCount: patents.length,
    grantedPatentCount: countWhere(patents, (p) => p.isGranted),
    filedPatentCount: countWhere(patents, (p) => !p.isGranted),
    researchCount: research.length,
    ongoingResearchCount: countWhere(research, (r) => r.status === "ongoing"),
    phdScholarCount: phdScholars.length,
    eventCount: events.length,
    targets,
  };
}

export function buildAllDepartmentAggregates(bundle: RawDataBundle): DepartmentAggregate[] {
  return bundle.departments.map((dept) => buildDepartmentAggregate(dept, bundle));
}

const ZERO_TOTALS: Omit<DepartmentAggregate, "department" | "targets"> = {
  facultyCount: 0,
  studentCount: 0,
  publicationCount: 0,
  sciPublicationCount: 0,
  scopusPublicationCount: 0,
  patentCount: 0,
  grantedPatentCount: 0,
  filedPatentCount: 0,
  researchCount: 0,
  ongoingResearchCount: 0,
  phdScholarCount: 0,
  eventCount: 0,
};

export function buildInstitutionAggregate(bundle: RawDataBundle, academicYear: number): InstitutionAggregate {
  const departmentAggregates = buildAllDepartmentAggregates(bundle);

  const totals = departmentAggregates.reduce<Omit<DepartmentAggregate, "department" | "targets">>(
    (acc, d) => ({
      facultyCount: acc.facultyCount + d.facultyCount,
      studentCount: acc.studentCount + d.studentCount,
      publicationCount: acc.publicationCount + d.publicationCount,
      sciPublicationCount: acc.sciPublicationCount + d.sciPublicationCount,
      scopusPublicationCount: acc.scopusPublicationCount + d.scopusPublicationCount,
      patentCount: acc.patentCount + d.patentCount,
      grantedPatentCount: acc.grantedPatentCount + d.grantedPatentCount,
      filedPatentCount: acc.filedPatentCount + d.filedPatentCount,
      researchCount: acc.researchCount + d.researchCount,
      ongoingResearchCount: acc.ongoingResearchCount + d.ongoingResearchCount,
      phdScholarCount: acc.phdScholarCount + d.phdScholarCount,
      eventCount: acc.eventCount + d.eventCount,
    }),
    { ...ZERO_TOTALS }
  );

  return { academicYear, departmentAggregates, totals };
}

/**
 * Group publications/patents/research/events by month (calendar month 0-11)
 * using whichever date field each model has. Returns a Map so calculator.ts
 * can slot values into the June->May academic-year layout without repeating
 * date parsing logic per report type.
 */
export function groupByCalendarMonth<T>(items: T[], dateFn: (item: T) => string | Date | null | undefined): Map<number, T[]> {
  const withDates = items
    .map((item) => {
      const raw = dateFn(item);
      if (!raw) return null;
      const d = raw instanceof Date ? raw : new Date(raw);
      return Number.isNaN(d.getTime()) ? null : { item, month: d.getMonth() };
    })
    .filter((x): x is { item: T; month: number } => x !== null);

  const grouped = groupBy(withDates, (x) => x.month);
  const result = new Map<number, T[]>();
  grouped.forEach((entries, month) => result.set(month, entries.map((e) => e.item)));
  return result;
}

export function totalOf<T>(items: T[], valueFn: (item: T) => number): number {
  return sumBy(items, valueFn);
}
