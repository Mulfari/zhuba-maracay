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

/** speed: fracción del scroll que recorre la capa (negativo = más lenta). */
/** Descarta capas cuyo elemento ya no está en el documento. */
export function pruneParallax() {
  for (let i = layers.length - 1; i >= 0; i--) {
    if (!layers[i].el.isConnected) layers.splice(i, 1);
  }
}

export function addParallax(el, speed, opts = {}) {
  if (!el) return;
  pruneParallax();
  layers.push({ el, speed, scale: opts.scale || 0, max: opts.max ?? 90, fade: opts.fade || 0 });
}

function frame() {
  ticking = false;
  if (reducedMotion()) return;
  const vh = window.innerHeight;
  // Un viewport degenerado (pane oculto) o expandido (captura de página
  // completa) haría que el desplazamiento se dispare y saque el contenido
  // de su sección. En esos casos se deja todo en su sitio.
  if (vh < 240 || vh > 3000) { layers.forEach((l) => { l.el.style.transform = ''; }); return; }
  for (const l of layers) {
    const r = l.el.getBoundingClientRect();
    if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue;
    // progreso: 0 cuando el elemento entra por abajo, 1 cuando sale por arriba
    const p = (vh - r.top) / (vh + r.height);
    const shift = Math.max(-l.max, Math.min(l.max, (p - 0.5) * l.speed * 100));
    const scale = l.scale ? 1 + (1 - Math.abs(p - 0.5) * 2) * l.scale : 1;
    l.el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)${l.scale ? ` scale(${scale.toFixed(4)})` : ''}`;
    if (l.fade) l.el.style.opacity = String(Math.max(0, 1 - Math.max(0, p - 0.55) * l.fade));
  }
}

function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(frame); }
}

export function startParallax() {
  if (reducedMotion()) return;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  frame();
}

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
