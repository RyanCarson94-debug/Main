import { useState, useMemo } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import { FRAMEWORKS, FRAMEWORK_CATEGORIES } from '../frameworks-data';
import type { Framework } from '../frameworks-data';
import { FrameworkCard, CATEGORY_COLORS } from './FrameworkCard';
import { FrameworkDetail } from './FrameworkDetail';

export function FrameworksLibrary() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);

  const filtered = useMemo(() => {
    let list = FRAMEWORKS;
    if (selectedCategory) {
      list = list.filter(f => f.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.tags.some(t => t.toLowerCase().includes(q)) ||
        f.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FRAMEWORKS.forEach(f => {
      counts[f.category] = (counts[f.category] ?? 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <BookOpen size={20} className="text-purple-400" />
            Frameworks Library
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} of {FRAMEWORKS.length} frameworks
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative shrink-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search frameworks, categories, tags…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 shrink-0">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            !selectedCategory
              ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40'
              : 'bg-white/5 text-gray-500 border border-white/5 hover:text-gray-300 hover:bg-white/10'
          }`}
        >
          All ({FRAMEWORKS.length})
        </button>
        {FRAMEWORK_CATEGORIES.map(cat => {
          const color = CATEGORY_COLORS[cat] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(active ? null : cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                active
                  ? `${color.bg} ${color.text} ${color.border} brightness-125`
                  : 'bg-white/5 text-gray-500 border-white/5 hover:text-gray-300 hover:bg-white/10'
              }`}
            >
              {cat} ({categoryCounts[cat] ?? 0})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen size={32} className="text-gray-700 mb-3" />
            <p className="text-sm font-semibold text-gray-600">No frameworks found</p>
            <p className="text-xs text-gray-700 mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
            {filtered.map(framework => (
              <FrameworkCard
                key={framework.id}
                framework={framework}
                onClick={setSelectedFramework}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedFramework && (
        <FrameworkDetail
          framework={selectedFramework}
          onClose={() => setSelectedFramework(null)}
          onNavigate={fw => setSelectedFramework(fw)}
        />
      )}
    </div>
  );
}
