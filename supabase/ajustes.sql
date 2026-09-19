-- ============================================================================
-- Los ajustes del negocio que se rellenan desde el panel.
--
-- Hoy solo guarda una fila, «puesta-en-marcha»: la lista de lo que falta por
-- preguntarle al local y lo que ya contestó. Es una tabla de clave y valor a
-- propósito, para que la siguiente cosa que haya que guardar no necesite otra
-- migración.
--
-- Por qué compartida y no en el navegador: la lista se rellena preguntando.
-- Uno pregunta desde el teléfono en el local y otro apunta desde el portátil,
-- y con localStorage cada uno vería la mitad de las respuestas.
--
-- Quién puede hacer qué, y en qué se diferencia de `pedidos`:
--
--   · `pedidos` lo escribe cualquiera —lo manda el navegador del cliente con
--     la clave publicable— y solo lo lee el dueño del informe.
--   · `ajustes` NO lo escribe cualquiera. Aquí van el teléfono del pago
--     móvil y el RIF del negocio, y aunque acaben publicados en la web, quien
--     decide cuáles son es el dueño. Leer y escribir exigen la misma marca
--     `rol = 'informe'`.
--
-- Si esta tabla no existe, el panel no se rompe: la lista se queda guardada
-- en el navegador y lo avisa.
-- ============================================================================

create table if not exists public.ajustes (
  clave       text primary key check (char_length(clave) between 3 and 64),
  valor       jsonb not null default '{}'::jsonb check (
                jsonb_typeof(valor) = 'object' and pg_column_size(valor) < 64000),
  actualizado timestamptz not null default now(),
  creado      timestamptz not null default now()
);

alter table public.ajustes enable row level security;

-- auth.jwt() dentro de un select: Postgres lo evalúa una vez por consulta y no
-- una vez por fila (aviso «auth_rls_initplan» del asesor de Supabase).
create or replace function public.es_del_informe()
returns boolean language sql stable as $$
  select ((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'informe'
$$;

drop policy if exists "el negocio lee sus ajustes" on public.ajustes;
create policy "el negocio lee sus ajustes"
  on public.ajustes for select to authenticated
  using (public.es_del_informe());

drop policy if exists "el negocio apunta sus ajustes" on public.ajustes;
create policy "el negocio apunta sus ajustes"
  on public.ajustes for insert to authenticated
  with check (public.es_del_informe());

drop policy if exists "el negocio corrige sus ajustes" on public.ajustes;
create policy "el negocio corrige sus ajustes"
  on public.ajustes for update to authenticated
  using (public.es_del_informe())
  with check (public.es_del_informe());

-- Nadie borra: no hay política de delete, y con RLS activo lo que no está
-- permitido está prohibido. Una lista de recados no se borra, se reescribe.

-- El panel manda la fila entera con `Prefer: resolution=merge-duplicates`,
-- que es un upsert por la clave primaria. Sin este índice único —que la
-- clave primaria ya es— PostgREST rechazaría el on_conflict.
