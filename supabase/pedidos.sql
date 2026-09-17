-- ============================================================================
-- El registro de pedidos enviados desde la web.
--
-- Aplicado en el proyecto «zhuba-maracay» (ref xxvtauynujapaejejmyd). Este
-- archivo es la copia de lo que hay allí: si se cambia la tabla, se cambia
-- aquí también.
--
-- Quién puede hacer qué:
--
--   · Escribir: cualquiera. Tiene que ser así — el apunte lo manda el
--     navegador del cliente con la clave publicable, que viaja en la página.
--     Solo puede insertar, y solo filas con forma de pedido: los CHECK de
--     abajo rechazan sedes, servicios y métodos que no existen, importes
--     absurdos y fechas que no son de hoy.
--   · Leer: solo un usuario marcado como dueño del informe. No basta con
--     tener sesión: Supabase deja registrarse a cualquiera por defecto, y un
--     desconocido con cuenta podría sacar las ventas del negocio. La marca va
--     en app_metadata, que el propio usuario no puede tocar.
--
-- El apunte no lleva nombre, dirección ni teléfono de nadie: eso va por
-- WhatsApp y ahí se queda. Aquí solo hay cuántos, de qué y por cuánto.
-- ============================================================================

create table if not exists public.pedidos (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null check (char_length(codigo) between 4 and 16),
  at          timestamptz not null default now(),
  sede        text not null check (sede in ('restaurante', 'cafe')),
  servicio    text not null check (servicio in ('mesa', 'pickup', 'delivery')),
  items       integer not null check (items between 1 and 500),
  subtotal    numeric(10,2) check (subtotal >= 0 and subtotal < 100000),
  envio       numeric(10,2) check (envio >= 0 and envio < 1000),
  total       numeric(10,2) check (total >= 0 and total < 100000),
  total_bs    numeric(16,2) check (total_bs >= 0),
  tasa        numeric(14,4) check (tasa > 0),
  metodo      text check (metodo in ('pago-movil', 'transferencia', 'zelle', 'binance', 'efectivo')),
  km          numeric(6,2) check (km >= 0 and km < 1000),
  lineas      jsonb not null default '[]'::jsonb check (
                case when jsonb_typeof(lineas) = 'array'
                     then jsonb_array_length(lineas) <= 200 else false end),
  creado      timestamptz not null default now()
);

create index if not exists pedidos_at_idx   on public.pedidos (at desc);
create index if not exists pedidos_sede_idx on public.pedidos (sede, at desc);

alter table public.pedidos enable row level security;

-- --- escribir: la web, con la clave publicable -----------------------------
-- La fecha la pone el teléfono del cliente; se acepta con un día de margen
-- para relojes mal puestos, pero no un pedido «de hace un año».
drop policy if exists "la web apunta su pedido" on public.pedidos;
create policy "la web apunta su pedido"
  on public.pedidos for insert
  to anon, authenticated
  with check (at between now() - interval '1 day' and now() + interval '1 day');

-- --- leer: solo el dueño del informe ---------------------------------------
drop policy if exists "el informe lo lee el negocio" on public.pedidos;
create policy "el informe lo lee el negocio"
  on public.pedidos for select
  to authenticated
  -- auth.jwt() dentro de un select: Postgres lo evalúa una vez por consulta y no
  -- una vez por fila (aviso «auth_rls_initplan» del asesor de Supabase).
  using (((select auth.jwt()) -> 'app_metadata' ->> 'rol') = 'informe');

-- Nadie modifica ni borra: no hay política de update ni de delete, y con RLS
-- activo lo que no está permitido está prohibido.

-- ============================================================================
-- Para dar acceso al informe a alguien:
--
--   1. Authentication → Users → Add user → Create new user: su correo y una
--      contraseña, con «Auto Confirm User» marcado.
--   2. Marcarlo como dueño del informe (SQL Editor):
--
--        update auth.users
--           set raw_app_meta_data = raw_app_meta_data || '{"rol":"informe"}'
--         where email = 'correo@del-dueno.com';
--
--      La marca entra en la sesión siguiente: si ya estaba dentro, que salga
--      y vuelva a entrar.
-- ============================================================================
