/**
 * Carga de vídeo consciente del dispositivo.
 *
 * El póster viaja siempre en el HTML; el vídeo se engancha después y solo si
 * tiene sentido: encode ligero en móvil, nada si el sistema pide menos
 * movimiento o el navegador declara ahorro de datos, y los vídeos que están
 * bajo el pliegue no se piden hasta que asoman. En Maracay se navega sobre
 * todo con datos móviles y eso pesa más que la fidelidad del bucle.
 */
const saveData = () => {
  const c = navigator.connection;
  return !!(c && (c.saveData || /^(slow-)?2g$/.test(c.effectiveType || '')));
};

const wantsStill = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || saveData();

function attach(video) {
  if (video.dataset.attached) return;
  video.dataset.attached = '1';
  const small = window.matchMedia('(max-width: 700px)').matches;
  const base = video.dataset.src;
  const sm = small && video.dataset.srcSm ? video.dataset.srcSm : base;
  ['webm', 'mp4'].forEach((ext) => {
    const s = document.createElement('source');
    s.src = `${sm}.${ext}`;
    s.type = `video/${ext}`;
    video.appendChild(s);
  });
  video.load();
  const play = video.play();
  if (play && play.catch) play.catch(() => { /* el póster se queda */ });
}

export function initVideos() {
  const videos = Array.from(document.querySelectorAll('video[data-src]'));
  if (!videos.length) return;

  if (wantsStill()) return;  // solo el póster

  videos.forEach((video) => {
    if (video.dataset.eager === '1') { attach(video); return; }
    if (!('IntersectionObserver' in window)) { attach(video); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        attach(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '200px' });
    io.observe(video);
  });
}
