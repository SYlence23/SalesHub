export default function GoodDealSkeletonCard() {
  return (
    <div className="glass-card overflow-hidden flex flex-row h-44 animate-pulse">
      {/* Image placeholder */}
      <div className="w-44 shrink-0 bg-zinc-200 dark:bg-zinc-700/50" />

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        {/* Store + badges row */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
          <div className="flex gap-1.5">
            <div className="h-4 w-14 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
            <div className="h-4 w-14 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
          </div>
        </div>

        {/* Title */}
        <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="h-5 w-1/2 bg-zinc-200 dark:bg-zinc-700 rounded" />

        {/* Description */}
        <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />

        {/* Audience badges */}
        <div className="flex gap-1.5 mt-auto">
          <div className="h-4 w-14 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
          <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Bottom divider row */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
