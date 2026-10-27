/**
 * Advanced Resilient API Client
 * - In-flight Promise Coalescing (Request Deduplication)
 * - LRU In-Memory Cache with TTL
 * - SessionStorage Multi-Tier Persistence for 0ms Back Navigation
 * - AbortSignal Cancellation Support
 * - Concurrency Queue (prevents network / CPU saturation)
 * - Exponential Jitter Backoff for 429 & Transient Network Glitches
 */

export interface CacheEntry<T> {
  timestamp: number;
  data: T;
  key: string;
}

export interface RequestOptions {
  signal?: AbortSignal;
  ttlMs?: number; // Cache duration in milliseconds (default: 5 mins)
  persistSession?: boolean; // Store in sessionStorage for instant return across routes
  retries?: number; // Automatic retry count on 429 / 5xx (default: 1)
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 150; // Cap cache entries to prevent memory bloat
const MAX_CONCURRENT_REQUESTS = 4; // Max concurrent outgoing HTTP requests

// In-Memory LRU Cache
class LruCache<T> {
  private map = new Map<string, CacheEntry<T>>();
  private maxEntries: number;

  constructor(maxEntries = MAX_CACHE_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  get(key: string, ttlMs: number): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;

    // Check expiration
    if (Date.now() - entry.timestamp > ttlMs) {
      this.map.delete(key);
      return undefined;
    }

    // Refresh LRU position by re-inserting
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.data;
  }

  set(key: string, data: T): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      // Evict oldest entry (first item in map iterator)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey) this.map.delete(oldestKey);
    }
    this.map.set(key, { timestamp: Date.now(), data, key });
  }

  clear(): void {
    this.map.clear();
  }
}

// Global LRU cache instance
const memoryCache = new LruCache<any>();

// In-Flight Request Deduplication Map
const inFlightRequests = new Map<string, Promise<any>>();

// Concurrency Queue to prevent hammering TMDB
class RequestQueue {
  private activeCount = 0;
  private queue: (() => void)[] = [];

  async acquire(): Promise<void> {
    if (this.activeCount < MAX_CONCURRENT_REQUESTS) {
      this.activeCount++;
      return;
    }
    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
    this.activeCount++;
  }

  release(): void {
    this.activeCount--;
    const next = this.queue.shift();
    if (next) next();
  }
}

const requestQueue = new RequestQueue();

// Helper to safely read from SessionStorage
function readSessionCache<T>(key: string, ttlMs: number): T | undefined {
  try {
    const raw = sessionStorage.getItem(`bflix_api_${key}`);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.timestamp > ttlMs) {
      sessionStorage.removeItem(`bflix_api_${key}`);
      return undefined;
    }
    return entry.data;
  } catch (e) {
    return undefined;
  }
}

// Helper to safely write to SessionStorage
function writeSessionCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { timestamp: Date.now(), data, key };
    sessionStorage.setItem(`bflix_api_${key}`, JSON.stringify(entry));
  } catch (e) {
    // Ignore quota exceeded errors
  }
}

// Sleep with jitter helper
function waitWithJitter(baseMs: number): Promise<void> {
  const jitter = Math.random() * 200;
  return new Promise((resolve) => setTimeout(resolve, baseMs + jitter));
}

/**
 * Perform a cached, deduplicated, resilient JSON fetch
 */
export async function cachedFetchJson<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    signal,
    ttlMs = DEFAULT_TTL,
    persistSession = false,
    retries = 1
  } = options;

  // 1. Check in-memory LRU Cache (Fastest: 0ms)
  const cachedMem = memoryCache.get(url, ttlMs);
  if (cachedMem !== undefined) {
    return cachedMem as T;
  }

  // 2. Check SessionStorage Cache (Fast: <1ms across routes/tabs)
  if (persistSession) {
    const cachedSession = readSessionCache<T>(url, ttlMs);
    if (cachedSession !== undefined) {
      memoryCache.set(url, cachedSession);
      return cachedSession;
    }
  }

  // 3. In-Flight Request Deduplication
  // If an identical URL is already being fetched, join its promise instead of sending another HTTP request!
  const inFlight = inFlightRequests.get(url);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  // 4. Dispatch new network request through concurrency queue with retry logic
  const requestPromise = (async () => {
    let attempt = 0;
    while (attempt <= retries) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      await requestQueue.acquire();
      try {
        const response = await fetch(url, { signal });

        if (response.status === 429 && attempt < retries) {
          // Rate-limited by TMDB: wait with backoff and retry
          requestQueue.release();
          attempt++;
          await waitWithJitter(600 * attempt);
          continue;
        }

        if (!response.ok) {
          throw new Error(`API error ${response.status}: ${response.statusText}`);
        }

        const data: T = await response.json();

        // Save into cache
        memoryCache.set(url, data);
        if (persistSession) {
          writeSessionCache(url, data);
        }

        return data;
      } catch (err: any) {
        if (err.name === "AbortError") {
          throw err;
        }
        if (attempt < retries) {
          attempt++;
          await waitWithJitter(400 * attempt);
          continue;
        }
        throw err;
      } finally {
        requestQueue.release();
      }
    }
    throw new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
  })();

  // Store in-flight promise
  inFlightRequests.set(url, requestPromise);

  try {
    return await requestPromise;
  } finally {
    // Clean up in-flight tracker once settled
    inFlightRequests.delete(url);
  }
}
