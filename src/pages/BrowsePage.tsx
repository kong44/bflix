import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Movie, PlaybackProgress } from "../types";
import MovieCard from "../components/MovieCard";
import MovieCardSkeleton from "../components/MovieCardSkeleton";
import { 
  fetchMoviesByCategory, 
  fetchTvShowsByCategory,
  searchMediaWithPagination, 
  MOVIE_CATEGORIES,
  TV_CATEGORIES
} from "../services/tmdb";
import { getContinueWatchingList, removePlaybackProgress } from "../utils/playbackStorage";
import { 
  Star, 
  Play, 
  Download, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Loader2, 
  Grid, 
  Compass,
  Film,
  Tv,
  Clock,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

interface BrowsePageProps {
  watchlist: Movie[];
  onToggleWatchlist: (movie: Movie, e: React.MouseEvent) => void;
  onSelectMovie: (movie: Movie) => void;
  onStreamMovie: (movie: Movie, season?: number, episode?: number, initialTime?: number) => void;
  onDownloadMovie: (movie: Movie) => void;
}

export default function BrowsePage({
  watchlist,
  onToggleWatchlist,
  onSelectMovie,
  onStreamMovie,
  onDownloadMovie
}: BrowsePageProps) {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const activeCategories = mediaType === "movie" ? MOVIE_CATEGORIES : TV_CATEGORIES;

  const selectedCategory = categoryId || (mediaType === "movie" ? "trending" : "trending_tv");
  const searchFromUrl = searchParams.get("search") || "";
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);

  const [curatedMovies, setCuratedMovies] = useState<Movie[]>([]);
  const [curatedLoading, setCuratedLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState<number>(pageFromUrl);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [searchResults, setSearchResults] = useState<Movie[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [heroIndex, setHeroIndex] = useState(0);

  // Continue Watching state
  const [continueWatching, setContinueWatching] = useState<PlaybackProgress[]>([]);

  const refreshContinueWatching = () => {
    setContinueWatching(getContinueWatchingList());
  };

  useEffect(() => {
    refreshContinueWatching();
  }, []);

  // Sync state with URL params
  useEffect(() => {
    setCurrentPage(pageFromUrl);
    setSearchQuery(searchFromUrl);
  }, [searchFromUrl, pageFromUrl]);

  // Handle searching if query in URL exists
  useEffect(() => {
    if (!searchFromUrl.trim()) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }

    let isMounted = true;
    setSearchLoading(true);
    setSearchError(null);

    searchMediaWithPagination(searchFromUrl, pageFromUrl, mediaType)
      .then((res) => {
        if (isMounted) {
          if (res.movies && res.movies.length > 0) {
            setSearchResults(res.movies);
            setTotalPages(res.totalPages);
            setTotalResults(res.totalResults);
          } else {
            setSearchResults([]);
            setSearchError(`No titles found matching "${searchFromUrl}".`);
          }
          setSearchLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Search error:", err);
          setSearchError(err.message || "Failed to fetch search results.");
          setSearchLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [searchFromUrl, pageFromUrl, mediaType]);

  // Load movies or TV shows by category if no active search
  useEffect(() => {
    if (searchFromUrl) return;

    let isMounted = true;
    setCuratedLoading(true);

    const fetcher = mediaType === "tv"
      ? fetchTvShowsByCategory(selectedCategory, currentPage)
      : fetchMoviesByCategory(selectedCategory, currentPage);

    fetcher
      .then((res) => {
        if (isMounted) {
          setCuratedMovies(res.movies);
          setTotalPages(res.totalPages);
          setTotalResults(res.totalResults);
          setCuratedLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load category items:", err);
        if (isMounted) setCuratedLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, currentPage, searchFromUrl, mediaType]);

  // Rotating Hero slides
  useEffect(() => {
    if (curatedMovies.length === 0 || searchResults !== null) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(curatedMovies.length, 5));
    }, 12000);
    return () => clearInterval(interval);
  }, [curatedMovies, searchResults]);

  const handleSelectCategory = (catId: string) => {
    navigate(`/category/${catId}`);
  };

  const handleToggleMediaType = (type: "movie" | "tv") => {
    if (type === mediaType) return;
    setMediaType(type);
    setCurrentPage(1);
    const defaultCat = type === "movie" ? "trending" : "trending_tv";
    navigate(`/category/${defaultCat}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchParams({ search: searchQuery, page: "1" });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchError(null);
    setSearchParams({});
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    if (searchFromUrl) {
      setSearchParams({ search: searchFromUrl, page: String(newPage) });
    } else {
      setSearchParams({ page: String(newPage) });
    }
    const element = document.getElementById("catalog-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const activeHero = curatedMovies[heroIndex] || curatedMovies[0];

  const getCategoryLabel = (catId: string) => {
    const found = activeCategories.find((c) => c.id === catId);
    return found ? found.name : catId;
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        start = 1;
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
        end = totalPages;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages.map((p, idx) => {
      const isActive = p === currentPage;
      return (
        <button
          key={idx}
          onClick={() => handlePageChange(Number(p))}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            isActive
              ? "bg-imdb text-black shadow-md shadow-amber-500/10"
              : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5"
          }`}
        >
          {p}
        </button>
      );
    });
  };

  return (
    <div className="space-y-10">
      {/* Featured Hero Carousel Section */}
      {searchResults === null && activeHero && !curatedLoading && (
        <section className="relative w-full rounded-3xl overflow-hidden liquid-glass min-h-[460px] sm:min-h-[520px] flex items-end shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeHero.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img
                src={activeHero.backdrop}
                alt={activeHero.title}
                className="w-full h-full object-cover opacity-35 filter contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030408] via-[#030408]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#030408] via-[#030408]/60 to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 p-6 sm:p-12 w-full max-w-4xl space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${activeHero.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 liquid-btn-gold text-black font-extrabold text-[10px] uppercase tracking-widest rounded-full shadow-lg">
                    {t("hero.topChoice")}
                  </span>
                  <div className="flex items-center text-imdb text-sm font-bold liquid-glass-pill px-2.5 py-0.5 rounded-full border border-white/20">
                    <Star className="w-4 h-4 fill-imdb stroke-imdb mr-1" />
                    <span>{activeHero.imdbRating}</span>
                  </div>
                  {activeHero.mediaType === "tv" && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-cyan-300 font-bold border border-cyan-400/20">
                      TV SERIES
                    </span>
                  )}
                </div>

                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none drop-shadow-lg">
                  {activeHero.title}
                </h2>

                <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 max-w-2xl font-light leading-relaxed">
                  {activeHero.plot}
                </p>

                <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-400 py-1">
                  <span className="liquid-glass-pill px-2 py-0.5 rounded-md">{activeHero.year}</span>
                  <span>•</span>
                  <span className="liquid-glass-pill px-2 py-0.5 rounded-md">{activeHero.director}</span>
                  <span>•</span>
                  <span className="liquid-glass-pill px-2 py-0.5 rounded-md">{activeHero.runtime}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => onStreamMovie(activeHero)}
                    className="liquid-btn-gold text-black px-6 py-3 rounded-xl font-extrabold text-xs flex items-center shadow-xl cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 mr-2 fill-black" />
                    <span>{t("hero.watchStream")}</span>
                  </button>
                  <button
                    onClick={() => onDownloadMovie(activeHero)}
                    className="liquid-glass-pill hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-xl font-semibold text-xs flex items-center transition-all cursor-pointer shadow-lg"
                  >
                    <Download className="w-3.5 h-3.5 mr-2 text-imdb" />
                    <span>{t("hero.downloadMp4")}</span>
                  </button>
                  <button
                    onClick={() => navigate(`/movie/${activeHero.id}`)}
                    className="liquid-glass-pill hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-xl font-semibold text-xs flex items-center transition-all cursor-pointer shadow-lg"
                  >
                    <Info className="w-3.5 h-3.5 mr-2" />
                    <span>{t("hero.showDetails")}</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Dots */}
            <div className="flex items-center gap-1.5 pt-4">
              {curatedMovies.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === heroIndex ? "w-6 bg-imdb shadow-[0_0_10px_rgba(245,197,24,0.6)]" : "w-1.5 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Continue Watching Carousel */}
      {continueWatching.length > 0 && searchResults === null && (
        <section className="space-y-4 pt-2 pb-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-imdb" />
              <h3 className="text-base font-bold text-white tracking-tight uppercase">
                {t("continueWatching.title")}
              </h3>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">
              {t("continueWatching.subtitle")}
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {continueWatching.map((item) => (
              <div
                key={item.id}
                className="group relative min-w-[240px] sm:min-w-[280px] max-w-[280px] bg-[#0c0c0f] border border-white/10 hover:border-imdb/50 rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col shrink-0"
              >
                {/* Thumbnail with progress overlay */}
                <div className="relative aspect-video w-full bg-black/60 overflow-hidden">
                  <img
                    src={item.backdrop || item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Season/Episode Badge */}
                  {item.mediaType === "tv" && item.season && item.episode && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 border border-white/10 text-[10px] font-mono text-imdb font-bold">
                      S{item.season}:E{item.episode}
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePlaybackProgress(item.id);
                      setContinueWatching((prev) => prev.filter((p) => p.id !== item.id));
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-500/80 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title={t("continueWatching.remove")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Play Resume Button */}
                  <button
                    onClick={() => {
                      const movieObj: Movie = {
                        id: item.id,
                        tmdbId: item.tmdbId,
                        imdbId: item.imdbId,
                        title: item.title,
                        year: "",
                        genres: [item.mediaType === "tv" ? "TV Series" : "Cinema"],
                        director: "",
                        actors: [],
                        plot: "",
                        imdbRating: "8.0",
                        poster: item.poster,
                        backdrop: item.backdrop,
                        mediaType: item.mediaType
                      };
                      onStreamMovie(movieObj, item.season || 1, item.episode || 1, item.currentTime);
                    }}
                    className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-imdb flex items-center justify-center text-black shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all cursor-pointer"
                    title={t("continueWatching.resume")}
                  >
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </button>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                    <div
                      className="h-full bg-imdb transition-all"
                      style={{ width: `${Math.max(5, Math.min(100, item.percentage || 10))}%` }}
                    />
                  </div>
                </div>

                {/* Card Title & Meta */}
                <div className="p-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-imdb truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                      {item.percentage > 0 ? `${item.percentage}% watched` : "Recently played"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Catalog & Filter Section */}
      <section id="catalog-section" className="space-y-6">
        {/* Media Type Switcher & Category Navigation */}
        <div className="liquid-glass rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Movies vs TV Series Switcher Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleMediaType("movie")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  mediaType === "movie"
                    ? "liquid-btn-gold text-black border-imdb/50 shadow-md"
                    : "liquid-glass-pill hover:bg-white/10 text-gray-300 border-white/10"
                }`}
              >
                <Film className="w-4 h-4" />
                <span>{t("nav.movies")}</span>
              </button>

              <button
                onClick={() => handleToggleMediaType("tv")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  mediaType === "tv"
                    ? "liquid-btn-gold text-black border-imdb/50 shadow-md"
                    : "liquid-glass-pill hover:bg-white/10 text-gray-300 border-white/10"
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>{t("nav.tvShows")}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => handleSelectCategory(e.target.value)}
                className="liquid-glass-input text-xs text-white rounded-xl px-4 py-2 focus:outline-none focus:border-imdb/50 font-medium cursor-pointer"
              >
                {activeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#0b0f19] text-white py-1.5 font-sans">
                    {cat.name}
                  </option>
                ))}
              </select>

              <span className="text-xs font-mono font-bold px-3 py-2 rounded-xl liquid-btn-gold text-black shrink-0 hidden md:inline-block shadow-md">
                {getCategoryLabel(selectedCategory)}
              </span>
            </div>
          </div>

          {/* Category Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {activeCategories.map((cat) => {
              const isActive = cat.id === selectedCategory && searchResults === null;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? "liquid-btn-gold text-black border-imdb/50 shadow-lg shadow-amber-500/20"
                      : "liquid-glass-pill hover:bg-white/15 text-gray-300 border-white/10"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Title & Search Input */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold border-l-4 border-imdb pl-3 tracking-tight">
                {searchResults !== null 
                  ? t("search.resultsTitle") 
                  : `${getCategoryLabel(selectedCategory)} (${mediaType === "movie" ? "Movies" : "Series"})`}
              </h3>
            </div>
            <p className="text-zinc-400 text-xs font-mono mt-1">
              {searchResults !== null 
                ? t("search.resultsFound", { count: totalResults.toLocaleString(), query: searchFromUrl }) 
                : t("search.pageStatus", { page: currentPage, totalPages, totalResults: totalResults.toLocaleString() })}
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="liquid-glass-input rounded-full py-2.5 pl-10 pr-4 text-xs w-full focus:outline-none focus:border-imdb/50 transition-colors text-white"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
              className="px-5 liquid-btn-gold disabled:opacity-50 text-black font-bold text-xs rounded-full transition-all cursor-pointer flex items-center justify-center shadow-lg shrink-0 h-9"
            >
              {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("search.button")}
            </button>

            {searchResults !== null && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 liquid-glass-pill hover:bg-white/20 text-white font-medium text-xs rounded-full transition-all border border-white/15 shrink-0 h-9 cursor-pointer"
              >
                {t("search.reset")}
              </button>
            )}
          </form>
        </div>

        {/* Search error notice */}
        {searchError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-400">{t("search.lookupFailed")}</p>
              <p className="text-xs text-gray-400 leading-normal">{searchError}</p>
            </div>
          </div>
        )}

        {/* Movie / Show Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {curatedLoading || searchLoading ? (
            Array.from({ length: 10 }).map((_, i) => <MovieCardSkeleton key={i} />)
          ) : (
            searchResults !== null ? (
              searchResults.length > 0 ? (
                searchResults.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onSelect={() => navigate(`/movie/${movie.id}`)}
                    onStream={(m) => onStreamMovie(m)}
                    onDownloadMp4={onDownloadMovie}
                    isWatchlisted={watchlist.some((m) => m.id === movie.id)}
                    onToggleWatchlist={(e) => onToggleWatchlist(movie, e)}
                  />
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-gray-500 flex flex-col items-center justify-center space-y-2">
                  <Compass className="w-10 h-10 text-gray-700 mb-2" />
                  <p className="text-sm font-mono uppercase">{t("search.noResultsTitle")}</p>
                  <p className="text-xs max-w-sm">{t("search.noResultsSub")}</p>
                </div>
              )
            ) : (
              curatedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelect={() => navigate(`/movie/${movie.id}`)}
                  onStream={(m) => onStreamMovie(m)}
                  onDownloadMp4={onDownloadMovie}
                  isWatchlisted={watchlist.some((m) => m.id === movie.id)}
                  onToggleWatchlist={(e) => onToggleWatchlist(movie, e)}
                />
              ))
            )
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && !curatedLoading && !searchLoading && (
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-400 font-mono">
              {t("pagination.pageOf", { page: currentPage, totalPages })}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-xs text-gray-300 font-medium transition-all flex items-center gap-1 border border-white/5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t("pagination.previous")}</span>
              </button>

              <div className="flex items-center gap-1">{renderPageNumbers()}</div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-xs text-gray-300 font-medium transition-all flex items-center gap-1 border border-white/5 cursor-pointer"
              >
                <span>{t("pagination.next")}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
