Integrate the new report-engine module into the existing NIRF ERP project.

CONTEXT
This backend already has a working Express + Prisma (SQLite) API at
`backend/`. Four files were just added/changed and need to be merged in:

  NEW:      backend/src/lib/report-engine/  (10 files: index.ts, fetcher.ts,
            aggregator.ts, calculator.ts, validator.ts, formatter.ts,
            report-builder.ts, report-types.ts, helpers.ts, constants.ts)
  NEW:      backend/src/routes/reportEngine.ts
  MODIFIED: backend/src/routes/auth.ts
  MODIFIED: backend/src/index.ts

Apply them exactly as provided in backend-changes.zip — do not regenerate
or rewrite their internals, they're already type-checked against
schema.prisma. Then do the integration work below.

STEP 1 — Sanity check the merge
Run `cd backend && npx tsc --noEmit` and confirm it's clean. If auth.ts or
index.ts don't apply as a clean patch (because the repo has moved on since
this was generated), reapply the same logical change by hand:
  - auth.ts: mock login users now store `departmentCode` (e.g. "IT") instead
    of `departmentId`; POST /login resolves it to the real
    `prisma.department.findUnique({ where: { code } }).id` before minting
    the JWT. This fixes a real bug: HOD/DEPARTMENT_STAFF logins were putting
    the department CODE into the JWT while every Prisma query filters by
    Department.id (a uuid) — so every department-scoped route was silently
    returning empty results for those roles. Confirm this fix didn't get
    lost.
  - index.ts: `/api/report-engine` is mounted with `authenticate` but
    deliberately WITHOUT `enforceDepartmentScope` (the engine does its own
    department/role check in validator.ts, since a department-scoped user
    must be allowed to omit departmentId to mean "my own department").

STEP 2 — Run and smoke-test the backend
  cd backend
  npx prisma generate
  npx prisma db push   (or migrate, if a dev.db doesn't exist yet)
  npx prisma db seed
  npm run dev
Then log in as hod@jjcet.edu / hod123 and confirm the JWT's departmentId is
now a uuid (decode it or check server logs), not "IT".

Smoke-test the new endpoints:
  POST /api/report-engine/generate
    body: { "reportType": "dept_monthly", "academicYear": 2025 }
    (as an HOD/staff token — departmentId can be omitted, it defaults to
    their own department)
  POST /api/report-engine/generate
    body: { "reportType": "college_performance", "academicYear": 2025 }
    (as principal/vp/admin token — institution-wide roles only)
  GET  /api/report-engine/templates

STEP 3 — Frontend integration (the main remaining work)
The frontend currently builds report data in
`frontend/src/app/(dashboard)/reports/page.tsx` by calling
`firestoreService.*.getAll()` from `frontend/src/lib/firestore.ts` — this
pulls straight from a client-side Firestore shim and bypasses the Express
API and its auth/department-scoping entirely. Replace that data-fetching
block with a single call to the new endpoint:

  const res = await api.post("/report-engine/generate", {
    reportType: selectedReportId,   // must match one of REPORT_TYPES in
                                     // backend/src/lib/report-engine/constants.ts
                                     // — dept_monthly, dept_annual,
                                     // target_achievement, publications,
                                     // patents, research, faculty_performance,
                                     // college_performance, nirf
    departmentId: dept === "All Departments" ? null : myDepartmentId, // real uuid, not code
    academicYear: Number(filters.year.split("-")[0]),
    asOfMonth: filters.month,
  });
  // res.data is either DepartmentReportData or InstitutionReportData
  // (see backend/src/lib/report-engine/report-types.ts) — NOT the old
  // ReportData shape from frontend/src/lib/reportGenerator.ts.

This means `generateReportData()` in reports/page.tsx (the giant function
that hand-builds TargetRow[]/KpiSummary from Firestore arrays) can be
deleted once the new endpoint is wired in — the backend now does that
computation. You will need to either:
  (a) adapt reportGenerator.ts's generatePDF/generateExcel/printReport to
      accept the new DepartmentReportData/InstitutionReportData shape
      instead of the old ReportData interface, or
  (b) write a small adapter function that maps the new shape into the old
      ReportData interface as a stopgap, so the existing PDF/Excel/print
      code keeps working unmodified.
Prefer (a) if there's time — the new shape is stricter-typed and has extra
fields (overallPerformance, pendingTargets) the old shape doesn't, which
the report should surface.

Also note: `REPORT_TYPES`/access-control arrays are now duplicated between
frontend (reports/page.tsx REPORT_TYPES const) and backend
(report-engine/constants.ts REPORT_TYPES + GET /report-engine/templates).
Prefer fetching from GET /api/report-engine/templates instead of the
hardcoded frontend array, so access rules live in exactly one place.

STEP 4 — Do NOT touch
  - frontend/src/lib/firestore.ts and frontend/src/lib/firebase.ts can stay
    for now (other pages may still use them) — just stop routing REPORT
    generation through them.
  - Nothing in backend/src/routes/{departments,faculty,publications,patents,
    research,phd,students,events,reviews,targets,approvals,documents,...}.ts
    needs to change for this integration.

STEP 5 — Known gaps, flag but don't silently fill in
  - /api/report-engine/export/pdf, /export/excel, /history, /download are
    NOT implemented — there's no persistence model for generated reports
    yet (schema.prisma has no Report/GeneratedReport table). Don't invent
    dummy data for these; ask before adding a table.
  - .env.local contains a live JWT_SECRET and a Firebase service-account
    private key that were shared in plaintext during development — rotate
    both in Firebase Console / regenerate JWT_SECRET before any real
    deployment, and confirm .env.local stays out of git (it's already in
    .gitignore).

Report back with: tsc output, which smoke tests passed/failed, and how far
you got on Step 3 (adapter chosen, files changed).
