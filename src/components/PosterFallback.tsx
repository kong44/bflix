import React from "react";

interface PosterFallbackProps {
  title: string;
  year: string;
  genres: string[];
}

export default function PosterFallback({ title, year, genres }: PosterFallbackProps) {
  // Hash the title to get a stable gradient pairing
  const getGradient = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      ["from-slate-900 to-zinc-800", "border-zinc-700/50"],
      ["from-zinc-900 to-neutral-900", "border-neutral-800"],
      ["from-slate-950 to-slate-800", "border-slate-700/50"],
      ["from-stone-900 to-neutral-850", "border-stone-800"],
      ["from-slate-900 to-neutral-900", "border-zinc-800"],
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const [gradientClasses, borderClass] = getGradient(title);

  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${gradientClasses} flex flex-col justify-between p-6 rounded-lg border ${borderClass} shadow-xl relative overflow-hidden`}
    >
      {/* Decorative grain/glass overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
      
      {/* Top Details */}
      <div className="flex justify-between items-start z-10">
        <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
          CineArchive
        </span>
        <span className="text-xs font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          {year}
        </span>
      </div>

      {/* Title */}
      <div className="my-auto z-10">
        <h3 className="font-sans text-2xl font-black text-white tracking-tight leading-none mb-2 line-clamp-3">
          {title}
        </h3>
        <p className="text-xs text-zinc-400 font-mono italic">Original Feature</p>
      </div>

      {/* Genres and Bottom Design */}
      <div className="flex flex-col gap-2 border-t border-zinc-700/30 pt-3 z-10">
        <div className="flex flex-wrap gap-1">
          {genres.slice(0, 2).map((g, i) => (
            <span
              key={i}
              className="text-[9px] font-mono uppercase bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700/40"
            >
              {g}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500">
          <span>IMDb ARCHIVE</span>
          <span>●</span>
        </div>
      </div>
    </div>
  );
}
