import { useState, useEffect } from 'react';
import { Compass, Plus, X, Save, CheckCircle2 } from 'lucide-react';
import type { NorthStar } from '../types';

interface NorthStarViewProps {
  northStar: NorthStar | null;
  onSave: (ns: NorthStar) => void;
}

export function NorthStarView({ northStar, onSave }: NorthStarViewProps) {
  const [statement, setStatement] = useState(northStar?.statement ?? '');
  const [antiGoals, setAntiGoals] = useState<string[]>(northStar?.antiGoals ?? []);
  const [pillars, setPillars] = useState<string[]>(northStar?.pillars ?? ['', '', '']);
  const [newAntiGoal, setNewAntiGoal] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (northStar) {
      setStatement(northStar.statement);
      setAntiGoals(northStar.antiGoals);
      setPillars(northStar.pillars.length ? northStar.pillars : ['', '', '']);
    }
  }, [northStar]);

  const handleSave = () => {
    onSave({
      statement,
      antiGoals,
      pillars: pillars.filter(p => p.trim()),
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addAntiGoal = () => {
    if (!newAntiGoal.trim()) return;
    setAntiGoals(prev => [...prev, newAntiGoal.trim()]);
    setNewAntiGoal('');
  };

  const removeAntiGoal = (i: number) => setAntiGoals(prev => prev.filter((_, idx) => idx !== i));

  const setPillar = (i: number, val: string) => {
    setPillars(prev => { const next = [...prev]; next[i] = val; return next; });
  };

  const addPillarSlot = () => setPillars(prev => [...prev, '']);

  return (
    <div className="h-full overflow-y-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Compass className="text-pink-400" size={24} />
            North Star
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Your strategic anchor — what winning looks like this quarter</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-purple-500/30"
        >
          {saved ? <><CheckCircle2 size={15} /> Saved</> : <><Save size={15} /> Save</>}
        </button>
      </div>

      {northStar?.updatedAt && (
        <p className="text-xs text-gray-600 mb-4">
          Last updated {new Date(northStar.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}

      {/* North Star Statement */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
        <label className="block text-xs font-black text-purple-400 uppercase tracking-widest mb-3">
          This quarter, I win if…
        </label>
        <textarea
          value={statement}
          onChange={e => setStatement(e.target.value)}
          placeholder="e.g. My team ships the new platform on time, with high quality, and my people feel supported and growing."
          rows={3}
          className="w-full bg-transparent text-white text-base leading-relaxed placeholder-purple-900 focus:outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Strategic Pillars */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black text-white">Strategic Pillars</h3>
              <p className="text-xs text-gray-500 mt-0.5">Your 3–5 focus areas this quarter</p>
            </div>
            {pillars.length < 5 && (
              <button onClick={addPillarSlot} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
                <Plus size={12} /> Add
              </button>
            )}
          </div>
          <div className="space-y-2">
            {pillars.map((pillar, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-700 w-4 text-right shrink-0">{i + 1}</span>
                <input
                  value={pillar}
                  onChange={e => setPillar(i, e.target.value)}
                  placeholder={`Pillar ${i + 1}…`}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-[#16103A] border border-[#2D1F5E] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                />
                {pillars.length > 1 && (
                  <button onClick={() => setPillars(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-700 hover:text-red-400 transition-colors shrink-0">
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Anti-Goals */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-black text-white">Anti-Goals</h3>
            <p className="text-xs text-gray-500 mt-0.5">What you are explicitly NOT doing</p>
          </div>
          <div className="space-y-2 mb-2">
            {antiGoals.length === 0 && (
              <p className="text-xs text-gray-700 italic py-2">No anti-goals set — saying no is a superpower.</p>
            )}
            {antiGoals.map((ag, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/15 group">
                <span className="text-red-500/50 text-xs font-bold shrink-0">✕</span>
                <p className="flex-1 text-sm text-gray-300">{ag}</p>
                <button onClick={() => removeAntiGoal(i)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newAntiGoal}
              onChange={e => setNewAntiGoal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAntiGoal()}
              placeholder="I will NOT pursue…"
              className="flex-1 px-3 py-2.5 rounded-xl bg-[#16103A] border border-[#2D1F5E] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30"
            />
            <button onClick={addAntiGoal} disabled={!newAntiGoal.trim()} className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-colors">
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Reminder */}
      <div className="mt-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15">
        <p className="text-xs font-bold text-amber-500/70 uppercase tracking-widest mb-1">ADHD Leadership Tip</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Print your North Star. Put it somewhere visible. When someone asks you to take on new work, ask: does this serve my pillars? If not, refer to your anti-goals.
        </p>
      </div>
    </div>
  );
}
