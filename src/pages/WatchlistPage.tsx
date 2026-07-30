import React from "react";
import { useNavigate } from "react-router-dom";
import { Movie } from "../types";
import MovieCard from "../components/MovieCard";
import { Heart, Bookmark, Compass } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WatchlistPageProps {
  watchlist: Movie[];
  onToggleWatchlist: (movie: Movie, e: React.MouseEvent) => void;
  onStreamMovie: (movie: Movie) => void;
  onDownloadMovie: (movie: Movie) => void;
}

export default function WatchlistPage({
  watchlist,
  onToggleWatchlist,
  onStreamMovie,
  onDownloadMovie
}: WatchlistPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold border-l-4 border-imdb pl-3 tracking-tight flex items-center gap-2">
          <Heart className="w-5 h-5 text-imdb" />
          {t("watchlist.title")}
        </h3>
        <p className="text-gray-500 text-xs font-mono mt-1">{t("watchlist.subtitle")}</p>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {watchlist.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={() => navigate(`/movie/${movie.id}`)}
              onStream={onStreamMovie}
              onDownloadMp4={onDownloadMovie}
              isWatchlisted={true}
              onToggleWatchlist={(e) => onToggleWatchlist(movie, e)}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl bg-[#0a0a0d] flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto">
          <div className="p-4 rounded-full bg-white/5 text-imdb border border-white/5">
            <Bookmark className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-zinc-200">{t("watchlist.emptyTitle")}</h4>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              {t("watchlist.emptySub")}
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-xs font-semibold text-imdb rounded-xl transition-all cursor-pointer border border-white/5 flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>{t("watchlist.exploreBtn")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
