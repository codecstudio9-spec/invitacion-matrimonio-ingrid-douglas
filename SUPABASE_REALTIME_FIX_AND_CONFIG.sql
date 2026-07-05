-- Seguro de re-ejecutar (idempotente). Corre esto completo en el SQL Editor
-- de Supabase antes del próximo despliegue.

-- ═══════════════════════════════════════════════════════════════════
-- 1. CAUSA RAÍZ del "no se ve en tiempo real": guest_media, rsvps y
--    video_greetings nunca se agregaron a la publicación de Supabase
--    Realtime (solo se agregaron love_notes, guest_media_comments,
--    gallery_photos y gallery_comments en scripts anteriores). Sin esto,
--    aunque la foto/video/eliminación se guarda bien en la base de
--    datos, ningún OTRO dispositivo se entera hasta que recarga la
--    página a mano.
-- ═══════════════════════════════════════════════════════════════════
do $$ begin
  alter publication supabase_realtime add table public.guest_media;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.rsvps;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.video_greetings;
exception when duplicate_object then null;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- 2. Hospedaje — cada confirmación puede pedir un cupo de hospedaje.
-- ═══════════════════════════════════════════════════════════════════
alter table public.rsvps add column if not exists wants_lodging boolean not null default false;

-- ═══════════════════════════════════════════════════════════════════
-- 3. Configuración editable de la boda: precio por persona, costo por
--    noche de hospedaje y cupos totales de hospedaje. Una sola fila.
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.wedding_config (
  id int primary key default 1,
  price_per_person numeric not null default 0,
  lodging_price_per_night numeric not null default 350000,
  lodging_total_slots int not null default 10,
  constraint wedding_config_single_row check (id = 1)
);

insert into public.wedding_config (id) values (1)
  on conflict (id) do nothing;

alter table public.wedding_config enable row level security;

drop policy if exists "Anyone can read wedding config" on public.wedding_config;
create policy "Anyone can read wedding config" on public.wedding_config for select using (true);

-- Nota de seguridad: igual que el resto del panel admin, no hay un usuario
-- "admin" real en Supabase — la contraseña solo se valida en el navegador.
-- Esta política permite actualizar con la misma llave pública que ya usa
-- todo el sitio (mismo modelo de seguridad que el resto de la app).
drop policy if exists "Anyone can update wedding config" on public.wedding_config;
create policy "Anyone can update wedding config" on public.wedding_config for update using (true);

do $$ begin
  alter publication supabase_realtime add table public.wedding_config;
exception when duplicate_object then null;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- 4. Verificación — deberías ver 1 fila con tus valores actuales
-- ═══════════════════════════════════════════════════════════════════
select * from public.wedding_config;
