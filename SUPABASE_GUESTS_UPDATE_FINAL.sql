-- Reemplaza la lista completa de invitados con la versión final.
--
-- Nota de seguridad: si algún invitado YA confirmó asistencia o subió una
-- foto/video/nota (su fila está referenciada desde rsvps/guest_media/
-- love_notes por guest_id), este DELETE va a fallar solo por la restricción
-- de llave foránea, en vez de borrar esos datos en silencio. Si eso pasa,
-- avísame para hacer un ajuste quirúrgico en vez de un reemplazo completo.

delete from public.invitados;

insert into public.invitados (nombre, pases, slug, grupo) values
  -- Invitados de Ingrid (14)
  ('Mamita & Papito',           2, 'mamita-papito-ingrid',    'ingrid'),
  ('Lina y Joseph',             2, 'lina-joseph',              'ingrid'),
  ('Natalia y Sneider',         2, 'natalia-sneider',          'ingrid'),
  ('Viviana, Mat y Amaia',      3, 'viviana-mat-amaia',        'ingrid'),
  ('Johana, Brian y Thiago',    3, 'johana-brian-thiago',      'ingrid'),
  ('Viviana y David',           2, 'viviana-david',            'ingrid'),
  ('Sergio, Tatiana & Antonela',3, 'sergio-tatiana-antonela',  'ingrid'),
  ('Johana, Gael y Gerardo',    3, 'johana-gael-gerardo',      'ingrid'),
  ('Angie y Daniel',            2, 'angie-daniel',             'ingrid'),
  ('Jessica y Fabiolita',       2, 'jessica-fabiolita',        'ingrid'),
  ('Julieta y Santiago',        2, 'julieta-santiago',         'ingrid'),
  ('Fabio',                     1, 'fabio',                    'ingrid'),
  ('Martica',                   1, 'martica',                  'ingrid'),
  ('Cristian & Daniela',        2, 'cristian-daniela',         'ingrid'),

  -- Invitados de Douglas (8)
  ('Mamita & Papito',   2, 'mamita-papito-douglas', 'douglas'),
  ('Sebas',             1, 'sebas',                 'douglas'),
  ('Manu',              1, 'manu',                  'douglas'),
  ('Jesús y Leidy',     2, 'jesus-leidy',           'douglas'),
  ('Diego',             1, 'diego',                 'douglas'),
  ('Nando y Vicky',     2, 'nando-vicky',           'douglas'),
  ('Pastor y Pastora',  2, 'pastor-y-pastora',      'douglas'),
  ('Melisa y Santiago', 2, 'melisa-santiago',       'douglas');

-- Verificación: deberías ver 2 filas (ingrid: 14 grupos/30 pases,
-- douglas: 8 grupos/13 pases)
select grupo, count(*) as grupos, sum(pases) as total_pases
from public.invitados
group by grupo
order by grupo;
