-- Corre ESTO exactamente como está, completo, en el SQL Editor de Supabase.
--
-- Probé el borrado directo contra tu base de datos (con la misma llave
-- pública que usa el sitio) y confirmé algo importante: el DELETE se
-- "acepta" sin error, pero la fila NUNCA desaparece — eso solo pasa cuando
-- no existe una política de Row Level Security que permita borrar. Por eso
-- el panel admin "parece" borrar (tu pantalla se actualiza sola) pero la
-- fila real sigue viva en Supabase — y cuando la app vuelve a consultar la
-- lista, esa fila reaparece apuntando a un archivo que el storage sí borró
-- de verdad, por eso se ve como un recuadro vacío/fantasma.
--
-- Este archivo trae SOLO las políticas de borrado, sin nada más, para que
-- no haya ninguna duda de qué se está ejecutando.

drop policy if exists "Anyone can delete guest media" on public.guest_media;
create policy "Anyone can delete guest media" on public.guest_media for delete using (true);

drop policy if exists "Anyone can delete video greetings" on public.video_greetings;
create policy "Anyone can delete video greetings" on public.video_greetings for delete using (true);

drop policy if exists "Anyone can delete love notes" on public.love_notes;
create policy "Anyone can delete love notes" on public.love_notes for delete using (true);

drop policy if exists "Anyone can delete guest media comments" on public.guest_media_comments;
create policy "Anyone can delete guest media comments" on public.guest_media_comments for delete using (true);

drop policy if exists "Anyone can delete rsvps" on public.rsvps;
create policy "Anyone can delete rsvps" on public.rsvps for delete using (true);

drop policy if exists "Anyone can delete gallery comments" on public.gallery_comments;
create policy "Anyone can delete gallery comments" on public.gallery_comments for delete using (true);

-- Limpieza: borra ya mismo los registros de prueba que quedaron "fantasma"
-- en guest_media (yo no puedo borrarlos por API — necesito que esto se
-- corra directo en el SQL Editor, que sí tiene permiso completo).
delete from public.guest_media
where name in ('TEST_DIAG', 'RLS_TEST', 'Prueba 1')
   or url like '%example.com%'
   or url like '%rls-test%';

-- Verificación — deberías ver 6 filas con "DELETE" en cmd
select schemaname, tablename, policyname, cmd
from pg_policies
where tablename in ('guest_media', 'video_greetings', 'love_notes', 'guest_media_comments', 'rsvps', 'gallery_comments')
  and cmd = 'DELETE'
order by tablename;
