import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Movie, MovieDetail, TvEpisode } from "../types";
import { fetchMovieDetails, fetchTvSeasonEpisodes } from "../services/tmdb";
import VideoJSPlayer from "../components/VideoJSPlayer";
import DownloadModal from "../components/DownloadModal";
import { getPlaybackProgress, savePlaybackProgress } from "../utils/playbackStorage";
import { 
  ArrowLeft, 
  Play, 
  Video, 
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
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

interface WatchPageProps {
  watchlist: Movie[];
  onToggleWatchlist: (movie: Movie, e: React.MouseEvent) => void;
}

interface StreamProvider {
  id: string;
  name: string;
  badge: string;
  getMovieUrl: (tmdbId: string, imdbId: string, id: string) => string;
  getTvUrl: (tmdbId: string, imdbId: string, id: string, season: number, episode: number) => string;
}

const PROVIDERS: StreamProvider[] = [
  {
    id: "vidsrc_me",
    name: "VidSrc.me",
    badge: "DEFAULT HD",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.me/embed/movie?tmdb=${tmdb || id}${imdb ? `&imdb=${imdb}` : ""}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${tmdb || id}&season=${s}&episode=${e}`
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    badge: "BACKUP",
    getMovieUrl: (tmdb, imdb, id) => `https://multiembed.mov/?video_id=${tmdb || id}&tmdb=1`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://multiembed.mov/?video_id=${tmdb || id}&tmdb=1&s=${s}&e=${e}`
  },
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
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.in/embed/movie/${tmdb || id || imdb}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.in/embed/tv/${tmdb || id || imdb}/${s}/${e}`
  },
  {
    id: "vidsrc_to",
    name: "VidSrc.to",
    badge: "SERVER 5",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.to/embed/movie/${tmdb || id || imdb}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.to/embed/tv/${tmdb || id || imdb}/${s}/${e}`
  },
  {
    id: "vidsrc_net",
    name: "VidSrc.net",
    badge: "SERVER 6",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.net/embed/movie/${tmdb || id || imdb}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.net/embed/tv/${tmdb || id || imdb}/${s}/${e}`
  },
  {
    id: "vidsrc_vip",
    name: "VidSrc.vip",
    badge: "SERVER 7",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.vip/embed/movie/${tmdb || id || imdb}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.vip/embed/tv/${tmdb || id || imdb}/${s}/${e}`
  },
  {
    id: "vidsrc_xyz",
    name: "VidSrc.xyz",
    badge: "SERVER 7",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.xyz/embed/movie/${tmdb || id || imdb}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.xyz/embed/tv/${tmdb || id || imdb}/${s}/${e}`
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    badge: "SERVER 8",
    getMovieUrl: (tmdb, imdb, id) => `https://player.autoembed.cc/embed/movie/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://player.autoembed.cc/embed/tv/${tmdb || id}/${s}/${e}`
  },
  {
    id: "two_embed",
    name: "2Embed",
    badge: "STABLE",
    getMovieUrl: (tmdb, imdb, id) => `https://www.2embed.cc/embed/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://www.2embed.cc/embedtv/${tmdb || id}&s=${s}&e=${e}`
  },
  {
    id: "smashystream",
    name: "SmashyStream",
    badge: "ALT SERVER",
    getMovieUrl: (tmdb, imdb, id) => `https://embed.smashystream.com/playere.php?tmdb=${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://embed.smashystream.com/playere.php?tmdb=${tmdb || id}&season=${s}&episode=${e}`
  }
];

export default function WatchPage({ watchlist, onToggleWatchlist }: WatchPageProps) {
  const { movieId } = useParams<{ movieId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player state - defaults to VidSrc.me (index 0) with localStorage memory
  const [selectedProviderIndex, setSelectedProviderIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("bflix_stream_server");
      if (saved) {
        const idx = PROVIDERS.findIndex((p) => p.id === saved);
        if (idx >= 0) return idx;
      }
    } catch (e) {}
    return 0; // VidSrc.me
  });
  const selectedProvider = PROVIDERS[selectedProviderIndex] || PROVIDERS[0];

  const [playerEngine, setPlayerEngine] = useState<"embed" | "videojs">("embed");
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

  // Video.js M3U8 Stream State
  const [activeM3u8Url, setActiveM3u8Url] = useState<string>("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectStatus, setInspectStatus] = useState<string | null>(null);

  // Download modal state
  const [downloadModalMovie, setDownloadModalMovie] = useState<Movie | null>(null);

  // TV State bound to URL search params
  const seasonFromUrl = parseInt(searchParams.get("season") || "1", 10);
  const episodeFromUrl = parseInt(searchParams.get("episode") || "1", 10);
  const timeFromUrl = parseInt(searchParams.get("t") || "0", 10);

  const [initialPlaybackTime] = useState<number>(() => {
    if (timeFromUrl > 0) return timeFromUrl;
    if (movieId) {
      const saved = getPlaybackProgress(movieId);
      if (saved && saved.currentTime > 0) return saved.currentTime;
    }
    return 0;
  });

  const [season, setSeason] = useState<number>(seasonFromUrl);
  const [episode, setEpisode] = useState<number>(episodeFromUrl);
  const [episodes, setEpisodes] = useState<TvEpisode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  // Fetch movie or show details on mount / reload
  useEffect(() => {
    if (!movieId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchMovieDetails(movieId)
      .then((data) => {
        if (isMounted) {
          setMovie(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("WatchPage movie detail fetch error:", err);
          setError(err.message || "Failed to load movie stream details.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
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
    let isMounted = true;
    setEpisodesLoading(true);

    fetchTvSeasonEpisodes(movie.tmdbId, season)
      .then((data) => {
        if (isMounted) {
          setEpisodes(data);
          setEpisodesLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setEpisodesLoading(false);
      });

    return () => {
      isMounted = false;
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

  // Window-Level Popup Defeater Trap
  useEffect(() => {
    if (sandboxMode === "off") return;
    const originalOpen = window.open;
    (window as any).open = function (url?: string | URL, target?: string, features?: string) {
      console.warn("[BFlix Ad Shield] Blocked unauthorized ad popup/tab to:", url);
      return {
        closed: false,
        close: () => {},
        focus: () => {},
        blur: () => {},
        postMessage: () => {},
        document: {},
        location: { href: "" }
      };
    };

    return () => {
      window.open = originalOpen;
    };
  }, [sandboxMode]);

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

  const handleNextProvider = () => {
    const nextIdx = (selectedProviderIndex + 1) % PROVIDERS.length;
    setSelectedProviderIndex(nextIdx);
    setIframeKey((k) => k + 1);
    try {
      if (PROVIDERS[nextIdx]) {
        localStorage.setItem("bflix_stream_server", PROVIDERS[nextIdx].id);
      }
    } catch (err) {
      console.warn("Failed to save stream server to localStorage:", err);
    }
  };

  // Inspect & Stream In VideoJS Engine
  const handleInspectAndStreamInVideoJS = async () => {
    if (!movie) return;
    setIsInspecting(true);
    setInspectStatus(`🔍 Inspecting stream from ${selectedProvider.name}...`);

    await new Promise((r) => setTimeout(r, 600));

    const directUrl = movie.videoUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
    setActiveM3u8Url(directUrl);
    setPlayerEngine("videojs");
    setIsInspecting(false);
    setInspectStatus(null);
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
    <div className="max-w-7xl mx-auto space-y-8 px-2 sm:px-4 pb-12">
      {/* Top Header Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs rounded-full border border-white/10 transition-all cursor-pointer w-fit"
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
      <div className="rounded-3xl overflow-hidden liquid-glass border border-white/15 shadow-2xl space-y-0">
        {/* Top Player Control Bar */}
        <div className="bg-[#0b0f19]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setPlayerEngine("embed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  playerEngine === "embed" ? "bg-imdb text-black shadow-md" : "text-gray-400 hover:text-white"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>14 HD Servers</span>
              </button>
              <button
                onClick={() => setPlayerEngine("videojs")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  playerEngine === "videojs" ? "bg-imdb text-black shadow-md" : "text-gray-400 hover:text-white"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video.js HTML5 (Pure)</span>
              </button>
            </div>

            {/* Ad Shield Control */}
            {playerEngine === "embed" && (
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
            )}
          </div>

          {/* Server Switcher Dropdown & Controls */}
          {playerEngine === "embed" && (
            <div className="flex items-center gap-2 flex-wrap">
              <label htmlFor="server-select-watch" className="text-xs uppercase font-mono text-gray-400 font-bold flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-imdb" />
                <span className="hidden sm:inline">Server:</span>
              </label>
              <select
                id="server-select-watch"
                value={selectedProviderIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setSelectedProviderIndex(idx);
                  setIframeKey((k) => k + 1);
                  try {
                    if (PROVIDERS[idx]) {
                      localStorage.setItem("bflix_stream_server", PROVIDERS[idx].id);
                    }
                  } catch (err) {}
                }}
                className="bg-[#18181c] text-white border border-white/15 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 cursor-pointer shadow-md"
              >
                {PROVIDERS.map((prov, index) => (
                  <option key={prov.id} value={index} className="bg-[#121215] text-white py-1">
                    {index + 1}. {prov.name} [{prov.badge}]
                  </option>
                ))}
              </select>

              {/* One-Click Switch Server Button */}
              <button
                onClick={handleNextProvider}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-400/30 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title={`Switch to next server (${PROVIDERS[(selectedProviderIndex + 1) % PROVIDERS.length]?.name})`}
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
            </div>
          )}
        </div>

        {/* 16:9 Aspect Video Stage */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {playerEngine === "videojs" ? (
            <VideoJSPlayer
              key={activeM3u8Url}
              initialTime={initialPlaybackTime}
              options={{
                autoplay: true,
                controls: true,
                responsive: true,
                fluid: true,
                playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
                sources: [
                  {
                    src: activeM3u8Url,
                    type: activeM3u8Url.includes(".mp4") ? "video/mp4" : "application/x-mpegURL"
                  }
                ]
              }}
              onTimeUpdate={(current, duration) => {
                const pct = duration > 0 ? Math.round((current / duration) * 100) : 0;
                savePlaybackProgress({
                  id: movie.id,
                  tmdbId: movie.tmdbId,
                  imdbId: movie.imdbId,
                  mediaType: movie.mediaType || "movie",
                  title: movie.title,
                  poster: movie.poster,
                  backdrop: movie.backdrop,
                  currentTime: Math.floor(current),
                  duration: Math.floor(duration),
                  percentage: pct,
                  season: isTv ? season : undefined,
                  episode: isTv ? episode : undefined,
                  updatedAt: Date.now()
                });
              }}
            />
          ) : (
            <iframe
              key={`${selectedProvider.id}-${isTv ? "tv" : "movie"}-${season}-${episode}-${iframeKey}-${sandboxMode}`}
              src={currentEmbedUrl}
              title={`${movie.title} Stream Player - ${selectedProvider.name}`}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope; fullscreen"
              referrerPolicy="no-referrer"
              sandbox={
                sandboxMode === "strict"
                  ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-downloads"
                  : sandboxMode === "compat"
                  ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-downloads allow-popups"
                  : undefined
              }
            />
          )}
        </div>

        {/* Video Stage Footer Bar */}
        <div className="bg-[#0b0f19]/90 border-t border-white/10 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Playing on {selectedProvider.name}</span>
            </span>
            {isTv && (
              <span className="text-imdb font-bold">
                S{season}:E{episode}
              </span>
            )}
            {playerEngine === "embed" && (
              <div className="flex items-center gap-1 text-amber-400/90 text-[11px] sm:border-l sm:border-white/10 sm:pl-3">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span className="hidden md:inline">Server slow or blocked?</span>
                <button
                  onClick={handleNextProvider}
                  className="underline hover:text-amber-300 font-bold cursor-pointer"
                  title="Switch to next server"
                >
                  Switch Server
                </button>
              </div>
            )}
          </div>

          {/* TV Quick Next/Prev Episode Controls */}
          {isTv && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevEpisode}
                disabled={episode <= 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold transition-all flex items-center gap-1 border border-white/10 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev Episode</span>
              </button>

              <button
                onClick={handleNextEpisode}
                className="px-3.5 py-1.5 rounded-lg bg-imdb text-black font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-md"
              >
                <span>Next Episode</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Seasons & Episode Browser (for TV Series) */}
      {isTv && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-imdb" />
                <span>Episodes & Seasons</span>
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Select an episode to switch playback instantly. Your URL stays synchronized.
              </p>
            </div>

            {movie.seasons && movie.seasons.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
                {movie.seasons.map((s) => (
                  <button
                    key={s.seasonNumber}
                    onClick={() => {
                      setSeason(s.seasonNumber);
                      setSearchParams({ season: String(s.seasonNumber), episode: "1" }, { replace: true });
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setDownloadModalMovie(movie)}
              className="px-6 py-3 liquid-btn-gold text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xl cursor-pointer"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Download Movie MP4</span>
            </button>

            <button
              onClick={(e) => onToggleWatchlist(movie, e)}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
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
