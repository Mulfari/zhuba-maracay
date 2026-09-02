/**
 * Capa de vista. Lee del store, dibuja y devuelve eventos al store.
 * Ninguna dato de negocio vive aquí: todo viene de /data.
 */
import { store, money, BRANCHES, CONTACT } from './store.js';
import { TAGS } from '../data/modifiers.js';
import { revealAll, scrollspy, centerPill, addParallax, addExitProgress, reducedMotion } from './motion.js';

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
  if (!item.img) return '';
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

  const tarjeta = [
    'card', out ? 'is-out' : '', vitrina ? 'is-case' : '',
    item.img ? '' : 'card--text', item.priceNote ? 'card--nota' : ''
  ].filter(Boolean).join(' ');
  const marca = vitrina ? '<span class="card__flag card__flag--case">Vitrina</span>'
              : item.hero ? '<span class="card__flag">Firma</span>' : '';

  return `
  <article class="${tarjeta}" data-item="${item.id}">
    ${item.img ? `<div style="position:relative">
      ${figure(item)}
      ${marca}
      ${out ? '<div class="card__sold">Agotado hoy</div>' : ''}
    </div>` : ''}
    <div class="card__body">
      ${item.img ? '' : marca}
      <div class="card__title">
        <h4>${esc(item.name)}</h4>
        <div class="card__price price">${sub ? `<small>${sub}</small>` : ''}${esc(main)}</div>
      </div>
      <p class="card__desc">${esc(item.desc)}</p>
      <div class="tags">
        ${item.variants?.length > 1
          ? `<span class="tag tag--opts">${item.variants.length} opciones</span>` : ''}
        ${shown.map(tagChip).join('')}${rest > 0 ? `<span class="tag tag--more">+${rest}</span>` : ''}
      </div>
      <div class="card__foot">
        <span class="pairing">${pairItem ? `Marida con <b>${esc(pairItem.name)}</b>` : ''}</span>
        ${vitrina
          ? '<span class="card__case">Se elige en el mostrador</span>'
          : `<button class="card__add" data-open="${item.id}"
                aria-label="Ver ${esc(item.name)}">${ICON.arrow}</button>`}
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

/* ============================================= ficha del plato (informativa) */
/* En la portada no se pide: la ficha cuenta el plato y ofrece el camino a la
   página de pedidos, que es donde vive la comanda. */
let cambioSede;

function openModal(itemId) {
  const item = store.item(itemId);
  if (!item) return;
  const categoria = store.categories.find((c) => c.id === item.cat)?.name || '';
  const pairItem = item.pair ? store.item(item.pair) : null;
  const { main, sub } = priceLabel(item);
  const vitrina = item.orderable === false;

  $('#modalPanel').innerHTML = `
    <div class="modal__hero${item.img ? '' : ' modal__hero--empty'}">
      ${item.img ? `<img src="img/${esc(item.img)}" alt="${esc(item.name)}" width="520" height="520">` : ''}
      <button class="icon-btn modal__close" data-close aria-label="Cerrar">${ICON.close}</button>
      <div class="modal__title">
        <p class="eyebrow eyebrow--plain">${esc(categoria)}</p>
        <h3 class="display" id="modalTitle">${esc(item.name)}</h3>
      </div>
    </div>

    <div class="modal__body">
      <p class="lede" style="font-size:.92rem">${esc(item.desc)}</p>

      ${item.variants?.length ? `
      <div class="opt-group">
        <div class="opt-group__head"><h4>Se sirve en</h4></div>
        <ul class="ficha-lista">
          ${item.variants.map((v) => `
            <li><span>${esc(v.name)}</span><b class="price">${money(store.variantPrice(item, v))}</b></li>`).join('')}
        </ul>
      </div>` : `
      <div class="opt-group">
        <div class="opt-group__head"><h4>Precio</h4></div>
        <p class="ficha-precio price">${sub ? `<small>${sub}</small>` : ''}${esc(main)}</p>
      </div>`}

      ${pairItem ? `
      <div class="opt-group">
        <div class="opt-group__head"><h4>Marida con</h4></div>
        <p class="ficha-marida">${esc(pairItem.name)}
          <span>${esc(priceLabel(pairItem).main)}</span></p>
      </div>` : ''}

      ${item.tags.length ? `
      <div class="opt-group">
        <div class="opt-group__head"><h4>Alérgenos y dieta</h4></div>
        <div class="tags">${item.tags.map(tagChip).join('')}</div>
      </div>` : ''}
    </div>

    <div class="modal__foot">
      ${vitrina
        ? '<span class="ficha-vitrina">Pieza de vitrina · se elige en el mostrador</span>'
        : `<a class="btn btn--solid" style="flex:1" href="pedir?plato=${encodeURIComponent(item.id)}">
             Pedir este plato</a>`}
    </div>`;

  const modal = $('#modal');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  $('#scrim').classList.add('is-open');
  $('#modalPanel').querySelector('[data-close]')?.focus();
  $('#modalPanel').onclick = (e) => { if (e.target.closest('[data-close]')) closeModal(); };
}

function closeModal() {
  const modal = $('#modal');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
  $('#scrim').classList.remove('is-open');
}

/* ------------------------------------------------------------------ aviso */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
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
        <a class="btn btn--sm btn--solid" href="pedir">Pedir en línea</a>
        <a class="btn btn--sm" href="${esc(b.maps)}" target="_blank" rel="noopener">Cómo llegar</a>
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

  $('#scrim').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#modal').classList.contains('is-open')) closeModal();
  });

  store.on((what) => {
    if (what === 'branch') {
      paintBranchChrome();
      renderVenues();
      const relevo = () => { renderMenu(); renderHero(); paintBranchChrome(); };
      if (reducedMotion()) {
        relevo();
      } else {
        clearTimeout(cambioSede);
        document.body.classList.add('is-switching');
        cambioSede = setTimeout(() => {
          relevo();
          requestAnimationFrame(() => document.body.classList.remove('is-switching'));
        }, 190);
      }
      toast(`Estás viendo ${store.branch.name}`);
    }
    if (what === 'stock' || what === 'prices') renderMenu();
  });

  // el panel de cocina puede marcar agotados desde otra pestaña
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    if (e.key.startsWith('zhuba.stock') || e.key.startsWith('zhuba.prices')) {
      store.stock = JSON.parse(localStorage.getItem('zhuba.stock.v1') || '{}');
      store.prices = JSON.parse(localStorage.getItem('zhuba.prices.v1') || '{}');
      renderMenu();
    }
  });

  // el héroe se cierra al bajar; cada sección publica su propio progreso
  addExitProgress($('.hero'), '--p');
  addParallax($('#heroGrid'), -70);
  $$('.section').forEach((sec) => addExitProgress(sec, '--p'));
  revealAll();
}

export { toast };
