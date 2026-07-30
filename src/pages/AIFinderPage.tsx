import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Movie } from "../types";
import AIRecommender from "../components/AIRecommender";
import MovieCard from "../components/MovieCard";
import { Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AIFinderPageProps {
  watchlist: Movie[];
  onToggleWatchlist: (movie: Movie, e: React.MouseEvent) => void;
  onStreamMovie: (movie: Movie) => void;
  onDownloadMovie: (movie: Movie) => void;
}

export default function AIFinderPage({
  watchlist,
  onToggleWatchlist,
  onStreamMovie,
  onDownloadMovie
}: AIFinderPageProps) {
  const [aiRecommendations, setAiRecommendations] = useState<Movie[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <AIRecommender
        onRecommendationsFound={setAiRecommendations}
        onClear={() => setAiRecommendations([])}
      />

      {aiRecommendations.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-xl font-bold border-l-4 border-imdb pl-3 tracking-tight">{t("ai.curatedTitle")}</h3>
              <p className="text-xs text-gray-500 font-mono mt-1">{t("ai.curatedSub")}</p>
            </div>
            <button
              onClick={() => setAiRecommendations([])}
              className="text-xs text-gray-400 hover:text-red-400 font-mono flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t("ai.clear")}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {aiRecommendations.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onSelect={() => navigate(`/movie/${movie.id}`)}
                onStream={onStreamMovie}
                onDownloadMp4={onDownloadMovie}
                isWatchlisted={watchlist.some((m) => m.id === movie.id)}
                onToggleWatchlist={(e) => onToggleWatchlist(movie, e)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
