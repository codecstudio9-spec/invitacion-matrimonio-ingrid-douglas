import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// True once real credentials are present in .env.local (or Vercel's env vars) —
// until then, every Supabase-backed feature (guest photos/videos, shared RSVPs)
// shows a "not configured yet" state instead of crashing the rest of the site.
export const supabaseReady = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = supabaseReady
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const GUEST_MEDIA_BUCKET = "guest-media";
export const VIDEO_GREETINGS_BUCKET = "video-greetings";
