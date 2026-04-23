function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden animate-pulse">
      <div className="flex items-start gap-4 p-4">
        <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-700/50 rounded w-full" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-700/50 rounded w-1/2" />
        </div>
      </div>
      <div className="border-t border-zinc-100 dark:border-zinc-700/50 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/50 space-y-2">
        <div className="h-3 bg-zinc-100 dark:bg-zinc-700/50 rounded w-full" />
        <div className="h-3 bg-zinc-100 dark:bg-zinc-700/50 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 h-14" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 h-20" />
          ))}
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 h-12 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
