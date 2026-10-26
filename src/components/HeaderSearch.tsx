import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X, Loader2, Star, Film, Tv, ChevronRight } from "lucide-react";
import { Movie } from "../types";
import { searchMediaWithPagination } from "../services/tmdb";
import { useTranslation } from "react-i18next";

interface HeaderSearchProps {
  theme?: "dark" | "light";
  onSelectMovie?: (movie: Movie) => void;
}

export default function HeaderSearch({ theme = "dark", onSelectMovie }: HeaderSearchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state with URL parameter `search`
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryInUrl = params.get("search") || "";
    setSearchQuery(queryInUrl);
  }, [location.search]);

  // Debounced Live Autocomplete Search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setTotalResults(0);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchMediaWithPagination(trimmed, 1, "multi");
        if (isMounted) {
          setSuggestions((res.movies || []).slice(0, 5));
          setTotalResults(res.totalResults || 0);
          setIsLoading(false);
          setIsOpen(true);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Header search error:", err);
          setSuggestions([]);
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsOpen(false);
    inputRef.current?.blur();
    navigate(`/?search=${encodeURIComponent(trimmed)}&page=1`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClear = () => {
    setSearchQuery("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();

    // If currently on search results page, clear search query from URL
    const params = new URLSearchParams(location.search);
    if (params.has("search")) {
      navigate("/");
    }
  };

  const handleSelectSuggestion = (movie: Movie) => {
    setIsOpen(false);
    inputRef.current?.blur();
    if (onSelectMovie) {
      onSelectMovie(movie);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  const isLight = theme === "light";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <div className="relative w-full flex items-center">
          {/* Magnifying Glass Icon */}
          <button
            type="submit"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-imdb transition-colors cursor-pointer"
            title={t("search.button")}
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Search Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen && e.target.value.trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            onFocus={() => {
              if (searchQuery.trim().length >= 2 && suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
                inputRef.current?.blur();
              }
            }}
            placeholder={t("search.headerPlaceholder") || t("search.placeholder")}
            className={`w-full rounded-full py-2 pl-10 pr-16 text-xs transition-all outline-none ${
              isLight
                ? "bg-white/80 hover:bg-white text-slate-800 placeholder-slate-400 border border-slate-300 focus:border-imdb focus:ring-2 focus:ring-imdb/30 shadow-inner"
                : "liquid-glass-input text-white placeholder-gray-400 border-white/15 focus:border-imdb/60 focus:ring-2 focus:ring-imdb/20 shadow-inner"
            }`}
          />

          {/* Right Action Icons (Loader, Clear, Submit) */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 text-imdb animate-spin shrink-0" />
            )}

            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className={`p-1 rounded-full hover:scale-105 transition-all cursor-pointer ${
                  isLight
                    ? "text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
                title={t("search.reset")}
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className={`p-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                searchQuery.trim()
                  ? "bg-imdb text-black hover:bg-imdb-hover shadow-sm"
                  : "text-gray-500 opacity-40 cursor-not-allowed"
              }`}
              title={t("search.button")}
              aria-label="Submit search"
            >
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </form>

      {/* Instant Autocomplete Suggestions Dropdown */}
      {isOpen && searchQuery.trim().length >= 2 && (
        <div
          className={`absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden border backdrop-blur-2xl transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            isLight
              ? "bg-white/95 border-slate-200/90 divide-y divide-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.12)] text-slate-800"
              : "bg-[#0b0e18]/95 border-white/15 divide-y divide-white/5 shadow-[0_25px_50px_rgba(0,0,0,0.8)] text-zinc-100"
          }`}
        >
          {/* Dropdown Header */}
          <div
            className={`px-4 py-2 flex items-center justify-between text-[11px] font-mono tracking-wider uppercase ${
              isLight ? "bg-slate-50/80 text-slate-500" : "bg-white/[0.02] text-gray-400"
            }`}
          >
            <span>{isLoading ? t("search.searching") : t("search.resultsTitle")}</span>
            {totalResults > 0 && (
              <span className="text-[10px] font-semibold text-imdb">
                {totalResults} {t("search.button")}
              </span>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {suggestions.length > 0 ? (
              suggestions.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => handleSelectSuggestion(movie)}
                  className={`px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-colors group ${
                    isLight
                      ? "hover:bg-slate-100/90 text-slate-800"
                      : "hover:bg-white/[0.08] text-white"
                  }`}
                >
                  {/* Thumbnail / Poster */}
                  <div className="relative w-9 h-13 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/10 shadow-sm">
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-gray-500">
                        {movie.mediaType === "tv" ? (
                          <Tv className="w-4 h-4" />
                        ) : (
                          <Film className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Movie Info */}
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-xs font-bold truncate group-hover:text-imdb transition-colors ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {movie.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      {movie.year && (
                        <span
                          className={`font-mono ${
                            isLight ? "text-slate-500" : "text-gray-400"
                          }`}
                        >
                          {movie.year}
                        </span>
                      )}

                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                          movie.mediaType === "tv"
                            ? isLight
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : isLight
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                        }`}
                      >
                        {movie.mediaType === "tv" ? "TV" : "Movie"}
                      </span>

                      {movie.imdbRating && (
                        <span className="flex items-center gap-0.5 text-imdb font-mono font-bold text-[10px]">
                          <Star className="w-3 h-3 fill-imdb stroke-imdb" />
                          <span>{movie.imdbRating}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <ChevronRight
                    className={`w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ${
                      isLight ? "text-slate-400" : "text-gray-400"
                    }`}
                  />
                </div>
              ))
            ) : !isLoading ? (
              <div
                className={`py-6 text-center text-xs font-mono ${
                  isLight ? "text-slate-400" : "text-gray-500"
                }`}
              >
                {t("search.noResults")}
              </div>
            ) : null}
          </div>

          {/* Footer "View all results" Button */}
          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={() => handleSubmit()}
              className={`w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isLight
                  ? "bg-slate-100/90 hover:bg-slate-200/80 text-amber-600"
                  : "bg-white/[0.04] hover:bg-white/[0.08] text-imdb"
              }`}
            >
              <span>
                {t("search.viewAllResults", {
                  count: totalResults.toLocaleString(),
                  query: searchQuery.trim()
                }) || t("search.viewAll")}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
