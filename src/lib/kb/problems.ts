// The problems in a ticket, counted the way the desk's CauseTable counts them: each report under
// the cause its tenant and channel give it. One-day moves (desk-notes.json) are a bug of their own,
// but the desk files them under their cause, so they stay counted there too.
import { groupByCause, type CauseGroup, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = CauseGroup['cause'] | 'oneDayMove';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // For oneDayMove: the cause its reports are filed under.
  filedUnder: CauseGroup['cause'][];
  // Reports whose intake tag names a different cause than the one they are filed under.
  mistagged: number;
};

const span = (rs: Report[]) => {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return { firstSeen: days[0], lastSeen: days[days.length - 1] };
};

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const causes = groupByCause(reports, tenantOf);
  const groups: ProblemGroup[] = causes.map((g) => ({
    problem: g.cause,
    reports: g.reports,
    tenants: g.tenants,
    firstSeen: g.firstSeen,
    lastSeen: g.lastSeen,
    filedUnder: [],
    mistagged: g.reports.filter((r) => r.meta.intakeTag !== g.cause).length,
  }));
  const moved = reports.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    groups.push({
      problem: 'oneDayMove',
      reports: moved,
      tenants: new Set(moved.map((r) => r.tenant)).size,
      ...span(moved),
      filedUnder: causes.filter((g) => g.reports.some((r) => oneDayMove.includes(r.id))).map((g) => g.cause),
      mistagged: 0,
    });
  }
  return groups;
}
