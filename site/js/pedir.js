/**
 * ZHUBA · Pedido en línea.
 *
 * Página aparte de la portada y con otro trabajo: aquí no se cuenta la casa,
 * se arma una comanda. Llega tráfico frío desde el enlace de Instagram, casi
 * todo desde el móvil, así que manda la rapidez: buscador, lista compacta con
 * miniatura y un botón de añadir siempre a la vista.
 */
import { store, money, BRANCHES, CONTACT } from './store.js';
import { TAGS, ADJUSTMENTS, ADJUSTMENT_MAP, ADJUSTMENT_NOTE, SERVICE_MODES } from '../data/modifiers.js';
import { whatsappLink, orderSnapshot } from './ticket.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICON = {
  plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  close: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  table: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.5v5a1.7 1.7 0 003.4 0v-5M7.7 7.5V17.5"/><path d="M14.3 2.5c-1.3 0-2.1 1.5-2.1 3.6s.8 3.4 2.1 3.4v8"/></svg>',
  bag: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h12l-1 11H5L4 6zM7.5 6V4.6a2.5 2.5 0 015 0V6"/></svg>',
  moped: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="14.5" r="2.2"/><circle cx="15.5" cy="14.5" r="2.2"/><path d="M7.2 14.5h6.1M4.5 12V8.2a2 2 0 012-2H9l3.2 5.3h2.6"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.2-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.4.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.4M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2z"/></svg>'
};

/* ==================================================== utilidades de vista */
const priceLabel = (item) => {
  const p = store.basePrice(item);
  if (p == null) return { main: item.priceNote || 'Consultar', sub: '' };
  const many = !item.price && item.variants?.length > 1;
  return { main: money(p), sub: many ? 'desde' : '' };
};

const tagChip = (t) => {
  const meta = TAGS[t];
  if (!meta) return '';
  const cls = t === 'picante' ? 'tag tag--picante' : meta.kind === 'diet' ? 'tag tag--diet' : 'tag';
  return `<span class="${cls}">${meta.icon ? meta.icon + ' ' : ''}${esc(meta.label)}</span>`;
};

function figure(item, cls = 'card__figure') {
  if (!item.img) return '';
  return `<div class="${cls}"><img src="img/${esc(item.img)}" alt="${esc(item.name)}" loading="lazy" decoding="async" width="520" height="520"></div>`;
}
/* Estado real del local en hora de Venezuela: abre a las 12:00 m. y cierra a
   medianoche, salvo de jueves a sábado, que estira hasta la 1:00 a.m. */
function estadoLocal() {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Caracas', hour12: false, weekday: 'short', hour: '2-digit'
  }).formatToParts(new Date());
  const val = (t) => partes.find((x) => x.type === t).value;
  const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dia = dias[val('weekday')];
  const hora = +val('hour');
  const alarga = (d) => d >= 4 && d <= 6;             // jueves, viernes, sábado
  if (hora >= 12) return { abierto: true, nota: alarga(dia) ? 'cierra a la 1:00 a.m.' : 'cierra a las 12:00 a.m.' };
  if (hora < 1 && alarga((dia + 6) % 7)) return { abierto: true, nota: 'cierra a la 1:00 a.m.' };
  return { abierto: false, nota: 'abre a las 12:00 m.' };
}

function pintarEstado() {
  const el = $('#heroLive');
  if (!el) return;
  const e = estadoLocal();
  el.classList.toggle('is-closed', !e.abierto);
  el.innerHTML = `<i></i><b>${e.abierto ? 'Abierto ahora' : 'Cerrado'}</b> · ${esc(e.nota)}`;
}

/* ============================================================ modal de plato */
let modalState = null;
let cambioSede;

function openModal(itemId) {
  const item = store.item(itemId);
  if (!item || store.isOut(item.id)) return;
  const adjustments = ADJUSTMENTS[ADJUSTMENT_MAP[item.cat]] || [];
  const pairItem = item.pair ? store.item(item.pair) : null;

  modalState = {
    item,
    variant: item.variants?.length ? item.variants[0] : null,
    adjustments: new Set(),
    qty: 1,
    withPair: false,
    pairItem
  };

  const panel = $('#modalPanel');
  const orderable = item.orderable !== false;

  panel.innerHTML = `
    <div class="modal__hero${item.img ? '' : ' modal__hero--empty'}">
      ${item.img ? `<img src="img/${esc(item.img)}" alt="${esc(item.name)}" width="520" height="520">` : '<span aria-hidden="true">乙</span>'}
      <button class="icon-btn modal__close" data-close aria-label="Cerrar">${ICON.close}</button>
      <div class="modal__title">
        <p class="eyebrow eyebrow--plain">${esc(store.categories.find((c) => c.id === item.cat)?.name || '')}</p>
        <h3 class="display" id="modalTitle">${esc(item.name)}</h3>
      </div>
    </div>
    <div class="modal__body">
      <p class="lede" style="font-size:.92rem">${esc(item.desc)}</p>

      ${item.variants?.length ? `
      <div class="opt-group">
        <div class="opt-group__head">
          <h4>${item.cat === 'sashimi' || item.cat === 'wok' ? 'Elige tu preparación' : 'Elige tu opción'}</h4>
          <span class="opt-group__req">Obligatorio</span>
        </div>
        <div class="opts" role="radiogroup" aria-label="Opciones">
          ${item.variants.map((v, i) => `
            <button class="opt" role="radio" data-variant="${i}" aria-checked="${i === 0}">
              <span class="opt__mark"><i></i></span>
              <span class="opt__label">${esc(v.name)}</span>
              <span class="opt__price price">${money(store.variantPrice(item, v))}</span>
            </button>`).join('')}
        </div>
      </div>` : ''}

      ${adjustments.length && orderable ? `
      <div class="opt-group">
        <div class="opt-group__head">
          <h4>Ajustes de cocina</h4>
          <span class="opt-group__req" style="color:var(--travertine-3)">Sin recargo</span>
        </div>
        <div class="opts">
          ${adjustments.map((a) => `
            <button class="opt opt--check" data-adj="${esc(a)}" aria-pressed="false">
              <span class="opt__mark"><i></i></span>
              <span class="opt__label">${esc(a)}</span>
              <span class="opt__free">Incluido</span>
            </button>`).join('')}
        </div>
        <p class="allergen-note">${esc(ADJUSTMENT_NOTE)}</p>
      </div>` : ''}

      ${pairItem && orderable ? `
      <div class="opt-group">
        <div class="opt-group__head"><h4>Marida con</h4></div>
        <button class="opt" data-pair aria-pressed="false">
          <span class="opt__mark"><i></i></span>
          <span class="opt__label">${esc(pairItem.name)}<br>
            <span style="font-size:.72rem;color:var(--travertine-3)">Sugerencia de la casa</span></span>
          <span class="opt__price price">${esc(priceLabel(pairItem).main)}</span>
        </button>
      </div>` : ''}

      ${orderable ? `
      <div class="field">
        <label for="kitchenNote">Notas para la cocina</label>
        <textarea id="kitchenNote" placeholder="Ej. salsa aparte, sin cebollín, alergia a los frutos secos"></textarea>
      </div>` : `
      <p class="allergen-note"><strong style="color:var(--travertine-2)">Pieza de vitrina.</strong>
      ${esc(item.priceNote || '')} — se elige en el mostrador y se confirma en el momento.</p>`}

      ${item.tags.length ? `
      <div class="opt-group">
        <div class="opt-group__head"><h4>Alérgenos y dieta</h4></div>
        <div class="tags">${item.tags.map(tagChip).join('')}</div>
        <p class="allergen-note">Si tienes una alergia, avísanos también por WhatsApp antes de que la
        cocina prepare tu pedido.</p>
      </div>` : ''}
    </div>
    ${orderable ? `
    <div class="modal__foot">
      <div class="stepper">
        <button data-qty="-1" aria-label="Quitar uno">−</button>
        <span id="modalQty">1</span>
        <button data-qty="1" aria-label="Añadir uno">+</button>
      </div>
      <button class="btn btn--solid" data-add>Añadir · <span id="modalTotal">${money(currentUnit())}</span></button>
    </div>` : `
    <div class="modal__foot"><button class="btn btn--ghost" data-close style="flex:1">Entendido</button></div>`}
  `;

  const modal = $('#modal');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  $('#scrim').classList.add('is-open');
  panel.querySelector('[data-close]')?.focus();
  bindModal(panel);
}

function currentUnit() {
  if (!modalState) return 0;
  const { item, variant } = modalState;
  const base = variant ? store.variantPrice(item, variant) : store.basePrice(item);
  return base || 0;
}

function refreshModalTotal() {
  const qtyEl = $('#modalQty');
  const totalEl = $('#modalTotal');
  if (qtyEl) qtyEl.textContent = String(modalState.qty);
  if (totalEl) {
    let total = currentUnit() * modalState.qty;
    if (modalState.withPair && modalState.pairItem) total += store.basePrice(modalState.pairItem) || 0;
    totalEl.textContent = money(total);
  }
}

function bindModal(panel) {
  panel.onclick = (e) => {
    const close = e.target.closest('[data-close]');
    if (close) return closeModal();

    const v = e.target.closest('[data-variant]');
    if (v) {
      const idx = Number(v.dataset.variant);
      modalState.variant = modalState.item.variants[idx];
      panel.querySelectorAll('[data-variant]').forEach((b) =>
        b.setAttribute('aria-checked', String(b === v)));
      return refreshModalTotal();
    }

    const a = e.target.closest('[data-adj]');
    if (a) {
      const key = a.dataset.adj;
      const on = a.getAttribute('aria-pressed') === 'true';
      a.setAttribute('aria-pressed', String(!on));
      if (on) modalState.adjustments.delete(key); else modalState.adjustments.add(key);
      return;
    }

    const p = e.target.closest('[data-pair]');
    if (p) {
      modalState.withPair = !modalState.withPair;
      p.setAttribute('aria-pressed', String(modalState.withPair));
      return refreshModalTotal();
    }

    const q = e.target.closest('[data-qty]');
    if (q) {
      modalState.qty = Math.max(1, Math.min(30, modalState.qty + Number(q.dataset.qty)));
      return refreshModalTotal();
    }

    if (e.target.closest('[data-add]')) return confirmAdd();
  };
}

function confirmAdd() {
  const { item, variant, adjustments, qty, withPair, pairItem } = modalState;
  const note = ($('#kitchenNote')?.value || '').trim().slice(0, 240);

  store.add({
    itemId: item.id, name: item.name, img: item.img,
    variant: variant ? variant.name : null,
    unit: currentUnit(), qty,
    adjustments: Array.from(adjustments), note
  });

  if (withPair && pairItem) {
    store.add({
      itemId: pairItem.id, name: pairItem.name, img: pairItem.img,
      variant: pairItem.variants?.length ? pairItem.variants[0].name : null,
      unit: pairItem.variants?.length ? store.variantPrice(pairItem, pairItem.variants[0]) : store.basePrice(pairItem),
      qty: 1, adjustments: [], note: ''
    });
  }

  closeModal();
  toast(`${item.name} · añadido`);
  bumpPill();
}

function closeModal() {
  const modal = $('#modal');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  if (!$('#drawer').classList.contains('is-open')) {
    document.body.classList.remove('is-locked');
    $('#scrim').classList.remove('is-open');
  }
  modalState = null;
}

/* ================================================================ carrito */
function lineRow(l) {
  const item = store.item(l.itemId);
  return `
  <div class="line" data-line="${l.uid}">
    ${l.img
      ? `<img class="line__img" src="img/${esc(l.img)}" alt="" loading="lazy" width="56" height="56">`
      : '<div class="line__img line__img--empty" aria-hidden="true"></div>'}
    <div>
      <div class="line__top">
        <span class="line__name">${esc(l.name)}</span>
        <span class="line__price">${money(l.unit * l.qty)}</span>
      </div>
      ${l.variant ? `<ul class="line__mods"><li>${esc(l.variant)}</li>${(l.adjustments || []).map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`
                  : (l.adjustments || []).length ? `<ul class="line__mods">${l.adjustments.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
      ${l.note ? `<p class="line__note">${esc(l.note)}</p>` : ''}
      <div class="line__foot">
        <div class="stepper">
          <button data-dec="${l.uid}" aria-label="Quitar uno de ${esc(l.name)}">−</button>
          <span>${l.qty}</span>
          <button data-inc="${l.uid}" aria-label="Añadir uno de ${esc(l.name)}">+</button>
        </div>
        <button class="link-x" data-del="${l.uid}">Quitar</button>
      </div>
      ${item && store.isOut(item.id) ? '<p class="line__note" style="border-color:var(--vermillion);color:var(--vermillion)">Agotado hoy — la cocina lo confirmará</p>' : ''}
    </div>
  </div>`;
}

function upsellPicks() {
  const inCart = new Set(store.cart.map((l) => l.itemId));
  const favour = ['barra', 'frias', 'calientes', 'gelato', 'aperitivos', 'hojaldre'];
  return store.items
    .filter((i) => !inCart.has(i.id) && !store.isOut(i.id) && i.orderable !== false && store.basePrice(i) != null)
    .sort((a, b) => {
      const ra = favour.indexOf(a.cat), rb = favour.indexOf(b.cat);
      return (ra === -1 ? 9 : ra) - (rb === -1 ? 9 : rb) || store.basePrice(a) - store.basePrice(b);
    })
    .slice(0, 8);
}

function serviceBlock() {
  const b = store.branch;
  const mode = SERVICE_MODES.find((m) => m.id === store.service.mode) || SERVICE_MODES[0];
  const f = store.service.fields || {};

  const fieldHtml = (fl) => {
    if (fl.type === 'zone') {
      return `<div class="field" data-field="${fl.id}">
        <label for="f-${fl.id}">${esc(fl.label)}</label>
        <select id="f-${fl.id}" data-input="${fl.id}">
          <option value="">Selecciona tu zona</option>
          ${b.deliveryZones.map((z) => `<option ${f[fl.id] === z ? 'selected' : ''}>${esc(z)}</option>`).join('')}
        </select></div>`;
    }
    return `<div class="field" data-field="${fl.id}">
      <label for="f-${fl.id}">${esc(fl.label)}</label>
      <input id="f-${fl.id}" data-input="${fl.id}" type="${fl.type}"
             placeholder="${esc(fl.placeholder || '')}" value="${esc(f[fl.id] || '')}"></div>`;
  };

  return `
  <div class="upsell" style="margin-top:1.8rem">
    <h4 style="font-family:var(--mono);font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--travertine-3);margin:0 0 .2rem;font-weight:400">¿Cómo lo quieres?</h4>
    <div class="svc">
      ${SERVICE_MODES.map((m) => `
        <button data-mode="${m.id}" aria-pressed="${m.id === mode.id}">${ICON[m.icon]}${esc(m.label)}</button>`).join('')}
    </div>
    <p class="svc-hint">${esc(mode.hint)}</p>
    ${mode.fields.map(fieldHtml).join('')}
    <div class="field">
      <label for="orderNote">Nota general del pedido</label>
      <textarea id="orderNote" data-input="_note" placeholder="Cumpleaños, alergias, hora de llegada…">${esc(f._note || '')}</textarea>
    </div>
  </div>`;
}

function renderCart() {
  const body = $('#drawerBody');
  const foot = $('#drawerFoot');
  const sub = $('#drawerSub');
  const b = store.branch;
  if (!body) return;

  sub.textContent = b.name;

  if (!store.cart.length) {
    body.innerHTML = `
      <div class="empty">
        <span aria-hidden="true">乙</span>
        <p>Tu comanda está vacía. Arma tu mesa desde la carta y la enviamos por WhatsApp.</p>
        <button class="btn btn--ghost btn--sm" data-close-drawer>Ver la carta</button>
      </div>`;
    foot.innerHTML = '';
    return;
  }

  const picks = upsellPicks();
  body.innerHTML = `
    ${store.cart.map(lineRow).join('')}
    ${picks.length ? `
    <div class="upsell">
      <h4 style="font-family:var(--mono);font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--travertine-3);margin:0 0 .6rem;font-weight:400">Completa la mesa</h4>
      <div class="upsell__rail">
        ${picks.map((i) => `
          <button class="upsell__card" data-quick="${i.id}">
            ${i.img ? `<img src="img/${esc(i.img)}" alt="" loading="lazy" width="128" height="128">` : '<div class="ph" aria-hidden="true">乙</div>'}
            <b>${esc(i.name)}</b><span>${esc(priceLabel(i).main)}</span>
          </button>`).join('')}
      </div>
    </div>` : ''}
    ${serviceBlock()}`;

  const fee = store.service.mode === 'delivery' ? b.deliveryFee : null;
  foot.innerHTML = `
    <div class="totals">
      <div><span>Subtotal · ${store.count} ${store.count === 1 ? 'ítem' : 'ítems'}</span><b>${money(store.subtotal)}</b></div>
      ${store.service.mode === 'delivery'
        ? `<div><span>Envío</span><b>${fee == null ? 'A coordinar' : money(fee)}</b></div>` : ''}
      <div class="grand"><span>Total</span><b class="price">${money(store.subtotal + (fee || 0))}</b></div>
    </div>
    <button class="btn btn--wa" data-checkout>${ICON.wa} Completar pedido por WhatsApp</button>
    <p class="fineprint">Se abre WhatsApp con la comanda escrita, lista para enviar a <b>${esc(b.phone)}</b>.
    ${store.service.mode === 'delivery' ? esc(b.deliveryFeeNote) : ''}</p>`;
}

function bindDrawer() {
  const drawer = $('#drawer');

  drawer.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-drawer]')) return closeDrawer();

    const inc = e.target.closest('[data-inc]');
    if (inc) { const l = store.cart.find((x) => x.uid === inc.dataset.inc); return store.setQty(l.uid, l.qty + 1); }
    const dec = e.target.closest('[data-dec]');
    if (dec) { const l = store.cart.find((x) => x.uid === dec.dataset.dec); return store.setQty(l.uid, l.qty - 1); }
    const del = e.target.closest('[data-del]');
    if (del) return store.remove(del.dataset.del);

    const quick = e.target.closest('[data-quick]');
    if (quick) {
      const i = store.item(quick.dataset.quick);
      const v = i.variants?.length ? i.variants[0] : null;
      store.add({
        itemId: i.id, name: i.name, img: i.img,
        variant: v ? v.name : null,
        unit: v ? store.variantPrice(i, v) : store.basePrice(i),
        qty: 1, adjustments: [], note: ''
      });
      toast(`${i.name} · añadido`);
      return;
    }

    const mode = e.target.closest('[data-mode]');
    if (mode) return store.setService({ mode: mode.dataset.mode });

    if (e.target.closest('[data-checkout]')) return checkout();
  });

  drawer.addEventListener('input', (e) => {
    const input = e.target.closest('[data-input]');
    if (!input) return;
    store.service.fields[input.dataset.input] = input.value;
    try { localStorage.setItem('zhuba.service.v1', JSON.stringify(store.service)); } catch { /* noop */ }
    input.closest('.field')?.classList.remove('is-bad');
  });
}

function checkout() {
  const mode = SERVICE_MODES.find((m) => m.id === store.service.mode);
  const f = store.service.fields || {};
  let bad = null;
  mode.fields.forEach((fl) => {
    const el = $(`[data-field="${fl.id}"]`);
    const ok = !fl.required || (f[fl.id] || '').trim();
    el?.classList.toggle('is-bad', !ok);
    if (!ok && !bad) bad = el;
  });
  if (bad) {
    bad.scrollIntoView({ block: 'center', behavior: 'smooth' });
    bad.querySelector('input, select')?.focus();
    toast('Faltan datos del servicio');
    return;
  }

  const snapshot = orderSnapshot(store);
  const link = whatsappLink(store);
  store.recordOrder(snapshot);
  window.open(link, '_blank', 'noopener');
  store.clearCart();
  closeDrawer();
  toast('Comanda enviada a WhatsApp');
}

function openDrawer() {
  renderCart();
  $('#drawer').classList.add('is-open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#scrim').classList.add('is-open');
  document.body.classList.add('is-locked');
  $('#drawerClose')?.focus();
}
function closeDrawer() {
  $('#drawer').classList.remove('is-open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  if (!$('#modal').classList.contains('is-open')) {
    $('#scrim').classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }
}

/* ============================================================= pill + toast */
function renderPill() {
  const pill = $('#cartPill');
  if (!pill) return;
  const n = store.count;
  pill.classList.toggle('is-visible', n > 0);
  // La barra flota fija sobre el contenido: mientras haya comanda se reserva
  // sitio abajo para que no se coma botones ni la última línea del pie.
  document.body.classList.toggle('has-order', n > 0);
  $('#cartCount').textContent = String(n);
  $('#cartTotal').textContent = money(store.subtotal);
}
function bumpPill() {
  const pill = $('#cartPill');
  pill.classList.remove('is-bump');
  void pill.offsetWidth;
  pill.classList.add('is-bump');
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2400);
}


/* ==================================================== la lista de pedido */
/* Filas compactas en vez de tarjetas: para pedir se escanea y se toca, no se
   contempla. La miniatura es pequeña —y quien no tiene foto simplemente no la
   lleva, sin recuadro de relleno que finja una imagen que no existe. */
let filtro = '';

function fila(item) {
  const out = store.isOut(item.id);
  const vitrina = item.orderable === false;
  const { main, sub } = priceLabel(item);
  const opciones = item.variants?.length > 1 ? `${item.variants.length} opciones` : '';
  const dieta = item.tags.filter((t) => TAGS[t]?.kind === 'diet').slice(0, 2);

  return `
  <article class="row${out ? ' is-out' : ''}" data-item="${item.id}">
    ${item.img
      ? `<img class="row__thumb" src="img/${esc(item.img)}" alt="" loading="lazy" decoding="async" width="120" height="120">`
      : '<span class="row__thumb row__thumb--none" aria-hidden="true"></span>'}
    <div class="row__body">
      <h3>${esc(item.name)}</h3>
      <p>${esc(item.desc)}</p>
      <div class="row__meta">
        ${opciones ? `<span class="tag tag--opts">${opciones}</span>` : ''}
        ${dieta.map(tagChip).join('')}
        ${out ? '<span class="tag tag--out">Agotado</span>' : ''}
      </div>
    </div>
    <div class="row__end">
      <span class="row__price price">${sub ? `<small>${sub}</small>` : ''}${esc(main)}</span>
      ${vitrina
        ? '<span class="row__case">En vitrina</span>'
        : `<button class="row__add" data-open="${item.id}" ${out ? 'disabled' : ''}
             aria-label="Anadir ${esc(item.name)}">${ICON.plus}</button>`}
    </div>
  </article>`;
}

function platosVisibles() {
  const q = filtro.trim().toLowerCase();
  if (!q) return store.items;
  return store.items.filter((i) =>
    i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
}

let vigilarScroll = null;

function renderLista() {
  const indice = $('#indice');
  const lista = $('#lista');
  const items = platosVisibles();
  const buscando = !!filtro.trim();

  $('#buscarBorrar').hidden = !buscando;
  indice.parentElement.hidden = buscando;

  if (buscando) {
    lista.innerHTML = items.length
      ? `<section class="cat">
           <header class="cat__head"><div>
             <h3>${items.length} ${items.length === 1 ? 'resultado' : 'resultados'}</h3>
             <p>para «${esc(filtro.trim())}»</p>
           </div></header>
           <div class="rows">${items.map(fila).join('')}</div>
         </section>`
      : `<div class="empty"><span aria-hidden="true">乙</span>
           <p>Nada con «${esc(filtro.trim())}». Prueba con otro nombre o borra la búsqueda.</p></div>`;
    return;
  }

  indice.innerHTML = store.categories.map((c, i) =>
    `<button class="pill${i === 0 ? ' is-active' : ''}" data-cat="${c.id}">${esc(c.name)}</button>`).join('');

  lista.innerHTML = store.categories.map((c) => {
    const dentro = items.filter((i) => i.cat === c.id);
    if (!dentro.length) return '';
    return `
    <section class="cat" id="cat-${c.id}">
      <header class="cat__head">
        <div><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p></div>
        <span class="cat__kanji" aria-hidden="true">${esc(c.kanji)}</span>
      </header>
      <div class="rows">${dentro.map(fila).join('')}</div>
    </section>`;
  }).join('');

  const secciones = $$('.cat', lista);
  const marcar = (id) => {
    let activa = null;
    $$('.pill', indice).forEach((p) => {
      const on = `cat-${p.dataset.cat}` === id;
      p.classList.toggle('is-active', on);
      if (on) activa = p;
    });
    if (activa) {
      const destino = activa.offsetLeft - indice.clientWidth / 2 + activa.clientWidth / 2;
      indice.scrollTo({ left: Math.max(0, destino), behavior: 'smooth' });
    }
  };
  let actual = null;
  if (vigilarScroll) window.removeEventListener('scroll', vigilarScroll);
  vigilarScroll = () => {
    const linea = window.innerHeight * 0.3;
    let mejor = secciones[0];
    for (const s of secciones) { if (s.getBoundingClientRect().top - linea <= 0) mejor = s; else break; }
    if (mejor && mejor !== actual) { actual = mejor; marcar(mejor.id); }
  };
  vigilarScroll();
  window.addEventListener('scroll', vigilarScroll, { passive: true });
}

/* -------------------------------------------------------------- cabecera */
function pintarSede() {
  const b = store.branch;
  const raiz = document.documentElement;
  raiz.style.setProperty('--accent', b.accent);
  Object.entries(b.theme || {}).forEach(([k, v]) => raiz.style.setProperty(k, v));
  raiz.dataset.sede = b.id;

  $$('#sedes .venue-pill').forEach((el) =>
    el.setAttribute('aria-pressed', String(el.dataset.branch === b.id)));
  $('#sedeNota').textContent = b.kicker;
  $('#drawerSub').textContent = b.name;
}

function montarSedes() {
  const cont = $('#sedes');
  cont.innerHTML = BRANCHES.map((b) => `
    <button class="venue-pill" data-branch="${b.id}" aria-pressed="false">
      <strong>${esc(b.name)}</strong><span>${esc(b.short)}</span>
    </button>`).join('');
  cont.addEventListener('click', (e) => {
    const p = e.target.closest('.venue-pill');
    if (p) store.setBranch(p.dataset.branch);
  });
}

/* --------------------------------------------------------------- arranque */
export function mountPedidos() {
  montarSedes();
  renderLista();
  pintarSede();
  pintarEstado();
  setInterval(pintarEstado, 60000);
  renderPill();
  bindDrawer();

  $('#cartPill').addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#scrim').addEventListener('click', () => { closeModal(); closeDrawer(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($('#modal').classList.contains('is-open')) closeModal();
    else if ($('#drawer').classList.contains('is-open')) closeDrawer();
  });

  $('#indice').addEventListener('click', (e) => {
    const p = e.target.closest('.pill');
    if (!p) return;
    $(`#cat-${p.dataset.cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#lista').addEventListener('click', (e) => {
    const add = e.target.closest('[data-open]');
    if (add) { openModal(add.dataset.open); return; }
    const row = e.target.closest('.row');
    if (row && !store.isOut(row.dataset.item)) openModal(row.dataset.item);
  });

  const buscador = $('#buscar');
  let tecleo;
  buscador.addEventListener('input', () => {
    clearTimeout(tecleo);
    tecleo = setTimeout(() => { filtro = buscador.value; renderLista(); }, 160);
  });
  $('#buscarBorrar').addEventListener('click', () => {
    buscador.value = ''; filtro = ''; renderLista(); buscador.focus();
  });

  store.on((que) => {
    if (que === 'branch') {
      document.body.classList.add('is-switching');
      setTimeout(() => {
        renderLista(); pintarSede(); renderPill();
        if ($('#drawer').classList.contains('is-open')) renderCart();
        requestAnimationFrame(() => document.body.classList.remove('is-switching'));
      }, 180);
      toast(`Pidiendo en ${store.branch.name}`);
    }
    if (que === 'cart' || que === 'service') {
      renderPill();
      if ($('#drawer').classList.contains('is-open')) renderCart();
    }
    if (que === 'stock' || que === 'prices') renderLista();
  });

  // Enlace directo desde la portada: /pedir?plato=r-fukkatsu. Los identificadores
  // llevan la sede en el prefijo, así que se cambia sola si hace falta.
  const pedido = new URLSearchParams(location.search).get('plato');
  const item = pedido ? store.item(pedido) : null;
  if (item) {
    const sede = item.id.startsWith('c-') ? 'cafe' : 'restaurante';
    const cambia = sede !== store.branchId;
    if (cambia) store.setBranch(sede);
    setTimeout(() => {
      $(`#cat-${item.cat}`)?.scrollIntoView({ behavior: 'auto', block: 'start' });
      openModal(item.id);
    }, cambia ? 420 : 80);
  }
}
