-- Seguro de re-ejecutar (idempotente). Corre esto completo en el SQL Editor
-- de Supabase — esto es lo que faltaba para que las fotos/videos se puedan
-- subir de verdad (confirmado con una prueba directa contra la API: el
-- bucket "guest-media" no existía, por eso la subida fallaba en silencio
-- antes siquiera de llegar a guardar la fila en guest_media).

-- ═══════════════════════════════════════════════════════════════════
-- 1. Buckets públicos de almacenamiento
-- ═══════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('guest-media', 'guest-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('video-greetings', 'video-greetings', true)
on conflict (id) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- 2. Permisos: cualquiera puede leer (para que las fotos se vean) y subir
--    (para que los invitados puedan compartir sin necesitar una cuenta).
--    Mismo modelo de seguridad que el resto del sitio: sin login real, la
--    llave pública es la que ya usa todo el sitio.
-- ═══════════════════════════════════════════════════════════════════
drop policy if exists "Public read guest-media" on storage.objects;
create policy "Public read guest-media" on storage.objects
  for select using (bucket_id = 'guest-media');

drop policy if exists "Public upload guest-media" on storage.objects;
create policy "Public upload guest-media" on storage.objects
  for insert with check (bucket_id = 'guest-media');

drop policy if exists "Public read video-greetings" on storage.objects;
create policy "Public read video-greetings" on storage.objects
  for select using (bucket_id = 'video-greetings');

drop policy if exists "Public upload video-greetings" on storage.objects;
create policy "Public upload video-greetings" on storage.objects
  for insert with check (bucket_id = 'video-greetings');

-- ═══════════════════════════════════════════════════════════════════
-- 3. Verificación — deberías ver las 2 filas con public = true
-- ═══════════════════════════════════════════════════════════════════
select id, name, public from storage.buckets where id in ('guest-media', 'video-greetings');
