import React, { useState, useEffect } from "react";
import { Movie } from "../types";
import { 
  X, 
  Play, 
  RefreshCw, 
  Maximize2, 
  ExternalLink, 
  ShieldCheck, 
  Shield,
  Film, 
  Tv, 
  Radio, 
  ChevronRight, 
  ChevronDown,
  Server,
  AlertCircle,
  Download,
  Video
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import VideoJSPlayer from "./VideoJSPlayer";

interface StreamPlayerModalProps {
  movie: Movie;
  onClose: () => void;
  onDownloadMp4?: (movie: Movie) => void;
}

interface StreamProvider {
  id: string;
  name: string;
  badge: string;
  getMovieUrl: (tmdbId: string, imdbId: string, id: string) => string;
  getTvUrl: (tmdbId: string, imdbId: string, id: string, season: number, episode: number) => string;
}

const TMDB_API_KEY = "15d2fb6030da5f74303f47bf9d0e0a7e";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const PROVIDERS: StreamProvider[] = [
  {
    id: "vidsrc_cc",
    name: "VidSrc.cc",
    badge: "FAST 1080P",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.cc/v2/embed/movie/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.cc/v2/embed/tv/${tmdb || id}/${s}/${e}`
  },
  {
    id: "embed_su",
    name: "Embed.su",
    badge: "AUTO SUB",
    getMovieUrl: (tmdb, imdb, id) => `https://embed.su/embed/movie/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://embed.su/embed/tv/${tmdb || id}/${s}/${e}`
  },
  {
    id: "vidsrc_pro",
    name: "VidSrc Pro",
    badge: "4K HD",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.pro/embed/movie/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.pro/embed/tv/${tmdb || id}/${s}/${e}`
  },
  {
    id: "vidsrc_in",
    name: "VidSrc.in",
    badge: "SERVER 4",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.in/embed/movie/${imdb || tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.in/embed/tv/${imdb || tmdb || id}/${s}/${e}`
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    badge: "SERVER 5",
    getMovieUrl: (tmdb, imdb, id) => `https://player.autoembed.cc/embed/movie/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://player.autoembed.cc/embed/tv/${tmdb || id}/${s}/${e}`
  },
  {
    id: "vidsrc_icu",
    name: "VidSrc.icu",
    badge: "SERVER 6",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.icu/embed/movie/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.icu/embed/tv/${tmdb || id}/${s}/${e}`
  },
  {
    id: "two_embed",
    name: "2Embed",
    badge: "STABLE",
    getMovieUrl: (tmdb, imdb, id) => `https://www.2embed.cc/embed/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://www.2embed.cc/embedtv/${tmdb || id}&s=${s}&e=${e}`
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    badge: "BACKUP",
    getMovieUrl: (tmdb, imdb, id) => `https://multiembed.mov/?video_id=${tmdb || id}&tmdb=1`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://multiembed.mov/?video_id=${tmdb || id}&tmdb=1&s=${s}&e=${e}`
  },
  {
    id: "smashystream",
    name: "SmashyStream",
    badge: "ALT SERVER",
    getMovieUrl: (tmdb, imdb, id) => `https://embed.smashystream.com/playere.php?tmdb=${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://embed.smashystream.com/playere.php?tmdb=${tmdb || id}&season=${s}&episode=${e}`
  }
];

export default function StreamPlayerModal({ movie, onClose, onDownloadMp4 }: StreamPlayerModalProps) {
  const [selectedProviderIndex, setSelectedProviderIndex] = useState(0);
  const selectedProvider = PROVIDERS[selectedProviderIndex];

  const [playerEngine, setPlayerEngine] = useState<"embed" | "videojs">("embed");
  const [blockAdsAndRedirects, setBlockAdsAndRedirects] = useState(true);
  const [blockedCount, setBlockedCount] = useState(0);
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [iframeKey, setIframeKey] = useState(0);

  // M3U8 HLS Stream State for VideoJS Engine
  const DEFAULT_M3U8_PRESETS = [
    { name: "Mux Test HLS", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
    { name: "Sintel 1080p HLS", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" },
    { name: "Tears of Steel 4K", url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8" },
    { name: "Big Buck Bunny HLS", url: "https://multiplatform-f.akamaihd.net/i/multi/will/bbb/big_buck_bunny_,640x360_400,1024x576_800,1280x720_1000,1920x1080_1500,.mov.csmil/master.m3u8" }
  ];

  const [m3u8Input, setM3u8Input] = useState<string>("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
  const [activeM3u8Url, setActiveM3u8Url] = useState<string>("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
  const [videoJsError, setVideoJsError] = useState<string | null>(null);

  const handleLoadM3u8 = (urlToLoad?: string) => {
    const targetUrl = (urlToLoad || m3u8Input).trim();
    if (!targetUrl) return;
    setVideoJsError(null);
    setActiveM3u8Url(targetUrl);
    setM3u8Input(targetUrl);
  };

  // Resolved ID state
  const [tmdbId, setTmdbId] = useState<string>(movie.tmdbId || "");
  const [imdbId, setImdbId] = useState<string>(movie.imdbId || "");

  // Resolve external IDs if missing
  useEffect(() => {
    let isMounted = true;

    async function resolveIds() {
      // Determine initial values from movie prop
      let currentTmdb = movie.tmdbId || "";
      let currentImdb = movie.imdbId || "";

      if (!currentTmdb && !movie.id.startsWith("tt") && /^\d+$/.test(movie.id)) {
        currentTmdb = movie.id;
      }
      if (!currentImdb && movie.id.startsWith("tt")) {
        currentImdb = movie.id;
      }

      if (currentTmdb && currentImdb) {
        if (isMounted) {
          setTmdbId(currentTmdb);
          setImdbId(currentImdb);
        }
        return;
      }

      try {
        const lookupId = currentTmdb || currentImdb || movie.id;
        if (lookupId.startsWith("tt")) {
          // Find TMDB ID from IMDb ID
          const findRes = await fetch(
            `${TMDB_BASE_URL}/find/${lookupId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
          );
          if (findRes.ok) {
            const findData = await findRes.json();
            if (findData.movie_results?.[0]?.id) {
              currentTmdb = String(findData.movie_results[0].id);
            }
          }
        } else if (/^\d+$/.test(lookupId)) {
          // Fetch external IDs from numeric TMDB ID
          const detailRes = await fetch(
            `${TMDB_BASE_URL}/movie/${lookupId}/external_ids?api_key=${TMDB_API_KEY}`
          );
          if (detailRes.ok) {
            const extData = await detailRes.json();
            if (extData.imdb_id) {
              currentImdb = extData.imdb_id;
            }
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
  }, [movie]);

  // Compute current video embed source URL
  const activeTmdb = tmdbId || (movie.id.startsWith("tt") ? "" : movie.id);
  const activeImdb = imdbId || (movie.id.startsWith("tt") ? movie.id : "");
  const fallbackId = movie.id;

  // Global anti-redirect & popup blocker directly on website client level
  useEffect(() => {
    if (!blockAdsAndRedirects) return;

    // Known ad & tracker keyword domains
    const TRACKER_PATTERNS = [
      "doubleclick", "googlesyndication", "google-analytics", "adservice",
      "popads", "adsterra", "propellerads", "exoclick", "juicyads", "popcash",
      "admaven", "monetag", "hilltopads", "outbrain", "taboola", "mgid",
      "scorecardresearch", "adnxs", "criteo", "yandex.ru/metrika", "trips.com",
      "booking.com", "agoda.com", "bet365", "1xbet", "casino"
    ];

    // 1. Override window.open to suppress ad popups/popunders created by third party embeds
    const originalWindowOpen = window.open;
    window.open = function (url, name, specs) {
      console.warn("🛡️ BFLIX Anti-Redirect Shield blocked popup window attempt:", url);
      setBlockedCount((prev) => prev + 1);
      return null; // Block popup creation
    };

    // 2. Navigation API interceptor (Chrome, Edge, Brave, Opera, Arc)
    // Intercepts top-level navigation attempts made by third party embed scripts to external ad domains
    const handleNavigation = (e: any) => {
      try {
        const destUrl = e.destination?.url || "";
        if (
          destUrl &&
          !destUrl.includes(window.location.host) &&
          !destUrl.startsWith("blob:") &&
          !destUrl.startsWith("data:")
        ) {
          e.preventDefault();
          console.warn("🛡️ BFLIX Navigation Shield blocked top-level page redirect to:", destUrl);
          setBlockedCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Navigation shield error:", err);
      }
    };

    if (typeof window !== "undefined" && "navigation" in window && (window as any).navigation) {
      (window as any).navigation.addEventListener("navigate", handleNavigation);
    }

    // 2. Intercept fetch API requests to block ad trackers
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      const urlStr = typeof input === "string" ? input : (input instanceof Request ? input.url : String(input));
      const isTracker = TRACKER_PATTERNS.some((pattern) => urlStr.toLowerCase().includes(pattern));
      if (isTracker) {
        console.warn("🛡️ BFLIX Anti-Tracker blocked fetch request:", urlStr);
        return Promise.reject(new TypeError("Blocked by BFLIX Anti-Tracker Shield"));
      }
      return originalFetch.apply(this, arguments as any);
    };

    // 3. Intercept XMLHttpRequest to block ad trackers
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
      const urlStr = String(url).toLowerCase();
      const isTracker = TRACKER_PATTERNS.some((pattern) => urlStr.includes(pattern));
      if (isTracker) {
        console.warn("🛡️ BFLIX Anti-Tracker blocked XHR request:", urlStr);
        // Point to empty dummy URL
        return originalXhrOpen.call(this, method, "about:blank");
      }
      return originalXhrOpen.apply(this, arguments as any);
    };

    // 4. Intercept unrequested link clicks and tab redirects from invisible ad overlays
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        // Block external ad links opened by invisible player overlays
        if (
          href.startsWith("http") &&
          !href.includes(window.location.hostname) &&
          (anchor.target === "_blank" || anchor.target === "_top" || anchor.target === "_parent")
        ) {
          const isPlayerArea = Boolean(target.closest("#stream-iframe-container"));
          if (isPlayerArea) {
            e.preventDefault();
            e.stopPropagation();
            console.warn("🛡️ Blocked ad redirect link:", href);
          }
        }
      }
    };

    // 5. Detect and prevent window blur caused by popunder tabs
    const handleWindowBlur = () => {
      // Re-focus main player window if an unrequested popunder tries to steal focus
      setTimeout(() => {
        if (document.hasFocus && !document.hasFocus()) {
          window.focus();
        }
      }, 100);
    };

    // 6. Prevent top-level page unload / redirects initiated by embed scripts
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Warn user before allowing external embed script from navigating main tab away
      e.preventDefault();
      e.returnValue = "Stay on BFLIX to keep watching movie?";
      return "Stay on BFLIX to keep watching movie?";
    };

    document.addEventListener("click", handleGlobalClick, true);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.open = originalWindowOpen;
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXhrOpen;
      if (typeof window !== "undefined" && "navigation" in window && (window as any).navigation) {
        (window as any).navigation.removeEventListener("navigate", handleNavigation);
      }
      document.removeEventListener("click", handleGlobalClick, true);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [blockAdsAndRedirects]);

  const currentEmbedUrl = mediaType === "movie"
    ? selectedProvider.getMovieUrl(activeTmdb, activeImdb, fallbackId)
    : selectedProvider.getTvUrl(activeTmdb, activeImdb, fallbackId, season, episode);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleNextProvider = () => {
    setSelectedProviderIndex((prev) => (prev + 1) % PROVIDERS.length);
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById("stream-iframe-container");
    if (elem) {
      if (!document.fullscreenElement) {
        elem.requestFullscreen().catch((err) => console.error("Fullscreen error:", err));
      } else {
        document.exitFullscreen().catch((err) => console.error("Exit fullscreen error:", err));
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/92 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative bg-[#0a0a0c] border border-white/10 rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col my-auto"
        >
          {/* Header Controls Bar */}
          <div className="bg-[#121215] border-b border-white/10 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-imdb text-black font-black rounded-lg">
                <Play className="w-4 h-4 fill-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-base tracking-tight line-clamp-1">
                    {movie.title}
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">({movie.year})</span>
                </div>
                <p className="text-[11px] text-gray-500 font-mono flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              {onDownloadMp4 && (
                <button
                  onClick={() => onDownloadMp4(movie)}
                  className="px-3 py-2 bg-imdb/10 hover:bg-imdb/20 border border-imdb/30 text-imdb rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Download MP4 Video File"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download MP4</span>
                </button>
              )}

              <button
                onClick={handleNextProvider}
                className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Switch to next server"
              >
                <span>Switch Server</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleRefresh}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                title="Reload video stream"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reload</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fullscreen</span>
              </button>

              <a
                href={currentEmbedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                title="Open stream link in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="p-2.5 bg-white/10 hover:bg-red-500/20 hover:border-red-500/30 border border-white/10 rounded-full text-white transition-all ml-2 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Player Server Control Bar */}
          <div className="bg-[#020203] border-b border-white/5 px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Player Engine Switcher & Anti-Popup Shield Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setPlayerEngine("embed")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    playerEngine === "embed" ? "bg-amber-400 text-black shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Embed HD Servers</span>
                </button>

                <button
                  onClick={() => setPlayerEngine("videojs")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    playerEngine === "videojs" ? "bg-imdb text-black shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video.js HTML5 Player</span>
                </button>
              </div>

              {playerEngine === "embed" && (
                <button
                  onClick={() => setBlockAdsAndRedirects(!blockAdsAndRedirects)}
                  title="Prevents iframe video player from opening popup tabs or redirecting your page"
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    blockAdsAndRedirects
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                      : "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{blockAdsAndRedirects ? "Anti-Redirect Shield: ACTIVE" : "Shield: OFF"}</span>
                </button>
              )}
            </div>

            {/* Server Selector Dropdown (Shown only when in embed mode) */}
            {playerEngine === "embed" && (
              <div className="flex items-center gap-2.5">
                <label htmlFor="server-select" className="text-xs uppercase tracking-wider font-mono text-gray-400 shrink-0 flex items-center gap-1.5 font-bold">
                  <Server className="w-3.5 h-3.5 text-imdb" />
                  <span>Select Server:</span>
                </label>
                <div className="relative">
                  <select
                    id="server-select"
                    value={selectedProviderIndex}
                    onChange={(e) => setSelectedProviderIndex(Number(e.target.value))}
                    className="bg-[#18181c] text-white border border-white/15 rounded-xl px-3.5 py-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 cursor-pointer pr-9 appearance-none shadow-md hover:bg-[#202026] transition-all"
                  >
                    {PROVIDERS.map((prov, index) => (
                      <option key={prov.id} value={index} className="bg-[#121215] text-white py-1">
                        {index + 1}. {prov.name} — [{prov.badge}]
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold hidden sm:inline-block">
                  {selectedProvider.badge}
                </span>
              </div>
            )}

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
                <div className="flex items-center gap-2 text-xs font-mono">
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

          {/* VideoJS M3U8 Direct HLS Stream Input Bar */}
          {playerEngine === "videojs" && (
            <div className="bg-[#121217] border-b border-white/10 p-3 sm:p-4 flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-imdb shrink-0">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>M3U8 / HLS Stream URL:</span>
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={m3u8Input}
                    onChange={(e) => setM3u8Input(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLoadM3u8()}
                    placeholder="Paste .m3u8 or .m8u HLS stream link (e.g. https://domain.com/stream/index.m3u8)..."
                    className="w-full bg-[#0a0a0d] text-white border border-white/20 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none pr-16"
                  />
                  {m3u8Input && (
                    <button
                      onClick={() => setM3u8Input("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleLoadM3u8()}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold font-mono text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Play HLS Stream</span>
                </button>
              </div>

              {/* Sample M3U8 Presets for Quick Testing */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span className="text-gray-400 font-bold shrink-0">Sample HLS Streams:</span>
                {DEFAULT_M3U8_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleLoadM3u8(preset.url)}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      activeM3u8Url === preset.url
                        ? "bg-amber-400/20 border-amber-400 text-amber-300 font-bold"
                        : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {videoJsError && (
                <div className="bg-red-500/15 border border-red-500/30 p-2.5 rounded-xl text-red-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>
                    Failed to play stream: {videoJsError}. Cross-Origin Resource Sharing (CORS) or protected headers may be active on this stream. Try switching to an Embed HD Server above!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Video Player Frame Container */}
          <div
            id="stream-iframe-container"
            className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden"
          >
            {playerEngine === "videojs" ? (
              <VideoJSPlayer
                key={activeM3u8Url}
                options={{
                  autoplay: true,
                  controls: true,
                  responsive: true,
                  fluid: true,
                  playbackRates: [0.5, 1, 1.25, 1.5, 2],
                  sources: [
                    {
                      src: activeM3u8Url,
                      type: activeM3u8Url.includes(".mp4") && !activeM3u8Url.includes(".m3u8")
                        ? "video/mp4"
                        : "application/x-mpegURL"
                    }
                  ]
                }}
                onError={(err) => {
                  const msg = err?.message || "CORS restriction or invalid M3U8 URL";
                  setVideoJsError(msg);
                }}
              />
            ) : (
              <iframe
                key={`${selectedProvider.id}-${mediaType}-${season}-${episode}-${iframeKey}-${activeTmdb}-${activeImdb}`}
                src={currentEmbedUrl}
                title={`${movie.title} Stream Player - ${selectedProvider.name}`}
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope"
              />
            )}
          </div>

          {/* Footer Notice & Troubleshooting Tips */}
          <div className="bg-[#121215] border-t border-white/10 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Connected to {selectedProvider.name}</span>
              </div>
              {blockedCount > 0 && (
                <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold text-[10px]">
                  Blocked {blockedCount} Redirects / Ads
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-amber-400/90 text-center sm:text-right">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Media unavailable on this server? Click </span>
              <button
                onClick={handleNextProvider}
                className="underline hover:text-amber-300 font-bold cursor-pointer"
              >
                Switch Server
              </button>
              <span> to try VidSrc.cc, Embed.su, or VidSrc Pro.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
