-- ============================================================================
-- El registro de pedidos enviados desde la web.
--
-- Cópialo entero en el editor SQL de Supabase (SQL Editor → New query → Run).
-- Crea la tabla y decide quién puede hacer qué:
--
--   · Escribir: cualquiera. Tiene que ser así — el apunte lo manda el
--     navegador del cliente con la clave anónima, que es pública y viaja en
--     la página. Solo puede insertar: ni leer, ni cambiar, ni borrar.
--   · Leer: solo una sesión con usuario y contraseña. Si la lectura
--     estuviera abierta, cualquiera con la clave anónima —que está a la
--     vista en el código— podría sacar las ventas del negocio.
--
-- El apunte no lleva nombre, dirección ni teléfono de nadie: eso va por
-- WhatsApp y ahí se queda. Aquí solo hay cuántos, de qué y por cuánto.
-- ============================================================================

create table if not exists public.pedidos (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null,                       -- el número que ve el cliente
  at          timestamptz not null default now(),
  sede        text not null,                       -- restaurante | cafe
  servicio    text not null,                       -- mesa | pickup | delivery
  items       integer not null default 0,
  subtotal    numeric(10,2),
  envio       numeric(10,2),
  total       numeric(10,2),
  total_bs    numeric(14,2),
  tasa        numeric(14,4),
  metodo      text,
  km          numeric(6,2),
  lineas      jsonb not null default '[]'::jsonb,
  creado      timestamptz not null default now()
);

create index if not exists pedidos_at_idx   on public.pedidos (at desc);
create index if not exists pedidos_sede_idx on public.pedidos (sede, at desc);

alter table public.pedidos enable row level security;

-- --- escribir: la web, con la clave anónima -------------------------------
drop policy if exists "la web apunta su pedido" on public.pedidos;
create policy "la web apunta su pedido"
  on public.pedidos for insert
  to anon, authenticated
  with check (true);

-- --- leer: solo con sesión iniciada ---------------------------------------
drop policy if exists "el informe lo lee el negocio" on public.pedidos;
create policy "el informe lo lee el negocio"
  on public.pedidos for select
  to authenticated
  using (true);

-- Nadie modifica ni borra: no hay política de update ni de delete, y con RLS
-- activo lo que no está permitido está prohibido. Para corregir algo, desde
-- el panel de Supabase.

-- ============================================================================
-- Después de ejecutar esto:
--
--   1. Authentication → Users → Add user: correo y contraseña del dueño.
--      Marca «Auto Confirm User» para no pelear con el correo de validación.
--   2. Project Settings → API: copia «Project URL» y la clave «anon /
--      publishable». Esas dos van en site/data/remoto.js.
--      La clave «service_role» NO: esa se salta todas las reglas de arriba.
-- ============================================================================
