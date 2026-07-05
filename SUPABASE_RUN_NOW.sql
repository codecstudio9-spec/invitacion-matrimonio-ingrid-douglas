-- Script combinado — corre esto completo, de una sola vez, en el SQL Editor
-- de Supabase. Es seguro de re-ejecutar aunque ya hayas corrido parte de esto
-- antes (no falla si algo ya existe).

-- ═══════════════════════════════════════════════════════════════════
-- 1. RSVP: columnas que el formulario ya intenta llenar (si faltan, el
--    insert falla y la confirmación se queda solo en el celular de quien
--    la llenó, sin llegar a tu panel)
-- ═══════════════════════════════════════════════════════════════════
alter table public.rsvps add column if not exists guest_id uuid references public.invitados(id);
alter table public.rsvps add column if not exists attendee_count int;
alter table public.rsvps add column if not exists song_request text;

-- ═══════════════════════════════════════════════════════════════════
-- 2. Comentarios en fotos/videos de la galería de invitados
-- ═══════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════
-- 3. Notas de amor — antes vivían solo en localStorage de cada celular,
--    por eso nunca se veían entre dispositivos. Pasan a Supabase.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.love_notes (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.invitados(id),
  name text not null,
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.love_notes enable row level security;

drop policy if exists "Anyone can read love notes" on public.love_notes;
create policy "Anyone can read love notes" on public.love_notes for select using (true);

drop policy if exists "Anyone can add love notes" on public.love_notes;
create policy "Anyone can add love notes" on public.love_notes for insert with check (true);

do $$ begin
  alter publication supabase_realtime add table public.love_notes;
exception when duplicate_object then null;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- 4. Vincular fotos/videos de invitados a su invitado real (solo se llena
--    cuando suben algo usando su link personalizado ?g=slug)
-- ═══════════════════════════════════════════════════════════════════
alter table public.guest_media add column if not exists guest_id uuid references public.invitados(id);

-- ═══════════════════════════════════════════════════════════════════
-- 5. Verificación final — deberías ver 5 filas
-- ═══════════════════════════════════════════════════════════════════
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (table_name, column_name) in (
    ('rsvps', 'guest_id'),
    ('rsvps', 'attendee_count'),
    ('rsvps', 'song_request'),
    ('guest_media', 'guest_id'),
    ('love_notes', 'guest_id')
  )
order by table_name, column_name;
