import { PlaybackProgress } from "../types";

const STORAGE_KEY = "bflix_continue_watching";
const MAX_ITEMS = 20;

export function getContinueWatchingList(): PlaybackProgress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as PlaybackProgress[];
    if (!Array.isArray(list)) return [];
    // Sort descending by most recent updatedAt
    return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (err) {
    console.error("Failed to read continue watching from storage:", err);
    return [];
  }
}

export function getPlaybackProgress(id: string): PlaybackProgress | null {
  try {
    const list = getContinueWatchingList();
    return list.find((item) => item.id === id || item.tmdbId === id || item.imdbId === id) || null;
  } catch (err) {
    return null;
  }
}

export function savePlaybackProgress(progress: PlaybackProgress): void {
  try {
    const list = getContinueWatchingList();
    // Match by id or tmdbId
    const existingIndex = list.findIndex(
      (item) => item.id === progress.id || (progress.tmdbId && item.tmdbId === progress.tmdbId)
    );

    const updatedItem: PlaybackProgress = {
      ...progress,
      updatedAt: Date.now()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = updatedItem;
    } else {
      list.unshift(updatedItem);
    }

    // Limit to max items
    const trimmed = list.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error("Failed to save playback progress to storage:", err);
  }
}

export function removePlaybackProgress(id: string): void {
  try {
    const list = getContinueWatchingList();
    const filtered = list.filter(
      (item) => item.id !== id && item.tmdbId !== id && item.imdbId !== id
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error("Failed to remove playback progress:", err);
  }
}
