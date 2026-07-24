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
      // Ignore segment files, subtitle files, or encryption keys in main stream detector
      const cleanPath = url.split("?")[0].toLowerCase();
      if (
        cleanPath.endsWith(".ts") ||
        cleanPath.endsWith(".m4s") ||
        cleanPath.endsWith(".key") ||
        cleanPath.endsWith(".vtt") ||
        cleanPath.endsWith(".aac") ||
        cleanPath.endsWith(".jpg") ||
        cleanPath.endsWith(".png")
      ) {
        return;
      }

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

// Register Manifest V3 declarativeNetRequest dynamic rules for blocking ad & tracker network requests
if (typeof chrome !== "undefined" && chrome.declarativeNetRequest) {
  const rules = AD_TRACKER_DOMAINS.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: `*${domain}*`,
      resourceTypes: [
        "main_frame",
        "sub_frame",
        "stylesheet",
        "script",
        "image",
        "font",
        "object",
        "xmlhttprequest",
        "ping",
        "csp_report",
        "media",
        "websocket",
        "other"
      ]
    }
  }));

  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const removeRuleIds = existingRules.map((rule) => rule.id);
    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds: removeRuleIds,
        addRules: rules
      },
      () => {
        if (chrome.runtime.lastError) {
          console.warn("DeclarativeNetRequest rule registration:", chrome.runtime.lastError.message);
        } else {
          console.log(`🛡️ BFLIX Extension active with ${rules.length} Manifest V3 ad-blocking rules.`);
        }
      }
    );
  });
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
