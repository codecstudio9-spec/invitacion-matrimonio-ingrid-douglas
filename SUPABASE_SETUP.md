# Activar el álbum compartido y el RSVP en tiempo real (Supabase)

Sin esto, el sitio sigue funcionando (RSVP de texto y comentarios de la
galería guardados solo en el navegador de cada persona), pero las fotos,
videos y confirmaciones de asistencia no se comparten entre dispositivos.
Con esto, todo lo que suba un invitado aparece al instante para ti, Ingrid,
y todos los demás invitados, sin importar el dispositivo.

## 1. Crear el proyecto

1. Ve a https://supabase.com, crea una cuenta y un proyecto nuevo (el nombre
   no importa, ej. "boda-ingrid-douglas"). Elige la región más cercana.
2. Espera 1-2 minutos a que termine de aprovisionarse.

## 2. Crear las tablas, permisos y función de "me gusta"

En el panel del proyecto: **SQL Editor → New query**, pega esto completo y
dale **Run**:

```sql
-- RSVPs
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  attending boolean not null,
  dietary text,
  love_note text,
  phone text,
  video_url text,
  created_at timestamptz not null default now()
);
alter table public.rsvps enable row level security;
create policy "Anyone can submit an RSVP" on public.rsvps for insert with check (true);
create policy "Anyone can read RSVPs" on public.rsvps for select using (true);

-- Fotos y videos de invitados
create table public.guest_media (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  folder text not null,
  url text not null,
  type text not null check (type in ('photo', 'video')),
  likes int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.guest_media enable row level security;
create policy "Anyone can read guest media" on public.guest_media for select using (true);
create policy "Anyone can upload guest media" on public.guest_media for insert with check (true);

-- Videos de saludo/confirmación (opcionales, separados del RSVP formal)
create table public.video_greetings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  video_url text not null,
  created_at timestamptz not null default now()
);
alter table public.video_greetings enable row level security;
create policy "Anyone can read video greetings" on public.video_greetings for select using (true);
create policy "Anyone can submit a video greeting" on public.video_greetings for insert with check (true);

-- "Me gusta" — la única forma en que "likes" puede cambiar, para que nadie
-- pueda editar el nombre/foto/carpeta de otra persona directamente.
create or replace function public.increment_like(row_id uuid, delta int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.guest_media
  set likes = greatest(0, likes + delta)
  where id = row_id;
$$;
grant execute on function public.increment_like(uuid, int) to anon, authenticated;

-- Tiempo real: para que los cambios aparezcan al instante en todos los dispositivos
alter publication supabase_realtime add table public.rsvps;
alter publication supabase_realtime add table public.guest_media;
alter publication supabase_realtime add table public.video_greetings;
```

## 3. Crear los buckets de almacenamiento

En **Storage → Create a new bucket**, crea dos, ambos marcados como
**Public bucket**:

- `guest-media`
- `video-greetings`

Luego, en **SQL Editor**, otra consulta para permitir que cualquiera suba
archivos a esos dos buckets (la lectura ya es pública por marcarlos "Public"):

```sql
create policy "Anyone can upload to guest-media"
on storage.objects for insert
with check (bucket_id = 'guest-media');

create policy "Anyone can upload to video-greetings"
on storage.objects for insert
with check (bucket_id = 'video-greetings');
```

## 4. Copiar las claves al proyecto

1. **Project settings → API**. Copia **Project URL** y la clave **anon
   public**.
2. Copia `.env.example` a un archivo nuevo `.env.local` y pega ahí:

   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

3. Reinicia el servidor de desarrollo (`npm run dev`) — Vite solo lee
   `.env.local` al arrancar.

Estas claves **no son secretas** (la clave anon está diseñada para usarse en
el navegador); la seguridad real la dan las políticas RLS del paso 2.

## 5. Si vas a publicar en Vercel

`.env.local` nunca se sube al repositorio, así que Vercel no lo ve. Hay que
repetir las mismas 2 variables ahí: en el proyecto de Vercel → **Settings →
Environment Variables**, agrega `VITE_SUPABASE_URL` y
`VITE_SUPABASE_ANON_KEY` con los mismos valores. Ya incluí un `vercel.json`
en la raíz con la regla de `rewrites` para que las rutas internas no den
404 al recargar la página. Si el sitio ya estaba desplegado antes de
agregar las variables, hace falta un **re-deploy** (Vercel no las aplica
retroactivamente al build anterior).

Vercel detecta automáticamente que es un proyecto Vite (build command
`vite build`, carpeta de salida `dist`) — no debería hacer falta
configurar nada más ahí.

Con las variables puestas (local y en Vercel), la subida de fotos/videos y
el RSVP son igual de "en tiempo real" en producción que en tu máquina — es
la misma base de datos en ambos lados, solo cambia dónde vive el archivo
HTML/JS.

## Qué cambia en el sitio una vez configurado

- **Confirmar Asistencia** (círculo del menú): las confirmaciones se guardan
  en la tabla `rsvps` y el panel admin las lee en tiempo real desde
  cualquier dispositivo.
- **Nosotros** (sección con la galería): incluye el álbum de invitados
  (tabla `guest_media`, bucket `guest-media`) donde cualquiera sube fotos o
  videos a una carpeta con "me gusta" compartido, y una tarjeta para dejar
  un video opcional confirmando asistencia (tabla `video_greetings`, bucket
  `video-greetings`), visible también en el panel admin.

## Costos

El plan gratuito de Supabase incluye 500 MB de base de datos, 1 GB de
almacenamiento de archivos y 2 GB de transferencia al mes — normalmente
suficiente para una boda. Si se llena, Supabase pide pasar a un plan pago;
no cobra nada sin que tú lo actives explícitamente.
