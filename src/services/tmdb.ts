import { Movie, MovieDetail, MediaType, TvEpisode, TvSeasonDetail } from "../types";

// TMDB API Configuration
const env = (import.meta as any).env || {};
const TMDB_API_KEY = env.TMDB_API_KEY || env.VITE_TMDB_API_KEY || "15d2fb6030da5f74303f47bf9d0e0a7e";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";

// In-Memory Request Cache with 5-minute TTL
interface CacheEntry<T> {
  timestamp: number;
  data: T;
}
const CACHE_TTL = 5 * 60 * 1000;
const requestCache = new Map<string, CacheEntry<any>>();

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = requestCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  const data = await res.json();
  requestCache.set(url, { timestamp: Date.now(), data });
  return data;
}

// TMDB Movie Genre Mapping
export const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

// TMDB TV Genre Mapping
export const TV_GENRE_MAP: Record<number, string> = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western"
};

// Synchronous Fast Transformer for Movies
export function syncTransformTmdbMovie(item: any): Movie {
  const year = item.release_date ? item.release_date.split("-")[0] : "N/A";
  const genres = item.genre_ids
    ? item.genre_ids.map((gid: number) => GENRE_MAP[gid]).filter(Boolean)
    : item.genres
    ? item.genres.map((g: any) => g.name)
    : ["Cinema"];

  const poster = item.poster_path
    ? `${IMAGE_BASE_URL}${item.poster_path}`
    : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80&auto=format&fit=crop";

  const backdrop = item.backdrop_path
    ? `${BACKDROP_BASE_URL}${item.backdrop_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80&auto=format&fit=crop";

  const rating = item.vote_average ? item.vote_average.toFixed(1) : "8.0";
  const votes = item.vote_count ? `${(item.vote_count / 1000).toFixed(1)}K` : "100K";
  const tmdbId = String(item.tmdb_id || item.id || "");
  const imdbId = item.imdb_id || item.external_ids?.imdb_id || "";

  return {
    id: imdbId || tmdbId,
    tmdbId,
    imdbId,
    title: item.title || item.original_title || "Untitled Movie",
    year,
    runtime: item.runtime ? `${item.runtime} min` : "120 min",
    genres: genres.length > 0 ? genres : ["Drama", "Feature"],
    director: item.director || "Renowned Director",
    actors: item.actors || ["Lead Cast", "Co-Star"],
    plot: item.overview || "An exceptional cinematic experience featuring compelling performances and stunning direction.",
    imdbRating: rating,
    imdbVotes: votes,
    poster,
    backdrop,
    tagline: item.tagline || "",
    awards: item.vote_average >= 8 ? "TMDB Top Rated Masterpiece" : "Highly Acclaimed Audience Pick",
    mediaType: "movie"
  };
}

// Synchronous Fast Transformer for TV Shows
export function syncTransformTmdbTvShow(item: any): Movie {
  const year = item.first_air_date ? item.first_air_date.split("-")[0] : "N/A";
  const genres = item.genre_ids
    ? item.genre_ids.map((gid: number) => TV_GENRE_MAP[gid] || GENRE_MAP[gid]).filter(Boolean)
    : item.genres
    ? item.genres.map((g: any) => g.name)
    : ["TV Series"];

  const poster = item.poster_path
    ? `${IMAGE_BASE_URL}${item.poster_path}`
    : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80&auto=format&fit=crop";

  const backdrop = item.backdrop_path
    ? `${BACKDROP_BASE_URL}${item.backdrop_path}`
    : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80&auto=format&fit=crop";

  const rating = item.vote_average ? item.vote_average.toFixed(1) : "8.0";
  const votes = item.vote_count ? `${(item.vote_count / 1000).toFixed(1)}K` : "50K";
  const tmdbId = String(item.tmdb_id || item.id || "");
  const imdbId = item.imdb_id || item.external_ids?.imdb_id || "";

  return {
    id: imdbId || tmdbId,
    tmdbId,
    imdbId,
    title: item.name || item.original_name || "Untitled Series",
    year,
    runtime: item.episode_run_time?.[0]
      ? `${item.episode_run_time[0]} min`
      : item.number_of_seasons
      ? `${item.number_of_seasons} Seasons`
      : "TV Series",
    genres: genres.length > 0 ? genres : ["TV Series"],
    director: item.created_by?.[0]?.name || "Series Creator",
    actors: item.actors || ["Main Cast"],
    plot: item.overview || "An exceptional series featuring compelling character arcs and stunning direction.",
    imdbRating: rating,
    imdbVotes: votes,
    poster,
    backdrop,
    tagline: item.tagline || "",
    awards: item.vote_average >= 8 ? "Critically Acclaimed Series" : "Popular Television Series",
    mediaType: "tv",
    totalSeasons: item.number_of_seasons || 1,
    totalEpisodes: item.number_of_episodes || 1
  };
}

// Backwards-compatible async wrapper
export async function transformTmdbMovie(item: any): Promise<Movie> {
  return syncTransformTmdbMovie(item);
}

export interface CategoryOption {
  id: string;
  name: string;
  tmdbEndpoint?: string;
  genreId?: number;
  mediaType?: MediaType;
}

export const MOVIE_CATEGORIES: CategoryOption[] = [
  { id: "trending", name: "Trending", tmdbEndpoint: "/trending/movie/week", mediaType: "movie" },
  { id: "popular", name: "Popular", tmdbEndpoint: "/movie/popular", mediaType: "movie" },
  { id: "top_rated", name: "Top Rated", tmdbEndpoint: "/movie/top_rated", mediaType: "movie" },
  { id: "now_playing", name: "Now Playing", tmdbEndpoint: "/movie/now_playing", mediaType: "movie" },
  { id: "upcoming", name: "Upcoming", tmdbEndpoint: "/movie/upcoming", mediaType: "movie" },
  { id: "action", name: "Action", genreId: 28, mediaType: "movie" },
  { id: "sci-fi", name: "Sci-Fi", genreId: 878, mediaType: "movie" },
  { id: "comedy", name: "Comedy", genreId: 35, mediaType: "movie" },
  { id: "drama", name: "Drama", genreId: 18, mediaType: "movie" },
  { id: "horror", name: "Horror", genreId: 27, mediaType: "movie" },
  { id: "animation", name: "Animation", genreId: 16, mediaType: "movie" },
  { id: "thriller", name: "Thriller", genreId: 53, mediaType: "movie" },
  { id: "adventure", name: "Adventure", genreId: 12, mediaType: "movie" },
  { id: "romance", name: "Romance", genreId: 10749, mediaType: "movie" },
  { id: "crime", name: "Crime", genreId: 80, mediaType: "movie" },
  { id: "fantasy", name: "Fantasy", genreId: 14, mediaType: "movie" },
  { id: "mystery", name: "Mystery", genreId: 9648, mediaType: "movie" }
];

export const TV_CATEGORIES: CategoryOption[] = [
  { id: "trending_tv", name: "Trending Series", tmdbEndpoint: "/trending/tv/week", mediaType: "tv" },
  { id: "popular_tv", name: "Popular Shows", tmdbEndpoint: "/tv/popular", mediaType: "tv" },
  { id: "top_rated_tv", name: "Top Rated Series", tmdbEndpoint: "/tv/top_rated", mediaType: "tv" },
  { id: "on_the_air", name: "Currently Airing", tmdbEndpoint: "/tv/on_the_air", mediaType: "tv" },
  { id: "action_adventure_tv", name: "Action & Adventure", genreId: 10759, mediaType: "tv" },
  { id: "animation_tv", name: "Anime & Animation", genreId: 16, mediaType: "tv" },
  { id: "scifi_fantasy_tv", name: "Sci-Fi & Fantasy", genreId: 10765, mediaType: "tv" },
  { id: "comedy_tv", name: "Comedy Series", genreId: 35, mediaType: "tv" },
  { id: "drama_tv", name: "Drama Series", genreId: 18, mediaType: "tv" },
  { id: "crime_tv", name: "Crime & Mystery", genreId: 80, mediaType: "tv" },
  { id: "mystery_tv", name: "Mystery", genreId: 9648, mediaType: "tv" },
  { id: "documentary_tv", name: "Documentary Series", genreId: 99, mediaType: "tv" }
];

export const CATEGORIES = MOVIE_CATEGORIES;

// 1. Fetch Movies by Category (Optimized - 1 network request, cached)
export async function fetchMoviesByCategory(
  categoryKey: string = "trending",
  page: number = 1
): Promise<{ movies: Movie[]; totalPages: number; page: number; totalResults: number }> {
  try {
    const category = MOVIE_CATEGORIES.find((c) => c.id === categoryKey) || MOVIE_CATEGORIES[0];
    let url = "";

    if (category.genreId) {
      url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${category.genreId}&page=${page}&sort_by=popularity.desc`;
    } else if (category.tmdbEndpoint) {
      url = `${TMDB_BASE_URL}${category.tmdbEndpoint}?api_key=${TMDB_API_KEY}&page=${page}`;
    } else {
      url = `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}`;
    }

    const data = await fetchWithCache<any>(url);
    const results = data.results || [];
    const totalPages = Math.min(data.total_pages || 1, 500);
    const totalResults = data.total_results || results.length;

    // Instant synchronous mapping with 0 sub-queries!
    const movies = results.map(syncTransformTmdbMovie);

    return {
      movies,
      totalPages,
      page: data.page || page,
      totalResults
    };
  } catch (error) {
    console.error("Failed to fetch category movies:", error);
    return {
      movies: FALLBACK_MOVIES,
      totalPages: 1,
      page: 1,
      totalResults: FALLBACK_MOVIES.length
    };
  }
}

// 2. Fetch TV Shows by Category (Optimized - 1 network request, cached)
export async function fetchTvShowsByCategory(
  categoryKey: string = "trending_tv",
  page: number = 1
): Promise<{ movies: Movie[]; totalPages: number; page: number; totalResults: number }> {
  try {
    const category = TV_CATEGORIES.find((c) => c.id === categoryKey) || TV_CATEGORIES[0];
    let url = "";

    if (category.genreId) {
      url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${category.genreId}&page=${page}&sort_by=popularity.desc`;
    } else if (category.tmdbEndpoint) {
      url = `${TMDB_BASE_URL}${category.tmdbEndpoint}?api_key=${TMDB_API_KEY}&page=${page}`;
    } else {
      url = `${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&page=${page}`;
    }

    const data = await fetchWithCache<any>(url);
    const results = data.results || [];
    const totalPages = Math.min(data.total_pages || 1, 500);
    const totalResults = data.total_results || results.length;

    const movies = results.map(syncTransformTmdbTvShow);

    return {
      movies,
      totalPages,
      page: data.page || page,
      totalResults
    };
  } catch (error) {
    console.error("Failed to fetch TV category:", error);
    return {
      movies: FALLBACK_TV_SHOWS,
      totalPages: 1,
      page: 1,
      totalResults: FALLBACK_TV_SHOWS.length
    };
  }
}

// Legacy curated helper
export async function fetchCuratedMovies(): Promise<Movie[]> {
  const data = await fetchMoviesByCategory("trending", 1);
  return data.movies.slice(0, 12);
}

// 3. Search Media (Movies or TV or Multi) with Pagination (Optimized)
export async function searchMediaWithPagination(
  query: string,
  page: number = 1,
  mediaType: MediaType | "multi" = "multi"
): Promise<{ movies: Movie[]; totalPages: number; page: number; totalResults: number }> {
  try {
    let endpoint = "/search/multi";
    if (mediaType === "movie") endpoint = "/search/movie";
    if (mediaType === "tv") endpoint = "/search/tv";

    const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
    const data = await fetchWithCache<any>(url);
    const results = data.results || [];
    const totalPages = Math.min(data.total_pages || 1, 500);
    const totalResults = data.total_results || results.length;

    const movies: Movie[] = results
      .filter((item: any) => item.media_type !== "person")
      .map((item: any) => {
        if (item.media_type === "tv" || (!item.title && item.name)) {
          return syncTransformTmdbTvShow(item);
        }
        return syncTransformTmdbMovie(item);
      });

    return {
      movies,
      totalPages,
      page: data.page || page,
      totalResults
    };
  } catch (error) {
    console.error("TMDB Search Error:", error);
    return { movies: [], totalPages: 1, page: 1, totalResults: 0 };
  }
}

export async function searchMoviesWithPagination(
  query: string,
  page: number = 1
): Promise<{ movies: Movie[]; totalPages: number; page: number; totalResults: number }> {
  return searchMediaWithPagination(query, page, "multi");
}

export async function searchMovies(query: string): Promise<Movie[]> {
  const data = await searchMoviesWithPagination(query, 1);
  return data.movies;
}

// 4. Fetch Detailed Movie or TV Show Information (On-Demand Loading)
export async function fetchMovieDetails(movieId: string, mediaType?: MediaType): Promise<MovieDetail> {
  let tmdbId = movieId;
  let detectedType: MediaType = mediaType || "movie";

  // If movieId is an IMDb ID starting with 'tt', find its TMDB ID first
  if (movieId.startsWith("tt")) {
    try {
      const findUrl = `${TMDB_BASE_URL}/find/${movieId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
      const findData = await fetchWithCache<any>(findUrl);
      if (findData.movie_results && findData.movie_results.length > 0) {
        tmdbId = String(findData.movie_results[0].id);
        detectedType = "movie";
      } else if (findData.tv_results && findData.tv_results.length > 0) {
        tmdbId = String(findData.tv_results[0].id);
        detectedType = "tv";
      }
    } catch (e) {
      console.warn("Find by IMDb ID failed, using ID directly:", movieId);
    }
  }

  // Try fetching based on detected type, fallback to the other if 404
  let resData: any = null;
  try {
    const url = `${TMDB_BASE_URL}/${detectedType}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits,keywords,reviews,recommendations,external_ids`;
    resData = await fetchWithCache<any>(url);
  } catch (err) {
    const fallbackType = detectedType === "movie" ? "tv" : "movie";
    try {
      const altUrl = `${TMDB_BASE_URL}/${fallbackType}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits,keywords,reviews,recommendations,external_ids`;
      resData = await fetchWithCache<any>(altUrl);
      detectedType = fallbackType;
    } catch (e) {
      throw new Error(`Failed to load details for ${movieId}`);
    }
  }

  const imdbId = resData.external_ids?.imdb_id || movieId;
  const isTv = detectedType === "tv" || (!resData.title && resData.name);

  const baseMovie = isTv
    ? syncTransformTmdbTvShow({ ...resData, imdb_id: imdbId })
    : syncTransformTmdbMovie({ ...resData, imdb_id: imdbId });

  const directorObj =
    resData.credits?.crew?.find((c: any) => c.job === "Director") ||
    resData.created_by?.[0];
  const director = directorObj ? directorObj.name : isTv ? "Series Creator" : "Renowned Director";

  const writers =
    resData.credits?.crew
      ?.filter((c: any) => c.job === "Screenplay" || c.job === "Writer" || c.job === "Story")
      .map((c: any) => c.name) || ["Creative Screenwriter"];

  const actors =
    resData.credits?.cast?.slice(0, 5).map((c: any) => c.name) || ["Leading Cast"];

  // Keywords
  const rawKeywords = resData.keywords?.keywords || resData.keywords?.results || [];
  const trivia = rawKeywords.slice(0, 4).map(
    (k: any) => `Production Element: ${k.name.charAt(0).toUpperCase() + k.name.slice(1)}`
  );

  // Derive atmospheric vibe scores
  const ratingNum = resData.vote_average || 8.0;
  const emotionalScore = Math.min(98, Math.round(ratingNum * 10 + 5));
  const visualScore = Math.min(99, Math.round(ratingNum * 10 + 8));
  const pacingScore = Math.min(95, Math.round(ratingNum * 9.5 + 6));

  const genresStr = baseMovie.genres.join(", ");

  // Map TV seasons if available
  const seasons: TvSeasonDetail[] = (resData.seasons || [])
    .filter((s: any) => s.season_number > 0)
    .map((s: any) => ({
      seasonNumber: s.season_number,
      name: s.name || `Season ${s.season_number}`,
      overview: s.overview || "",
      posterPath: s.poster_path ? `${IMAGE_BASE_URL}${s.poster_path}` : "",
      episodes: []
    }));

  return {
    ...baseMovie,
    mediaType: isTv ? "tv" : "movie",
    director,
    actors: actors.length > 0 ? actors : ["Leading Cast"],
    plotDetailed: resData.overview || baseMovie.plot,
    trivia:
      trivia.length > 0
        ? trivia
        : ["Critically acclaimed storytelling with deep atmospheric pacing."],
    writers: writers.length > 0 ? Array.from(new Set(writers)) : ["Acclaimed Screenwriters"],
    aiReview: `"${baseMovie.title}" is a remarkable triumph in ${genresStr}. ${isTv ? "Created" : "Directed"} by ${director}, it expertly balances atmospheric tension with emotional clarity, delivering compelling performances.`,
    vibes: {
      emotional: {
        score: emotionalScore,
        description: `Deep resonance driven by compelling character arcs and nuanced score.`
      },
      visual: {
        score: visualScore,
        description: `Masterful camera composition, color grading, and framing.`
      },
      pacing: {
        score: pacingScore,
        description: `Tight narrative momentum keeping audiences engaged throughout.`
      }
    },
    seasons: seasons.length > 0 ? seasons : undefined
  };
}

// 5. Fetch Season Episodes for TV Series (Cached)
export async function fetchTvSeasonEpisodes(
  tvId: string,
  seasonNumber: number = 1
): Promise<TvEpisode[]> {
  try {
    const url = `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`;
    const data = await fetchWithCache<any>(url);
    const episodes: TvEpisode[] = (data.episodes || []).map((ep: any) => ({
      id: ep.id,
      name: ep.name || `Episode ${ep.episode_number}`,
      overview: ep.overview || "No episode summary available.",
      episodeNumber: ep.episode_number,
      seasonNumber: ep.season_number,
      stillPath: ep.still_path ? `${BACKDROP_BASE_URL}${ep.still_path}` : "",
      airDate: ep.air_date || "",
      voteAverage: ep.vote_average ? Number(ep.vote_average.toFixed(1)) : 8.0
    }));
    return episodes;
  } catch (error) {
    console.error(`Failed to fetch season ${seasonNumber} for TV ID ${tvId}:`, error);
    return [];
  }
}

// 6. Client-Side Vibe Search (100% Private, Zero External AI API Required)
export async function getAIRecommendations(prompt: string): Promise<Movie[]> {
  const promptLower = prompt.toLowerCase();

  let genreId: number | null = null;
  if (promptLower.includes("sci-fi") || promptLower.includes("science fiction") || promptLower.includes("space")) genreId = 878;
  else if (promptLower.includes("thriller") || promptLower.includes("suspense")) genreId = 53;
  else if (promptLower.includes("action") || promptLower.includes("fight")) genreId = 28;
  else if (promptLower.includes("animation") || promptLower.includes("anime")) genreId = 16;
  else if (promptLower.includes("crime") || promptLower.includes("noir") || promptLower.includes("mafia")) genreId = 80;
  else if (promptLower.includes("drama") || promptLower.includes("emotional")) genreId = 18;
  else if (promptLower.includes("horror") || promptLower.includes("scary") || promptLower.includes("ghost")) genreId = 27;
  else if (promptLower.includes("comedy") || promptLower.includes("funny")) genreId = 35;
  else if (promptLower.includes("romance") || promptLower.includes("love")) genreId = 10749;

  let url = `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=1`;
  if (genreId) {
    url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=1000`;
  }

  try {
    const data = await fetchWithCache<any>(url);
    const results = data.results || [];

    const recommendations = results.slice(0, 8).map((item: any) => {
      const movie = syncTransformTmdbMovie(item);
      return {
        ...movie,
        reason: `Matched "${prompt.slice(0, 45)}...": Highly acclaimed ${movie.genres.join("/")} with ${movie.imdbRating}/10 rating.`
      };
    });

    return recommendations;
  } catch (error) {
    console.error("Vibe recommendation fallback:", error);
    return FALLBACK_MOVIES.slice(0, 4);
  }
}

// Fallback curated movies
export const FALLBACK_MOVIES: Movie[] = [
  {
    id: "tt1375666",
    tmdbId: "27205",
    imdbId: "tt1375666",
    title: "Inception",
    year: "2010",
    runtime: "148 min",
    genres: ["Action", "Sci-Fi", "Adventure"],
    director: "Christopher Nolan",
    actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
    plot: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    imdbRating: "8.8",
    imdbVotes: "2.6M",
    poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg",
    backdrop: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80&auto=format&fit=crop",
    tagline: "Your mind is the scene of the crime.",
    awards: "Won 4 Oscars. 158 wins & 220 nominations total.",
    mediaType: "movie"
  },
  {
    id: "tt0468569",
    tmdbId: "155",
    imdbId: "tt0468569",
    title: "The Dark Knight",
    year: "2008",
    runtime: "152 min",
    genres: ["Action", "Crime", "Drama"],
    director: "Christopher Nolan",
    actors: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Maggie Gyllenhaal"],
    plot: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.",
    imdbRating: "9.0",
    imdbVotes: "2.9M",
    poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg",
    backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=80&auto=format&fit=crop",
    tagline: "Why So Serious?",
    awards: "Won 2 Oscars. 163 wins & 164 nominations total.",
    mediaType: "movie"
  },
  {
    id: "tt0816692",
    tmdbId: "157336",
    imdbId: "tt0816692",
    title: "Interstellar",
    year: "2014",
    runtime: "169 min",
    genres: ["Adventure", "Drama", "Sci-Fi"],
    director: "Christopher Nolan",
    actors: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    plot: "When Earth becomes uninhabitable, a team of explorers travels through a wormhole in space in an attempt to ensure humanity's survival.",
    imdbRating: "8.7",
    imdbVotes: "2.1M",
    poster: "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMTcxX00zc2E4LWEyM2QtMTlhNzZmZjIzM2I2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    backdrop: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80&auto=format&fit=crop",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    awards: "Won 1 Oscar. 44 wins & 148 nominations total.",
    mediaType: "movie"
  }
];

export const FALLBACK_TV_SHOWS: Movie[] = [
  {
    id: "94605",
    tmdbId: "94605",
    title: "Arcane",
    year: "2021",
    runtime: "2 Seasons",
    genres: ["Animation", "Sci-Fi & Fantasy", "Action & Adventure"],
    director: "Christian Linke",
    actors: ["Hailee Steinfeld", "Ella Purnell", "Kevin Alejandro"],
    plot: "Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League of Legends champions-and the power that will tear them apart.",
    imdbRating: "9.0",
    imdbVotes: "280K",
    poster: "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn396mlX3OD2v.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/rkB4LyZHo1NHXSTXYZaCRvMZ1yo.jpg",
    awards: "Won 4 Primetime Emmys.",
    mediaType: "tv",
    totalSeasons: 2,
    totalEpisodes: 18
  },
  {
    id: "1396",
    tmdbId: "1396",
    title: "Breaking Bad",
    year: "2008",
    runtime: "5 Seasons",
    genres: ["Drama", "Crime"],
    director: "Vince Gilligan",
    actors: ["Bryan Cranston", "Aaron Paul", "Anna Gunn"],
    plot: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family's future.",
    imdbRating: "9.5",
    imdbVotes: "2.1M",
    poster: "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    awards: "Won 16 Primetime Emmys.",
    mediaType: "tv",
    totalSeasons: 5,
    totalEpisodes: 62
  }
];
