import React, { useState } from "react";
import { Movie } from "../types";
import { Star, Bookmark, BookmarkCheck, Sparkles, Film, Play } from "lucide-react";
import PosterFallback from "./PosterFallback";
import { motion } from "motion/react";

interface MovieCardProps {
  key?: string;
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onStream?: (movie: Movie) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (movie: Movie, e: React.MouseEvent) => void;
}

export default function MovieCard({ movie, onSelect, onStream, isWatchlisted, onToggleWatchlist }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-[#121214] rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-imdb/50 transition-all duration-300 flex flex-col h-[480px] cursor-pointer shadow-2xl"
      onClick={() => onSelect(movie)}
    >
      {/* Poster Image / Fallback Container */}
      <div className="relative h-[320px] w-full overflow-hidden bg-black border-b border-white/5">
        {!movie.poster || imageError ? (
          <PosterFallback title={movie.title} year={movie.year} genres={movie.genres} />
        ) : (
          <img
            src={movie.poster}
            alt={movie.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          <div className="flex items-center gap-1 bg-black/85 backdrop-blur-md text-imdb text-xs font-bold px-2 py-1 rounded-md border border-white/10 shadow-md">
            <Star className="w-3.5 h-3.5 fill-imdb stroke-imdb" />
            <span>{movie.imdbRating}</span>
          </div>
        </div>

        {/* Watchlist Bookmark */}
        <button
          onClick={(e) => onToggleWatchlist(movie, e)}
          className="absolute top-3 right-3 p-2 bg-black/85 backdrop-blur-md rounded-md border border-white/10 hover:border-imdb/40 text-gray-400 hover:text-imdb transition-all shadow-md z-10"
          title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
        >
          {isWatchlisted ? (
            <BookmarkCheck className="w-4 h-4 text-imdb fill-imdb/20" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>

        {/* Hover Action Sheet Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-2">
          {onStream && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStream(movie);
              }}
              className="flex items-center gap-2 bg-imdb hover:bg-imdb-hover text-black text-xs font-bold py-2 px-3 rounded-lg w-full justify-center transition-colors shadow-lg"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Watch Stream</span>
            </button>
          )}
          <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 px-3 rounded-lg w-full justify-center transition-colors backdrop-blur-md border border-white/10">
            <Film className="w-3.5 h-3.5" />
            <span>Explore Insights</span>
          </div>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex flex-col flex-grow justify-between bg-gradient-to-b from-[#121214] to-black">
        <div>
          {/* Genre Row */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {movie.genres.slice(0, 3).map((g, i) => (
              <span
                key={i}
                className="text-[9px] font-mono tracking-wider uppercase text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="font-sans font-bold text-white text-base leading-tight group-hover:text-imdb transition-colors line-clamp-1 mb-1">
            {movie.title}
          </h3>

          {/* Year / Director row */}
          <p className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5">
            <span>{movie.year}</span>
            <span className="text-gray-700">•</span>
            <span className="line-clamp-1">Dir: {movie.director}</span>
          </p>

          {/* Plot snippet */}
          <p className="text-xs text-gray-400 leading-normal mt-2 line-clamp-2 italic">
            "{movie.plot}"
          </p>
        </div>

        {/* If custom recommendation reason exists */}
        {movie.reason && (
          <div className="mt-3 bg-imdb/5 border border-imdb/10 rounded-lg p-2.5 flex gap-2 items-start">
            <Sparkles className="w-3.5 h-3.5 text-imdb shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-imdb leading-tight italic line-clamp-2">
              {movie.reason}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
