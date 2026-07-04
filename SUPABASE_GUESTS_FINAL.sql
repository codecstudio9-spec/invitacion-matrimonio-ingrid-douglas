-- Script consolidado y seguro de re-ejecutar (idempotente). Si algo ya existe,
-- lo salta en vez de fallar, así que puedes correrlo las veces que necesites.

create extension if not exists pgcrypto;

-- ═══════════════════════════════════════════════════════════════════
-- 1. TABLA DE INVITADOS
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  side text not null check (side in ('ingrid', 'douglas')),
  passes int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.guests enable row level security;

drop policy if exists "Anyone can read guests" on public.guests;
create policy "Anyone can read guests" on public.guests for select using (true);

do $$ begin
  alter publication supabase_realtime add table public.guests;
exception when duplicate_object then null;
end $$;

-- Invitados de Ingrid (con Mamita&Papito y Sergio/Tatiana/Antonela ya unificados)
insert into public.guests (slug, display_name, side, passes) values
  ('mamita-papito-ingrid',    'Mamita & Papito',            'ingrid', 2),
  ('lina-joseph',             'Lina y Joseph',               'ingrid', 2),
  ('natalia-sneider',         'Natalia y Sneider',           'ingrid', 2),
  ('viviana-mat-amaia',       'Viviana, Mat y Amaia',        'ingrid', 3),
  ('johana-brian-thiago',     'Johana, Brian y Thiago',      'ingrid', 3),
  ('viviana-david',           'Viviana y David',             'ingrid', 2),
  ('sergio-tatiana-antonela', 'Sergio, Tatiana & Antonela',  'ingrid', 3),
  ('johana-gael-gerardo',     'Johana, Gael y Gerardo',      'ingrid', 3),
  ('angie-daniel',            'Angie y Daniel',              'ingrid', 2),
  ('jessica-fabiolita',       'Jessica y Fabiolita',         'ingrid', 2),
  ('julieta-santiago',        'Julieta y Santiago',          'ingrid', 2),
  ('fabio',                   'Fabio',                       'ingrid', 1),
  ('martica',                 'Martica',                     'ingrid', 1),
  ('cristian',                'Cristian',                    'ingrid', 1),
  ('daniela',                 'Daniela',                     'ingrid', 1)
on conflict (slug) do nothing;

-- Invitados de Douglas
insert into public.guests (slug, display_name, side, passes) values
  ('mamita-papito-douglas', 'Mamita & Papito',   'douglas', 2),
  ('sebas',                 'Sebas',             'douglas', 1),
  ('manu',                  'Manu',              'douglas', 1),
  ('jesus-leidy',           'Jesús y Leidy',     'douglas', 2),
  ('diego-nandito',         'Diego y Nandito',   'douglas', 2),
  ('vicky-pastor',          'Vicky y Pastor',    'douglas', 2),
  ('melisa-santiago',       'Melisa y Santiago', 'douglas', 2)
on conflict (slug) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- 2. RSVP: columnas para vincular invitado, cantidad y canción
-- ═══════════════════════════════════════════════════════════════════
alter table public.rsvps add column if not exists guest_id uuid references public.guests(id);
alter table public.rsvps add column if not exists attendee_count int;
alter table public.rsvps add column if not exists song_request text;

-- ═══════════════════════════════════════════════════════════════════
-- 3. COMENTARIOS en fotos/videos de invitados
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
-- 4. Verificación — deberías ver 22 filas (15 de Ingrid + 7 de Douglas)
-- ═══════════════════════════════════════════════════════════════════
select side, count(*) as grupos, sum(passes) as total_pases
from public.guests
group by side
order by side;
