/* Mide cuánto brinca el hero cuando el navegador móvil esconde su barra.
   No se toca el scroll: solo crece el viewport, que es justo lo que pasa al
   deslizar en Chrome de Android.
   uso: node barra.js <url> */
const http = require('http');
const URL_ = process.argv[2] || 'http://localhost:4181/';
const PORT = 9222;

const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LEE = `(() => {
  const y = (el) => {
    if (!el) return null;
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none') return 0;
    const m = new DOMMatrixReadOnly(t);
    return Math.round(m.m42 * 100) / 100;
  };
  // Dónde está cada cosa EN PANTALLA. Si algo salta al esconderse la barra,
  // salta aquí.
  const donde = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top * 10) / 10, alto: Math.round(r.height * 10) / 10 };
  };
  const capas = [document.getElementById('heroGrid'), ...document.querySelectorAll('.hero__col')].filter(Boolean);
  return {
    alto: window.innerHeight,
    scroll: Math.round(window.scrollY),
    p: getComputedStyle(document.querySelector('.hero')).getPropertyValue('--p').trim(),
    capas: capas.map((el) => ({ sel: el.className || el.tagName, y: y(el) })),
    sitios: {
      hero: donde('.hero'),
      titular: donde('.hero h1'),
      panel: donde('.hero__panel'),
      mosaico: donde('.hero__mosaic') || donde('.hero__media'),
      grano: donde('.grain'),
      siguiente: donde('.hero + *'),
      cabecera: donde('.site-header') || donde('header')
    }
  };
})()`;

(async () => {
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
  const metricas = (h) => send('Emulation.setDeviceMetricsOverride',
    { width: 390, height: h, deviceScaleFactor: 2, mobile: true });

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await metricas(844);                       // con la barra del navegador a la vista
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);

  // A media salida del hero, que es donde el paralaje tiene más recorrido.
  await ev("window.scrollTo({top: Math.round(window.innerHeight * 0.45), behavior:'instant'})");
  await sleep(700);
  const antes = await ev(LEE);

  await metricas(900);                       // la barra se esconde: +56 px de viewport
  await sleep(700);
  const despues = await ev(LEE);

  const salto = antes.capas.map((c, i) => ({
    capa: c.sel.slice(0, 34),
    antes: c.y, despues: despues.capas[i]?.y,
    brinco: Math.round(((despues.capas[i]?.y ?? 0) - c.y) * 100) / 100
  }));
  const sitios = {};
  for (const k of Object.keys(antes.sitios)) {
    const a = antes.sitios[k], b = despues.sitios[k];
    if (!a || !b) { sitios[k] = 'no existe'; continue; }
    sitios[k] = `top ${a.top} → ${b.top}  (${Math.round((b.top - a.top) * 10) / 10} px) · alto ${a.alto} → ${b.alto}`;
  }
  console.log(JSON.stringify({
    sitios,
    viewport: `${antes.alto} → ${despues.alto}`,
    scroll: `${antes.scroll} → ${despues.scroll}`,
    p: `${antes.p} → ${despues.p}`,
    salto
  }, null, 1));
  const peor = Math.max(0, ...salto.map((s) => Math.abs(s.brinco)));
  console.log(`brinco máximo: ${peor} px`);
  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
