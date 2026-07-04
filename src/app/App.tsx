import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Clock, Calendar, VolumeX, Volume2, Minus, Plus,
  ChevronDown, X, Send, Navigation, Video, Upload, FolderPlus,
  ExternalLink, Heart, Star, Lock, Search, MessageCircle,
  Check, Users, PenLine, ChevronLeft, ChevronRight,
  Shirt, BookOpen, Images, Gift, Banknote, Music,
} from "lucide-react";
import { supabase, supabaseReady, GUEST_MEDIA_BUCKET, VIDEO_GREETINGS_BUCKET } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RSVPEntry {
  id: string;
  name: string;
  attending: boolean;
  dietary: string;
  loveNote: string;
  phone: string;
  videoUrl: string | null;
  attendeeCount: number | null;
  songRequest: string | null;
  timestamp: string;
}

interface GuestMediaItem {
  id: string;
  name: string;
  folder: string;
  url: string;
  type: "photo" | "video";
  likes: number;
  timestamp: string;
}

interface GalleryComment {
  id: string;
  name: string;
  message: string;
  timestamp: string;
}

interface GalleryPhotoData {
  likes: number;
  comments: GalleryComment[];
}

interface GuestRecord {
  id: string;
  slug: string;
  displayName: string;
  side: "ingrid" | "douglas";
  passes: number;
}

interface GuestMediaComment {
  id: string;
  mediaId: string;
  name: string;
  message: string;
  timestamp: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEDDING_DATE = new Date("2026-12-05T16:30:00-05:00");

const IMG = {
  beach:   "/hero.jpeg",
  hero:    "/hero.jpeg",
  couple1: "/inv1.jpeg",
  couple2: "/inv2.jpeg",
  couple3: "/inv3.jpeg",
  couple4: "/1765143382246.jpg",
  couple5: "/primera cita.jpg",
  // Imágenes para "Nuestra Historia"
  historiaEncuentro: "/primer encuentro.jpg",
  historiaIglesia: "/predicando juntos.jpg",
  historiaCita: "/primera cita.jpg",
  historiaNovios: "/primera cena.jpg",
  historiaCompromiso: "/propuesta.jpg",
  historiaBoda: "/hero.jpeg",
};

const AUDIO_FILE = "/pacto.mp3";
const VIDEO_FILE = "/video.mp4";
const MUSIC_START_VOLUME = 0.2; // 20%

const SERIF  = "'Playfair Display', serif";
const SANS   = "'Raleway', sans-serif";
const SCRIPT = "'Great Vibes', cursive";

const GOLD      = "#C4A882";
const GOLD_DARK = "#A8886A";
const CREAM     = "#FAF6EE";
const BROWN     = "#3A302A";
const TAN       = "#9C8272";
const ENVELOPE_BEIGE = "#E6DAC0"; // single flat color for the whole envelope — depth comes only from shadow/sheen overlays

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const s = Math.floor(diff / 1000);
    const months = Math.floor(s / (30 * 24 * 3600));
    const rem = s % (30 * 24 * 3600);
    return {
      months,
      days: Math.floor(rem / (24 * 3600)),
      hours: Math.floor((rem % (24 * 3600)) / 3600),
      minutes: Math.floor((rem % 3600) / 60),
      seconds: rem % 60,
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/** Prevents the page behind a fullscreen modal/lightbox from scrolling while it's open. */
function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}

/** Owns the single background-music <audio> element for the whole page.
 *  Playback only ever starts from the envelope tap (a real user gesture);
 *  mute and volume controls act on that same element from anywhere. */
function useBackgroundMusic(startVolume = MUSIC_START_VOLUME) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeId = useRef<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(startVolume);

  useEffect(() => () => { if (fadeId.current !== null) clearInterval(fadeId.current); }, []);

  const start = () => {
    const audio = audioRef.current;
    if (!audio || !audio.paused) return; // never re-trigger if it's already playing
    audio.muted = false;
    audio.volume = 0;
    audio.play().catch(() => {});

    if (fadeId.current !== null) clearInterval(fadeId.current);
    let v = 0;
    fadeId.current = window.setInterval(() => {
      v = Math.min(v + startVolume / 8, startVolume);
      if (audioRef.current) audioRef.current.volume = v;
      if (v >= startVolume) {
        clearInterval(fadeId.current!);
        fadeId.current = null;
      }
    }, 80);
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  };

  const adjustVolume = (delta: number) => {
    const next = Math.round(Math.min(1, Math.max(0, volume + delta)) * 100) / 100;
    setVolume(next);
    if (audioRef.current) audioRef.current.volume = next;
  };

  return { audioRef, muted, volume, start, toggleMute, adjustVolume };
}

// ─── Shared Components ────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, y = 28, x = 0 }: {
  children: React.ReactNode; delay?: number; y?: number; x?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : `translateY(${y}px) translateX(${x}px)`,
      transition: `opacity 1s ease ${delay}s, transform 1s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 my-6 select-none">
      <div className="h-px flex-1 max-w-[55px]" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
      <svg width="18" height="18" viewBox="0 0 24 24" fill={GOLD}>
        <path d="M12 2L13.5 8.5L20 7L15.5 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8.5 12L4 7L10.5 8.5Z" />
      </svg>
      <div className="h-px flex-1 max-w-[55px]" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
    </div>
  );
}

function CrossOrnament() {
  return (
    <div className="flex flex-col items-center gap-1 my-8 select-none">
      <svg width="28" height="36" viewBox="0 0 28 40" fill="none">
        <rect x="12" y="0" width="4" height="40" rx="2" fill={GOLD} opacity="0.7" />
        <rect x="0" y="12" width="28" height="4" rx="2" fill={GOLD} opacity="0.7" />
      </svg>
      <div className="flex items-center gap-3 mt-2">
        <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
        <span className="text-[10px] tracking-[0.4em] uppercase" style={{ fontFamily: SANS, color: GOLD }}>Dios es amor</span>
        <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
      </div>
    </div>
  );
}

/** The couple's own mark — a small flat medallion echoing the envelope's wax
 *  seal, reused across the page as a signature rather than a generic divider. */
function CoupleSeal({ size = 44 }: { size?: number }) {
  return (
    <div
      className="mx-auto flex items-center justify-center select-none"
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `radial-gradient(circle at 36% 30%, #F3E9D3 0%, #E1D1AD 30%, #C7B48A 62%, #A6916C 100%)`,
        border: `1px solid rgba(235,222,195,0.6)`,
        boxShadow: "0 3px 10px rgba(60,45,20,0.25), inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 3px rgba(0,0,0,0.25)",
      }}
    >
      <span style={{ fontFamily: SERIF, fontStyle: "italic", color: "#5C4A32", fontSize: size * 0.34, letterSpacing: "0.02em" }}>
        I&amp;D
      </span>
    </div>
  );
}

/** Pantalla mínima y elegante mientras se resuelve la personalización del
 *  link (?g=slug) contra Supabase — evita cualquier parpadeo de pantalla en
 *  blanco o de texto genérico antes de mostrar el nombre real del invitado. */
function PreparingInvitationScreen() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #F5EBD9 0%, #FAF6EE 35%, #FFF9F0 65%, #F2EBE0 100%)" }}
    >
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <CoupleSeal size={52} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mt-6 text-[11px] tracking-[0.4em] uppercase"
        style={{ fontFamily: SANS, color: "rgba(140,110,70,0.75)" }}
      >
        Preparando tu invitación…
      </motion.p>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="tracking-[0.5em] text-[10px] uppercase mb-3" style={{ fontFamily: SANS, color: GOLD, fontWeight: 500 }}>
      {children}
    </p>
  );
}

function SectionTitle({ children, italic = true }: { children: React.ReactNode; italic?: boolean }) {
  return (
    <h2 className="text-[#3A302A] text-4xl sm:text-5xl" style={{ fontFamily: SERIF, fontStyle: italic ? "italic" : "normal" }}>
      {children}
    </h2>
  );
}

/** All the "extra" sections collapsed behind circular buttons, 2 per row, so the
 *  page stays short — tapping a circle expands just that section beneath the grid. */
function MoreDetailsHub({ rsvpName, onRsvpSuccess, guestName, guest }: { rsvpName: string | null; onRsvpSuccess: (name: string) => void; guestName: string; guest: GuestRecord | null }) {
  // Nota: cada `content` es un elemento ya construido (no una referencia a
  // función). Esto es importante para RSVPHubContent — si en cambio se
  // envolviera en una función flecha nueva en cada render (como antes), React
  // vería un "componente distinto" cada vez que rsvpName cambia y desmontaría
  // RSVPHubContent justo cuando necesitábamos que abriera el modal de video,
  // perdiendo su estado. Con un elemento JSX, el `type` (RSVPHubContent) sigue
  // siendo la misma función de siempre, así que React preserva su estado.
  const items = [
    { key: "itinerario", icon: Clock,    label: "Itinerario",           title: "Itinerario del día",  content: <TimelineContent />,  featured: false },
    { key: "vestuario",  icon: Shirt,    label: "Código de Vestuario",  title: "Nuestro Estilo",       content: <DressCodeContent />, featured: false },
    { key: "historia",   icon: BookOpen, label: "Nuestra Historia",     title: "Nuestra Historia",     content: <OurStoryContent />,  featured: false },
    { key: "notas",      icon: PenLine,  label: "Nota de Amor",         title: "Déjanos tu nota",      content: <LoveNotesContent />, featured: false },
    { key: "regalos",    icon: Gift,     label: "Mesa de Regalos",      title: "Mesa de Regalos",      content: <GiftsContent />,     featured: false },
    { key: "rsvp",       icon: Check,    label: "Confirmar Asistencia", title: rsvpName ? "¡Gracias!" : "Confirmar Asistencia",
      content: <RSVPHubContent rsvpName={rsvpName} onSuccess={onRsvpSuccess} guestName={guestName} guest={guest} />, featured: true },
  ] as const;

  const [open, setOpen] = useState<string | null>(null);
  const active = items.find((i) => i.key === open);
  useBodyScrollLock(!!active);

  return (
    <section className="py-20 px-6" style={{ background: "linear-gradient(160deg, #FAF8F3 0%, #F2EDE3 100%)" }}>
      <div className="max-w-xs mx-auto">
        <Reveal>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => setOpen(item.key)}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="relative flex items-center justify-center" style={{ height: 64 }}>
                  {item.featured && (
                    <>
                      <motion.div
                        className="absolute rounded-full"
                        style={{ width: 76, height: 76, background: `radial-gradient(circle, rgba(196,168,130,0.4), transparent 70%)` }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.65, 0.1, 0.65] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {/* Anillo estilo "botón de WhatsApp" — dos ondas de borde que se expanden y desvanecen */}
                      {[0, 0.9].map((delay) => (
                        <motion.div
                          key={delay}
                          className="absolute rounded-full"
                          style={{ width: 64, height: 64, border: `2px solid ${GOLD}` }}
                          animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay }}
                        />
                      ))}
                    </>
                  )}
                  <motion.div
                    className="relative w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, boxShadow: "0 6px 20px rgba(196,168,130,0.4)" }}
                    animate={item.featured ? { y: [0, -8, 0], rotate: [0, -6, 6, 0] } : undefined}
                    transition={item.featured ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : undefined}
                  >
                    <item.icon style={{ width: 22, height: 22, color: CREAM }} />
                  </motion.div>
                </div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-center leading-tight"
                  style={{ fontFamily: SANS, color: GOLD, fontWeight: 500 }}>
                  {item.label}
                </p>
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Modal popup — each circle opens its section as a proper dialog instead of pushing the page down */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: "rgba(20,14,6,0.82)" }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-lg"
              style={{ background: "#FFFBF2", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}
            >
              <button
                onClick={() => setOpen(null)}
                aria-label="Cerrar"
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ background: "rgba(58,48,42,0.08)" }}
              >
                <X style={{ width: 17, height: 17, color: BROWN }} />
              </button>

              <div className="pt-10 pb-12 px-6 sm:px-10 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})` }}>
                  <active.icon style={{ width: 18, height: 18, color: CREAM }} />
                </div>
                <h2 className="text-3xl mb-8" style={{ fontFamily: SCRIPT, color: "#5C4A32" }}>{active.title}</h2>
                {active.content}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function GoldButton({ children, onClick, type = "button", disabled = false, className = "" }: {
  children: React.ReactNode; onClick?: () => void;
  type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`flex items-center justify-center gap-2 px-6 py-3 text-xs tracking-[0.3em] uppercase transition-all duration-300 disabled:opacity-50 hover:opacity-90 ${className}`}
      style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, color: CREAM, fontFamily: SANS, borderRadius: 2, fontWeight: 500 }}
    >
      {children}
    </button>
  );
}

// ─── Ultra-Realistic 3D Envelope ──────────────────────────────────────────────

// Stable random values — computed once, not on every render
const MOTES = Array.from({ length: 30 }, (_, i) => ({
  w:    1 + ((i * 7.31) % 2.4),
  left: (i * 37.13) % 100,
  top:  (i * 53.71) % 100,
  op:   0.12 + ((i * 11.37) % 0.42),
  dur:  4.5 + ((i * 3.13) % 5.5),
  del:  (i * 1.73) % 5,
}));

/** Layered wax seal with embossed cross, rim ring, and specular highlight */
function WaxSeal({ cracked }: { cracked: boolean }) {
  return (
    <div style={{ position: "relative", width: 76, height: 76 }}>
      {/* Outer drip halo */}
      <div style={{
        position: "absolute", inset: -6, borderRadius: "50%",
        background: "radial-gradient(circle at 40% 35%, rgba(180,162,128,0.32), transparent 65%)",
        filter: "blur(4px)",
      }} />
      {/* Drip bleed — irregular wax overflow */}
      <div style={{
        position: "absolute", top: -3, left: -2, width: 80, height: 80,
        borderRadius: "50% 48% 52% 50% / 50% 52% 48% 50%",
        background: "radial-gradient(circle at 42% 38%, #D9C9A8, #B4A17A, #8C7A56)",
        boxShadow: "0 7px 22px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4), inset 0 4px 8px rgba(250,242,222,0.3), inset 0 -4px 8px rgba(0,0,0,0.35)",
      }}>
        {/* Main disc gradient */}
        <div style={{
          position: "absolute", inset: 3, borderRadius: "50%",
          background: "radial-gradient(circle at 36% 30%, #F3E9D3 0%, #E1D1AD 22%, #C7B48A 48%, #A6916C 72%, #86754F 100%)",
          boxShadow: "inset 0 3px 7px rgba(250,242,222,0.4), inset 0 -3px 7px rgba(0,0,0,0.4)",
        }}>
          {/* Fine wax grain */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%", mixBlendMode: "overlay", opacity: 0.25,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }} />
          {/* Rim ring — embossed */}
          <div style={{
            position: "absolute", inset: 6, borderRadius: "50%",
            border: "1.5px solid rgba(235,222,195,0.4)",
            boxShadow: "inset 0 1px 4px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.16)",
          }} />
          {/* Inner recessed disc */}
          <div style={{
            position: "absolute", inset: 11, borderRadius: "50%",
            background: "radial-gradient(circle at 38% 32%, #C2AF88, #9C8A64, #7C6C4E)",
            boxShadow: "inset 0 2px 5px rgba(0,0,0,0.45), inset 0 -1px 3px rgba(250,242,222,0.15)",
          }}>
            {/* Embossed I&D monogram */}
            <svg
              width="100%" height="100%" viewBox="0 0 42 42"
              style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.55)) drop-shadow(0 -0.5px 0.5px rgba(250,242,222,0.22))" }}
            >
              <text
                x="21" y="27" textAnchor="middle"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, letterSpacing: "0.01em" }}
                fill="rgba(255,251,242,0.9)"
              >
                I&amp;D
              </text>
              {/* Highlight ridge on monogram */}
              <text
                x="21" y="26" textAnchor="middle"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, letterSpacing: "0.01em" }}
                fill="rgba(255,253,248,0.35)"
              >
                I&amp;D
              </text>
            </svg>
          </div>

          {/* Specular hot-spot */}
          <div style={{
            position: "absolute", top: 9, left: 13, width: 18, height: 11,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255,251,242,0.55) 0%, transparent 100%)",
            transform: "rotate(-25deg)",
          }} />
        </div>

        {/* Crack lines */}
        <svg
          style={{
            position: "absolute", top: -3, left: -2, width: 80, height: 80,
            opacity: cracked ? 1 : 0,
            transition: "opacity 0.2s ease",
            animation: cracked ? "wcrack 0.45s ease forwards" : "none",
          }}
          viewBox="0 0 80 80"
        >
          <line x1="40" y1="6"  x2="45" y2="40" stroke="rgba(255,251,242,0.7)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="74" y1="40" x2="41" y2="43" stroke="rgba(255,251,242,0.7)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="40" y1="74" x2="36" y2="42" stroke="rgba(255,251,242,0.7)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="6"  y1="40" x2="38" y2="39" stroke="rgba(255,251,242,0.7)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="16" x2="37" y2="37" stroke="rgba(255,251,242,0.45)"  strokeWidth="1.2" strokeLinecap="round" />
          <line x1="64" y1="16" x2="43" y2="37" stroke="rgba(255,251,242,0.45)"  strokeWidth="1.2" strokeLinecap="round" />
          <line x1="64" y1="64" x2="43" y2="43" stroke="rgba(255,251,242,0.32)" strokeWidth="1"   strokeLinecap="round" />
          <line x1="16" y1="64" x2="37" y2="43" stroke="rgba(255,251,242,0.32)" strokeWidth="1"   strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/** Animated beach video, tinted beige to stay minimalist — sits behind the envelope */
function BeachVideoBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <video
        autoPlay muted loop playsInline
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      >
        <source src={VIDEO_FILE} type="video/mp4" />
      </video>
      {/* Beige tint — keeps the video subtle behind the envelope */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(245,235,217,0.82) 0%, rgba(250,246,238,0.78) 35%, rgba(255,249,240,0.75) 65%, rgba(242,235,224,0.84) 100%)",
      }} />
    </div>
  );
}

function EnvelopeScreen({ onOpen, startMusic, guestName }: { onOpen: () => void; startMusic: () => void; guestName: string }) {
  const [phase, setPhase] = useState<"idle" | "seal-break" | "flap-open" | "card-rise" | "done">("idle");

  const handleTap = () => {
    if (phase !== "idle") return;

    // Direct result of the user's click — browsers allow audio.play() here.
    startMusic();

    setPhase("seal-break");
    setTimeout(() => setPhase("flap-open"), 620);
    setTimeout(() => setPhase("card-rise"), 1600);
    setTimeout(() => { setPhase("done"); onOpen(); }, 3100);
  };

  const flapOpen = ["flap-open", "card-rise", "done"].includes(phase);
  const cardUp   = ["card-rise", "done"].includes(phase);
  const exiting  = phase === "done";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
      style={{
        // PRIORIDAD 3: Diseño minimalista beige elegante
        background: "linear-gradient(135deg, #F5EBD9 0%, #FAF6EE 35%, #FFF9F0 65%, #F2EBE0 100%)",
      }}
      onClick={handleTap}
    >
      <BeachVideoBackdrop />

      {/* Ambient overlay beige */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 65% 52% at 50% 54%, rgba(196,168,130,0.08) 0%, transparent 100%)",
      }} />

      {/* Floating motes */}
      {MOTES.map((m, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none" style={{
          width: m.w + "px", height: m.w + "px",
          background: `rgba(196,168,130,${m.op * 0.5})`,
          left: m.left + "%", top: m.top + "%",
          animation: `wfloat ${m.dur}s ease-in-out ${m.del}s infinite`,
        }} />
      ))}

      {/* Top label */}
      <motion.div
        initial={{ opacity: 0, y: -22 }}
        animate={{ opacity: exiting ? 0 : 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
        className="relative z-10 text-center mb-10 sm:mb-14"
      >
        <p className="tracking-[0.55em] text-[9px] uppercase mb-2" style={{ fontFamily: SANS, color: "rgba(156,130,100,0.8)" }}>
          Una invitación especial
        </p>
        <p className="leading-tight max-w-[300px] mx-auto px-4" style={{ fontFamily: SCRIPT, color: "#8A7654", fontSize: guestName ? 28 : 30 }}>
          {guestName ? `para: ${guestName}` : "para ti"}
        </p>
      </motion.div>

      {/* ══ Envelope group — floats gently at idle ══ */}
      <motion.div
        className="relative z-10"
        animate={
          exiting
            ? { y: -180, opacity: 0, scale: 0.72, rotateX: 12 }
            : { y: [0, -7, 0], rotateX: [0, 1.5, 0] }
        }
        transition={
          exiting
            ? { duration: 1.05, ease: [0.4, 0, 1, 1] }
            : {
                y:       { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                rotateX: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
              }
        }
        style={{ perspective: 900, perspectiveOrigin: "50% 85%" }}
      >
        <div style={{ width: "min(370px, 90vw)", position: "relative" }}>

          {/* ── Multi-layer cast shadow — spreads and softens as the card lifts, grounding the paper ── */}
          <motion.div
            animate={{
              width: cardUp ? "96%" : "88%",
              opacity: cardUp ? 0.5 : 0.35,
            }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute", bottom: -32, left: "50%",
              transform: "translateX(-50%)",
              height: 32,
              background: "radial-gradient(ellipse, rgba(150,130,100,0.35) 0%, rgba(150,130,100,0.15) 55%, transparent 100%)",
              filter: "blur(18px)",
              borderRadius: "50%",
            }}
          />
          <motion.div
            animate={{ width: cardUp ? "72%" : "60%", opacity: cardUp ? 0.32 : 0.25 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute", bottom: -16, left: "50%",
              transform: "translateX(-50%)",
              height: 16,
              background: "rgba(150,130,100,0.25)",
              filter: "blur(9px)",
              borderRadius: "50%",
            }}
          />

          {/* ── 3D scene ── */}
          <div style={{ aspectRatio: "1.65 / 1", position: "relative", transformStyle: "preserve-3d" }}>

            {/* ══ ENVELOPE BODY ══ */}
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: 5,
              background: ENVELOPE_BEIGE,
              boxShadow: `
                0 40px 100px rgba(0,0,0,0.22),
                0 14px 35px rgba(0,0,0,0.16),
                0 5px 12px rgba(0,0,0,0.1),
                inset 0 1.5px 0 rgba(255,255,255,0.55),
                inset 0 -2px 0 rgba(0,0,0,0.1)
              `,
              overflow: "hidden",
            }}>

              {/* Paper fibre noise */}
              <div style={{
                position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.35,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='280' height='280' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
              }} />

              {/* Top-left specular sheen */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(138deg, rgba(255,255,255,0.32) 0%, transparent 42%)",
                borderRadius: 5,
              }} />

              {/* Centre spine */}
              <div style={{
                position: "absolute", top: 0, left: "50%", bottom: 0, width: 1,
                background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.16) 20%, rgba(0,0,0,0.16) 80%, transparent)",
                transform: "translateX(-0.5px)",
              }} />
              <div style={{
                position: "absolute", top: 0, left: "50%", bottom: 0, width: 2,
                background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.25) 20%, rgba(255,255,255,0.25) 80%, transparent)",
                transform: "translateX(0.5px)",
              }} />

              {/* Side triangle folds (bottom) — same beige, just shaded darker via a black overlay */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, width: 0, height: 0,
                borderStyle: "solid", borderWidth: "0 0 105px 186px",
                borderColor: "transparent transparent rgba(0,0,0,0.13) transparent",
              }} />
              <div style={{
                position: "absolute", bottom: 0, right: 0, width: 0, height: 0,
                borderStyle: "solid", borderWidth: "0 186px 105px 0",
                borderColor: "transparent rgba(0,0,0,0.13) transparent transparent",
              }} />

              {/* ── FLAP ── */}
              <div
                style={{
                  position: "absolute", top: 0, left: 0, right: 0,
                  height: "62%",
                  transformOrigin: "50% 0%",
                  transform: flapOpen ? "rotateX(-178deg)" : "rotateX(0deg)",
                  transition: flapOpen ? "transform 1.25s cubic-bezier(0.3, 1.4, 0.55, 1)" : "none",
                  transformStyle: "preserve-3d",
                  zIndex: flapOpen ? 1 : 6,
                }}
              >
                {/* Front face of flap — same flat beige as the body, shaded only by an overlay */}
                <div style={{
                  position: "absolute", inset: 0,
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  background: ENVELOPE_BEIGE,
                  borderRadius: "5px 5px 0 0",
                  backfaceVisibility: "hidden",
                }}>
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(168deg, rgba(255,255,255,0.35) 0%, transparent 45%, rgba(0,0,0,0.1) 100%)",
                  }} />
                </div>

                {/* Wax seal — sits at bottom-centre of flap */}
                <div style={{
                  position: "absolute", bottom: "2%", left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                }}>
                  <WaxSeal cracked={phase !== "idle"} />
                </div>
              </div>

              {/* Shadow cast inside envelope when flap opens */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "62%",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 65%)",
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                opacity: flapOpen ? 1 : 0,
                transition: "opacity 0.5s ease 0.25s",
                pointerEvents: "none", zIndex: 2,
              }} />

              {/* ── INNER CARD ── */}
              <motion.div
                animate={
                  cardUp
                    ? { y: -100, opacity: 1, scale: 1, rotateX: -4 }
                    : { y: 0, opacity: flapOpen ? 1 : 0, scale: 0.97, rotateX: 0 }
                }
                transition={{
                  duration: 1.05,
                  ease: [0.16, 1, 0.3, 1],
                  delay: cardUp ? 0.05 : 0.22,
                }}
                style={{
                  position: "absolute",
                  left: 20, right: 20, bottom: 18,
                  height: "83%",
                  borderRadius: 3, zIndex: 3, overflow: "hidden",
                  background: "linear-gradient(158deg, #FFFBF2 0%, #FBF5E2 38%, #F6EECF 100%)",
                  boxShadow: `
                    0 -8px 28px rgba(0,0,0,0.15),
                    0  3px 10px rgba(0,0,0,0.08),
                    inset 0 1px 0 rgba(255,255,255,0.85)
                  `,
                }}
              >
                {/* Card paper texture */}
                <div style={{
                  position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.3,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                }} />

                {/* Content */}
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 5,
                }}>
                  <svg width="13" height="18" viewBox="0 0 13 18" fill="none" style={{ opacity: 0.6 }}>
                    <rect x="5.5" y="0" width="2" height="18" rx="1" fill={GOLD} />
                    <rect x="0"   y="5.5" width="13" height="2" rx="1" fill={GOLD} />
                  </svg>
                  <span style={{ fontFamily: SANS, color: "rgba(158,122,65,0.88)", fontSize: 7.5, letterSpacing: "0.52em", textTransform: "uppercase" }}>
                    Invitación
                  </span>
                  <span style={{ fontFamily: SCRIPT, color: "#3E2C18", fontSize: 23, lineHeight: 1.1 }}>
                    Ingrid & Douglas
                  </span>
                  <span style={{ fontFamily: SANS, color: "rgba(135,100,50,0.82)", fontSize: 8.5, letterSpacing: "0.3em" }}>
                    5 · XII · 2026
                  </span>
                </div>
              </motion.div>

            </div>{/* /body */}
          </div>{/* /3D scene */}
        </div>{/* /width */}
      </motion.div>

      {/* Tap hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "idle" ? 1 : 0 }}
        transition={{ delay: 2.4, duration: 1.1 }}
        className="absolute bottom-12 flex flex-col items-center gap-3 z-10"
      >
        <p className="tracking-[0.5em] text-[9px] uppercase" style={{ fontFamily: SANS, color: "rgba(156,120,80,0.68)" }}>
          Toca para abrir
        </p>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown style={{ color: "rgba(156,120,80,0.65)", width: 15, height: 15 }} />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const [scroll, setScroll] = useState(0);
  useEffect(() => {
    const h = () => setScroll(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <section className="relative overflow-hidden" style={{ height: "100svh" }}>
      <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${IMG.hero})`,
        transform: `translateY(${scroll * 0.45}px)`,
        height: "130%", top: "-15%",
      }} />
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, rgba(15,10,5,0.4) 0%, rgba(15,10,5,0.2) 40%, rgba(15,10,5,0.6) 100%)",
      }} />

      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 z-10">
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.3 }} className="mb-5">
          <CoupleSeal size={48} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.6 }}
          style={{ fontFamily: SCRIPT, color: CREAM, lineHeight: 1.15 }}
          className="text-6xl sm:text-7xl md:text-8xl mb-4"
        >
          Ingrid y Douglas
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.2 }}
          className="text-[17px] tracking-[0.32em] uppercase"
          style={{ fontFamily: SANS, color: "#E8DECE", fontWeight: 300 }}
        >
          Nos casamos
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="my-6">
          <Ornament />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.6 }}
          className="text-[15px] max-w-sm leading-relaxed"
          style={{ fontFamily: SANS, color: "rgba(235,222,205,0.85)", fontWeight: 300 }}
        >
          Con la bendición de Dios, la compañía de nuestras familias y la presencia de aquellos que más amamos,
          celebramos el comienzo de esta hermosa historia de amor.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.9 }}
          className="text-[15px] mt-4 italic"
          style={{ fontFamily: SCRIPT, color: "rgba(230,215,195,0.75)" }}
        >
          "Por tanto, lo que Dios juntó, no lo separe el hombre" — Marcos 10:9 (RVR1960)
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="absolute bottom-10">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
            <ChevronDown style={{ color: GOLD, width: 20, height: 20 }} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Details ──────────────────────────────────────────────────────────────────

function DetailsSection() {
  const gcalUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda+Ingrid+%26+Douglas&dates=20261205T163000Z/20261206T040000Z&details=Ceremonia+de+boda+en+Playa+Franc%C3%A9s%2C+Tulu+Cove%C3%B1as%2C+Sucre%2C+Colombia&location=Playa+Franc%C3%A9s%2C+Cove%C3%B1as%2C+Colombia";

  // Apple/Outlook don't have a shareable web link like Google Calendar — a
  // downloadable .ics file is the standard way to add the event on those apps.
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    "UID:boda-ingrid-douglas-20261205@invitacion",
    "DTSTAMP:20260101T000000Z",
    "DTSTART:20261205T163000Z",
    "DTEND:20261206T040000Z",
    "SUMMARY:Boda Ingrid & Douglas",
    "DESCRIPTION:Ceremonia de boda en Playa Francés\\, Tulú Coveñas\\, Sucre\\, Colombia",
    "LOCATION:Playa Francés\\, Coveñas\\, Colombia",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const icsUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

  return (
    <section className="py-28 px-6" style={{ background: "linear-gradient(160deg, #FAF8F3 0%, #F2EDE3 100%)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Main heading */}
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl mb-3" style={{ fontFamily: SCRIPT, color: "#5C4A32" }}>
              Ingrid y Douglas
            </h2>
            <Ornament />
            <p className="text-sm leading-loose mt-6 max-w-lg mx-auto" style={{ fontFamily: SANS, color: TAN, fontWeight: 300, fontStyle: "italic" }}>
              "Mi amado habló, y me dijo: Levántate, oh amiga mía, hermosa mía, y ven. Porque he aquí ha pasado el invierno, se ha mudado, la lluvia se fue; se han mostrado las flores en la tierra, el tiempo de la canción ha venido, y en nuestro país se ha oído la voz de la tórtola."
            </p>
            <p className="text-[10px] tracking-[0.35em] uppercase mt-3" style={{ fontFamily: SANS, color: GOLD }}>
              Cantares 2:10-12 (RVR1960)
            </p>
          </div>
        </Reveal>

        {/* Event details */}
        <div className="space-y-4 mb-12">
          {[
            { Icon: Calendar, label: "Fecha", value: "5 de diciembre, 2026" },
            { Icon: Clock, label: "Hora", value: "4:30 PM" },
            { Icon: MapPin, label: "Lugar", value: "Playa Francés\nTulu Coveñas, Sucre\nColombia" },
          ].map(({ Icon, label, value }, i) => (
            <Reveal key={label} delay={i * 0.1}>
              <div className="p-5 flex items-start gap-4" style={{
                background: "rgba(242,237,227,0.7)",
                border: `1px solid rgba(196,168,130,0.2)`,
                borderRadius: 4,
              }}>
                <Icon style={{ color: GOLD, width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
                <div className="text-left flex-1">
                  <p className="text-[10px] tracking-[0.35em] uppercase mb-2" style={{ fontFamily: SANS, color: GOLD }}>
                    {label}
                  </p>
                  <p className="text-base whitespace-pre-line leading-relaxed" style={{ fontFamily: SERIF, color: BROWN }}>
                    {value}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Gratitude message */}
        <Reveal delay={0.5}>
          <div className="mb-12 text-center">
            <h3 className="text-2xl mb-4" style={{ fontFamily: SCRIPT, color: "#5C4A32" }}>
              Nuestro Agradecimiento
            </h3>
            <p className="text-sm leading-relaxed" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
              No hay palabras suficientes para expresar nuestra gratitud por ser parte de este hermoso sueño. 
              Su presencia y amor significan el mundo para nosotros. Gracias por acompañarnos en este viaje extraordinario 
              y por celebrar con nosotros uno de los momentos más importantes de nuestras vidas.
            </p>
          </div>
        </Reveal>

        {/* Calendar buttons */}
        <Reveal delay={0.6}>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: "Google Calendar", url: gcalUrl, download: undefined },
              { label: "Apple / Outlook", url: icsUrl, download: "boda-ingrid-douglas.ics" },
            ].map(({ label, url, download }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" download={download}
                className="px-4 py-2 text-[10px] tracking-widest uppercase transition-all duration-300"
                style={{ fontFamily: SANS, color: TAN, border: `1px solid rgba(196,168,130,0.35)`, borderRadius: 4 }}
              >
                + {label}
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Bible Verse Banner ───────────────────────────────────────────────────────

function VerseBanner() {
  return (
    <section className="py-20 px-8 relative overflow-hidden" style={{
      backgroundImage: `url(${IMG.beach})`,
      backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed",
    }}>
      <div className="absolute inset-0" style={{ background: "rgba(12,8,3,0.8)" }} />
      <div className="relative z-10 max-w-md mx-auto text-center">
        <Reveal>
          <svg width="28" height="36" viewBox="0 0 28 40" fill="none" className="mx-auto mb-6">
            <rect x="12" y="0" width="4" height="40" rx="2" fill={GOLD} opacity="0.75" />
            <rect x="0" y="12" width="28" height="4" rx="2" fill={GOLD} opacity="0.75" />
          </svg>
          <p className="text-[22px] sm:text-[26px] leading-relaxed mb-4" style={{ fontFamily: SCRIPT, color: "#EDE4D0" }}>
            "El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece;<br />
            no hace nada indebido, no busca lo suyo, no se irrita, no guarda rencor;<br />
            no se goza de la injusticia, mas se goza de la verdad.<br />
            Todo lo sufre, todo lo cree, todo lo espera, todo lo soporta."
          </p>
          <p className="text-[11px] tracking-[0.4em] uppercase mt-4" style={{ fontFamily: SANS, color: GOLD }}>
            1 Corintios 13:4-7 (RVR1960)
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function CountdownSection() {
  const { months, days, hours, minutes, seconds } = useCountdown(WEDDING_DATE);
  const units = [
    { label: "Meses", val: months },
    { label: "Días",  val: days },
    { label: "Horas", val: hours },
    { label: "Min",   val: minutes },
    { label: "Seg",   val: seconds },
  ];

  return (
    <section className="py-28 px-6" style={{ background: "linear-gradient(160deg, #FAF8F3 0%, #F2EDE3 100%)" }}>
      <div className="max-w-2xl mx-auto text-center">
        <Reveal>
          <SectionLabel>Cuenta regresiva</SectionLabel>
          <p className="text-3xl mt-1 mb-2" style={{ fontFamily: SCRIPT, color: "#5C4A32" }}>Faltan…</p>
          <Ornament />
        </Reveal>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-5 mt-4">
          {units.map(({ label, val }, i) => (
            <Reveal key={label} delay={i * 0.09}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center" style={{
                  background: "rgba(196,168,130,0.1)",
                  border: `1px solid rgba(196,168,130,0.4)`,
                  borderRadius: 2,
                }}>
                  <span className="text-2xl sm:text-3xl tabular-nums" style={{ fontFamily: SERIF, color: BROWN, fontWeight: 400 }}>
                    {String(val).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] tracking-widest uppercase" style={{ fontFamily: SANS, color: GOLD }}>
                  {label}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.5}>
          <p className="mt-8 text-sm" style={{ fontFamily: SERIF, color: TAN, fontStyle: "italic" }}>
            5 de diciembre · 4:30 PM · Playa Francés, Coveñas
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Video Background Section ─────────────────────────────────────────────

function VideoSection() {
  return (
    <section className="relative overflow-hidden" style={{ height: "100svh" }}>
      {/* Video background — always muted; pacto.mp3 is the only audio source on the page */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      >
        <source src={VIDEO_FILE} type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* Content overlay */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 z-10">
        <Reveal>
          <h2 className="text-4xl sm:text-5xl md:text-6xl mb-6" style={{ fontFamily: SCRIPT, color: CREAM }}>
            Cordón de tres dobleces
          </h2>
          <Ornament />
          <p className="text-base leading-relaxed max-w-md mx-auto mt-6 italic" style={{ fontFamily: SANS, color: "#E8DECE", fontWeight: 300 }}>
            "Y si alguno prevaleciere contra uno, dos le resistirán; y cordón de tres dobleces no se rompe pronto."
          </p>
          <p className="text-xs tracking-[0.4em] uppercase mt-4" style={{ fontFamily: SANS, color: GOLD }}>
            Eclesiastés 4:12 (RVR1960)
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Timeline Section ─────────────────────────────────────────────────────────

function TimelineContent() {
  const schedule = [
    { time: "4:30 PM", event: "Ceremonia", desc: "Frente al mar" },
    { time: "6:00 PM", event: "Cóctel", desc: "Con familiares y amigos" },
    { time: "7:30 PM", event: "Recepción", desc: "Brindis y bienvenida" },
    { time: "8:30 PM", event: "Cena", desc: "Deliciosa cena servida" },
    { time: "9:30 PM", event: "Fiesta", desc: "A celebrar" },
    { time: "Hasta el amanecer", event: "Sorpresas", desc: "Momentos inolvidables" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Ornament />
      <div className="space-y-6 mt-6">
        {schedule.map((item, idx) => (
          <Reveal key={idx} delay={idx * 0.06}>
            <div className="flex gap-6 items-start">
              {/* Timeline circle and line */}
              <div className="flex flex-col items-center">
                <div
                  className="w-4 h-4 rounded-full z-10 ring-4"
                  style={{
                    background: GOLD,
                    ringColor: "rgba(196,168,130,0.2)",
                  }}
                />
                {idx !== schedule.length - 1 && (
                  <div
                    className="w-1 flex-1"
                    style={{
                      height: "60px",
                      background: `linear-gradient(to bottom, ${GOLD}, transparent)`,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pt-1 pb-4 flex-1">
                <p className="text-[10px] tracking-[0.35em] uppercase mb-2" style={{ fontFamily: SANS, color: GOLD, fontWeight: 600 }}>
                  {item.time}
                </p>
                <h3 className="text-lg mb-1" style={{ fontFamily: SERIF, color: BROWN }}>
                  {item.event}
                </h3>
                <p className="text-sm" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ─── Dress Code Section ───────────────────────────────────────────────────────

function DressCodeContent() {
  const colors = [
    { name: "Blanco", hex: "#FFFBF5", note: "Reservado para los novios" },
    { name: "Arena claro", hex: "#F5EBD9", note: "Reservado para los novios" },
    { name: "Beige claro", hex: "#ECDCC0" },
    { name: "Beige oscuro", hex: "#D4C4A8" },
    { name: "Crema", hex: "#FAF6EE" },
    { name: "Rosa pastel", hex: "#F3D9D5" },
    { name: "Azul pastel", hex: "#D6E4E5" },
    { name: "Verde salvia", hex: "#D9DFC9" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <Ornament />
      <p className="text-sm leading-relaxed max-w-sm mx-auto mt-6 text-center" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
        Acompáñanos vistiendo tonos claros inspirados en la playa. Una paleta elegante y fresca para este hermoso día.
      </p>

      {/* Color palette */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12 mt-8">
        {colors.map((color, idx) => (
          <Reveal key={idx} delay={idx * 0.05}>
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-24 h-24 rounded-lg shadow-md"
                style={{
                  background: color.hex,
                  border: `2px solid ${GOLD}`,
                }}
              />
              <p className="text-sm" style={{ fontFamily: SANS, color: BROWN, fontWeight: 500 }}>
                {color.name}
              </p>
              {color.note && (
                <p className="text-[10px] italic -mt-1.5" style={{ fontFamily: SANS, color: GOLD }}>
                  {color.note}
                </p>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      {/* Guidelines */}
      <Reveal delay={0.3}>
        <div
          className="p-8 rounded-lg"
          style={{
            background: "rgba(196,168,130,0.08)",
            border: `1px solid rgba(196,168,130,0.2)`,
          }}
        >
          <h3 className="text-lg mb-4" style={{ fontFamily: SERIF, color: BROWN }}>
            Recomendaciones
          </h3>
          <ul className="space-y-3 text-sm" style={{ fontFamily: SANS, color: TAN }}>
            <li className="flex gap-3">
              <span style={{ color: GOLD }}>✓</span>
              <span>Colores pasteles y tonos beige son bienvenidos</span>
            </li>
            <li className="flex gap-3">
              <span style={{ color: GOLD }}>✓</span>
              <span>Comodidad es importante (playa y arena)</span>
            </li>
            <li className="flex gap-3">
              <span style={{ color: GOLD }}>✓</span>
              <span>Accesorios dorados complementan perfecto</span>
            </li>
            <li className="flex gap-3">
              <span style={{ color: GOLD }}>✗</span>
              <span>El blanco y el arena claro están reservados para los novios</span>
            </li>
            <li className="flex gap-3">
              <span style={{ color: GOLD }}>✗</span>
              <span>Evitar colores oscuros o fuertes</span>
            </li>
          </ul>
        </div>
      </Reveal>
    </div>
  );
}

// ─── Gallery with Comments Section ────────────────────────────────────────────

function GalleryContent() {
  const allImages = [
    IMG.couple1,
    IMG.couple2,
    IMG.couple3,
    IMG.couple4,
    IMG.couple5,
    "/1777245374090.jpg",
    "/1777858783730 (1).jpg",
    "/primer aniversario.jpg",
    "/1780201087881.jpg",
    "/1780201308415.jpg",
    "/IMG-20250615-WA0024.jpg",
    "/IMG-20250828-WA0013 (1).jpg",
    "/501329850_1868882853952502_5367565030893768263_n (1).jpg",
    "/Screenshot_20251214_230500_WhatsApp.jpg",
  ];

  const [photoData, setPhotoData] = useState<Record<string, GalleryPhotoData>>(() => {
    try { return JSON.parse(localStorage.getItem("gallery_photo_data") || "{}"); } catch { return {}; }
  });
  const [likedByMe, setLikedByMe] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem("gallery_liked") || "[]")); } catch { return new Set(); }
  });
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  useBodyScrollLock(!!activeSrc);
  const [commentForm, setCommentForm] = useState({ name: "", message: "" });

  const scrollerRef = useRef<HTMLDivElement>(null);
  const interactingRef = useRef(false);
  const activeSrcRef = useRef<string | null>(null);
  const resumeTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => { activeSrcRef.current = activeSrc; }, [activeSrc]);

  // Slow, seamless, self-scrolling filmstrip — pauses while the guest interacts or a photo is open
  useEffect(() => {
    let raf: number;
    const step = () => {
      const el = scrollerRef.current;
      if (el && !interactingRef.current && !activeSrcRef.current) {
        el.scrollLeft += 0.5;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pauseAutoScroll = () => {
    interactingRef.current = true;
    window.clearTimeout(resumeTimeoutRef.current);
  };
  const scheduleResume = () => {
    window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => { interactingRef.current = false; }, 2200);
  };

  const getData = (src: string): GalleryPhotoData => photoData[src] ?? { likes: 0, comments: [] };

  const persistPhotoData = (next: Record<string, GalleryPhotoData>) => {
    setPhotoData(next);
    localStorage.setItem("gallery_photo_data", JSON.stringify(next));
  };
  const persistLiked = (next: Set<string>) => {
    setLikedByMe(next);
    localStorage.setItem("gallery_liked", JSON.stringify(Array.from(next)));
  };

  const toggleLike = (src: string) => {
    const isLiked = likedByMe.has(src);
    const data = getData(src);
    persistPhotoData({ ...photoData, [src]: { ...data, likes: Math.max(0, data.likes + (isLiked ? -1 : 1)) } });
    const nextLiked = new Set(likedByMe);
    if (isLiked) nextLiked.delete(src); else nextLiked.add(src);
    persistLiked(nextLiked);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSrc || !commentForm.name.trim() || !commentForm.message.trim()) return;
    const data = getData(activeSrc);
    const newComment: GalleryComment = {
      id: crypto.randomUUID(),
      name: commentForm.name.trim(),
      message: commentForm.message.trim(),
      timestamp: new Date().toISOString(),
    };
    persistPhotoData({ ...photoData, [activeSrc]: { ...data, comments: [...data.comments, newComment] } });
    setCommentForm({ name: "", message: "" });
  };

  const goTo = (dir: 1 | -1) => {
    const idx = activeSrc ? allImages.indexOf(activeSrc) : -1;
    if (idx < 0) return;
    setActiveSrc(allImages[(idx + dir + allImages.length) % allImages.length]);
  };

  return (
    <>
      <div className="max-w-5xl mx-auto">
          <p className="text-xs mt-2 mb-8 text-center" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
            Detente sobre una foto para verla mejor, dale like y déjanos tu comentario
          </p>

          <Reveal delay={0.1}>
          <div
            ref={scrollerRef}
            className="gallery-scroller flex gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            onMouseEnter={pauseAutoScroll}
            onMouseLeave={scheduleResume}
            onTouchStart={pauseAutoScroll}
            onTouchEnd={scheduleResume}
          >
            {[...allImages, ...allImages].map((src, i) => {
              const data = getData(src);
              const liked = likedByMe.has(src);
              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => setActiveSrc(src)}
                  whileHover={{ scale: 1.06, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="relative flex-shrink-0 rounded-lg overflow-hidden"
                  style={{ width: 168, height: 210, boxShadow: "0 4px 14px rgba(60,45,20,0.16)" }}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 45%)" }} />
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[10px]" style={{ fontFamily: SANS, color: CREAM }}>
                    <span className="flex items-center gap-1">
                      <Heart style={{ width: 11, height: 11 }} fill={liked ? GOLD : "none"} stroke={CREAM} />
                      {data.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle style={{ width: 11, height: 11 }} stroke={CREAM} />
                      {data.comments.length}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </Reveal>
      </div>

      {/* Lightbox — like Facebook: view large, like, and comment on this one photo */}
      <AnimatePresence>
        {activeSrc && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: "rgba(20,14,6,0.82)" }}
            onClick={() => setActiveSrc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg"
              style={{ background: "#FFFBF2" }}
            >
              <button
                onClick={() => setActiveSrc(null)}
                aria-label="Cerrar"
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.45)" }}
              >
                <X style={{ width: 16, height: 16, color: CREAM }} />
              </button>

              <div className="relative" style={{ aspectRatio: "4/5" }}>
                <img src={activeSrc} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => goTo(-1)}
                  aria-label="Foto anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.4)" }}
                >
                  <ChevronLeft style={{ width: 20, height: 20, color: CREAM }} />
                </button>
                <button
                  onClick={() => goTo(1)}
                  aria-label="Foto siguiente"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.4)" }}
                >
                  <ChevronRight style={{ width: 20, height: 20, color: CREAM }} />
                </button>
              </div>

              <div className="p-5">
                <button
                  onClick={() => toggleLike(activeSrc)}
                  className="flex items-center gap-2 mb-5 transition-transform active:scale-95"
                >
                  <Heart
                    style={{ width: 22, height: 22 }}
                    fill={likedByMe.has(activeSrc) ? GOLD : "none"}
                    stroke={likedByMe.has(activeSrc) ? GOLD : TAN}
                  />
                  <span className="text-sm" style={{ fontFamily: SANS, color: BROWN }}>
                    {getData(activeSrc).likes} me gusta
                  </span>
                </button>

                {getData(activeSrc).comments.length > 0 && (
                  <div className="space-y-3 mb-5">
                    {getData(activeSrc).comments.map((c) => (
                      <div key={c.id} className="p-3 rounded" style={{ background: "rgba(196,168,130,0.08)" }}>
                        <p className="text-sm mb-1" style={{ fontFamily: SANS, color: BROWN }}>{c.message}</p>
                        <p className="text-[10px] tracking-widest uppercase" style={{ fontFamily: SANS, color: GOLD }}>— {c.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddComment} className="space-y-3">
                  <input
                    type="text" placeholder="Tu nombre" required
                    className="w-full px-0 py-2 bg-transparent border-b text-sm outline-none"
                    style={{ fontFamily: SANS, color: BROWN, borderBottomColor: "rgba(196,168,130,0.4)", borderBottomStyle: "solid", borderBottomWidth: 1 }}
                    value={commentForm.name}
                    onChange={(e) => setCommentForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <textarea
                    placeholder="Deja tu comentario..." rows={2} required
                    className="w-full px-0 py-2 bg-transparent border-b text-sm outline-none resize-none"
                    style={{ fontFamily: SANS, color: BROWN, borderBottomColor: "rgba(196,168,130,0.4)", borderBottomStyle: "solid", borderBottomWidth: 1 }}
                    value={commentForm.message}
                    onChange={(e) => setCommentForm((f) => ({ ...f, message: e.target.value }))}
                  />
                  <GoldButton type="submit" className="w-full py-2.5">
                    <Send style={{ width: 13, height: 13 }} /> Comentar
                  </GoldButton>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const GUEST_MEDIA_DEFAULT_FOLDERS = ["Ceremonia", "Recepción", "Fiesta", "Otros"];

/** Guest-uploaded photos & videos, organized into folders, shared live via Firebase
 *  so the couple and every guest see the same album regardless of device. */
function GuestMediaContent() {
  const [items, setItems] = useState<GuestMediaItem[]>([]);
  const [activeFolder, setActiveFolder] = useState("Todas");
  const [name, setName] = useState("");
  const [folder, setFolder] = useState(GUEST_MEDIA_DEFAULT_FOLDERS[0]);
  const [newFolder, setNewFolder] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [likedByMe, setLikedByMe] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem("guest_media_liked") || "[]")); } catch { return new Set(); }
  });
  const [activeItem, setActiveItem] = useState<GuestMediaItem | null>(null);
  const [comments, setComments] = useState<GuestMediaComment[]>([]);
  const [commentForm, setCommentForm] = useState({ name: "", message: "" });
  useBodyScrollLock(!!activeItem);

  useEffect(() => {
    if (!supabaseReady || !supabase) return;
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("guest_media")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { console.error(error); return; }
      setItems((data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        folder: row.folder,
        url: row.url,
        type: row.type,
        likes: row.likes ?? 0,
        timestamp: row.created_at,
      })));
    };
    fetchItems();

    const channel = supabase
      .channel("guest_media_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "guest_media" }, fetchItems)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // All comments, kept live — filtered per photo/video when the lightbox is open
  useEffect(() => {
    if (!supabaseReady || !supabase) return;
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("guest_media_comments")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) { console.error(error); return; }
      setComments((data ?? []).map((row) => ({
        id: row.id, mediaId: row.media_id, name: row.name, message: row.message, timestamp: row.created_at,
      })));
    };
    fetchComments();

    const channel = supabase
      .channel("guest_media_comments_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "guest_media_comments" }, fetchComments)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !activeItem || !commentForm.name.trim() || !commentForm.message.trim()) return;
    const { error } = await supabase.from("guest_media_comments").insert({
      media_id: activeItem.id,
      name: commentForm.name.trim(),
      message: commentForm.message.trim(),
    });
    if (error) { console.error(error); return; }
    setCommentForm((f) => ({ ...f, message: "" }));
  };

  const folders = Array.from(new Set([...GUEST_MEDIA_DEFAULT_FOLDERS, ...items.map((i) => i.folder)]));

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !supabase) return;
    const targetFolder = newFolder.trim() || folder;
    const type: "photo" | "video" = file.type.startsWith("video") ? "video" : "photo";
    const path = `${targetFolder}/${crypto.randomUUID()}-${file.name}`;

    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage.from(GUEST_MEDIA_BUCKET).upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(GUEST_MEDIA_BUCKET).getPublicUrl(path);
      const { error: insertError } = await supabase.from("guest_media").insert({
        name: name.trim() || "Invitado",
        folder: targetFolder,
        url: urlData.publicUrl,
        type,
        likes: 0,
      });
      if (insertError) throw insertError;
      setFile(null);
      setNewFolder("");
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (id: string) => {
    if (!supabase) return;
    const isLiked = likedByMe.has(id);
    const { error } = await supabase.rpc("increment_like", { row_id: id, delta: isLiked ? -1 : 1 });
    if (error) { console.error(error); return; }
    const next = new Set(likedByMe);
    if (isLiked) next.delete(id); else next.add(id);
    setLikedByMe(next);
    localStorage.setItem("guest_media_liked", JSON.stringify(Array.from(next)));
  };

  const visible = activeFolder === "Todas" ? items : items.filter((i) => i.folder === activeFolder);

  return (
    <div className="max-w-4xl mx-auto">
          <Ornament />
          <p className="text-xs mt-2 mb-8 max-w-md mx-auto text-center" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
            Sube las fotos y videos que tomes el día de la boda — quedan aquí para que todos, incluidos nosotros, las veamos juntos.
          </p>

        {!supabaseReady ? (
          <Reveal delay={0.1}>
            <div className="text-center py-12 px-6" style={{ background: "rgba(196,168,130,0.08)", border: `1px dashed rgba(196,168,130,0.35)`, borderRadius: 4 }}>
              <Upload style={{ width: 22, height: 22, color: GOLD, margin: "0 auto 10px" }} />
              <p className="text-sm" style={{ fontFamily: SERIF, color: BROWN, fontStyle: "italic" }}>
                Este álbum compartido se activará muy pronto — estamos preparando el espacio para que todos puedan subir y ver fotos y videos juntos.
              </p>
            </div>
          </Reveal>
        ) : (
          <>
            <Reveal delay={0.1}>
              <form onSubmit={handleUpload} className="mb-10 p-6 space-y-4" style={{ background: CREAM, border: `1px solid rgba(196,168,130,0.25)`, borderRadius: 6 }}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text" placeholder="Tu nombre"
                    className="w-full px-0 py-2 bg-transparent border-b text-sm outline-none"
                    style={{ fontFamily: SANS, color: BROWN, borderBottomColor: "rgba(196,168,130,0.4)", borderBottomStyle: "solid", borderBottomWidth: 1 }}
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                  <select
                    className="w-full px-0 py-2 bg-transparent border-b text-sm outline-none"
                    style={{ fontFamily: SANS, color: BROWN, borderBottomColor: "rgba(196,168,130,0.4)", borderBottomStyle: "solid", borderBottomWidth: 1 }}
                    value={folder} onChange={(e) => setFolder(e.target.value)}
                  >
                    {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <FolderPlus style={{ width: 14, height: 14, color: GOLD, flexShrink: 0 }} />
                  <input
                    type="text" placeholder="O crea una carpeta nueva (ej. Luna de miel)"
                    className="w-full px-0 py-2 bg-transparent border-b text-sm outline-none"
                    style={{ fontFamily: SANS, color: BROWN, borderBottomColor: "rgba(196,168,130,0.4)", borderBottomStyle: "solid", borderBottomWidth: 1 }}
                    value={newFolder} onChange={(e) => setNewFolder(e.target.value)}
                  />
                </div>

                <label className="flex items-center gap-3 px-4 py-3 cursor-pointer" style={{ border: `1px dashed rgba(196,168,130,0.45)`, borderRadius: 4 }}>
                  <Upload style={{ width: 16, height: 16, color: GOLD, flexShrink: 0 }} />
                  <span className="text-xs truncate" style={{ fontFamily: SANS, color: file ? BROWN : TAN }}>
                    {file ? file.name : "Selecciona una foto o video"}
                  </span>
                  <input type="file" accept="image/*,video/*" className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>

                <GoldButton type="submit" disabled={!file || uploading} className="w-full py-3">
                  {uploading
                    ? <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                    : <><Upload style={{ width: 14, height: 14 }} /> Subir</>}
                </GoldButton>
              </form>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {["Todas", ...folders].map((f) => (
                  <button key={f} onClick={() => setActiveFolder(f)}
                    className="px-4 py-2 text-[10px] tracking-widest uppercase transition-all"
                    style={{
                      fontFamily: SANS,
                      background: activeFolder === f ? `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})` : "transparent",
                      color: activeFolder === f ? CREAM : TAN,
                      border: activeFolder === f ? "none" : `1px solid rgba(196,168,130,0.35)`,
                      borderRadius: 999,
                    }}>
                    {f}
                  </button>
                ))}
              </div>
            </Reveal>

            {visible.length === 0 ? (
              <p className="text-center text-sm py-10" style={{ fontFamily: SERIF, color: TAN, fontStyle: "italic" }}>
                Aún no hay nada en esta carpeta — ¡sé el primero en compartir!
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {visible.map((item, i) => {
                  const liked = likedByMe.has(item.id);
                  const commentCount = comments.filter((c) => c.mediaId === item.id).length;
                  return (
                    <Reveal key={item.id} delay={Math.min(i * 0.03, 0.3)}>
                      <motion.button
                        type="button"
                        onClick={() => setActiveItem(item)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative w-full rounded-lg overflow-hidden"
                        style={{ aspectRatio: "4/5" }}
                      >
                        {item.type === "photo" ? (
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                        )}
                        {item.type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.15)" }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
                              <Video style={{ width: 16, height: 16, color: CREAM }} />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 flex items-center justify-between"
                          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
                          <span className="text-[9px] tracking-widest uppercase truncate" style={{ fontFamily: SANS, color: CREAM }}>{item.name}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="flex items-center gap-1">
                              <Heart style={{ width: 12, height: 12 }} fill={liked ? GOLD : "none"} stroke={CREAM} />
                              <span className="text-[10px]" style={{ fontFamily: SANS, color: CREAM }}>{item.likes}</span>
                            </span>
                            {commentCount > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageCircle style={{ width: 12, height: 12 }} stroke={CREAM} />
                                <span className="text-[10px]" style={{ fontFamily: SANS, color: CREAM }}>{commentCount}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Lightbox — foto/video grande, like, y comentarios en tiempo real para todos */}
        <AnimatePresence>
          {activeItem && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center p-4"
              style={{ background: "rgba(20,14,6,0.85)" }}
              onClick={() => setActiveItem(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg"
                style={{ background: "#FFFBF2" }}
              >
                <button
                  onClick={() => setActiveItem(null)}
                  aria-label="Cerrar"
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.45)" }}
                >
                  <X style={{ width: 16, height: 16, color: CREAM }} />
                </button>

                <div style={{ aspectRatio: "4/5" }}>
                  {activeItem.type === "photo" ? (
                    <img src={activeItem.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={activeItem.url} className="w-full h-full object-cover" controls autoPlay playsInline />
                  )}
                </div>

                <div className="p-5">
                  <button
                    onClick={() => toggleLike(activeItem.id)}
                    className="flex items-center gap-2 mb-2 transition-transform active:scale-95"
                  >
                    <Heart
                      style={{ width: 20, height: 20 }}
                      fill={likedByMe.has(activeItem.id) ? GOLD : "none"}
                      stroke={likedByMe.has(activeItem.id) ? GOLD : TAN}
                    />
                    <span className="text-sm" style={{ fontFamily: SANS, color: BROWN }}>{activeItem.likes} me gusta</span>
                  </button>
                  <p className="text-[10px] tracking-widest uppercase mb-5" style={{ fontFamily: SANS, color: GOLD }}>
                    Subido por {activeItem.name}
                  </p>

                  {comments.filter((c) => c.mediaId === activeItem.id).length > 0 && (
                    <div className="space-y-3 mb-5">
                      {comments.filter((c) => c.mediaId === activeItem.id).map((c) => (
                        <div key={c.id} className="p-3 rounded" style={{ background: "rgba(196,168,130,0.08)" }}>
                          <p className="text-sm mb-1" style={{ fontFamily: SANS, color: BROWN }}>{c.message}</p>
                          <p className="text-[10px] tracking-widest uppercase" style={{ fontFamily: SANS, color: GOLD }}>— {c.name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAddComment} className="space-y-3">
                    <input
                      type="text" placeholder="Tu nombre" required
                      className="w-full px-0 py-2 bg-transparent border-b text-sm outline-none"
                      style={{ fontFamily: SANS, color: BROWN, borderBottomColor: "rgba(196,168,130,0.4)" }}
                      value={commentForm.name}
                      onChange={(e) => setCommentForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    <textarea
                      placeholder="Deja tu comentario..." rows={2} required
                      className="w-full px-0 py-2 bg-transparent border-b text-sm outline-none resize-none"
                      style={{ fontFamily: SANS, color: BROWN, borderBottomColor: "rgba(196,168,130,0.4)" }}
                      value={commentForm.message}
                      onChange={(e) => setCommentForm((f) => ({ ...f, message: e.target.value }))}
                    />
                    <GoldButton type="submit" className="w-full py-2.5">
                      <Send style={{ width: 13, height: 13 }} /> Comentar
                    </GoldButton>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}

/** A lightweight, optional way for any guest to leave a short video greeting —
 *  decoupled from the formal RSVP, stored in its own collection. */
/** Se abre automáticamente justo después de confirmar asistencia. Graba en vivo
 *  con la cámara del invitado (getUserMedia + MediaRecorder) y el video queda
 *  guardado como un video más de la galería, en la carpeta "Invitados". */
function VideoGreetingModal({ open, onClose, guestName }: { open: boolean; onClose: () => void; guestName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [name, setName] = useState(guestName);
  const [phase, setPhase] = useState<"idle" | "requesting" | "recording" | "preview" | "uploading" | "done" | "error">("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { setName(guestName); }, [guestName]);
  useBodyScrollLock(open);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Reset to a clean, camera-off state every time the modal (re)opens — no
  // permission is requested here. Nada pasa hasta que el invitado decida.
  useEffect(() => {
    if (!open) { stopStream(); return; }
    setPhase("idle");
    setRecordedBlob(null);
    setRecordedUrl(null);
    setErrorMsg("");
    return () => stopStream();
  }, [open]);

  // Se llama SIEMPRE directo desde el clic de "Grabar" — nunca desde un
  // useEffect — para que el navegador (Safari en particular) reconozca el
  // pedido de cámara/micrófono como una acción real del invitado y no lo
  // bloquee silenciosamente.
  const handleRecordTap = async () => {
    setPhase("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setPhase("preview");
      };
      recorder.start();
      recorderRef.current = recorder;
      setPhase("recording");
    } catch (err) {
      console.error(err);
      setErrorMsg("No pudimos acceder a tu cámara. Revisa los permisos del navegador, o simplemente omite este paso — tu confirmación ya quedó guardada.");
      setPhase("error");
    }
  };

  const stopRecording = () => recorderRef.current?.stop();

  const retake = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    stopStream();
    setPhase("idle");
  };

  const handleUpload = async () => {
    if (!recordedBlob || !supabase) return;
    setPhase("uploading");
    try {
      const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      const path = `Invitados/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(GUEST_MEDIA_BUCKET)
        .upload(path, recordedBlob, { contentType: recordedBlob.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(GUEST_MEDIA_BUCKET).getPublicUrl(path);
      const { error: insertError } = await supabase.from("guest_media").insert({
        name: name.trim() || "Invitado",
        folder: "Invitados",
        url: urlData.publicUrl,
        type: "video",
        likes: 0,
      });
      if (insertError) throw insertError;
      stopStream();
      setPhase("done");
    } catch (err) {
      console.error(err);
      setErrorMsg("No pudimos subir tu video. Intenta de nuevo.");
      setPhase("error");
    }
  };

  if (!open) return null;

  // Portal: este modal debe cubrir toda la pantalla sin importar dónde viva en
  // el árbol de React. Si se renderizara anidado dentro del modal del Hub
  // (que anima con Framer Motion vía `scale`/`y`, es decir con un `transform`
  // CSS activo), ese ancestro se convertiría en el "contenedor" de cualquier
  // `position: fixed` interno — el modal de video quedaría atrapado y
  // recortado ahí adentro en vez de cubrir el viewport real. El portal lo
  // saca directo a document.body, evitando ese problema por completo.
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        style={{ background: "rgba(20,14,6,0.88)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-lg"
          style={{ background: "#FFFBF2" }}
        >
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <X style={{ width: 16, height: 16, color: CREAM }} />
          </button>

          <div className="p-6 text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ fontFamily: SANS, color: GOLD }}>
              ¡Gracias por confirmar!
            </p>
            <h3 className="text-2xl mb-4" style={{ fontFamily: SCRIPT, color: "#5C4A32" }}>
              Déjanos un recuerdo en video
            </h3>

            {phase !== "done" ? (
              <>
                <div className="relative rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "3/4", background: "#1a1208" }}>
                  {phase === "preview" && recordedUrl ? (
                    <video src={recordedUrl} controls autoPlay playsInline className="w-full h-full object-cover" />
                  ) : (
                    <video ref={videoRef} muted autoPlay playsInline className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                  )}
                  {(phase === "idle" || phase === "requesting" || phase === "error") && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <Video style={{ width: 28, height: 28, color: "rgba(255,255,255,0.35)" }} />
                      {phase === "requesting" && (
                        <span className="text-[10px] tracking-widest uppercase" style={{ fontFamily: SANS, color: "rgba(255,255,255,0.6)" }}>
                          Solicitando permiso…
                        </span>
                      )}
                    </div>
                  )}
                  {phase === "recording" && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <motion.div className="w-2 h-2 rounded-full" style={{ background: "#e05252" }}
                        animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                      <span className="text-[10px] tracking-widest uppercase" style={{ fontFamily: SANS, color: CREAM }}>Grabando</span>
                    </div>
                  )}
                </div>

                {phase !== "error" && (
                  <input
                    type="text" placeholder="Tu nombre"
                    className="w-full px-0 py-2 mb-4 bg-transparent border-b text-sm outline-none text-center"
                    style={{ fontFamily: SANS, color: BROWN, borderBottomColor: "rgba(196,168,130,0.4)" }}
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                )}

                {phase === "error" && (
                  <p className="text-xs mb-4" style={{ fontFamily: SANS, color: "#9C5A3A" }}>{errorMsg}</p>
                )}

                {(phase === "idle" || phase === "error") && (
                  <GoldButton onClick={handleRecordTap} className="w-full py-3">
                    <Video style={{ width: 14, height: 14 }} /> Grabar
                  </GoldButton>
                )}
                {phase === "requesting" && (
                  <GoldButton disabled className="w-full py-3">
                    <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  </GoldButton>
                )}
                {phase === "recording" && (
                  <GoldButton onClick={stopRecording} className="w-full py-3">
                    Detener grabación
                  </GoldButton>
                )}
                {phase === "preview" && (
                  <div className="flex gap-3">
                    <button type="button" onClick={retake}
                      className="flex-1 py-3 text-xs tracking-widest uppercase"
                      style={{ fontFamily: SANS, color: TAN, border: `1px solid rgba(196,168,130,0.35)`, borderRadius: 2 }}>
                      Regrabar
                    </button>
                    <GoldButton onClick={handleUpload} className="flex-1 py-3">
                      <Send style={{ width: 13, height: 13 }} /> Enviar video
                    </GoldButton>
                  </div>
                )}
                {phase === "uploading" && (
                  <GoldButton disabled className="w-full py-3">
                    <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  </GoldButton>
                )}

                <button onClick={onClose} className="w-full text-center text-xs mt-4" style={{ fontFamily: SANS, color: "rgba(156,130,114,0.7)" }}>
                  {phase === "idle" || phase === "error" ? "Omitir — mi asistencia ya quedó confirmada" : "Omitir por ahora"}
                </button>
              </>
            ) : (
              <div className="py-6">
                <Heart style={{ width: 32, height: 32, fill: GOLD, color: GOLD, margin: "0 auto 14px" }} />
                <p className="text-sm mb-6" style={{ fontFamily: SANS, color: TAN }}>
                  ¡Gracias por tu recuerdo! Ya está en nuestra galería. 🤍
                </p>
                <GoldButton onClick={onClose} className="w-full py-3">Cerrar</GoldButton>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

/** "Nosotros" — the curated gallery and guest uploads, always visible (not behind a circle). */
function NosotrosSection() {
  return (
    <section className="py-20 px-6" style={{ background: "linear-gradient(160deg, #FAF8F3 0%, #F2EDE3 100%)" }}>
      <Reveal>
        <div className="text-center mb-4">
          <SectionTitle>Nosotros</SectionTitle>
          <Ornament />
        </div>
      </Reveal>

      <GalleryContent />

      <Reveal delay={0.1}>
        <div className="text-center mt-16 mb-2">
          <p className="text-[10px] tracking-[0.35em] uppercase mb-2" style={{ fontFamily: SANS, color: GOLD }}>
            Comparte con nosotros
          </p>
          <h3 className="text-2xl" style={{ fontFamily: SCRIPT, color: "#5C4A32" }}>
            Sube tus fotos, videos y recuerdos
          </h3>
        </div>
      </Reveal>
      <GuestMediaContent />
    </section>
  );
}

function OurStoryContent() {
  const milestones = [
    { date: "Febrero 2025",   title: "El primer encuentro",     desc: "Nos conocimos en el gimnasio. Yo vendía champús y no pude evitar fijarme en lo hermoso de su cabello — fue la excusa perfecta para acercarme a ella.", img: IMG.historiaEncuentro },
    { date: "Febrero 2025",   title: "La invitación a la iglesia", desc: "Poco después la invité a la iglesia. Nos gustó tanto ir juntos que fue el primer paso de algo que Dios ya había preparado para nosotros.", img: IMG.historiaIglesia },
    { date: "Abril 2025",     title: "Nuestra primera cita",    desc: "En abril tuvimos nuestra primera cita, entre risas y buena mesa — y supimos que queríamos muchos más momentos así.", img: IMG.historiaCita },
    { date: "31 Mayo 2025",   title: "Novios",                  desc: "El 31 de mayo formalizamos nuestro amor y comenzamos esta historia juntos, de la mano.", img: IMG.historiaNovios },
    { date: "25 Feb 2026",    title: "El compromiso",           desc: "En casa, rodeados de quienes más amamos, el día de su cumpleaños, le pedí matrimonio a Ingrid — y ella dijo que sí.", img: IMG.historiaCompromiso },
    { date: "5 Dic 2026",     title: "Para siempre",            desc: "El capítulo más bello de nuestra historia comienza aquí, con Él como fundamento.", img: IMG.historiaBoda },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <Ornament />
      <div className="space-y-14 mt-8">
        {milestones.map((m, i) => (
          <Reveal key={i} delay={i * 0.08} x={i % 2 === 0 ? -25 : 25} y={0}>
            <div className={`flex gap-5 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
              <div className="flex-shrink-0 rounded-sm overflow-hidden" style={{
                width: 80, minHeight: 100,
                backgroundImage: `url(${m.img})`,
                backgroundSize: "cover", backgroundPosition: "center",
              }} />
              <div className={`flex flex-col justify-center ${i % 2 !== 0 ? "items-end text-right" : ""}`}>
                <span className="text-[10px] tracking-[0.35em] uppercase mb-1" style={{ fontFamily: SANS, color: GOLD }}>
                  {m.date}
                </span>
                <h3 className="text-xl mb-2" style={{ fontFamily: SERIF, color: BROWN }}>{m.title}</h3>
                <p className="text-xs leading-relaxed" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
                  {m.desc}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function MapSection() {
  return (
    <section className="py-28 px-6" style={{ background: "#FAF8F3" }}>
      <div className="max-w-2xl mx-auto">
        <Reveal>
          <div className="text-center mb-12">
            <SectionLabel>Ubicación</SectionLabel>
            <SectionTitle>Cómo llegar</SectionTitle>
            <Ornament />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="overflow-hidden mb-6" style={{ border: `1px solid rgba(196,168,130,0.28)`, borderRadius: 2 }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62617.8!2d-75.6939!3d9.4012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e59af1e32c2dab3%3A0x6c5b38e49f39e543!2sCove%C3%B1as%2C+Sucre%2C+Colombia!5e0!3m2!1ses!2sco!4v1"
              width="100%" height="280" style={{ border: 0 }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              title="Playa Francés, Coveñas"
            />
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <GoldButton onClick={() => window.open("https://www.google.com/maps/dir/?api=1&destination=Cove%C3%B1as,Sucre,Colombia", "_blank")}>
              <Navigation style={{ width: 15, height: 15 }} /> Cómo llegar
            </GoldButton>
            <a href="https://maps.google.com/?q=Playa+Frances+Covenas+Sucre+Colombia"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 text-xs tracking-[0.3em] uppercase transition-all duration-300"
              style={{ fontFamily: SANS, color: TAN, border: `1px solid rgba(196,168,130,0.4)`, borderRadius: 2, fontWeight: 500 }}>
              <ExternalLink style={{ width: 15, height: 15 }} /> Abrir en Google Maps
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Gifts ────────────────────────────────────────────────────────────────────

function GiftsContent() {
  const [showDigital, setShowDigital] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      <Ornament />

      {/* What matters most — their company, not the gift */}
      <Reveal delay={0.1}>
        <div className="mb-10 mt-6 p-8" style={{ background: "rgba(196,168,130,0.1)", border: `1px solid rgba(196,168,130,0.28)`, borderRadius: 6 }}>
          <Heart style={{ width: 22, height: 22, color: GOLD, margin: "0 auto 12px" }} fill={GOLD} />
          <p className="text-lg leading-relaxed" style={{ fontFamily: SCRIPT, color: "#5C4A32" }}>
            Lo más importante para nosotros es que nos acompañen ese día.
          </p>
          <p className="text-xs mt-3" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
            Su presencia ya es el regalo más grande — nada de esto es obligatorio.
          </p>
        </div>
      </Reveal>

      {/* Optional gift options */}
      <Reveal delay={0.25}>
        <p className="text-[10px] tracking-[0.35em] uppercase mb-6" style={{ fontFamily: SANS, color: GOLD }}>
          Si deseas tener un detalle (opcional)
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="flex-1 flex flex-col items-center gap-2 px-6 py-6" style={{ border: `1px solid rgba(196,168,130,0.42)`, borderRadius: 4, background: "rgba(250,246,238,0.7)" }}>
            <Gift style={{ width: 20, height: 20, color: GOLD }} />
            <p className="text-sm tracking-widest uppercase" style={{ fontFamily: SANS, color: "#5C4A32" }}>Lluvia de sobres</p>
            <p className="text-xs leading-relaxed" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
              Habrá un buzón especial el día de la boda
            </p>
          </div>
          <button
            onClick={() => setShowDigital(true)}
            className="flex-1 flex flex-col items-center gap-2 px-6 py-6 transition-transform active:scale-95"
            style={{ border: `1px solid rgba(196,168,130,0.42)`, borderRadius: 4, background: "rgba(250,246,238,0.7)" }}
          >
            <Banknote style={{ width: 20, height: 20, color: GOLD }} />
            <p className="text-sm tracking-widest uppercase" style={{ fontFamily: SANS, color: "#5C4A32" }}>Digital</p>
            <p className="text-xs" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>Toca para ver</p>
          </button>
        </div>
      </Reveal>

      {/* Digital gift popup */}
      <AnimatePresence>
        {showDigital && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            style={{ background: "rgba(20,14,6,0.85)" }}
            onClick={() => setShowDigital(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-xs w-full p-8 text-center rounded-lg relative"
              style={{ background: "#FFFBF2", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}
            >
              <button
                onClick={() => setShowDigital(false)}
                aria-label="Cerrar"
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(58,48,42,0.08)" }}
              >
                <X style={{ width: 15, height: 15, color: BROWN }} />
              </button>
              <Banknote style={{ width: 26, height: 26, color: GOLD, margin: "0 auto 14px" }} />
              <p className="text-xs tracking-widest uppercase mb-1" style={{ fontFamily: SANS, color: GOLD }}>Nequi o Llave</p>
              <p className="text-2xl mb-4 tracking-wide" style={{ fontFamily: SERIF, color: BROWN }}>311 272 6359</p>
              <p style={{ fontFamily: SCRIPT, color: "#8A6A3A", fontSize: 20 }}>
                Dios te bendiga por tu corazón 🤍
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Love Notes ───────────────────────────────────────────────────────────────

function LoveNotesContent() {
  const [notes, setNotes] = useState<{ name: string; note: string; id: string }[]>(() =>
    JSON.parse(localStorage.getItem("love_notes") || "[]")
  );
  const [form, setForm] = useState({ name: "", note: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.note.trim()) return;
    setLoading(true);
    const entry = { id: crypto.randomUUID(), name: form.name.trim(), note: form.note.trim() };
    const updated = [...notes, entry];
    localStorage.setItem("love_notes", JSON.stringify(updated));
    setTimeout(() => {
      setNotes(updated);
      setSubmitted(true);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto">
          <Ornament />
          <p className="text-sm leading-relaxed max-w-sm mx-auto mt-6 mb-12 text-center" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
            Déjanos una nota de tu corazón. La leeremos en nuestro matrimonio y guardaremos para siempre.
          </p>

        {/* Notes display */}
        {notes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {notes.map((n, i) => (
              <Reveal key={n.id} delay={i * 0.06}>
                <div className="p-5 relative" style={{
                  background: i % 3 === 0 ? "#FAF6EE" : i % 3 === 1 ? "#F5EFE2" : "#F0EBD8",
                  border: `1px solid rgba(196,168,130,0.22)`,
                  borderRadius: 2,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}>
                  <PenLine style={{ width: 14, height: 14, color: GOLD, position: "absolute", top: 14, right: 14 }} />
                  <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: SERIF, color: BROWN, fontStyle: "italic" }}>
                    "{n.note}"
                  </p>
                  <p className="text-[10px] tracking-widest uppercase" style={{ fontFamily: SANS, color: GOLD }}>
                    — {n.name}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* Form */}
        {!submitted ? (
          <Reveal delay={0.15}>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
              <input
                type="text" placeholder="Tu nombre" required
                className="w-full px-0 py-3 bg-transparent border-b text-sm outline-none"
                style={{ fontFamily: SANS, color: BROWN, borderBottomColor: "rgba(196,168,130,0.4)", borderBottomStyle: "solid", borderBottomWidth: 1 }}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <textarea
                placeholder="Escribe tu nota de amor o deseo para los novios…"
                rows={4} required
                className="w-full px-0 py-3 bg-transparent border-b text-sm outline-none resize-none"
                style={{ fontFamily: SANS, color: BROWN, borderBottomColor: "rgba(196,168,130,0.4)", borderBottomStyle: "solid", borderBottomWidth: 1 }}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
              <GoldButton type="submit" disabled={loading} className="w-full py-4">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  : <><Heart style={{ width: 14, height: 14 }} /> Enviar mi nota</>
                }
              </GoldButton>
            </form>
          </Reveal>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center py-8"
          >
            <p className="text-2xl mb-3" style={{ fontFamily: SCRIPT, color: "#8A6A3A" }}>
              ¡Gracias por tu nota!
            </p>
            <p className="text-sm" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
              La leeremos con mucho amor en nuestro matrimonio. 🤍
            </p>
          </motion.div>
        )}
    </div>
  );
}

// ─── RSVP ─────────────────────────────────────────────────────────────────────

function RSVPContent({ onSuccess, initialName = "", guest }: { onSuccess: (name: string) => void; initialName?: string; guest: GuestRecord | null }) {
  const [form, setForm] = useState({
    name: initialName, phone: "", attending: "yes", dietary: "", message: "",
    attendeeCount: guest?.passes ?? 1, songRequest: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // El objetivo de la invitación es que la persona quede confirmada — punto.
  // Intentamos guardar en Supabase primero (para que ustedes lo vean en el
  // panel y en tiempo real), pero si eso falla por cualquier motivo (columna
  // faltante, red, lo que sea), guardamos internamente en este mismo
  // dispositivo como respaldo silencioso y dejamos pasar al invitado de
  // todas formas. Nunca debe quedarse colgado en el formulario.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const attendeeCount = form.attending === "yes" ? form.attendeeCount : 0;
    let savedRemotely = false;

    if (supabaseReady && supabase) {
      try {
        const { error } = await supabase.from("rsvps").insert({
          name: form.name,
          attending: form.attending === "yes",
          dietary: form.dietary,
          love_note: form.message,
          phone: form.phone,
          video_url: null,
          guest_id: guest?.id ?? null,
          attendee_count: attendeeCount,
          song_request: form.songRequest || null,
        });
        if (error) throw error;
        savedRemotely = true;
      } catch (err) {
        console.error("No se pudo guardar en Supabase, se guarda internamente como respaldo:", err);
      }
    }

    if (!savedRemotely) {
      try {
        const entry: RSVPEntry = {
          id: crypto.randomUUID(),
          name: form.name,
          attending: form.attending === "yes",
          dietary: form.dietary,
          loveNote: form.message,
          phone: form.phone,
          videoUrl: null,
          attendeeCount,
          songRequest: form.songRequest || null,
          timestamp: new Date().toISOString(),
        };
        const prev: RSVPEntry[] = JSON.parse(localStorage.getItem("rsvp_entries") || "[]");
        localStorage.setItem("rsvp_entries", JSON.stringify([...prev, entry]));
      } catch (err) {
        console.error("Tampoco se pudo guardar localmente:", err);
      }
    }

    setLoading(false);
    onSuccess(form.name);
  };

  const lineStyle = {
    fontFamily: SANS, color: BROWN,
    borderBottomColor: "rgba(196,168,130,0.38)",
    borderBottomStyle: "solid" as const,
    borderBottomWidth: 1,
  };

  return (
    <div className="max-w-md mx-auto">
      <Ornament />

      {guest && (
        <p className="text-center text-xs mb-6 -mt-2" style={{ fontFamily: SANS, color: TAN }}>
          Tienen <strong style={{ color: BROWN }}>{guest.passes}</strong> {guest.passes === 1 ? "pase disponible" : "pases disponibles"}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 mt-2 text-left">
        <Reveal>
          <input required type="text" placeholder="Nombre completo *"
            className="w-full px-0 py-3 bg-transparent border-b outline-none text-sm placeholder:text-[#C4A882]/50"
            style={lineStyle} value={form.name} onChange={set("name")} />
        </Reveal>

        <Reveal delay={0.05}>
          <input type="tel" placeholder="Número de celular"
            className="w-full px-0 py-3 bg-transparent border-b outline-none text-sm placeholder:text-[#C4A882]/50"
            style={lineStyle} value={form.phone} onChange={set("phone")} />
        </Reveal>

        <Reveal delay={0.1}>
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ fontFamily: SANS, color: GOLD }}>¿Asistirá?</p>
            <div className="flex gap-8">
              {[{ val: "yes", label: "Sí, con gusto" }, { val: "no", label: "No podré asistir" }].map((opt) => (
                <label key={opt.val} className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => setForm((f) => ({ ...f, attending: opt.val }))}>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center transition-all"
                    style={{ border: `2px solid ${form.attending === opt.val ? GOLD : "rgba(196,168,130,0.45)"}` }}>
                    {form.attending === opt.val && <div className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
                  </div>
                  <span className="text-sm" style={{ fontFamily: SANS, color: TAN }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </Reveal>

        {guest && form.attending === "yes" && (
          <Reveal delay={0.12}>
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ fontFamily: SANS, color: GOLD }}>
                ¿Cuántos de ustedes asistirán?
              </p>
              <div className="flex items-center gap-5">
                <button type="button"
                  onClick={() => setForm((f) => ({ ...f, attendeeCount: Math.max(1, f.attendeeCount - 1) }))}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ border: `1px solid rgba(196,168,130,0.4)`, color: GOLD }}>
                  <Minus style={{ width: 14, height: 14 }} />
                </button>
                <span className="text-xl" style={{ fontFamily: SERIF, color: BROWN }}>{form.attendeeCount}</span>
                <button type="button"
                  onClick={() => setForm((f) => ({ ...f, attendeeCount: Math.min(guest.passes, f.attendeeCount + 1) }))}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ border: `1px solid rgba(196,168,130,0.4)`, color: GOLD }}>
                  <Plus style={{ width: 14, height: 14 }} />
                </button>
                <span className="text-xs" style={{ fontFamily: SANS, color: TAN }}>de {guest.passes} pases</span>
              </div>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.15}>
          <input type="text" placeholder="Restricciones alimenticias"
            className="w-full px-0 py-3 bg-transparent border-b outline-none text-sm placeholder:text-[#C4A882]/50"
            style={lineStyle} value={form.dietary} onChange={set("dietary")} />
        </Reveal>

        <Reveal delay={0.18}>
          <label className="flex items-center gap-3 px-4 py-3 cursor-text" style={{ border: `1px dashed rgba(196,168,130,0.45)`, borderRadius: 4 }}>
            <Music style={{ width: 16, height: 16, color: GOLD, flexShrink: 0 }} />
            <input type="text" placeholder="Una canción que no puede faltar (opcional)"
              className="w-full bg-transparent outline-none text-sm"
              style={{ fontFamily: SANS, color: BROWN }}
              value={form.songRequest} onChange={set("songRequest")} />
          </label>
        </Reveal>

        <Reveal delay={0.2}>
          <textarea placeholder="Un mensaje para los novios (opcional)" rows={3}
            className="w-full px-0 py-3 bg-transparent border-b outline-none text-sm resize-none placeholder:text-[#C4A882]/50"
            style={lineStyle} value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
        </Reveal>

        <Reveal delay={0.25}>
          <GoldButton type="submit" disabled={loading} className="w-full py-4">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
              : <><Send style={{ width: 15, height: 15 }} /> Confirmar asistencia</>
            }
          </GoldButton>
        </Reveal>
      </form>
    </div>
  );
}

// ─── Thank You ────────────────────────────────────────────────────────────────

function ThankYouContent({ name }: { name: string }) {
  return (
    <div className="max-w-md mx-auto text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
        style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})` }}
      >
        <Heart style={{ width: 32, height: 32, fill: CREAM, color: CREAM }} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h2 className="text-4xl" style={{ fontFamily: SERIF, color: "#3A302A", fontStyle: "italic" }}>¡Gracias, {name}!</h2>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <Ornament />
        <p className="text-sm leading-loose" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
          Tu confirmación ha sido recibida con mucho amor. Que Dios te bendiga por acompañarnos en este día tan especial.
        </p>

        <div className="mt-10 py-6 px-8 text-center" style={{
          background: "rgba(242,237,227,0.6)",
          border: `1px solid rgba(196,168,130,0.22)`, borderRadius: 2,
        }}>
          <svg width="16" height="22" viewBox="0 0 16 22" fill="none" className="mx-auto mb-3">
            <rect x="7" y="0" width="2" height="22" rx="1" fill={GOLD} opacity="0.7" />
            <rect x="0" y="7" width="16" height="2" rx="1" fill={GOLD} opacity="0.7" />
          </svg>
          <p className="text-xl mb-1" style={{ fontFamily: SCRIPT, color: "#8A6A3A" }}>Ingrid & Douglas</p>
          <p className="text-[10px] tracking-widest uppercase" style={{ fontFamily: SANS, color: GOLD }}>
            5 · XII · 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/** Whichever the guest hasn't done yet: the RSVP form, or (once submitted) the thank-you screen. */
function RSVPHubContent({ rsvpName, onSuccess, guestName, guest }: { rsvpName: string | null; onSuccess: (name: string) => void; guestName: string; guest: GuestRecord | null }) {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [confirmedName, setConfirmedName] = useState("");

  const handleSuccess = (name: string) => {
    onSuccess(name);
    setConfirmedName(name);
    setVideoModalOpen(true);
  };

  return (
    <>
      {rsvpName ? <ThankYouContent name={rsvpName} /> : <RSVPContent onSuccess={handleSuccess} initialName={guestName} guest={guest} />}
      <VideoGreetingModal open={videoModalOpen} onClose={() => setVideoModalOpen(false)} guestName={confirmedName} />
    </>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");
  const [linkName, setLinkName] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  useBodyScrollLock(true);

  // Shared across every guest's device once Supabase is configured; otherwise
  // falls back to whatever this browser alone has stored.
  const [entries, setEntries] = useState<RSVPEntry[]>(() =>
    supabaseReady ? [] : JSON.parse(localStorage.getItem("rsvp_entries") || "[]")
  );
  useEffect(() => {
    if (!supabaseReady || !supabase) return;
    const fetchEntries = async () => {
      const { data, error } = await supabase.from("rsvps").select("*").order("created_at", { ascending: false });
      if (error) { console.error(error); return; }
      setEntries((data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        attending: row.attending,
        dietary: row.dietary,
        loveNote: row.love_note,
        phone: row.phone,
        videoUrl: row.video_url ?? null,
        attendeeCount: row.attendee_count ?? null,
        songRequest: row.song_request ?? null,
        timestamp: row.created_at,
      })));
    };
    fetchEntries();
    const channel = supabase
      .channel("rsvps_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps" }, fetchEntries)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const notes: { name: string; note: string; id: string }[] = JSON.parse(localStorage.getItem("love_notes") || "[]");

  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  useEffect(() => {
    if (!supabaseReady || !supabase) return;
    supabase.from("invitados").select("*").order("grupo").order("nombre").then(({ data, error }) => {
      if (error) { console.error(error); return; }
      setGuests((data ?? []).map((row) => ({
        id: row.id, slug: row.slug, displayName: row.nombre, side: row.grupo, passes: row.pases,
      })));
    });
  }, []);

  const copyGuestLink = (slug: string) => {
    const url = `${window.location.origin}${window.location.pathname}?g=${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  };

  const [videoGreetings, setVideoGreetings] = useState<{ id: string; name: string; videoUrl: string }[]>([]);
  useEffect(() => {
    if (!supabaseReady || !supabase) return;
    const fetchGreetings = async () => {
      const { data, error } = await supabase.from("video_greetings").select("*").order("created_at", { ascending: false });
      if (error) { console.error(error); return; }
      setVideoGreetings((data ?? []).map((row) => ({ id: row.id, name: row.name, videoUrl: row.video_url })));
    };
    fetchGreetings();
    const channel = supabase
      .channel("video_greetings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_greetings" }, fetchGreetings)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === "admin2026") { setAuthed(true); setErr(false); } else setErr(true);
  };

  const visible = entries.filter((e) => {
    const ms = e.name.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "all" || (filter === "yes" && e.attending) || (filter === "no" && !e.attending);
    return ms && mf;
  });

  const stats = {
    total:     entries.length,
    confirmed: entries.filter((e) => e.attending).length,
    declined:  entries.filter((e) => !e.attending).length,
    notes:     notes.length,
    videos:    videoGreetings.length,
  };

  if (!authed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,8,3,0.96)" }}>
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm p-8"
          style={{ background: CREAM, border: `1px solid rgba(196,168,130,0.28)`, borderRadius: 2 }}
        >
          <div className="text-center mb-8">
            <Lock style={{ width: 26, height: 26, color: GOLD, display: "block", margin: "0 auto 10px" }} />
            <h2 className="text-2xl" style={{ fontFamily: SERIF, color: BROWN }}>Panel Admin</h2>
            <p className="text-xs mt-1 tracking-widest uppercase" style={{ fontFamily: SANS, color: TAN }}>Ingrid & Douglas · 2026</p>
          </div>
          <form onSubmit={login} className="space-y-5">
            <input type="password" placeholder="Contraseña"
              className="w-full px-0 py-3 bg-transparent border-b outline-none text-sm"
              style={{ fontFamily: SANS, color: BROWN, borderBottomColor: "rgba(196,168,130,0.4)", borderBottomStyle: "solid", borderBottomWidth: 1 }}
              value={pwd} onChange={(e) => setPwd(e.target.value)} />
            {err && <p className="text-xs" style={{ fontFamily: SANS, color: "#C47050" }}>Contraseña incorrecta</p>}
            <GoldButton type="submit" className="w-full py-3">Acceder</GoldButton>
          </form>
          <button className="mt-5 w-full text-center text-xs transition-colors"
            style={{ fontFamily: SANS, color: "rgba(156,130,114,0.55)" }}
            onClick={onClose}>
            Volver a la invitación
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto" style={{ background: "#FAF8F3" }}>
      <div className="max-w-4xl mx-auto p-5 sm:p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl" style={{ fontFamily: SERIF, color: BROWN }}>Panel administrativo</h1>
            <p className="text-[10px] tracking-widest uppercase mt-1" style={{ fontFamily: SANS, color: GOLD }}>
              Ingrid & Douglas · 5 Dic 2026
            </p>
          </div>
          <button onClick={onClose} style={{ color: TAN }}><X style={{ width: 20, height: 20 }} /></button>
        </div>

        {/* Personalized link generator */}
        <div className="mb-8 p-5" style={{ background: CREAM, border: `1px solid rgba(196,168,130,0.25)`, borderRadius: 4 }}>
          <p className="text-[10px] tracking-widest uppercase mb-3" style={{ fontFamily: SANS, color: GOLD }}>
            Generar enlace personalizado
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text" placeholder="Nombre del invitado"
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ fontFamily: SANS, color: BROWN, background: "#FAF8F3", border: `1px solid rgba(196,168,130,0.3)`, borderRadius: 2 }}
              value={linkName}
              onChange={(e) => { setLinkName(e.target.value); setLinkCopied(false); }}
            />
            <button
              onClick={() => {
                if (!linkName.trim()) return;
                const url = `${window.location.origin}${window.location.pathname}?to=${encodeURIComponent(linkName.trim())}`;
                navigator.clipboard.writeText(url).then(() => {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                });
              }}
              disabled={!linkName.trim()}
              className="px-4 py-2 text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
              style={{ fontFamily: SANS, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, color: CREAM, borderRadius: 2 }}
            >
              {linkCopied ? "¡Copiado!" : "Copiar enlace"}
            </button>
          </div>
          {linkName.trim() && (
            <p className="text-xs mt-2 truncate" style={{ fontFamily: SANS, color: TAN }}>
              {window.location.origin}{window.location.pathname}?to={encodeURIComponent(linkName.trim())}
            </p>
          )}
        </div>

        {/* Real guest list with pass counts */}
        {supabaseReady && guests.length > 0 && (
          <div className="mb-8 p-5" style={{ background: CREAM, border: `1px solid rgba(196,168,130,0.25)`, borderRadius: 4 }}>
            <p className="text-[10px] tracking-widest uppercase mb-4" style={{ fontFamily: SANS, color: GOLD }}>
              Enlaces de invitados ({guests.length})
            </p>
            {(["ingrid", "douglas"] as const).map((side) => (
              <div key={side} className="mb-5 last:mb-0">
                <p className="text-xs mb-2 tracking-widest uppercase" style={{ fontFamily: SANS, color: TAN }}>
                  {side === "ingrid" ? "Invitados de Ingrid" : "Invitados de Douglas"}
                </p>
                <div className="space-y-1.5">
                  {guests.filter((g) => g.side === side).map((g) => (
                    <div key={g.id} className="flex items-center justify-between gap-3 px-3 py-2"
                      style={{ background: "#FAF8F3", border: `1px solid rgba(196,168,130,0.18)`, borderRadius: 2 }}>
                      <div className="min-w-0">
                        <p className="text-sm truncate" style={{ fontFamily: SANS, color: BROWN }}>{g.displayName}</p>
                        <p className="text-[10px]" style={{ fontFamily: SANS, color: TAN }}>{g.passes} {g.passes === 1 ? "pase" : "pases"}</p>
                      </div>
                      <button
                        onClick={() => copyGuestLink(g.slug)}
                        className="flex-shrink-0 px-3 py-1.5 text-[10px] tracking-widest uppercase transition-all"
                        style={{
                          fontFamily: SANS,
                          background: copiedSlug === g.slug ? "rgba(196,168,130,0.25)" : `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`,
                          color: copiedSlug === g.slug ? BROWN : CREAM,
                          borderRadius: 2,
                        }}
                      >
                        {copiedSlug === g.slug ? "¡Copiado!" : "Copiar"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Total",       value: stats.total,     Icon: Users },
            { label: "Confirmados", value: stats.confirmed, Icon: Check },
            { label: "No asisten",  value: stats.declined,  Icon: X },
            { label: "Notas amor",  value: stats.notes,     Icon: Heart },
            { label: "Videos",      value: stats.videos,    Icon: Video },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="p-4" style={{ background: CREAM, border: `1px solid rgba(196,168,130,0.22)`, borderRadius: 2 }}>
              <Icon style={{ width: 15, height: 15, color: GOLD, marginBottom: 8 }} />
              <div className="text-3xl mb-0.5" style={{ fontFamily: SERIF, color: BROWN }}>{value}</div>
              <div className="text-[10px] tracking-widest uppercase" style={{ fontFamily: SANS, color: TAN }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: GOLD }} />
            <input type="text" placeholder="Buscar invitado…"
              className="w-full pl-9 pr-4 py-3 text-sm outline-none"
              style={{ fontFamily: SANS, color: BROWN, background: CREAM, border: `1px solid rgba(196,168,130,0.3)`, borderRadius: 2 }}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {(["all", "yes", "no"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2 text-[10px] tracking-widest uppercase transition-all"
                style={{
                  fontFamily: SANS,
                  background: filter === f ? `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})` : "transparent",
                  color: filter === f ? CREAM : TAN,
                  border: filter === f ? "none" : `1px solid rgba(196,168,130,0.35)`,
                  borderRadius: 2,
                }}>
                {f === "all" ? "Todos" : f === "yes" ? "Asisten" : "No asisten"}
              </button>
            ))}
          </div>
        </div>

        {/* RSVP Table */}
        {visible.length === 0 ? (
          <div className="text-center py-16" style={{ fontFamily: SERIF, color: TAN, fontStyle: "italic" }}>
            No hay confirmaciones aún
          </div>
        ) : (
          <div className="overflow-x-auto mb-10" style={{ border: `1px solid rgba(196,168,130,0.2)`, borderRadius: 2 }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: CREAM, borderBottom: `1px solid rgba(196,168,130,0.2)` }}>
                  {["Nombre", "Estado", "Pases", "Teléfono", "Alimentación", "Canción", "Mensaje", "Video"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] tracking-widest uppercase"
                      style={{ fontFamily: SANS, color: GOLD }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: `1px solid rgba(196,168,130,0.1)`, background: i % 2 === 0 ? "#FAF8F3" : CREAM }}>
                    <td className="px-4 py-3" style={{ fontFamily: SANS, color: BROWN }}>{e.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-[10px] tracking-wide uppercase"
                        style={{
                          background: e.attending ? "rgba(196,168,130,0.18)" : "rgba(180,130,110,0.15)",
                          color: e.attending ? "#8A6A3A" : "#9C5A3A",
                          fontFamily: SANS,
                        }}>
                        {e.attending ? "Asiste" : "No asiste"}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ fontFamily: SANS, color: TAN }}>{e.attendeeCount ?? "—"}</td>
                    <td className="px-4 py-3" style={{ fontFamily: SANS, color: TAN }}>{e.phone || "—"}</td>
                    <td className="px-4 py-3" style={{ fontFamily: SANS, color: TAN }}>{e.dietary || "—"}</td>
                    <td className="px-4 py-3 max-w-[140px]" style={{ fontFamily: SANS, color: TAN }}>
                      <span className="block truncate">{e.songRequest || "—"}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs" style={{ fontFamily: SANS, color: TAN }}>
                      <span className="block truncate">{e.loveNote || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {e.videoUrl ? (
                        <a href={e.videoUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] tracking-widest uppercase"
                          style={{ fontFamily: SANS, color: GOLD }}>
                          <Video style={{ width: 12, height: 12 }} /> Ver
                        </a>
                      ) : (
                        <span style={{ fontFamily: SANS, color: TAN }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Love Notes */}
        {notes.length > 0 && (
          <div>
            <h3 className="text-lg mb-4" style={{ fontFamily: SERIF, color: BROWN }}>Notas de amor recibidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notes.map((n) => (
                <div key={n.id} className="p-4" style={{
                  background: CREAM, border: `1px solid rgba(196,168,130,0.22)`, borderRadius: 2,
                }}>
                  <p className="text-sm mb-2" style={{ fontFamily: SERIF, color: BROWN, fontStyle: "italic" }}>"{n.note}"</p>
                  <p className="text-[10px] tracking-widest uppercase" style={{ fontFamily: SANS, color: GOLD }}>— {n.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Greetings */}
        {videoGreetings.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg mb-4" style={{ fontFamily: SERIF, color: BROWN }}>Videos de invitados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {videoGreetings.map((v) => (
                <div key={v.id} className="p-3" style={{
                  background: CREAM, border: `1px solid rgba(196,168,130,0.22)`, borderRadius: 2,
                }}>
                  <video src={v.videoUrl} controls playsInline className="w-full rounded mb-2" style={{ aspectRatio: "9/16", objectFit: "cover" }} />
                  <p className="text-[10px] tracking-widest uppercase" style={{ fontFamily: SANS, color: GOLD }}>— {v.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Music Player ─────────────────────────────────────────────────────────────

function MusicPlayer({ muted, volume, onToggleMute, onVolumeChange }: {
  muted: boolean; volume: number;
  onToggleMute: () => void; onVolumeChange: (delta: number) => void;
}) {
  const pct = Math.round(volume * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
      className="fixed z-40 flex items-center gap-0.5 pl-1 pr-3 py-1"
      style={{
        bottom: "calc(1.25rem + env(safe-area-inset-bottom))",
        right: "calc(1.25rem + env(safe-area-inset-right))",
        background: "rgba(250,246,238,0.92)",
        border: `1px solid rgba(196,168,130,0.35)`,
        borderRadius: 999,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 6px 24px rgba(60,45,20,0.16)",
      }}
    >
      <button
        onClick={() => onVolumeChange(-0.1)}
        aria-label="Bajar volumen"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-60"
        style={{ color: GOLD_DARK }}
      >
        <Minus style={{ width: 14, height: 14 }} />
      </button>

      <motion.button
        whileTap={{ scale: 0.91 }}
        onClick={onToggleMute}
        aria-label={muted ? "Activar sonido" : "Silenciar"}
        className="w-11 h-11 rounded-full flex items-center justify-center mx-0.5"
        style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, boxShadow: `0 4px 16px rgba(196,168,130,0.5)` }}
      >
        {muted
          ? <VolumeX style={{ width: 17, height: 17, color: CREAM }} />
          : <Volume2 style={{ width: 17, height: 17, color: CREAM }} />}
      </motion.button>

      <button
        onClick={() => onVolumeChange(0.1)}
        aria-label="Subir volumen"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-60"
        style={{ color: GOLD_DARK }}
      >
        <Plus style={{ width: 14, height: 14 }} />
      </button>

      <span className="text-[9px] tabular-nums" style={{ fontFamily: SANS, color: "#8A7654", minWidth: 20, textAlign: "center" }}>
        {muted ? "—" : `${pct}%`}
      </span>
    </motion.div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ onAdminClick }: { onAdminClick: () => void }) {
  return (
    <footer className="py-20 px-6 text-center" style={{ background: "linear-gradient(170deg, #2d1f10 0%, #1a1208 100%)" }}>
      <div className="mb-5">
        <CoupleSeal size={40} />
      </div>
      <p className="text-4xl mb-2" style={{ fontFamily: SCRIPT, color: "#EDE4D0" }}>
        Ingrid & Douglas
      </p>
      <p className="text-[10px] tracking-[0.45em] uppercase mb-8" style={{ fontFamily: SANS, color: "#8A7A64" }}>
        5 · XII · 2026 · Playa Francés · Coveñas
      </p>
      <Ornament />
      <p className="text-xs mt-6" style={{ fontFamily: SANS, color: "#6A5A48", fontWeight: 300 }}>
        A Dios sea la gloria. Con amor, los esperamos.
      </p>

      {/* Hidden admin trigger — barely visible dot */}
      <button
        onClick={onAdminClick}
        className="mt-12 w-2 h-2 rounded-full mx-auto block transition-all duration-300 hover:opacity-60"
        style={{ background: "rgba(139,119,90,0.18)" }}
        title=""
        aria-label="Administración"
      />
    </footer>
  );
}

// ─── Global Styles ────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital@0;1&family=Raleway:wght@300;400;500;600&display=swap');

  @keyframes wfloat {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
    50%       { transform: translateY(-20px) scale(1.35); opacity: 0.6; }
  }
  @keyframes wcrack {
    0%   { opacity: 0; }
    35%  { opacity: 1; }
    100% { opacity: 0.7; }
  }

  html { 
    scroll-behavior: smooth;
    scroll-padding-top: 80px;
  }
  
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  ::-webkit-scrollbar {
    width: 8px;
  }

  .gallery-scroller::-webkit-scrollbar {
    display: none;
  }

  ::-webkit-scrollbar-track {
    background: rgba(196,168,130,0.08);
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(196,168,130,0.4);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(196,168,130,0.6);
  }
  
  ::selection { 
    background: rgba(196,168,130,0.22);
    color: #3A302A;
  }
  
  * { 
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
  }
  
  input, textarea, select {
    font-family: inherit;
  }
  
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }
  
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;


// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [opened, setOpened]     = useState(false);
  const [admin, setAdmin]       = useState(false);
  const [rsvpName, setRsvpName] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string>("");
  const [guest, setGuest] = useState<GuestRecord | null>(null);
  // Solo mostramos el loader de personalización si el link trae ?g=... — un
  // link plano (o ?to=Nombre) entra directo, sin espera de red de por medio.
  const [guestLoading, setGuestLoading] = useState<boolean>(
    () => new URLSearchParams(window.location.search).get("g") !== null
  );
  const music = useBackgroundMusic();

  // Personaliza la invitación desde un link como tusitio.com/?g=natalia-sneider
  // (grupo real con pases, tomado de Supabase) o, si no hay grupo, el legado
  // tusitio.com/?to=Maria (solo un nombre en texto, sin pases).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Normalizamos el slug (espacios y mayúsculas) para que un link nunca
    // falle por una diferencia invisible entre la URL y lo guardado en Supabase.
    const groupSlug = params.get("g")?.trim().toLowerCase() || null;
    const toParam = params.get("to");

    if (toParam) setGuestName(decodeURIComponent(toParam));

    if (!groupSlug) return;

    if (!supabaseReady || !supabase) {
      // Sin backend configurado — no hay nada que esperar, seguimos con la
      // invitación genérica en vez de dejar al invitado colgado.
      setGuestLoading(false);
      return;
    }

    // Resiliencia: si Supabase no responde en 4s (red lenta/caída), no dejamos
    // al invitado mirando un loader para siempre — pasamos a la invitación
    // genérica de todas formas.
    const safetyTimeout = window.setTimeout(() => setGuestLoading(false), 4000);

    supabase
      .from("invitados")
      .select("*")
      .ilike("slug", groupSlug) // sin comodines: comparación exacta pero insensible a mayúsculas
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          // Slug inexistente o error de red: cae con elegancia a la invitación
          // general, sin romper nada.
          console.error(error);
          return;
        }
        setGuest({
          id: data.id,
          slug: data.slug,
          displayName: data.nombre,
          side: data.grupo,
          passes: data.pases,
        });
        setGuestName(data.nombre);
      })
      .finally(() => {
        window.clearTimeout(safetyTimeout);
        setGuestLoading(false);
      });
  }, []);

  if (guestLoading) return <PreparingInvitationScreen />;

  return (
    <>
      <style>{CSS}</style>

      {/* Single persistent audio element — survives the envelope unmounting so playback never stops */}
      <audio ref={music.audioRef} src={AUDIO_FILE} loop preload="auto" />

      <AnimatePresence>
        {!opened && (
          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
            <EnvelopeScreen onOpen={() => setOpened(true)} startMusic={music.start} guestName={guestName} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {opened && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4 }}>
            <HeroSection />
            <DetailsSection />
            <VerseBanner />
            <CountdownSection />
            <VideoSection />
            <MoreDetailsHub rsvpName={rsvpName} onRsvpSuccess={setRsvpName} guestName={guestName} guest={guest} />
            <NosotrosSection />
            <MapSection />
            <Footer onAdminClick={() => setAdmin(true)} />
            <MusicPlayer
              muted={music.muted}
              volume={music.volume}
              onToggleMute={music.toggleMute}
              onVolumeChange={music.adjustVolume}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {admin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminDashboard onClose={() => setAdmin(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
