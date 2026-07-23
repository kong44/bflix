import { downloadM3u8AsMp4, generateFFmpegCommand } from "./m3u8-downloader.js";

document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const activeTabId = tabs[0].id;

    chrome.storage.local.get(["capturedStreams"], (result) => {
      const allStreams = result.capturedStreams || {};
      const tabStreams = allStreams[activeTabId] || [];

      const container = document.getElementById("streams-container");

      if (tabStreams.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <p>🔍 No video stream caught yet on this page.</p>
            <p style="margin-top: 6px; font-size: 11px;">Play a video stream in the web player to capture .m3u8 / .mp4 URLs.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = "";

      tabStreams.forEach((stream, idx) => {
        const card = document.createElement("div");
        card.className = "stream-card";

        const isM3u8 = stream.isM3u8;

        card.innerHTML = `
          <div class="stream-type">
            <span>${isM3u8 ? "⚡ HLS Stream (.m3u8)" : "📹 Direct Video (.mp4)"}</span>
            <span style="color: #8e8e93; font-weight: normal; font-size: 10px;">${stream.timestamp}</span>
          </div>
          <div class="stream-url" title="${stream.url}">${stream.url}</div>
          <div class="btn-group">
            <button class="primary dl-btn" data-url="${stream.url}" data-ism3u8="${isM3u8}">
              ${isM3u8 ? "Convert to MP4" : "Download MP4"}
            </button>
            <button class="ffmpeg-btn" data-url="${stream.url}">
              Copy FFmpeg
            </button>
            <button class="copy-btn" data-url="${stream.url}">
              Copy URL
            </button>
          </div>
          <div class="progress-box" id="progress-${idx}">
            <div class="status-txt" style="color: #f5c518;">Starting...</div>
            <div class="progress-bar" id="bar-${idx}"></div>
          </div>
        `;

        container.appendChild(card);

        // Download / Convert MP4 click listener
        const dlBtn = card.querySelector(".dl-btn");
        dlBtn.addEventListener("click", async () => {
          const url = dlBtn.getAttribute("data-url");
          const progressBox = card.querySelector(`#progress-${idx}`);
          const statusTxt = progressBox.querySelector(".status-txt");
          const progressBar = progressBox.querySelector(`#bar-${idx}`);

          progressBox.style.display = "block";
          dlBtn.disabled = true;

          if (!isM3u8) {
            // Direct MP4 link
            chrome.downloads.download({ url: url, filename: "Bflix_Movie.mp4", saveAs: true });
            statusTxt.textContent = "Download started!";
            progressBar.style.width = "100%";
            return;
          }

          try {
            await downloadM3u8AsMp4(url, "Bflix_Movie.mp4", (info) => {
              statusTxt.textContent = info.message;
              if (info.percent !== undefined) {
                progressBar.style.width = `${info.percent}%`;
              }
            });
          } catch (err) {
            statusTxt.textContent = `Error: ${err.message}`;
            statusTxt.style.color = "#ef4444";
          } finally {
            dlBtn.disabled = false;
          }
        });

        // FFmpeg Command listener
        const ffmpegBtn = card.querySelector(".ffmpeg-btn");
        ffmpegBtn.addEventListener("click", () => {
          const url = ffmpegBtn.getAttribute("data-url");
          const cmd = generateFFmpegCommand(url, "BFlix_Movie");
          navigator.clipboard.writeText(cmd);
          ffmpegBtn.textContent = "Copied FFmpeg!";
          setTimeout(() => (ffmpegBtn.textContent = "Copy FFmpeg"), 2000);
        });

        // Copy Raw URL listener
        const copyBtn = card.querySelector(".copy-btn");
        copyBtn.addEventListener("click", () => {
          const url = copyBtn.getAttribute("data-url");
          navigator.clipboard.writeText(url);
          copyBtn.textContent = "Copied!";
          setTimeout(() => (copyBtn.textContent = "Copy URL"), 2000);
        });
      });
    });
  });
});
