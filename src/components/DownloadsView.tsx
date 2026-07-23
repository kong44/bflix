import React from "react";
import { Movie } from "../types";
import { DownloadItem } from "./DownloadModal";
import { 
  Download, 
  HardDrive, 
  Play, 
  Trash2, 
  Film, 
  FolderDown, 
  Zap, 
  CheckCircle2, 
  Pause, 
  Clock, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";

interface DownloadsViewProps {
  downloads: DownloadItem[];
  onPlayMovie: (movie: Movie) => void;
  onOpenDownloadModal: (movie: Movie) => void;
  onDeleteDownload: (downloadId: string) => void;
  onClearAllDownloads: () => void;
  onNavigateBrowse: () => void;
}

export default function DownloadsView({
  downloads,
  onPlayMovie,
  onOpenDownloadModal,
  onDeleteDownload,
  onClearAllDownloads,
  onNavigateBrowse
}: DownloadsViewProps) {
  // Calculate total storage metric
  const calculateTotalSize = () => {
    let totalMB = 0;
    downloads.forEach((d) => {
      const sizeStr = d.fileSize;
      if (sizeStr.includes("GB")) {
        totalMB += parseFloat(sizeStr) * 1024;
      } else if (sizeStr.includes("MB")) {
        totalMB += parseFloat(sizeStr);
      }
    });
    if (totalMB >= 1024) {
      return `${(totalMB / 1024).toFixed(1)} GB`;
    }
    return `${Math.round(totalMB)} MB`;
  };

  const completedCount = downloads.filter((d) => d.status === "completed").length;
  const downloadingCount = downloads.filter((d) => d.status === "downloading" || d.status === "paused").length;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 py-8 space-y-8 flex-grow">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-gradient-to-r from-zinc-900/90 via-[#0a0a0c] to-zinc-900/90 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-imdb/10 border border-imdb/20 rounded-2xl text-imdb">
            <Download className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Offline Library
              </h1>
              <span className="text-xs font-mono font-bold text-imdb bg-imdb/10 px-2.5 py-0.5 rounded border border-imdb/20">
                {downloads.length} {downloads.length === 1 ? "Movie" : "Movies"}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-1">
              Manage cached high-definition video files for instant offline viewing without internet buffering.
            </p>
          </div>
        </div>

        {/* Storage Stats Box */}
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-4 rounded-2xl shrink-0">
          <div className="p-2.5 bg-white/5 rounded-xl text-gray-400">
            <HardDrive className="w-5 h-5 text-imdb" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-gray-400 uppercase block">Local Storage Used</span>
            <span className="text-lg font-bold text-white font-mono">{calculateTotalSize()}</span>
          </div>

          {downloads.length > 0 && (
            <button
              onClick={onClearAllDownloads}
              className="ml-2 text-xs font-mono text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Downloads List / Grid */}
      {downloads.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01] space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
            <Download className="w-8 h-8 text-gray-400" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-white font-bold text-lg">No Offline Downloads Yet</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-mono">
              Download your favorite movies in 4K, 1080p, or 720p to enjoy seamless offline cinema playback anywhere.
            </p>
          </div>
          <button
            onClick={onNavigateBrowse}
            className="flex items-center gap-2 px-6 py-2.5 bg-imdb hover:bg-imdb-hover text-black font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <span>Browse Movies Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {downloads.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden flex flex-col sm:flex-row gap-4 p-4 hover:border-imdb/40 transition-all shadow-xl group relative"
            >
              {/* Poster Thumbnail */}
              <div className="w-full sm:w-28 h-40 sm:h-36 shrink-0 rounded-xl overflow-hidden border border-white/10 relative bg-black">
                <img
                  src={item.movie.poster}
                  alt={item.movie.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <button
                  onClick={() => onPlayMovie(item.movie)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-imdb"
                  title="Play Offline Stream"
                >
                  <div className="p-3 bg-imdb text-black rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-black" />
                  </div>
                </button>
              </div>

              {/* Main Metadata & Progress Column */}
              <div className="flex-grow flex flex-col justify-between min-w-0 space-y-2">
                <div>
                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-mono font-bold bg-imdb text-black px-2 py-0.5 rounded">
                      {item.qualityLabel}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                      {item.fileSize}
                    </span>
                    {item.status === "completed" && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Downloaded
                      </span>
                    )}
                  </div>

                  <h3 className="text-white font-bold text-base line-clamp-1 group-hover:text-imdb transition-colors">
                    {item.movie.title}
                  </h3>

                  <p className="text-xs text-gray-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>{item.movie.year}</span>
                    <span>•</span>
                    <span className="truncate">Audio: {item.audioTrack.split(" ")[0]}</span>
                  </p>
                </div>

                {/* Download Progress Bar if active */}
                {item.status !== "completed" ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-mono text-gray-400">
                      <span>{item.status === "paused" ? "Paused" : "Downloading..."}</span>
                      <span className="text-imdb font-bold">{item.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-imdb rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-gray-500">
                    Saved to device on {item.downloadedAt || "Today"}
                  </div>
                )}

                {/* Actions row */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => onPlayMovie(item.movie)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-imdb hover:bg-imdb-hover text-black font-bold rounded-lg text-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Watch</span>
                  </button>

                  <button
                    onClick={() => onOpenDownloadModal(item.movie)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs font-mono transition-colors"
                    title="Change Download Settings or Quality"
                  >
                    <Download className="w-3.5 h-3.5 text-imdb" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => onDeleteDownload(item.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
                    title="Delete Download"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
