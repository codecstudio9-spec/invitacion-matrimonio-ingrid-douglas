-- Seguro de re-ejecutar (idempotente). Corre esto completo en el SQL Editor
-- de Supabase.
--
-- Reutiliza la tabla wedding_reactions que ya existía (antes era para una
-- sección aparte de "así se sienten nuestros invitados"). Ahora cada
-- reacción apunta a una foto/video puntual: o a un guest_media.id (fotos y
-- videos subidos), o a un photo_src (las fotos fijas de la carpeta public).

alter table public.wedding_reactions add column if not exists media_id uuid references public.guest_media(id) on delete cascade;
alter table public.wedding_reactions add column if not exists photo_src text;

-- Falta el permiso de borrar (para poder "quitar" una reacción al tocarla
-- de nuevo).
drop policy if exists "Anyone can delete wedding reactions" on public.wedding_reactions;
create policy "Anyone can delete wedding reactions" on public.wedding_reactions for delete using (true);

-- Verificación
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'wedding_reactions'
order by column_name;
