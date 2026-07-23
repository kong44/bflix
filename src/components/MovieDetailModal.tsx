import React, { useEffect, useState } from "react";
import { Movie, MovieDetail } from "../types";
import { X, Star, Calendar, Clock, Trophy, Lightbulb, Sparkles, AlertCircle, ExternalLink, Activity, Film, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MovieDetailModalProps {
  movie: Movie;
  onClose: () => void;
  onStream?: (movie: Movie) => void;
}

const LOADING_STEPS = [
  "Synchronizing with cinematic indexes...",
  "Retrieving verified IMDb details...",
  "Compiling production trivia and facts...",
  "Generating atmospheric atmosphere scores...",
  "Assembling AI critical review panels..."
];

export default function MovieDetailModal({ movie, onClose, onStream }: MovieDetailModalProps) {
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

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
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/movies/${movie.id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unable to fetch complete details for this movie.");
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data.success && data.movie) {
            setDetail(data.movie);
          } else {
            throw new Error(data.error || "Failed to load movie details.");
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError(err.message || "An unexpected error occurred.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [movie.id]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-[#020203] border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl shadow-black/90 my-8 flex flex-col max-h-[90vh]"
        >
          {/* Header Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 bg-black/80 hover:bg-white/10 border border-white/10 rounded-full text-white transition-colors z-50"
          >
            <X className="w-5 h-5" />
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
              <div className="relative h-[240px] sm:h-[300px] w-full flex items-end">
                <div className="absolute inset-0 select-none overflow-hidden">
                  <img
                    src={detail.backdrop || detail.poster}
                    alt=""
                    className="w-full h-full object-cover blur-[8px] opacity-20 scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020203] via-[#020203]/80 to-transparent" />
                </div>

                <div className="relative p-6 sm:p-8 z-10 w-full flex flex-col sm:flex-row gap-6 items-end">
                  {/* Poster Left Offset Overlay */}
                  <div className="w-32 sm:w-40 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/85 hidden sm:block bg-[#121214]">
                    <img
                      src={detail.poster}
                      alt={detail.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Text Header */}
                  <div className="flex-grow space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {detail.genres.map((g, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono tracking-wider uppercase text-imdb bg-imdb/10 border border-imdb/20 px-2.5 py-0.5 rounded"
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter leading-none uppercase">
                      {detail.title}
                    </h2>

                    {detail.tagline && (
                      <p className="text-xs sm:text-sm text-gray-400 font-sans italic tracking-wide">
                        "{detail.tagline}"
                      </p>
                    )}

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {detail.year}
                      </span>
                      <span className="text-gray-700">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        {detail.runtime}
                      </span>
                      <span className="text-gray-700">•</span>
                      <span className="flex items-center gap-1 text-imdb font-bold">
                        <Star className="w-3.5 h-3.5 fill-imdb stroke-imdb" />
                        {detail.imdbRating} <span className="text-gray-500 font-normal">/ 10</span>
                        {detail.imdbVotes && (
                          <span className="text-gray-500 font-normal">({detail.imdbVotes} votes)</span>
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
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
