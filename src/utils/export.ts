import type { Task, Decision, WeeklyReview, OKR } from '../types';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvRow(cells: (string | number | undefined | null)[]) {
  return cells.map(c => {
    const s = String(c ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  }).join(',');
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function exportTasksCSV(tasks: Task[]) {
  const header = csvRow(['Title', 'Priority', 'Quadrant', 'Stage', 'Energy', 'Due Date', 'Est (min)', 'Tags', 'Description', 'Commitment Note', 'Delegated To', 'Created At']);
  const rows = tasks.map(t => csvRow([
    t.title,
    t.priority,
    t.quadrant,
    t.column,
    t.energy ?? '',
    t.dueDate ?? '',
    t.estimateMinutes ?? '',
    t.tags.join('; '),
    t.description ?? '',
    t.commitmentNote ?? '',
    t.delegatedTo ?? '',
    t.createdAt,
  ]));
  downloadFile([header, ...rows].join('\n'), `tasks-${today()}.csv`, 'text/csv');
}

export function exportDecisionsCSV(decisions: Decision[]) {
  const header = csvRow(['Title', 'Decision', 'Context', 'Alternatives', 'People', 'Date Made', 'Review Date', 'Outcome']);
  const rows = decisions.map(d => csvRow([
    d.title, d.decision, d.context, d.alternatives ?? '', d.people ?? '',
    d.madeAt, d.reviewAt ?? '', d.outcome ?? '',
  ]));
  downloadFile([header, ...rows].join('\n'), `decisions-${today()}.csv`, 'text/csv');
}

export function exportOKRsCSV(okrs: OKR[]) {
  const rows: string[] = [csvRow(['Quarter', 'Objective', 'Key Result', 'Current', 'Target', 'Progress %'])];
  okrs.forEach(o => {
    if (o.keyResults.length === 0) {
      rows.push(csvRow([o.quarter, o.objective, '', '', '', '']));
    } else {
      o.keyResults.forEach(kr => {
        rows.push(csvRow([o.quarter, o.objective, kr.description, kr.current, kr.target, kr.progress]));
      });
    }
  });
  downloadFile(rows.join('\n'), `okrs-${today()}.csv`, 'text/csv');
}

export function exportWeeklyReviewCSV(reviews: WeeklyReview[]) {
  const header = csvRow(['Week Of', 'Wins', 'What Slipped', 'Commitments Made', 'Next Week Focus', 'Energy Rating', 'Notes']);
  const rows = reviews.map(r => csvRow([r.weekOf, r.wins, r.slipped, r.commitmentsMade, r.nextWeekFocus, r.energyRating, r.notes ?? '']));
  downloadFile([header, ...rows].join('\n'), `weekly-reviews-${today()}.csv`, 'text/csv');
}

// ─── Import tasks from CSV ────────────────────────────────────────────────────

export type ImportedTask = Pick<Task, 'title' | 'priority' | 'quadrant' | 'column' | 'tags' | 'description' | 'dueDate' | 'estimateMinutes'>;

export function parseTasksCSV(text: string): ImportedTask[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  // Parse header to find column indices
  const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().trim());
  const idx = (name: string) => headers.indexOf(name);

  const titleIdx = idx('title');
  if (titleIdx === -1) throw new Error('CSV must have a "Title" column');

  const results: ImportedTask[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVRow(lines[i]);
    const title = cells[titleIdx]?.trim();
    if (!title) continue;

    const raw = (name: string) => cells[idx(name)]?.trim() ?? '';

    const priority = (['critical', 'high', 'medium', 'low'] as const).includes(raw('priority') as never)
      ? raw('priority') as Task['priority']
      : 'medium';

    const quadrant = (['do-now', 'schedule', 'delegate', 'drop'] as const).includes(raw('quadrant') as never)
      ? raw('quadrant') as Task['quadrant']
      : 'schedule';

    const column = (['backlog', 'in-progress', 'done'] as const).includes(raw('stage') as never)
      ? raw('stage') as Task['column']
      : 'backlog';

    const estimateRaw = parseInt(raw('est (min)') || raw('estimate') || raw('estimateminutes'), 10);

    results.push({
      title,
      priority,
      quadrant,
      column,
      tags: raw('tags') ? raw('tags').split(';').map(t => t.trim()).filter(Boolean) : [],
      description: raw('description') || undefined,
      dueDate: raw('due date') || raw('duedate') || undefined,
      estimateMinutes: isNaN(estimateRaw) ? undefined : estimateRaw,
    });
  }

  return results;
}

function parseCSVRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (c === ',' && !inQuote) {
      cells.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  cells.push(current);
  return cells;
}

function today() {
  return new Date().toISOString().split('T')[0];
}
