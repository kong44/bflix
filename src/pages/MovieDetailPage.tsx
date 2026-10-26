import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Movie, MovieDetail, TvEpisode } from "../types";
import { fetchMovieDetails, fetchTvSeasonEpisodes } from "../services/tmdb";
import { ArrowLeft, Star, Calendar, Clock, Trophy, Play, Download, Sparkles, Loader2, Info, Tv } from "lucide-react";
import PosterFallback from "./../components/PosterFallback";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import DownloadModal from "../components/DownloadModal";

export default function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [downloadMovie, setDownloadMovie] = useState<Movie | null>(null);

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<TvEpisode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  const isTv = detail?.mediaType === "tv";

  useEffect(() => {
    if (!movieId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchMovieDetails(movieId)
      .then((detailData) => {
        if (isMounted) {
          setDetail(detailData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Movie detail fetch error:", err);
          setError(err.message || "Failed to load movie details.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  useEffect(() => {
    if (!isTv || !detail?.tmdbId) return;
    setEpisodesLoading(true);
    fetchTvSeasonEpisodes(detail.tmdbId, selectedSeason)
      .then((data) => {
        setEpisodes(data);
        setEpisodesLoading(false);
      })
      .catch(() => setEpisodesLoading(false));
  }, [isTv, detail?.tmdbId, selectedSeason]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 text-imdb animate-spin" />
        <p className="text-gray-400 font-mono text-sm">Loading movie details...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-[#121215] border border-white/10 rounded-2xl text-center space-y-4">
        <Info className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Could not load movie</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">{error || "Movie details unavailable."}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-imdb text-black font-bold text-xs rounded-xl hover:bg-imdb-hover transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const movieObj: Movie = {
    id: detail.id,
    tmdbId: detail.tmdbId,
    imdbId: detail.imdbId,
    title: detail.title,
    year: detail.year,
    runtime: detail.runtime,
    genres: detail.genres,
    director: detail.director,
    actors: detail.actors,
    plot: detail.plot,
    imdbRating: detail.imdbRating,
    imdbVotes: detail.imdbVotes,
    poster: detail.poster,
    backdrop: detail.backdrop,
    tagline: detail.tagline,
    awards: detail.awards
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs rounded-full border border-white/10 transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Main Banner / Header */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0d] shadow-2xl">
        <div className="absolute inset-0">
          <img
            src={detail.backdrop}
            alt={detail.title}
            className="w-full h-full object-cover opacity-25 filter blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/80 to-transparent" />
        </div>

        <div className="relative p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-48 sm:w-60 shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
            <img src={detail.poster} alt={detail.title} className="w-full h-auto object-cover" />
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {detail.genres.map((g, i) => (
                <span key={i} className="px-3 py-1 bg-imdb/10 text-imdb border border-imdb/20 text-xs font-mono font-bold rounded-full">
                  {g}
                </span>
              ))}
              <span className="text-gray-400 text-xs font-mono">• {detail.runtime}</span>
              <span className="text-gray-400 text-xs font-mono">• {detail.year}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{detail.title}</h1>

            {detail.tagline && (
              <p className="text-amber-400/90 text-sm font-serif italic">"{detail.tagline}"</p>
            )}

            <div className="flex items-center gap-4 py-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-imdb/20 border border-imdb/40 rounded-xl text-imdb font-bold text-sm">
                <Star className="w-4 h-4 fill-imdb" />
                <span>{detail.imdbRating} / 10</span>
              </div>
              <span className="text-xs text-gray-400 font-mono">({detail.imdbVotes} votes)</span>
            </div>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-3xl">{detail.plot}</p>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                onClick={() => {
                  const params = isTv ? `?season=${selectedSeason}&episode=1` : "";
                  navigate(`/watch/${detail.id}${params}`);
                }}
                className="px-6 py-3 bg-imdb hover:bg-imdb-hover text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>{t("hero.watchStream")}</span>
              </button>

              <button
                onClick={() => setDownloadMovie(movieObj)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-imdb" />
                <span>{t("hero.downloadMp4")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TV Series Seasons & Episodes Explorer */}
      {isTv && (
        <div className="bg-[#0c0c0f] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-imdb" />
                <span>Episodes & Seasons</span>
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-1">Select any episode to begin streaming</p>
            </div>

            {detail.seasons && detail.seasons.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
                {detail.seasons.map((s) => (
                  <button
                    key={s.seasonNumber}
                    onClick={() => setSelectedSeason(s.seasonNumber)}
                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                      selectedSeason === s.seasonNumber
                        ? "bg-imdb text-black font-bold shadow-md"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Season {s.seasonNumber}
                  </button>
                ))}
              </div>
            )}
          </div>

          {episodesLoading ? (
            <div className="py-12 flex justify-center items-center gap-2 text-gray-400 text-xs font-mono">
              <Loader2 className="w-5 h-5 animate-spin text-imdb" />
              <span>Loading Season {selectedSeason} episodes...</span>
            </div>
          ) : episodes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => {
                    navigate(`/watch/${detail.id}?season=${selectedSeason}&episode=${ep.episodeNumber}`);
                  }}
                  className="group p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-imdb/40 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="aspect-video w-full bg-black/60 rounded-xl overflow-hidden relative flex items-center justify-center">
                    {ep.stillPath ? (
                      <img src={ep.stillPath} alt={ep.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <Tv className="w-8 h-8 text-gray-600" />
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                      <div className="w-10 h-10 rounded-full bg-imdb/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-imdb font-mono font-bold block">
                      SEASON {selectedSeason} • EPISODE {ep.episodeNumber}
                    </span>
                    <h4 className="text-sm font-bold text-white group-hover:text-imdb transition-colors truncate mt-1">
                      {ep.name}
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1 font-light leading-relaxed">
                      {ep.overview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 font-mono py-6 text-center">
              No episode listings available for this season.
            </p>
          )}
        </div>
      )}

      {/* Details breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#0c0c0f] border border-white/5 rounded-2xl space-y-3">
          <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider">Director & Crew</h3>
          <p className="text-white font-bold text-base">{detail.director}</p>
        </div>

        <div className="p-6 bg-[#0c0c0f] border border-white/5 rounded-2xl space-y-3 md:col-span-2">
          <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider">Cast & Starring</h3>
          <div className="flex flex-wrap gap-2">
            {detail.actors.map((actor, idx) => (
              <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 text-gray-200 text-xs font-medium rounded-lg">
                {actor}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {downloadMovie && (
        <DownloadModal
          movie={downloadMovie}
          onClose={() => setDownloadMovie(null)}
          onStream={(movie) => {
            setDownloadMovie(null);
            const params = movie.mediaType === "tv" ? `?season=${selectedSeason}&episode=1` : "";
            navigate(`/watch/${movie.id}${params}`);
          }}
        />
      )}
    </div>
  );
}
