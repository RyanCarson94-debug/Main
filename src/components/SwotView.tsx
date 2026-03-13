import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { SwotItem } from '../types';

interface SwotViewProps {
  items: SwotItem[];
  onAdd: (item: Omit<SwotItem, 'id'>) => void;
  onDelete: (id: string) => void;
}

type SwotCategory = 'strength' | 'weakness' | 'opportunity' | 'threat';

const CATEGORIES: {
  id: SwotCategory;
  label: string;
  emoji: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: 'strength',
    label: 'Strengths',
    emoji: '💪',
    description: 'What you do exceptionally well',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  {
    id: 'weakness',
    label: 'Weaknesses',
    emoji: '🔧',
    description: 'Areas to improve or delegate',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  {
    id: 'opportunity',
    label: 'Opportunities',
    emoji: '🚀',
    description: 'Trends or gaps you can leverage',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  {
    id: 'threat',
    label: 'Threats',
    emoji: '⚠️',
    description: 'Risks and external challenges',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-white/10',
  },
];

export function SwotView({ items, onAdd, onDelete }: SwotViewProps) {
  const [inputs, setInputs] = useState<Record<SwotCategory, string>>({
    strength: '',
    weakness: '',
    opportunity: '',
    threat: '',
  });

  const categoryItems = (cat: SwotCategory) => items.filter(i => i.category === cat);

  const addItem = (cat: SwotCategory) => {
    const text = inputs[cat].trim();
    if (!text) return;
    onAdd({ text, category: cat });
    setInputs(prev => ({ ...prev, [cat]: '' }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white">SWOT Analysis</h2>
        <p className="text-gray-400 text-sm mt-0.5">Your strategic leadership landscape</p>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        {CATEGORIES.map(cat => {
          const catItems = categoryItems(cat.id);
          return (
            <div key={cat.id} className={`flex flex-col rounded-2xl border overflow-hidden ${cat.bg} ${cat.border}`}>
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${cat.border}`}>
                <span className="text-lg">{cat.emoji}</span>
                <div>
                  <p className={`text-sm font-black uppercase tracking-wide ${cat.color}`}>{cat.label}</p>
                  <p className="text-[10px] text-gray-500">{cat.description}</p>
                </div>
                <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/5 ${cat.color}`}>
                  {catItems.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {catItems.map(item => (
                  <div key={item.id} className="flex items-start gap-2 group">
                    <p className="flex-1 text-sm text-gray-300 leading-snug py-1">{item.text}</p>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all mt-0.5 shrink-0"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>

              <div className={`flex gap-2 p-3 border-t ${cat.border}`}>
                <input
                  value={inputs[cat.id]}
                  onChange={e => setInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addItem(cat.id)}
                  placeholder={`Add ${cat.label.toLowerCase().slice(0, -1)}...`}
                  className="flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-white/20"
                />
                <button
                  onClick={() => addItem(cat.id)}
                  className={`p-2 rounded-lg hover:bg-white/10 ${cat.color} transition-colors`}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
