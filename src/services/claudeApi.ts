import Anthropic from '@anthropic-ai/sdk';
import type { Task } from '../types';

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
