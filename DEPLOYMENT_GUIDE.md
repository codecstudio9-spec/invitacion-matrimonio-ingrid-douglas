# 🚀 Guía de Despliegue - Invitación de Boda

## 📌 Requisitos Previos

- Node.js 16+ instalado
- npm o pnpm
- Conexión a internet
- Una cuenta en Vercel, Netlify o similar (para hosting)

---

## 🏠 Opción 1: Vercel (RECOMENDADO)

**Ventajas:**
- Despliegue automático desde GitHub
- Dominio personalizado gratis (.vercel.app)
- Rendimiento excelente
- Servicio gratis para proyectos estáticos

### Pasos:

1. **Crea un repositorio en GitHub**
   ```bash
   git init
   git add .
   git commit -m "Invitación de boda"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```

2. **Conecta con Vercel**
   - Ve a https://vercel.com
   - Click en "New Project"
   - Importa tu repositorio de GitHub
   - Click "Deploy"

3. **Tu URL será algo como:**
   ```
   https://nombre-proyecto.vercel.app
   ```

4. **Comparte en WhatsApp:**
   - Copia el URL
   - Pega en WhatsApp y envía
   - ¡Los invitados verán el sobre hermoso!

---

## 🌐 Opción 2: Netlify

**Ventajas:**
- Interfaz amigable
- Deploy con drag & drop
- Certificado SSL gratis

### Pasos:

1. **Construir localmente**
   ```bash
   npm install
   npm run build
   ```

2. **Ir a Netlify**
   - Ve a https://netlify.com
   - Click "New site from Git"
   - Conecta tu GitHub
   - Configura build command: `npm run build`
   - Configura publish directory: `dist`

3. **Deploy automático**
   - Cada push a GitHub dispara un nuevo deploy
   - Tu sitio se actualiza automáticamente

---

## 🏥 Opción 3: Deploy Manual en Servidor Propio

### Con Apache:

1. **Construir proyecto**
   ```bash
   npm run build
   ```

2. **Copiar carpeta `dist` a tu servidor**
   ```bash
   scp -r dist/ usuario@tu-servidor.com:/var/www/html/invitacion/
   ```

3. **Acceder a:**
   ```
   https://tu-dominio.com/invitacion/
   ```

### Con Nginx:

1. **Configuración nginx** (`/etc/nginx/sites-available/default`):
   ```nginx
   location / {
     root /var/www/html/invitacion;
     index index.html index.htm;
     try_files $uri $uri/ /index.html;
   }
   ```

2. **Reiniciar nginx**
   ```bash
   sudo systemctl restart nginx
   ```

---

## 📦 Opción 4: GitHub Pages

**Ventajas:**
- Completamente gratis
- Dominio con tu usuario

### Pasos:

1. **Actualizar `vite.config.ts`**
   ```typescript
   export default {
     base: '/invitacion-boda/',
     // ... resto de config
   }
   ```

2. **Crear flujo GitHub Actions** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

3. **URL será:**
   ```
   https://tu-usuario.github.io/invitacion-boda/
   ```

---

## ⚙️ Variables de Entorno (Opcional)

Crear archivo `.env.local`:

```env
VITE_WEDDING_DATE=2026-12-05T16:30:00-05:00
VITE_ADMIN_PASSWORD=admin2026
VITE_GA_ID=tu-google-analytics-id
```

Usar en código:
```typescript
const WEDDING_DATE = import.meta.env.VITE_WEDDING_DATE;
```

---

## 🔧 Configuración Pre-Deploy

### 1. Optimizar imágenes
```bash
# Instalar herramienta (opcional)
npm install -g imagemin-cli

# Optimizar imágenes en /public
imagemin public/* --out-dir=public
```

### 2. Revisar performance
```bash
npm run build
# Verifica el tamaño de dist/
# Debe ser < 5MB idealmente
```

### 3. Probar localmente
```bash
npm run preview
# Abre http://localhost:5000
# Prueba todas las secciones
# Verifica audio y video
```

### 4. Checklist
- [ ] Audio suena al abrir sobre
- [ ] Video se reproduce
- [ ] Fotos cargan rápido
- [ ] Responsivo en móvil
- [ ] RSVP funciona
- [ ] Comentarios guardan
- [ ] Admin panel accesible
- [ ] Sin errores en consola

---

## 📊 Monitoreo Post-Deploy

### Google Analytics (Opcional)

1. **Instalar analytics**
   ```bash
   npm install react-ga4
   ```

2. **Agregar en App.tsx**
   ```typescript
   import ReactGA from "react-ga4";
   
   ReactGA.initialize("GA_MEASUREMENT_ID");
   ReactGA.send({ hitType: "pageview", page: "/" });
   ```

3. **Ver estadísticas en Google Analytics Dashboard**

---

## 🐛 Troubleshooting

### Problema: Audio no se reproduce
**Solución:**
- Verificar que `pacto.mp3` está en `/public`
- Revisar console (F12) para errores CORS
- Probar formato MP3

### Problema: Imágenes no cargan
**Solución:**
- Verificar rutas (ej: `/hero.jpeg` no `./hero.jpeg`)
- Asegurar archivos en `/public`
- Limpiar cache del navegador

### Problema: Animaciones lentas
**Solución:**
- Reducir número de imágenes
- Optimizar tamaño de video
- Usar `npm run build` para versión optimizada

### Problema: RSVP no guarda
**Solución:**
- Verificar localStorage no está deshabilitado
- Abrir DevTools → Application → localStorage
- Limpiar localStorage si está corrupto

---

## 🔒 Seguridad

### Headers recomendados (Vercel)

Crear `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 📱 Compartir en WhatsApp

### Generar link comprimido

1. Obtén la URL de Vercel/Netlify
   ```
   https://invitacion-duglas-ingrid.vercel.app
   ```

2. Usa un acortador de URL
   - bit.ly
   - tinyurl.com
   - Rebrand.ly (con tracking)

3. Crea mensaje elegante:
   ```
   Duglas e Ingrid te invitan a celebrar 
   su boda el 5 de diciembre 🎉

   Haz clic para abrir la invitación ↓
   [LINK]

   💌 Confirma tu asistencia en la página
   ```

4. Comparte en WhatsApp

---

## 📈 Estadísticas Típicas

Después del deploy, espera:

- **Primer día:** 50-100 visitas
- **Primera semana:** 200-500 visitas
- **Mes anterior:** 1000+ visitas

Monitorea en:
- Vercel Dashboard
- Google Analytics
- Netlify Analytics

---

## 🎯 Optimización Continua

Después del deploy:

1. **Revisa comentarios** de invitados
2. **Actualiza información** si es necesario
3. **Recopila RSVP** regularmente
4. **Descarga datos** antes de la boda

Para descargar datos:
```javascript
// En consola del navegador
const data = {
  rsvp: JSON.parse(localStorage.getItem('rsvp_entries')),
  comments: JSON.parse(localStorage.getItem('gallery_comments')),
  notes: JSON.parse(localStorage.getItem('love_notes'))
};
console.log(JSON.stringify(data, null, 2));
```

---

## ✨ Tips Finales

1. **Haz pruebas** en múltiples dispositivos
2. **Pide feedback** antes de enviar masivamente
3. **Guarda URLs** de admin para acceso posterior
4. **Hace backup** de localStorage regularmente
5. **Disfruta** viendo los comentarios de invitados ¡es lo más emocionante! 💕

---

**¡Listo para celebrar!** 🎉
