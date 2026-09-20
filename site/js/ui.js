/**
 * Capa de vista. Lee del store, dibuja y devuelve eventos al store.
 * Ninguna dato de negocio vive aquí: todo viene de /data.
 */
import { store, BRANCHES, COMPLEJO, CONTACT } from './store.js';
import { DESTACADOS } from '../data/branches.js';
import { ITEMS as PLATOS_REST } from '../data/menu-restaurante.js';
import { ITEMS as PLATOS_CAFE } from '../data/menu-cafe.js';
import { revealAll, addParallax, addExitProgress } from './motion.js';
import { cortina, fotosSuaves } from './carga.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));


/* ======================================================== el tono de la casa */
/* La portada enseña el complejo entero, así que no cambia de temperatura: se
   queda en brasa, y cada casa pone su acento dentro de su propio bloque. */
function pintarTono() {
  const b = BRANCHES[0];
  const raiz = document.documentElement;
  raiz.style.setProperty('--accent', b.accent);
  Object.entries(b.theme || {}).forEach(([k, v]) => raiz.style.setProperty(k, v));
  raiz.dataset.sede = b.id;
}

/* ================================================================ héroe */
/* La vitrina se redibuja al cambiar de sede: el restaurante enseña barra
   fría y wok; el café, gelato y vitrina. */
/* Dónde cae cada foto del collage, sobre una retícula de 3 columnas × 6 filas:
   fila de inicio / columna de inicio / fila de fin / columna de fin. Dos
   grandes en esquinas opuestas, una alta, una ancha y seis sueltas. */
const AREAS = [
  '1 / 1 / 3 / 3', '1 / 3 / 2 / 4', '2 / 3 / 3 / 4',
  '3 / 1 / 5 / 2', '3 / 2 / 4 / 4', '4 / 2 / 5 / 3', '4 / 3 / 5 / 4',
  '5 / 1 / 6 / 2', '5 / 2 / 7 / 4', '6 / 1 / 7 / 2'
];
/* Las que se ven al abrir: la grande, la alta y la ancha. La cortina de carga
   espera a estas, igual que antes esperaba a la primera de cada columna. */
const PRIMERAS = [0, 3, 4];

function renderHero() {
  const kicker = $('#heroKicker');
  if (kicker) kicker.textContent = COMPLEJO.kicker;
  const tag = $('#heroTagline');
  if (tag) tag.textContent = COMPLEJO.tagline;

  const title = $('#heroTitle');
  if (title) {
    title.innerHTML = COMPLEJO.titulo
      .map((l) => `<span class="hero__line">${l.em ? `<em>${esc(l.em)}</em> ` : ''}${esc(l.text)}</span>`)
      .join('');
  }
  const sub = $('#heroSub');
  if (sub) sub.textContent = COMPLEJO.sub;

  // Un collage de las dos casas: tres columnas y seis filas cuadradas, con
  // fotos que ocupan 1×1, 1×2, 2×1 o 2×2. El bloque cierra un rectángulo
  // exacto, así que se repite debajo de sí mismo y la deriva no tiene costura.
  const mosaic = $('#heroMosaic');
  if (!mosaic) return;
  const fotos = COMPLEJO.collage.slice(0, AREAS.length);
  const bloque = (copia) => `
      <div class="collage"${copia ? ' aria-hidden="true"' : ''}>
        ${fotos.map((n, j) => `
          <figure style="grid-area:${AREAS[j]}"><img src="img/${esc(n)}.webp" alt=""
            ${copia ? 'loading="lazy"' : (PRIMERAS.includes(j) ? 'data-primera fetchpriority="high"' : '')}
            decoding="async" width="520" height="520"></figure>`).join('')}
      </div>`;
  mosaic.innerHTML = `
    <div class="hero__lienzo">
      <div class="hero__track" style="--dur:80s">${bloque(false)}${bloque(true)}</div>
    </div>
    <div class="hero__blend"></div><div class="hero__fade"></div>`;

  // el scroll añade su propio desplazamiento sobre la deriva continua
  addParallax($('.hero__lienzo', mosaic), 110);
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

/* ============================================================== las casas */
/* Cada casa se presenta entera: su carácter, su triptico de fotos, su
   horario y su puerta al pedido. Sin precios ni fichas de plato — eso es la
   carta, y la carta vive en /pedir. */
function casa(b, i) {
  const fotos = b.heroPhotos.flat().slice(0, 3);
  return `
  <article class="casa" style="--acento:${b.accent}" data-branch="${b.id}">
    <div class="casa__fotos">
      ${fotos.map((n, j) => `
        <figure class="casa__foto casa__foto--${j}">
          <img src="img/${esc(n)}.webp" alt="" loading="lazy" decoding="async" width="520" height="520">
        </figure>`).join('')}
    </div>

    <div class="casa__texto">
      <p class="eyebrow eyebrow--plain">${esc(b.kicker)}</p>
      <h3 class="display">${esc(b.name)}</h3>
      <p class="casa__lede">${esc(b.heroSub)}</p>

      <dl class="casa__datos">
        <div>
          <dt>Horario</dt>
          <dd>${b.hours.map((h) => `${esc(h.label)} · <b>${esc(h.value)}</b>`).join('<br>')}</dd>
        </div>
        <div>
          <dt>Servicios</dt>
          <dd>${b.services.join(' · ')}</dd>
        </div>
      </dl>

      <div class="casa__cta">
        <a class="btn btn--sm btn--solid" href="pedir?sede=${b.id}">Ver la carta y pedir</a>
        <a class="btn btn--sm" href="${esc(b.maps)}" target="_blank" rel="noopener">Cómo llegar</a>
      </div>
    </div>
  </article>`;
}

/* ==================================================== tres platos de la casa */
/* La portada enseñaba fotos de comida en el mosaico del héroe y en las
   fichas de las casas, pero en ninguna parte decía cómo se llama un plato.
   Aquí se nombran tres, uno por oficio, y se enlazan a su ficha en la carta.
   Sin precio: la portada es escaparate y el precio vive en /pedir. */
function renderDestacados() {
  const lista = $('#firmasLista');
  if (!lista) return;
  const todos = [...PLATOS_REST, ...PLATOS_CAFE];

  lista.innerHTML = DESTACADOS.map(({ id, de }) => {
    const plato = todos.find((p) => p.id === id);
    // Si algún día se quita ese plato de la carta, la portada se salta el
    // hueco en vez de enseñar una tarjeta vacía.
    if (!plato || !plato.img) return '';
    // La primera frase de su descripción: en una tarjeta no cabe el párrafo,
    // y la ficha del plato lo tiene entero.
    const linea = String(plato.desc || '').split(/(?<=\.)\s+/)[0];
    return `
    <article class="firma reveal">
      <a class="firma__foto" href="pedir?plato=${esc(plato.id)}"
         aria-label="Ver ${esc(plato.name)} en la carta">
        <img src="img/${esc(plato.img)}" alt="${esc(plato.name)}"
             width="520" height="520" loading="lazy" decoding="async">
      </a>
      <p class="firma__de">${esc(de)}</p>
      <h3><a href="pedir?plato=${esc(plato.id)}">${esc(plato.name)}</a></h3>
      <p class="firma__linea">${esc(linea)}</p>
    </article>`;
  }).join('');
  fotosSuaves(lista);
}

function renderCasas() {
  const lista = $('#casasLista');
  if (!lista) return;
  lista.innerHTML = BRANCHES.map(casa).join('');
  fotosSuaves(lista);
}

/* ================================================================= arranque */
export function mountApp() {
  pintarTono();
  renderHero();
  pintarEstado();
  setInterval(pintarEstado, 60000);
  renderCasas();
  renderDestacados();

  // el héroe se cierra al bajar; cada sección publica su propio progreso
  addExitProgress($('.hero'), '--p');
  addParallax($('#heroGrid'), -70);
  $$('.section').forEach((sec) => addExitProgress(sec, '--p'));
  revealAll();
  fotosSuaves();
  cortina();
}

