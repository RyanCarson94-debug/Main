import { useState } from 'react';
import {
  CalendarCheck, CheckCircle2, ChevronRight, Sparkles, Download,
  Loader2, Telescope, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { WeeklyReview, Task, QuarterlyPlan } from '../types';
import { getWeekStart } from '../store';
import { generateWeeklySummary } from '../services/claudeApi';
import { exportWeeklyReviewCSV } from '../utils/export';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ENERGY_LABELS = ['', '😴 Drained', '😐 Low', '🙂 Okay', '😊 Good', '🔥 On fire'];
const QUARTER_COLORS: Record<number, string> = {
  1: 'text-sky-300', 2: 'text-emerald-300', 3: 'text-amber-300', 4: 'text-violet-300'
};

function getWeekLabel(weekOf: string): string {
  const d   = new Date(weekOf);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

// ─── Quarterly Context Banner ─────────────────────────────────────────────────

function QuarterlyContextBanner({ plan }: { plan: QuarterlyPlan }) {
  const [expanded, setExpanded] = useState(false);
  const qColor = QUARTER_COLORS[plan.quarterNum];

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-violet-500/5 transition-colors">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Telescope size={13} className="text-violet-400 shrink-0" />
            <span className={`font-black text-sm ${qColor}`}>Q{plan.quarterNum} {plan.year}</span>
            {plan.theme && <span className="text-gray-400 text-sm italic">— "{plan.theme}"</span>}
          </div>
          {plan.focusAreas.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {plan.focusAreas.map((f, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300">{f}</span>
              ))}
            </div>
          )}
        </div>
        {expanded
          ? <ChevronUp size={13} className="text-gray-500 shrink-0" />
          : <ChevronDown size={13} className="text-gray-500 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-violet-500/10 pt-3 space-y-2 text-xs text-gray-400">
          {plan.notList && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Not-list this quarter</p>
              <p className="whitespace-pre-wrap text-gray-500">{plan.notList}</p>
            </div>
          )}
          {plan.upwardCommitments && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Upward commitments</p>
              <p className="text-gray-500">{plan.upwardCommitments}</p>
            </div>
          )}
          {plan.successMeasures && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Success looks like</p>
              <p className="text-gray-500">{plan.successMeasures}</p>
            </div>
          )}
          {!plan.notList && !plan.upwardCommitments && !plan.successMeasures && (
            <p className="text-gray-600">Add more detail to your quarterly plan to see it here.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Review Form ──────────────────────────────────────────────────────────────

function ReviewForm({
  weekOf, existing, tasks, quarterlyPlan, onSave,
}: {
  weekOf: string;
  existing?: WeeklyReview;
  tasks: Task[];
  quarterlyPlan: QuarterlyPlan | null;
  onSave: (r: Omit<WeeklyReview, 'id'>) => void;
}) {
  const [wins,              setWins]              = useState(existing?.wins ?? '');
  const [slipped,           setSlipped]           = useState(existing?.slipped ?? '');
  const [commitmentsMade,   setCommitmentsMade]   = useState(existing?.commitmentsMade ?? '');
  const [nextWeekFocus,     setNextWeekFocus]      = useState(existing?.nextWeekFocus ?? '');
  const [energyRating,      setEnergyRating]      = useState(existing?.energyRating ?? 3);
  const [notes,             setNotes]             = useState(existing?.notes ?? '');
  const [quarterlyAlign,    setQuarterlyAlign]    = useState(existing?.quarterlyAlignment ?? '');
  const [saved,             setSaved]             = useState(false);
  const [aiSummary,         setAiSummary]         = useState('');
  const [aiLoading,         setAiLoading]         = useState(false);
  const [aiError,           setAiError]           = useState('');

  const submit = () => {
    if (!wins.trim() && !nextWeekFocus.trim()) return;
    onSave({
      weekOf, wins, slipped, commitmentsMade, nextWeekFocus, energyRating,
      notes: notes || undefined,
      quarterlyAlignment: quarterlyAlign || undefined,
      completedAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const generateSummary = async () => {
    if (!wins && !nextWeekFocus) return;
    setAiLoading(true);
    setAiError('');
    const review: WeeklyReview = existing ?? {
      id: 'draft', weekOf, wins, slipped, commitmentsMade, nextWeekFocus,
      energyRating, notes: notes || undefined,
      quarterlyAlignment: quarterlyAlign || undefined,
      completedAt: new Date().toISOString(),
    };
    const weekStart = new Date(weekOf);
    const weekEnd   = new Date(weekOf);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const completedThisWeek = tasks.filter(t =>
      t.completedAt &&
      new Date(t.completedAt) >= weekStart &&
      new Date(t.completedAt) < weekEnd,
    );
    await generateWeeklySummary(
      review, completedThisWeek,
      s => { setAiSummary(s); setAiLoading(false); },
      e => { setAiError(e); setAiLoading(false); },
      quarterlyPlan,
    );
  };

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
        <p className="text-xs font-black text-purple-400 uppercase tracking-widest">Week of {getWeekLabel(weekOf)}</p>
      </div>

      <ReviewField label="What shipped this week?" emoji="✅" hint="Wins, completions, progress made"
        value={wins} onChange={setWins} placeholder="What got done? What are you proud of?" />
      <ReviewField label="What slipped?" emoji="😬" hint="Honest reflection — no judgment"
        value={slipped} onChange={setSlipped} placeholder="What didn't happen? What got pushed?" />
      <ReviewField label="Commitments made this week" emoji="🤝" hint="What did you promise to others?"
        value={commitmentsMade} onChange={setCommitmentsMade} placeholder="Who did you commit to, and what?" />
      <ReviewField label="The ONE focus for next week" emoji="🎯" hint="If you only accomplish one thing next week…"
        value={nextWeekFocus} onChange={setNextWeekFocus}
        placeholder={quarterlyPlan?.focusAreas.length
          ? `This week I must… (Q${quarterlyPlan.quarterNum} focus: ${quarterlyPlan.focusAreas[0]})`
          : 'This week I must…'} />

      {/* Energy rating */}
      <div>
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Energy / wellbeing this week</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setEnergyRating(n)}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${energyRating === n ? 'bg-purple-600/20 border-purple-500/40 text-white' : 'border-[#2A2640] text-gray-600 hover:border-gray-500'}`}>
              {ENERGY_LABELS[n]}
            </button>
          ))}
        </div>
      </div>

      {/* Quarterly Alignment — only shown if there's an active plan with focus areas */}
      {quarterlyPlan && quarterlyPlan.focusAreas.length > 0 && (
        <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 p-4">
          <label className="flex items-center gap-1.5 text-xs font-black text-violet-400 uppercase tracking-widest mb-0.5">
            <Telescope size={11} /> Quarterly Pulse
          </label>
          <p className="text-[11px] text-gray-600 mb-2">
            How did this week track against your Q{quarterlyPlan.quarterNum} focus areas?{' '}
            <span className="text-violet-500">{quarterlyPlan.focusAreas.join(' · ')}</span>
          </p>
          <textarea
            value={quarterlyAlign}
            onChange={e => setQuarterlyAlign(e.target.value)}
            rows={2}
            placeholder="e.g. Strong on Eng velocity (shipped 2 features) · Missed stakeholder trust — cancelled exec call"
            className="w-full px-3 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none"
          />
        </div>
      )}

      <ReviewField label="Notes (optional)" emoji="📝" hint="Anything else worth capturing"
        value={notes} onChange={setNotes} placeholder="Reflections, observations, gratitude…" />

      {/* AI Summary */}
      {aiSummary && (
        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Sparkles size={10} /> AI Summary
          </p>
          <p className="text-sm text-gray-200 leading-relaxed">{aiSummary}</p>
        </div>
      )}
      {aiError && <p className="text-xs text-red-400 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{aiError}</p>}

      <div className="flex gap-2">
        <button
          onClick={generateSummary}
          disabled={aiLoading || (!wins && !nextWeekFocus)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold hover:bg-violet-500/15 transition-colors disabled:opacity-40"
        >
          {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {aiSummary ? 'Regenerate summary' : 'AI summary'}
        </button>
        <button
          onClick={submit}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all"
        >
          {saved ? '✓ Saved!' : existing ? 'Update Review' : 'Complete Review'}
        </button>
      </div>
    </div>
  );
}

function ReviewField({ label, emoji, hint, value, onChange, placeholder }: {
  label: string; emoji: string; hint: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">
        <span>{emoji}</span> {label}
      </label>
      <p className="text-[11px] text-gray-600 mb-1.5">{hint}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full px-3 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
      />
    </div>
  );
}

function PastReviewCard({ review, onClick }: { review: WeeklyReview; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-xl bg-[#1E1C28] border border-[#2A2640] hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-gray-300">{getWeekLabel(review.weekOf)}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs">{ENERGY_LABELS[review.energyRating]}</span>
          <ChevronRight size={12} className="text-gray-600" />
        </div>
      </div>
      {review.nextWeekFocus && <p className="text-xs text-gray-500 truncate">→ {review.nextWeekFocus}</p>}
      {review.quarterlyAlignment && (
        <p className="text-[11px] text-violet-500/70 truncate mt-0.5 flex items-center gap-1">
          <Telescope size={9} /> {review.quarterlyAlignment}
        </p>
      )}
    </button>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface WeeklyReviewViewProps {
  reviews:       WeeklyReview[];
  tasks:         Task[];
  quarterlyPlan: QuarterlyPlan | null;
  onSave:        (review: Omit<WeeklyReview, 'id'>) => void;
}

export function WeeklyReviewView({ reviews, tasks, quarterlyPlan, onSave }: WeeklyReviewViewProps) {
  const thisWeek       = getWeekStart(new Date());
  const thisWeekReview = reviews.find(r => r.weekOf === thisWeek);
  const pastReviews    = reviews.filter(r => r.weekOf !== thisWeek);
  const [viewingPast, setViewingPast] = useState<WeeklyReview | null>(null);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <CalendarCheck className="text-emerald-400" size={24} />
            Weekly Review
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">A consistent reflection practice is the compounding habit of great leaders</p>
        </div>
        <div className="flex items-center gap-2">
          {reviews.length > 0 && (
            <button
              onClick={() => exportWeeklyReviewCSV(reviews)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2A2640] text-gray-500 hover:text-gray-300 hover:border-gray-500 text-xs font-semibold transition-colors"
            >
              <Download size={12} /> Export CSV
            </button>
          )}
          {thisWeekReview && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">This week done</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-5">
        <div className="flex-1 overflow-y-auto space-y-5">
          {/* Quarterly context — always visible at top */}
          {quarterlyPlan && !viewingPast && (
            <QuarterlyContextBanner plan={quarterlyPlan} />
          )}

          {viewingPast ? (
            <div>
              <button onClick={() => setViewingPast(null)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mb-4 transition-colors">
                ← Back to this week
              </button>
              <ReviewForm weekOf={viewingPast.weekOf} existing={viewingPast} tasks={tasks}
                quarterlyPlan={quarterlyPlan}
                onSave={r => { onSave(r); setViewingPast(null); }} />
            </div>
          ) : (
            <ReviewForm weekOf={thisWeek} existing={thisWeekReview} tasks={tasks}
              quarterlyPlan={quarterlyPlan}
              onSave={onSave} />
          )}
        </div>

        {pastReviews.length > 0 && (
          <div className="w-[240px] shrink-0 flex flex-col">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Past Reviews ({pastReviews.length})</p>
            <div className="flex-1 overflow-y-auto space-y-2">
              {pastReviews.map(r => <PastReviewCard key={r.id} review={r} onClick={() => setViewingPast(r)} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
