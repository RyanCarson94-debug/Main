/** Generic skeleton shown while lazy-loaded views are fetching. */
export function ViewSkeleton() {
  return (
    <div className="h-full flex flex-col gap-5 animate-pulse">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-white/[0.06]" />
          <div className="h-3.5 w-64 rounded-lg bg-white/[0.04]" />
        </div>
        <div className="h-8 w-24 rounded-xl bg-white/[0.05]" />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#2A2640] bg-white/[0.03] p-4 space-y-3"
            style={{ opacity: 1 - i * 0.12 }}
          >
            <div className="h-4 w-3/4 rounded-lg bg-white/[0.06]" />
            <div className="h-3 w-full rounded-lg bg-white/[0.04]" />
            <div className="h-3 w-2/3 rounded-lg bg-white/[0.04]" />
            <div className="flex gap-2 pt-1">
              <div className="h-5 w-14 rounded-full bg-white/[0.05]" />
              <div className="h-5 w-10 rounded-full bg-white/[0.05]" />
            </div>
          </div>
        ))}
      </div>

      {/* Wide row */}
      <div className="rounded-2xl border border-[#2A2640] bg-white/[0.03] p-5 space-y-3">
        <div className="h-4 w-40 rounded-lg bg-white/[0.06]" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-3 rounded-lg bg-white/[0.04]" style={{ width: `${90 - i * 15}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
