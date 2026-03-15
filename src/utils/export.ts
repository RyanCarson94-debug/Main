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

// ─── Full data export (JSON safety valve) ────────────────────────────────────

const EXPORT_KEYS = [
  'adhd-leader-tasks',
  'adhd-leader-okrs',
  'adhd-leader-swot',
  'adhd-leader-team',
  'adhd-leader-update-people',
  'adhd-leader-updates',
  'adhd-leader-focus-map',
  'adhd-leader-dump',
  'adhd-leader-decisions',
  'adhd-leader-commitments',
  'adhd-leader-weekly-reviews',
  'adhd-leader-north-star',
  'adhd-leader-stakeholders',
  'adhd-leader-direct-report-profiles',
  'adhd-leader-meetings',
  'adhd-leader-projects',
  'adhd-leader-hard-conversations',
  'adhd-leader-quarterly-plans',
  'adhd-leader-role-clarity',
  'adhd-leader-role-charters',
  'adhd-leader-personal-readme',
  'adhd-leader-one-on-one-notes',
];

export function exportAllDataJSON() {
  const snapshot: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    version: 1,
  };
  for (const key of EXPORT_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      snapshot[key] = raw ? JSON.parse(raw) : null;
    } catch {
      snapshot[key] = null;
    }
  }
  downloadFile(
    JSON.stringify(snapshot, null, 2),
    `adhd-leader-backup-${today()}.json`,
    'application/json',
  );
}

// ─── ICS / iCalendar export ───────────────────────────────────────────────────

function icsLine(text: string): string {
  const out: string[] = [];
  while (text.length > 75) { out.push(text.slice(0, 75)); text = ' ' + text.slice(75); }
  out.push(text);
  return out.join('\r\n');
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function icsDate(iso: string): string { return iso.replace(/-/g, ''); }

function nextDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}

const ICS_PRIORITY: Record<Task['priority'], number> = { critical: 1, high: 2, medium: 5, low: 9 };

const QUADRANT_LABEL: Record<string, string> = {
  'do-now': 'Do Now', schedule: 'Schedule', delegate: 'Delegate', drop: 'Drop',
};

export function exportTasksICS(
  tasks: Task[],
  { includeDone = false, alarmMinutes = 0 }: { includeDone?: boolean; alarmMinutes?: number } = {},
) {
  const exportable = tasks.filter(t => t.dueDate && (includeDone || t.column !== 'done'));
  if (exportable.length === 0) { alert('No tasks with due dates found to export.'); return; }

  const nowStamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const lines: string[] = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//ADHD Leader//adhd-leader.app//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:ADHD Leader Tasks', 'X-WR-TIMEZONE:UTC',
  ];

  for (const t of exportable) {
    const descParts: string[] = [];
    if (t.description)    descParts.push(t.description);
    if (t.quadrant)       descParts.push('Quadrant: ' + (QUADRANT_LABEL[t.quadrant] ?? t.quadrant));
    if (t.energy)         descParts.push('Energy: ' + t.energy);
    if (t.delegatedTo)    descParts.push('Delegated to: ' + t.delegatedTo);
    if (t.commitmentNote) descParts.push('Commitment: ' + t.commitmentNote);
    if (t.tags.length)    descParts.push('Tags: ' + t.tags.join(', '));

    const trigger = alarmMinutes > 0 ? '-PT' + alarmMinutes + 'M' : 'PT0S';
    lines.push(
      'BEGIN:VEVENT',
      icsLine('UID:' + t.id + '@adhd-leader'),
      icsLine('DTSTAMP:' + nowStamp),
      icsLine('DTSTART;VALUE=DATE:' + icsDate(t.dueDate!)),
      icsLine('DTEND;VALUE=DATE:' + icsDate(nextDay(t.dueDate!))),
      icsLine('SUMMARY:' + icsEscape(t.title)),
      icsLine('PRIORITY:' + ICS_PRIORITY[t.priority]),
      icsLine('STATUS:' + (t.column === 'done' ? 'COMPLETED' : 'CONFIRMED')),
      icsLine('CATEGORIES:' + icsEscape(QUADRANT_LABEL[t.quadrant] ?? t.quadrant)),
      ...(descParts.length ? [icsLine('DESCRIPTION:' + icsEscape(descParts.join('\\n')))] : []),
      'BEGIN:VALARM', 'ACTION:DISPLAY',
      icsLine('DESCRIPTION:Due: ' + icsEscape(t.title)),
      'TRIGGER:' + trigger,
      'END:VALARM', 'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  // Split mime type to avoid Tailwind content-scan treating 'text/calendar;charset=utf-8' as a class
  downloadFile(lines.join('\r\n'), 'adhd-leader-tasks-' + today() + '.ics', 'text/calendar' + ';charset=utf-8');
}
