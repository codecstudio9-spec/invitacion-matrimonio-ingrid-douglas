-- Seguro de re-ejecutar (idempotente). Corre esto completo en el SQL Editor
-- de Supabase antes del próximo despliegue.

-- ═══════════════════════════════════════════════════════════════════
-- 1. Galería curada ("Nosotros") — antes los likes y comentarios de esas
--    fotos vivían SOLO en localStorage de cada celular, por eso nunca se
--    veían entre dispositivos. Pasan a Supabase, igual que ya pasó con
--    las notas de amor.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.gallery_photos (
  src text primary key,
  likes int not null default 0
);

alter table public.gallery_photos enable row level security;

drop policy if exists "Anyone can read gallery photos" on public.gallery_photos;
create policy "Anyone can read gallery photos" on public.gallery_photos for select using (true);

drop policy if exists "Anyone can upsert gallery photos" on public.gallery_photos;
create policy "Anyone can upsert gallery photos" on public.gallery_photos for insert with check (true);

drop policy if exists "Anyone can update gallery photos" on public.gallery_photos;
create policy "Anyone can update gallery photos" on public.gallery_photos for update using (true);

create table if not exists public.gallery_comments (
  id uuid primary key default gen_random_uuid(),
  photo_src text not null,
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.gallery_comments enable row level security;

drop policy if exists "Anyone can read gallery comments" on public.gallery_comments;
create policy "Anyone can read gallery comments" on public.gallery_comments for select using (true);

drop policy if exists "Anyone can add gallery comments" on public.gallery_comments;
create policy "Anyone can add gallery comments" on public.gallery_comments for insert with check (true);

drop policy if exists "Anyone can delete gallery comments" on public.gallery_comments;
create policy "Anyone can delete gallery comments" on public.gallery_comments for delete using (true);

do $$ begin
  alter publication supabase_realtime add table public.gallery_photos;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.gallery_comments;
exception when duplicate_object then null;
end $$;

-- Like/unlike atómico para fotos de la galería curada (misma idea que el
-- increment_like que ya usan las fotos/videos subidos por invitados).
create or replace function public.increment_gallery_like(p_src text, delta int)
returns void
language plpgsql
as $$
begin
  insert into public.gallery_photos (src, likes)
  values (p_src, greatest(delta, 0))
  on conflict (src) do update
    set likes = greatest(0, public.gallery_photos.likes + delta);
end;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 2. Permitir borrar mensajes desde el panel de administración.
--    Nota de seguridad: no hay un usuario "admin" real en Supabase (el
--    panel solo pide una contraseña en el navegador), así que estas
--    políticas permiten borrar con la misma llave pública que ya usa
--    todo el sitio para leer e insertar. Es el mismo modelo de seguridad
--    que ya tenía el resto de la app.
-- ═══════════════════════════════════════════════════════════════════
drop policy if exists "Anyone can delete love notes" on public.love_notes;
create policy "Anyone can delete love notes" on public.love_notes for delete using (true);

drop policy if exists "Anyone can delete guest media comments" on public.guest_media_comments;
create policy "Anyone can delete guest media comments" on public.guest_media_comments for delete using (true);

drop policy if exists "Anyone can delete guest media" on public.guest_media;
create policy "Anyone can delete guest media" on public.guest_media for delete using (true);

drop policy if exists "Anyone can delete video greetings" on public.video_greetings;
create policy "Anyone can delete video greetings" on public.video_greetings for delete using (true);

drop policy if exists "Anyone can delete rsvps" on public.rsvps;
create policy "Anyone can delete rsvps" on public.rsvps for delete using (true);

-- ═══════════════════════════════════════════════════════════════════
-- 3. Verificación — deberías ver 2 filas (las tablas nuevas)
-- ═══════════════════════════════════════════════════════════════════
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('gallery_photos', 'gallery_comments')
order by table_name;
