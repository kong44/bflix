import React, { useState } from "react";
import { Sparkles, Loader2, ArrowRight, Compass } from "lucide-react";
import { Movie } from "../types";
import { getAIRecommendations } from "../services/tmdb";

interface AIRecommenderProps {
  onRecommendationsFound: (movies: Movie[]) => void;
  onClear: () => void;
}

const PRESET_PROMPTS = [
  { label: "🤯 Mind-Bending", prompt: "A mind-bending science fiction film with timeline paradoxes or psychological twists like Inception or Interstellar." },
  { label: "🕯️ Cozy Dark Thriller", prompt: "An atmospheric, slow-burn mystery or dark thriller set in winter or a rainy town with a cozy but tense atmosphere." },
  { label: "🌌 Cosmic Journeys", prompt: "A cosmic journey movie that features exploring deep space, space-time wormholes, and grand cosmic philosophy." },
  { label: "🎨 Visual Masterpieces", prompt: "A highly visual movie with beautiful, neon, hyper-stylized cinematography or stunning anime hand-drawn aesthetics." },
  { label: "🎷 Jazz & Retro Noir", prompt: "A gritty crime drama or retro noir with smooth jazz soundtracks, heavy rain, and complex antihero characters." }
];

export default function AIRecommender({ onRecommendationsFound, onClear }: AIRecommenderProps) {
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecommend = async (customPrompt?: string) => {
    const activePrompt = customPrompt || preferences;
    if (!activePrompt.trim()) return;

    setLoading(true);
    setError(null);
    if (customPrompt) {
      setPreferences(customPrompt);
    }

    try {
      const recommendations = await getAIRecommendations(activePrompt);
      if (recommendations && recommendations.length > 0) {
        onRecommendationsFound(recommendations);
      } else {
        throw new Error("No atmospheric matches found. Try refining your keywords.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-imdb/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="space-y-2 relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-imdb/10 border border-imdb/20 text-imdb text-xs font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CineAI Recommendation Assistant</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
          What movie atmosphere are you looking for today?
        </h3>
        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-2xl font-sans font-light">
          Describe your mood, specific plots, visual themes, or combinations (e.g., <em>"A vintage detective story in a rainy cyberpunk metropolis with high-tension synth chords"</em>) and Gemini will find perfect matches from IMDb.
        </p>
      </div>

      {/* Input Form */}
      <div className="space-y-4 relative">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="Describe your desired movie atmosphere, mood, aesthetic..."
              disabled={loading}
              className="w-full bg-[#020203] hover:bg-black text-white placeholder-gray-500 border border-white/10 focus:border-imdb/50 rounded-full px-5 py-3 text-xs transition-all shadow-inner outline-none disabled:opacity-50"
              onKeyDown={(e) => e.key === "Enter" && handleRecommend()}
            />
          </div>
          <button
            onClick={() => handleRecommend()}
            disabled={loading || !preferences.trim()}
            className="bg-imdb hover:bg-imdb-hover disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none text-black font-bold text-xs px-6 py-3 rounded-full transition-all flex items-center justify-center gap-2 shrink-0 select-none cursor-pointer shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Consulting Gemini...</span>
              </>
            ) : (
              <>
                <span>Generate List</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Preset tags suggestion */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-wider uppercase text-gray-500 block">
            Or select a premium atmosphere preset:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((preset, index) => (
              <button
                key={index}
                onClick={() => handleRecommend(preset.prompt)}
                disabled={loading}
                className={`text-xs px-3.5 py-1.5 rounded-lg border text-left transition-all font-sans select-none ${
                  preferences === preset.prompt
                    ? "bg-imdb/10 border-imdb/40 text-imdb font-medium"
                    : "bg-black/50 hover:bg-black/80 border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 leading-relaxed font-sans">
            <p className="font-semibold mb-1">AI Recommendation failed:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
