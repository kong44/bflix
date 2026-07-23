# BFLIX Stream Catcher & M3U8 to MP4 Converter Extension

A Chrome Manifest V3 Browser Extension that intercepts network video stream sources (`.m3u8`, `.mp4`, `.ts`) from streaming players and converts or downloads them to MP4 files.

---

## 🚀 How to Install in Chrome / Edge / Brave

1. Download or copy the files in this `/public/extension/` directory into a local folder on your computer (e.g. `BFlix-Extension`).
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `BFlix-Extension` folder containing `manifest.json`.
6. The extension **🎬 BFLIX Stream Catcher** is now active!

---

## ⚙️ Features & How M3U8 to MP4 Works

1. **Automatic Network Stream Catching**:
   - As soon as a movie plays in an iframe or player, the extension catches `.m3u8` master playlists and video stream URLs via `chrome.webRequest`.

2. **In-Browser M3U8 to MP4 Stitching**:
   - When you click **Convert to MP4**, the extension parses the `.m3u8` playlist, fetches all TS video segments, concatenates them in memory, and triggers a `.mp4` file download in your browser.

3. **FFmpeg Command Generator**:
   - For fast loss-free remuxing, click **Copy FFmpeg** to get a ready-to-use terminal command:
     ```bash
     ffmpeg -i "https://stream-url.m3u8" -c copy -bsf:a aac_adtstoasc "Movie.mp4"
     ```

4. **External Downloader Support**:
   - Copy raw stream URLs directly into IDM (Internet Download Manager), 1DM, or VLC.
