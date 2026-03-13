import { BookOpen, Tag } from 'lucide-react';
import type { Framework } from '../frameworks-data';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Strategy': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  'Leadership & Management': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'Decision-Making': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'Problem-Solving': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'Change & Transformation': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  'People & Talent': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  'Teams & Culture': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  'Communication & Influence': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  'Operations & Process': { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20' },
  'Governance & Risk': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  'Project & Portfolio': { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  'HR & Organisation': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

interface FrameworkCardProps {
  framework: Framework;
  onClick: (framework: Framework) => void;
}

export function FrameworkCard({ framework, onClick }: FrameworkCardProps) {
  const color = CATEGORY_COLORS[framework.category] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };

  return (
    <button
      onClick={() => onClick(framework)}
      className="w-full text-left p-4 rounded-xl bg-[#16103A] border border-[#2D1F5E] hover:border-purple-500/40 hover:bg-[#1C1448] transition-all group"
    >
      {/* Category badge */}
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 ${color.bg} ${color.text} border ${color.border}`}>
        <BookOpen size={9} />
        {framework.category}
      </div>

      {/* Name */}
      <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors leading-tight mb-1.5">
        {framework.name}
      </h3>

      {/* Origin */}
      <p className="text-[11px] text-gray-500 mb-2">{framework.origin}</p>

      {/* Description excerpt */}
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">
        {framework.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {framework.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-500 bg-white/5 border border-white/5"
          >
            <Tag size={8} />
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

export { CATEGORY_COLORS };
