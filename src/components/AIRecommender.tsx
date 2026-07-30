import React, { useState } from "react";
import { Sparkles, Loader2, ArrowRight, Compass } from "lucide-react";
import { Movie } from "../types";
import { getAIRecommendations } from "../services/tmdb";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
    <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Specular light highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 pointer-events-none" />
      {/* Decorative background liquid glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="space-y-2 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-pill text-imdb text-xs font-mono font-medium border border-white/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t("ai.title")}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
          {t("ai.title")}
        </h3>
        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-sans font-light">
          {t("ai.subtitle")}
        </p>
      </div>

      {/* Input Form */}
      <div className="space-y-4 relative z-10">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder={t("ai.placeholder")}
              disabled={loading}
              className="w-full liquid-glass-input text-white placeholder-gray-400 border border-white/20 focus:border-imdb/50 rounded-full px-5 py-3 text-xs transition-all shadow-inner outline-none disabled:opacity-50"
              onKeyDown={(e) => e.key === "Enter" && handleRecommend()}
            />
          </div>
          <button
            onClick={() => handleRecommend()}
            disabled={loading || !preferences.trim()}
            className="liquid-btn-gold disabled:opacity-50 text-black font-extrabold text-xs px-6 py-3 rounded-full transition-all flex items-center justify-center gap-2 shrink-0 select-none cursor-pointer shadow-xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Consulting Gemini...</span>
              </>
            ) : (
              <>
                <span>{t("ai.findButton")}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Preset tags suggestion */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-wider uppercase text-gray-400 block">
            Or select a premium atmosphere preset:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((preset, index) => (
              <button
                key={index}
                onClick={() => handleRecommend(preset.prompt)}
                disabled={loading}
                className={`text-xs px-3.5 py-1.5 rounded-xl border text-left transition-all font-sans select-none cursor-pointer ${
                  preferences === preset.prompt
                    ? "liquid-btn-gold text-black font-bold border-imdb/50 shadow-md"
                    : "liquid-glass-pill hover:bg-white/20 text-gray-300 border-white/10"
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
