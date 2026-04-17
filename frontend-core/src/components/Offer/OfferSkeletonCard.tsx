export default function OfferSkeletonCard() {
  return (
    <div className="glass-card overflow-hidden flex flex-col h-full border-none">
      {/* Image Skeleton */}
      <div className="h-48 sm:h-56 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
      
      <div className="p-5 flex flex-col grow gap-3">
        {/* Store Name Skeleton */}
        <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
        
        {/* Title Skeleton */}
        <div className="h-6 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
        <div className="h-6 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-3"></div>
        
        {/* Price and Button Skeleton */}
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col gap-1">
            {/* Old Price */}
            <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            {/* New Price */}
            <div className="h-7 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
          </div>
          {/* Button */}
          <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
