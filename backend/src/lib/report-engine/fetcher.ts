/**
 * report-engine/fetcher.ts
 *
 * The ONLY place in the report engine that talks to Prisma directly.
 * Fetches every collection the engine might need in a single Promise.all,
 * then hands back a plain RawDataBundle. aggregator.ts/calculator.ts work
 * entirely in memory from there — no repeated queries, no N+1.
 *
 * This replaces the pattern in frontend/src/app/(dashboard)/reports/page.tsx
 * where report data was pulled client-side straight from Firestore
 * (frontend/src/lib/firestore.ts), bypassing the Express/Prisma API and
 * department-scoping middleware entirely.
 */
import { PrismaClient } from "@prisma/client";
import { RawDataBundle } from "./report-types";

/**
 * A single shared Prisma client for the report engine. Route handlers
 * elsewhere in the codebase each instantiate their own `new PrismaClient()`
 * (see backend/src/routes/*.ts) — that's fine for simple CRUD, but the
 * report engine issues several queries per request, so it gets one client
 * reused across calls rather than opening a fresh connection pool per report.
 */
export const reportEnginePrisma = new PrismaClient();

export interface FetchScope {
  /** null = institution-wide (no department filter). Enforced by the caller — see validator.ts */
  departmentId: string | null;
  /** Restrict Target rows to this academic year (Target.year is an Int, e.g. 2025) */
  academicYear: number;
}

/**
 * Fetch every collection the report engine needs, scoped once, in parallel.
 * Departments themselves are never filtered by departmentId — a department
 * report still needs to know about the institution for ranking, and an
 * institution report needs all departments by definition.
 */
export async function fetchReportData(scope: FetchScope, prisma: PrismaClient = reportEnginePrisma): Promise<RawDataBundle> {
  const deptFilter = scope.departmentId ? { departmentId: scope.departmentId } : {};
  const targetFilter = {
    ...deptFilter,
    year: scope.academicYear,
  };

  const [departments, faculties, publications, patents, research, phdScholars, students, events, targets] =
    await Promise.all([
      prisma.department.findMany({ orderBy: { name: "asc" } }),
      prisma.faculty.findMany({ where: deptFilter, include: { department: true } }),
      prisma.publication.findMany({ where: deptFilter, include: { faculty: true, department: true } }),
      prisma.patent.findMany({ where: deptFilter, include: { faculty: true, department: true } }),
      prisma.research.findMany({ where: deptFilter, include: { department: true } }),
      prisma.phdScholar.findMany({ where: deptFilter, include: { department: true } }),
      prisma.student.findMany({ where: deptFilter, include: { department: true } }),
      prisma.event.findMany({ where: deptFilter, include: { department: true } }),
      prisma.target.findMany({ where: targetFilter, include: { department: true } }),
    ]);

  return {
    departments,
    faculties,
    publications,
    patents,
    research,
    phdScholars,
    students,
    events,
    targets,
    fetchedAt: new Date(),
  };
}

/** Graceful shutdown hook for the shared client (call from backend/src/index.ts on SIGTERM if desired) */
export async function disconnectReportEngine(): Promise<void> {
  await reportEnginePrisma.$disconnect();
}
