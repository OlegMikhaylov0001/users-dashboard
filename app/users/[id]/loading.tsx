export default function UserDetailLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 h-14" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 flex gap-6">
          <div className="w-24 h-24 rounded-xl bg-zinc-200 dark:bg-zinc-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
            <div className="h-4 bg-zinc-100 dark:bg-zinc-700/50 rounded w-1/3" />
            <div className="h-4 bg-zinc-100 dark:bg-zinc-700/50 rounded w-2/3" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 h-48" />
          ))}
        </div>
      </main>
    </div>
  );
}
