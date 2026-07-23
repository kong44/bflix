// BFLIX Stream Catcher Background Service Worker
// Listens for network requests containing video stream sources (.m3u8, .mp4, etc.)

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    
    // Filter for video streams
    if (
      url.includes(".m3u8") ||
      url.includes(".mp4") ||
      url.includes("/playlist/") ||
      url.includes("/manifest/") ||
      url.includes("/hls/")
    ) {
      // Ignore segment files in main stream detector
      if (url.includes(".ts") && !url.includes(".m3u8")) return;

      const tabId = details.tabId;
      if (tabId < 0) return;

      chrome.storage.local.get(["capturedStreams"], (result) => {
        const streams = result.capturedStreams || {};
        const tabStreams = streams[tabId] || [];

        // Avoid duplicate URLs
        if (!tabStreams.some((s) => s.url === url)) {
          const streamItem = {
            url: url,
            type: url.includes(".m3u8") ? "M3U8 HLS Playlist" : "MP4 Direct Video",
            isM3u8: url.includes(".m3u8"),
            timestamp: new Date().toLocaleTimeString(),
            pageUrl: details.initiator || ""
          };

          tabStreams.unshift(streamItem);
          streams[tabId] = tabStreams.slice(0, 15); // Keep last 15 streams

          chrome.storage.local.set({ capturedStreams: streams }, () => {
            // Update badge count on extension icon
            chrome.action.setBadgeText({
              tabId: tabId,
              text: String(tabStreams.length)
            });
            chrome.action.setBadgeBackgroundColor({
              tabId: tabId,
              color: "#E5A00D"
            });
          });
        }
      });
    }
  },
  { urls: ["<all_urls>"] }
);

// Clear streams when tab is reloaded or closed
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    chrome.storage.local.get(["capturedStreams"], (result) => {
      const streams = result.capturedStreams || {};
      delete streams[tabId];
      chrome.storage.local.set({ capturedStreams: streams });
      chrome.action.setBadgeText({ tabId: tabId, text: "" });
    });
  }
});
