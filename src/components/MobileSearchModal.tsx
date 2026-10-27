import React, { useState, useEffect, useRef } from "react";
import { Search, X, Star, Film, Tv, Loader2, ArrowRight } from "lucide-react";
import { Movie } from "../types";
import { searchMediaWithPagination } from "../services/tmdb";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
  theme?: "dark" | "light";
}

const QUICK_TAGS = [
  { label: "🔥 Trending", query: "trending" },
  { label: "🚀 Sci-Fi", query: "science fiction" },
  { label: "💥 Action", query: "action" },
  { label: "🍿 Comedy", query: "comedy" },
  { label: "🎭 Drama", query: "drama" },
  { label: "👻 Horror", query: "horror" },
  { label: "✨ Animation", query: "animation" }
];

export default function MobileSearchModal({
  isOpen,
  onClose,
  onSelectMovie,
  theme = "dark"
}: MobileSearchModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchMediaWithPagination(trimmed, 1, "multi", controller.signal);
        setResults(res.movies || []);
        setIsLoading(false);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setResults([]);
        setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onClose();
    navigate(`/?search=${encodeURIComponent(trimmed)}&page=1`);
  };

  const handleSelect = (movie: Movie) => {
    onClose();
    onSelectMovie(movie);
  };

  const isLight = theme === "light";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-0 z-50 flex flex-col backdrop-blur-3xl safe-top safe-bottom ${
          isLight ? "bg-[#f8fafc]/98 text-slate-800" : "bg-[#030408]/98 text-white"
        }`}
      >
        {/* Mobile Search Header Bar */}
        <div
          className={`px-4 py-3 border-b flex items-center gap-3 ${
            isLight ? "border-slate-200/80 bg-white/60" : "border-white/10"
          }`}
        >
          <form onSubmit={handleSubmit} className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-imdb absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.headerPlaceholder") || "Search movies, series, actors..."}
              className={`w-full rounded-full py-2.5 pl-10 pr-10 text-sm outline-none transition-all ${
                isLight
                  ? "bg-slate-100/90 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-imdb focus:bg-white"
                  : "bg-white/[0.07] border border-white/15 text-white placeholder-gray-400 focus:border-imdb/60"
              }`}
            />
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-imdb animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
            ) : query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className={`p-1 rounded-full absolute right-2.5 top-1/2 -translate-y-1/2 ${
                  isLight ? "text-slate-400 hover:text-slate-700" : "text-gray-400 hover:text-white"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </form>

          <button
            onClick={onClose}
            className={`text-xs font-mono font-bold transition-colors px-2 py-1 ${
              isLight ? "text-slate-600 hover:text-imdb" : "text-gray-300 hover:text-imdb"
            }`}
          >
            Cancel
          </button>
        </div>

        {/* Quick Suggestion Tags when query is short */}
        {query.trim().length < 2 && (
          <div className="p-4 space-y-3">
            <span
              className={`text-[11px] font-mono uppercase tracking-wider block font-bold ${
                isLight ? "text-slate-500" : "text-gray-400"
              }`}
            >
              Trending Categories
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  onClick={() => setQuery(tag.query)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isLight
                      ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200/80 active:bg-imdb active:text-black"
                      : "bg-white/5 border border-white/10 text-gray-200 active:bg-imdb active:text-black"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results List */}
        <div
          className={`flex-1 overflow-y-auto px-4 py-2 divide-y ${
            isLight ? "divide-slate-100" : "divide-white/5"
          }`}
        >
          {results.map((movie) => (
            <div
              key={movie.id}
              onClick={() => handleSelect(movie)}
              className={`py-3 flex items-center gap-3.5 cursor-pointer rounded-xl px-2 transition-colors ${
                isLight
                  ? "hover:bg-slate-100/80 active:bg-slate-200/60"
                  : "active:bg-white/5 hover:bg-white/[0.04]"
              }`}
            >
              <div
                className={`w-12 h-16 rounded-lg overflow-hidden shrink-0 border relative ${
                  isLight ? "bg-slate-100 border-slate-200" : "bg-black/60 border-white/10"
                }`}
              >
                {movie.poster ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center ${
                      isLight ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    <Film className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-sm font-bold truncate ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {movie.title}
                  </h4>
                  {movie.mediaType === "tv" ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-600 border border-cyan-500/30 shrink-0">
                      TV
                    </span>
                  ) : null}
                </div>

                <div
                  className={`flex items-center gap-2 mt-1 text-xs font-mono ${
                    isLight ? "text-slate-500" : "text-gray-400"
                  }`}
                >
                  <span>{movie.year || "Unknown"}</span>
                  {movie.imdbRating && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-imdb font-bold">
                        <Star className="w-3 h-3 fill-imdb stroke-imdb" />
                        {movie.imdbRating}
                      </span>
                    </>
                  )}
                </div>

                {movie.genres && movie.genres.length > 0 && (
                  <p
                    className={`text-[11px] truncate mt-0.5 font-light ${
                      isLight ? "text-slate-500" : "text-gray-500"
                    }`}
                  >
                    {movie.genres.slice(0, 3).join(", ")}
                  </p>
                )}
              </div>

              <ArrowRight
                className={`w-4 h-4 shrink-0 ${
                  isLight ? "text-slate-400" : "text-gray-600"
                }`}
              />
            </div>
          ))}

          {query.trim().length >= 2 && !isLoading && results.length === 0 && (
            <div
              className={`py-16 text-center space-y-2 ${
                isLight ? "text-slate-500" : "text-gray-500"
              }`}
            >
              <Search
                className={`w-8 h-8 mx-auto ${
                  isLight ? "text-slate-400" : "text-gray-600"
                }`}
              />
              <p className="text-sm font-medium">No titles found for "{query}"</p>
              <p className={`text-xs ${isLight ? "text-slate-400" : "text-gray-600"}`}>
                Try searching for another movie, TV show, or actor
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
