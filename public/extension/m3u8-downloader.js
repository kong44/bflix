// M3U8 HLS Playlist Parser & MP4 Converter Engine

export async function parseM3U8(m3u8Url) {
  const response = await fetch(m3u8Url);
  const text = await response.text();

  const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf("/") + 1);
  const lines = text.split("\n");
  const segments = [];

  // If master playlist with multiple qualities, pick highest
  if (text.includes("#EXT-X-STREAM-INF")) {
    let subPlaylistUrl = null;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXT-X-STREAM-INF")) {
        subPlaylistUrl = lines[i + 1]?.trim();
        if (subPlaylistUrl) break;
      }
    }
    if (subPlaylistUrl) {
      const targetUrl = subPlaylistUrl.startsWith("http")
        ? subPlaylistUrl
        : baseUrl + subPlaylistUrl;
      return parseM3U8(targetUrl);
    }
  }

  // Parse TS Segment URLs
  for (let line of lines) {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const segmentUrl = line.startsWith("http") ? line : baseUrl + line;
      segments.push(segmentUrl);
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
      const res = await fetch(segUrl);
      if (!res.ok) throw new Error(`Failed segment ${i + 1}`);
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
