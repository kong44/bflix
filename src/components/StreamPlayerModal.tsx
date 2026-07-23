import React, { useState } from "react";
import { Movie } from "../types";
import { X, Play, RefreshCw, Maximize2, ExternalLink, ShieldCheck, Film, Tv, Radio } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StreamPlayerModalProps {
  movie: Movie;
  onClose: () => void;
}

interface StreamProvider {
  id: string;
  name: string;
  badge: string;
  getMovieUrl: (imdbId: string) => string;
  getTvUrl: (imdbId: string, season: number, episode: number) => string;
}

const PROVIDERS: StreamProvider[] = [
  {
    id: "vidsrc2_ru",
    name: "VidSrc2.ru (Primary)",
    badge: "FAST 1080P",
    getMovieUrl: (id) => `https://vidsrc2.ru/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc2.ru/embed/tv/${id}/${s}/${e}`
  },
  {
    id: "vidsrc2_to",
    name: "VidSrc2.to",
    badge: "4K HD",
    getMovieUrl: (id) => `https://vidsrc2.to/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc2.to/embed/tv/${id}/${s}/${e}`
  },
  {
    id: "vidsrc_pro",
    name: "VidSrc Pro",
    badge: "PRO SERVER",
    getMovieUrl: (id) => `https://vidsrc.pro/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`
  },
  {
    id: "two_embed",
    name: "2Embed",
    badge: "STABLE",
    getMovieUrl: (id) => `https://2embed.cc/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://2embed.cc/embed/tv/${id}&s=${s}&e=${e}`
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    badge: "MULTI-SUB",
    getMovieUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`
  },
  {
    id: "vidsrc_xyz",
    name: "VidSrc.xyz",
    badge: "BACKUP",
    getMovieUrl: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`
  }
];

export default function StreamPlayerModal({ movie, onClose }: StreamPlayerModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<StreamProvider>(PROVIDERS[0]);
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Compute current video embed source URL
  const currentEmbedUrl = mediaType === "movie"
    ? selectedProvider.getMovieUrl(movie.id)
    : selectedProvider.getTvUrl(movie.id, season, episode);

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById("stream-iframe-container");
    if (elem) {
      if (!document.fullscreenElement) {
        elem.requestFullscreen().catch((err) => console.error("Fullscreen error:", err));
        setIsFullscreen(true);
      } else {
        document.exitFullscreen().catch((err) => console.error("Exit fullscreen error:", err));
        setIsFullscreen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-lg flex items-center justify-center p-3 sm:p-6">
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
                  <span>IMDb ID: <strong className="text-imdb">{movie.id}</strong></span>
                  <span>•</span>
                  <span>Stream Provider: <strong className="text-gray-300">{selectedProvider.name}</strong></span>
                </p>
              </div>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                title="Reload video stream"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reload Server</span>
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

          {/* Player Navigation & Server Bar */}
          <div className="bg-[#020203] border-b border-white/5 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Server Selector Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full lg:w-auto">
              <span className="text-[10px] uppercase tracking-wider font-mono text-gray-500 mr-1 shrink-0 flex items-center gap-1">
                <Radio className="w-3 h-3 text-imdb" /> Server:
              </span>
              {PROVIDERS.map((prov) => (
                <button
                  key={prov.id}
                  onClick={() => setSelectedProvider(prov)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    selectedProvider.id === prov.id
                      ? "bg-imdb text-black font-bold border-imdb shadow-lg"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  <span>{prov.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    selectedProvider.id === prov.id ? "bg-black/20 text-black" : "bg-white/10 text-gray-400"
                  }`}>
                    {prov.badge}
                  </span>
                </button>
              ))}
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
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
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
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((e) => (
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
              key={`${selectedProvider.id}-${mediaType}-${season}-${episode}-${iframeKey}`}
              src={currentEmbedUrl}
              title={`${movie.title} Stream Player`}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope"
            />
          </div>

          {/* Footer Notice & Troubleshooting Tips */}
          <div className="bg-[#121215] border-t border-white/10 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400 font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Connected to VidSrc2 API embed provider ({selectedProvider.name})</span>
            </div>
            <p className="text-gray-500 text-center sm:text-right">
              If video is buffering or blocked, click another server above (e.g., 2Embed, VidSrc Pro) or disable aggressive adblockers.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
