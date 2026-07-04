-- ═══════════════════════════════════════════════════════════════════
-- 1. TABLA DE INVITADOS (grupos con pases)
-- ═══════════════════════════════════════════════════════════════════
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,          -- usado en la URL: ?g=natalia-sneider
  display_name text not null,         -- 'Natalia y Sneider'
  side text not null check (side in ('ingrid', 'douglas')),
  passes int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.guests enable row level security;

-- Cualquiera puede leer (para que la invitación reconozca el link),
-- pero nadie puede insertar/editar/borrar desde la app — solo ustedes
-- desde el SQL Editor o el Table Editor de Supabase.
create policy "Anyone can read guests" on public.guests for select using (true);

alter publication supabase_realtime add table public.guests;

-- Invitados de Ingrid
insert into public.guests (slug, display_name, side, passes) values
  ('mama-ingrid',          'Mamá',                    'ingrid', 1),
  ('papa-ingrid',          'Papá',                     'ingrid', 1),
  ('lina-joseph',          'Lina y Joseph',            'ingrid', 2),
  ('natalia-sneider',      'Natalia y Sneider',        'ingrid', 2),
  ('viviana-mat-amaia',    'Viviana, Mat y Amaia',     'ingrid', 3),
  ('johana-brian-thiago',  'Johana, Brian y Thiago',   'ingrid', 3),
  ('viviana-david',        'Viviana y David',          'ingrid', 2),
  ('tatiana-antonela',     'Tatiana y Antonela',       'ingrid', 2),
  ('sergio',               'Sergio',                   'ingrid', 1),
  ('johana-gael-gerardo',  'Johana, Gael y Gerardo',   'ingrid', 3),
  ('angie-daniel',         'Angie y Daniel',           'ingrid', 2),
  ('jessica-fabiolita',    'Jessica y Fabiolita',      'ingrid', 2),
  ('julieta-santiago',     'Julieta y Santiago',       'ingrid', 2),
  ('fabio',                'Fabio',                    'ingrid', 1),
  ('martica',              'Martica',                  'ingrid', 1),
  ('cristian',             'Cristian',                 'ingrid', 1),
  ('daniela',              'Daniela',                  'ingrid', 1);

-- Invitados de Douglas
insert into public.guests (slug, display_name, side, passes) values
  ('mama-douglas',   'Mamá',              'douglas', 1),
  ('papa-douglas',   'Papá',               'douglas', 1),
  ('sebas',          'Sebas',              'douglas', 1),
  ('manu',           'Manu',               'douglas', 1),
  ('jesus-leidy',    'Jesús y Leidy',      'douglas', 2),
  ('diego-nandito',  'Diego y Nandito',    'douglas', 2),
  ('vicky-pastor',   'Vicky y Pastor',     'douglas', 2),
  ('melisa-santiago','Melisa y Santiago',  'douglas', 2);

-- ═══════════════════════════════════════════════════════════════════
-- 2. RSVP: vincular al invitado, cantidad de asistentes y canción
-- ═══════════════════════════════════════════════════════════════════
alter table public.rsvps add column guest_id uuid references public.guests(id);
alter table public.rsvps add column attendee_count int;
alter table public.rsvps add column song_request text;

-- ═══════════════════════════════════════════════════════════════════
-- 3. COMENTARIOS en fotos/videos de invitados (la tabla guest_media
--    y la función increment_like ya existen — esto solo agrega comentarios)
-- ═══════════════════════════════════════════════════════════════════
create table public.guest_media_comments (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.guest_media(id) on delete cascade,
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.guest_media_comments enable row level security;
create policy "Anyone can read comments" on public.guest_media_comments for select using (true);
create policy "Anyone can add comments" on public.guest_media_comments for insert with check (true);

alter publication supabase_realtime add table public.guest_media_comments;
