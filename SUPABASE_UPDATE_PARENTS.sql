-- Unifica las 4 invitaciones de padres (1 pase cada una) en 2 invitaciones
-- conjuntas "Mamita & Papito" (2 pases cada una), una por cada lado.

delete from public.guests
where slug in ('mama-ingrid', 'papa-ingrid', 'mama-douglas', 'papa-douglas');

insert into public.guests (slug, display_name, side, passes) values
  ('mamita-papito-ingrid',  'Mamita & Papito', 'ingrid',  2),
  ('mamita-papito-douglas', 'Mamita & Papito', 'douglas', 2);
