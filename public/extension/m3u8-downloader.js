// IDM-Style High-Speed Multi-Threaded M3U8 HLS Downloader Engine

/**
 * Smart URL Resolver for HLS Playlist and Segment URLs
 * Prevents path duplication (e.g. /1080/1080/index.m3u8 -> 404)
 * and preserves query strings / token parameters from CDN base URLs.
 */
export function resolveUrl(line, baseUrl) {
  line = (line || "").trim();
  if (!line) return "";

  // 1. Protocol-relative URL (e.g. //i-cdn-0.kriss424did.com/stream2/...)
  if (line.startsWith("//")) {
    try {
      const baseObj = new URL(baseUrl);
      return baseObj.protocol + line;
    } catch (e) {
      return "https:" + line;
    }
  }

  // 2. Already absolute URL (http:// or https://)
  if (line.startsWith("http://") || line.startsWith("https://")) {
    return line;
  }

  try {
    const baseObj = new URL(baseUrl);

    // 3. Root-relative URL (starts with /)
    if (line.startsWith("/")) {
      const resolved = new URL(line, baseObj.origin);
      if (baseObj.search && !resolved.search) {
        resolved.search = baseObj.search;
      }
      return resolved.href;
    }

    // 4. Relative URL: Check for duplicate folder name prefix
    // (e.g. baseUrl = .../1080/index.m3u8 and line = 1080/index.m3u8 or 1080/0.ts)
    const pathSegments = baseObj.pathname.split("/").filter(Boolean);
    if (pathSegments.length >= 2) {
      const currentDir = pathSegments[pathSegments.length - 2];
      if (currentDir && (line.startsWith(currentDir + "/") || line === currentDir)) {
        const parentSegments = pathSegments.slice(0, pathSegments.length - 2);
        const parentPath = "/" + parentSegments.join("/") + (parentSegments.length ? "/" : "");
        const parentUrl = baseObj.origin + parentPath;
        const resolved = new URL(line, parentUrl);
        if (baseObj.search && !resolved.search) {
          resolved.search = baseObj.search;
        }
        return resolved.href;
      }
    }

    // 5. Standard relative URL resolution
    const resolved = new URL(line, baseUrl);
    if (baseObj.search && !resolved.search) {
      resolved.search = baseObj.search;
    }
    return resolved.href;
  } catch (e) {
    return line;
  }
}

export function parseMasterM3U8WithText(text, m3u8Url) {
  const lines = text.split("\n");
  const qualities = [];

  if (text.includes("#EXT-X-STREAM-INF")) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#EXT-X-STREAM-INF")) {
        let resolution = "Auto / Default";
        let bandwidth = 0;

        const resMatch = line.match(/RESOLUTION=(\d+x\d+)/i);
        if (resMatch) resolution = resMatch[1];

        const bwMatch = line.match(/BANDWIDTH=(\d+)/i);
        if (bwMatch) bandwidth = parseInt(bwMatch[1], 10);

        let j = i + 1;
        while (j < lines.length && (lines[j].trim().startsWith("#") || !lines[j].trim())) {
          j++;
        }
        if (lines[j]) {
          const variantUrl = resolveUrl(lines[j].trim(), m3u8Url);
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

  qualities.sort((a, b) => b.bandwidth - a.bandwidth);

  return {
    isMaster: qualities.length > 0,
    qualities,
    rawPlaylist: text
  };
}

export async function parseMasterM3U8(m3u8Url) {
  let response;
  try {
    response = await fetch(m3u8Url, { mode: "cors" });
    if (!response.ok) response = await fetch(m3u8Url);
  } catch (e) {
    response = await fetch(m3u8Url);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - Could not fetch M3U8 playlist`);
  }

  const text = await response.text();
  return parseMasterM3U8WithText(text, m3u8Url);
}

export async function parseM3U8Segments(m3u8Url, visitedUrls = new Set()) {
  if (visitedUrls.has(m3u8Url)) {
    throw new Error("Circular reference in M3U8 playlist structure.");
  }
  visitedUrls.add(m3u8Url);

  let response;
  try {
    response = await fetch(m3u8Url, { mode: "cors" });
    if (!response.ok) response = await fetch(m3u8Url);
  } catch (e) {
    response = await fetch(m3u8Url);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - Could not fetch M3U8 segment playlist (${m3u8Url})`);
  }

  const text = await response.text();
  const lines = text.split("\n");
  const segments = [];

  // Check if master playlist containing variant quality streams
  if (text.includes("#EXT-X-STREAM-INF")) {
    const masterInfo = parseMasterM3U8WithText(text, m3u8Url);
    if (masterInfo.qualities.length > 0) {
      for (const q of masterInfo.qualities) {
        if (q.url && !visitedUrls.has(q.url) && q.url !== m3u8Url) {
          try {
            const segs = await parseM3U8Segments(q.url, visitedUrls);
            if (segs && segs.length > 0) {
              return segs;
            }
          } catch (err) {
            console.warn(`Quality stream ${q.resolution} (${q.url}) failed, trying fallback:`, err);
          }
        }
      }
    }
  }

  for (let line of lines) {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const segUrl = resolveUrl(line, m3u8Url);
      if (segUrl) {
        segments.push(segUrl);
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
          const maxRetries = 4;

          while (retries < maxRetries && !this.isCancelled) {
            try {
              let res = await fetch(segUrl, { mode: "cors" });
              if (!res.ok) res = await fetch(segUrl);

              if (res.status === 429) {
                retries++;
                await delay(1000 * Math.pow(2, retries));
                continue;
              }

              if (!res.ok && res.status !== 404) {
                throw new Error(`HTTP ${res.status}`);
              }

              if (res.ok) {
                arrayBuffer = await res.arrayBuffer();
                break;
              } else if (res.status === 404) {
                // If single segment 404s after retry, log and break to avoid blocking entire download
                retries++;
                await delay(500 * retries);
              }
            } catch (err) {
              retries++;
              await delay(1000 * retries);
            }
          }

          if (!arrayBuffer && !this.isCancelled) {
            console.warn(`Segment ${index + 1} skipped or unavailable (${segUrl})`);
          }

          if (this.isCancelled) break;

          if (arrayBuffer) {
            this.buffers[index] = arrayBuffer;
            this.totalBytesDownloaded += arrayBuffer.byteLength;
          }

          this.downloadedCount++;

          // Calculate real-time IDM metrics (Speed & ETA)
          const now = Date.now();
          const timeDiffSec = (now - lastSpeedCheckTime) / 1000;
          if (timeDiffSec >= 0.5) {
            const bytesDiff = this.totalBytesDownloaded - lastBytesCount;
            currentSpeed = bytesDiff / timeDiffSec;
            lastSpeedCheckTime = now;
            lastBytesCount = this.totalBytesDownloaded;
          }

          const avgBytesPerSeg = this.downloadedCount > 0 ? this.totalBytesDownloaded / this.downloadedCount : 0;
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
      if (validBuffers.length === 0) {
        throw new Error("No segment data could be downloaded.");
      }

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
