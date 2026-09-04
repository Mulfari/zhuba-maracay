/**
 * Graba el sitio de verdad, fotograma a fotograma.
 *
 * Dos intentos fallidos antes de este, y los dos enseñan algo:
 *  · Congelar el reloj con `setVirtualTimePolicy` cuelga la captura a los
 *    seis fotogramas: con el reloj parado el compositor no entrega nada.
 *  · El `screencast` en tiempo real da 5 fps en headless, porque sin
 *    pantalla nadie obliga al compositor a dibujar a 60.
 *
 * Lo que sí funciona: capturar a nuestro ritmo y mover nosotros el tiempo de
 * las animaciones. La Web Animations API deja pausar cada animación —las
 * transiciones de CSS también son animaciones— y colocarle el `currentTime`
 * exacto de cada fotograma. La página es la de verdad, las animaciones son
 * las suyas, y el resultado es idéntico en cada ejecución.
 *
 * uso: node grabar.js <base> <guion> <carpeta destino>
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const [BASE, GUION, DEST] = process.argv.slice(2);
const PORT = 9222;
const FPS = 30;
const W = 390, H = 844, DSF = 2;

const CONFIG = {
  pagos: { 'pago-movil': { banco: 'Banesco · 0134', telefono: '0412-455 42 07', documento: 'J-40123456-7' } },
  anillos: { a1: 2, a2: 3.5, a3: 5, a4: 7 }, maxKm: 12, aviso: ''
};

/* El reloj de las animaciones lo llevamos nosotros. Cada animación que
   aparece se apunta con el fotograma en que nació y a partir de ahí se le
   dice en qué milisegundo va. */
const RELOJ = `
window.__reloj = window.__reloj || { nacidas: new WeakMap() };
window.__tic = function (f) {
  var paso = 1000 / ${FPS};
  document.getAnimations().forEach(function (a) {
    if (!window.__reloj.nacidas.has(a)) { window.__reloj.nacidas.set(a, f); try { a.pause(); } catch (e) {} }
    var nacio = window.__reloj.nacidas.get(a);
    try { a.currentTime = (f - nacio) * paso; } catch (e) {}
  });
};`;

const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Arranque y frenada suaves: un pulgar no empieza ni para de golpe. */
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

(async () => {
  fs.mkdirSync(DEST, { recursive: true });
  const page = (await get('/json/list')).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval');
    return r.result?.value;
  };

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DSF, mobile: true });

  const guion = require(path.resolve(GUION));
  await send('Page.navigate', { url: BASE + guion.ruta });
  await sleep(4500);
  await ev(`localStorage.clear();
    localStorage.setItem('zhuba.config.v1', ${JSON.stringify(JSON.stringify(CONFIG))});
    localStorage.setItem('zhuba.branch.v1', '"restaurante"');`);
  await send('Page.navigate', { url: BASE + guion.ruta });
  await sleep(5200);
  await ev("document.getElementById('cortina')?.remove()");
  await ev("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')");
  if (guion.preparar) { await ev(guion.preparar); await sleep(guion.esperaPreparar ?? 2600); }
  await sleep(2600);
  await ev(RELOJ);

  console.log(`grabando ${guion.fotogramas} · ${guion.nombre}`);
  for (let i = 0; i < guion.fotogramas; i++) {
    for (const paso of guion.pasos) {
      if (paso.en === i) await ev(paso.js);
      if (paso.desde != null && i >= paso.desde && i <= paso.hasta) {
        const t = suave((i - paso.desde) / (paso.hasta - paso.desde));
        await ev(paso.durante.replace(/\{t\}/g, t.toFixed(5)));
      }
    }
    await ev(`window.__tic(${i})`);
    // Un respiro para que el diseño se asiente antes de la foto: sin esto,
    // el fotograma siguiente a un clic sale a medio pintar.
    if (guion.pasos.some((p) => p.en === i)) await sleep(90);
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
    fs.writeFileSync(path.join(DEST, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(data, 'base64'));
    if (i % 25 === 0) process.stdout.write(`  ${i}\r`);
  }
  console.log(`\n· ${guion.nombre}: ${guion.fotogramas} fotogramas`);
  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
