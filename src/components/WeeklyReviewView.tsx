import { useState } from 'react';
import { CalendarCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import type { WeeklyReview } from '../types';
import { getWeekStart } from '../store';

interface WeeklyReviewViewProps {
  reviews: WeeklyReview[];
  onSave: (review: Omit<WeeklyReview, 'id'>) => void;
}

const ENERGY_LABELS = ['', '😴 Drained', '😐 Low', '🙂 Okay', '😊 Good', '🔥 On fire'];

function getWeekLabel(weekOf: string): string {
  const d = new Date(weekOf);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

// ─── Review Form ──────────────────────────────────────────────────────────────

function ReviewForm({
  weekOf,
  existing,
  onSave,
}: {
  weekOf: string;
  existing?: WeeklyReview;
  onSave: (r: Omit<WeeklyReview, 'id'>) => void;
}) {
  const [wins, setWins] = useState(existing?.wins ?? '');
  const [slipped, setSlipped] = useState(existing?.slipped ?? '');
  const [commitmentsMade, setCommitmentsMade] = useState(existing?.commitmentsMade ?? '');
  const [nextWeekFocus, setNextWeekFocus] = useState(existing?.nextWeekFocus ?? '');
  const [energyRating, setEnergyRating] = useState(existing?.energyRating ?? 3);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saved, setSaved] = useState(false);

  const submit = () => {
    if (!wins.trim() && !nextWeekFocus.trim()) return;
    onSave({ weekOf, wins, slipped, commitmentsMade, nextWeekFocus, energyRating, notes: notes || undefined, completedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
        <p className="text-xs font-black text-purple-400 uppercase tracking-widest">Week of {getWeekLabel(weekOf)}</p>
      </div>

      <ReviewField
        label="What shipped this week?"
        emoji="✅"
        hint="Wins, completions, progress made"
        value={wins}
        onChange={setWins}
        placeholder="What got done? What are you proud of?"
      />
      <ReviewField
        label="What slipped?"
        emoji="😬"
        hint="Honest reflection — no judgment"
        value={slipped}
        onChange={setSlipped}
        placeholder="What didn't happen? What got pushed?"
      />
      <ReviewField
        label="Commitments made this week"
        emoji="🤝"
        hint="What did you promise to others?"
        value={commitmentsMade}
        onChange={setCommitmentsMade}
        placeholder="Who did you commit to, and what?"
      />
      <ReviewField
        label="The ONE focus for next week"
        emoji="🎯"
        hint="If you only accomplish one thing next week…"
        value={nextWeekFocus}
        onChange={setNextWeekFocus}
        placeholder="This week I must…"
      />

      {/* Energy rating */}
      <div>
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
          Energy / wellbeing this week
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setEnergyRating(n)}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                energyRating === n
                  ? 'bg-purple-600/20 border-purple-500/40 text-white'
                  : 'border-[#2C2C30] text-gray-600 hover:border-gray-500'
              }`}
            >
              {ENERGY_LABELS[n]}
            </button>
          ))}
        </div>
      </div>

      <ReviewField
        label="Notes (optional)"
        emoji="📝"
        hint="Anything else worth capturing"
        value={notes}
        onChange={setNotes}
        placeholder="Reflections, observations, gratitude…"
      />

      <button
        onClick={submit}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-purple-500/20"
      >
        {saved ? '✓ Saved!' : existing ? 'Update Review' : 'Complete Review'}
      </button>
    </div>
  );
}

function ReviewField({
  label, emoji, hint, value, onChange, placeholder,
}: {
  label: string; emoji: string; hint: string;
  value: string; onChange: (v: string) => void; placeholder: string;
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
        className="w-full px-3 py-2.5 rounded-xl bg-[#1C1C1F] border border-[#2C2C30] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
      />
    </div>
  );
}

// ─── Past Review Card ─────────────────────────────────────────────────────────

function PastReviewCard({ review, onClick }: { review: WeeklyReview; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-xl bg-[#1C1C1F] border border-[#2C2C30] hover:border-white/10 transition-all"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-gray-300">{getWeekLabel(review.weekOf)}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs">{ENERGY_LABELS[review.energyRating]}</span>
          <ChevronRight size={12} className="text-gray-600" />
        </div>
      </div>
      {review.nextWeekFocus && (
        <p className="text-xs text-gray-500 truncate">→ {review.nextWeekFocus}</p>
      )}
    </button>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function WeeklyReviewView({ reviews, onSave }: WeeklyReviewViewProps) {
  const thisWeek = getWeekStart(new Date());
  const thisWeekReview = reviews.find(r => r.weekOf === thisWeek);
  const pastReviews = reviews.filter(r => r.weekOf !== thisWeek);
  const [viewingPast, setViewingPast] = useState<WeeklyReview | null>(null);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <CalendarCheck className="text-emerald-400" size={24} />
            Weekly Review
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">A consistent reflection practice is the compounding habit of great leaders</p>
        </div>
        {thisWeekReview && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">This week done</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex gap-5">
        {/* Left: form */}
        <div className="flex-1 overflow-y-auto">
          {viewingPast ? (
            <div>
              <button onClick={() => setViewingPast(null)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mb-4 transition-colors">
                ← Back to this week
              </button>
              <ReviewForm weekOf={viewingPast.weekOf} existing={viewingPast} onSave={r => { onSave(r); setViewingPast(null); }} />
            </div>
          ) : (
            <ReviewForm weekOf={thisWeek} existing={thisWeekReview} onSave={onSave} />
          )}
        </div>

        {/* Right: past reviews */}
        {pastReviews.length > 0 && (
          <div className="w-[240px] shrink-0 flex flex-col">
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Past Reviews ({pastReviews.length})</p>
            <div className="flex-1 overflow-y-auto space-y-2">
              {pastReviews.map(r => (
                <PastReviewCard key={r.id} review={r} onClick={() => setViewingPast(r)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
