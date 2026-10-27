/**
 * Centralized Stream Providers Configuration
 * Single Source of Truth for Video Streaming Endpoints
 */

export interface StreamProvider {
  id: string;
  name: string;
  badge: string;
  getMovieUrl: (tmdbId: string, imdbId: string, fallbackId: string) => string;
  getTvUrl: (tmdbId: string, imdbId: string, fallbackId: string, season: number, episode: number) => string;
}

export const STREAM_PROVIDERS: StreamProvider[] = [
  {
    id: "vidsrc_me",
    name: "VidSrc.me",
    badge: "DEFAULT HD",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.me/embed/movie?tmdb=${tmdb || id}${imdb ? `&imdb=${imdb}` : ""}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${tmdb || id}&season=${s}&episode=${e}`
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    badge: "BACKUP",
    getMovieUrl: (tmdb, imdb, id) => `https://multiembed.mov/?video_id=${tmdb || id}&tmdb=1`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://multiembed.mov/?video_id=${tmdb || id}&tmdb=1&s=${s}&e=${e}`
  },
  {
    id: "vidsrc_cc",
    name: "VidSrc.cc",
    badge: "FAST 1080P",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.cc/v2/embed/movie/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.cc/v2/embed/tv/${tmdb || id}/${s}/${e}`
  },
  {
    id: "embed_su",
    name: "Embed.su",
    badge: "AUTO SUB",
    getMovieUrl: (tmdb, imdb, id) => `https://embed.su/embed/movie/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://embed.su/embed/tv/${tmdb || id}/${s}/${e}`
  },
  {
    id: "vidsrc_pro",
    name: "VidSrc Pro",
    badge: "4K HD",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.pro/embed/movie/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.pro/embed/tv/${tmdb || id}/${s}/${e}`
  },
  {
    id: "vidsrc_in",
    name: "VidSrc.in",
    badge: "SERVER 4",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.in/embed/movie/${tmdb || id || imdb}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.in/embed/tv/${tmdb || id || imdb}/${s}/${e}`
  },
  {
    id: "vidsrc_to",
    name: "VidSrc.to",
    badge: "SERVER 5",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.to/embed/movie/${tmdb || id || imdb}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.to/embed/tv/${tmdb || id || imdb}/${s}/${e}`
  },
  {
    id: "vidsrc_net",
    name: "VidSrc.net",
    badge: "SERVER 6",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.net/embed/movie/${tmdb || id || imdb}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.net/embed/tv/${tmdb || id || imdb}/${s}/${e}`
  },
  {
    id: "vidsrc_vip",
    name: "VidSrc.vip",
    badge: "SERVER 7",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.vip/embed/movie/${tmdb || id || imdb}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.vip/embed/tv/${tmdb || id || imdb}/${s}/${e}`
  },
  {
    id: "vidsrc_xyz",
    name: "VidSrc.xyz",
    badge: "SERVER 7",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.xyz/embed/movie/${tmdb || id || imdb}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.xyz/embed/tv/${tmdb || id || imdb}/${s}/${e}`
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    badge: "SERVER 8",
    getMovieUrl: (tmdb, imdb, id) => `https://player.autoembed.cc/embed/movie/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://player.autoembed.cc/embed/tv/${tmdb || id}/${s}/${e}`
  },
  {
    id: "vidsrc_icu",
    name: "VidSrc.icu",
    badge: "SERVER 9",
    getMovieUrl: (tmdb, imdb, id) => `https://vidsrc.icu/embed/movie/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://vidsrc.icu/embed/tv/${tmdb || id}/${s}/${e}`
  },
  {
    id: "two_embed",
    name: "2Embed",
    badge: "STABLE",
    getMovieUrl: (tmdb, imdb, id) => `https://www.2embed.cc/embed/${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://www.2embed.cc/embedtv/${tmdb || id}&s=${s}&e=${e}`
  },
  {
    id: "smashystream",
    name: "SmashyStream",
    badge: "ALT SERVER",
    getMovieUrl: (tmdb, imdb, id) => `https://embed.smashystream.com/playere.php?tmdb=${tmdb || id}`,
    getTvUrl: (tmdb, imdb, id, s, e) => `https://embed.smashystream.com/playere.php?tmdb=${tmdb || id}&season=${s}&episode=${e}`
  }
];

const STORAGE_SERVER_KEY = "bflix_stream_server";

export function getSavedProviderIndex(): number {
  try {
    const saved = localStorage.getItem(STORAGE_SERVER_KEY);
    if (saved) {
      const idx = STREAM_PROVIDERS.findIndex((p) => p.id === saved);
      if (idx >= 0) return idx;
    }
  } catch (e) {}
  return 0; // Default to VidSrc.me
}

export function saveProviderPreference(providerId: string): void {
  try {
    localStorage.setItem(STORAGE_SERVER_KEY, providerId);
  } catch (e) {
    console.warn("Failed to persist stream server preference:", e);
  }
}
