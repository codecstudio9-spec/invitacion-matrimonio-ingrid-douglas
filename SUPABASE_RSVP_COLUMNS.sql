-- Esto es lo que le faltaba a tu script: las columnas que el formulario de
-- RSVP ya intenta llenar (por eso se estaba colgando al confirmar), y la
-- tabla de comentarios para las fotos/videos de la galería de invitados.
-- Seguro de correr aunque ya exista algo — no falla si ya está.

alter table public.rsvps add column if not exists guest_id uuid references public.invitados(id);
alter table public.rsvps add column if not exists attendee_count int;
alter table public.rsvps add column if not exists song_request text;

create table if not exists public.guest_media_comments (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.guest_media(id) on delete cascade,
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.guest_media_comments enable row level security;

drop policy if exists "Anyone can read comments" on public.guest_media_comments;
create policy "Anyone can read comments" on public.guest_media_comments for select using (true);

drop policy if exists "Anyone can add comments" on public.guest_media_comments;
create policy "Anyone can add comments" on public.guest_media_comments for insert with check (true);

do $$ begin
  alter publication supabase_realtime add table public.guest_media_comments;
exception when duplicate_object then null;
end $$;

-- Verificación: deberían aparecer las 3 columnas nuevas en rsvps
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'rsvps'
  and column_name in ('guest_id', 'attendee_count', 'song_request');
