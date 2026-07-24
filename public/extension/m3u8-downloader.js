// IDM-Style High-Speed Multi-Threaded M3U8 HLS Downloader Engine

export async function parseMasterM3U8(m3u8Url) {
  const response = await fetch(m3u8Url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - Could not fetch M3U8 playlist`);
  }
  const text = await response.text();
  const lines = text.split("\n");

  const qualities = [];

  // Check if master playlist containing variant streams
  if (text.includes("#EXT-X-STREAM-INF")) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#EXT-X-STREAM-INF")) {
        // Extract RESOLUTION and BANDWIDTH metadata
        let resolution = "Auto / Default";
        let bandwidth = 0;

        const resMatch = line.match(/RESOLUTION=(\d+x\d+)/i);
        if (resMatch) resolution = resMatch[1];

        const bwMatch = line.match(/BANDWIDTH=(\d+)/i);
        if (bwMatch) bandwidth = parseInt(bwMatch[1], 10);

        // Find next non-comment line for playlist URL
        let j = i + 1;
        while (j < lines.length && (lines[j].trim().startsWith("#") || !lines[j].trim())) {
          j++;
        }
        if (lines[j]) {
          const variantUrl = new URL(lines[j].trim(), m3u8Url).href;
          qualities.push({
            resolution,
            bandwidth,
            url: variantUrl,
            label: resolution !== "Auto / Default" 
              ? `${resolution} (${Math.round(bandwidth / 1000)} Kbps)`
              : `Default Stream`
          });
        }
      }
    }
  }

  // Sort qualities by resolution/bandwidth descending
  qualities.sort((a, b) => b.bandwidth - a.bandwidth);

  return {
    isMaster: qualities.length > 0,
    qualities,
    rawPlaylist: text
  };
}

export async function parseM3U8Segments(m3u8Url) {
  const response = await fetch(m3u8Url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - Could not fetch M3U8 segment playlist`);
  }
  const text = await response.text();
  const lines = text.split("\n");
  const segments = [];

  // If master playlist was passed directly, resolve highest quality variant
  if (text.includes("#EXT-X-STREAM-INF")) {
    const masterInfo = await parseMasterM3U8(m3u8Url);
    if (masterInfo.qualities.length > 0) {
      return parseM3U8Segments(masterInfo.qualities[0].url);
    }
  }

  for (let line of lines) {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      try {
        const segmentUrl = new URL(line, m3u8Url).href;
        segments.push(segmentUrl);
      } catch (e) {
        segments.push(line);
      }
    }
  }

  return segments;
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds === Infinity) return "--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// IDM Multi-Threaded Engine Class
export class IDMDownloader {
  constructor(m3u8Url, filename = "BFlix_Video.mp4", options = {}) {
    this.m3u8Url = m3u8Url;
    this.filename = filename.endsWith(".mp4") ? filename : `${filename}.mp4`;
    this.threadsCount = options.threadsCount || 8; // Default 8 parallel IDM connections
    this.onProgress = options.onProgress || null;

    this.segments = [];
    this.buffers = [];
    this.isPaused = false;
    this.isCancelled = false;
    this.downloadedCount = 0;
    this.totalBytesDownloaded = 0;
    this.startTime = 0;
    this.activeThreads = Array.from({ length: this.threadsCount }, (_, i) => ({
      id: i + 1,
      segmentIndex: null,
      status: "idle",
      bytesDownloaded: 0
    }));
  }

  pause() {
    this.isPaused = true;
    if (this.onProgress) {
      this.onProgress({ status: "paused", message: "Download Paused by user." });
    }
  }

  resume() {
    this.isPaused = false;
  }

  cancel() {
    this.isCancelled = true;
    this.isPaused = false;
    if (this.onProgress) {
      this.onProgress({ status: "cancelled", message: "Download Cancelled." });
    }
  }

  async start() {
    try {
      if (this.onProgress) {
        this.onProgress({ status: "parsing", message: "🔍 IDM Engine parsing M3U8 playlist..." });
      }

      this.segments = await parseM3U8Segments(this.m3u8Url);
      if (this.segments.length === 0) {
        throw new Error("No media segments found in M3U8 stream.");
      }

      this.buffers = new Array(this.segments.length);
      this.startTime = Date.now();
      let lastSpeedCheckTime = Date.now();
      let lastBytesCount = 0;
      let currentSpeed = 0; // Bytes per second

      let nextSegmentIndex = 0;

      if (this.onProgress) {
        this.onProgress({
          status: "downloading",
          message: `IDM Multi-threaded download started (${this.threadsCount} Connections)`,
          total: this.segments.length,
          current: 0,
          percent: 0,
          downloadedBytes: "0 B",
          speed: "0 KB/s",
          eta: "--:--",
          elapsed: "00:00",
          threadsCount: this.threadsCount,
          activeThreads: this.activeThreads
        });
      }

      // Worker function for parallel segment downloading
      const worker = async (threadId) => {
        const thread = this.activeThreads.find((t) => t.id === threadId);

        while (nextSegmentIndex < this.segments.length && !this.isCancelled) {
          // Pause handling
          while (this.isPaused && !this.isCancelled) {
            if (thread) thread.status = "paused";
            await delay(300);
          }

          if (this.isCancelled) break;

          // Pick next segment safely
          const index = nextSegmentIndex++;
          if (index >= this.segments.length) break;

          const segUrl = this.segments[index];
          if (thread) {
            thread.status = "downloading";
            thread.segmentIndex = index + 1;
          }

          // Fetch segment with retry logic
          let arrayBuffer = null;
          let retries = 0;
          const maxRetries = 5;

          while (retries < maxRetries && !this.isCancelled) {
            try {
              let res = await fetch(segUrl, { mode: "cors" });
              if (!res.ok) res = await fetch(segUrl);

              if (res.status === 429) {
                retries++;
                await delay(1000 * Math.pow(2, retries));
                continue;
              }

              if (!res.ok) throw new Error(`HTTP ${res.status}`);

              arrayBuffer = await res.arrayBuffer();
              break;
            } catch (err) {
              retries++;
              await delay(1000 * retries);
            }
          }

          if (!arrayBuffer && !this.isCancelled) {
            throw new Error(`Failed to download segment ${index + 1} after ${maxRetries} retries.`);
          }

          if (this.isCancelled) break;

          this.buffers[index] = arrayBuffer;
          this.downloadedCount++;
          this.totalBytesDownloaded += arrayBuffer.byteLength;

          // Calculate real-time IDM metrics (Speed & ETA)
          const now = Date.now();
          const timeDiffSec = (now - lastSpeedCheckTime) / 1000;
          if (timeDiffSec >= 0.5) {
            const bytesDiff = this.totalBytesDownloaded - lastBytesCount;
            currentSpeed = bytesDiff / timeDiffSec;
            lastSpeedCheckTime = now;
            lastBytesCount = this.totalBytesDownloaded;
          }

          const avgBytesPerSeg = this.totalBytesDownloaded / this.downloadedCount;
          const remainingSegments = this.segments.length - this.downloadedCount;
          const remainingBytesEstimate = remainingSegments * avgBytesPerSeg;
          const etaSeconds = currentSpeed > 0 ? remainingBytesEstimate / currentSpeed : 0;
          const elapsedSeconds = (now - this.startTime) / 1000;

          const percent = Math.round((this.downloadedCount / this.segments.length) * 100);

          if (this.onProgress) {
            this.onProgress({
              status: "downloading",
              message: `Downloading (${this.downloadedCount}/${this.segments.length} segments)`,
              total: this.segments.length,
              current: this.downloadedCount,
              percent,
              downloadedBytes: formatBytes(this.totalBytesDownloaded),
              speed: `${formatBytes(currentSpeed)}/s`,
              eta: formatTime(etaSeconds),
              elapsed: formatTime(elapsedSeconds),
              threadsCount: this.threadsCount,
              activeThreads: this.activeThreads
            });
          }
        }

        if (thread) {
          thread.status = "done";
          thread.segmentIndex = null;
        }
      };

      // Spawn parallel IDM download worker threads
      const workers = [];
      for (let i = 1; i <= this.threadsCount; i++) {
        workers.push(worker(i));
      }

      await Promise.all(workers);

      if (this.isCancelled) {
        return false;
      }

      if (this.onProgress) {
        this.onProgress({
          status: "converting",
          message: "⚡ IDM Engine combining segments into high quality MP4...",
          percent: 99
        });
      }

      // Combine array buffers into a single MP4 Blob
      const validBuffers = this.buffers.filter(Boolean);
      const blob = new Blob(validBuffers, { type: "video/mp4" });
      const blobUrl = URL.createObjectURL(blob);

      // Trigger Chrome download or browser download
      if (typeof chrome !== "undefined" && chrome.downloads) {
        chrome.downloads.download({
          url: blobUrl,
          filename: this.filename,
          saveAs: true
        });
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = this.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      if (this.onProgress) {
        this.onProgress({
          status: "complete",
          message: `✅ Download Complete! Saved ${this.filename} (${formatBytes(this.totalBytesDownloaded)})`,
          percent: 100,
          downloadedBytes: formatBytes(this.totalBytesDownloaded)
        });
      }

      return true;
    } catch (err) {
      if (this.onProgress) {
        this.onProgress({
          status: "error",
          message: `Download Failed: ${err.message}`
        });
      }
      throw err;
    }
  }
}

export function downloadM3u8AsMp4(m3u8Url, filename = "BFlix_Video.mp4", onProgress) {
  const downloader = new IDMDownloader(m3u8Url, filename, { onProgress, threadsCount: 8 });
  return downloader.start();
}

export function generateFFmpegCommand(m3u8Url, outputName = "movie.mp4") {
  const safeName = outputName.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `ffmpeg -i "${m3u8Url}" -c copy -bsf:a aac_adtstoasc "${safeName}.mp4"`;
}
