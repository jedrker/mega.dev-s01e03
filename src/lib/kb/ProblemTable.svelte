<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, type ProblemGroup } from '#lib/kb/problems';

  let { ticket, issues }: { ticket: number; issues: Partial<Record<ProblemGroup['problem'], string>> } = $props();

  const WHAT: Record<ProblemGroup['problem'], string> = {
    parser: 'the shared parser reads a day-first date month first: day and month swap',
    hint: 'booking-v3 prints MM/DD/YYYY under its date field; people type month first, the form reads day first',
    oneDayMove: 'the date moves by one day, not a month: Tuesday shows as Monday',
    unplaced: 'tenant not on file or writes month first: read these by hand',
  };

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const mistagged = $derived(groups.reduce((n, g) => n + g.mistagged, 0));
  const issueNo = (url: string) => `#${url.split('/').pop()}`;
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'} ·
  intake tagged <strong>{mistagged}</strong> of them as the wrong cause
</p>

<table>
  <thead>
    <tr><th>problem</th><th>what happens</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr class:open={!issues[g.problem]}>
        <td><code>{g.problem}</code></td>
        <td class="what">{WHAT[g.problem]}</td>
        <td>{g.reports.length}{g.filedUnder.length ? '*' : ''}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issues[g.problem]}
            <a href={issues[g.problem]}>{issueNo(issues[g.problem]!)}</a>
          {:else}
            no ticket yet
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#each groups.filter((g) => g.filedUnder.length) as g (g.problem)}
  <p class="note">
    * The desk files these {g.reports.length} reports under <code>{g.filedUnder.join(', ')}</code> by tenant, so
    they are counted there too: {groups.filter((c) => !c.filedUnder.length).length} causes cover all
    {merged.length} reports.
  </p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .note { color: var(--muted); font-size: 0.85em; }
  .what { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
  .open td:last-child { color: var(--warn); font-weight: 600; }
</style>
