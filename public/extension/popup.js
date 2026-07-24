import { IDMDownloader, parseMasterM3U8, generateFFmpegCommand } from "./m3u8-downloader.js";

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
            <p style="margin-top: 6px; font-size: 11px; color: #a1a1aa;">Play a movie or TV show in the player to catch video URLs (.m3u8 / .mp4).</p>
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
            <span>${isM3u8 ? "⚡ IDM HLS Stream (.m3u8)" : "📹 Direct Video (.mp4)"}</span>
            <span style="color: #8e8e93; font-weight: normal; font-size: 10px;">${stream.timestamp}</span>
          </div>
          <div class="stream-url" title="${stream.url}">${stream.url}</div>
          
          ${
            isM3u8
              ? `
            <div class="quality-row" id="quality-row-${idx}">
              <span class="quality-label">Quality:</span>
              <select class="quality-select" id="quality-select-${idx}">
                <option value="${stream.url}">Highest / Auto Quality</option>
              </select>
            </div>
          `
              : ""
          }

          <div class="btn-group">
            <button class="primary dl-btn" id="dl-btn-${idx}">
              ⚡ IDM Download MP4
            </button>
            <button class="ffmpeg-btn" id="ffmpeg-btn-${idx}">
              Copy FFmpeg
            </button>
            <button class="copy-btn" id="copy-btn-${idx}">
              Copy URL
            </button>
          </div>

          <!-- IDM Multi-Thread Downloader Dashboard -->
          <div class="idm-panel" id="idm-panel-${idx}">
            <div class="idm-header-status">
              <span id="idm-status-msg-${idx}">Initializing IDM Engine...</span>
              <span id="idm-status-percent-${idx}" style="font-family: monospace;">0%</span>
            </div>

            <div class="idm-progress-container">
              <div class="idm-progress-bar" id="idm-bar-${idx}"></div>
              <div class="idm-progress-text" id="idm-bar-text-${idx}">0%</div>
            </div>

            <div class="idm-stats-grid">
              <div class="idm-stat-item">
                <span class="idm-stat-label">Download Speed</span>
                <span class="idm-stat-val speed" id="idm-speed-${idx}">0 KB/s</span>
              </div>
              <div class="idm-stat-item">
                <span class="idm-stat-label">Downloaded</span>
                <span class="idm-stat-val" id="idm-downloaded-${idx}">0 B</span>
              </div>
              <div class="idm-stat-item">
                <span class="idm-stat-label">Time Remaining</span>
                <span class="idm-stat-val" id="idm-eta-${idx}">--:--</span>
              </div>
              <div class="idm-stat-item">
                <span class="idm-stat-label">Time Elapsed</span>
                <span class="idm-stat-val" id="idm-elapsed-${idx}">00:00</span>
              </div>
            </div>

            <div class="threads-title">
              <span>IDM Connections (8 Parallel Threads)</span>
              <span id="idm-threads-count-${idx}">8/8 Active</span>
            </div>

            <div class="threads-grid" id="threads-grid-${idx}">
              ${Array.from({ length: 8 })
                .map(
                  (_, tIdx) => `
                <div class="thread-box" id="thread-${idx}-${tIdx + 1}">
                  T${tIdx + 1}: Idle
                </div>
              `
                )
                .join("")}
            </div>

            <div class="idm-controls">
              <button class="secondary pause-btn" id="pause-btn-${idx}">
                ⏸ Pause
              </button>
              <button class="danger cancel-btn" id="cancel-btn-${idx}">
                ❌ Cancel
              </button>
            </div>
          </div>
        `;

        container.appendChild(card);

        // Fetch master playlist qualities if M3U8
        if (isM3u8) {
          parseMasterM3U8(stream.url)
            .then((masterInfo) => {
              if (masterInfo.isMaster && masterInfo.qualities.length > 0) {
                const selectEl = card.querySelector(`#quality-select-${idx}`);
                selectEl.innerHTML = "";
                masterInfo.qualities.forEach((q) => {
                  const opt = document.createElement("option");
                  opt.value = q.url;
                  opt.textContent = `${q.resolution} (${Math.round(q.bandwidth / 1000)} Kbps)`;
                  selectEl.appendChild(opt);
                });
              }
            })
            .catch(() => {
              // Standard stream URL
            });
        }

        // Downloader instance holder
        let currentDownloader = null;

        const dlBtn = card.querySelector(`#dl-btn-${idx}`);
        const idmPanel = card.querySelector(`#idm-panel-${idx}`);
        const statusMsg = card.querySelector(`#idm-status-msg-${idx}`);
        const statusPercent = card.querySelector(`#idm-status-percent-${idx}`);
        const bar = card.querySelector(`#idm-bar-${idx}`);
        const barText = card.querySelector(`#idm-bar-text-${idx}`);
        const speedVal = card.querySelector(`#idm-speed-${idx}`);
        const downloadedVal = card.querySelector(`#idm-downloaded-${idx}`);
        const etaVal = card.querySelector(`#idm-eta-${idx}`);
        const elapsedVal = card.querySelector(`#idm-elapsed-${idx}`);
        const pauseBtn = card.querySelector(`#pause-btn-${idx}`);
        const cancelBtn = card.querySelector(`#cancel-btn-${idx}`);

        // Download Click Listener
        dlBtn.addEventListener("click", async () => {
          let targetUrl = stream.url;
          if (isM3u8) {
            const selectEl = card.querySelector(`#quality-select-${idx}`);
            if (selectEl && selectEl.value) {
              targetUrl = selectEl.value;
            }
          }

          idmPanel.style.display = "block";
          dlBtn.disabled = true;

          if (!isM3u8) {
            // Direct MP4 Download
            chrome.downloads.download({ url: targetUrl, filename: "BFlix_Movie.mp4", saveAs: true });
            statusMsg.textContent = "✅ Download started!";
            bar.style.width = "100%";
            barText.textContent = "100%";
            return;
          }

          // Initialize IDM Downloader Engine
          currentDownloader = new IDMDownloader(targetUrl, "BFlix_Movie.mp4", {
            threadsCount: 8,
            onProgress: (info) => {
              if (info.message) statusMsg.textContent = info.message;
              if (info.percent !== undefined) {
                statusPercent.textContent = `${info.percent}%`;
                bar.style.width = `${info.percent}%`;
                barText.textContent = `${info.percent}%`;
              }
              if (info.speed) speedVal.textContent = info.speed;
              if (info.downloadedBytes) downloadedVal.textContent = info.downloadedBytes;
              if (info.eta) etaVal.textContent = info.eta;
              if (info.elapsed) elapsedVal.textContent = info.elapsed;

              // Render active thread boxes
              if (info.activeThreads) {
                info.activeThreads.forEach((t) => {
                  const tBox = card.querySelector(`#thread-${idx}-${t.id}`);
                  if (tBox) {
                    if (t.status === "downloading" && t.segmentIndex) {
                      tBox.className = "thread-box active";
                      tBox.textContent = `T${t.id}: #${t.segmentIndex}`;
                    } else if (t.status === "paused") {
                      tBox.className = "thread-box";
                      tBox.textContent = `T${t.id}: Pause`;
                    } else {
                      tBox.className = "thread-box";
                      tBox.textContent = `T${t.id}: Idle`;
                    }
                  }
                });
              }

              if (info.status === "complete") {
                dlBtn.disabled = false;
                pauseBtn.style.display = "none";
              } else if (info.status === "error" || info.status === "cancelled") {
                dlBtn.disabled = false;
              }
            }
          });

          try {
            await currentDownloader.start();
          } catch (err) {
            statusMsg.textContent = `Error: ${err.message}`;
            statusMsg.style.color = "#ef4444";
          } finally {
            dlBtn.disabled = false;
          }
        });

        // Pause / Resume listener
        pauseBtn.addEventListener("click", () => {
          if (!currentDownloader) return;
          if (currentDownloader.isPaused) {
            currentDownloader.resume();
            pauseBtn.textContent = "⏸ Pause";
            pauseBtn.className = "secondary pause-btn";
          } else {
            currentDownloader.pause();
            pauseBtn.textContent = "▶ Resume";
            pauseBtn.className = "primary pause-btn";
          }
        });

        // Cancel Listener
        cancelBtn.addEventListener("click", () => {
          if (currentDownloader) {
            currentDownloader.cancel();
          }
          idmPanel.style.display = "none";
          dlBtn.disabled = false;
        });

        // FFmpeg Command listener
        const ffmpegBtn = card.querySelector(`#ffmpeg-btn-${idx}`);
        ffmpegBtn.addEventListener("click", () => {
          let targetUrl = stream.url;
          if (isM3u8) {
            const selectEl = card.querySelector(`#quality-select-${idx}`);
            if (selectEl && selectEl.value) {
              targetUrl = selectEl.value;
            }
          }
          const cmd = generateFFmpegCommand(targetUrl, "BFlix_Movie");
          navigator.clipboard.writeText(cmd);
          ffmpegBtn.textContent = "Copied!";
          setTimeout(() => (ffmpegBtn.textContent = "Copy FFmpeg"), 2000);
        });

        // Copy Raw URL listener
        const copyBtn = card.querySelector(`#copy-btn-${idx}`);
        copyBtn.addEventListener("click", () => {
          let targetUrl = stream.url;
          if (isM3u8) {
            const selectEl = card.querySelector(`#quality-select-${idx}`);
            if (selectEl && selectEl.value) {
              targetUrl = selectEl.value;
            }
          }
          navigator.clipboard.writeText(targetUrl);
          copyBtn.textContent = "Copied!";
          setTimeout(() => (copyBtn.textContent = "Copy URL"), 2000);
        });
      });
    });
  });
});
