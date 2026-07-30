import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Movie } from "./types";
import MovieDetailModal from "./components/MovieDetailModal";
import StreamPlayerModal from "./components/StreamPlayerModal";
import DownloadModal from "./components/DownloadModal";
import BrowsePage from "./pages/BrowsePage";
import AIFinderPage from "./pages/AIFinderPage";
import WatchlistPage from "./pages/WatchlistPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import { Compass, Bookmark, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  // Modal states for stream / download / details overlay
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [streamMovie, setStreamMovie] = useState<Movie | null>(null);
  const [downloadModalMovie, setDownloadModalMovie] = useState<Movie | null>(null);

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
    <div className="min-h-screen bg-[#030408] text-zinc-100 flex flex-col font-sans selection:bg-imdb selection:text-black antialiased relative overflow-x-hidden">
      {/* Background Ambient Liquid Glowing Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] animate-liquid-orb-1" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-[140px] animate-liquid-orb-2" />
        <div className="absolute bottom-10 left-1/4 w-[26rem] h-[26rem] bg-amber-500/15 rounded-full blur-[130px] animate-liquid-orb-3" />
      </div>

      {/* Absolute high-end noise overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none z-10" />

      {/* Modern Liquid Glass Top Navigation Header */}
      <header className="sticky top-0 bg-[#060913]/60 backdrop-blur-2xl border-b border-white/10 z-30 px-6 sm:px-8 py-3.5 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <Link to="/" className="flex items-center gap-2.5 cursor-pointer group">
          <div className="bg-gradient-to-r from-imdb to-amber-500 font-black px-3 py-1 rounded-xl text-xl italic tracking-tight shadow-[0_4px_20px_rgba(245,197,24,0.4)] border border-white/30 select-none inline-flex items-center backdrop-blur-md">
            <span className="text-white font-black font-extrabold mr-[3px]">B</span>
            <span className="text-black font-black">Flix</span>
          </div>
          <span className="text-xs font-semibold tracking-widest text-gray-300 uppercase border-l border-white/15 pl-2.5 hidden xs:inline-block">
            {t("tagline")}
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
          {/* Tab Selection Page Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-full shadow-inner">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all select-none ${
                isBrowseActive
                  ? "bg-gradient-to-r from-white/20 to-white/10 text-imdb font-bold border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
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
                  ? "bg-gradient-to-r from-white/20 to-white/10 text-imdb font-bold border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
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
                  ? "bg-gradient-to-r from-white/20 to-white/10 text-imdb font-bold border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  : "text-gray-400 hover:text-white border border-transparent hover:bg-white/5"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{t("nav.watchlist")}</span>
              {watchlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-imdb text-black text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#020203]">
                  {watchlist.length}
                </span>
              )}
            </Link>
          </nav>

          {/* Language Switcher Switcher Bar */}
          <div className="flex items-center gap-1 bg-white/[0.05] backdrop-blur-xl border border-white/15 rounded-full p-1 shadow-inner">
            <button
              onClick={() => changeLanguage("en")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                currentLang.startsWith("en")
                  ? "liquid-btn-gold text-black shadow-md"
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
                  : "text-gray-400 hover:text-white"
              }`}
            >
              ខ្មែរ
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Page Routes */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <BrowsePage
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
                onSelectMovie={setSelectedMovie}
                onStreamMovie={setStreamMovie}
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
                onStreamMovie={setStreamMovie}
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
                onStreamMovie={setStreamMovie}
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
                onStreamMovie={setStreamMovie}
                onDownloadMovie={setDownloadModalMovie}
              />
            }
          />
          <Route path="/movie/:movieId" element={<MovieDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Modals */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onStream={(movie) => {
            setSelectedMovie(null);
            setStreamMovie(movie);
          }}
          onDownloadMp4={(movie) => {
            setSelectedMovie(null);
            setDownloadModalMovie(movie);
          }}
        />
      )}

      {streamMovie && (
        <StreamPlayerModal movie={streamMovie} onClose={() => setStreamMovie(null)} />
      )}

      {downloadModalMovie && (
        <DownloadModal
          movie={downloadModalMovie}
          onClose={() => setDownloadModalMovie(null)}
          onStream={(movie) => {
            setDownloadModalMovie(null);
            setStreamMovie(movie);
          }}
        />
      )}

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
