import { ScrollText, Save } from 'lucide-react';
import type { RoleClarityDoc } from '../types';

// ─── Sections config ──────────────────────────────────────────────────────────

const SECTIONS: Array<{
  key: keyof Omit<RoleClarityDoc, 'updatedAt'>;
  label: string;
  subtitle: string;
  placeholder: string;
  rows: number;
  type?: 'input';
}> = [
  {
    key: 'roleTitle',
    label: 'Role Title',
    subtitle: 'Your current title and how you describe your role',
    placeholder: 'e.g. VP of Engineering, Head of Product, CTO',
    rows: 1,
    type: 'input',
  },
  {
    key: 'scope',
    label: 'Scope',
    subtitle: 'What does your role cover? Which teams, domains, or functions?',
    placeholder: 'e.g. Platform engineering (4 squads, 22 people), infrastructure, developer experience, and technical strategy',
    rows: 3,
  },
  {
    key: 'coreAccountabilities',
    label: 'Core Accountabilities',
    subtitle: 'The 5–7 things you are fundamentally responsible for in this role',
    placeholder: '1. Engineering execution — velocity, quality, delivery\n2. Team health and retention\n3. Technical architecture and long-term platform decisions\n4. Cross-functional collaboration with Product and Design\n5. Hiring and growing senior engineers\n6. Managing upward — keeping leadership informed',
    rows: 7,
  },
  {
    key: 'iOwn',
    label: 'I Own',
    subtitle: 'Decisions and outcomes you make autonomously — no sign-off needed',
    placeholder: 'e.g.\n- All engineering hiring decisions (except Director and above)\n- Technical architecture choices within approved budget\n- Team structure and squad composition\n- Performance management for my direct reports',
    rows: 6,
  },
  {
    key: 'iDontOwn',
    label: "I Don't Own",
    subtitle: 'Explicit non-ownership — what is NOT yours to decide or deliver',
    placeholder: 'e.g.\n- Product roadmap priority (that\'s PM\'s call)\n- Company pricing decisions\n- Legal / compliance sign-off\n- Sales pipeline — I advise but don\'t own',
    rows: 5,
  },
  {
    key: 'decisionRights',
    label: 'Decision Rights',
    subtitle: 'How decisions flow in and around your role — who decides what',
    placeholder: 'DECIDE: Technical direction, team org, engineering hiring\nCONSULT: Roadmap sequencing, customer commitments, budget overruns\nINFORM: Company strategy changes, reorgs above my level\nDELEGATE: Sprint planning, individual PR reviews, on-call scheduling',
    rows: 6,
  },
  {
    key: 'keyInterfaces',
    label: 'Key Interfaces',
    subtitle: 'Who you depend on and who depends on you — and how',
    placeholder: 'Product (daily): roadmap alignment, feature scoping, trade-off decisions\nDesign (weekly): component library, UX feasibility, handoffs\nCEO (weekly 1:1): strategic alignment, escalations, hiring decisions\nFinance (monthly): headcount planning, tooling budget\nSales (as needed): technical due diligence, enterprise deals',
    rows: 6,
  },
  {
    key: 'successLooksLike',
    label: 'Success Looks Like',
    subtitle: 'What does excellent look like in this role at its best?',
    placeholder: 'e.g. Team ships reliably without me in every decision. Engineers are growing and retention is high. Leadership trusts the platform. I spend 60%+ of time on direction-setting, not fire-fighting.',
    rows: 4,
  },
  {
    key: 'workingPrinciples',
    label: 'Working Principles',
    subtitle: 'How you operate — your non-negotiables and defaults (optional)',
    placeholder: 'e.g.\n- Default to async — I don\'t need a meeting for everything\n- Written > verbal for decisions\n- I give context, not just tasks\n- I protect deep work blocks — don\'t book me before 10am',
    rows: 5,
  },
];

// ─── View ─────────────────────────────────────────────────────────────────────

interface RoleClarityViewProps {
  doc: RoleClarityDoc;
  onSave: (updates: Partial<RoleClarityDoc>) => void;
}

export function RoleClarityView({ doc, onSave }: RoleClarityViewProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <ScrollText className="text-emerald-400" size={24} /> Role Clarity
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              A living document — what you own, what you don't, and how decisions flow through your role
            </p>
          </div>
          {doc.updatedAt && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0 mt-1">
              <Save size={11} />
              <span>Saved {doc.updatedAt.split('T')[0]}</span>
            </div>
          )}
        </div>
        {!doc.roleTitle && (
          <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <ScrollText size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300">
              Start with Role Title and Scope, then work through each section. Takes 20–30 minutes. <span className="text-gray-500">All changes save automatically.</span>
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="space-y-6 max-w-3xl">
          {/* Header row for role title + meta */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <p className="text-sm font-bold text-white mb-1.5">Role Title</p>
              <p className="text-xs text-gray-500 mb-2">Your current title and how you describe your role</p>
              <input
                value={doc.roleTitle ?? ''}
                onChange={e => onSave({ roleTitle: e.target.value })}
                placeholder="e.g. VP of Engineering, Head of Product, CTO"
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1.5">Team Size</p>
                <input
                  value={doc.teamSize ?? ''}
                  onChange={e => onSave({ teamSize: e.target.value })}
                  placeholder="e.g. 22 people"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1.5">Reports To</p>
                <input
                  value={doc.reportsTo ?? ''}
                  onChange={e => onSave({ reportsTo: e.target.value })}
                  placeholder="e.g. CEO, CPO"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Remaining sections */}
          {SECTIONS.filter(s => s.key !== 'roleTitle').map(s => (
            <div key={s.key}>
              <p className="text-sm font-bold text-white mb-0.5">{s.label}</p>
              <p className="text-xs text-gray-500 mb-2">{s.subtitle}</p>
              <textarea
                value={(doc[s.key] as string | undefined) ?? ''}
                onChange={e => onSave({ [s.key]: e.target.value })}
                rows={s.rows}
                placeholder={s.placeholder}
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
