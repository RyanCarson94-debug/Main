import { useState } from 'react';
import { Plus, Trash2, Users, MessageSquare } from 'lucide-react';
import type { FirstTeamMember } from '../types';

interface FirstTeamViewProps {
  members: FirstTeamMember[];
  onAdd: (member: Omit<FirstTeamMember, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<FirstTeamMember>) => void;
  onDelete: (id: string) => void;
}

const AVATARS = ['👤', '👩‍💼', '👨‍💼', '🧑‍💻', '👩‍🔬', '👨‍🎨', '🧑‍🏫', '👩‍🚀'];

export function FirstTeamView({ members, onAdd, onUpdate, onDelete }: FirstTeamViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({ name: newName.trim(), role: newRole.trim() });
    setNewName('');
    setNewRole('');
    setShowForm(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="text-pink-400" size={24} />
            First Team
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Your peer leadership team — Lencioni's First Team model</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {/* Framework explanation */}
      <div className="mb-4 p-4 rounded-2xl bg-pink-500/5 border border-pink-500/20">
        <p className="text-xs font-semibold text-pink-300 mb-1">About First Team</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Patrick Lencioni's model says great leaders prioritize alignment with their <strong className="text-gray-300">peer leadership team</strong> over their own direct reports. Your First Team are the colleagues you're accountable to as a leader.
        </p>
      </div>

      {showForm && (
        <div className="mb-4 p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 animate-[fadeIn_0.15s_ease-out]">
          <div className="flex gap-3 items-end">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Name"
                className="bg-black/30 border border-[#2D1F5E] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
              <input
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Role / Title"
                className="bg-black/30 border border-[#2D1F5E] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowForm(false)} className="px-3 py-2.5 rounded-xl border border-[#2D1F5E] text-gray-400 hover:text-white text-sm">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm">Add</button>
            </div>
          </div>
        </div>
      )}

      {members.length === 0 && !showForm ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-600">
          <Users size={48} className="mb-3 opacity-20" />
          <p className="font-semibold text-gray-500">No team members yet</p>
          <p className="text-sm mt-1">Add your peer leaders to track your First Team commitments</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 overflow-y-auto">
          {members.map((member, idx) => (
            <div key={member.id} className="rounded-2xl border border-[#2D1F5E] bg-white/2 p-4 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{AVATARS[idx % AVATARS.length]}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{member.name}</p>
                    <p className="text-xs text-pink-400 font-medium">{member.role || 'No role set'}</p>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(member.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Commitment field */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-500/70 uppercase tracking-wider mb-1.5">
                  <MessageSquare size={9} />
                  Commitment / Open Loop
                </label>
                <textarea
                  value={member.commitment ?? ''}
                  onChange={e => onUpdate(member.id, { commitment: e.target.value })}
                  placeholder="Any open commitments or follow-through items..."
                  rows={2}
                  className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-3 py-2 text-white text-xs placeholder-amber-900 focus:outline-none focus:border-amber-500/40 resize-none transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
