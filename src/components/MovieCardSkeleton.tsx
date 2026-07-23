import React from "react";

export default function MovieCardSkeleton() {
  return (
    <div className="group relative bg-[#121214] rounded-xl overflow-hidden ring-1 ring-white/10 flex flex-col h-[480px] shadow-2xl animate-pulse">
      {/* Poster Image Skeleton */}
      <div className="relative h-[320px] w-full bg-zinc-900/80 border-b border-white/5 flex items-center justify-center overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Top-left Rating Badge Skeleton */}
        <div className="absolute top-3 left-3 h-6 w-14 bg-white/10 rounded-md border border-white/5" />
        
        {/* Top-right Bookmark Button Skeleton */}
        <div className="absolute top-3 right-3 h-8 w-8 bg-white/10 rounded-md border border-white/5" />

        {/* Center Poster Placeholder Icon */}
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
          <div className="w-6 h-6 rounded bg-white/10" />
        </div>
      </div>

      {/* Card Content Details Skeleton */}
      <div className="p-4 flex flex-col flex-grow justify-between bg-gradient-to-b from-[#121214] to-black">
        <div>
          {/* Genre Badges Skeleton */}
          <div className="flex gap-1.5 mb-3">
            <div className="h-4 w-12 bg-white/10 rounded border border-white/5" />
            <div className="h-4 w-14 bg-white/10 rounded border border-white/5" />
            <div className="h-4 w-10 bg-white/10 rounded border border-white/5" />
          </div>

          {/* Title Line Skeleton */}
          <div className="h-5 bg-white/15 rounded-md w-3/4 mb-2" />

          {/* Metadata Line Skeleton */}
          <div className="h-3 bg-white/10 rounded-md w-1/2 mb-3" />

          {/* Plot Paragraph Skeleton Lines */}
          <div className="space-y-1.5">
            <div className="h-3 bg-white/10 rounded-md w-full" />
            <div className="h-3 bg-white/10 rounded-md w-4/5" />
          </div>
        </div>

        {/* Footer/Recommendation Box Skeleton */}
        <div className="mt-3 h-8 bg-white/5 border border-white/5 rounded-lg w-full flex items-center px-3 gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-white/10" />
          <div className="h-3 bg-white/10 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}
