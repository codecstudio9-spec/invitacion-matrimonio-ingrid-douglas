-- Seguro de re-ejecutar (idempotente).

-- ═══════════════════════════════════════════════════════════════════
-- 1. Notas de amor — hasta ahora vivían SOLO en localStorage de cada
--    celular, por eso nunca se veían entre dispositivos. Pasan a Supabase.
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
-- 2. Vincular fotos/videos de invitados y notas a su invitado real, para
--    que el panel admin pueda mostrar "sus" videos y notas en un solo lugar.
--    (Solo se llena cuando suben algo usando su link personalizado ?g=slug;
--    si usan el link genérico, queda en null — no rompe nada.)
-- ═══════════════════════════════════════════════════════════════════
alter table public.guest_media add column if not exists guest_id uuid references public.invitados(id);

-- ═══════════════════════════════════════════════════════════════════
-- 3. Verificación
-- ═══════════════════════════════════════════════════════════════════
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (table_name, column_name) in (
    ('love_notes', 'guest_id'),
    ('guest_media', 'guest_id'),
    ('rsvps', 'guest_id')
  );
-- Deberías ver las 3 filas.

-- IMPORTANTE: si aún no has corrido SUPABASE_RSVP_COLUMNS.sql, hazlo también
-- — es muy probable que sea la causa de que el RSVP del otro celular no te
-- haya aparecido en el panel (el insert falla por columnas faltantes y cae
-- a un respaldo que solo vive en ESE celular).
