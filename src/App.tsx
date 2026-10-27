import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Movie } from "./types";
import { Compass, Bookmark, Sun, Moon, Search, Film, Tv } from "lucide-react";
import { useTranslation } from "react-i18next";
import HeaderSearch from "./components/HeaderSearch";
import MobileSearchModal from "./components/MobileSearchModal";

// Lazy-loaded routes and modals for optimized initial load
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const AIFinderPage = lazy(() => import("./pages/AIFinderPage"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
const MovieDetailPage = lazy(() => import("./pages/MovieDetailPage"));
const WatchPage = lazy(() => import("./pages/WatchPage"));

const MovieDetailModal = lazy(() => import("./components/MovieDetailModal"));
const StreamPlayerModal = lazy(() => import("./components/StreamPlayerModal"));
const DownloadModal = lazy(() => import("./components/DownloadModal"));

const PageFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
    <div className="w-8 h-8 rounded-full border-2 border-imdb/20 border-t-imdb animate-spin" />
    <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Loading BFlix...</span>
  </div>
);

export default function App() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const currentLang = i18n.language || "en";

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // Watchlist state
  const [watchlist, setWatchlist] = useState<Movie[]>([]);

  // Theme state: "dark" or "light"
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      const saved = localStorage.getItem("cineai_theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (e) {
      console.error("Failed to read theme from local storage", e);
    }
    return "dark";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("cineai_theme", nextTheme);
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  };

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  // Modal states for stream / download / details overlay
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [streamMovie, setStreamMovie] = useState<Movie | null>(null);
  const [streamSeason, setStreamSeason] = useState<number>(1);
  const [streamEpisode, setStreamEpisode] = useState<number>(1);
  const [streamInitialTime, setStreamInitialTime] = useState<number>(0);
  const [downloadModalMovie, setDownloadModalMovie] = useState<Movie | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleStartStream = (
    movie: Movie,
    season: number = 1,
    episode: number = 1,
    initialTime: number = 0
  ) => {
    setSelectedMovie(null);
    setDownloadModalMovie(null);
    setStreamMovie(null);
    const searchParams = new URLSearchParams();
    if (movie.mediaType === "tv" || season > 1 || episode > 1) {
      searchParams.set("season", season.toString());
      searchParams.set("episode", episode.toString());
    }
    if (initialTime > 0) {
      searchParams.set("t", Math.floor(initialTime).toString());
    }
    const queryString = searchParams.toString();
    navigate(`/watch/${movie.id}${queryString ? `?${queryString}` : ""}`);
  };

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

  // Handler to toggle watchlist status of a movie
  const handleToggleWatchlist = (movie: Movie, e: React.MouseEvent) => {
    e.stopPropagation();
    const isPresent = watchlist.some((m) => m.id === movie.id);
    if (isPresent) {
      saveWatchlist(watchlist.filter((m) => m.id !== movie.id));
    } else {
      saveWatchlist([...watchlist, movie]);
    }
  };

  const isBrowseActive = location.pathname === "/" || (location.pathname.startsWith("/category") && !location.pathname.includes("tv"));
  const isSeriesActive = location.pathname.includes("tv");
  const isAiActive = location.pathname === "/vibe-finder";
  const isWatchlistActive = location.pathname === "/watchlist";

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-imdb selection:text-black antialiased relative overflow-x-hidden transition-colors duration-300 ${
      theme === "light" ? "light bg-[#f2f5f9] text-slate-800" : "bg-[#030408] text-zinc-100"
    }`}>
      {/* Background Ambient Liquid Glowing Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] animate-liquid-orb-1 ${
          theme === "light" ? "bg-cyan-400/25" : "bg-cyan-600/20"
        }`} />
        <div className={`absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full blur-[140px] animate-liquid-orb-2 ${
          theme === "light" ? "bg-indigo-400/20" : "bg-indigo-600/15"
        }`} />
        <div className={`absolute bottom-10 left-1/4 w-[26rem] h-[26rem] rounded-full blur-[130px] animate-liquid-orb-3 ${
          theme === "light" ? "bg-amber-400/25" : "bg-amber-500/15"
        }`} />
      </div>

      {/* Absolute high-end noise overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none z-10" />

      {/* Modern Liquid Glass Top Navigation Header */}
      <header className={`sticky top-0 z-30 px-3.5 sm:px-8 py-2.5 sm:py-3.5 shadow-[0_4px_30px_rgba(0,0,0,0.15)] transition-colors duration-300 ${
        theme === "light" ? "bg-white/80 backdrop-blur-2xl border-b border-slate-900/10" : "bg-[#060913]/70 backdrop-blur-2xl border-b border-white/10"
      }`}>
        <div className="max-w-7xl mx-auto w-full">
          {/* Mobile Top App Bar (< md) */}
          <div className="flex md:hidden items-center justify-between w-full h-10">
            <Link to="/" className="flex items-center gap-2 cursor-pointer select-none group">
              <div className="bg-gradient-to-r from-imdb to-amber-500 px-2.5 py-1 rounded-xl shadow-[0_4px_16px_rgba(245,197,24,0.4)] border border-white/30 select-none inline-flex items-center justify-center backdrop-blur-md">
                <img
                  src="/logo.png"
                  alt="BFlix"
                  className="h-8 w-auto object-contain select-none"
                />
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {/* Quick Search Button */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className={`w-8 h-8 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  theme === "light"
                    ? "bg-slate-200/70 border-slate-300 text-slate-700"
                    : "bg-white/[0.06] border-white/15 text-imdb"
                }`}
                aria-label="Open Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`w-8 h-8 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  theme === "light"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                    : "bg-white/[0.06] border-white/15 text-amber-400"
                }`}
                title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                aria-label="Toggle Theme"
              >
                {theme === "light" ? <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" /> : <Moon className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => changeLanguage(currentLang.startsWith("en") ? "km" : "en")}
                className="w-8 h-8 rounded-full text-[10px] font-bold border bg-white/[0.06] border-white/15 text-gray-200 cursor-pointer"
              >
                {currentLang.startsWith("en") ? "EN" : "ខ្មែរ"}
              </button>
            </div>
          </div>

          {/* Desktop Header (md+) */}
          <div className="hidden md:flex items-center justify-between w-full gap-4">
            {/* Brand Logo & Tagline */}
            <Link to="/" className="flex items-center gap-2.5 cursor-pointer group shrink-0">
              <div className="bg-gradient-to-r from-imdb to-amber-500 px-3 py-1.5 rounded-xl shadow-[0_4px_20px_rgba(245,197,24,0.4)] border border-white/30 select-none inline-flex items-center justify-center backdrop-blur-md transition-transform group-hover:scale-105">
                <img
                  src="/logo.png"
                  alt="BFlix"
                  className="h-7 sm:h-8 w-auto object-contain select-none"
                />
              </div>
              <span className={`text-xs font-semibold tracking-widest uppercase border-l pl-2.5 ${
                theme === "light" ? "text-slate-500 border-slate-300" : "text-gray-300 border-white/15"
              }`}>
                {t("tagline")}
              </span>
            </Link>

            {/* Desktop Centered Search */}
            <div className="w-full md:max-w-xs lg:max-w-sm xl:max-w-md shrink">
              <HeaderSearch theme={theme} onSelectMovie={setSelectedMovie} />
            </div>

            {/* Desktop Navigation & Controls */}
            <div className="flex items-center gap-3 shrink-0">
              <nav className={`flex items-center gap-1 p-1 backdrop-blur-xl rounded-full border ${
                theme === "light" ? "bg-slate-200/60 border-slate-300/60" : "bg-white/[0.04] border-white/10"
              }`}>
                <Link
                  to="/"
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all select-none ${
                    isBrowseActive && !isSeriesActive
                      ? theme === "light"
                        ? "bg-white text-black font-bold border border-slate-300 shadow-sm"
                        : "bg-gradient-to-r from-white/20 to-white/10 text-imdb font-bold border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                      : theme === "light"
                        ? "text-slate-600 hover:text-slate-900 border border-transparent hover:bg-white/50"
                        : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{t("nav.movies")}</span>
                </Link>

                <Link
                  to="/vibe-finder"
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all select-none ${
                    isAiActive
                      ? theme === "light"
                        ? "bg-white text-black font-bold border border-slate-300 shadow-sm"
                        : "bg-gradient-to-r from-white/20 to-white/10 text-imdb font-bold border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                      : theme === "light"
                        ? "text-slate-600 hover:text-slate-900 border border-transparent hover:bg-white/50"
                        : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{t("nav.aiFinder")}</span>
                </Link>

                <Link
                  to="/watchlist"
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all select-none relative ${
                    isWatchlistActive
                      ? theme === "light"
                        ? "bg-white text-black font-bold border border-slate-300 shadow-sm"
                        : "bg-gradient-to-r from-white/20 to-white/10 text-imdb font-bold border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                      : theme === "light"
                        ? "text-slate-600 hover:text-slate-900 border border-transparent hover:bg-white/50"
                        : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{t("nav.watchlist")}</span>
                  {watchlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-imdb text-black text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-slate-900 shadow">
                      {watchlist.length}
                    </span>
                  )}
                </Link>
              </nav>

              {/* Desktop Theme Switcher */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center shadow-inner ${
                  theme === "light"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20"
                    : "bg-white/[0.05] backdrop-blur-xl border-white/15 text-amber-400 hover:bg-white/10"
                }`}
                title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                aria-label="Toggle Theme"
              >
                {theme === "light" ? <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" /> : <Moon className="w-4 h-4 text-amber-400" />}
              </button>

              {/* Desktop Language Switcher */}
              <div className={`flex items-center gap-1 backdrop-blur-xl border rounded-full p-1 shadow-inner ${
                theme === "light" ? "bg-slate-200/60 border-slate-300/60" : "bg-white/[0.05] border-white/15"
              }`}>
                <button
                  onClick={() => changeLanguage("en")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    currentLang.startsWith("en")
                      ? "liquid-btn-gold text-black shadow-md"
                      : theme === "light"
                        ? "text-slate-600 hover:text-slate-900"
                        : "text-gray-400 hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage("km")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    currentLang.startsWith("km")
                      ? "liquid-btn-gold text-black shadow-md"
                      : theme === "light"
                        ? "text-slate-600 hover:text-slate-900"
                        : "text-gray-400 hover:text-white"
                  }`}
                >
                  ខ្មែរ
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Page Routes */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <BrowsePage
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  onSelectMovie={setSelectedMovie}
                  onStreamMovie={handleStartStream}
                  onDownloadMovie={setDownloadModalMovie}
                />
              }
            />
            <Route
              path="/category/:categoryId"
              element={
                <BrowsePage
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  onSelectMovie={setSelectedMovie}
                  onStreamMovie={handleStartStream}
                  onDownloadMovie={setDownloadModalMovie}
                />
              }
            />
            <Route
              path="/vibe-finder"
              element={
                <AIFinderPage
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  onStreamMovie={(m) => handleStartStream(m)}
                  onDownloadMovie={setDownloadModalMovie}
                />
              }
            />
            <Route
              path="/watchlist"
              element={
                <WatchlistPage
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  onStreamMovie={(m) => handleStartStream(m)}
                  onDownloadMovie={setDownloadModalMovie}
                />
              }
            />
            <Route path="/movie/:movieId" element={<MovieDetailPage />} />
            <Route
              path="/watch/:movieId"
              element={
                <WatchPage
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Global Modals */}
      <Suspense fallback={null}>
        {selectedMovie && (
          <MovieDetailModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            onStream={(movie, season, episode) => {
              handleStartStream(movie, season || 1, episode || 1);
            }}
            onDownloadMp4={(movie) => {
              setSelectedMovie(null);
              setDownloadModalMovie(movie);
            }}
          />
        )}

        {streamMovie && (
          <StreamPlayerModal
            movie={streamMovie}
            initialSeason={streamSeason}
            initialEpisode={streamEpisode}
            initialTime={streamInitialTime}
            onClose={() => {
              setStreamMovie(null);
              setStreamInitialTime(0);
            }}
          />
        )}

        {downloadModalMovie && (
          <DownloadModal
            movie={downloadModalMovie}
            onClose={() => setDownloadModalMovie(null)}
            onStream={(movie) => {
              handleStartStream(movie);
            }}
          />
        )}
      </Suspense>

      {/* Footer credits */}
      <footer className="border-t border-white/5 bg-[#020203] px-6 sm:px-8 py-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 gap-4 mt-12 mb-16 md:mb-0">
        <span>{t("footer.rights")}</span>
        <div className="flex gap-4 items-center uppercase tracking-wider text-xs">
          <a
            href="https://mebon.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-400 text-gray-400 transition-colors flex items-center gap-1.5 font-medium"
          >
            {t("footer.poweredBy")}{" "}
            <span className="text-imdb font-bold hover:underline">mebon.io</span>
          </a>
        </div>
      </footer>

      {/* Native Mobile Bottom Navigation Bar (Tab Bar) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t safe-bottom transition-colors duration-300 ${
        theme === "light"
          ? "bg-white/95 backdrop-blur-2xl border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          : "bg-[#05070d]/95 backdrop-blur-2xl border-white/10 shadow-[0_-4px_25px_rgba(0,0,0,0.6)]"
      }`}>
        <div className="grid grid-cols-4 h-14 items-center">
          {/* Tab 1: Movies */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              isBrowseActive && !isSeriesActive
                ? "text-imdb font-bold"
                : theme === "light" ? "text-slate-500 hover:text-slate-800" : "text-gray-400 hover:text-white"
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Movies</span>
          </Link>

          {/* Tab 2: TV Series */}
          <Link
            to="/category/trending_tv"
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              isSeriesActive
                ? "text-imdb font-bold"
                : theme === "light" ? "text-slate-500 hover:text-slate-800" : "text-gray-400 hover:text-white"
            }`}
          >
            <Tv className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Series</span>
          </Link>

          {/* Tab 3: Search */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
              isMobileSearchOpen
                ? "text-imdb font-bold"
                : theme === "light" ? "text-slate-500 hover:text-slate-800" : "text-gray-400 hover:text-white"
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Search</span>
          </button>

          {/* Tab 4: Watchlist */}
          <Link
            to="/watchlist"
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              isWatchlistActive
                ? "text-imdb font-bold"
                : theme === "light" ? "text-slate-500 hover:text-slate-800" : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="relative">
              <Bookmark className="w-5 h-5" />
              {watchlist.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-imdb text-black text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow">
                  {watchlist.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Watchlist</span>
          </Link>
        </div>
      </nav>

      {/* Full-Screen Mobile Search Sheet Modal */}
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        onSelectMovie={setSelectedMovie}
        theme={theme}
      />
    </div>
  );
}
