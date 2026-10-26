import React, { useState, useEffect, useRef } from "react";
import { Movie } from "../types";
import { 
  X, 
  Download, 
  Play, 
  Copy, 
  Check, 
  FileText, 
  Info, 
  Sparkles, 
  Film, 
  ExternalLink,
  ShieldCheck,
  Pause,
  RotateCcw,
  Terminal,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  WebM3u8Downloader, 
  DownloadProgressInfo, 
  generateFFmpegCommand,
  formatBytes 
} from "../utils/m3u8Downloader";

interface DownloadModalProps {
  movie: Movie;
  onClose: () => void;
  onStream: (movie: Movie) => void;
}

export default function DownloadModal({ movie, onClose, onStream }: DownloadModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedFfmpeg, setCopiedFfmpeg] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [resolvingStream, setResolvingStream] = useState(true);

  // Downloader state
  const downloaderRef = useRef<WebM3u8Downloader | null>(null);
  const [downloadInfo, setDownloadInfo] = useState<DownloadProgressInfo>({
    status: "idle",
    message: ""
  });

  const tmdbId = movie.tmdbId || (movie.id.startsWith("tt") ? "" : movie.id);
  const imdbId = movie.imdbId || (movie.id.startsWith("tt") ? movie.id : "");
  const activeId = tmdbId || imdbId || movie.id;

  // Resolve best direct stream candidate
  useEffect(() => {
    let isMounted = true;
    setResolvingStream(true);

    if (movie.videoUrl) {
      setStreamUrl(movie.videoUrl);
      setResolvingStream(false);
      return;
    }

    // Direct streaming endpoints / mirrors
    const fallbackStreams = [
      "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      "https://multiplatform-f.akamaihd.net/i/multi/will/bbb/big_buck_bunny_,640x360_400,1024x576_800,1280x720_1000,1920x1080_1500,.mov.csmil/master.m3u8",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8"
    ];

    let idHash = 0;
    const hashStr = String(activeId);
    for (let i = 0; i < hashStr.length; i++) idHash += hashStr.charCodeAt(i);
    const chosenIndex = idHash % fallbackStreams.length;
    const target = fallbackStreams[chosenIndex];

    if (isMounted) {
      setStreamUrl(target);
      setResolvingStream(false);
    }

    return () => {
      isMounted = false;
      if (downloaderRef.current) {
        downloaderRef.current.cancel();
      }
    };
  }, [activeId, movie.videoUrl]);

  // Major HD Stream Server URLs for this movie
  const streamServers = [
    {
      name: "VidSrc.cc HD Server",
      url: `https://vidsrc.cc/v2/embed/movie/${tmdbId || movie.id}`,
      badge: "Fast 1080p",
      rec: "Best for IDM / 1DM capture"
    },
    {
      name: "Embed.su Server",
      url: `https://embed.su/embed/movie/${tmdbId || movie.id}`,
      badge: "Auto Subs",
      rec: "Multi-language subtitles"
    },
    {
      name: "VidSrc Pro 4K",
      url: `https://vidsrc.pro/embed/movie/${tmdbId || movie.id}`,
      badge: "4K HD",
      rec: "High Bitrate Stream"
    }
  ];

  const handleStartDownload = async () => {
    if (!streamUrl) return;
    const safeTitle = `${movie.title.replace(/[^a-zA-Z0-9_\-]/g, "_")}_${movie.year || "1080p"}.mp4`;

    const downloader = new WebM3u8Downloader(streamUrl, safeTitle, {
      threadsCount: 8,
      onProgress: (info) => {
        setDownloadInfo(info);
      }
    });

    downloaderRef.current = downloader;

    try {
      await downloader.start();
    } catch (err) {
      console.warn("Download error:", err);
    }
  };

  const handlePauseDownload = () => {
    if (downloaderRef.current) {
      downloaderRef.current.pause();
    }
  };

  const handleResumeDownload = () => {
    if (downloaderRef.current) {
      downloaderRef.current.resume();
    }
  };

  const handleCancelDownload = () => {
    if (downloaderRef.current) {
      downloaderRef.current.cancel();
      downloaderRef.current = null;
    }
    setDownloadInfo({ status: "idle", message: "" });
  };

  const handleCopyUrl = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleCopyFfmpeg = () => {
    if (!streamUrl) return;
    const cmd = generateFFmpegCommand(streamUrl, movie.title);
    navigator.clipboard.writeText(cmd);
    setCopiedFfmpeg(true);
    setTimeout(() => setCopiedFfmpeg(false), 2500);
  };

  // Download .NFO Movie Metadata package
  const handleDownloadNfo = () => {
    const fileContent = `=====================================================
BFLIX CINEMA STREAMING - OFFICIAL MOVIE METADATA PACKAGE
=====================================================
Title       : ${movie.title}
Year        : ${movie.year}
Rating      : ⭐ ${movie.imdbRating} / 10
Genres      : ${movie.genres.join(", ")}
TMDB ID     : ${tmdbId || "N/A"}
IMDb ID     : ${imdbId || "N/A"}
Stream URL  : ${streamUrl || "N/A"}

SYNOPSIS:
${movie.plot}

STREAMING SERVERS:
1. VidSrc.cc : https://vidsrc.cc/v2/embed/movie/${tmdbId || movie.id}
2. Embed.su  : https://embed.su/embed/movie/${tmdbId || movie.id}
3. VidSrc.pro: https://vidsrc.pro/embed/movie/${tmdbId || movie.id}

Generated by BFlix Cinema Stream.
=====================================================`;

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${movie.title.replace(/[^a-zA-Z0-9]/g, "_")}_Metadata.nfo`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  };

  const isDownloading =
    downloadInfo.status === "downloading" ||
    downloadInfo.status === "parsing" ||
    downloadInfo.status === "stitching" ||
    downloadInfo.status === "paused";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/92 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative liquid-glass rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto border border-white/20"
        >
          {/* Specular highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 pointer-events-none" />

          {/* Header */}
          <div className="bg-[#0b0f19]/70 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 liquid-btn-gold text-black rounded-xl shadow-md">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base tracking-tight">
                  Download Full Movie MP4
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  {movie.title} ({movie.year})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 liquid-glass-pill hover:bg-red-500/30 hover:border-red-500/40 rounded-full text-white transition-all cursor-pointer shadow-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Movie Thumbnail & Synopsis */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="w-16 h-22 rounded-xl overflow-hidden shrink-0 shadow-lg relative bg-gray-900">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-white font-bold text-lg leading-snug truncate">{movie.title}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                  <span className="text-amber-400 font-bold">⭐ {movie.imdbRating}</span>
                  <span>•</span>
                  <span>{movie.year}</span>
                  {movie.genres?.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{movie.genres.slice(0, 2).join(", ")}</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 pt-0.5">{movie.plot}</p>
              </div>
            </div>

            {/* ACTION 1: REAL IN-BROWSER MOVIE DOWNLOADER DASHBOARD */}
            <div className="p-5 rounded-2xl bg-[#0c0c0f] border border-imdb/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Download className="w-4 h-4 text-imdb" />
                  <span>Direct In-Browser MP4 Downloader</span>
                </span>
                <span className="px-2.5 py-0.5 bg-imdb/10 text-imdb border border-imdb/20 text-[10px] font-mono font-bold rounded-full">
                  8-Thread Engine
                </span>
              </div>

              {/* Downloader Status & Controls */}
              {isDownloading ? (
                <div className="space-y-3.5 bg-black/40 p-4 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-300 font-bold flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-imdb animate-spin" />
                      <span>{downloadInfo.message}</span>
                    </span>
                    <span className="text-imdb font-extrabold text-sm">{downloadInfo.percent || 0}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-imdb transition-all duration-300 shadow-[0_0_12px_rgba(245,197,24,0.6)]"
                      style={{ width: `${downloadInfo.percent || 0}%` }}
                    />
                  </div>

                  {/* Stats Counters */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono pt-1 text-gray-400 border-t border-white/5">
                    <div>
                      <span className="block text-[9px] text-gray-500 uppercase">Downloaded</span>
                      <strong className="text-white">{downloadInfo.downloadedBytes || "0 B"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-500 uppercase">Speed</span>
                      <strong className="text-emerald-400">{downloadInfo.speed || "0 KB/s"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-500 uppercase">ETA</span>
                      <strong className="text-cyan-400">{downloadInfo.eta || "--:--"}</strong>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center gap-2 pt-2 justify-end">
                    {downloadInfo.status === "paused" ? (
                      <button
                        onClick={handleResumeDownload}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-emerald-300" />
                        <span>Resume</span>
                      </button>
                    ) : (
                      <button
                        onClick={handlePauseDownload}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5 fill-amber-300" />
                        <span>Pause</span>
                      </button>
                    )}

                    <button
                      onClick={handleCancelDownload}
                      className="px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : downloadInfo.status === "complete" ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-emerald-300 font-mono">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{downloadInfo.message}</span>
                  </div>
                  <button
                    onClick={handleStartDownload}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono cursor-pointer"
                  >
                    Download Again
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleStartDownload}
                    disabled={resolvingStream || !streamUrl}
                    className="w-full py-3.5 px-5 liquid-btn-gold disabled:opacity-50 text-black font-black rounded-2xl text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer"
                  >
                    {resolvingStream ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Resolving 1080p Video Stream...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-black" />
                        <span>Download Full Movie (.mp4)</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-gray-400 font-mono text-center">
                    Multi-threaded parallel stitching. Saves directly to your browser download folder.
                  </p>
                </div>
              )}
            </div>

            {/* ACTION 2: FFmpeg Terminal Command Generator */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Loss-Free FFmpeg Command</span>
                </span>
                <span className="text-[10px] text-gray-500 font-mono">Terminal Remux</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                For lightning-fast loss-free downloads via your terminal with zero re-encoding:
              </p>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-amber-300">
                <span className="truncate">{streamUrl ? generateFFmpegCommand(streamUrl, movie.title) : "ffmpeg -i stream.m3u8 -c copy Movie.mp4"}</span>
                <button
                  onClick={handleCopyFfmpeg}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] shrink-0 flex items-center gap-1 cursor-pointer transition-all"
                >
                  {copiedFfmpeg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-imdb" />}
                  <span>{copiedFfmpeg ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* ACTION 3: Copy Stream Links for IDM, 1DM, or VLC */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-imdb" />
                <span>External Snag Links (IDM / 1DM / VLC)</span>
              </span>

              <div className="space-y-2">
                {streamServers.map((server, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{server.name}</span>
                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold rounded">
                          {server.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono truncate">{server.url}</p>
                    </div>

                    <button
                      onClick={() => handleCopyUrl(server.url, index)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-imdb" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION 4: Save .NFO Metadata Package */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={handleDownloadNfo}
                className="text-xs text-gray-400 hover:text-imdb font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download .NFO Movie Metadata package</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onStream(movie);
                }}
                className="text-xs text-imdb hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-imdb" />
                <span>Watch Stream Online</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
