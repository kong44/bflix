export type MediaType = "movie" | "tv";

export interface Movie {
  id: string;
  tmdbId?: string;
  imdbId?: string;
  title: string;
  year: string;
  runtime?: string;
  genres: string[];
  director: string;
  actors: string[];
  plot: string;
  imdbRating: string;
  imdbVotes?: string;
  poster: string;
  backdrop: string;
  tagline?: string;
  awards?: string;
  videoUrl?: string;
  reason?: string; // Present for AI recommendations
  mediaType?: MediaType;
  totalSeasons?: number;
  totalEpisodes?: number;
}

export interface TvEpisode {
  id: number;
  name: string;
  overview: string;
  episodeNumber: number;
  seasonNumber: number;
  stillPath: string;
  airDate: string;
  voteAverage: number;
}

export interface TvSeasonDetail {
  seasonNumber: number;
  name: string;
  overview: string;
  posterPath: string;
  episodes: TvEpisode[];
}

export interface PlaybackProgress {
  id: string;
  tmdbId?: string;
  imdbId?: string;
  mediaType: MediaType;
  title: string;
  poster: string;
  backdrop: string;
  currentTime: number;
  duration: number;
  percentage: number;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  updatedAt: number;
}

export interface VibeScore {
  score: number;
  description: string;
}

export interface MovieDetail extends Movie {
  plotDetailed: string;
  trivia: string[];
  writers: string[];
  aiReview: string;
  vibes: {
    emotional: VibeScore;
    visual: VibeScore;
    pacing: VibeScore;
  };
  seasons?: TvSeasonDetail[];
}
