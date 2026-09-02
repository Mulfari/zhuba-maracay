/**
 * ZHUBA · Pedido en línea.
 *
 * Página aparte de la portada y con otro trabajo: aquí no se cuenta la casa,
 * se arma una comanda. Llega tráfico frío desde el enlace de Instagram, casi
 * todo desde el móvil, así que manda la rapidez: buscador, lista compacta con
 * miniatura y un botón de añadir siempre a la vista.
 */
import { store, money, bolivares, BRANCHES, CONTACT, METODOS_PAGO, ENVIO } from './store.js';
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


/* ============================================================ el pago, por pasos */
/* La comanda se arma, se dice cómo se entrega y se paga antes de salir. El
   orden importa: el aviso al restaurante se dispara en cuanto alguien marca
   que pagó, no al final, porque el punto flojo es justo ese —pagar y no
   terminar de mandar el mensaje. */

let paso = 'comanda';
let mapa = null, marcador = null;
let mapaNodo = null;      // el div del mapa, que sobrevive a los repintados
let mapaAbierto = false;  // ¿lo ha pedido el cliente aunque no haya punto?

const PASOS = [
  { id: 'comanda', label: 'Comanda' },
  { id: 'entrega', label: 'Entrega' },
  { id: 'pago', label: 'Pago' }
];

function lineaTasa() {
  if (!store.tasa?.valor) return '';
  const f = new Date(store.tasa.fecha);
  const dia = `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`;
  return `<span class="tasa">${esc(store.tasa.fuente)} · ${bolivares(store.tasa.valor)} por dólar · ${dia}</span>`;
}

function dobleImporte(usd, clase = '') {
  const enBs = store.aBs(usd);
  return `<b class="${clase}">${money(usd)}${enBs != null ? `<small>${bolivares(enBs)}</small>` : ''}</b>`;
}

function pasosBarra() {
  const i = PASOS.findIndex((p) => p.id === paso);
  return `<ol class="pasos">${PASOS.map((p, n) => `
    <li class="${n === i ? 'is-now' : n < i ? 'is-done' : ''}">
      <span>${String(n + 1).padStart(2, '0')}</span>${esc(p.label)}
    </li>`).join('')}</ol>`;
}

/* -------------------------------------------------------------- entrega */
function bloqueUbicacion() {
  const e = store.entrega;
  const tope = store.maxKm;

  if (!e) {
    return `
    <div class="geo">
      <p class="geo__intro">Para calcular el envío necesitamos saber a dónde va.
        Se mide en línea recta desde el restaurante; llegamos hasta ${tope} km.</p>
      <div class="geo__acciones">
        <button class="btn btn--solid btn--sm" data-geo>Usar mi ubicación</button>
        <button class="btn btn--sm btn--ghost" data-mapa>Marcar en el mapa</button>
      </div>
      <p class="geo__aviso" id="geoAviso" hidden></p>
      <div class="geo__hueco" data-mapa-hueco></div>
    </div>`;
  }

  const precio = e.precio;
  return `
  <div class="geo${e.fuera ? ' is-fuera' : ''}">
    <div class="geo__hueco" data-mapa-hueco></div>
    <dl class="geo__datos">
      <div><dt>Distancia</dt><dd>${e.km.toFixed(1)} km</dd></div>
      <div><dt>Zona</dt><dd>${e.fuera ? 'Fuera de cobertura' : esc(e.etiqueta)}</dd></div>
      <div><dt>Envío</dt><dd>${e.fuera ? '—'
        : precio == null ? 'Por confirmar' : money(precio)}</dd></div>
    </dl>
    ${e.direccion ? `<p class="geo__dir">${esc(e.direccion)}</p>` : ''}
    ${e.fuera
      ? `<p class="geo__error">Esa dirección queda a ${e.km.toFixed(1)} km y solo llevamos hasta ${tope} km.
         Puedes pedirlo para <b>pick-up</b> o escribirnos por WhatsApp.</p>`
      : precio == null
        ? '<p class="geo__nota">El restaurante confirma el costo del envío al recibir tu pedido.</p>' : ''}
    <button class="btn btn--sm btn--ghost" data-geo-reset>Cambiar ubicación</button>
  </div>`;
}

async function cargarMapa() {
  if (window.L) return window.L;
  await new Promise((ok, err) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    js.onload = ok; js.onerror = err;
    document.head.appendChild(js);
  });
  return window.L;
}

/* El mapa vive fuera del HTML que se repinta. Cada `renderCart` rehace el
   cajón entero; si el mapa fuera parte de ese HTML se destruiría y volvería a
   crearse a cada tecla, con dos construcciones pisándose y teselas a medias.
   Así se construye una vez y sólo cambia de hueco. */
function montarMapa() {
  const hueco = $('[data-mapa-hueco]');
  if (!hueco) return null;
  if (!mapaNodo) {
    mapaNodo = document.createElement('div');
    mapaNodo.className = 'geo__mapa';
  }
  if (mapaNodo.parentElement !== hueco) hueco.appendChild(mapaNodo);
  mapaNodo.hidden = !(store.entrega || mapaAbierto);
  if (mapa && !mapaNodo.hidden) requestAnimationFrame(() => mapa.invalidateSize());
  return mapaNodo;
}

async function pintarMapa(lat, lng) {
  mapaAbierto = true;
  const cont = montarMapa();
  if (!cont) return;
  cont.hidden = false;
  let L;
  try { L = await cargarMapa(); } catch { cont.innerHTML = '<p class="geo__nota">No se pudo cargar el mapa. Escríbenos la dirección por WhatsApp.</p>'; return; }
  if (!document.body.contains(cont)) return;

  // Ya construido: basta con mover la vista y la chincheta.
  if (mapa) {
    mapa.setView([lat, lng], mapa.getZoom());
    marcador?.setLatLng([lat, lng]);
    requestAnimationFrame(() => mapa.invalidateSize());
    return;
  }

  mapa = L.map(cont, { attributionControl: true, zoomControl: true }).setView([lat, lng], 15);
  // Teselas de OpenStreetMap, que no piden clave. El tono oscuro lo pone el CSS
  // sobre las teselas, no sobre los marcadores, para que el mapa no cante
  // dentro de una página negra.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap'
  }).addTo(mapa);
  mapa.attributionControl.setPrefix('');
  L.circleMarker([ENVIO.origen.lat, ENVIO.origen.lng], {
    radius: 6, color: '#D6A050', fillColor: '#D6A050', fillOpacity: .9, weight: 1
  }).addTo(mapa).bindTooltip('ZHUBA');
  marcador = L.marker([lat, lng], {
    draggable: true,
    icon: L.divIcon({ className: 'pin', html: '<i></i>', iconSize: [22, 22], iconAnchor: [11, 11] })
  }).addTo(mapa);
  marcador.on('dragend', () => {
    const p = marcador.getLatLng();
    fijarUbicacion(p.lat, p.lng, true);
  });
  requestAnimationFrame(() => mapa.invalidateSize());
}

/* --------------------------------------------------------- direcciones
   Dos caminos hacia el mismo punto: marcar en el mapa y saber cómo se llama
   ese sitio, o escribir el nombre y que aparezca en el mapa. Los dos usan
   Nominatim, el buscador de OpenStreetMap, que pide no abusar: de ahí el
   retardo al teclear, el mínimo de letras y que se cancele lo anterior. */

/** Arma una dirección corta y usable a partir del desglose de Nominatim. */
function calleDe(a = {}) {
  const via = [a.road, a.house_number].filter(Boolean).join(' ');
  const zona = a.neighbourhood || a.suburb || a.quarter || a.residential
    || a.hamlet || a.village || a.town || '';
  return [via, zona].filter(Boolean).join(', ');
}

/** Nombre de un punto. Devuelve `{corta, larga}` o null si no se pudo. */
async function direccionDe(lat, lng) {
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/reverse'
      + `?format=jsonv2&addressdetails=1&accept-language=es&zoom=18&lat=${lat}&lon=${lng}`);
    if (!r.ok) return null;
    const d = await r.json();
    const larga = String(d.display_name || '').split(',').slice(0, 4).join(',').trim();
    return { corta: calleDe(d.address) || larga.split(',').slice(0, 2).join(',').trim(), larga };
  } catch { return null; }
}

/** Puntos que coinciden con lo escrito, primero dentro de Maracay. */
async function buscarDirecciones(texto, señal) {
  const base = 'https://nominatim.openstreetmap.org/search'
    + '?format=jsonv2&addressdetails=1&accept-language=es&limit=6&countrycodes=ve';
  const pedir = async (acotado) => {
    const url = `${base}&viewbox=${ENVIO.busqueda.viewbox}&bounded=${acotado ? 1 : 0}`
      + `&q=${encodeURIComponent(texto)}`;
    const r = await fetch(url, { signal: señal });
    return r.ok ? r.json() : [];
  };
  let lista = await pedir(true);
  if (!lista.length) lista = await pedir(false);
  return lista.map((d) => ({
    lat: Number(d.lat), lng: Number(d.lon),
    corta: calleDe(d.address) || String(d.name || d.display_name || '').split(',')[0],
    larga: String(d.display_name || '').split(',').slice(0, 4).join(',').trim()
  })).filter((d) => d.corta)
    .filter((d, i, todas) => todas.findIndex((o) => o.corta === d.corta) === i);
}

let sugeTimer = null;
let sugeCorte = null;         // para cancelar la consulta anterior
let sugeLista = [];
let dirAuto = false;          // ¿la dirección del formulario la puso la web?

function guardarServicio() {
  try { localStorage.setItem('zhuba.service.v1', JSON.stringify(store.service)); } catch { /* noop */ }
}

function cerrarSugerencias() {
  clearTimeout(sugeTimer);
  sugeCorte?.abort();
  sugeCorte = null;
  sugeLista = [];
  const ul = $('#sugeDir');
  if (ul) { ul.hidden = true; ul.innerHTML = ''; }
  const est = $('#sugeEstado');
  if (est) est.hidden = true;
}

function estadoSugerencias(txt) {
  const est = $('#sugeEstado');
  if (!est) return;
  est.hidden = !txt;
  est.textContent = txt || '';
}

function pintarSugerencias(lista) {
  const ul = $('#sugeDir');
  if (!ul) return;
  sugeLista = lista;
  if (!lista.length) { ul.hidden = true; ul.innerHTML = ''; return; }
  const abriendo = ul.hidden;
  ul.innerHTML = lista.map((d, i) => `
    <li><button type="button" data-sugerencia="${i}">${esc(d.corta)}
      <small>${esc(d.larga)}</small></button></li>`).join('');
  ul.hidden = false;
  // El cajón recorta lo que se sale por abajo, así que al abrirse la lista se
  // trae el campo al centro una sola vez; en cada tecla sería mareante.
  if (abriendo) $('.field--busca')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function agendarSugerencias(texto) {
  clearTimeout(sugeTimer);
  sugeCorte?.abort();
  const q = texto.trim();
  if (q.length < 4) { cerrarSugerencias(); return; }
  estadoSugerencias('Buscando…');
  sugeTimer = setTimeout(async () => {
    sugeCorte = new AbortController();
    try {
      const lista = await buscarDirecciones(q, sugeCorte.signal);
      pintarSugerencias(lista);
      estadoSugerencias(lista.length ? '' : 'No encontramos esa dirección. Márcala en el mapa.');
    } catch (e) {
      if (e.name !== 'AbortError') estadoSugerencias('No se pudo buscar. Márcala en el mapa.');
    }
  }, 700);
}

/** Escribe en el formulario la dirección que dio el mapa, sin pisar la del cliente. */
function aplicarDireccion(d) {
  if (!d) return;
  if (store.entrega) store.entrega.direccion = d.larga || d.corta;
  const actual = String(store.service.fields.direccion || '').trim();
  if (d.corta && (!actual || dirAuto)) {
    store.service.fields.direccion = d.corta;
    dirAuto = true;
    guardarServicio();
  }
}

async function fijarUbicacion(lat, lng, mantenerMapa = false, dir = null) {
  cerrarSugerencias();
  store.setEntrega(lat, lng, '');
  if (dir) aplicarDireccion(dir);
  renderCart();
  if (!mantenerMapa) await pintarMapa(lat, lng);
  else setTimeout(() => pintarMapa(lat, lng), 0);
  if (dir) return;
  const d = await direccionDe(lat, lng);
  if (d && store.entrega) { aplicarDireccion(d); renderCart(); pintarMapa(lat, lng); }
}

function pedirUbicacion() {
  const aviso = $('#geoAviso');
  if (!navigator.geolocation) {
    if (aviso) { aviso.hidden = false; aviso.textContent = 'Tu navegador no comparte ubicación. Márcala en el mapa.'; }
    return;
  }
  if (aviso) { aviso.hidden = false; aviso.textContent = 'Buscando tu ubicación…'; }
  navigator.geolocation.getCurrentPosition(
    (pos) => fijarUbicacion(pos.coords.latitude, pos.coords.longitude),
    () => { if (aviso) aviso.textContent = 'No pudimos leer tu ubicación. Márcala tú en el mapa.'; },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}

/* ------------------------------------------------------------- servicio */
function bloqueEntrega() {
  const b = store.branch;
  const modo = SERVICE_MODES.find((m) => m.id === store.service.mode) || SERVICE_MODES[0];
  const f = store.service.fields || {};

  const campo = (fl) => {
    // La dirección del delivery se puede escribir y elegir de una lista; al
    // elegirla, el punto cae solo en el mapa.
    const busca = fl.id === 'direccion' && store.service.mode === 'delivery';
    const entrada = `<input id="f-${fl.id}" data-input="${fl.id}" type="${fl.type}"
      ${busca ? 'data-busca-dir autocomplete="off" role="combobox" aria-controls="sugeDir" aria-expanded="false"' : ''}
      placeholder="${esc(fl.placeholder || '')}" value="${esc(f[fl.id] || '')}">`;
    return `<div class="field${busca ? ' field--busca' : ''}" data-field="${fl.id}">
      <label for="f-${fl.id}">${esc(fl.label)}</label>
      ${busca
        ? `<div class="busca-caja">${entrada}<ul class="sugerencias" id="sugeDir" role="listbox" hidden></ul></div>
           <p class="field__pista" id="sugeEstado" hidden></p>
           ${store.entrega ? '' : '<p class="field__pista">Escríbela y elígela de la lista, o usa tu ubicación aquí abajo.</p>'}`
        : entrada}
    </div>`;
  };

  return `
  <div class="paso-cuerpo">
    <h4 class="paso-titulo">¿Cómo lo quieres?</h4>
    <div class="svc">
      ${SERVICE_MODES.map((m) => `
        <button data-mode="${m.id}" aria-pressed="${m.id === modo.id}">${ICON[m.icon]}${esc(m.label)}</button>`).join('')}
    </div>
    <p class="svc-hint">${esc(modo.hint)}</p>
    ${modo.fields.map(campo).join('')}
    ${store.service.mode === 'delivery' ? bloqueUbicacion() : ''}
    <div class="field">
      <label for="orderNote">Nota general del pedido</label>
      <textarea id="orderNote" data-input="_note" placeholder="Cumpleaños, alergias, hora de llegada…">${esc(f._note || '')}</textarea>
    </div>
  </div>`;
}

/* ----------------------------------------------------------------- pago */
function bloquePago() {
  const metodos = store.metodosDisponibles();
  const elegido = store.pago.metodo;
  const m = METODOS_PAGO.find((x) => x.id === elegido);
  const datos = elegido ? store.datosPago(elegido) : {};
  const total = store.total;
  const enBs = store.aBs(total);

  const soloEfectivo = metodos.length === 1 && metodos[0].id === 'efectivo';

  return `
  <div class="paso-cuerpo">
    <div class="cobro">
      <div class="cobro__fila"><span>Total a pagar</span>${dobleImporte(total, 'cobro__total')}</div>
      ${enBs != null
        ? `<p class="cobro__nota">Se cobra en bolívares. ${lineaTasa()}</p>`
        : '<p class="cobro__nota">No pudimos leer la tasa oficial ahora mismo; el restaurante te confirma el monto en bolívares.</p>'}
    </div>

    ${soloEfectivo ? `
      <p class="pago-vacio">Todavía no hay datos de pago publicados en la web.
        Envía tu pedido y el restaurante te pasa los datos por WhatsApp.</p>` : ''}

    <h4 class="paso-titulo">¿Cómo vas a pagar?</h4>
    <div class="opts" role="radiogroup" aria-label="Método de pago">
      ${metodos.map((x) => `
        <button class="opt" role="radio" data-metodo="${x.id}" aria-checked="${x.id === elegido}">
          <span class="opt__mark"><i></i></span>
          <span class="opt__label">${esc(x.nombre)}<br><span class="opt__nota">${esc(x.nota)}</span></span>
        </button>`).join('')}
    </div>

    ${m && m.campos.length ? `
      <div class="datos-pago">
        <h4 class="paso-titulo">Paga a estos datos</h4>
        <dl>
          ${m.campos.map((c) => `<div><dt>${esc(c.label)}</dt><dd>${esc(datos[c.id] || '')}</dd></div>`).join('')}
          <div><dt>Monto</dt><dd>${m.enDolares ? money(total) : (enBs != null ? bolivares(enBs) : 'a confirmar')}</dd></div>
        </dl>
        <button class="btn btn--sm btn--ghost" data-copiar>Copiar los datos</button>
      </div>

      <h4 class="paso-titulo">Cuando ya pagaste</h4>
      <div class="field" data-field="referencia">
        <label for="p-ref">Referencia del pago</label>
        <input id="p-ref" data-pago="referencia" type="text" inputmode="numeric"
               placeholder="Últimos dígitos o referencia completa" value="${esc(store.pago.referencia)}">
      </div>
      <div class="field" data-field="telefono">
        <label for="p-tel">Teléfono de quien paga</label>
        <input id="p-tel" data-pago="telefono" type="tel" placeholder="Ej. 0412-0000000"
               value="${esc(store.pago.telefono)}">
      </div>
      <div class="field">
        <label for="p-comp">Comprobante <span class="opcional">opcional</span></label>
        <input id="p-comp" data-pago="comprobante" type="file" accept="image/*">
        ${store.pago.comprobante ? `<p class="svc-hint">Adjuntado: ${esc(store.pago.comprobante.nombre)}</p>` : ''}
      </div>` : ''}
  </div>`;
}

/* --------------------------------------------------------------- cajón */
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

/** Qué falta para poder seguir. Cadena vacía = se puede. */
function loQueFalta() {
  if (paso === 'comanda') return store.cart.length ? '' : 'Añade algo a la comanda';
  if (paso === 'entrega') {
    const modo = SERVICE_MODES.find((m) => m.id === store.service.mode);
    const f = store.service.fields || {};
    for (const fl of modo.fields) {
      if (fl.required && !String(f[fl.id] || '').trim()) return `Falta ${fl.label.toLowerCase()}`;
    }
    if (store.service.mode === 'delivery') {
      if (!store.entrega) return 'Marca a dónde lo llevamos';
      if (store.entrega.fuera) return 'Esa zona queda fuera de cobertura';
    }
    return '';
  }
  const m = METODOS_PAGO.find((x) => x.id === store.pago.metodo);
  if (!m) return 'Elige cómo vas a pagar';
  if (m.campos.length) {
    if (!store.pago.referencia.trim()) return 'Falta la referencia del pago';
    if (!store.pago.telefono.trim()) return 'Falta el teléfono de quien paga';
  }
  return '';
}

function renderCart() {
  const body = $('#drawerBody');
  const foot = $('#drawerFoot');
  const b = store.branch;
  if (!body) return;
  $('#drawerSub').textContent = b.name;

  if (!store.cart.length) {
    paso = 'comanda';
    body.innerHTML = `
      <div class="empty">
        <span aria-hidden="true">乙</span>
        <p>Tu comanda está vacía. Añade platos de la carta y los enviamos al restaurante.</p>
        <button class="btn btn--ghost btn--sm" data-close-drawer>Ver la carta</button>
      </div>`;
    foot.innerHTML = '';
    return;
  }

  const picks = paso === 'comanda' ? upsellPicks() : [];
  body.innerHTML = pasosBarra() + (
    paso === 'comanda' ? `
      ${store.cart.map(lineRow).join('')}
      ${picks.length ? `
      <div class="upsell">
        <h4 class="paso-titulo">Completa la mesa</h4>
        <div class="upsell__rail">
          ${picks.map((i) => `
            <button class="upsell__card" data-quick="${i.id}">
              ${i.img ? `<img src="img/${esc(i.img)}" alt="" loading="lazy" width="128" height="128">` : '<div class="ph" aria-hidden="true">乙</div>'}
              <b>${esc(i.name)}</b><span>${esc(priceLabel(i).main)}</span>
            </button>`).join('')}
        </div>
      </div>` : ''}`
    : paso === 'entrega' ? bloqueEntrega()
    : bloquePago()
  );

  const falta = loQueFalta();
  const envio = store.costeEnvio;
  const esDelivery = store.service.mode === 'delivery';

  foot.innerHTML = `
    <div class="totals">
      <div><span>Subtotal · ${store.count} ${store.count === 1 ? 'ítem' : 'ítems'}</span><b>${money(store.subtotal)}</b></div>
      ${esDelivery ? `<div><span>Envío${store.entrega ? ` · ${store.entrega.km.toFixed(1)} km` : ''}</span><b>${
        store.entrega?.fuera ? 'Fuera de zona'
        : store.entrega?.precio == null ? 'Por confirmar' : money(store.entrega.precio)}</b></div>` : ''}
      <div class="grand"><span>Total</span>${dobleImporte(store.total, 'price')}</div>
    </div>
    ${falta ? `<p class="falta">${esc(falta)}</p>` : ''}
    ${paso === 'pago'
      ? `<button class="btn btn--wa" data-enviar ${falta ? 'disabled' : ''}>${ICON.wa} ${
          store.pago.metodo === 'efectivo' ? 'Enviar pedido por WhatsApp' : 'Ya pagué · enviar por WhatsApp'}</button>`
      : `<button class="btn btn--solid" data-siguiente ${falta ? 'disabled' : ''}>
           ${paso === 'comanda' ? 'Continuar' : 'Continuar al pago'}</button>`}
    ${paso !== 'comanda' ? '<button class="link-x" data-atras>Volver</button>' : ''}
    ${paso === 'pago'
      ? `<p class="fineprint">Al enviar se abre WhatsApp con la comanda escrita hacia <b>${esc(b.phone)}</b>.
           El restaurante confirma y sigue contigo por ahí.</p>`
      : ''}`;

  if (paso === 'entrega' && store.service.mode === 'delivery') {
    montarMapa();
    if (store.entrega) pintarMapa(store.entrega.lat, store.entrega.lng);
  }
}

function bindDrawer() {
  const drawer = $('#drawer');

  drawer.addEventListener('click', async (e) => {
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
        itemId: i.id, name: i.name, img: i.img, variant: v ? v.name : null,
        unit: v ? store.variantPrice(i, v) : store.basePrice(i), qty: 1, adjustments: [], note: ''
      });
      toast(`${i.name} · añadido`);
      return;
    }

    const modo = e.target.closest('[data-mode]');
    if (modo) { store.setService({ mode: modo.dataset.mode }); return; }

    const sug = e.target.closest('[data-sugerencia]');
    if (sug) {
      const d = sugeLista[Number(sug.dataset.sugerencia)];
      cerrarSugerencias();
      if (d) {
        store.service.fields.direccion = d.corta;
        dirAuto = true;
        guardarServicio();
        await fijarUbicacion(d.lat, d.lng, false, d);
      }
      return;
    }
    if (!e.target.closest('.field--busca')) cerrarSugerencias();

    if (e.target.closest('[data-geo]')) return pedirUbicacion();
    if (e.target.closest('[data-mapa]')) return pintarMapa(ENVIO.origen.lat, ENVIO.origen.lng);
    if (e.target.closest('[data-geo-reset]')) {
      store.limpiarEntrega();
      mapaAbierto = false;
      // La dirección que puso la web se va con el punto; la escrita a mano se queda.
      if (dirAuto) { store.service.fields.direccion = ''; dirAuto = false; guardarServicio(); }
      return renderCart();
    }

    const met = e.target.closest('[data-metodo]');
    if (met) { store.pago.metodo = met.dataset.metodo; return renderCart(); }

    if (e.target.closest('[data-copiar]')) {
      const m = METODOS_PAGO.find((x) => x.id === store.pago.metodo);
      const d = store.datosPago(store.pago.metodo);
      const txt = m.campos.map((c) => `${c.label}: ${d[c.id] || ''}`).join('\n');
      try { await navigator.clipboard.writeText(txt); toast('Datos copiados'); }
      catch { toast('Cópialos a mano'); }
      return;
    }

    if (e.target.closest('[data-siguiente]')) {
      paso = paso === 'comanda' ? 'entrega' : 'pago';
      $('#drawerBody').scrollTop = 0;
      return renderCart();
    }
    if (e.target.closest('[data-atras]')) {
      paso = paso === 'pago' ? 'entrega' : 'comanda';
      $('#drawerBody').scrollTop = 0;
      return renderCart();
    }
    if (e.target.closest('[data-enviar]')) return enviar();
  });

  drawer.addEventListener('input', (e) => {
    const campo = e.target.closest('[data-input]');
    if (campo) {
      store.service.fields[campo.dataset.input] = campo.value;
      guardarServicio();
      campo.closest('.field')?.classList.remove('is-bad');
      if (campo.hasAttribute('data-busca-dir')) {
        dirAuto = false;                       // a partir de aquí la escribe él
        agendarSugerencias(campo.value);
      }
      return actualizarPie();
    }
    const pago = e.target.closest('[data-pago]');
    if (pago && pago.type !== 'file') {
      store.pago[pago.dataset.pago] = pago.value;
      return actualizarPie();
    }
  });

  drawer.addEventListener('change', (e) => {
    const f = e.target.closest('input[type="file"][data-pago]');
    if (!f || !f.files?.[0]) return;
    const file = f.files[0];
    if (file.size > 3 * 1024 * 1024) { toast('El comprobante pesa más de 3 MB'); f.value = ''; return; }
    const lector = new FileReader();
    lector.onload = () => {
      store.pago.comprobante = { nombre: file.name, tipo: file.type, datos: lector.result };
      renderCart();
    };
    lector.readAsDataURL(file);
  });
}

/** Refresca solo el pie, para no perder el foco mientras se escribe. */
function actualizarPie() {
  const foot = $('#drawerFoot');
  const falta = loQueFalta();
  const btn = foot.querySelector('[data-siguiente], [data-enviar]');
  if (btn) btn.disabled = !!falta;
  const aviso = foot.querySelector('.falta');
  if (falta && !aviso) {
    const p = document.createElement('p');
    p.className = 'falta'; p.textContent = falta;
    foot.insertBefore(p, btn);
  } else if (falta && aviso) { aviso.textContent = falta; }
  else if (!falta && aviso) { aviso.remove(); }
}

async function enviar() {
  const falta = loQueFalta();
  if (falta) { toast(falta); return; }

  const m = METODOS_PAGO.find((x) => x.id === store.pago.metodo);
  const pedido = orderSnapshot(store);
  pedido.pago = {
    metodo: m.nombre,
    metodoId: m.id,
    referencia: store.pago.referencia,
    telefono: store.pago.telefono,
    conComprobante: !!store.pago.comprobante,
    enBs: store.aBs(store.total),
    tasa: store.tasa ? { valor: store.tasa.valor, fecha: store.tasa.fecha, fuente: store.tasa.fuente } : null
  };
  pedido.entrega = store.entrega;
  pedido.envio = store.costeEnvio;
  pedido.total = store.total;

  // Primero se registra y se avisa; después WhatsApp. Si alguien paga y no
  // llega a mandar el mensaje, el restaurante ya tiene la comanda.
  // El estado es el de cocina (nuevo → en cocina → listo). Si está cobrado o
  // no es otra cosa, y va en `pago`: el panel lo enseña aparte.
  const guardado = store.recordOrder(pedido);

  // El aviso sale ya, pero no se espera aquí: entre el clic y `window.open`
  // no puede haber un `await`, o el navegador móvil da la pestaña por no
  // pedida y la bloquea. El enlace se arma antes de vaciar la comanda.
  const avisando = store.avisar({
    ...pedido, id: guardado.id, en: new Date().toISOString(),
    comprobante: store.pago.comprobante ? store.pago.comprobante.datos : null
  });
  const link = whatsappLink(store, { pago: pedido.pago, entrega: store.entrega, envio: store.costeEnvio, id: guardado.id });

  store.clearCart();
  store.pago = { metodo: null, referencia: '', telefono: '', comprobante: null };
  store.limpiarEntrega();
  paso = 'comanda';
  closeDrawer();

  const pestana = window.open(link, '_blank');
  if (!pestana) { location.href = link; return; }   // si aun así la bloquean

  const aviso = await avisando;
  toast(aviso.enviado ? 'Pedido enviado y avisado al local' : 'Pedido enviado a WhatsApp');
}

function openDrawer() {
  paso = 'comanda';
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
  if (mapa) { mapa.remove(); mapa = null; }
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
      <span class="row__price price">${sub ? `<small>${sub}</small>` : ''}${esc(main)}
        ${refBs(item)}</span>
      ${vitrina
        ? '<span class="row__case">En vitrina</span>'
        : `<button class="row__add" data-open="${item.id}" ${out ? 'disabled' : ''}
             aria-label="Anadir ${esc(item.name)}">${ICON.plus}</button>`}
    </div>
  </article>`;
}

/** Referencia en bolívares. Vacía mientras no haya tasa: no se estima. */
function refBs(item) {
  const p = store.basePrice(item);
  const enBs = p == null ? null : store.aBs(p);
  return enBs == null ? '' : `<span class="row__bs">${bolivares(enBs)}</span>`;
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
  store.cargarTasa();
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
    if (que === 'tasa') { renderLista(); if ($('#drawer').classList.contains('is-open')) renderCart(); }
    // La ubicación y lo que el restaurante configure cambian el precio del
    // envío, y con él lo que falta para poder seguir.
    if (que === 'entrega' || que === 'config') {
      if ($('#drawer').classList.contains('is-open')) renderCart();
    }
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
