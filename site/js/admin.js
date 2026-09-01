/**
 * Panel de cocina (KDS) + control de carta.
 * Comparte el mismo store y el mismo localStorage que la web pública:
 * lo que se apaga aquí desaparece de la carta al instante.
 */
import { store, money, BRANCHES, MENUS } from './store.js';
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
      <span class="kds__state">${esc(state.label)}</span>
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
    <footer class="kds__foot">
      <span class="kds__total">${money(o.subtotal)}</span>
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
    list.innerHTML = `<p class="muted">Sin comandas registradas todavía. Las que se envíen por WhatsApp desde
      esta web aparecerán aquí, en este dispositivo.</p>`;
    return;
  }
  list.innerHTML = orders.map(orderCard).join('');
}

/* --------------------------------------------------------------- métricas */
function renderMetrics() {
  const today = visibleOrders().filter((o) => isToday(o.at));
  const revenue = today.reduce((n, o) => n + o.subtotal, 0);
  const items = today.reduce((n, o) => n + o.lines.reduce((m, l) => m + l.qty, 0), 0);

  const tally = {};
  today.forEach((o) => o.lines.forEach((l) => { tally[l.name] = (tally[l.name] || 0) + l.qty; }));
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5);

  $('#metrics').innerHTML = `
    <div class="stat"><span>Comandas hoy</span><b>${today.length}</b></div>
    <div class="stat"><span>Ítems hoy</span><b>${items}</b></div>
    <div class="stat"><span>Estimado hoy</span><b>${money(revenue)}</b></div>
    <div class="stat"><span>Pendientes</span><b>${visibleOrders().filter((o) => o.state !== 'completado').length}</b></div>`;

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
  $('#filters').innerHTML = [{ id: 'todas', name: 'Todas las sedes' }, ...BRANCHES]
    .map((b) => `<button data-filter="${b.id}" class="${filter === b.id ? 'is-on' : ''}">${esc(b.name)}</button>`)
    .join('');
}

function renderAll() {
  renderFilters();
  renderOrders();
  renderMetrics();
  renderStock();
}

function boot() {
  renderAll();

  $('#filters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    filter = b.dataset.filter;
    renderAll();
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
    if (confirm('¿Borrar el historial de comandas de este dispositivo?')) store.clearOrders();
  });

  store.on((what) => {
    if (what === 'orders') { renderOrders(); renderMetrics(); }
    if (what === 'stock' || what === 'prices') { renderStock(); }
  });

  // otra pestaña envió una comanda
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
