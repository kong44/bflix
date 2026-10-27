import React, { useEffect, useState } from "react";
import { Movie, MovieDetail, TvEpisode } from "../types";
import { X, Star, Calendar, Clock, Trophy, Lightbulb, Sparkles, AlertCircle, ExternalLink, Activity, Film, Play, Download, Tv, Loader2 } from "lucide-react";
import PosterFallback from "./PosterFallback";
import { fetchMovieDetails, fetchTvSeasonEpisodes } from "../services/tmdb";
import { motion, AnimatePresence } from "motion/react";

interface MovieDetailModalProps {
  movie: Movie;
  onClose: () => void;
  onStream?: (movie: Movie, season?: number, episode?: number) => void;
  onDownloadMp4?: (movie: Movie) => void;
}

const LOADING_STEPS = [
  "Synchronizing with cinematic indexes...",
  "Retrieving verified IMDb details...",
  "Compiling production trivia and facts...",
  "Generating atmospheric atmosphere scores...",
  "Assembling AI critical review panels..."
];

export default function MovieDetailModal({ movie, onClose, onStream, onDownloadMp4 }: MovieDetailModalProps) {
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<TvEpisode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  const isTv = detail?.mediaType === "tv" || movie.mediaType === "tv";

  useEffect(() => {
    if (!isTv) return;
    const tvId = detail?.tmdbId || movie.tmdbId || movie.id;
    if (!tvId) return;

    const controller = new AbortController();
    setEpisodesLoading(true);
    fetchTvSeasonEpisodes(tvId, selectedSeason, controller.signal)
      .then((data) => {
        setEpisodes(data);
        setEpisodesLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.warn("Episodes load error:", err);
        setEpisodesLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [isTv, detail?.tmdbId, movie.tmdbId, movie.id, selectedSeason]);

  // Cycling reassuring load messages
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch detailed movie analysis on mount
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchMovieDetails(movie.id, undefined, controller.signal)
      .then((detailData) => {
        setDetail(detailData);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError(err.message || "An unexpected error occurred while loading details.");
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [movie.id]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-[#020203] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl shadow-black/90 sm:my-8 flex flex-col max-h-[92vh] sm:max-h-[90vh]"
        >
          {/* Mobile Grab Handle Bar */}
          <div className="w-12 h-1.5 bg-white/25 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

          {/* Header Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 sm:p-2.5 bg-black/80 hover:bg-white/10 border border-white/10 rounded-full text-white transition-colors z-50 cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {loading ? (
            /* Immersive Loading Screen */
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-6 h-[600px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-imdb/10 border-t-2 border-t-imdb animate-spin" />
                <Sparkles className="w-6 h-6 text-imdb absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-sans font-bold text-lg tracking-tight uppercase">
                  Consulting CineAI
                </h3>
                <motion.p
                  key={loadingStep}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-imdb font-mono italic"
                >
                  {LOADING_STEPS[loadingStep]}
                </motion.p>
              </div>
            </div>
          ) : error ? (
            /* Error Display Block */
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 h-[500px]">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-zinc-200 font-bold text-lg mb-1">Retrieval Interrupted</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{error}</p>
                {error.includes("Secrets") && (
                  <p className="text-xs text-imdb/80 font-mono mt-3 bg-imdb/5 p-2 rounded border border-imdb/10">
                    Pro-tip: Head to **Settings &gt; Secrets** to enter your GEMINI_API_KEY.
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-white/10 border border-white/5 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-all"
              >
                Go Back
              </button>
            </div>
          ) : detail ? (
            /* Main Loaded Content Details */
            <div className="overflow-y-auto flex-grow">
              {/* Giant Banner Backdrop Header */}
              <div className="relative min-h-[200px] sm:h-[300px] w-full flex items-end">
                <div className="absolute inset-0 select-none overflow-hidden">
                  <img
                    src={detail.backdrop || detail.poster}
                    alt=""
                    className="w-full h-full object-cover blur-[8px] opacity-20 scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020203] via-[#020203]/80 to-transparent" />
                </div>

                <div className="relative p-4 sm:p-8 z-10 w-full flex flex-row gap-4 sm:gap-7 items-end">
                  {/* Poster Thumbnail Overlay */}
                  <div className="w-20 sm:w-44 shrink-0 aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-black/90 bg-[#121214] relative group">
                    <img
                      src={detail.poster || movie.poster}
                      alt={detail.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Text Header */}
                  <div className="flex-grow space-y-1.5 sm:space-y-2">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {detail.genres.map((g, i) => (
                        <span
                          key={i}
                          className="text-[9px] sm:text-[10px] font-mono tracking-wider uppercase text-imdb bg-imdb/10 border border-imdb/20 px-2 sm:px-2.5 py-0.5 rounded"
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    <h2 className="text-xl sm:text-5xl font-black text-white tracking-tighter leading-tight sm:leading-none uppercase line-clamp-2">
                      {detail.title}
                    </h2>

                    {detail.tagline && (
                      <p className="text-xs sm:text-sm text-gray-400 font-sans italic tracking-wide line-clamp-1 sm:line-clamp-none">
                        "{detail.tagline}"
                      </p>
                    )}

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-mono text-gray-400 pt-0.5 sm:pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gray-500" />
                        {detail.year}
                      </span>
                      <span className="text-gray-700">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gray-500" />
                        {detail.runtime}
                      </span>
                      <span className="text-gray-700">•</span>
                      <span className="flex items-center gap-1 text-imdb font-bold">
                        <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-imdb stroke-imdb" />
                        {detail.imdbRating} <span className="text-gray-500 font-normal">/ 10</span>
                        {detail.imdbVotes && (
                          <span className="text-gray-500 font-normal hidden sm:inline">({detail.imdbVotes} votes)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Three-Column Info Layout */}
              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-white/5 bg-[#020203]">
                {/* Left Column (Details Column) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Crew & Talent list */}
                  <div className="bg-[#121214] border border-white/5 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-mono tracking-wider uppercase text-gray-400 border-b border-white/5 pb-2 flex items-center gap-2">
                      <Film className="w-3.5 h-3.5 text-imdb" />
                      Production Crew
                    </h4>
                    <div className="space-y-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-500 text-[10px] block font-mono">DIRECTOR</span>
                        <span className="font-medium text-gray-200">{detail.director}</span>
                      </div>
                      {detail.writers && detail.writers.length > 0 && (
                        <div>
                          <span className="text-gray-500 text-[10px] block font-mono">WRITERS</span>
                          <span className="font-medium text-gray-200">{detail.writers.join(", ")}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500 text-[10px] block font-mono">STARRING CAST</span>
                        <span className="font-medium text-gray-200">{detail.actors.join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Awards panel */}
                  {detail.awards && (
                    <div className="bg-imdb/5 border border-imdb/10 rounded-2xl p-5 flex gap-4 items-start">
                      <div className="p-2 bg-imdb/10 rounded-lg text-imdb shrink-0">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono tracking-wider uppercase text-imdb">
                          ACCOLADES
                        </span>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          {detail.awards}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Atmosphere Atmosphere Scores */}
                  {detail.vibes && (
                    <div className="bg-[#121214] border border-white/5 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-mono tracking-wider uppercase text-gray-400 border-b border-white/5 pb-2 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-imdb" />
                        Atmospheric Spectrum
                      </h4>
                      <div className="space-y-3">
                        {/* Emotional Intensity */}
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-gray-400">Emotional Resonance</span>
                            <span className="text-imdb font-mono font-bold">
                              {detail.vibes.emotional.score}/10
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-600 to-rose-400"
                              style={{ width: `${detail.vibes.emotional.score * 10}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 block mt-1 leading-tight">
                            {detail.vibes.emotional.description}
                          </span>
                        </div>

                        {/* Visual Style */}
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-gray-400">Visual Artistry</span>
                            <span className="text-imdb font-mono font-bold">
                              {detail.vibes.visual.score}/10
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                              style={{ width: `${detail.vibes.visual.score * 10}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 block mt-1 leading-tight">
                            {detail.vibes.visual.description}
                          </span>
                        </div>

                        {/* Pacing */}
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-gray-400">Tempo / Pacing</span>
                            <span className="text-imdb font-mono font-bold">
                              {detail.vibes.pacing.score}/10
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-imdb to-yellow-300"
                              style={{ width: `${detail.vibes.pacing.score * 10}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 block mt-1 leading-tight">
                            {detail.vibes.pacing.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column (Analysis & Trivia Column) */}
                <div className="lg:col-span-8 space-y-6">
                  {/* TV Series Seasons & Episodes Explorer */}
                  {isTv && (
                    <div className="bg-[#121214] border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Tv className="w-4 h-4 text-imdb" />
                          <span>Episodes & Seasons</span>
                        </h4>
                        {detail.seasons && detail.seasons.length > 0 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                            {detail.seasons.map((s) => (
                              <button
                                key={s.seasonNumber}
                                onClick={() => setSelectedSeason(s.seasonNumber)}
                                className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
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
                        <div className="py-8 flex justify-center items-center gap-2 text-gray-400 text-xs font-mono">
                          <Loader2 className="w-4 h-4 animate-spin text-imdb" />
                          <span>Loading Season {selectedSeason} episodes...</span>
                        </div>
                      ) : episodes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                          {episodes.map((ep) => (
                            <div
                              key={ep.id}
                              onClick={() => onStream && onStream(movie, selectedSeason, ep.episodeNumber)}
                              className="group p-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-imdb/40 rounded-xl transition-all cursor-pointer flex gap-3 items-center"
                            >
                              <div className="w-20 h-14 bg-black/60 rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center">
                                {ep.stillPath ? (
                                  <img src={ep.stillPath} alt={ep.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Tv className="w-6 h-6 text-gray-600" />
                                )}
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                                  <Play className="w-4 h-4 text-white fill-white opacity-80 group-hover:scale-110 transition-transform" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] text-imdb font-mono font-bold block">
                                  EP {ep.episodeNumber}
                                </span>
                                <h5 className="text-xs font-bold text-gray-200 group-hover:text-imdb truncate">
                                  {ep.name}
                                </h5>
                                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5 font-light">
                                  {ep.overview}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 font-mono py-4 text-center">
                          Select Season above to view available episodes.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Detailed Plot */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold border-l-4 border-imdb pl-3 tracking-tight">Cinematic Exposition</h3>
                    <p className="text-sm text-gray-300 leading-relaxed font-sans font-light">
                      {detail.plotDetailed || detail.plot}
                    </p>
                  </div>

                  {/* Production Trivia */}
                  {detail.trivia && detail.trivia.length > 0 && (
                    <div className="space-y-3 bg-[#121214] border border-white/5 rounded-2xl p-6">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-imdb" />
                        Production Secrets & Trivia
                      </h4>
                      <ul className="space-y-3">
                        {detail.trivia.map((t, i) => (
                          <li key={i} className="text-xs text-gray-400 leading-relaxed flex gap-2">
                            <span className="text-imdb shrink-0">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Critic Review Block */}
                  {detail.aiReview && (
                    <div className="space-y-3 border-l-2 border-imdb/50 pl-5 pt-1 pb-1">
                      <span className="text-[10px] font-mono tracking-wider text-imdb uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        CineAI Editorial Critical Analysis
                      </span>
                      <div className="text-sm text-gray-300 italic font-serif leading-relaxed space-y-3 font-light">
                        {detail.aiReview.split("\n\n").map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* External official links & Stream player button */}
                  <div className="pt-4 flex flex-wrap gap-3 items-center">
                    {onStream && (
                      <button
                        onClick={() => onStream(movie)}
                        className="inline-flex items-center gap-2 bg-imdb hover:bg-imdb-hover text-black text-xs font-bold px-6 py-2.5 rounded-full transition-all shadow-lg cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        <span>Watch Video Stream</span>
                      </button>
                    )}
                    {onDownloadMp4 && (
                      <button
                        onClick={() => onDownloadMp4(movie)}
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all border border-white/10 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-imdb" />
                        <span>Download MP4</span>
                      </button>
                    )}
                    <a
                      href={`https://www.imdb.com/title/${detail.id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-5 py-2.5 rounded-full transition-all border border-white/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Official IMDb Profile
                    </a>
                  </div>
                </div>
              </div>

              {/* Mobile Sticky Action Bar */}
              <div className="sm:hidden sticky bottom-0 bg-[#070913]/95 backdrop-blur-xl border-t border-white/10 p-3.5 safe-bottom flex gap-2.5 z-30">
                {onStream && (
                  <button
                    onClick={() => onStream(movie, isTv ? selectedSeason : undefined)}
                    className="flex-1 flex items-center justify-center gap-2 liquid-btn-gold text-black text-sm font-extrabold py-3 px-4 rounded-xl shadow-lg cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Watch Stream</span>
                  </button>
                )}
                {onDownloadMp4 && (
                  <button
                    onClick={() => onDownloadMp4(movie)}
                    className="p-3 liquid-glass-pill text-white rounded-xl border border-white/10 hover:border-imdb/50 flex items-center justify-center shrink-0 cursor-pointer"
                    title="Download MP4"
                  >
                    <Download className="w-4 h-4 text-imdb" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
