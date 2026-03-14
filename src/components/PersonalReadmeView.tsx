import { useState } from 'react';
import { BookUser, Save, Copy, Check } from 'lucide-react';
import type { PersonalReadme } from '../types';

// ─── Sections ─────────────────────────────────────────────────────────────────

const SECTIONS: Array<{
  group: string;
  fields: Array<{
    key: keyof Omit<PersonalReadme, 'updatedAt'>;
    label: string;
    subtitle: string;
    placeholder: string;
    rows: number;
    type?: 'input';
  }>;
}> = [
  {
    group: 'About me',
    fields: [
      {
        key: 'myRole',
        label: 'My role',
        subtitle: 'Title and what I\'m here to do',
        placeholder: 'e.g. VP of Engineering — I\'m here to build the team and the platform that lets us scale.',
        rows: 1,
        type: 'input',
      },
      {
        key: 'myWhy',
        label: 'Why I\'m here',
        subtitle: 'What drives me — what I care about beyond the job title',
        placeholder: 'e.g. I care about building environments where smart people can do their best work without bureaucracy getting in the way.',
        rows: 2,
      },
      {
        key: 'currentFocus',
        label: 'What I\'m focused on right now',
        subtitle: 'My top priorities this quarter — useful for knowing when to pull me in',
        placeholder: 'e.g. Q2: Platform stability, getting hiring to 90% capacity, and improving eng-product communication.',
        rows: 2,
      },
    ],
  },
  {
    group: 'How to reach me',
    fields: [
      {
        key: 'preferredChannels',
        label: 'Preferred channels',
        subtitle: 'How and where to contact me — and for what',
        placeholder: 'Slack for async, quick questions, and FYIs.\nEmail for anything requiring a paper trail or >3 sentences.\nCal invite for anything that needs a real conversation.\nDon\'t: cold-call or text unless urgent.',
        rows: 4,
      },
      {
        key: 'responseTime',
        label: 'Response times',
        subtitle: 'When to expect a reply — and when to escalate',
        placeholder: 'Slack: same day (usually within 2hrs during core hours 9–6).\nEmail: 24–48hrs.\nIf urgent: message me + call.\nI don\'t check messages after 7pm — if it can\'t wait until morning, call.',
        rows: 3,
      },
      {
        key: 'meetingPreferences',
        label: 'Meetings',
        subtitle: 'How I prefer to run and attend meetings',
        placeholder: 'Always send an agenda — I won\'t attend meetings without one.\nDefault to 25-min over 30.\nI time-box and cut meetings short when we hit the objective early.\nI prefer mornings for strategy, afternoons for reviews.',
        rows: 4,
      },
    ],
  },
  {
    group: 'Working with me',
    fields: [
      {
        key: 'bringMeProblems',
        label: 'How to bring me problems',
        subtitle: 'What I need to act — what helps me help you',
        placeholder: 'Come with: the problem clearly stated, what you\'ve already tried, and what you need from me (decision / unblocking / just venting).\nDon\'t: send me a wall of context and ask "what should I do?" — I\'ll ask you what you think first.',
        rows: 4,
      },
      {
        key: 'howIDecide',
        label: 'How I make decisions',
        subtitle: 'My decision-making style and what slows me down',
        placeholder: 'I decide fast on reversible things. I slow down on irreversible ones — especially people decisions.\nI need: the data, the options, and the recommendation. I\'ll often push back to see how strongly you hold your view.\nI hate: death by committee and decisions that bounce back repeatedly.',
        rows: 4,
      },
      {
        key: 'myQuirks',
        label: 'My quirks',
        subtitle: 'Honest self-awareness — things to know working with me',
        placeholder: 'I have ADHD. When I go quiet, I\'m thinking — not ignoring you.\nI can seem blunt. I\'m not being unkind, I\'m being efficient.\nI get bored in process-heavy meetings and start going tangential.\nIf I interrupt, pull me back — I\'m trying to engage, not dismiss.',
        rows: 4,
      },
    ],
  },
  {
    group: 'My best (and worst) self',
    fields: [
      {
        key: 'bestWork',
        label: 'When I do my best work',
        subtitle: 'Conditions that help me perform at my best',
        placeholder: 'Deep work: mornings before 11am with no meetings.\nI need context-switching recovery time — don\'t schedule calls back-to-back.\nI work best with clear goals and loose process, not the reverse.\nMusic helps. Open offices don\'t.',
        rows: 4,
      },
      {
        key: 'drainsMe',
        label: 'What drains me',
        subtitle: 'Honest list of what kills my energy and focus',
        placeholder: 'Meetings without a point.\nAmbiguity on who owns what.\nRewriting the same decision three times because alignment wasn\'t done upfront.\nAdmin and process tasks when there\'s meaningful work to do.',
        rows: 3,
      },
    ],
  },
  {
    group: 'What a great interaction looks like',
    fields: [
      {
        key: 'greenFlags',
        label: 'Green flags',
        subtitle: 'What makes working with me easy and enjoyable',
        placeholder: 'You come prepared and have a view.\nYou disagree directly and early, not after the decision.\nYou take the ball and run with it, then tell me what happened.\nYou tell me bad news early.',
        rows: 4,
      },
      {
        key: 'redFlags',
        label: 'Red flags',
        subtitle: 'What creates friction — so we can avoid it',
        placeholder: 'Surprises (especially bad ones I should have known about earlier).\nPassive-aggressive communication — say the thing.\nComing to me with half-formed problems and expecting me to do all the thinking.\nCopying me on everything — use judgment.',
        rows: 4,
      },
    ],
  },
];

// ─── Copy as Text ─────────────────────────────────────────────────────────────

function buildShareableText(doc: PersonalReadme): string {
  const lines: string[] = ['# Working with Me\n'];
  for (const section of SECTIONS) {
    const filled = section.fields.filter(f => !!doc[f.key]);
    if (filled.length === 0) continue;
    lines.push(`## ${section.group}`);
    for (const f of filled) {
      lines.push(`\n### ${f.label}`);
      lines.push(String(doc[f.key]));
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ─── View ─────────────────────────────────────────────────────────────────────

interface PersonalReadmeViewProps {
  doc: PersonalReadme;
  onSave: (updates: Partial<PersonalReadme>) => void;
}

export function PersonalReadmeView({ doc, onSave }: PersonalReadmeViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildShareableText(doc));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filledCount = SECTIONS.flatMap(s => s.fields).filter(f => !!doc[f.key]).length;
  const totalCount  = SECTIONS.flatMap(s => s.fields).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BookUser className="text-sky-400" size={24} /> Personal README
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              How you work — share this with your team so they can work with you, not around you
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 mt-1">
            {doc.updatedAt && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Save size={11} />
                <span>Saved {doc.updatedAt.split('T')[0]}</span>
              </div>
            )}
            <button
              onClick={handleCopy}
              disabled={filledCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#2A2640] text-gray-400 hover:text-gray-200 hover:border-gray-500 text-xs font-semibold transition-colors disabled:opacity-40"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy as text'}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">{filledCount}/{totalCount} sections filled</span>
            <span className="text-xs text-gray-600">{Math.round((filledCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-[#2A2640] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((filledCount / totalCount) * 100)}%` }} />
          </div>
        </div>

        {filledCount === 0 && (
          <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-sky-500/5 border border-sky-500/20">
            <BookUser size={14} className="text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-300">
              Start anywhere — there's no wrong order. Each section you fill in makes it easier for your team to work with you effectively.{' '}
              <span className="text-gray-500">Saves automatically. Use "Copy as text" to share it.</span>
            </p>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="space-y-10 max-w-3xl">
          {SECTIONS.map(section => (
            <div key={section.group}>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 border-b border-[#2A2640] pb-2">
                {section.group}
              </h3>
              <div className="space-y-5">
                {section.fields.map(field => (
                  <div key={field.key}>
                    <p className="text-sm font-bold text-white mb-0.5">{field.label}</p>
                    <p className="text-xs text-gray-500 mb-2">{field.subtitle}</p>
                    {field.type === 'input' ? (
                      <input
                        value={(doc[field.key] as string | undefined) ?? ''}
                        onChange={e => onSave({ [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-sky-500"
                      />
                    ) : (
                      <textarea
                        value={(doc[field.key] as string | undefined) ?? ''}
                        onChange={e => onSave({ [field.key]: e.target.value })}
                        rows={field.rows}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-sky-500 leading-relaxed"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
