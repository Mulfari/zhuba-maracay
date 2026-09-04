/**
 * Panel de cocina (KDS) + control de carta.
 * Comparte el mismo store y el mismo localStorage que la web pública:
 * lo que se apaga aquí desaparece de la carta al instante.
 */
import { store, money, bolivares, BRANCHES, MENUS, METODOS_PAGO } from './store.js';
import { CONFIG_DEMO, PEDIDOS_DEMO, AGOTADOS_DEMO } from '../data/demo.js';
import { ORDER_STATES, SERVICE_MODES } from '../data/modifiers.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const PIN = '1108';
const SESSION_KEY = 'zhuba.admin.ok';

let filter = 'todas';
let query = '';

/* ------------------------------------------------------------------ acceso */
function gate() {
  const ok = sessionStorage.getItem(SESSION_KEY) === '1';
  $('#gate').hidden = ok;
  $('#panel').hidden = !ok;
  if (ok) boot();
}

function bindGate() {
  const form = $('#gateForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = $('#pin').value.trim();
    if (value === PIN) {
      sessionStorage.setItem(SESSION_KEY, '1');
      $('#gateError').textContent = '';
      gate();
    } else {
      $('#gateError').textContent = 'Código incorrecto.';
      $('#pin').value = '';
      $('#pin').focus();
    }
  });
  $('#logout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });
}

/* ---------------------------------------------------------------- pedidos */
const branchName = (id) => BRANCHES.find((b) => b.id === id)?.name || id;
const timeOf = (ts) => new Date(ts).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();

function visibleOrders() {
  return store.orders.filter((o) => filter === 'todas' || o.branch === filter);
}

function orderCard(o) {
  const state = ORDER_STATES.find((x) => x.id === o.state) || ORDER_STATES[0];
  const labels = Object.fromEntries(
    (SERVICE_MODES.find((m) => m.id === o.mode)?.fields || []).map((f) => [f.id, f.label]));
  const who = Object.entries(o.fields || {})
    .filter(([k, v]) => k !== '_note' && String(v).trim())
    .map(([k, v]) => `<b>${esc(labels[k] || k)}:</b> ${esc(v)}`).join(' · ');

  return `
  <article class="kds" data-order="${o.id}" style="--st:${state.color}">
    <header class="kds__head">
      <div>
        <span class="kds__id">#${esc(o.id)}</span>
        <span class="kds__meta">${timeOf(o.at)} · ${esc(branchName(o.branch))} · ${esc(SERVICE_MODES.find((m) => m.id === o.mode)?.label || o.mode)}</span>
      </div>
      <div class="kds__marcas">
        ${o.pago ? `<span class="kds__cobro${o.pago.metodoId === 'efectivo' ? ' is-pendiente' : ' is-cobrado'}">${
          o.pago.metodoId === 'efectivo' ? 'Cobrar al entregar' : 'Pagado'}</span>` : ''}
        <span class="kds__state">${esc(state.label)}</span>
      </div>
    </header>
    ${who ? `<p class="kds__who">${who}</p>` : ''}
    <ul class="kds__lines">
      ${o.lines.map((l) => `
        <li>
          <b>${l.qty}×</b> ${esc(l.name)}${l.variant ? ` <em>(${esc(l.variant)})</em>` : ''}
          ${l.adjustments?.length ? `<span class="kds__mods">${l.adjustments.map(esc).join(' · ')}</span>` : ''}
          ${l.note ? `<span class="kds__note">▸ ${esc(l.note)}</span>` : ''}
        </li>`).join('')}
    </ul>
    ${o.fields?._note ? `<p class="kds__note">▸ ${esc(o.fields._note)}</p>` : ''}
    ${o.pago ? `<p class="kds__pago">
      <b>${esc(o.pago.metodo)}</b>${o.pago.referencia ? ` · ref. ${esc(o.pago.referencia)}` : ''}${
        o.pago.telefono ? ` · ${esc(o.pago.telefono)}` : ''}${
        o.pago.conComprobante ? ' · con comprobante' : ''}</p>` : ''}
    ${o.entrega ? `<p class="kds__geo"><a href="https://www.google.com/maps?q=${o.entrega.lat},${o.entrega.lng}"
       target="_blank" rel="noopener">${o.entrega.km.toFixed(1)} km · ver en el mapa</a>${
       o.envio ? ` · envío ${money(o.envio)}` : ''}</p>` : ''}
    <footer class="kds__foot">
      <span class="kds__total">${money(o.total ?? o.subtotal)}${
        o.pago?.enBs != null ? `<small>${bolivares(o.pago.enBs)}</small>` : ''}</span>
      <div class="kds__steps">
        ${ORDER_STATES.map((s) => `
          <button data-state="${s.id}" class="${s.id === o.state ? 'is-on' : ''}">${esc(s.label)}</button>`).join('')}
      </div>
    </footer>
  </article>`;
}

function renderOrders() {
  const list = $('#orders');
  const orders = visibleOrders();
  if (!orders.length) {
    list.innerHTML = `<p class="muted">Sin pedidos registrados todavía. Los que se envíen por WhatsApp desde
      esta web aparecerán aquí, en este dispositivo.</p>`;
    return;
  }
  list.innerHTML = orders.map(orderCard).join('');
}

/* --------------------------------------------------------------- métricas */
/** La cifra en bolívares debajo de la de dólares, o nada si no hay tasa. */
const enBs = (usd) => {
  const v = store.aBs(usd);
  return v == null ? '' : `<small>${bolivares(v)}</small>`;
};

function renderMetrics() {
  const today = visibleOrders().filter((o) => isToday(o.at));
  const totalDe = (o) => o.total ?? o.subtotal;
  // Cobrado es lo que ya entró por pago móvil, transferencia, Zelle o Binance.
  // El efectivo y lo que llegó sin pago se cuentan aparte: todavía no está.
  const cobrado = today.filter((o) => o.pago && o.pago.metodoId !== 'efectivo');
  const porCobrar = today.filter((o) => !o.pago || o.pago.metodoId === 'efectivo');
  const suma = (lista, fn) => lista.reduce((n, o) => n + (fn(o) || 0), 0);
  const revenue = suma(today, totalDe);
  const envios = suma(today, (o) => o.envio);
  const items = today.reduce((n, o) => n + o.lines.reduce((m, l) => m + l.qty, 0), 0);

  const tally = {};
  today.forEach((o) => o.lines.forEach((l) => { tally[l.name] = (tally[l.name] || 0) + l.qty; }));
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Cuatro cifras se miran; las otras cuatro se consultan. No merecen el
  // mismo tamaño ni ocupar dos pantallas antes de llegar a los pedidos.
  const pendientes = visibleOrders().filter((o) => o.state !== 'completado').length;
  $('#metrics').innerHTML = `
    <div class="stat"><span>Pedidos hoy</span><b>${today.length}</b></div>
    <div class="stat"><span>Pendientes</span><b>${pendientes}</b></div>
    <div class="stat"><span>Facturado</span><b>${money(revenue)}${enBs(revenue)}</b></div>
    <div class="stat stat--ojo"><span>Por cobrar</span><b>${money(suma(porCobrar, totalDe))}${
      enBs(suma(porCobrar, totalDe))}</b></div>`;

  $('#metricsMas').textContent = today.length
    ? `${items} ítems · ya cobrado ${money(suma(cobrado, totalDe))} · envíos ${money(envios)}`
      + ` · ticket medio ${money(revenue / today.length)}`
    : 'Sin ventas hoy todavía.';

  $('#top').innerHTML = top.length
    ? top.map(([name, n], i) => `<li><span class="rank">${i + 1}</span>${esc(name)}<b>${n}</b></li>`).join('')
    : '<li class="muted">Aún no hay ventas hoy.</li>';
}

/* ------------------------------------------------------- carta / inventario */
function allItems() {
  return BRANCHES.flatMap((b) =>
    MENUS[b.menu].ITEMS.map((i) => ({ ...i, branch: b.id, branchName: b.name })));
}

function renderStock() {
  const wrap = $('#stock');
  const q = query.trim().toLowerCase();
  const rows = allItems()
    .filter((i) => filter === 'todas' || i.branch === filter)
    .filter((i) => !q || i.name.toLowerCase().includes(q))
    .slice(0, 400);

  $('#stockCount').textContent = `${rows.length} platos`;

  wrap.innerHTML = rows.map((i) => {
    const out = store.isOut(i.id);
    const base = store.basePrice(i);
    const edited = store.prices[i.id] != null;
    return `
    <tr class="${out ? 'is-out' : ''}">
      <td>
        <b>${esc(i.name)}</b>
        <span class="muted">${esc(i.branchName)} · ${esc(i.cat)}</span>
      </td>
      <td class="num">
        ${base == null
          ? '<span class="muted">vitrina</span>'
          : `<input type="number" step="0.5" min="0" value="${base}" data-price="${i.id}" aria-label="Precio de ${esc(i.name)}">
             ${edited ? `<button class="reset" data-reset="${i.id}" title="Volver al precio oficial">↺</button>` : ''}`}
      </td>
      <td class="num">
        <button class="toggle ${out ? '' : 'is-on'}" data-stock="${i.id}"
                aria-pressed="${!out}" aria-label="Disponibilidad de ${esc(i.name)}">
          <i></i><span>${out ? 'Agotado' : 'Disponible'}</span>
        </button>
      </td>
    </tr>`;
  }).join('');
}

/* ------------------------------------------------------------------ arranque */
function renderFilters() {
  const sel = $('#sede');
  const opciones = [{ id: 'todas', name: 'Todas las sedes' }, ...BRANCHES];
  if (sel.options.length !== opciones.length) {
    sel.innerHTML = opciones.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
  }
  sel.value = filter;
}

function renderAll() {
  renderFilters();
  renderOrders();
  renderMetrics();
  renderStock();
  renderCobro();
}

function boot() {
  store.cargarTasa().then(renderCobro);
  renderAll();
  bindCobro();

  $('#sede').addEventListener('change', (e) => { filter = e.target.value; renderAll(); });

  // Pestañas: se muestra una y se esconden las otras. El panel se usa de pie
  // y con una mano; que haya que buscar menos.
  $('.adm-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    $$('.adm-tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $$('.adm-tab').forEach((sec) => { sec.hidden = sec.id !== `tab-${b.dataset.tab}`; });
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  $('#orders').addEventListener('click', (e) => {
    const b = e.target.closest('[data-state]');
    if (!b) return;
    const id = b.closest('[data-order]').dataset.order;
    store.setOrderState(id, b.dataset.state);
  });

  $('#search').addEventListener('input', (e) => { query = e.target.value; renderStock(); });

  $('#stock').addEventListener('click', (e) => {
    const t = e.target.closest('[data-stock]');
    if (t) return store.setStock(t.dataset.stock, !(t.getAttribute('aria-pressed') === 'true'));
    const r = e.target.closest('[data-reset]');
    if (r) return store.setPrice(r.dataset.reset, null);
  });

  $('#stock').addEventListener('change', (e) => {
    const input = e.target.closest('[data-price]');
    if (input) store.setPrice(input.dataset.price, input.value);
  });

  $('#clearOrders').addEventListener('click', () => {
    if (confirm('¿Borrar el historial de pedidos de este dispositivo?')) store.clearOrders();
  });

  store.on((what) => {
    if (what === 'orders') { renderOrders(); renderMetrics(); }
    if (what === 'stock' || what === 'prices') { renderStock(); }
    if (what === 'tasa') { renderCobro(); renderMetrics(); }
  });

  // otra pestaña envió un pedido
  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith('zhuba.')) return;
    store.orders = JSON.parse(localStorage.getItem('zhuba.orders.v1') || '[]');
    store.stock = JSON.parse(localStorage.getItem('zhuba.stock.v1') || '{}');
    store.prices = JSON.parse(localStorage.getItem('zhuba.prices.v1') || '{}');
    renderAll();
  });
}

bindGate();
gate();

/* ------------------------------------------------------- cobro y envío */
/* Lo que el restaurante configura y la web no puede inventar: a dónde se
   paga, cuánto cuesta llevarlo y a quién avisar cuando alguien paga. */
function renderCobro() {
  const c = store.config;
  const t = store.tasa;

  $('#tasaEstado').innerHTML = t
    ? `<b>${money(1)} = ${bolivares(t.valor)}</b><span class="muted">${esc(t.fuente)} · ${
        new Date(t.fecha).toLocaleDateString('es-VE')}</span>`
    : '<b>Sin tasa</b><span class="muted">no se pudo consultar</span>';
  $('#tasaManual').value = c.tasaManual ?? '';

  $('#metodos').innerHTML = METODOS_PAGO.filter((m) => m.campos.length).map((m) => {
    const d = c.pagos[m.id] || {};
    const listo = m.campos.every((x) => String(d[x.id] || '').trim());
    return `
    <fieldset class="metodo${listo ? ' is-listo' : ''}">
      <legend>${esc(m.nombre)} <span>${listo ? 'publicado' : 'sin publicar'}</span></legend>
      ${m.campos.map((x) => `
        <label><span>${esc(x.label)}</span>
          <input data-pago-metodo="${m.id}" data-pago-campo="${x.id}"
                 value="${esc(d[x.id] || '')}" placeholder="${esc(x.placeholder || '')}"></label>`).join('')}
    </fieldset>`;
  }).join('');

  $('#anillos').innerHTML = store.anillos.map((a) => `
    <label class="anillo"><span>${esc(a.etiqueta)}</span>
      <input type="number" step="0.5" min="0" data-anillo="${a.id}"
             value="${a.precio ?? ''}" placeholder="sin precio"></label>`).join('');
  $('#maxKm').value = c.maxKm ?? '';
  $('#aviso').value = c.aviso ?? '';
}

function bindCobro() {
  const guarda = (fn) => { fn(); store.setConfig(store.config); renderCobro(); };

  $('#cobro').addEventListener('change', (e) => {
    const m = e.target.closest('[data-pago-metodo]');
    if (m) return guarda(() => {
      const id = m.dataset.pagoMetodo;
      store.config.pagos[id] = { ...(store.config.pagos[id] || {}), [m.dataset.pagoCampo]: m.value.trim() };
    });
    const a = e.target.closest('[data-anillo]');
    if (a) return guarda(() => {
      const v = a.value.trim();
      if (v === '') delete store.config.anillos[a.dataset.anillo];
      else store.config.anillos[a.dataset.anillo] = Number(v);
    });
    if (e.target.id === 'maxKm') return guarda(() => { store.config.maxKm = Number(e.target.value) || null; });
    if (e.target.id === 'aviso') return guarda(() => { store.config.aviso = e.target.value.trim(); });
    if (e.target.id === 'tasaManual') return guarda(() => {
      const v = e.target.value.trim();
      store.config.tasaManual = v === '' ? null : Number(v);
      store.cargarTasa();
    });
  });

  $('#tasaRefrescar').addEventListener('click', async () => {
    store.config.tasaManual = null;
    store.setConfig(store.config);
    store.tasa = null;
    await store.cargarTasa();
    renderCobro();
  });

  /* ------------------------------------------------------- demostración
     Con el panel vacío no se ve nada de lo que hace. Esto lo llena con datos
     marcados como falsos, y se quita con el botón de al lado. */
  const demoEstado = () => {
    const n = store.orders.filter((o) => PEDIDOS_DEMO.some((d) => d.id === o.id)).length;
    $('#demoEstado').textContent = n
      ? `Hay ${n} ${n === 1 ? 'pedido' : 'pedidos'} de muestra cargados.`
      : 'Ahora mismo no hay datos de muestra.';
  };

  $('#demoCargar').addEventListener('click', () => {
    const ids = new Set(PEDIDOS_DEMO.map((d) => d.id));
    store.orders = [...PEDIDOS_DEMO.map((d) => ({ ...d })),
      ...store.orders.filter((o) => !ids.has(o.id))];
    localStorage.setItem('zhuba.orders.v1', JSON.stringify(store.orders));
    store.setConfig(CONFIG_DEMO);
    Object.entries(AGOTADOS_DEMO).forEach(([id, ok]) => store.setStock(id, ok));
    renderAll();
    demoEstado();
  });

  $('#demoBorrar').addEventListener('click', () => {
    const ids = new Set(PEDIDOS_DEMO.map((d) => d.id));
    store.orders = store.orders.filter((o) => !ids.has(o.id));
    localStorage.setItem('zhuba.orders.v1', JSON.stringify(store.orders));
    store.setConfig({ pagos: {}, anillos: {}, aviso: '' });
    Object.keys(AGOTADOS_DEMO).forEach((id) => store.setStock(id, true));
    renderAll();
    demoEstado();
  });

  demoEstado();

  $('#avisoProbar').addEventListener('click', async () => {
    const r = await store.avisar({ prueba: true, en: new Date().toISOString(), sede: store.branch.name });
    alert(r.enviado
      ? 'Aviso de prueba enviado. Revisa que haya llegado a tu destino.'
      : 'No se envió: ' + (r.motivo === 'sin-webhook' ? 'falta la dirección del aviso (https://…)' : r.motivo));
  });
}
