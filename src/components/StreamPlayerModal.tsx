import React, { useState, useEffect } from "react";
import { Movie } from "../types";
import { 
  X, 
  Play, 
  RefreshCw, 
  Maximize2, 
  ExternalLink, 
  ShieldCheck, 
  Film, 
  Tv, 
  Radio, 
  ChevronRight, 
  ChevronDown,
  Server,
  AlertCircle,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [iframeKey, setIframeKey] = useState(0);

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
            {/* Server Selector Dropdown */}
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

          {/* Video Iframe Player Frame */}
          <div
            id="stream-iframe-container"
            className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden"
          >
            <iframe
              key={`${selectedProvider.id}-${mediaType}-${season}-${episode}-${iframeKey}-${activeTmdb}-${activeImdb}`}
              src={currentEmbedUrl}
              title={`${movie.title} Stream Player - ${selectedProvider.name}`}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope"
            />
          </div>

          {/* Footer Notice & Troubleshooting Tips */}
          <div className="bg-[#121215] border-t border-white/10 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Connected to {selectedProvider.name} server</span>
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
