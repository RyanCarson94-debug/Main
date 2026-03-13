import { useState } from 'react';
import { Users, Plus, X, Save, TrendingUp, Star, Target, ChevronRight } from 'lucide-react';
import type { UpdatePerson, Update, DirectReportProfile, Commitment } from '../types';
import { MeetingPrepModal } from './MeetingPrepModal';
import type { Task, Decision, FirstTeamMember } from '../types';

interface DirectReportsViewProps {
  people: UpdatePerson[];
  updates: Update[];
  profiles: DirectReportProfile[];
  onSaveProfile: (profile: DirectReportProfile) => void;
  commitments: Commitment[];
  decisions: Decision[];
  tasks: Task[];
  teamMembers: FirstTeamMember[];
}

function ChipInput({
  items, onAdd, onRemove, placeholder,
}: {
  items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder: string;
}) {
  const [val, setVal] = useState('');
  const add = () => {
    if (!val.trim()) return;
    onAdd(val.trim());
    setVal('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/15 border border-purple-500/20 text-xs text-purple-300">
            {item}
            <button onClick={() => onRemove(i)} className="text-purple-500 hover:text-red-400 transition-colors"><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-xl bg-[#0F0A1E] border border-[#2D1F5E] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
        />
        <button onClick={add} disabled={!val.trim()} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export function DirectReportsView({
  people, updates, profiles, onSaveProfile,
  commitments, decisions, tasks, teamMembers,
}: DirectReportsViewProps) {
  const directReports = people.filter(p => p.relationship === 'direct-report');
  const [selectedId, setSelectedId] = useState<string | null>(directReports[0]?.id ?? null);
  const [showPrep, setShowPrep] = useState(false);

  const selected = directReports.find(p => p.id === selectedId) ?? null;
  const existingProfile = selected ? profiles.find(p => p.personId === selected.id) : null;

  const [growthGoals,      setGrowthGoals]      = useState(existingProfile?.growthGoals ?? '');
  const [strengths,        setStrengths]         = useState<string[]>(existingProfile?.strengths ?? []);
  const [developmentAreas, setDevelopmentAreas] = useState<string[]>(existingProfile?.developmentAreas ?? []);
  const [performanceNotes, setPerformanceNotes] = useState(existingProfile?.performanceNotes ?? '');
  const [saved, setSaved] = useState(false);

  // Reset form when person changes
  const selectPerson = (id: string) => {
    setSelectedId(id);
    const p = profiles.find(pr => pr.personId === id);
    setGrowthGoals(p?.growthGoals ?? '');
    setStrengths(p?.strengths ?? []);
    setDevelopmentAreas(p?.developmentAreas ?? []);
    setPerformanceNotes(p?.performanceNotes ?? '');
    setSaved(false);
  };

  const handleSave = () => {
    if (!selected) return;
    onSaveProfile({
      personId: selected.id,
      growthGoals,
      strengths,
      developmentAreas,
      performanceNotes,
      lastUpdated: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Pending updates for selected person
  const pendingCount = selected
    ? updates.filter(u => u.recipientIds.includes(selected.id) && !u.discussedWith.includes(selected.id)).length
    : 0;

  if (directReports.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <Users size={48} className="text-gray-700 mb-4" />
        <h3 className="text-lg font-black text-gray-500">No direct reports set up</h3>
        <p className="text-sm text-gray-600 mt-2 max-w-xs">
          Go to <strong className="text-gray-400">1:1 Briefings</strong>, add people and set their relationship to <strong className="text-gray-400">Direct Report</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="text-purple-400" size={24} />
            Direct Reports
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Track growth, development, and performance for your team</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-5">
        {/* Left: person list */}
        <div className="w-[200px] shrink-0 flex flex-col gap-1.5">
          {directReports.map(p => {
            const pending = updates.filter(u => u.recipientIds.includes(p.id) && !u.discussedWith.includes(p.id)).length;
            const hasProfile = !!profiles.find(pr => pr.personId === p.id);
            return (
              <button
                key={p.id}
                onClick={() => selectPerson(p.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                  selectedId === p.id
                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/20 border-purple-500/30 text-white'
                    : 'text-gray-400 border-[#2D1F5E] hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  {pending > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">{pending}</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">{hasProfile ? 'Profile set up' : 'No profile yet'}</p>
              </button>
            );
          })}
        </div>

        {/* Right: profile editor */}
        {selected && (
          <div className="flex-1 overflow-y-auto space-y-5">
            {/* Person header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">{selected.name}</h3>
                <p className="text-xs text-gray-500 capitalize">Direct Report</p>
              </div>
              <div className="flex gap-2">
                {pendingCount > 0 && (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
                    {pendingCount} pending update{pendingCount > 1 ? 's' : ''}
                  </div>
                )}
                <button
                  onClick={() => setShowPrep(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 text-purple-400 text-xs font-bold transition-colors"
                >
                  Prep for 1:1 <ChevronRight size={12} />
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-400 text-xs font-bold transition-colors"
                >
                  <Save size={12} />
                  {saved ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>

            {/* Profile form */}
            <ProfileSection icon={<Target size={14} className="text-pink-400" />} label="Growth Goals">
              <textarea
                value={growthGoals}
                onChange={e => setGrowthGoals(e.target.value)}
                rows={3}
                placeholder="What are their career goals and development aspirations this quarter?"
                className="w-full px-3 py-2.5 rounded-xl bg-[#16103A] border border-[#2D1F5E] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </ProfileSection>

            <ProfileSection icon={<Star size={14} className="text-amber-400" />} label="Key Strengths">
              <ChipInput
                items={strengths}
                onAdd={v => setStrengths(prev => [...prev, v])}
                onRemove={i => setStrengths(prev => prev.filter((_, idx) => idx !== i))}
                placeholder="Add a strength…"
              />
            </ProfileSection>

            <ProfileSection icon={<TrendingUp size={14} className="text-blue-400" />} label="Development Areas">
              <ChipInput
                items={developmentAreas}
                onAdd={v => setDevelopmentAreas(prev => [...prev, v])}
                onRemove={i => setDevelopmentAreas(prev => prev.filter((_, idx) => idx !== i))}
                placeholder="Add a development area…"
              />
            </ProfileSection>

            <ProfileSection icon={<Users size={14} className="text-purple-400" />} label="Performance Notes">
              <textarea
                value={performanceNotes}
                onChange={e => setPerformanceNotes(e.target.value)}
                rows={4}
                placeholder="Observations, feedback given, patterns noticed, recent wins…"
                className="w-full px-3 py-2.5 rounded-xl bg-[#16103A] border border-[#2D1F5E] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </ProfileSection>

            {existingProfile?.lastUpdated && (
              <p className="text-[11px] text-gray-700">
                Last updated {new Date(existingProfile.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        )}
      </div>

      {showPrep && selected && (
        <MeetingPrepModal
          personName={selected.name}
          personId={selected.id}
          updates={updates}
          commitments={commitments}
          decisions={decisions}
          tasks={tasks}
          teamMembers={teamMembers}
          onClose={() => setShowPrep(false)}
        />
      )}
    </div>
  );
}

function ProfileSection({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
      </div>
      {children}
    </div>
  );
}
