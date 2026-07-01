// ─── API configuration ─────────────────────────────────────────────────────
// Single source of truth for the backend API base URL.
// Reads VITE_API_URL from the environment (.env / .env.local); falls back to
// '/api' so the Vite dev server proxy (see vite.config.ts) still works when
// no env var is set.

export const API_BASE: string = import.meta.env.VITE_API_URL || '/api'
