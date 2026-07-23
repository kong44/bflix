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
  reason?: string; // Present for AI recommendations
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
}
