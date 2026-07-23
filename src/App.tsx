import React, { useState, useEffect } from "react";
import { Movie } from "./types";
import MovieCard from "./components/MovieCard";
import MovieCardSkeleton from "./components/MovieCardSkeleton";
import MovieDetailModal from "./components/MovieDetailModal";
import StreamPlayerModal from "./components/StreamPlayerModal";
import AIRecommender from "./components/AIRecommender";
import { triggerMp4Download } from "./utils/downloadMp4";
import { 
  fetchCuratedMovies, 
  searchMovies, 
  searchMoviesWithPagination,
  fetchMoviesByCategory, 
  CATEGORIES, 
  CategoryOption 
} from "./services/tmdb";
import { 
  Film, 
  Search, 
  Compass, 
  Bookmark, 
  Sparkles, 
  Star, 
  Play, 
  Clock, 
  Loader2, 
  TrendingUp, 
  Heart,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Info,
  Layers,
  Grid,
  Download,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Navigation & UI tabs
  const [activeTab, setActiveTab] = useState<"browse" | "recommend" | "watchlist">("browse");
  
  // Database state
  const [curatedMovies, setCuratedMovies] = useState<Movie[]>([]);
  const [curatedLoading, setCuratedLoading] = useState(true);

  // Category & Pagination state
  const [selectedCategory, setSelectedCategory] = useState<string>("trending");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // AI recommendation state
  const [aiRecommendations, setAiRecommendations] = useState<Movie[]>([]);
  
  // Watchlist state
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  
  // Modals / detailed view state
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [streamMovie, setStreamMovie] = useState<Movie | null>(null);

  // Download notification toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Hero Carousel State
  const [heroIndex, setHeroIndex] = useState(0);

  // Trigger MP4 Download with toast
  const handleDownloadMp4 = (movie: Movie) => {
    const filename = triggerMp4Download(movie.title);
    setToastMessage(`Downloading ${movie.title} (${filename})...`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load movies by category or pagination
  useEffect(() => {
    if (activeTab !== "browse" || searchResults !== null) return;

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
  }, [selectedCategory, currentPage, activeTab, searchResults]);

  // Load watchlist from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cineai_watchlist");
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to read watchlist from local storage:", e);
    }
  }, []);

  // Sync watchlist back to LocalStorage
  const saveWatchlist = (newWatchlist: Movie[]) => {
    setWatchlist(newWatchlist);
    try {
      localStorage.setItem("cineai_watchlist", JSON.stringify(newWatchlist));
    } catch (e) {
      console.error("Failed to write watchlist to local storage:", e);
    }
  };

  // Rotating Hero slides
  useEffect(() => {
    if (curatedMovies.length === 0 || activeTab !== "browse" || searchResults !== null) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(curatedMovies.length, 5));
    }, 12000);
    return () => clearInterval(interval);
  }, [curatedMovies, activeTab, searchResults]);

  // Handler to toggle watchlist status of a movie
  const handleToggleWatchlist = (movie: Movie, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details modal click
    const isPresent = watchlist.some((m) => m.id === movie.id);
    if (isPresent) {
      saveWatchlist(watchlist.filter((m) => m.id !== movie.id));
    } else {
      saveWatchlist([...watchlist, movie]);
    }
  };

  // Select Category
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
    setSearchResults(null);
    setSearchQuery("");
  };

  // Trigger search query with TMDB API
  const handleSearch = async (e?: React.FormEvent, page: number = 1) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await searchMoviesWithPagination(searchQuery, page);
      if (res.movies && res.movies.length > 0) {
        setSearchResults(res.movies);
        setCurrentPage(res.page);
        setTotalPages(res.totalPages);
        setTotalResults(res.totalResults);
      } else {
        throw new Error(`No movies found matching "${searchQuery}".`);
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setSearchError(err.message || "An unexpected error occurred during search.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchError(null);
    setCurrentPage(1);
  };

  // Handle Page Change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (searchResults !== null) {
      handleSearch(undefined, newPage);
    }
    const element = document.getElementById("catalog-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const activeHero = curatedMovies[heroIndex] || curatedMovies[0];

  const currentCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  // Helper for rendering pagination buttons
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
    <div className="min-h-screen bg-[#020203] text-zinc-100 flex flex-col font-sans selection:bg-imdb selection:text-black antialiased relative">
      {/* Absolute high-end noise overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none z-40" />

      {/* Modern High-End Top Navigation Header */}
      <header className="sticky top-0 bg-[#020203]/85 backdrop-blur-md border-b border-white/5 z-30 px-6 sm:px-8 py-3.5 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => { setActiveTab("browse"); handleClearSearch(); }}>
          <div className="bg-imdb font-black px-2.5 py-0.5 rounded text-xl italic tracking-tight shadow-md select-none inline-flex items-center">
            <span className="text-white font-black font-extrabold mr-[3px]">B</span>
            <span className="text-black font-black">Flix</span>
          </div>
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase border-l border-white/10 pl-2.5 hidden xs:inline-block">CINEMA STREAM</span>
        </div>

        {/* Tab Selection Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("browse")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all select-none ${
              activeTab === "browse"
                ? "bg-white/10 text-imdb font-semibold border border-white/10"
                : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Movies</span>
          </button>

          <button
            onClick={() => setActiveTab("recommend")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all select-none ${
              activeTab === "recommend"
                ? "bg-white/10 text-imdb font-semibold border border-white/10"
                : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Vibe Finder</span>
          </button>

          <button
            onClick={() => setActiveTab("watchlist")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all select-none relative ${
              activeTab === "watchlist"
                ? "bg-white/10 text-imdb font-semibold border border-white/10"
                : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Watchlist</span>
            {watchlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-imdb text-black text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#020203]">
                {watchlist.length}
              </span>
            )}
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col">
        {/* TAB 1: BROWSE CINEMAS */}
        {activeTab === "browse" && (
          <div className="flex-grow flex flex-col">
            {/* ROTATING CINEMATIC HERO SLIDER - Hidden when actively viewing search results */}
            {activeHero && searchResults === null && (
              <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 pt-6">
                <div className="relative w-full h-[360px] sm:h-[420px] flex items-end overflow-hidden border border-white/5 rounded-3xl bg-[#020203] shadow-2xl">
                  {/* Backdrop Visual */}
                  <div className="absolute inset-0 select-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.9))] z-10" />
                    <motion.img
                      key={activeHero.id}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 0.6, scale: 1 }}
                      transition={{ duration: 1 }}
                      src={activeHero.backdrop}
                      alt=""
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  {/* Hero Details Block */}
                  <div className="relative z-20 w-full p-8 sm:p-10 flex flex-col md:flex-row gap-6 items-end justify-between">
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded text-[10px] uppercase font-bold tracking-widest text-white border border-white/5">
                          Top Choice
                        </span>
                        <div className="flex items-center text-imdb text-sm font-bold">
                          <Star className="w-4 h-4 fill-imdb stroke-imdb mr-1" />
                          {activeHero.imdbRating} <span className="text-gray-400 font-normal ml-1">/ 10</span>
                        </div>
                      </div>

                      <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter leading-none uppercase">
                        {activeHero.title}
                      </h2>

                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-xl font-sans font-light">
                        {activeHero.plot}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-400">
                        <span>{activeHero.year}</span>
                        <span>•</span>
                        <span>Dir: {activeHero.director}</span>
                        <span>•</span>
                        <span>{activeHero.runtime}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setStreamMovie(activeHero)}
                        className="bg-imdb text-black px-6 py-3 rounded-xl font-bold text-xs flex items-center hover:bg-imdb-hover transition-colors shadow-lg cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 mr-2 fill-black" />
                        <span>Watch Stream</span>
                      </button>
                      <button
                        onClick={() => handleDownloadMp4(activeHero)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-3 rounded-xl font-medium text-xs flex items-center transition-colors backdrop-blur-md cursor-pointer"
                        title="Download MP4 Video File"
                      >
                        <Download className="w-3.5 h-3.5 mr-2 text-imdb" />
                        <span>Download MP4</span>
                      </button>
                      <button
                        onClick={() => setSelectedMovie(activeHero)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-3 rounded-xl font-medium text-xs flex items-center transition-colors backdrop-blur-md cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5 mr-2" />
                        <span>Show Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MAIN CATALOG SECTION */}
            <div id="catalog-section" className="max-w-7xl mx-auto w-full px-6 sm:px-8 py-8 space-y-8 flex-grow">
              
              {/* Category & Genre Filter Dropdown */}
              {searchResults === null && (
                <div className="bg-[#101014] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-imdb">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                        <span>Select Movie Category / Genre</span>
                      </h4>
                      <p className="text-[11px] text-gray-400 font-mono">
                        Filter catalog across {CATEGORIES.length} curated categories
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <select
                        id="category-dropdown"
                        value={selectedCategory}
                        onChange={(e) => handleSelectCategory(e.target.value)}
                        className="w-full bg-[#18181c] text-white border border-white/20 rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-imdb cursor-pointer pr-10 appearance-none shadow-md hover:bg-[#202026] transition-all"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id} className="bg-[#121215] text-white py-1.5 font-sans">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-imdb absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <span className="text-xs font-mono font-bold px-3 py-2 rounded-xl bg-imdb text-black shrink-0 hidden md:inline-block shadow-md">
                      {currentCategoryObj.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Dynamic Interactive Header & Search Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold border-l-4 border-imdb pl-3 tracking-tight">
                      {searchResults !== null 
                        ? `Search Results` 
                        : `${currentCategoryObj.name} Movies`}
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-white/10 text-amber-400 border border-amber-400/20">
                      View All
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs font-mono mt-1">
                    {searchResults !== null 
                      ? `Found ${totalResults.toLocaleString()} results for "${searchQuery}"` 
                      : `Page ${currentPage} of ${totalPages} • Total ${totalResults.toLocaleString()} titles available`}
                  </p>
                </div>

                {/* Instant Input search bar */}
                <form onSubmit={(e) => handleSearch(e, 1)} className="flex gap-2 max-w-md w-full shrink-0">
                  <div className="relative flex-grow">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search titles..."
                      className="bg-[#121214] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-xs w-full focus:outline-none focus:border-imdb/50 transition-colors text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searchLoading || !searchQuery.trim()}
                    className="px-5 bg-imdb hover:bg-imdb-hover disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold text-xs rounded-full transition-all cursor-pointer flex items-center justify-center shadow-lg shrink-0"
                  >
                    {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </button>

                  {searchResults !== null && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="px-4 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-full transition-all border border-white/5 shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </form>
              </div>

              {/* SEARCH ERROR DISPLAY */}
              {searchError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-red-400">BFlix Catalog Lookup Failed</p>
                    <p className="text-xs text-gray-400 leading-normal">{searchError}</p>
                  </div>
                </div>
              )}

              {/* DYNAMIC RESULTS/CURATED GRID */}
              {(searchLoading || curatedLoading) ? (
                /* Skeleton Loader Cards Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <MovieCardSkeleton key={idx} />
                  ))}
                </div>
              ) : (
                <div className="space-y-10">
                  <motion.div 
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                  >
                    <AnimatePresence mode="popLayout">
                      {/* Active search results if queried */}
                      {searchResults !== null ? (
                        searchResults.length > 0 ? (
                          searchResults.map((movie) => (
                            <MovieCard
                              key={movie.id}
                              movie={movie}
                              onSelect={setSelectedMovie}
                              onStream={setStreamMovie}
                              onDownloadMp4={handleDownloadMp4}
                              isWatchlisted={watchlist.some((w) => w.id === movie.id)}
                              onToggleWatchlist={handleToggleWatchlist}
                            />
                          ))
                        ) : (
                          <div className="col-span-full py-16 text-center text-gray-500 flex flex-col items-center justify-center space-y-2">
                            <Compass className="w-10 h-10 text-gray-700 mb-2" />
                            <p className="text-sm font-mono uppercase">No search matches found.</p>
                            <p className="text-xs max-w-sm">Try searching for simple title fragments or spelling changes.</p>
                          </div>
                        )
                      ) : (
                        /* Category movies list */
                        curatedMovies.map((movie) => (
                          <MovieCard
                            key={movie.id}
                            movie={movie}
                            onSelect={setSelectedMovie}
                            onStream={setStreamMovie}
                            onDownloadMp4={handleDownloadMp4}
                            isWatchlisted={watchlist.some((w) => w.id === movie.id)}
                            onToggleWatchlist={handleToggleWatchlist}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* PAGINATION CONTROLS BAR */}
                  {totalPages > 1 && (
                    <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-gray-400 font-mono">
                        Page <span className="text-white font-bold">{currentPage}</span> of{" "}
                        <span className="text-white font-bold">{totalPages}</span>{" "}
                        <span className="text-gray-600">({totalResults.toLocaleString()} total titles)</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage <= 1}
                          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-xs text-gray-300 font-medium transition-all flex items-center gap-1 border border-white/5 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {renderPageNumbers()}
                        </div>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-xs text-gray-300 font-medium transition-all flex items-center gap-1 border border-white/5 cursor-pointer"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI RECOMMENDATIONS (VIBE FINDER) */}
        {activeTab === "recommend" && (
          <div className="max-w-5xl mx-auto w-full px-6 sm:px-8 py-8 space-y-8 flex-grow">
            <AIRecommender 
              onRecommendationsFound={(movies) => setAiRecommendations(movies)}
              onClear={() => setAiRecommendations([])}
            />

            {/* AI Recommendation Catalog */}
            {aiRecommendations.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-xl font-bold border-l-4 border-imdb pl-3 tracking-tight">AI Curated Picks</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">Tailored exclusively to match your description.</p>
                  </div>
                  <button
                    onClick={() => setAiRecommendations([])}
                    className="text-xs text-imdb hover:text-imdb-hover font-mono"
                  >
                    Clear Recommendations
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiRecommendations.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onSelect={setSelectedMovie}
                      onStream={setStreamMovie}
                      onDownloadMp4={handleDownloadMp4}
                      isWatchlisted={watchlist.some((w) => w.id === movie.id)}
                      onToggleWatchlist={handleToggleWatchlist}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PERSONAL WATCHLIST */}
        {activeTab === "watchlist" && (
          <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 py-8 space-y-8 flex-grow">
            <div>
              <h3 className="text-xl font-bold border-l-4 border-imdb pl-3 tracking-tight flex items-center gap-2">
                <Heart className="w-5 h-5 text-imdb" />
                Personal Archive Watchlist
              </h3>
              <p className="text-gray-500 text-xs font-mono mt-1">Saved cinematic choices in your active browser session.</p>
            </div>

            {watchlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {watchlist.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onSelect={setSelectedMovie}
                    onStream={setStreamMovie}
                    onDownloadMp4={handleDownloadMp4}
                    isWatchlisted={true}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            ) : (
              /* Beautiful Empty Watchlist Placeholder */
              <div className="py-24 text-center border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto">
                <div className="p-4 bg-white/5 text-gray-500 rounded-full border border-white/10">
                  <Bookmark className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-200">Your Watchlist is empty</h4>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                    Bookmark legendary titles from our spotlights or search results to build your personalized watchlist.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("browse")}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-xs font-semibold text-imdb rounded-xl transition-all cursor-pointer border border-white/5"
                >
                  Explore Spotlight Movies
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer credits */}
      <footer className="border-t border-white/5 bg-[#020203] px-6 sm:px-8 py-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 gap-4 mt-12">
        <span>© BFlix Cinema. All rights reserved.</span>
        <div className="flex gap-4 items-center uppercase tracking-wider text-xs">
          <a href="https://mebon.io" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 text-gray-400 transition-colors flex items-center gap-1.5 font-medium">
            Powered by <span className="text-imdb font-bold hover:underline">mebon.io</span>
          </a>
        </div>
      </footer>

      {/* Toast Notification Banner for MP4 Download */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[#121215] border border-imdb/40 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
          >
            <div className="p-2 bg-imdb/20 text-imdb rounded-xl">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-imdb">Downloading MP4 File</p>
              <p className="text-[11px] text-gray-300 font-mono">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Detailed Modal popup */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onStream={setStreamMovie}
          onDownloadMp4={handleDownloadMp4}
        />
      )}

      {/* Embedded Stream Video Player Modal */}
      {streamMovie && (
        <StreamPlayerModal
          movie={streamMovie}
          onClose={() => setStreamMovie(null)}
          onDownloadMp4={handleDownloadMp4}
        />
      )}
    </div>
  );
}
