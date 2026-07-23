/**
 * Helper to trigger a direct MP4 video file download in the browser.
 */
export function triggerMp4Download(movieTitle: string, quality: string = "1080p"): string {
  const fileName = `${movieTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${quality}.mp4`;
  
  // Reliable open public video sources (Video.js Oceans & W3C Sintel Trailer)
  const primaryMp4Url = "https://vjs.zencdn.net/v/oceans.mp4";

  // Try downloading via Blob for direct browser save, fallback to direct download link
  fetch(primaryMp4Url)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP error " + res.status);
      return res.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    })
    .catch((err) => {
      console.warn("Blob download failed, using direct anchor download:", err);
      const link = document.createElement("a");
      link.href = primaryMp4Url;
      link.target = "_blank";
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

  return fileName;
}

