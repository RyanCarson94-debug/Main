import Anthropic from '@anthropic-ai/sdk';
import type { Task, FocusStep, DumpItem, WeeklyReview, Decision, OKR, Meeting } from '../types';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

/**
 * Streams a delegation email draft using Claude Opus 4.6.
 * Uses situational delegation methodology:
 *   - Clear task context + why it matters
 *   - Authority level and available resources
 *   - Expected outcome with measurable criteria
 *   - Deadline and check-in cadence
 */
/**
 * Breaks a task into concrete micro-steps using Claude.
 * Returns an array of FocusStep objects with time estimates.
 */
/**
 * Triages a list of brain-dump items using Claude Haiku.
 * Returns suggestions per item: task/idea/discard + quadrant + priority + reasoning.
 */
export async function triageDumpItems(
  items: DumpItem[],
  onDone: (suggestions: Record<string, DumpItem['aiSuggestion']>) => void,
  onError: (err: string) => void,
): Promise<void> {
  const itemList = items.map((item, i) => `${i + 1}. [id:${item.id}] "${item.content}"`).join('\n');

  const prompt = `You are an ADHD productivity coach helping a leader process their brain dump.

For each item, decide:
- type: "task" (needs doing), "idea" (worth keeping but not urgent), or "discard" (not actionable/relevant)
- If "task": suggest quadrant ("do-now", "schedule", "delegate", or "drop") and priority ("critical", "high", "medium", or "low")
- reasoning: one short sentence explaining why

Items:
${itemList}

Respond ONLY with a JSON object keyed by item id. No markdown, no explanation. Example:
{
  "abc123": {"type": "task", "quadrant": "do-now", "priority": "high", "reasoning": "Time-sensitive action with clear owner."},
  "def456": {"type": "idea", "reasoning": "Good concept but no immediate action required."},
  "ghi789": {"type": "discard", "reasoning": "Too vague to act on."}
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, DumpItem['aiSuggestion']>;
    onDone(parsed);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      onError('Invalid API key. Add VITE_ANTHROPIC_API_KEY to your .env file.');
    } else if (err instanceof Anthropic.RateLimitError) {
      onError('Rate limited. Please wait a moment and try again.');
    } else {
      onError('Failed to triage items. Check your API key and connection.');
    }
  }
}

export async function generateTaskBreakdown(
  task: Task,
  onDone: (steps: Omit<FocusStep, 'id' | 'done'>[]) => void,
  onError: (err: string) => void,
): Promise<void> {
  const prompt = `You are an ADHD productivity coach helping a leader break down a task into clear, actionable micro-steps.

Task: "${task.title}"
${task.description ? `Context: ${task.description}` : ''}
Priority: ${task.priority}
Tags: ${task.tags.join(', ') || 'none'}
${task.commitmentNote ? `Notes: ${task.commitmentNote}` : ''}

Break this task into 4–7 concrete micro-steps. Each step should:
- Start with a verb (Open, Write, Call, Review, etc.)
- Be completable in under 25 minutes
- Be specific enough that the person knows exactly what to do

Respond ONLY with a JSON array, no explanation, no markdown. Example format:
[
  {"text": "Open the project folder and read the last email thread", "estimateMinutes": 5},
  {"text": "Write bullet-point outline of key points", "estimateMinutes": 15}
]`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array in response');
    const parsed = JSON.parse(jsonMatch[0]) as { text: string; estimateMinutes?: number }[];
    onDone(parsed.map(s => ({ text: s.text, estimateMinutes: s.estimateMinutes })));
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      onError('Invalid API key. Add VITE_ANTHROPIC_API_KEY to your .env file.');
    } else if (err instanceof Anthropic.RateLimitError) {
      onError('Rate limited. Please wait a moment and try again.');
    } else {
      onError('Failed to generate breakdown. Check your API key and connection.');
    }
  }
}

export async function recommendNextTask(
  tasks: Task[],
  onDone: (result: { taskId: string; task: string; reason: string }) => void,
  onError: (err: string) => void,
): Promise<void> {
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const todayStr = now.toISOString().split('T')[0];

  const overdue  = tasks.filter(t => t.column !== 'done' && t.dueDate && t.dueDate < todayStr);
  const dueToday = tasks.filter(t => t.column !== 'done' && t.dueDate === todayStr);
  const active   = tasks.filter(t => t.column === 'in-progress');
  const doNow    = tasks.filter(t => t.quadrant === 'do-now' && t.column !== 'done');

  const format = (label: string, list: Task[]) =>
    list.map(t => `${label}: [${t.id}] "${t.title}" (${t.priority}${t.energy ? ', ' + t.energy : ''})`).join('\n');

  const taskList = [
    format('OVERDUE', overdue),
    format('DUE TODAY', dueToday),
    format('IN PROGRESS', active.filter(t => !overdue.includes(t) && !dueToday.includes(t))),
    format('DO NOW', doNow.filter(t => !overdue.includes(t) && !dueToday.includes(t) && !active.includes(t))),
  ].filter(Boolean).join('\n').slice(0, 1500);

  const prompt = `You are an ADHD leadership coach. It is ${timeOfDay}. Pick the single most important task to work on right now.

Tasks:
${taskList || 'No active tasks.'}

Respond ONLY with JSON: {"taskId": "...", "task": "exact task title", "reason": "one direct sentence explaining why this task right now"}`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    onDone(JSON.parse(match[0]));
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      onError('Invalid API key.');
    } else if (err instanceof Anthropic.RateLimitError) {
      onError('Rate limited. Try again in a moment.');
    } else {
      onError('Could not get recommendation.');
    }
  }
}

export async function streamDelegationEmail(
  task: Task,
  delegatee: string,
  followUpDate: string | undefined,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  const deadline = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'to be agreed upon';

  const followUp = followUpDate
    ? new Date(followUpDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'within the next few days';

  const prompt = `You are helping a leader with ADHD draft a professional delegation email.

Task to delegate:
- Title: ${task.title}
- Description: ${task.description ?? 'No additional details'}
- Priority: ${task.priority}
- Due date: ${deadline}
- Commitment/context: ${task.commitmentNote ?? 'None specified'}
- Tags: ${task.tags.join(', ') || 'None'}

Delegate to: ${delegatee}
Follow-up planned: ${followUp}

Write a concise, professional delegation email using the following framework:
1. **Opening**: Friendly, direct — state what you're delegating and why you chose them
2. **Task context**: What needs to be done and why it matters to the team/org
3. **Authority & resources**: What decisions they can make independently, what resources they have access to
4. **Expected outcome**: Specific, measurable result — what "done" looks like
5. **Timeline**: Deadline and any key milestones
6. **Check-in plan**: When and how you'll follow up (mention the ${followUp} check-in)
7. **Closing**: Express confidence, invite questions

Keep it under 250 words. Be specific and clear — avoid vague phrases. Write in first person as the leader sending this email. Use a warm but professional tone. Format as a proper email with Subject, greeting, body, and sign-off (use "[Your Name]" as placeholder).`;

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }],
    });

    stream.on('text', (delta) => onChunk(delta));

    await stream.finalMessage();
    onDone();
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      onError('Invalid API key. Add VITE_ANTHROPIC_API_KEY to your .env file.');
    } else if (err instanceof Anthropic.RateLimitError) {
      onError('Rate limited. Please wait a moment and try again.');
    } else if (err instanceof Anthropic.APIError) {
      onError(`API error (${err.status}): ${err.message}`);
    } else {
      onError('Failed to generate email. Check your API key and connection.');
    }
  }
}

// ─── AI Coach ─────────────────────────────────────────────────────────────────

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function streamAICoach(
  messages: ChatMessage[],
  context: { tasks: Task[]; okrs: OKR[]; decisions: Decision[] },
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const urgentTasks = context.tasks.filter(t => t.column !== 'done' && (t.quadrant === 'do-now' || (t.dueDate && t.dueDate <= today)));
  const activeTasks = context.tasks.filter(t => t.column === 'in-progress');

  const systemPrompt = `You are an expert ADHD leadership coach embedded in a productivity app. You have deep knowledge of ADHD management strategies, executive function support, leadership development, and time management.

Current context:
- Urgent/Do Now tasks (${urgentTasks.length}): ${urgentTasks.slice(0, 5).map(t => `"${t.title}" (${t.priority})`).join(', ') || 'none'}
- In Progress (${activeTasks.length}): ${activeTasks.slice(0, 3).map(t => `"${t.title}"`).join(', ') || 'none'}
- Total active tasks: ${context.tasks.filter(t => t.column !== 'done').length}
- Active OKRs: ${context.okrs.slice(0, 3).map(o => `"${o.objective}"`).join(', ') || 'none'}
- Recent decisions: ${context.decisions.slice(0, 3).map(d => `"${d.title}"`).join(', ') || 'none'}

Be direct, practical, and ADHD-aware. Keep responses concise (2–4 short paragraphs max). Use bullet points for action items. Acknowledge the cognitive load of leadership with ADHD without being condescending.`;

  try {
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    stream.on('text', onChunk);
    await stream.finalMessage();
    onDone();
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) onError('Invalid API key.');
    else if (err instanceof Anthropic.RateLimitError) onError('Rate limited — try again in a moment.');
    else onError('Coach unavailable. Check your API key and connection.');
  }
}

// ─── Weekly Review Summary ────────────────────────────────────────────────────

export async function generateWeeklySummary(
  review: WeeklyReview,
  completedTasks: Task[],
  onDone: (summary: string) => void,
  onError: (err: string) => void,
): Promise<void> {
  const prompt = `You are an ADHD leadership coach. Summarise this weekly review in exactly 3 sentences — one sentence per paragraph. Be specific, warm, and forward-looking. Focus on the most important win, the most important slip, and the key focus for next week.

Weekly Review:
- Wins: ${review.wins || 'not filled in'}
- What slipped: ${review.slipped || 'nothing noted'}
- Commitments made: ${review.commitmentsMade || 'none noted'}
- Next week focus: ${review.nextWeekFocus || 'not set'}
- Energy this week: ${review.energyRating}/5
- Notes: ${review.notes || 'none'}
- Tasks completed this week: ${completedTasks.map(t => t.title).join(', ') || 'none recorded'}

Write 3 sentences. No headers, no bullets. Plain prose.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    onDone(text);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) onError('Invalid API key.');
    else if (err instanceof Anthropic.RateLimitError) onError('Rate limited — try again.');
    else onError('Could not generate summary.');
  }
}

// ─── Decision Helper ──────────────────────────────────────────────────────────

export async function streamDecisionHelper(
  decision: Pick<Decision, 'title' | 'context' | 'alternatives'>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  const prompt = `You are an ADHD leadership coach helping a leader think through a decision clearly.

Decision: ${decision.title}
Context: ${decision.context || 'No additional context provided'}
Alternatives considered: ${decision.alternatives || 'Not specified'}

Help them think through this decision using this structure (be concise, use short bullet points):

**What's at stake** — 2-3 bullets on key consequences
**Key tensions** — what makes this hard (trade-offs, uncertainties)
**Questions to ask yourself** — 3 clarifying questions that might unlock clarity
**A suggested frame** — one way to look at this that cuts through the noise

Keep each section to 2-4 bullets. Be direct and ADHD-aware (avoid analysis paralysis language).`;

  try {
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    });
    stream.on('text', onChunk);
    await stream.finalMessage();
    onDone();
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) onError('Invalid API key.');
    else if (err instanceof Anthropic.RateLimitError) onError('Rate limited — try again.');
    else onError('Could not generate analysis.');
  }
}

// ─── Meeting Prep Generator ────────────────────────────────────────────────────

/**
 * Generate pre-meeting prep notes: key questions, potential objections,
 * context to pull, and success criteria specific to the meeting type.
 * Returns the prep notes as plain text.
 */
export async function generateMeetingPrep(meeting: Meeting): Promise<string> {
  const agendaSummary = meeting.agendaItems.length > 0
    ? meeting.agendaItems.map(a => `  - ${a.topic}${a.owner ? ` (${a.owner})` : ''}${a.durationMinutes ? ` [${a.durationMinutes}m]` : ''}`).join('\n')
    : '  (no agenda set yet)';

  const prompt = `You are an ADHD-aware executive coach helping a leader prepare for a meeting.

Meeting: ${meeting.title}
Type: ${meeting.type}
Date: ${meeting.date}${meeting.time ? ` at ${meeting.time}` : ''}
${meeting.durationMinutes ? `Duration: ${meeting.durationMinutes} minutes` : ''}
${meeting.attendees.length ? `Attendees: ${meeting.attendees.join(', ')}` : ''}
${meeting.location ? `Location: ${meeting.location}` : ''}
${meeting.objective ? `Objective: ${meeting.objective}` : ''}

Agenda:
${agendaSummary}

Generate concise, actionable prep notes using this exact structure. Use bullet points only. Be specific, not generic:

**What to have ready**
- Data, documents, or numbers to pull before the meeting

**Key questions to drive the conversation**
- Questions that move the agenda forward or surface decisions

**Likely blockers or objections — and how to handle them**
- What might come up; a short response or reframe for each

**What you want to leave with**
- The specific outcomes, decisions, or commitments you need by end of meeting

Keep it tight — max 4 bullets per section. ADHD-friendly: no fluff, no filler, action-oriented language only.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type');
  return block.text;
}
