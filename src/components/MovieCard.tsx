import React, { useState } from "react";
import { Movie } from "../types";
import { Star, Bookmark, BookmarkCheck, Sparkles, Film, Play, Download } from "lucide-react";
import PosterFallback from "./PosterFallback";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

interface MovieCardProps {
  key?: string;
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onStream?: (movie: Movie) => void;
  onDownloadMp4?: (movie: Movie) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (movie: Movie, e: React.MouseEvent) => void;
}

export default function MovieCard({ movie, onSelect, onStream, onDownloadMp4, isWatchlisted, onToggleWatchlist }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);
  const { t } = useTranslation();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group relative liquid-glass-card rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-[480px] cursor-pointer shadow-2xl relative"
      onClick={() => onSelect(movie)}
    >
      {/* Specular Light Reflection Streak on Top Corner */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent z-20 pointer-events-none" />

      {/* Poster Image / Fallback Container */}
      <div className="relative h-[310px] w-full overflow-hidden bg-black/40 border-b border-white/10">
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
          <div className="flex items-center gap-1 liquid-glass-pill text-imdb text-xs font-bold px-2.5 py-1 rounded-xl shadow-lg border border-white/20">
            <Star className="w-3.5 h-3.5 fill-imdb stroke-imdb" />
            <span>{movie.imdbRating}</span>
          </div>
        </div>

        {/* Action Buttons Top Right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {onDownloadMp4 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadMp4(movie);
              }}
              className="p-2 liquid-glass-pill rounded-xl hover:border-imdb/50 text-gray-200 hover:text-imdb transition-all shadow-lg cursor-pointer"
              title="Download MP4 Video File"
            >
              <Download className="w-4 h-4 text-imdb" />
            </button>
          )}

          <button
            onClick={(e) => onToggleWatchlist(movie, e)}
            className="p-2 liquid-glass-pill rounded-xl hover:border-imdb/50 text-gray-300 hover:text-imdb transition-all shadow-lg cursor-pointer"
            title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            {isWatchlisted ? (
              <BookmarkCheck className="w-4 h-4 text-imdb fill-imdb/30" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Hover Action Sheet Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-2 backdrop-blur-sm">
          {onStream && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStream(movie);
              }}
              className="flex items-center gap-2 liquid-btn-gold text-black text-xs font-extrabold py-2.5 px-3 rounded-xl w-full justify-center shadow-xl cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>{t("hero.watchStream")}</span>
            </button>
          )}

          {onDownloadMp4 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadMp4(movie);
              }}
              className="flex items-center gap-2 liquid-glass-pill hover:bg-white/20 text-white text-xs font-semibold py-2.5 px-3 rounded-xl w-full justify-center transition-colors shadow-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-imdb" />
              <span>{t("hero.downloadMp4")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex flex-col flex-grow justify-between bg-gradient-to-b from-transparent to-black/30">
        <div>
          {/* Genre Row */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {movie.genres.slice(0, 3).map((g, i) => (
              <span
                key={i}
                className="text-[9px] font-mono tracking-wider uppercase text-gray-300 liquid-glass-pill px-2 py-0.5 rounded-lg"
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
          <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
            <span>{movie.year}</span>
            <span className="text-gray-600">•</span>
            <span className="line-clamp-1">{t("hero.director")} {movie.director}</span>
          </p>

          {/* Plot snippet */}
          <p className="text-xs text-gray-300/80 leading-normal mt-2 line-clamp-2 italic font-light">
            "{movie.plot}"
          </p>
        </div>

        {/* If custom recommendation reason exists */}
        {movie.reason && (
          <div className="mt-3 liquid-glass-pill border-imdb/30 rounded-xl p-2.5 flex gap-2 items-start bg-imdb/5">
            <Sparkles className="w-3.5 h-3.5 text-imdb shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-imdb leading-tight italic line-clamp-2 font-medium">
              {movie.reason}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
