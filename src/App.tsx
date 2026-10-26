import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Movie } from "./types";
import { Compass, Bookmark, Sparkles, Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import HeaderSearch from "./components/HeaderSearch";

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

  const isBrowseActive = location.pathname === "/" || location.pathname.startsWith("/category");
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
      <header className={`sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-[0_4px_30px_rgba(0,0,0,0.15)] transition-colors duration-300 ${
        theme === "light" ? "bg-white/70 backdrop-blur-2xl border-b border-slate-900/10" : "bg-[#060913]/60 backdrop-blur-2xl border-b border-white/10"
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between w-full">
          {/* Brand Logo & Tagline */}
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer group shrink-0">
            <div className="bg-gradient-to-r from-imdb to-amber-500 font-black px-3 py-1 rounded-xl text-xl italic tracking-tight shadow-[0_4px_20px_rgba(245,197,24,0.4)] border border-white/30 select-none inline-flex items-center backdrop-blur-md">
              <span className="text-white font-black font-extrabold mr-[3px]">B</span>
              <span className="text-black font-black">Flix</span>
            </div>
            <span className={`text-xs font-semibold tracking-widest uppercase border-l pl-2.5 hidden sm:inline-block ${
              theme === "light" ? "text-slate-500 border-slate-300" : "text-gray-300 border-white/15"
            }`}>
              {t("tagline")}
            </span>
          </Link>

          {/* Header Search Bar */}
          <div className="w-full md:max-w-xs lg:max-w-sm xl:max-w-md shrink-0 sm:shrink">
            <HeaderSearch theme={theme} onSelectMovie={setSelectedMovie} />
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap justify-center shrink-0">
            {/* Tab Selection Page Navigation */}
            <nav className={`flex items-center gap-1 sm:gap-2 p-1 backdrop-blur-xl rounded-full shadow-inner border ${
              theme === "light" ? "bg-slate-200/60 border-slate-300/60" : "bg-white/[0.04] border-white/10"
            }`}>
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all select-none ${
                  isBrowseActive
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
                <Sparkles className="w-3.5 h-3.5" />
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

            {/* Theme Switcher Toggle Button */}
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

            {/* Language Switcher Switcher Bar */}
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
      </header>

      {/* Main Container with Page Routes */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
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
      <footer className="border-t border-white/5 bg-[#020203] px-6 sm:px-8 py-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-500 gap-4 mt-12">
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
    </div>
  );
}
