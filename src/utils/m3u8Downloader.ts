/**
 * In-Browser Multi-Threaded M3U8 HLS to MP4 Downloader Engine
 * Fetches HLS video segments in parallel, concatenates chunks in memory,
 * and triggers a native browser file download.
 */

export interface StreamQuality {
  resolution: string;
  bandwidth: number;
  url: string;
  label: string;
}

export interface DownloadProgressInfo {
  status: "idle" | "parsing" | "downloading" | "stitching" | "complete" | "paused" | "cancelled" | "error";
  message: string;
  total?: number;
  current?: number;
  percent?: number;
  downloadedBytes?: string;
  speed?: string;
  eta?: string;
  elapsed?: string;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return "--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * Smart URL resolver for HLS playlists and segments.
 */
export function resolveUrl(line: string, baseUrl: string): string {
  line = (line || "").trim();
  if (!line) return "";

  if (line.startsWith("//")) {
    try {
      const baseObj = new URL(baseUrl);
      return baseObj.protocol + line;
    } catch (e) {
      return "https:" + line;
    }
  }

  if (line.startsWith("http://") || line.startsWith("https://")) {
    return line;
  }

  try {
    const baseObj = new URL(baseUrl);

    if (line.startsWith("/")) {
      const resolved = new URL(line, baseObj.origin);
      if (baseObj.search && !resolved.search) {
        resolved.search = baseObj.search;
      }
      return resolved.href;
    }

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

    const resolved = new URL(line, baseUrl);
    if (baseObj.search && !resolved.search) {
      resolved.search = baseObj.search;
    }
    return resolved.href;
  } catch (e) {
    return line;
  }
}

/**
 * Parses Master M3U8 text into quality variants (1080p, 720p, 480p).
 */
export function parseMasterM3U8WithText(text: string, m3u8Url: string): StreamQuality[] {
  const lines = text.split("\n");
  const qualities: StreamQuality[] = [];

  if (text.includes("#EXT-X-STREAM-INF")) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#EXT-X-STREAM-INF")) {
        let resolution = "Auto / 1080p";
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
            label: resolution !== "Auto / 1080p" 
              ? `${resolution} (${Math.round(bandwidth / 1000)} Kbps)`
              : `1080p Full HD`
          });
        }
      }
    }
  }

  // Sort descending by resolution/bandwidth
  qualities.sort((a, b) => b.bandwidth - a.bandwidth);
  return qualities;
}

/**
 * Fetch and extract all media segment URLs (.ts / .m4s).
 */
export async function parseM3U8Segments(m3u8Url: string, depth: number = 0): Promise<string[]> {
  if (depth > 5) return [];

  let res: Response;
  try {
    res = await fetch(m3u8Url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    // Retry via CORS proxies
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(m3u8Url)}`,
      `https://corsproxy.io/?${encodeURIComponent(m3u8Url)}`
    ];
    let content = "";
    for (const proxy of proxies) {
      try {
        const proxyRes = await fetch(proxy);
        if (proxyRes.ok) {
          content = await proxyRes.text();
          if (content.length > 50) break;
        }
      } catch (e) {
        // try next
      }
    }
    if (!content) throw new Error("Could not fetch M3U8 stream playlist.");
    return parseSegmentsFromText(content, m3u8Url, depth);
  }

  const text = await res.text();
  return parseSegmentsFromText(text, m3u8Url, depth);
}

async function parseSegmentsFromText(text: string, m3u8Url: string, depth: number): Promise<string[]> {
  const lines = text.split("\n");

  // If this is a master playlist, pick the best quality variant
  if (text.includes("#EXT-X-STREAM-INF")) {
    const qualities = parseMasterM3U8WithText(text, m3u8Url);
    if (qualities.length > 0) {
      return parseM3U8Segments(qualities[0].url, depth + 1);
    }
  }

  const segments: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const fullUrl = resolveUrl(line, m3u8Url);
    if (fullUrl) {
      segments.push(fullUrl);
    }
  }

  return segments;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * In-Browser Multi-Threaded Downloader Class
 */
export class WebM3u8Downloader {
  private m3u8Url: string;
  private filename: string;
  private threadsCount: number;
  private onProgress?: (info: DownloadProgressInfo) => void;

  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private segments: string[] = [];
  private buffers: ArrayBuffer[] = [];
  private downloadedCount: number = 0;
  private totalBytesDownloaded: number = 0;
  private startTime: number = 0;

  constructor(
    m3u8Url: string,
    filename: string = "Movie.mp4",
    options?: {
      threadsCount?: number;
      onProgress?: (info: DownloadProgressInfo) => void;
    }
  ) {
    this.m3u8Url = m3u8Url;
    this.filename = filename.toLowerCase().endsWith(".mp4") ? filename : `${filename}.mp4`;
    this.threadsCount = options?.threadsCount || 8;
    this.onProgress = options?.onProgress;
  }

  pause() {
    this.isPaused = true;
    this.report({ status: "paused", message: "Download paused." });
  }

  resume() {
    this.isPaused = false;
    this.report({ status: "downloading", message: "Resuming download..." });
  }

  cancel() {
    this.isCancelled = true;
    this.isPaused = false;
    this.buffers = [];
    this.report({ status: "cancelled", message: "Download cancelled." });
  }

  private report(info: DownloadProgressInfo) {
    if (this.onProgress) {
      this.onProgress(info);
    }
  }

  async start(): Promise<boolean> {
    try {
      this.report({ status: "parsing", message: "🔍 Parsing M3U8 video stream chunks..." });

      this.segments = await parseM3U8Segments(this.m3u8Url);
      if (this.segments.length === 0) {
        throw new Error("No media video chunks discovered in stream playlist.");
      }

      this.buffers = new Array(this.segments.length);
      this.startTime = Date.now();
      let lastSpeedCheckTime = Date.now();
      let lastBytesCount = 0;
      let currentSpeed = 0;
      let nextSegmentIndex = 0;

      this.report({
        status: "downloading",
        message: `Starting download (${this.segments.length} video chunks)`,
        total: this.segments.length,
        current: 0,
        percent: 0,
        downloadedBytes: "0 B",
        speed: "0 KB/s",
        eta: "--:--",
        elapsed: "00:00"
      });

      // Worker thread function
      const worker = async () => {
        while (nextSegmentIndex < this.segments.length && !this.isCancelled) {
          while (this.isPaused && !this.isCancelled) {
            await delay(300);
          }
          if (this.isCancelled) break;

          const index = nextSegmentIndex++;
          if (index >= this.segments.length) break;

          const segUrl = this.segments[index];
          let arrayBuffer: ArrayBuffer | null = null;
          let retries = 0;
          const maxRetries = 3;

          while (retries < maxRetries && !this.isCancelled) {
            try {
              let res = await fetch(segUrl, { mode: "cors" });
              if (!res.ok) res = await fetch(segUrl);

              if (res.status === 429) {
                retries++;
                await delay(800 * Math.pow(2, retries));
                continue;
              }

              if (res.ok) {
                arrayBuffer = await res.arrayBuffer();
                break;
              } else {
                retries++;
                await delay(400 * retries);
              }
            } catch (err) {
              retries++;
              await delay(600 * retries);
            }
          }

          if (this.isCancelled) break;

          if (arrayBuffer) {
            this.buffers[index] = arrayBuffer;
            this.totalBytesDownloaded += arrayBuffer.byteLength;
          }

          this.downloadedCount++;

          // Speed & ETA
          const now = Date.now();
          if (now - lastSpeedCheckTime >= 1000) {
            const timeDiff = (now - lastSpeedCheckTime) / 1000;
            const bytesDiff = this.totalBytesDownloaded - lastBytesCount;
            currentSpeed = bytesDiff / timeDiff;
            lastBytesCount = this.totalBytesDownloaded;
            lastSpeedCheckTime = now;
          }

          const avgBytesPerSeg = this.downloadedCount > 0 ? this.totalBytesDownloaded / this.downloadedCount : 0;
          const remainingSegments = this.segments.length - this.downloadedCount;
          const estRemainingBytes = remainingSegments * avgBytesPerSeg;
          const etaSeconds = currentSpeed > 0 ? Math.round(estRemainingBytes / currentSpeed) : 0;
          const elapsedSeconds = Math.round((now - this.startTime) / 1000);
          const percent = Math.min(99, Math.round((this.downloadedCount / this.segments.length) * 100));

          this.report({
            status: "downloading",
            message: `Downloading video (${this.downloadedCount}/${this.segments.length} chunks)`,
            total: this.segments.length,
            current: this.downloadedCount,
            percent,
            downloadedBytes: formatBytes(this.totalBytesDownloaded),
            speed: `${formatBytes(currentSpeed)}/s`,
            eta: formatDuration(etaSeconds),
            elapsed: formatDuration(elapsedSeconds)
          });
        }
      };

      // Spawn parallel download threads
      const workers: Promise<void>[] = [];
      const actualThreads = Math.min(this.threadsCount, this.segments.length);
      for (let i = 0; i < actualThreads; i++) {
        workers.push(worker());
      }

      await Promise.all(workers);

      if (this.isCancelled) {
        return false;
      }

      // Filter and assemble valid buffers
      const validBuffers = this.buffers.filter(Boolean);
      if (validBuffers.length === 0) {
        throw new Error("Could not download video segments (CORS or network timeout).");
      }

      this.report({
        status: "stitching",
        message: "⚡ Stitching video chunks into MP4...",
        percent: 99
      });

      await delay(200);

      // Determine mime type from header: MPEG-TS starts with 0x47
      const firstByte = validBuffers[0] && validBuffers[0].byteLength > 0 
        ? new Uint8Array(validBuffers[0])[0] 
        : 0;
      const mimeType = firstByte === 0x47 ? "video/mp2t" : "video/mp4";

      const blob = new Blob(validBuffers, { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      // Trigger native browser download
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = this.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

      this.report({
        status: "complete",
        message: `✅ Download Complete! Saved ${this.filename} (${formatBytes(this.totalBytesDownloaded)})`,
        percent: 100,
        downloadedBytes: formatBytes(this.totalBytesDownloaded)
      });

      return true;
    } catch (err: any) {
      if (!this.isCancelled) {
        this.report({
          status: "error",
          message: `Download failed: ${err?.message || "Stream network error"}`
        });
      }
      throw err;
    }
  }
}

/**
 * Generate Lossless Terminal FFmpeg Remux Command
 */
export function generateFFmpegCommand(m3u8Url: string, movieTitle: string): string {
  const safeName = movieTitle.replace(/[^a-zA-Z0-9_\-]/g, "_");
  return `ffmpeg -i "${m3u8Url}" -c copy -bsf:a aac_adtstoasc "${safeName}.mp4"`;
}
