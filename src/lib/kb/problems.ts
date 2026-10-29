// What a report is really about. causes.ts places a report by tenant and channel; a one-day move
// (desk-notes.json) is a different bug that only lands under `parser` because of its tenant.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'oneDayMove';

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem | null {
  if (oneDayMove.includes(r.id)) return 'oneDayMove';
  return causeOf(r, t);
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // Reports whose intake tag names a different cause than the one they belong to.
  mistagged: number;
};

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const byProblem = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of reports) {
    const p = problemOf(r, tenantOf(r), oneDayMove) ?? 'unplaced';
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        mistagged: rs.filter((r) => r.meta.intakeTag !== problem).length,
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
