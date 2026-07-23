import React, { useState, useEffect } from "react";
import { Movie } from "../types";
import { 
  X, 
  Download, 
  CheckCircle2, 
  Pause, 
  Play, 
  Trash2, 
  HardDrive, 
  Film, 
  ShieldCheck, 
  Zap, 
  FileVideo, 
  Sparkles,
  Volume2,
  Subtitles,
  Check,
  FolderDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface DownloadItem {
  id: string; // unique download id (e.g. movie.id + quality)
  movie: Movie;
  quality: "4k" | "1080p" | "720p" | "480p";
  qualityLabel: string;
  fileSize: string; // e.g., "3.8 GB"
  audioTrack: string;
  subtitleTrack: string;
  progress: number; // 0 to 100
  downloadSpeed: string; // e.g. "45.2 MB/s"
  status: "idle" | "downloading" | "paused" | "completed";
  downloadedAt?: string;
}

interface DownloadModalProps {
  movie: Movie;
  onClose: () => void;
  onStartDownload?: (download: DownloadItem) => void;
  onPlayOffline?: (movie: Movie) => void;
  existingDownload?: DownloadItem;
}

const QUALITIES = [
  {
    id: "4k",
    label: "4K Ultra HD",
    res: "3840 x 2160",
    size: "11.8 GB",
    bitrate: "45 Mbps HDR10",
    recommended: false,
    badge: "UHD 2160p"
  },
  {
    id: "1080p",
    label: "1080p Full HD",
    res: "1920 x 1080",
    size: "3.6 GB",
    bitrate: "12 Mbps x264/HEVC",
    recommended: true,
    badge: "BEST BALANCE"
  },
  {
    id: "720p",
    label: "720p HD",
    res: "1280 x 720",
    size: "1.4 GB",
    bitrate: "4 Mbps x264",
    recommended: false,
    badge: "FAST DOWNLOAD"
  },
  {
    id: "480p",
    label: "480p SD",
    res: "854 x 480",
    size: "620 MB",
    bitrate: "1.5 Mbps Data Saver",
    recommended: false,
    badge: "MOBILE DATA"
  }
];

const AUDIO_TRACKS = [
  "English 5.1 Dolby Atmos (Original)",
  "English Stereo (AAC 320kbps)",
  "Director's Audio Commentary",
  "French 5.1 Surround",
  "Spanish 5.1 Surround"
];

const SUBTITLE_TRACKS = [
  "English (Full)",
  "English (SDH / Hard of Hearing)",
  "Spanish",
  "French",
  "German",
  "None / Off"
];

export default function DownloadModal({
  movie,
  onClose,
  onStartDownload,
  onPlayOffline,
  existingDownload
}: DownloadModalProps) {
  const [selectedQuality, setSelectedQuality] = useState<"4k" | "1080p" | "720p" | "480p">(
    existingDownload?.quality || "1080p"
  );
  const [selectedAudio, setSelectedAudio] = useState(
    existingDownload?.audioTrack || AUDIO_TRACKS[0]
  );
  const [selectedSub, setSelectedSub] = useState(
    existingDownload?.subtitleTrack || SUBTITLE_TRACKS[0]
  );

  // Download state engine
  const [status, setStatus] = useState<"idle" | "downloading" | "paused" | "completed">(
    existingDownload?.status || "idle"
  );
  const [progress, setProgress] = useState<number>(existingDownload?.progress || 0);
  const [speed, setSpeed] = useState<string>("48.5 MB/s");
  const [etaSeconds, setEtaSeconds] = useState<number>(18);

  const activeQualityObj = QUALITIES.find((q) => q.id === selectedQuality) || QUALITIES[1];

  // Simulation timer when status is 'downloading'
  useEffect(() => {
    if (status !== "downloading") return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setStatus("completed");
          clearInterval(interval);
          return 100;
        }
        // Random incremental speed
        const increment = Math.random() * 8 + 6; // 6% to 14% increment per tick
        const next = Math.min(100, prev + increment);
        
        // Update simulated speed
        const currentSpeedVal = (Math.random() * 18 + 38).toFixed(1);
        setSpeed(`${currentSpeedVal} MB/s`);

        // ETA calculation
        const remainingPercent = 100 - next;
        setEtaSeconds(Math.max(1, Math.round((remainingPercent / 10) * 1.5)));

        if (next >= 100) {
          setStatus("completed");
        }
        return next;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [status]);

  // Handle starting download
  const handleStart = () => {
    setStatus("downloading");
    if (progress >= 100) setProgress(0);

    const downloadData: DownloadItem = {
      id: `${movie.id}-${selectedQuality}`,
      movie,
      quality: selectedQuality,
      qualityLabel: activeQualityObj.label,
      fileSize: activeQualityObj.size,
      audioTrack: selectedAudio,
      subtitleTrack: selectedSub,
      progress: 0,
      downloadSpeed: speed,
      status: "downloading",
      downloadedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    };

    if (onStartDownload) {
      onStartDownload(downloadData);
    }
  };

  // Sync state updates up to parent when download completes or progresses
  useEffect(() => {
    if (onStartDownload && (status === "downloading" || status === "completed" || status === "paused")) {
      const downloadData: DownloadItem = {
        id: `${movie.id}-${selectedQuality}`,
        movie,
        quality: selectedQuality,
        qualityLabel: activeQualityObj.label,
        fileSize: activeQualityObj.size,
        audioTrack: selectedAudio,
        subtitleTrack: selectedSub,
        progress,
        downloadSpeed: speed,
        status,
        downloadedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      };
      onStartDownload(downloadData);
    }
  }, [progress, status]);

  // Handle actual browser video download (.mp4)
  const triggerVideoDownload = () => {
    // Sample open video clip URL (e.g. Big Buck Bunny / Blender Foundation sample MP4 stream)
    const sampleVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    
    // Create link to trigger browser download
    const a = document.createElement("a");
    a.href = sampleVideoUrl;
    a.target = "_blank";
    a.download = `${movie.title.replace(/[^a-zA-Z0-9]/g, "_")}_${selectedQuality.toUpperCase()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle actual browser metadata package download (.nfo)
  const triggerNfoDownload = () => {
    const fileContent = `=====================================================
BFLIX CINEMA STREAMING - OFFICIAL OFFLINE MEDIA PACKAGE
=====================================================
Title: ${movie.title} (${movie.year})
Quality: ${activeQualityObj.label} (${activeQualityObj.res})
Bitrate: ${activeQualityObj.bitrate}
File Size: ${activeQualityObj.size}
Audio: ${selectedAudio}
Subtitles: ${selectedSub}
IMDb Rating: ${movie.imdbRating}/10
Director: ${movie.director}
Cast: ${movie.actors.join(", ")}
Plot: ${movie.plot}

Downloaded via BFlix Cinema Client on ${new Date().toLocaleString()}
Status: Verified Offline High-Definition Stream File
=====================================================`;

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${movie.title.replace(/[^a-zA-Z0-9]/g, "_")}_${selectedQuality.toUpperCase()}_BFlix.nfo`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative bg-[#09090b] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black my-8"
        >
          {/* Top Header */}
          <div className="relative px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-zinc-900/80 via-black to-zinc-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-imdb/10 border border-imdb/20 rounded-xl text-imdb">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg tracking-tight">
                  Download Offline Movie
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Ultra High-Speed Direct CDN Download
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Movie Info Snippet */}
            <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 items-center">
              <img
                src={movie.poster}
                alt={movie.title}
                referrerPolicy="no-referrer"
                className="w-16 h-24 object-cover rounded-xl border border-white/10 shadow-md shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex-grow min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-imdb text-black font-black px-2 py-0.5 rounded">
                    {movie.year}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    IMDb {movie.imdbRating}
                  </span>
                </div>
                <h4 className="text-white font-bold text-base truncate">{movie.title}</h4>
                <p className="text-xs text-gray-400 line-clamp-1 italic">
                  Dir: {movie.director}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {movie.genres.slice(0, 3).map((g, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Download Progress Widget if in progress or completed */}
            {status !== "idle" && (
              <div className="p-5 rounded-2xl bg-imdb/5 border border-imdb/20 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-bold flex items-center gap-2">
                    {status === "downloading" && <Zap className="w-4 h-4 text-imdb animate-pulse" />}
                    {status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {status === "paused" && <Pause className="w-4 h-4 text-amber-400" />}
                    <span>
                      {status === "downloading"
                        ? `Downloading (${progress.toFixed(0)}%)`
                        : status === "completed"
                        ? "Download Complete"
                        : "Download Paused"}
                    </span>
                  </span>
                  <span className="text-gray-400">
                    {status === "downloading" ? `${speed} • ~${etaSeconds}s remaining` : activeQualityObj.size}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-imdb via-amber-400 to-imdb rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>

                {/* Progress controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-gray-400 font-mono">
                    Quality: <span className="text-imdb font-bold">{activeQualityObj.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {status === "downloading" && (
                      <button
                        onClick={() => setStatus("paused")}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-mono transition-colors"
                      >
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </button>
                    )}
                    {status === "paused" && (
                      <button
                        onClick={() => setStatus("downloading")}
                        className="flex items-center gap-1.5 px-3 py-1 bg-imdb hover:bg-imdb-hover text-black font-bold rounded-lg text-xs font-mono transition-colors"
                      >
                        <Play className="w-3 h-3 fill-black" />
                        <span>Resume</span>
                      </button>
                    )}
                    {status === "completed" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={triggerVideoDownload}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-imdb hover:bg-imdb-hover text-black font-bold rounded-lg text-xs transition-colors shadow-md"
                          title="Save playable MP4 video file to device"
                        >
                          <FolderDown className="w-3.5 h-3.5" />
                          <span>Save MP4 Video</span>
                        </button>

                        <button
                          onClick={triggerNfoDownload}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-gray-200 rounded-lg text-xs font-semibold transition-colors"
                          title="Save cinema metadata file (.nfo)"
                        >
                          <FileVideo className="w-3.5 h-3.5 text-imdb" />
                          <span>Save NFO Meta</span>
                        </button>

                        {onPlayOffline && (
                          <button
                            onClick={() => {
                              onClose();
                              onPlayOffline(movie);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-emerald-300" />
                            <span>Play Stream</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quality Selector */}
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase text-gray-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileVideo className="w-3.5 h-3.5 text-imdb" />
                  Select Video Resolution & Bitrate
                </span>
                <span className="text-[10px] text-imdb font-mono">Verified High Bitrate</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUALITIES.map((q) => {
                  const isSelected = selectedQuality === q.id;
                  return (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuality(q.id as any)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-imdb/10 border-imdb text-white shadow-lg shadow-imdb/5 ring-1 ring-imdb"
                          : "bg-white/[0.02] border-white/5 hover:border-white/20 text-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{q.label}</span>
                            {q.recommended && (
                              <span className="text-[9px] bg-imdb text-black font-extrabold px-1.5 py-0.2 rounded uppercase">
                                Recommended
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 font-mono block mt-0.5">
                            {q.res}
                          </span>
                        </div>

                        <div className={`p-1 rounded-full ${isSelected ? "bg-imdb text-black" : "border border-white/10"}`}>
                          <Check className="w-3 h-3" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5 text-[11px] font-mono">
                        <span className="text-imdb font-bold">{q.size}</span>
                        <span className="text-gray-500">{q.bitrate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audio & Subtitle Customization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Audio Track */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-gray-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-imdb" />
                  Audio Stream
                </label>
                <select
                  value={selectedAudio}
                  onChange={(e) => setSelectedAudio(e.target.value)}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-imdb"
                >
                  {AUDIO_TRACKS.map((track, i) => (
                    <option key={i} value={track}>
                      {track}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtitle Track */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-gray-400 flex items-center gap-1.5">
                  <Subtitles className="w-3.5 h-3.5 text-imdb" />
                  Subtitles / CC
                </label>
                <select
                  value={selectedSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-imdb"
                >
                  {SUBTITLE_TRACKS.map((sub, i) => (
                    <option key={i} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* System Info Footnote */}
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-2 text-[11px] text-gray-400 font-mono">
              <HardDrive className="w-4 h-4 text-imdb shrink-0" />
              <span>
                Estimated Storage Required: <strong className="text-white">{activeQualityObj.size}</strong>. Files are cached securely for offline playback.
              </span>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-5 border-t border-white/10 bg-black flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-gray-300 transition-colors"
            >
              Cancel
            </button>

            {status === "idle" ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-2.5 bg-imdb hover:bg-imdb-hover text-black font-bold rounded-xl text-xs shadow-lg shadow-imdb/10 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Start Download ({activeQualityObj.size})</span>
              </button>
            ) : status === "completed" ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerNfoDownload}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-xl text-xs transition-all"
                  title="Download .nfo metadata file"
                >
                  <FileVideo className="w-4 h-4 text-imdb" />
                  <span>Save .NFO Meta</span>
                </button>
                <button
                  onClick={triggerVideoDownload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition-all"
                  title="Download .mp4 video file"
                >
                  <FolderDown className="w-4 h-4" />
                  <span>Save MP4 Video</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setStatus("downloading")}
                className="flex items-center gap-2 px-6 py-2.5 bg-imdb hover:bg-imdb-hover text-black font-bold rounded-xl text-xs shadow-lg transition-all"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>Accelerate Download</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
