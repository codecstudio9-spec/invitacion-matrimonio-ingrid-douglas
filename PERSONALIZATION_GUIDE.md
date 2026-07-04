# 🎨 Guía de Personalización - Ejemplos Prácticos

## 1️⃣ Cambiar Nombres

En `src/app/App.tsx`, busca todas las menciones de "Duglas e Ingrid" y reemplaza:

```typescript
// Antes:
<span style={{ fontFamily: SCRIPT, color: "#3E2C18", fontSize: 23, lineHeight: 1.1 }}>
  Duglas & Ingrid
</span>

// Después:
<span style={{ fontFamily: SCRIPT, color: "#3E2C18", fontSize: 23, lineHeight: 1.1 }}>
  [Tu nombre] & [Nombre pareja]
</span>
```

**Lugares a actualizar:**
- EnvelopeScreen (tarjeta dentro del sobre)
- HeroSection (título principal)
- Footer (nombre en el pie)
- VerseBanner (referencias bíblicas)

---

## 2️⃣ Cambiar Fecha y Hora

```typescript
// Línea 33-34 en App.tsx
const WEDDING_DATE = new Date("2026-12-05T16:30:00-05:00");

// Cambiar a tu fecha:
const WEDDING_DATE = new Date("2025-06-15T17:00:00-05:00");

// Formato: "YYYY-MM-DDTHH:MM:SS±HH:MM"
// Zona horaria: -05:00 para Colombia
```

---

## 3️⃣ Cambiar Ubicación

```typescript
// DetailsSection, busca:
{ Icon: MapPin, label: "Lugar", value: "Playa Francés\nTulu Coveñas, Sucre\nColombia" }

// Reemplaza con tu ubicación:
{ Icon: MapPin, label: "Lugar", value: "Tu Playa\nTu Ciudad, Tu Región\nTu País" }

// También actualiza:
// - TimelineSection
// - Footer
// - Google Maps embed URL
```

---

## 4️⃣ Personalizar Audio

### Agregar tu música:

1. **Coloca tu archivo en `/public/`**
   - Nombre recomendado: `pacto.mp3`
   - Formato: MP3, AAC, OGG
   - Duración: 3-5 minutos

2. **En App.tsx:**
```typescript
// Línea 38
const AUDIO_FILE = "/pacto.mp3";

// Cambiar a:
const AUDIO_FILE = "/tu-cancion.mp3";
```

### Ajustar Fade-In:

```typescript
// En EnvelopeScreen, función handleTap:
// Línea ~275, busca:
let currentVolume = 0;
const fadeInterval = setInterval(() => {
  currentVolume = Math.min(currentVolume + 0.08, 1);
  // 0.08 = incremento (mayor = más rápido)
}, 100);
// 100 = intervalo en ms

// Para más rápido (0.3s total):
currentVolume = Math.min(currentVolume + 0.15, 1);
// Para más lento (1.5s total):
currentVolume = Math.min(currentVolume + 0.04, 1);
```

---

## 5️⃣ Personalizar Video

### Agregar tu video:

1. **Coloca tu archivo en `/public/`**
   - Nombre: `video.mp4`
   - Duración: 30-60 segundos
   - Resolución: Mínimo 1080p
   - Formato: MP4 (H.264)

2. **En App.tsx:**
```typescript
// Línea 39
const VIDEO_FILE = "/video.mp4";

// Si tu archivo tiene otro nombre:
const VIDEO_FILE = "/mi-video.mp4";
```

### Ajustar velocidad de reproducción:

En `VideoSection`, busca el elemento `<video>` y añade:
```jsx
<video
  autoPlay
  muted
  loop
  playsInline
  style={{...}}
>
```

---

## 6️⃣ Personalizar Colores

```typescript
// Línea 42-48 en App.tsx
const GOLD      = "#C4A882";     // Oro sutil
const GOLD_DARK = "#A8886A";     // Oro oscuro
const CREAM     = "#FAF6EE";     // Crema cálida
const BEIGE     = "#F5EBD9";     // Beige elegante
const BROWN     = "#3A302A";     // Marrón profundo
const TAN       = "#9C8272";     // Tostado neutro

// Ejemplos de cambio:
// Para un look más cálido:
const GOLD      = "#D4AF37";     // Oro más brillante
const CREAM     = "#FFFEF2";     // Más blanco

// Para un look más frío:
const GOLD      = "#A99B7E";     // Oro más grisáceo
const CREAM     = "#F0EAE0";     // Más gris

// Para tema océano:
const GOLD      = "#5B9BD5";     // Azul agua
const CREAM     = "#E8F4F8";     // Azul claro
```

---

## 7️⃣ Cambiar Referencias Bíblicas

### En DetailsSection:

```typescript
// Busca:
<div>
  <p className="text-base leading-relaxed mb-2" style={{ fontFamily: SCRIPT, color: BROWN, fontStyle: "italic" }}>
    "Levántate, amiga mía, hermosa mía, y ven..."
  </p>
  <p className="text-xs" style={{ fontFamily: SANS, color: GOLD }}>Cantares 2:10-12</p>
</div>

// Reemplaza con tu verso:
<div>
  <p className="text-base leading-relaxed mb-2" style={{ fontFamily: SCRIPT, color: BROWN, fontStyle: "italic" }}>
    "Tu verso aquí..."
  </p>
  <p className="text-xs" style={{ fontFamily: SANS, color: GOLD }}>Tu Referencia</p>
</div>
```

---

## 8️⃣ Personalizar Cronograma

En `TimelineSection`:

```typescript
const schedule = [
  { time: "4:30 PM", event: "Ceremonia Civil", desc: "Frente al mar" },
  { time: "6:00 PM", event: "Cóctel", desc: "Con familiares y amigos" },
  // ... cambiar a tu horario
];
```

---

## 9️⃣ Cambiar Paleta de Colores de Dress Code

En `DressCodeSection`:

```typescript
const colors = [
  { name: "Blanco", hex: "#FFFBF5" },
  { name: "Marfil", hex: "#FEFBF2" },
  // ... cambiar colores según tu tema
];
```

---

## 🔟 Agregar/Cambiar Imágenes de Galería

En `GallerySection`, busca:

```typescript
const allImages = [
  IMG.couple1,
  IMG.couple2,
  IMG.couple3,
  IMG.couple4,
  IMG.couple5,
  "/1777245374090.jpg",
  // ... agregar más
];

// Simplemente coloca imágenes en /public y añade:
"/mi-foto.jpg",
"/otra-foto.jpg",
```

---

## 1️⃣1️⃣ Cambiar Mensaje de Agradecimiento

En `DetailsSection`:

```typescript
<p className="text-sm leading-relaxed" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
  No hay palabras suficientes para expresar nuestra gratitud...
</p>

// Cambiar a:
<p className="text-sm leading-relaxed" style={{ fontFamily: SANS, color: TAN, fontWeight: 300 }}>
  Tu mensaje personalizado aquí...
</p>
```

---

## 1️⃣2️⃣ Cambiar Contraseña Admin

En `AdminDashboard`:

```typescript
// Busca:
if (pwd === "admin2026") { setAuthed(true); setErr(false); }

// Cambiar a:
if (pwd === "tu-nueva-contraseña") { setAuthed(true); setErr(false); }
```

---

## 1️⃣3️⃣ Personalizar Tipografías

Las fuentes se cargan desde Google Fonts en el CSS:

```typescript
@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital@0;1&family=Raleway:wght@300;400;500;600&display=swap');

// Para cambiar:
// 1. Ve a https://fonts.google.com
// 2. Selecciona tus fuentes
// 3. Copia el import
// 4. Reemplaza en App.tsx

// Luego cambia las variables:
const SERIF  = "'Nueva Fuente', serif";
const SANS   = "'Otra Fuente', sans-serif";
const SCRIPT = "'Fuente Script', cursive";
```

---

## 1️⃣4️⃣ Cambiar Zona Horaria

En `WEDDING_DATE`:

```typescript
// Colombia (UTC-5):
const WEDDING_DATE = new Date("2026-12-05T16:30:00-05:00");

// Otros ejemplos:
// España (UTC+1):
const WEDDING_DATE = new Date("2026-12-05T16:30:00+01:00");
// Buenos Aires (UTC-3):
const WEDDING_DATE = new Date("2026-12-05T16:30:00-03:00");
// Nueva York (UTC-5):
const WEDDING_DATE = new Date("2026-12-05T16:30:00-05:00");
```

---

## 1️⃣5️⃣ Cambiar Dimensiones del Sobre

En `EnvelopeScreen`:

```typescript
<div style={{ width: "min(370px, 90vw)", position: "relative" }}>
  {/* 370px = ancho máximo del sobre */}
  {/* 90vw = 90% del ancho de la pantalla */}
</div>

// Cambiar 370px a tu valor deseado:
<div style={{ width: "min(420px, 95vw)", position: "relative" }}>
```

---

## 🎬 Ajustar Velocidad de Animaciones

### Sobre (EnvelopeScreen):
```typescript
// Línea ~286 - Duración de apertura:
setTimeout(() => setPhase("flap-open"), 620),  // 620ms
setTimeout(() => setPhase("card-rise"), 1600), // 1600ms
setTimeout(() => { setPhase("done"); }, 3100), // 3100ms total

// Cambiar valores (en milisegundos) para más rápido/lento
```

### Scroll Reveal:
```typescript
// En función Reveal:
<div ref={ref} style={{
  transition: `opacity 1s ease ${delay}s, transform 1s ease ${delay}s`,
  // "1s" = 1 segundo, cambiar para más lento/rápido
}}>
```

---

## 💾 Exportar/Importar Datos

### Exportar comentarios y RSVP:
```javascript
// En consola del navegador:
const rsvpData = localStorage.getItem('rsvp_entries');
const commentData = localStorage.getItem('gallery_comments');
const loveNotesData = localStorage.getItem('love_notes');

// Copiar JSON para guardar en archivo
```

### Importar datos:
```javascript
// En consola:
localStorage.setItem('rsvp_entries', '[{...datos...}]');
localStorage.setItem('gallery_comments', '[{...datos...}]');
localStorage.setItem('love_notes', '[{...datos...}]');
```

---

## 🚀 Deployment Recomendado

### Vercel (Recomendado):
```bash
npm install -g vercel
vercel deploy
```

### Netlify:
```bash
npm install -g netlify-cli
netlify deploy
```

### GitHub Pages:
Actualiza `vite.config.ts` con tu repo

---

## ✅ Checklist Final

- [ ] Nombres personalizados
- [ ] Fecha y hora correctas
- [ ] Ubicación actualizada
- [ ] Imágenes en /public
- [ ] Audio personalizado
- [ ] Video personalizado
- [ ] Colores ajustados
- [ ] Versos bíblicos personalizados
- [ ] Cronograma del día correcto
- [ ] Mensaje de agradecimiento
- [ ] Contraseña admin nueva
- [ ] Probado en móvil y desktop
- [ ] Compartido en WhatsApp
- [ ] Panel admin funcional

---

**¡Tu invitación personalizada está lista!** 🎉
