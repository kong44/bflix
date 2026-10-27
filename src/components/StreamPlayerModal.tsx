import React, { useState, useEffect, useRef } from "react";
import { Movie } from "../types";
import { 
  X, 
  Play, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  ShieldCheck, 
  ShieldOff, 
  Film, 
  Tv, 
  ChevronRight, 
  ChevronDown, 
  Server, 
  AlertCircle, 
  Download,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getPlaybackProgress, savePlaybackProgress } from "../utils/playbackStorage";
import { toggleFullscreen, isFullscreen } from "../utils/fullscreen";
import { 
  STREAM_PROVIDERS, 
  getSavedProviderIndex, 
  saveProviderPreference 
} from "../services/streamProviders";
import { acquireAdShield, releaseAdShield } from "../utils/adShield";
import { cachedFetchJson } from "../services/apiClient";

const TMDB_API_KEY = "15d2fb6030da5f74303f47bf9d0e0a7e";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

interface StreamPlayerModalProps {
  movie: Movie;
  initialSeason?: number;
  initialEpisode?: number;
  initialTime?: number;
  onClose: () => void;
  onDownloadMp4?: (movie: Movie) => void;
}

export default function StreamPlayerModal({
  movie,
  initialSeason,
  initialEpisode,
  initialTime,
  onClose,
  onDownloadMp4
}: StreamPlayerModalProps) {
  const savedProgress = getPlaybackProgress(movie.id);

  // Player state with localStorage memory
  const [selectedProviderIndex, setSelectedProviderIndex] = useState<number>(getSavedProviderIndex);
  const selectedProvider = STREAM_PROVIDERS[selectedProviderIndex] || STREAM_PROVIDERS[0];

  const [mediaType, setMediaType] = useState<"movie" | "tv">(
    movie.mediaType === "tv" ? "tv" : (savedProgress?.mediaType || "movie")
  );
  const [season, setSeason] = useState<number>(
    initialSeason || savedProgress?.season || 1
  );
  const [episode, setEpisode] = useState<number>(
    initialEpisode || savedProgress?.episode || 1
  );
  const [initialSeekTime] = useState<number>(
    initialTime || savedProgress?.currentTime || 0
  );
  const [iframeKey, setIframeKey] = useState(0);

  // Default to "off" with optional localStorage memory
  const [sandboxMode, setSandboxMode] = useState<"strict" | "compat" | "off">(() => {
    try {
      const saved = localStorage.getItem("bflix_ad_shield_mode");
      if (saved === "strict" || saved === "compat" || saved === "off") {
        return saved;
      }
    } catch (e) {}
    return "off";
  });

  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [isSlowServer, setIsSlowServer] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const serverSwitchTimeout = useRef<number | null>(null);
  const slowServerTimer = useRef<number | null>(null);

  // Ad Blocker: Window-Level Popup Shield Singleton
  useEffect(() => {
    acquireAdShield(sandboxMode);
    return () => {
      releaseAdShield(sandboxMode);
    };
  }, [sandboxMode]);

  // Synchronous initial ID detection
  const initialTmdb = movie.tmdbId || (!movie.id.startsWith("tt") && /^\d+$/.test(movie.id) ? movie.id : "");
  const initialImdb = movie.imdbId || (movie.id.startsWith("tt") ? movie.id : "");

  const [tmdbId, setTmdbId] = useState<string>(initialTmdb);
  const [imdbId, setImdbId] = useState<string>(initialImdb);

  // Resolve external IDs if missing (with in-flight deduplication)
  useEffect(() => {
    let isMounted = true;

    async function resolveIds() {
      let currentTmdb = initialTmdb;
      let currentImdb = initialImdb;

      if (currentTmdb && currentImdb) {
        return;
      }

      try {
        const lookupId = currentTmdb || currentImdb || movie.id;
        if (lookupId.startsWith("tt")) {
          const findUrl = `${TMDB_BASE_URL}/find/${lookupId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
          const findData = await cachedFetchJson<any>(findUrl, { persistSession: true, ttlMs: 24 * 60 * 60 * 1000 });
          if (findData.movie_results?.[0]?.id) {
            currentTmdb = String(findData.movie_results[0].id);
          } else if (findData.tv_results?.[0]?.id) {
            currentTmdb = String(findData.tv_results[0].id);
          }
        } else if (/^\d+$/.test(lookupId)) {
          const detailUrl = `${TMDB_BASE_URL}/${movie.mediaType === "tv" ? "tv" : "movie"}/${lookupId}/external_ids?api_key=${TMDB_API_KEY}`;
          const extData = await cachedFetchJson<any>(detailUrl, { persistSession: true, ttlMs: 24 * 60 * 60 * 1000 });
          if (extData.imdb_id) {
            currentImdb = extData.imdb_id;
          }
        }
      } catch (e) {
        console.warn("Failed to resolve external IDs for streaming player:", e);
      }

      if (isMounted) {
        setTmdbId(currentTmdb || movie.id);
        setImdbId(currentImdb || movie.id);
      }
    }

    resolveIds();

    return () => {
      isMounted = false;
    };
  }, [movie.id]);

  // Loading & Slow Server Tracker
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
  }, [selectedProvider.id, mediaType, season, episode, iframeKey, sandboxMode]);

  // Clean unmount: reset iframe src to kill decoders & workers
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

  // Save playback progress on mount and updates
  useEffect(() => {
    savePlaybackProgress({
      id: movie.id,
      tmdbId: tmdbId || movie.tmdbId,
      imdbId: imdbId || movie.imdbId,
      mediaType,
      title: movie.title,
      poster: movie.poster,
      backdrop: movie.backdrop,
      currentTime: initialSeekTime,
      duration: savedProgress?.duration || 0,
      percentage: savedProgress?.percentage || 5,
      season: mediaType === "tv" ? season : undefined,
      episode: mediaType === "tv" ? episode : undefined,
      updatedAt: Date.now()
    });
  }, [movie.id, mediaType, season, episode, tmdbId, imdbId]);

  // Debounced server switcher
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

  // Compute current video embed source URL
  const activeTmdb = tmdbId || (movie.id.startsWith("tt") ? "" : movie.id);
  const activeImdb = imdbId || (movie.id.startsWith("tt") ? movie.id : "");
  const fallbackId = movie.id;

  const currentEmbedUrl = mediaType === "movie"
    ? selectedProvider.getMovieUrl(activeTmdb, activeImdb, fallbackId)
    : selectedProvider.getTvUrl(activeTmdb, activeImdb, fallbackId, season, episode);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

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

  const handleToggleFullscreen = () => {
    const elem = document.getElementById("stream-iframe-container");
    if (elem) {
      toggleFullscreen(elem);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/92 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative liquid-glass rounded-t-3xl sm:rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col my-0 sm:my-auto border-t sm:border border-white/20 max-h-[95vh] sm:max-h-[92vh]"
        >
          {/* Mobile Grab Handle Bar */}
          <div className="w-12 h-1.5 bg-white/25 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

          {/* Specular light highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 pointer-events-none" />

          {/* Header Controls Bar */}
          <div className="bg-[#0b0f19]/70 backdrop-blur-xl border-b border-white/10 px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 liquid-btn-gold text-black font-black rounded-xl shadow-lg">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-sm sm:text-base tracking-tight line-clamp-1">
                    {movie.title}
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">({movie.year})</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-gray-400 font-mono flex items-center gap-2">
                  <span>TMDB ID: <strong className="text-amber-400">{activeTmdb || "Resolving..."}</strong></span>
                  {activeImdb && (
                    <>
                      <span>•</span>
                      <span>IMDb ID: <strong className="text-imdb">{activeImdb}</strong></span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {onDownloadMp4 && (
                <button
                  onClick={() => onDownloadMp4(movie)}
                  className="px-3 sm:px-3.5 py-1.5 sm:py-2 liquid-btn-gold text-black rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                  title="Download MP4 Video File"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download MP4</span>
                </button>
              )}

              <button
                onClick={handleNextProvider}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 liquid-glass-pill hover:bg-white/20 text-amber-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-md border border-amber-400/30"
                title="Switch to next server"
              >
                <span>Switch Server</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleRefresh}
                className="p-2 sm:p-2.5 liquid-glass-pill hover:bg-white/20 rounded-xl text-gray-200 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                title="Reload video stream"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reload</span>
              </button>

              <button
                onClick={handleToggleFullscreen}
                className="p-2 sm:p-2.5 liquid-glass-pill hover:bg-white/20 rounded-xl text-gray-200 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                title={isFullscreenActive ? "Exit Fullscreen" : "Toggle Fullscreen"}
              >
                {isFullscreenActive ? <Minimize2 className="w-3.5 h-3.5 text-imdb" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isFullscreenActive ? "Exit Fullscreen" : "Fullscreen"}</span>
              </button>

              <a
                href={currentEmbedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 liquid-glass-pill hover:bg-white/20 rounded-xl text-gray-200 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                title="Open stream link in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="p-2 sm:p-2.5 liquid-glass-pill hover:bg-red-500/30 hover:border-red-500/40 rounded-full text-white transition-all ml-1 sm:ml-2 cursor-pointer shadow-md"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Player Server Control Bar */}
          <div className="bg-[#020203] border-b border-white/5 px-4 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Anti-Popup Shield Toggle */}
            <div className="flex flex-wrap items-center gap-2">
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
                    ⚠️ Shield Off (Unrestricted - Ads Allowed)
                  </option>
                  <option value="strict" className="bg-[#121215] text-emerald-400 font-bold">
                    🛡️ Strict Ad Shield (Active - Popups Blocked)
                  </option>
                  <option value="compat" className="bg-[#121215] text-amber-400 font-bold">
                    🛡️ Balanced Shield (No Redirects)
                  </option>
                </select>
              </div>
            </div>

            {/* Server Selector Dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <label htmlFor="server-select" className="text-xs uppercase tracking-wider font-mono text-gray-400 shrink-0 flex items-center gap-1.5 font-bold">
                <Server className="w-3.5 h-3.5 text-imdb" />
                <span className="hidden sm:inline">Select Server:</span>
              </label>
              <div className="relative">
                <select
                  id="server-select"
                  value={selectedProviderIndex}
                  onChange={(e) => handleServerSelect(Number(e.target.value))}
                  className="bg-[#18181c] text-white border border-white/15 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 cursor-pointer pr-8 appearance-none shadow-md hover:bg-[#202026] transition-all"
                >
                  {STREAM_PROVIDERS.map((prov, index) => (
                    <option key={prov.id} value={index} className="bg-[#121215] text-white py-1">
                      {index + 1}. {prov.name} — [{prov.badge}]
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* One-Click Next Server Button */}
              <button
                onClick={handleNextProvider}
                className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-400/30 text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Switch to next streaming server"
              >
                <span>Next Server</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Media Mode Toggle (Movie vs TV Show) */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setMediaType("movie")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition-all cursor-pointer ${
                    mediaType === "movie" ? "bg-imdb text-black font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>Movie</span>
                </button>
                <button
                  onClick={() => setMediaType("tv")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition-all cursor-pointer ${
                    mediaType === "tv" ? "bg-imdb text-black font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Tv className="w-3 h-3" />
                  <span>TV Series</span>
                </button>
              </div>

              {mediaType === "tv" && (
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                    <span className="text-gray-500 text-[10px]">S:</span>
                    <select
                      value={season}
                      onChange={(e) => setSeason(Number(e.target.value))}
                      className="bg-transparent text-white border-none focus:outline-none cursor-pointer font-bold"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((s) => (
                        <option key={s} value={s} className="bg-black text-white">
                          Season {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                    <span className="text-gray-500 text-[10px]">E:</span>
                    <select
                      value={episode}
                      onChange={(e) => setEpisode(Number(e.target.value))}
                      className="bg-transparent text-white border-none focus:outline-none cursor-pointer font-bold"
                    >
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((e) => (
                        <option key={e} value={e} className="bg-black text-white">
                          Ep {e}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Player Frame Container */}
          <div
            id="stream-iframe-container"
            className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden"
          >
            <iframe
              ref={iframeRef}
              key={`${selectedProvider.id}-${mediaType}-${season}-${episode}-${iframeKey}-${sandboxMode}`}
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
                      {mediaType === "tv" ? `Season ${season} • Episode ${episode}` : movie.title}
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

          {/* Footer Bar */}
          <div className="bg-[#121215] border-t border-white/10 px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3 text-[11px] font-mono safe-bottom">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="truncate">Connected to {selectedProvider.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border hidden sm:inline-block ${
                sandboxMode === "strict"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : sandboxMode === "compat"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }`}>
                {sandboxMode === "strict" ? "Strict Ad Shield (Active)" : sandboxMode === "compat" ? "Balanced Shield" : "Shield Off"}
              </span>
            </div>

            <button
              onClick={handleNextProvider}
              className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-400/30 text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              title="Switch to next server"
            >
              <span>Next Server</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
