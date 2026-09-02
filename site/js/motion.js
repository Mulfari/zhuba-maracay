/**
 * Movimiento: parallax por transform, revelado al entrar en pantalla,
 * cabecera pegajosa y scrollspy de la carta.
 * Todo se apaga solo si el sistema pide menos movimiento.
 */
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => mq.matches;

/* ------------------------------------------------------------- parallax */
const layers = [];
let ticking = false;
let midiendo = false;

/** Descarta capas cuyo elemento ya no está en el documento. */
export function pruneParallax() {
  for (let i = layers.length - 1; i >= 0; i--) {
    if (!layers[i].el.isConnected) layers.splice(i, 1);
  }
}

/**
 * `travel`: recorrido total en píxeles a lo largo de todo el paso del
 * elemento por la pantalla. Negativo = se rezaga respecto al scroll.
 */
export function addParallax(el, travel, opts = {}) {
  if (!el) return;
  pruneParallax();
  layers.push({ el, travel, scale: opts.scale || 0, top: 0, h: 0 });
  medir();
}

/**
 * Guarda la posición de cada capa *sin* su transformación.
 *
 * Esto importa: leer `getBoundingClientRect()` de un elemento que ya está
 * desplazado y sacar de ahí el desplazamiento siguiente crea una
 * realimentación — el movimiento deja de ser proporcional al scroll y se
 * nota a tirones. Aquí se mide una vez con la transformación anulada y a
 * partir de ahí todo sale de `scrollY`, que es la única fuente de verdad.
 */
function medir() {
  if (midiendo) return;
  midiendo = true;
  const y = window.scrollY;
  for (const l of layers) {
    const previa = l.el.style.transform;
    l.el.style.transform = 'none';
    const r = l.el.getBoundingClientRect();
    l.top = r.top + y;
    l.h = r.height;
    l.el.style.transform = previa;
  }
  midiendo = false;
}

function frame() {
  ticking = false;
  if (reducedMotion()) return;
  const vh = window.innerHeight;
  // Un viewport degenerado (panel oculto) o expandido (captura de página
  // completa) dispararía el desplazamiento y sacaría el contenido de su
  // sección. En esos casos se deja todo en su sitio.
  if (vh < 240 || vh > 3000) { layers.forEach((l) => { l.el.style.transform = ''; }); return; }

  const y = window.scrollY;
  for (const l of layers) {
    if (!l.h) continue;
    // 0 cuando el elemento asoma por abajo, 1 cuando termina de salir por arriba
    const bruto = (y - l.top + vh) / (vh + l.h);
    if (bruto < -0.35 || bruto > 1.35) continue;          // muy lejos de pantalla
    const p = bruto < 0 ? 0 : bruto > 1 ? 1 : bruto;
    const shift = (p - 0.5) * l.travel;
    const escala = l.scale ? 1 + (1 - Math.abs(p - 0.5) * 2) * l.scale : 1;
    l.el.style.transform =
      `translate3d(0, ${shift.toFixed(2)}px, 0)${l.scale ? ` scale(${escala.toFixed(4)})` : ''}`;
  }
}

function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(frame); }
}

let redim;
function onResize() {
  clearTimeout(redim);
  redim = setTimeout(() => { medir(); frame(); }, 120);
}

export function startParallax() {
  if (reducedMotion()) return;
  medir();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  // las fotos cambian la altura de la página al cargar: conviene remedir
  window.addEventListener('load', () => { medir(); frame(); });
  frame();
}

/** Vuelve a medir tras redibujar (por ejemplo, al cambiar de sede). */
export function refreshParallax() { pruneParallax(); medir(); frame(); }

/* ------------------------------------------------------------- revelado */
export function revealAll(root = document) {
  const nodes = root.querySelectorAll('.reveal:not(.is-in)');
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    nodes.forEach((n) => n.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  nodes.forEach((n) => io.observe(n));
}

/* ------------------------------------------------------------- cabecera */
export function stickyHeader(header) {
  const check = () => header.classList.toggle('is-stuck', window.scrollY > 24);
  check();
  window.addEventListener('scroll', check, { passive: true });
}

/* ------------------------------------------------------------ scrollspy */
export function scrollspy(sections, onActive) {
  if (!sections.length) return () => {};
  let current = null;
  const evaluate = () => {
    const line = window.innerHeight * 0.32;
    let best = sections[0];
    for (const s of sections) {
      const top = s.getBoundingClientRect().top;
      if (top - line <= 0) best = s; else break;
    }
    if (best !== current) { current = best; onActive(best.id); }
  };
  evaluate();
  window.addEventListener('scroll', evaluate, { passive: true });
  window.addEventListener('resize', evaluate, { passive: true });
  return evaluate;
}

/** Lleva la pastilla activa al centro de su carril. */
export function centerPill(rail, pill) {
  if (!rail || !pill) return;
  const target = pill.offsetLeft - rail.clientWidth / 2 + pill.clientWidth / 2;
  rail.scrollTo({ left: Math.max(0, target), behavior: reducedMotion() ? 'auto' : 'smooth' });
}
