# 📋 Guía de Personalización - Invitación de Boda Elegante

## 🎨 Estructura de la Aplicación

Tu aplicación está completamente rediseñada y optimizada. Aquí está el flujo de secciones:

### 1. **Pantalla de Bienvenida (The Envelope)** ✨
- Sobre elegante en color beige minimalista
- Sello de cera 3D interactivo
- Al hacer clic se abre con animación suave
- **Audio automático**: `pacto.mp3` comienza con fade-in gradual

### 2. **Sección Hero Principal** 🌅
- Banner principal con imagen `hero.jpeg`
- Efecto parallax al hacer scroll
- Texto elegante: "Duglas e Ingrid nos casamos"
- Referencias bíblicas integradas

### 3. **Detalles de la Boda** 📅
- Fecha: 5 de diciembre, 2026
- Hora: 4:30 PM
- Ubicación: Playa Francés, Coveñas, Sucre
- Botones para agregar a calendario

### 4. **Verso Bíblico Banner** 📖
- Pasajes hermosos con efecto de fondo paralaje
- Citas: 1 Corintios 13:4-7

### 5. **Contador Regresivo (Countdown)** ⏱️
- Mostrado en tiempo real
- Meses, Días, Horas, Minutos, Segundos

### 6. **Sección de Video** 🎥
- Video de fondo automático (loop, mute)
- Archivo: `video.mp4`
- Contenido sobre Playa Francés

### 7. **Timeline/Cronograma** 🕐
- Horario detallado del día
- Línea de tiempo visual elegante
- Desde ceremonia hasta fiesta

### 8. **Dress Code** 👗
- Paleta de colores (6 tonos beige/crema)
- Visualización de colores recomendados
- Guías de vestuario

### 9. **Galería Interactiva** 📸
- Carrusel horizontal con swipe
- Todas las fotos de `/public`
- **Comentarios públicos**: Los invitados pueden dejar mensajes
- Se almacenan en localStorage

### 10. **Nuestra Historia** 💕
- Timeline de hitos importantes
- Fotos con descripciones
- Desde el primer encuentro hasta la propuesta

### 11. **Notas de Amor** 💌
- Invitados dejan mensajes para los novios
- Se guardan de forma persistente

### 12. **Ubicación (Mapa)** 🗺️
- Google Maps integrado
- Botones: "Cómo llegar" y "Abrir en Maps"

### 13. **Regalos** 🎁
- Opciones: Lluvia de sobres y Transferencia
- Mensaje personalizado

### 14. **RSVP / Confirmación** ✅
- Formulario de confirmación de asistencia
- Restricciones alimenticias
- Mensajes opcionales

### 15. **Gracias** 🙏
- Página de agradecimiento
- Se muestra después de RSVP

### 16. **Pie de Página** 👣
- Botón admin oculto (punto pequeño)
- Contraseña: `admin2026`

---

## 🎵 Audio y Video

### Audio (Pacto.mp3)
```javascript
// Se reproduce automáticamente al abrir el sobre
// Fade-in: 0 → 1 en ~800ms
// Luego se repite en loop
```

### Video (video.mp4)
```javascript
// Se reproduce automáticamente
// Muted (sin sonido)
// Loop infinito
// Se muestra en altura 100svh
```

---

## 🖼️ Imágenes Locales

Usa las imágenes que ya tienes en `/public`:

### Imágenes principales:
- `hero.jpeg` - Banner principal
- `inv1.jpeg`, `inv2.jpeg`, `inv3.jpeg` - Fotos de pareja

### Fotos adicionales (galería):
- `1765143382246.jpg`
- `1773578245465.jpg`
- `1777245374090.jpg`
- `1777858783730 (1).jpg`
- `1780112739252.jpg`
- `1780201087881.jpg`
- `1780201308415.jpg`
- `1780201687200.jpg`
- `IMG-20250425-WA0064.jpg`
- `IMG-20250615-WA0024.jpg`
- `IMG-20250828-WA0013 (1).jpg`
- `501329850_1868882853952502_5367565030893768263_n (1).jpg`
- `Screenshot_20251214_230500_WhatsApp.jpg`

---

## 🎨 Paleta de Colores

```javascript
GOLD      = "#C4A882"     // Oro sutil
GOLD_DARK = "#A8886A"     // Oro oscuro
CREAM     = "#FAF6EE"     // Crema cálida
BEIGE     = "#F5EBD9"     // Beige elegante
BROWN     = "#3A302A"     // Marrón profundo
TAN       = "#9C8272"     // Tostado neutro
```

---

## 💾 Almacenamiento Local

Los datos se guardan en `localStorage`:

```javascript
// RSVP entries
localStorage.getItem('rsvp_entries')

// Love notes (notas de amor)
localStorage.getItem('love_notes')

// Gallery comments (comentarios de galería)
localStorage.getItem('gallery_comments')
```

---

## 🔐 Panel Administrativo

### Acceso:
1. Hace clic en el punto pequeño al final de la página
2. Contraseña: `admin2026`

### Funcionalidades:
- Ver todas las confirmaciones RSVP
- Estadísticas (confirmados, no asisten, etc.)
- Ver notas de amor
- Buscar y filtrar invitados

---

## 📱 Responsividad

La aplicación está completamente optimizada para:
- ✅ Móviles (375px+)
- ✅ Tablets (768px+)
- ✅ Escritorio (1024px+)
- ✅ Pantallas grandes (1920px+)

---

## 🎬 Animaciones

Todas las animaciones son suaves y elegantes:
- Fade in/out
- Slide
- Parallax
- Zoom suave
- Scroll reveal
- 3D transforms

---

## 🚀 Optimización de Rendimiento

- Imágenes locales (más rápido que URLs externas)
- Lazy loading en galería
- CSS optimizado
- Smooth scrolling en navegadores modernos

---

## 📝 Personalización de Textos

Para cambiar textos, busca en el código:
- Nombres: "Duglas e Ingrid"
- Fecha: "5 de diciembre, 2026"
- Ubicación: "Playa Francés, Coveñas"
- Referencias bíblicas
- Mensajes de agradecimiento

---

## 🔧 Variables Clave

```javascript
const WEDDING_DATE = new Date("2026-12-05T16:30:00-05:00");
const AUDIO_FILE = "/pacto.mp3";
const VIDEO_FILE = "/video.mp4";
const SERIF  = "'Playfair Display', serif";
const SANS   = "'Raleway', sans-serif";
const SCRIPT = "'Great Vibes', cursive";
```

---

## ⚡ Tips para Compartir

1. **WhatsApp**: Envía el enlace directo
2. **Performance**: Las imágenes locales cargan rápido
3. **Audio**: Se reproduce automáticamente al abrir el sobre
4. **Mobile First**: Optimizado para celulares
5. **Accesibilidad**: Respeta preferencias de movimiento reducido

---

## 🎯 Checklist Final

- ✅ Nombres actualizados
- ✅ Fecha y hora correctas
- ✅ Ubicación correcta
- ✅ Audio configurado
- ✅ Video configurado
- ✅ Imágenes locales
- ✅ Colores personalizados
- ✅ Textos de agradecimiento
- ✅ Referencias bíblicas
- ✅ Admin panel funcional

---

**Creado con ❤️ para Duglas e Ingrid**
