export default function GoodDealSkeletonCard() {
  return (
    <div className="glass-card overflow-hidden flex flex-col h-full animate-pulse">
      {/* Top — Image placeholder */}
      <div className="p-3 pb-0 w-full shrink-0">
        <div className="w-full aspect-[16/10] bg-zinc-200 dark:bg-zinc-700/50 rounded-2xl" />
      </div>

      {/* Bottom — Content placeholder */}
      <div className="flex flex-col flex-grow p-4 gap-3">
        {/* Category & Store placeholder */}
        <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-700 rounded-full" />

        {/* Title placeholder */}
        <div className="space-y-1.5">
          <div className="h-4.5 w-11/12 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-4.5 w-2/3 bg-zinc-200 dark:bg-zinc-700 rounded" />
        </div>

        {/* Description placeholder */}
        <div className="h-3.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded" />

        {/* Audience badges placeholder */}
        <div className="flex gap-1.5 mt-1">
          <div className="h-5 w-14 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
          <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Bottom Row placeholder */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
