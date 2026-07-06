-- Seguro de re-ejecutar (idempotente). Corre esto completo en el SQL Editor
-- de Supabase antes del próximo despliegue.

-- ═══════════════════════════════════════════════════════════════════
-- 1. Muro de mensajes para los novios — separado de love_notes (esa
--    sigue siendo "Nota de Amor"; esta es la nueva "💌 Mensajes para
--    los novios").
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.wedding_messages (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.invitados(id),
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.wedding_messages enable row level security;

drop policy if exists "Anyone can read wedding messages" on public.wedding_messages;
create policy "Anyone can read wedding messages" on public.wedding_messages for select using (true);

drop policy if exists "Anyone can add wedding messages" on public.wedding_messages;
create policy "Anyone can add wedding messages" on public.wedding_messages for insert with check (true);

drop policy if exists "Anyone can delete wedding messages" on public.wedding_messages;
create policy "Anyone can delete wedding messages" on public.wedding_messages for delete using (true);

do $$ begin
  alter publication supabase_realtime add table public.wedding_messages;
exception when duplicate_object then null;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- 2. Reacciones tipo emoji — cada fila es un "toque" de reacción; el
--    conteo en vivo se saca agrupando por emoji.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.wedding_reactions (
  id uuid primary key default gen_random_uuid(),
  emoji text not null,
  guest_id uuid references public.invitados(id),
  created_at timestamptz not null default now()
);

alter table public.wedding_reactions enable row level security;

drop policy if exists "Anyone can read wedding reactions" on public.wedding_reactions;
create policy "Anyone can read wedding reactions" on public.wedding_reactions for select using (true);

drop policy if exists "Anyone can add wedding reactions" on public.wedding_reactions;
create policy "Anyone can add wedding reactions" on public.wedding_reactions for insert with check (true);

do $$ begin
  alter publication supabase_realtime add table public.wedding_reactions;
exception when duplicate_object then null;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- 3. Verificación — deberías ver 2 filas
-- ═══════════════════════════════════════════════════════════════════
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('wedding_messages', 'wedding_reactions')
order by table_name;
