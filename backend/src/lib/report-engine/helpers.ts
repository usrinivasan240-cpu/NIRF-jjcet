/**
 * report-engine/helpers.ts
 *
 * Small, pure, dependency-free utilities. No Prisma imports here — this
 * file should be safely unit-testable without a database.
 */

export function groupBy<T, K extends string | number>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

export function sumBy<T>(items: T[], valueFn: (item: T) => number): number {
  return items.reduce((total, item) => total + valueFn(item), 0);
}

export function countWhere<T>(items: T[], predicate: (item: T) => boolean): number {
  let count = 0;
  for (const item of items) if (predicate(item)) count++;
  return count;
}

/** Division that never throws or returns NaN/Infinity — returns 0 for a zero/invalid denominator */
export function safeDiv(numerator: number, denominator: number): number {
  if (!denominator || !Number.isFinite(denominator)) return 0;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : 0;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Academic year "2025" -> "2025-26" label, matching JJCET convention
 * (June 2025 through May 2026).
 */
export function academicYearLabel(startYear: number): string {
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${endYearShort}`;
}

/**
 * True if `dateLike` falls within the academic year starting `academicYearStart`
 * (June 1 of that year through May 31 of the next). Accepts ISO strings,
 * Date objects, or anything Date() can parse; invalid/missing dates are
 * excluded (returns false) rather than silently counted.
 */
export function isWithinAcademicYear(dateLike: string | Date | null | undefined, academicYearStart: number): boolean {
  if (!dateLike) return false;
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return false;
  const start = new Date(Date.UTC(academicYearStart, 5, 1)); // June 1
  const end = new Date(Date.UTC(academicYearStart + 1, 4, 31, 23, 59, 59)); // May 31
  return d >= start && d <= end;
}

export function generateReportId(prefix = "JJCE/REP"): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const yy2 = String(now.getFullYear() + 1).slice(-2);
  const serial = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}/${now.getFullYear()}${yy !== yy2 ? "" : ""}-${yy2}/${serial}`;
}

export function formatDateIN(d: Date = new Date()): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatTimeIN(d: Date = new Date()): string {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
