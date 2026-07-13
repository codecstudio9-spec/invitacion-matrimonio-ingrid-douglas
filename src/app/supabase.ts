import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// La clave "anon/publishable" de Supabase no es secreta — está pensada para
// vivir en el navegador (la seguridad real la dan las políticas RLS). Vite ya
// hornea el valor de la variable de entorno directo en el JS del build, así
// que este respaldo no expone nada que no estuviera ya expuesto. Si la
// variable de entorno existe, se usa esa; solo si viniera vacía, cae aquí.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cmxqwgvwxahuluaaqisc.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_c_sm1mlwt2RRWKGqdtjadw_wyPIjNre";

export const supabaseReady = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = supabaseReady
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// "guest-content" es el bucket configurado con límite de 50MB (tope del plan
// Free de Supabase) y políticas de select/insert/delete — mejor que
// "guest-media" (creado antes con políticas más limitadas). MAX_UPLOAD_MB en
// App.tsx debe coincidir con este límite.
export const GUEST_MEDIA_BUCKET = "guest-content";
export const VIDEO_GREETINGS_BUCKET = "video-greetings";
