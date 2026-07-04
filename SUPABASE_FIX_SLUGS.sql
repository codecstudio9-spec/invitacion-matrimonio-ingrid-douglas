-- ═══════════════════════════════════════════════════════════════════
-- 1. Diagnóstico: revisa cómo está guardado "julieta-santiago" HOY.
--    Corre esto PRIMERO y mira el resultado antes de seguir.
-- ═══════════════════════════════════════════════════════════════════
select id, slug, length(slug) as largo, display_name, side, passes
from public.guests
where slug ilike '%julieta%' or slug ilike '%santiago%';

-- Si "slug" no sale exactamente "julieta-santiago" (por ejemplo con un
-- espacio al final, con mayúscula, o con un guion distinto), ahí está la
-- causa. El paso 2 lo corrige para TODA la tabla de una vez.

-- ═══════════════════════════════════════════════════════════════════
-- 2. Normaliza todos los slugs (quita espacios invisibles y mayúsculas)
--    Seguro de correr aunque ya estén bien — no cambia nada si ya están limpios.
-- ═══════════════════════════════════════════════════════════════════
update public.guests
set slug = lower(trim(slug));

-- ═══════════════════════════════════════════════════════════════════
-- 3. Unifica Sergio, Tatiana y Antonela en una sola invitación (3 pases)
-- ═══════════════════════════════════════════════════════════════════
delete from public.guests
where slug in ('sergio', 'tatiana-antonela');

insert into public.guests (slug, display_name, side, passes) values
  ('sergio-tatiana-antonela', 'Sergio, Tatiana & Antonela', 'ingrid', 3);

-- ═══════════════════════════════════════════════════════════════════
-- 4. Verificación final: confirma que julieta-santiago existe limpio
--    y que Sergio/Tatiana/Antonela quedó unificado
-- ═══════════════════════════════════════════════════════════════════
select slug, display_name, side, passes
from public.guests
where slug in ('julieta-santiago', 'sergio-tatiana-antonela', 'sergio', 'tatiana-antonela')
order by slug;
-- Deberías ver solo 2 filas: julieta-santiago y sergio-tatiana-antonela.
