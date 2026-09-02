/**
 * Capa de vista. Lee del store, dibuja y devuelve eventos al store.
 * Ninguna dato de negocio vive aquí: todo viene de /data.
 */
import { store, money, BRANCHES, CONTACT } from './store.js';
import { TAGS, ADJUSTMENTS, ADJUSTMENT_MAP, ADJUSTMENT_NOTE, SERVICE_MODES } from '../data/modifiers.js';
import { whatsappLink, orderSnapshot } from './ticket.js';
import { revealAll, scrollspy, centerPill, addParallax, addExitProgress } from './motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICON = {
  plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  close: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
  caret: '<svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1.5L5 5l4-3.5"/></svg>',
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
  if (!item.img) {
    return `<div class="${cls} ${cls}--empty"><span aria-hidden="true">乙</span></div>`;
  }
  return `<div class="${cls}"><img src="img/${esc(item.img)}" alt="${esc(item.name)}" loading="lazy" decoding="async" width="520" height="520"></div>`;
}

/* ============================================================ selector de sede */
function paintBranchChrome() {
  const b = store.branch;
  // la sede pinta su propia temperatura: mismos gestos, otro clima
  const raiz = document.documentElement;
  raiz.style.setProperty('--accent', b.accent);
  Object.entries(b.theme || {}).forEach(([k, v]) => raiz.style.setProperty(k, v));
  raiz.dataset.sede = b.id;

  const name = $('#venueName');
  if (name) name.textContent = b.short;

  $$('#venueMenu .venue__opt').forEach((el) => {
    el.setAttribute('aria-checked', String(el.dataset.branch === b.id));
  });
  $$('.venue-pill').forEach((el) => {
    el.setAttribute('aria-pressed', String(el.dataset.branch === b.id));
  });

  const kicker = $('#heroKicker');
  if (kicker) kicker.textContent = b.kicker;
  const tag = $('#heroTagline');
  if (tag) tag.textContent = b.tagline;

  const waTop = $('#waTop');
  if (waTop) waTop.href = b.whatsappDirect;

  $$('.venue-card').forEach((el) => el.classList.toggle('is-active', el.dataset.branch === b.id));

  const menuLink = $('#fullMenuLink');
  if (menuLink) menuLink.href = b.menu === 'cafe' ? CONTACT.fullMenuCafe : CONTACT.fullMenuRestaurant;
}

function mountVenueSwitcher() {
  const wrap = $('#venue');
  const btn = $('#venueBtn');
  const menu = $('#venueMenu');
  if (!wrap || !btn || !menu) return;

  menu.innerHTML = BRANCHES.map((b) => `
    <button class="venue__opt" role="menuitemradio" data-branch="${b.id}" aria-checked="false">
      <strong>${esc(b.name)}</strong><span>${esc(b.kicker)}</span>
    </button>`).join('');

  const close = () => { wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = wrap.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('.venue__opt');
    if (!opt) return;
    store.setBranch(opt.dataset.branch);
    close();
  });
  document.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  const pills = $('#venuePills');
  if (pills) {
    pills.innerHTML = BRANCHES.map((b) => `
      <button class="venue-pill" data-branch="${b.id}" aria-pressed="false">
        <strong>${esc(b.name)}</strong><span>${esc(b.short)}</span>
      </button>`).join('');
    pills.addEventListener('click', (e) => {
      const p = e.target.closest('.venue-pill');
      if (p) store.setBranch(p.dataset.branch);
    });
  }
}

/* ================================================================ héroe */
/* La vitrina se redibuja al cambiar de sede: el restaurante enseña barra
   fría y wok; el café, gelato y vitrina. */
function renderHero() {
  const b = store.branch;

  const title = $('#heroTitle');
  if (title && b.heroTitle) {
    title.innerHTML = b.heroTitle
      .map((l) => `<span class="hero__line">${l.em ? `<em>${esc(l.em)}</em> ` : ''}${esc(l.text)}</span>`)
      .join('');
  }
  const sub = $('#heroSub');
  if (sub) sub.textContent = b.heroSub || '';
  const maps = $('#heroMaps');
  if (maps) maps.href = b.maps;

  const mosaic = $('#heroMosaic');
  if (!mosaic || !b.heroPhotos) return;
  const duraciones = [66, 82];
  mosaic.innerHTML = b.heroPhotos.map((col, i) => `
    <div class="hero__col" data-col="${i}">
      <div class="hero__track" style="--dur:${duraciones[i] || 72}s">
        ${col.concat(col).map((n, j) => `
          <figure><img src="img/${esc(n)}.webp" alt=""${j >= col.length ? ' loading="lazy"' : ''}
            decoding="async" width="520" height="520"></figure>`).join('')}
      </div>
    </div>`).join('') + '<div class="hero__blend"></div><div class="hero__fade"></div>';

  // el scroll añade su propio desplazamiento sobre la deriva continua
  $$('.hero__col', mosaic).forEach((col, i) => addParallax(col, i === 0 ? 90 : 150));
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

/* =================================================================== carta */
function itemCard(item) {
  const out = store.isOut(item.id);
  // Pieza de vitrina: el menú oficial publica un rango, no un precio, así que
  // no puede entrar en la comanda. No debe enseñar un botón de añadir.
  const vitrina = item.orderable === false;
  const { main, sub } = priceLabel(item);
  const shown = item.tags.slice(0, 3);
  const rest = item.tags.length - shown.length;
  const pairItem = item.pair ? store.item(item.pair) : null;

  return `
  <article class="card${out ? ' is-out' : ''}${vitrina ? ' is-case' : ''}" data-item="${item.id}">
    <div style="position:relative">
      ${figure(item)}
      ${vitrina ? '<span class="card__flag card__flag--case">Vitrina</span>'
                : item.hero ? '<span class="card__flag">Firma</span>' : ''}
      ${out ? '<div class="card__sold">Agotado hoy</div>' : ''}
    </div>
    <div class="card__body">
      <div class="card__title">
        <h4>${esc(item.name)}</h4>
        <div class="card__price price">${sub ? `<small>${sub}</small>` : ''}${esc(main)}</div>
      </div>
      <p class="card__desc">${esc(item.desc)}</p>
      <div class="tags">${shown.map(tagChip).join('')}${rest > 0 ? `<span class="tag tag--more">+${rest}</span>` : ''}</div>
      <div class="card__foot">
        <span class="pairing">${pairItem ? `Marida con <b>${esc(pairItem.name)}</b>` : ''}</span>
        ${vitrina
          ? '<span class="card__case">Se elige en el mostrador</span>'
          : `<button class="card__add" data-open="${item.id}" ${out ? 'disabled' : ''}
                aria-label="Personalizar y añadir ${esc(item.name)}">${ICON.plus}</button>`}
      </div>
    </div>
  </article>`;
}

function renderMenu() {
  const pillRail = $('#menuPills');
  const list = $('#menuList');
  if (!pillRail || !list) return;

  const cats = store.categories;
  pillRail.innerHTML = cats.map((c, i) =>
    `<button class="pill${i === 0 ? ' is-active' : ''}" data-cat="${c.id}">${esc(c.name)}</button>`).join('');

  list.innerHTML = cats.map((c) => {
    const items = store.items.filter((i) => i.cat === c.id);
    if (!items.length) return '';
    return `
    <section class="cat" id="cat-${c.id}">
      <header class="cat__head">
        <div>
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.blurb)}</p>
        </div>
        <span class="cat__kanji" aria-hidden="true">${esc(c.kanji)}</span>
      </header>
      <div class="grid">${items.map(itemCard).join('')}</div>
    </section>`;
  }).join('');

  // scrollspy + navegación por pastillas
  const sections = $$('.cat', list);
  const setActive = (id) => {
    let active = null;
    $$('.pill', pillRail).forEach((p) => {
      const on = `cat-${p.dataset.cat}` === id;
      p.classList.toggle('is-active', on);
      if (on) active = p;
    });
    if (active) centerPill(pillRail, active);
  };
  scrollspy(sections, setActive);

  pillRail.onclick = (e) => {
    const p = e.target.closest('.pill');
    if (!p) return;
    const target = $(`#cat-${p.dataset.cat}`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  list.onclick = (e) => {
    const add = e.target.closest('[data-open]');
    if (add) { openModal(add.dataset.open); return; }
    const card = e.target.closest('.card');
    if (card && !store.isOut(card.dataset.item)) openModal(card.dataset.item);
  };

  revealAll(list);
}

/* ============================================================ modal de plato */
let modalState = null;

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
      : '<div class="line__img line__img--empty" aria-hidden="true">乙</div>'}
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

/* ================================================================== sedes */
function renderVenues() {
  const grid = $('#venuesGrid');
  if (!grid) return;
  grid.innerHTML = BRANCHES.map((b) => `
    <article class="venue-card${b.id === store.branchId ? ' is-active' : ''}" data-branch="${b.id}">
      <div>
        <p class="eyebrow">${esc(b.kicker)}</p>
        <h3 class="display" style="margin-top:.5rem">${esc(b.name)}</h3>
      </div>
      <dl class="venue-card__rows">
        <div class="vrow"><dt>Dirección</dt><dd>${esc(b.address)}</dd></div>
        <div class="vrow"><dt>Horario</dt><dd>${b.hours.map((h) => `${esc(h.label)}<br><b style="color:var(--travertine)">${esc(h.value)}</b>`).join('<br><br>')}</dd></div>
        <div class="vrow"><dt>Teléfono</dt><dd><a href="${esc(b.phoneHref)}">${esc(b.phone)}</a></dd></div>
        <div class="vrow"><dt>Servicios</dt><dd><div class="chips">${b.services.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div></dd></div>
        <div class="vrow"><dt>Delivery</dt><dd>${b.deliveryZones.slice(0, 5).join(' · ')}.<br><span style="color:var(--travertine-3)">${esc(b.deliveryFeeNote)}</span></dd></div>
      </dl>
      <div class="venue-card__cta">
        <a class="btn btn--sm" href="${esc(b.maps)}" target="_blank" rel="noopener">Cómo llegar</a>
        <a class="btn btn--sm btn--wa" href="${esc(b.whatsappDirect)}" target="_blank" rel="noopener">WhatsApp</a>
        <button class="btn btn--sm btn--ghost" data-pick="${b.id}">Ver esta carta</button>
      </div>
    </article>`).join('');

  grid.onclick = (e) => {
    const pick = e.target.closest('[data-pick]');
    if (!pick) return;
    store.setBranch(pick.dataset.branch);
    $('#carta')?.scrollIntoView({ behavior: 'smooth' });
  };
}

/* ================================================================= arranque */
export function mountApp() {
  mountVenueSwitcher();
  renderHero();
  pintarEstado();
  setInterval(pintarEstado, 60000);
  renderVenues();
  renderMenu();
  paintBranchChrome();
  renderPill();
  bindDrawer();

  $('#cartPill').addEventListener('click', openDrawer);

  // marca cuándo el héroe ocupa la pantalla, para que la barra flotante no
  // se monte sobre sus botones en móvil
  const hero = $('.hero');
  if (hero && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      ([e]) => document.body.classList.toggle('at-hero', e.intersectionRatio > 0.45),
      { threshold: [0, 0.45, 1] }
    );
    io.observe(hero);
  }
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#scrim').addEventListener('click', () => { closeModal(); closeDrawer(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($('#modal').classList.contains('is-open')) closeModal();
    else if ($('#drawer').classList.contains('is-open')) closeDrawer();
  });

  store.on((what) => {
    if (what === 'branch') {
      renderMenu();
      renderHero();
      paintBranchChrome();
      renderVenues();
      renderPill();
      if ($('#drawer').classList.contains('is-open')) renderCart();
      toast(`Estás viendo ${store.branch.name}`);
    }
    if (what === 'cart' || what === 'service') {
      renderPill();
      if ($('#drawer').classList.contains('is-open')) renderCart();
    }
    if (what === 'stock' || what === 'prices') renderMenu();
  });

  // otra pestaña (o el panel /admin) cambió el inventario o los precios
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    if (e.key.startsWith('zhuba.stock') || e.key.startsWith('zhuba.prices')) {
      store.stock = JSON.parse(localStorage.getItem('zhuba.stock.v1') || '{}');
      store.prices = JSON.parse(localStorage.getItem('zhuba.prices.v1') || '{}');
      renderMenu();
    }
  });

  // el héroe se cierra al bajar: el texto se disuelve y la vitrina se apaga
  addExitProgress($('.hero'), '--p');
  // el bloque de texto se rezaga un poco frente a la vitrina
  addParallax($('#heroGrid'), -70);
  // cada sección publica su propio progreso: de ahí beben las palabras de
  // fondo y la vitrina de Historia
  $$('.section').forEach((sec) => addExitProgress(sec, '--p'));
  revealAll();
}

export { toast };
