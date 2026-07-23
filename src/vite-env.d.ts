/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly TMDB_API_KEY?: string;
  readonly GEMINI_API_KEY?: string;
  readonly VITE_TMDB_API_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
