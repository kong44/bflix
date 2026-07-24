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

// AD & TRACKER & POPUP REDIRECT BLOCKER
// Blocks known ad networks, trackers, popups, and redirect domains
const AD_TRACKER_DOMAINS = [
  "trips.com",
  "booking.com",
  "agoda.com",
  "popads",
  "adsterra",
  "propellerads",
  "exoclick",
  "juicyads",
  "popcash",
  "admaven",
  "monetag",
  "hilltopads",
  "doubleclick.net",
  "googlesyndication.com",
  "google-analytics.com",
  "adservice.google.com",
  "outbrain.com",
  "taboola.com",
  "mgid.com",
  "yandex.ru/metrika",
  "scorecardresearch.com",
  "adnxs.com",
  "criteo.com",
  "bet365",
  "1xbet",
  "casino",
  "affiliate",
  "onclick"
];

// Block outgoing network requests to known ad/tracker domains
if (chrome.webRequest && chrome.webRequest.onBeforeRequest) {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const url = details.url.toLowerCase();
      const isTrackerOrAd = AD_TRACKER_DOMAINS.some((domain) => url.includes(domain));
      if (isTrackerOrAd) {
        console.log("🛡️ Extension blocked ad/tracker request:", details.url);
        return { cancel: true };
      }
      return { cancel: false };
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
  );
}

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.openerTabId) {
    // Check if new tab is opened from an existing video player tab
    const url = (tab.pendingUrl || tab.url || "").toLowerCase();
    if (url) {
      const isAdDomain = AD_TRACKER_DOMAINS.some((kw) => url.includes(kw));
      if (isAdDomain) {
        console.log("🛡️ BFLIX Extension blocked ad redirect popup:", url);
        chrome.tabs.remove(tab.id);
      }
    }
  }
});

chrome.webNavigation?.onBeforeNavigate?.addListener((details) => {
  if (details.frameId === 0 && details.tabId > 0) {
    const url = (details.url || "").toLowerCase();
    const isAdDomain = AD_TRACKER_DOMAINS.some((kw) => url.includes(kw));
    if (isAdDomain) {
      console.log("🛡️ BFLIX Extension blocked navigation to ad redirect:", url);
      chrome.tabs.remove(details.tabId);
    }
  }
});
