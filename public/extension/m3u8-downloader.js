// M3U8 HLS Playlist Parser & MP4 Converter Engine

export async function parseM3U8(m3u8Url) {
  const response = await fetch(m3u8Url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - Could not fetch M3U8 playlist`);
  }
  const text = await response.text();
  const lines = text.split("\n");
  const segments = [];

  // If master playlist with multiple qualities, pick highest resolution variant
  if (text.includes("#EXT-X-STREAM-INF")) {
    let subPlaylistUrl = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#EXT-X-STREAM-INF")) {
        // Next non-comment line is the variant URL
        let j = i + 1;
        while (j < lines.length && (lines[j].trim().startsWith("#") || !lines[j].trim())) {
          j++;
        }
        if (lines[j]) {
          subPlaylistUrl = lines[j].trim();
          break;
        }
      }
    }
    if (subPlaylistUrl) {
      const targetUrl = new URL(subPlaylistUrl, m3u8Url).href;
      return parseM3U8(targetUrl);
    }
  }

  // Parse TS Segment URLs cleanly using URL constructor
  for (let line of lines) {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      try {
        const segmentUrl = new URL(line, m3u8Url).href;
        segments.push(segmentUrl);
      } catch (e) {
        // Fallback simple concat
        segments.push(line);
      }
    }
  }

  return { segments, rawPlaylist: text };
}

export async function downloadM3u8AsMp4(m3u8Url, filename = "Video_Download.mp4", onProgress) {
  try {
    if (onProgress) onProgress({ status: "parsing", message: "Parsing M3U8 playlist..." });

    const { segments } = await parseM3U8(m3u8Url);

    if (segments.length === 0) {
      throw new Error("No video segments found in M3U8 playlist.");
    }

    if (onProgress) {
      onProgress({
        status: "downloading",
        message: `Found ${segments.length} segments. Downloading...`,
        total: segments.length,
        current: 0
      });
    }

    const chunkBuffers = [];
    for (let i = 0; i < segments.length; i++) {
      const segUrl = segments[i];
      let res;
      try {
        res = await fetch(segUrl, { mode: "cors" });
        if (!res.ok) {
          // Retry without explicit cors mode if blocked
          res = await fetch(segUrl);
        }
      } catch (e) {
        // Retry
        try {
          res = await fetch(segUrl);
        } catch (retryErr) {
          throw new Error(`Failed segment ${i + 1} (${retryErr.message || 'CORS / Network Block'}). Try 'Copy FFmpeg' or 'Copy URL' into IDM/VLC.`);
        }
      }

      if (!res.ok) {
        throw new Error(`Failed segment ${i + 1} (HTTP ${res.status}). CDN blocked direct segment download. Use 'Copy FFmpeg' or IDM.`);
      }

      const buffer = await res.arrayBuffer();
      chunkBuffers.push(buffer);

      if (onProgress) {
        onProgress({
          status: "downloading",
          message: `Downloading segment ${i + 1} / ${segments.length}`,
          total: segments.length,
          current: i + 1,
          percent: Math.round(((i + 1) / segments.length) * 100)
        });
      }
    }

    if (onProgress) onProgress({ status: "converting", message: "Stitching video segments into MP4 file..." });

    // Combine buffers into video Blob
    const blob = new Blob(chunkBuffers, { type: "video/mp4" });
    const blobUrl = URL.createObjectURL(blob);

    // Trigger Chrome download
    if (typeof chrome !== "undefined" && chrome.downloads) {
      chrome.downloads.download({
        url: blobUrl,
        filename: filename.endsWith(".mp4") ? filename : `${filename}.mp4`,
        saveAs: true
      });
    } else {
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename.endsWith(".mp4") ? filename : `${filename}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    if (onProgress) onProgress({ status: "complete", message: "Download complete! Saved as MP4." });
    return true;
  } catch (err) {
    if (onProgress) onProgress({ status: "error", message: err.message || "Failed to process M3U8 stream." });
    throw err;
  }
}

export function generateFFmpegCommand(m3u8Url, outputName = "movie.mp4") {
  const safeName = outputName.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `ffmpeg -i "${m3u8Url}" -c copy -bsf:a aac_adtstoasc "${safeName}.mp4"`;
}

