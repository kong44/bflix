import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Movie } from "../types";
import MovieCard from "../components/MovieCard";
import MovieCardSkeleton from "../components/MovieCardSkeleton";
import { 
  fetchMoviesByCategory, 
  searchMoviesWithPagination, 
  CATEGORIES 
} from "../services/tmdb";
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
  Compass 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

interface BrowsePageProps {
  watchlist: Movie[];
  onToggleWatchlist: (movie: Movie, e: React.MouseEvent) => void;
  onSelectMovie: (movie: Movie) => void;
  onStreamMovie: (movie: Movie) => void;
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

  const selectedCategory = categoryId || "trending";
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

    searchMoviesWithPagination(searchFromUrl, pageFromUrl)
      .then((res) => {
        if (isMounted) {
          if (res.movies && res.movies.length > 0) {
            setSearchResults(res.movies);
            setTotalPages(res.totalPages);
            setTotalResults(res.totalResults);
          } else {
            setSearchResults([]);
            setSearchError(`No movies found matching "${searchFromUrl}".`);
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
  }, [searchFromUrl, pageFromUrl]);

  // Load movies by category if no active search
  useEffect(() => {
    if (searchFromUrl) return;

    let isMounted = true;
    setCuratedLoading(true);

    fetchMoviesByCategory(selectedCategory, currentPage)
      .then((res) => {
        if (isMounted) {
          setCuratedMovies(res.movies);
          setTotalPages(res.totalPages);
          setTotalResults(res.totalResults);
          setCuratedLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load category movies:", err);
        if (isMounted) setCuratedLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, currentPage, searchFromUrl]);

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
    const keyMap: Record<string, string> = {
      trending: "category.trending",
      popular: "category.popular",
      top_rated: "category.topRated",
      now_playing: "category.trending",
      upcoming: "category.upcoming",
      action: "category.action",
      "sci-fi": "category.scifi",
      comedy: "category.comedy",
      drama: "category.drama",
      horror: "category.horror",
      animation: "category.animation",
      thriller: "category.thriller",
      adventure: "category.adventure",
      romance: "category.romance",
      crime: "category.crime",
      fantasy: "category.fantasy",
      mystery: "category.mystery"
    };
    const key = keyMap[catId];
    return key ? t(key) : CATEGORIES.find((c) => c.id === catId)?.name || catId;
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (typeof p === "string") {
        return (
          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-gray-500 font-mono select-none">
            ...
          </span>
        );
      }
      const isActive = p === currentPage;
      return (
        <button
          key={p}
          onClick={() => handlePageChange(p)}
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
        <section className="relative w-full rounded-3xl overflow-hidden border border-white/10 bg-[#070709] min-h-[460px] sm:min-h-[520px] flex items-end shadow-2xl">
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#020203] via-[#020203]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#020203] via-[#020203]/50 to-transparent" />
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
                  <span className="px-2.5 py-1 bg-imdb text-black font-extrabold text-[10px] uppercase tracking-widest rounded shadow">
                    {t("hero.topChoice")}
                  </span>
                  <div className="flex items-center text-imdb text-sm font-bold">
                    <Star className="w-4 h-4 fill-imdb stroke-imdb mr-1" />
                    <span>{activeHero.imdbRating}</span>
                  </div>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none drop-shadow-lg">
                  {activeHero.title}
                </h2>

                <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 max-w-2xl font-light leading-relaxed">
                  {activeHero.plot}
                </p>

                <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-400 py-1">
                  <span>{activeHero.year}</span>
                  <span>•</span>
                  <span>{t("hero.director")} {activeHero.director}</span>
                  <span>•</span>
                  <span>{activeHero.runtime}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => onStreamMovie(activeHero)}
                    className="bg-imdb text-black px-6 py-3 rounded-xl font-extrabold text-xs flex items-center hover:bg-imdb-hover transition-colors shadow-lg cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 mr-2 fill-black" />
                    <span>{t("hero.watchStream")}</span>
                  </button>
                  <button
                    onClick={() => onDownloadMovie(activeHero)}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-3 rounded-xl font-semibold text-xs flex items-center transition-colors backdrop-blur-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 mr-2 text-imdb" />
                    <span>{t("hero.downloadMp4")}</span>
                  </button>
                  <button
                    onClick={() => navigate(`/movie/${activeHero.id}`)}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-3 rounded-xl font-semibold text-xs flex items-center transition-colors backdrop-blur-md cursor-pointer"
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
                    idx === heroIndex ? "w-6 bg-imdb" : "w-1.5 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Catalog & Filter Section */}
      <section id="catalog-section" className="space-y-6">
        {/* Category Pill Navigation */}
        <div className="bg-[#0a0a0d] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-imdb/10 text-imdb">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{t("category.label")}</span>
                </h4>
                <p className="text-[11px] text-gray-400 font-mono">
                  {t("category.subLabel")} ({CATEGORIES.length})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => handleSelectCategory(e.target.value)}
                className="bg-[#121215] border border-white/10 text-xs text-white rounded-xl px-4 py-2 focus:outline-none focus:border-imdb/50 font-medium cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#121215] text-white py-1.5 font-sans">
                    {getCategoryLabel(cat.id)}
                  </option>
                ))}
              </select>

              <span className="text-xs font-mono font-bold px-3 py-2 rounded-xl bg-imdb text-black shrink-0 hidden md:inline-block shadow-md">
                {getCategoryLabel(selectedCategory)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = cat.id === selectedCategory && searchResults === null;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? "bg-imdb text-black border-imdb shadow-md shadow-amber-500/10"
                      : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/5"
                  }`}
                >
                  {getCategoryLabel(cat.id)}
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
                  : t("search.categoryTitle", { category: getCategoryLabel(selectedCategory) })}
              </h3>
            </div>
            <p className="text-zinc-500 text-xs font-mono mt-1">
              {searchResults !== null 
                ? t("search.resultsFound", { count: totalResults.toLocaleString(), query: searchFromUrl }) 
                : t("search.pageStatus", { page: currentPage, totalPages, totalResults: totalResults.toLocaleString() })}
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="bg-[#121214] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-xs w-full focus:outline-none focus:border-imdb/50 transition-colors text-white"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
              className="px-5 bg-imdb hover:bg-imdb-hover disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold text-xs rounded-full transition-all cursor-pointer flex items-center justify-center shadow-lg shrink-0 h-9"
            >
              {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("search.button")}
            </button>

            {searchResults !== null && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-full transition-all border border-white/5 shrink-0 h-9"
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

        {/* Movie Grid */}
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
                    onStream={onStreamMovie}
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
                  onStream={onStreamMovie}
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
