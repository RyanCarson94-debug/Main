import { useState } from 'react';
import { Plus, Trash2, Target, TrendingUp } from 'lucide-react';
import type { OKR, KeyResult } from '../types';

interface OKRViewProps {
  okrs: OKR[];
  onAddOKR: (okr: Omit<OKR, 'id'>) => void;
  onUpdateOKR: (id: string, updates: Partial<OKR>) => void;
  onDeleteOKR: (id: string) => void;
}

export function OKRView({ okrs, onAddOKR, onUpdateOKR, onDeleteOKR }: OKRViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [newObj, setNewObj] = useState('');
  const [newQuarter, setNewQuarter] = useState('Q2 2025');

  const addOKR = () => {
    if (!newObj.trim()) return;
    onAddOKR({ objective: newObj.trim(), keyResults: [], quarter: newQuarter });
    setNewObj('');
    setShowForm(false);
  };

  const addKR = (okrId: string, okr: OKR) => {
    const kr: KeyResult = {
      id: crypto.randomUUID(),
      description: 'New key result',
      progress: 0,
      target: '100%',
      current: '0%',
    };
    onUpdateOKR(okrId, { keyResults: [...okr.keyResults, kr] });
  };

  const updateKR = (okr: OKR, krId: string, updates: Partial<KeyResult>) => {
    onUpdateOKR(okr.id, {
      keyResults: okr.keyResults.map(kr => kr.id === krId ? { ...kr, ...updates } : kr),
    });
  };

  const deleteKR = (okr: OKR, krId: string) => {
    onUpdateOKR(okr.id, { keyResults: okr.keyResults.filter(kr => kr.id !== krId) });
  };

  const avgProgress = (okr: OKR) => {
    if (!okr.keyResults.length) return 0;
    return Math.round(okr.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / okr.keyResults.length);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Target className="text-purple-400" size={24} />
            OKRs
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Objectives & Key Results</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all"
        >
          <Plus size={16} />
          New Objective
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 rounded-2xl border border-white/10 bg-purple-500/5 animate-[fadeIn_0.15s_ease-out]">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <input
                autoFocus
                value={newObj}
                onChange={e => setNewObj(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addOKR()}
                placeholder="What's your objective? (e.g. Build a high-performing team)"
                className="w-full bg-black/30 border border-[#2C2C30] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
              <input
                value={newQuarter}
                onChange={e => setNewQuarter(e.target.value)}
                placeholder="Quarter (e.g. Q2 2025)"
                className="w-full bg-black/30 border border-[#2C2C30] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowForm(false)} className="px-3 py-2.5 rounded-xl border border-[#2C2C30] text-gray-400 hover:text-white text-sm">Cancel</button>
              <button onClick={addOKR} className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm">Add</button>
            </div>
          </div>
        </div>
      )}

      {okrs.length === 0 && !showForm ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-600">
          <Target size={48} className="mb-3 opacity-20" />
          <p className="font-semibold text-gray-500">No objectives yet</p>
          <p className="text-sm mt-1">Set your first OKR to align your leadership focus</p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto flex-1">
          {okrs.map(okr => {
            const progress = avgProgress(okr);
            return (
              <div key={okr.id} className="rounded-2xl border border-[#2C2C30] bg-white/2 overflow-hidden">
                {/* Objective header */}
                <div className="flex items-start justify-between p-4 border-b border-[#2C2C30]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">{okr.quarter}</span>
                    </div>
                    <h3 className="font-black text-white text-base leading-snug">{okr.objective}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-purple-400 shrink-0">{progress}%</span>
                    </div>
                  </div>
                  <button onClick={() => onDeleteOKR(okr.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 ml-3 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Key Results */}
                <div className="p-3 space-y-2">
                  {okr.keyResults.map(kr => (
                    <div key={kr.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/2 border border-white/5 group">
                      <TrendingUp size={14} className="text-pink-400 shrink-0" />
                      <input
                        value={kr.description}
                        onChange={e => updateKR(okr, kr.id, { description: e.target.value })}
                        className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none min-w-0"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={kr.progress}
                          onChange={e => updateKR(okr, kr.id, { progress: Number(e.target.value) })}
                          className="w-20 accent-purple-500"
                        />
                        <span className="text-xs font-bold text-purple-400 w-8 text-right">{kr.progress}%</span>
                        <button
                          onClick={() => deleteKR(okr, kr.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addKR(okr.id, okr)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#2C2C30] text-gray-600 hover:text-gray-400 hover:border-gray-600 text-xs font-medium transition-colors w-full"
                  >
                    <Plus size={11} />
                    Add key result
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
