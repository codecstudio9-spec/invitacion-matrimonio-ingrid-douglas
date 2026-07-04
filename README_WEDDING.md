# 🎉 Invitación de Boda Digital - Duglas e Ingrid

Bienvenido a la aplicación web premium de invitación para la boda de Duglas e Ingrid. Una experiencia elegante, cinematográfica y completamente optimizada para móviles.

---

## ✨ Características Principales

### 🎁 **Pantalla de Bienvenida - El Sobre Elegante**
- Diseño minimalista en tonos beige y crema
- Sello de cera 3D interactivo con animación realista
- **Audio automático con fade-in**: La música `pacto.mp3` comienza suavemente al abrir el sobre
- Transición fluida de apertura que simula abrir una invitación real

### 🌅 **Sección Hero Principal**
- Banner con fotografía prominente (`hero.jpeg`)
- Efecto parallax al hacer scroll
- Texto destacado: **"Duglas e Ingrid nos casamos"**
- Citas bíblicas integradas elegantemente

### 📅 **Detalles de la Ceremonia**
- **Fecha**: 5 de diciembre, 2026
- **Hora**: 4:30 PM
- **Ubicación**: Playa Francés, Tulu Coveñas, Sucre, Colombia
- Mensaje de agradecimiento personalizado
- Referencias bíblicas hermosas (Cantares 2:10-12 y Eclesiastés 4:9-12)

### ⏱️ **Contador Regresivo**
- Muestra en tiempo real: Meses, Días, Horas, Minutos, Segundos
- Diseño elegante con numeración variable

### 🎥 **Sección de Video**
- Video de fondo de 50 segundos en loop
- Automático y muted
- Contenido: Playa Francés y paisaje marino

### 🕐 **Timeline del Día**
- Cronograma detallado con línea de tiempo visual
- Desde ceremonia hasta fiesta y amanecer
- Iconos y descrippciones claras

### 👗 **Dress Code**
- Paleta de 6 colores elegantes (blanco, marfil, arena, beige claro, beige oscuro, crema)
- Visualización de colores recomendados
- Recomendaciones de vestuario

### 📸 **Galería de Fotos Interactiva**
- Carrusel horizontal con swipe/flechas
- Todas las fotos almacenadas localmente
- **Comentarios públicos**: Los invitados pueden dejar mensajes de buenos deseos
- Los comentarios se guardan y se muestran a otros invitados

### 💕 **Nuestra Historia**
- Línea de tiempo de momentos importantes
- Fotos con descripciones (primer encuentro, primera Navidad, viaje, propuesta, boda)
- Diseño alternado y elegante

### 💌 **Notas de Amor**
- Espacio para que los invitados dejen mensajes personalizados
- Se guardan de forma persistente
- Se muestran en cuadros de texto hermosos

### 🗺️ **Ubicación y Cómo Llegar**
- Google Maps integrado
- Botones para abrir rutas en Google Maps
- Información clara de la ubicación

### 🎁 **Mesa de Regalos**
- Opciones: Lluvia de sobres y Transferencia
- Mensaje personalizado

### ✅ **Confirmación de Asistencia (RSVP)**
- Formulario elegante
- Recopila: Nombre, teléfono, asistencia, restricciones alimenticias, mensaje
- Se almacena en localStorage

### 🙏 **Página de Agradecimiento**
- Se muestra después de confirmar asistencia
- Mensaje personalizado

### 🎵 **Reproductor de Música**
- Botón flotante en esquina inferior derecha
- Controla la reproducción de audio de fondo
- Mostrador visual cuando está reproduciéndose

### 🔐 **Panel Administrativo**
- Acceso con contraseña (`admin2026`)
- Estadísticas: confirmados, no asisten, notas recibidas
- Búsqueda y filtrado de invitados
- Visualización de todos los comentarios de la galería

---

## 🎨 Paleta de Colores

```
GOLD      (#C4A882)   - Oro sutil y elegante
GOLD_DARK (#A8886A)   - Oro más profundo
CREAM     (#FAF6EE)   - Crema cálida
BEIGE     (#F5EBD9)   - Beige elegante
BROWN     (#3A302A)   - Marrón profundo
TAN       (#9C8272)   - Tostado neutro
```

---

## 📁 Estructura de Archivos

```
/public/
├── hero.jpeg                          # Foto principal del banner
├── inv1.jpeg, inv2.jpeg, inv3.jpeg   # Fotos de la pareja
├── 1765143382246.jpg                 # Fotos adicionales
├── 1773578245465.jpg
├── ... (más fotos de galería)
├── pacto.mp3                         # Música que suena al abrir
└── video.mp4                         # Video de fondo

/src/
└── app/
    └── App.tsx                       # Componente principal
```

---

## 🚀 Cómo Ejecutar

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar en desarrollo
```bash
npm run dev
```

### 3. Construir para producción
```bash
npm run build
```

### 4. Vista previa de producción
```bash
npm run preview
```

---

## 💾 Almacenamiento de Datos

Los datos se guardan automáticamente en `localStorage`:

```javascript
// Confirmaciones RSVP
localStorage.getItem('rsvp_entries')

// Notas de amor de los invitados
localStorage.getItem('love_notes')

// Comentarios de la galería
localStorage.getItem('gallery_comments')
```

Para limpiar datos locales:
```javascript
localStorage.clear()
```

---

## 📱 Responsividad

Completamente optimizado para:
- ✅ **Móviles**: desde 375px
- ✅ **Tablets**: desde 768px
- ✅ **Escritorio**: desde 1024px
- ✅ **Pantallas grandes**: 1920px+

---

## ♿ Accesibilidad

- ✅ Respeta preferencias de movimiento reducido (`prefers-reduced-motion`)
- ✅ Contrastes adecuados
- ✅ Navegación por teclado
- ✅ Semántica HTML correcta

---

## 🎬 Animaciones

Todas las animaciones son suaves y elegantes:
- **Fade In/Out**: Aparición y desaparición suave
- **Slide**: Desplazamiento desde los lados
- **Parallax**: Efecto de profundidad al hacer scroll
- **Zoom**: Aumento y disminución suave
- **Scroll Reveal**: Aparición al llegar a la sección
- **3D Transforms**: Rotaciones 3D realistas (especialmente en el sobre)

---

## 🎵 Audio

**Archivo**: `pacto.mp3`
- Se reproduce automáticamente al abrir el sobre
- Fade-in gradual de 0 a 1 en ~800ms
- Loop infinito
- Se puede pausar con el botón flotante

---

## 🎥 Video

**Archivo**: `video.mp4` (50 segundos)
- Se reproduce automáticamente
- Muted (sin sonido)
- Loop infinito
- Optimizado para mobile y desktop

---

## 🔐 Panel Administrativo

### Acceso:
1. Desplázate hasta el final de la página
2. Haz clic en el pequeño punto gris discreto
3. Ingresa la contraseña: `admin2026`

### Funcionalidades:
- 📊 Estadísticas en tiempo real
- 👥 Lista de invitados confirmados/declinados
- 🔍 Búsqueda y filtrado
- 💌 Visualización de notas de amor
- 📸 Comentarios de galería

---

## 🌐 Compartir en WhatsApp

1. Despliega tu aplicación en un servidor (Vercel, Netlify, etc.)
2. Copia el URL
3. Comparte en WhatsApp
4. El sobre se abre automáticamente y suena la música

---

## ✅ Checklist de Personalización

- [ ] Nombres actualizados: "Duglas e Ingrid"
- [ ] Fecha correcta: 5 de diciembre, 2026
- [ ] Hora: 4:30 PM
- [ ] Ubicación: Playa Francés, Coveñas
- [ ] Imágenes principales colocadas
- [ ] Galería de fotos completa
- [ ] Audio `pacto.mp3` presente
- [ ] Video `video.mp4` presente
- [ ] Referencias bíblicas personalizadas
- [ ] Mensaje de agradecimiento revisado
- [ ] Cronograma del día correcto
- [ ] Admin panel activo

---

## 🛠️ Tecnologías Utilizadas

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Bundler y servidor de desarrollo
- **Tailwind CSS** - Estilos
- **Framer Motion** - Animaciones
- **Lucide React** - Iconos

---

## 📖 Citas Bíblicas Incluidas

1. **Marcos 10:9** - "Lo que Dios ha unido, que no lo separe el hombre"
2. **Cantares 2:10-12** - El amor en la naturaleza
3. **Eclesiastés 4:9-12** - La importancia de dos personas juntas
4. **1 Corintios 13:4-7** - La naturaleza del amor

---

## 🎯 Objetivos de Diseño

- ✨ **Elegancia**: Paleta de colores sofisticada
- 🎬 **Cinematográfico**: Animaciones suaves y transiciones
- 📱 **Mobile-First**: Optimizado para celulares
- ⚡ **Rápido**: Imágenes locales, sin dependencias externas innecesarias
- 💎 **Exclusivo**: Siente como una invitación premium de lujo

---

## 🎁 Detalles Especiales

- 3D Wax Seal con efecto de ruptura realista
- Efecto parallax en banner
- Audio con fade-in automático
- Video de fondo en loop
- Comentarios interactivos en galería
- Panel admin con estadísticas en vivo
- Timeline visual elegante
- Dress code con visualización de colores

---

## 📞 Soporte

Para modificaciones, contacta al desarrollador. 

**Creado con ❤️ para Duglas e Ingrid**

---

## 📄 Licencia

Esta invitación digital es creada específicamente para esta pareja. 
Todos los derechos reservados.

---

**¡Que disfrutes tu día especial!** 🎉💕
