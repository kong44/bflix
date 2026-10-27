import React from "react";

export default function MovieCardSkeleton() {
  return (
    <div className="group relative bg-[#121214] rounded-xl sm:rounded-2xl overflow-hidden ring-1 ring-white/10 flex flex-col h-auto shadow-2xl animate-pulse">
      {/* Poster Image Skeleton */}
      <div className="relative aspect-[2/3] w-full bg-zinc-900/80 border-b border-white/5 flex items-center justify-center overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Top-left Rating Badge Skeleton */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 h-5 sm:h-6 w-10 sm:w-14 bg-white/10 rounded-md border border-white/5" />
        
        {/* Top-right Bookmark Button Skeleton */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 h-7 sm:h-8 w-7 sm:w-8 bg-white/10 rounded-md border border-white/5" />

        {/* Center Poster Placeholder Icon */}
        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
          <div className="w-5 sm:w-6 h-5 sm:h-6 rounded bg-white/10" />
        </div>
      </div>

      {/* Card Content Details Skeleton */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-grow justify-between bg-gradient-to-b from-[#121214] to-black">
        <div>
          {/* Genre Badges Skeleton */}
          <div className="flex gap-1.5 mb-2 sm:mb-3">
            <div className="h-3.5 sm:h-4 w-10 sm:w-12 bg-white/10 rounded border border-white/5" />
            <div className="h-3.5 sm:h-4 w-12 sm:w-14 bg-white/10 rounded border border-white/5" />
          </div>

          {/* Title Line Skeleton */}
          <div className="h-4 sm:h-5 bg-white/15 rounded-md w-3/4 mb-1.5 sm:mb-2" />

          {/* Metadata Line Skeleton */}
          <div className="h-3 bg-white/10 rounded-md w-1/2 mb-2 sm:mb-3" />

          {/* Plot Paragraph Skeleton Lines (desktop only) */}
          <div className="hidden sm:block space-y-1.5">
            <div className="h-3 bg-white/10 rounded-md w-full" />
            <div className="h-3 bg-white/10 rounded-md w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
