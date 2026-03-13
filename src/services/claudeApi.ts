import Anthropic from '@anthropic-ai/sdk';
import type { Task, FocusStep, DumpItem } from '../types';

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
