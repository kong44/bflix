import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Movie, MovieDetail, TvEpisode } from "../types";
import { fetchMovieDetails, fetchTvSeasonEpisodes } from "../services/tmdb";
import { 
  STREAM_PROVIDERS, 
  getSavedProviderIndex, 
  saveProviderPreference 
} from "../services/streamProviders";
import { acquireAdShield, releaseAdShield } from "../utils/adShield";
import DownloadModal from "../components/DownloadModal";
import { savePlaybackProgress } from "../utils/playbackStorage";
import { toggleFullscreen, isFullscreen } from "../utils/fullscreen";
import { 
  ArrowLeft, 
  Play, 
  Server, 
  ShieldCheck, 
  ShieldOff, 
  Download, 
  Bookmark, 
  BookmarkCheck, 
  Star, 
  Tv, 
  Clock, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  ExternalLink,
  AlertCircle,
  Maximize,
  Minimize
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

interface WatchPageProps {
  watchlist: Movie[];
  onToggleWatchlist: (movie: Movie, e: React.MouseEvent) => void;
}

export default function WatchPage({ watchlist, onToggleWatchlist }: WatchPageProps) {
  const { movieId } = useParams<{ movieId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player state with localStorage memory
  const [selectedProviderIndex, setSelectedProviderIndex] = useState<number>(getSavedProviderIndex);
  const selectedProvider = STREAM_PROVIDERS[selectedProviderIndex] || STREAM_PROVIDERS[0];

  // Default selected is "off" with optional localStorage memory
  const [sandboxMode, setSandboxMode] = useState<"strict" | "compat" | "off">(() => {
    try {
      const saved = localStorage.getItem("bflix_ad_shield_mode");
      if (saved === "strict" || saved === "compat" || saved === "off") {
        return saved;
      }
    } catch (e) {}
    return "off";
  });

  const [iframeKey, setIframeKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isSlowServer, setIsSlowServer] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const serverSwitchTimeout = useRef<number | null>(null);
  const slowServerTimer = useRef<number | null>(null);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenActive(isFullscreen());
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Download modal state
  const [downloadModalMovie, setDownloadModalMovie] = useState<Movie | null>(null);

  // TV State bound to URL search params
  const seasonFromUrl = parseInt(searchParams.get("season") || "1", 10);
  const episodeFromUrl = parseInt(searchParams.get("episode") || "1", 10);

  const [season, setSeason] = useState<number>(seasonFromUrl);
  const [episode, setEpisode] = useState<number>(episodeFromUrl);
  const [episodes, setEpisodes] = useState<TvEpisode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  // Fetch movie or show details on mount / reload with AbortController
  useEffect(() => {
    if (!movieId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchMovieDetails(movieId, undefined, controller.signal)
      .then((data) => {
        setMovie(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("WatchPage movie detail fetch error:", err);
        setError(err.message || "Failed to load movie stream details.");
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [movieId]);

  // Sync state with URL params
  useEffect(() => {
    setSeason(seasonFromUrl);
    setEpisode(episodeFromUrl);
  }, [seasonFromUrl, episodeFromUrl]);

  // Fetch season episodes if TV
  const isTv = movie?.mediaType === "tv";

  useEffect(() => {
    if (!isTv || !movie?.tmdbId) return;
    const controller = new AbortController();
    setEpisodesLoading(true);

    fetchTvSeasonEpisodes(movie.tmdbId, season, controller.signal)
      .then((data) => {
        setEpisodes(data);
        setEpisodesLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setEpisodesLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [isTv, movie?.tmdbId, season]);

  // Record watch history and playback progress
  useEffect(() => {
    if (!movie) return;
    savePlaybackProgress({
      id: movie.id,
      tmdbId: movie.tmdbId,
      imdbId: movie.imdbId,
      mediaType: movie.mediaType || "movie",
      title: movie.title,
      poster: movie.poster,
      backdrop: movie.backdrop,
      currentTime: 0,
      duration: 0,
      percentage: 5,
      season: isTv ? season : undefined,
      episode: isTv ? episode : undefined,
      updatedAt: Date.now()
    });
  }, [movie, isTv, season, episode]);

  // Safe Window-Level Popup Shield Singleton
  useEffect(() => {
    acquireAdShield(sandboxMode);
    return () => {
      releaseAdShield(sandboxMode);
    };
  }, [sandboxMode]);

  // Stream Loading & Slow Server Timer
  useEffect(() => {
    setIsIframeLoading(true);
    setIsSlowServer(false);

    if (slowServerTimer.current) clearTimeout(slowServerTimer.current);
    slowServerTimer.current = window.setTimeout(() => {
      setIsSlowServer(true);
    }, 8000);

    return () => {
      if (slowServerTimer.current) clearTimeout(slowServerTimer.current);
    };
  }, [selectedProvider.id, season, episode, iframeKey, sandboxMode]);

  // Memory cleanup on unmount: free video decoders & background workers
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
      }
      if (serverSwitchTimeout.current) {
        clearTimeout(serverSwitchTimeout.current);
      }
      if (slowServerTimer.current) {
        clearTimeout(slowServerTimer.current);
      }
    };
  }, []);

  const handleSelectEpisode = (epNum: number, seasonNum: number = season) => {
    setSeason(seasonNum);
    setEpisode(epNum);
    setSearchParams({ season: String(seasonNum), episode: String(epNum) }, { replace: true });
    setIframeKey((prev) => prev + 1);
  };

  const handleNextEpisode = () => {
    handleSelectEpisode(episode + 1, season);
  };

  const handlePrevEpisode = () => {
    if (episode > 1) {
      handleSelectEpisode(episode - 1, season);
    }
  };

  // Debounced server switching to prevent multiple heavy iframes spawning simultaneously
  const handleServerSelect = (idx: number) => {
    setSelectedProviderIndex(idx);
    if (serverSwitchTimeout.current) {
      clearTimeout(serverSwitchTimeout.current);
    }
    serverSwitchTimeout.current = window.setTimeout(() => {
      const prov = STREAM_PROVIDERS[idx];
      if (prov) {
        saveProviderPreference(prov.id);
      }
      setIframeKey((k) => k + 1);
    }, 180);
  };

  const handleNextProvider = () => {
    const nextIdx = (selectedProviderIndex + 1) % STREAM_PROVIDERS.length;
    handleServerSelect(nextIdx);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 text-imdb animate-spin" />
        <p className="text-gray-400 font-mono text-sm tracking-wider uppercase">Loading cinema stream...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-[#121215] border border-white/10 rounded-3xl text-center space-y-4 shadow-2xl">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Could not load movie stream</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">{error || "Movie details unavailable."}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-imdb text-black font-bold text-xs rounded-xl hover:bg-imdb-hover transition-colors cursor-pointer"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const activeTmdb = movie.tmdbId || movie.id;
  const activeImdb = movie.imdbId || "";
  const currentEmbedUrl = isTv
    ? selectedProvider.getTvUrl(activeTmdb, activeImdb, movie.id, season, episode)
    : selectedProvider.getMovieUrl(activeTmdb, activeImdb, movie.id);

  const isWatchlisted = watchlist.some((m) => m.id === movie.id);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Top Header Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/10 pb-3 sm:pb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs rounded-full border border-white/10 transition-all cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Catalog</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 flex-wrap">
          <span className="text-white font-bold">{movie.title}</span>
          <span>•</span>
          <span>{movie.year}</span>
          {isTv && (
            <>
              <span>•</span>
              <span className="text-imdb font-bold">Season {season} Episode {episode}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Theater Video Player Container */}
      <div className="-mx-3.5 sm:mx-0 rounded-none sm:rounded-3xl overflow-hidden liquid-glass border-y sm:border border-white/15 shadow-2xl space-y-0">
        {/* Top Player Control Bar */}
        <div className="bg-[#0b0f19]/80 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-3">
            {/* Ad Shield Control */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-xl">
              {sandboxMode === "off" ? (
                <ShieldOff className="w-3.5 h-3.5 ml-1.5 text-rose-400" />
              ) : (
                <ShieldCheck className={`w-3.5 h-3.5 ml-1.5 ${sandboxMode === "strict" ? "text-emerald-400" : "text-amber-400"}`} />
              )}
              <span className="text-[10px] font-mono text-gray-400 font-bold uppercase hidden sm:inline-block">Ad Shield:</span>
              <select
                value={sandboxMode}
                onChange={(e) => {
                  const mode = e.target.value as "strict" | "compat" | "off";
                  setSandboxMode(mode);
                  try {
                    localStorage.setItem("bflix_ad_shield_mode", mode);
                  } catch (err) {}
                }}
                className={`bg-transparent text-xs font-mono font-bold focus:outline-none cursor-pointer pr-1 py-0.5 rounded ${
                  sandboxMode === "strict"
                    ? "text-emerald-400 font-extrabold"
                    : sandboxMode === "compat"
                    ? "text-amber-400 font-extrabold"
                    : "text-rose-400 font-extrabold"
                }`}
                title="Control Ad & Popup Blocking for embed iframe servers"
              >
                <option value="off" className="bg-[#121215] text-rose-400 font-bold">
                  ⚠️ Shield Off (All Ads Allowed)
                </option>
                <option value="strict" className="bg-[#121215] text-emerald-400 font-bold">
                  🛡️ Strict Ad Shield (Active)
                </option>
                <option value="compat" className="bg-[#121215] text-amber-400 font-bold">
                  🛡️ Balanced Shield
                </option>
              </select>
            </div>
          </div>

          {/* Server Switcher Dropdown & Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <label htmlFor="server-select-watch" className="text-xs uppercase font-mono text-gray-400 font-bold flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-imdb" />
              <span className="hidden sm:inline">Server:</span>
            </label>
            <select
              id="server-select-watch"
              value={selectedProviderIndex}
              onChange={(e) => handleServerSelect(Number(e.target.value))}
              className="bg-[#18181c] text-white border border-white/15 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 cursor-pointer shadow-md"
            >
              {STREAM_PROVIDERS.map((prov, index) => (
                <option key={prov.id} value={index} className="bg-[#121215] text-white py-1">
                  {index + 1}. {prov.name} [{prov.badge}]
                </option>
              ))}
            </select>

            {/* One-Click Switch Server Button */}
            <button
              onClick={handleNextProvider}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-400/30 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title={`Switch to next server (${STREAM_PROVIDERS[(selectedProviderIndex + 1) % STREAM_PROVIDERS.length]?.name})`}
            >
              <span>Switch Server</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Reload Stream Button */}
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer border border-white/10"
              title="Reload current stream player"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={() => toggleFullscreen(videoContainerRef.current)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/10 flex items-center gap-1.5"
              title={isFullscreenActive ? "Exit Fullscreen" : "Fullscreen Player"}
            >
              {isFullscreenActive ? <Minimize className="w-3.5 h-3.5 text-imdb" /> : <Maximize className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-xs font-mono font-bold">
                {isFullscreenActive ? "Exit Fullscreen" : "Fullscreen"}
              </span>
            </button>
          </div>
        </div>

        {/* 16:9 Aspect Video Stage */}
        <div
          ref={videoContainerRef}
          id="watch-stage-container"
          className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden"
        >
          <iframe
            ref={iframeRef}
            key={`${selectedProvider.id}-${isTv ? "tv" : "movie"}-${season}-${episode}-${iframeKey}-${sandboxMode}`}
            src={currentEmbedUrl}
            onLoad={() => {
              setIsIframeLoading(false);
              setIsSlowServer(false);
            }}
            title={`${movie.title} Stream Player - ${selectedProvider.name}`}
            className="w-full h-full border-0"
            allowFullScreen={true}
            allow="autoplay *; encrypted-media *; picture-in-picture *; accelerometer *; gyroscope *; fullscreen *"
            referrerPolicy="no-referrer"
            sandbox={
              sandboxMode === "strict"
                ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-downloads allow-fullscreen"
                : sandboxMode === "compat"
                ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-downloads allow-popups allow-fullscreen"
                : undefined
            }
          />

          {/* Smooth Non-Blocking Loading Scrim with Slow Server Detection */}
          <AnimatePresence>
            {isIframeLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center space-y-3.5 z-30 pointer-events-none"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-imdb/20 border-t-2 border-t-imdb animate-spin" />
                  <Play className="w-5 h-5 text-imdb absolute inset-0 m-auto fill-imdb" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-white font-mono tracking-wide">
                    Connecting to {selectedProvider.name}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {isTv ? `Season ${season} • Episode ${episode}` : movie.title}
                  </p>
                </div>

                {isSlowServer && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2 pointer-events-auto"
                  >
                    <button
                      onClick={handleNextProvider}
                      className="px-4 py-2 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xl backdrop-blur-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Server taking long? Try Server {(selectedProviderIndex + 1) % STREAM_PROVIDERS.length + 1}</span>
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TV Quick Next/Prev Episode Controls & Indicator */}
        {isTv && (
          <div className="bg-[#0b0f19]/90 border-t border-white/10 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3 text-xs font-mono">
            <span className="text-imdb font-bold">
              S{season}:E{episode}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevEpisode}
                disabled={episode <= 1}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold transition-all flex items-center gap-1 border border-white/10 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev Episode</span>
                <span className="sm:hidden">Prev</span>
              </button>

              <button
                onClick={handleNextEpisode}
                className="px-3 sm:px-3.5 py-1.5 rounded-lg bg-imdb text-black font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-md"
              >
                <span className="hidden sm:inline">Next Episode</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Seasons & Episode Browser (for TV Series) */}
      {isTv && (
        <div className="liquid-glass rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl border border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-white/5 pb-3 sm:pb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Tv className="w-4 sm:w-5 h-4 sm:h-5 text-imdb" />
                <span>Episodes & Seasons</span>
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Select an episode to switch playback instantly. Your URL stays synchronized.
              </p>
            </div>

            {movie.seasons && movie.seasons.length > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-1 no-scrollbar">
                {movie.seasons.map((s) => (
                  <button
                    key={s.seasonNumber}
                    onClick={() => {
                      setSeason(s.seasonNumber);
                      setSearchParams({ season: String(s.seasonNumber), episode: "1" }, { replace: true });
                    }}
                    className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                      season === s.seasonNumber
                        ? "bg-imdb text-black font-bold shadow-md"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Season {s.seasonNumber}
                  </button>
                ))}
              </div>
            )}
          </div>

          {episodesLoading ? (
            <div className="py-12 flex justify-center items-center gap-2 text-gray-400 text-xs font-mono">
              <Loader2 className="w-5 h-5 animate-spin text-imdb" />
              <span>Loading Season {season} episodes...</span>
            </div>
          ) : episodes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {episodes.map((ep) => {
                const isCurrent = ep.episodeNumber === episode;
                return (
                  <div
                    key={ep.id}
                    onClick={() => handleSelectEpisode(ep.episodeNumber)}
                    className={`group p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-3 border ${
                      isCurrent
                        ? "bg-imdb/10 border-imdb shadow-lg shadow-amber-500/10"
                        : "bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-imdb/40"
                    }`}
                  >
                    <div className="aspect-video w-full bg-black/60 rounded-xl overflow-hidden relative flex items-center justify-center">
                      {ep.stillPath ? (
                        <img src={ep.stillPath} alt={ep.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Tv className="w-8 h-8 text-gray-600" />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                          isCurrent ? "bg-imdb scale-110" : "bg-white/80 group-hover:scale-110"
                        }`}>
                          <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                        <span className="text-imdb">EPISODE {ep.episodeNumber}</span>
                        {ep.airDate && <span className="text-gray-500">{ep.airDate}</span>}
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-imdb transition-colors truncate mt-1">
                        {ep.name}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1 font-light leading-relaxed">
                        {ep.overview}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 font-mono py-8 text-center">
              Episode listing not available for Season {season}.
            </p>
          )}
        </div>
      )}

      {/* Movie Details & Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {movie.genres.map((g, i) => (
                <span key={i} className="px-3 py-1 bg-imdb/10 text-imdb border border-imdb/20 text-xs font-mono font-bold rounded-full">
                  {g}
                </span>
              ))}
              <span className="text-gray-400 text-xs font-mono">• {movie.runtime}</span>
              <span className="text-gray-400 text-xs font-mono">• {movie.year}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{movie.title}</h1>

            {movie.tagline && (
              <p className="text-amber-400/90 text-sm font-serif italic">"{movie.tagline}"</p>
            )}

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed pt-2">
              {movie.plotDetailed || movie.plot}
            </p>
          </div>

          {/* Action Buttons: Watchlist & Download */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
            <button
              onClick={() => setDownloadModalMovie(movie)}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 liquid-btn-gold text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Download Movie MP4</span>
            </button>

            <button
              onClick={(e) => onToggleWatchlist(movie, e)}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                isWatchlisted
                  ? "bg-imdb/15 text-imdb border-imdb/40"
                  : "bg-white/5 hover:bg-white/10 text-gray-200 border-white/10"
              }`}
            >
              {isWatchlisted ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-imdb fill-imdb/30" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="p-6 bg-[#0c0c0f] border border-white/10 rounded-2xl space-y-4 shadow-xl">
            <h4 className="text-xs font-mono uppercase text-gray-400 tracking-wider border-b border-white/5 pb-2">
              Production Details
            </h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-gray-500 text-[10px] block font-mono">DIRECTOR / CREATOR</span>
                <span className="font-bold text-white text-sm">{movie.director}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block font-mono">STARRING CAST</span>
                <span className="text-gray-300 leading-relaxed">{movie.actors.join(", ")}</span>
              </div>
              {movie.awards && (
                <div>
                  <span className="text-gray-500 text-[10px] block font-mono">ACCOLADES</span>
                  <span className="text-imdb">{movie.awards}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {downloadModalMovie && (
        <DownloadModal
          movie={downloadModalMovie}
          onClose={() => setDownloadModalMovie(null)}
          onStream={() => {
            setDownloadModalMovie(null);
          }}
        />
      )}
    </div>
  );
}
