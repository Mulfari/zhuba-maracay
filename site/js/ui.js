/**
 * Capa de vista. Lee del store, dibuja y devuelve eventos al store.
 * Ninguna dato de negocio vive aquí: todo viene de /data.
 */
import { store, BRANCHES, COMPLEJO, CONTACT } from './store.js';
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

  // Una columna por casa: a la izquierda el restaurante, a la derecha el café.
  // Las dos se ven a la vez, que es de lo que va la portada ahora.
  const fotos = [BRANCHES[0].heroPhotos[0], BRANCHES[1].heroPhotos[0]];
  const b = { heroPhotos: fotos };

  const mosaic = $('#heroMosaic');
  if (!mosaic || !b.heroPhotos) return;
  const duraciones = [66, 82];
  mosaic.innerHTML = b.heroPhotos.map((col, i) => `
    <div class="hero__col" data-col="${i}">
      <div class="hero__track" style="--dur:${duraciones[i] || 72}s">
        ${col.concat(col).map((n, j) => `
          <figure><img src="img/${esc(n)}.webp" alt=""${j >= col.length ? ' loading="lazy"' : ''}
            ${j === 0 ? 'data-primera fetchpriority="high"' : ''}
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
      <span class="casa__cifra" aria-hidden="true">0${i + 1}</span>
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

  // el héroe se cierra al bajar; cada sección publica su propio progreso
  addExitProgress($('.hero'), '--p');
  addParallax($('#heroGrid'), -70);
  $$('.section').forEach((sec) => addExitProgress(sec, '--p'));
  revealAll();
  fotosSuaves();
  cortina();
}

