/**
 * Capturas de «momentos de interfaz» para herramientas de vídeo: la web real,
 * nítida (x3) y ya recortada a lo que importa, para que nadie tenga que
 * recortar ni buscar el segundo bueno de una grabación.
 *
 * Portada a las 20:30 de Caracas («Abierto ahora»), búsqueda «salmon», ficha
 * de los Coquitos de Salmón con un ajuste, y la entrega a 3,6 km con envío y
 * total. Supabase bloqueado: aquí no se manda ningún pedido.
 *
 * uso: node build/momentos.js <base> <carpeta destino>
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const [BASE, DEST] = process.argv.slice(2);
const DSF = 3;
const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: 9222, path: p }, (r) => {
    let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(DEST, { recursive: true });
  const page = (await get('/json/list')).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval');
    return r.result?.value;
  };
  const foto = async (nombre, caja) => {
    const params = { format: 'png', captureBeyondViewport: false };
    if (caja) params.clip = { x: caja.x, y: caja.y, width: caja.w, height: caja.h, scale: 1 };
    const { data } = await send('Page.captureScreenshot', params);
    fs.writeFileSync(path.join(DEST, nombre), Buffer.from(data, 'base64'));
    console.log('·', nombre, caja ? `${Math.round(caja.w)}×${Math.round(caja.h)} css` : 'pantalla');
  };
  /** Caja de un elemento (o de varios, unidos) con margen, dentro de la pantalla. */
  const caja = (selectores, margen = 12) => ev(`(() => {
    const rs = ${JSON.stringify(selectores)}.map((s) => document.querySelector(s)).filter(Boolean)
      .map((e) => e.getBoundingClientRect());
    if (!rs.length) return null;
    const x = 0, w = innerWidth;
    const y = Math.max(0, Math.min(...rs.map((r) => r.top)) - ${margen});
    const bajo = Math.min(innerHeight, Math.max(...rs.map((r) => r.bottom)) + ${margen});
    return { x, y, w, h: bajo - y };
  })()`);

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['*supabase.co/*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: DSF, mobile: true });

  // 20:30 en Caracas, hoy: el local abierto
  const hoy = new Date(Date.now() - 4 * 3600000).toISOString().slice(0, 10);
  const objetivo = Date.parse(`${hoy}T20:30:00-04:00`);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `(function(){
    var D = Date, delta = ${objetivo} - D.now();
    function F() { return arguments.length ? new (Function.prototype.bind.apply(D, [null].concat([].slice.call(arguments))))() : new D(D.now() + delta); }
    F.now = function(){ return D.now() + delta; }; F.UTC = D.UTC; F.parse = D.parse; F.prototype = D.prototype;
    window.Date = F;
  })();` });

  const abrir = async (ruta) => {
    await send('Page.navigate', { url: BASE + ruta });
    await sleep(5200);
    await ev("document.getElementById('cortina')?.remove(); document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'); 1");
    await sleep(2400);
  };

  // --- portada ---------------------------------------------------------------
  await abrir('/');
  await ev('localStorage.clear(); 1');
  await abrir('/');
  await foto('portada.png');

  // --- búsqueda --------------------------------------------------------------
  await abrir('/pedir');
  await ev(`document.querySelector('#sedes .venue-pill[data-branch="restaurante"]')?.click();
    navigator.geolocation.getCurrentPosition = function (ok) {
      ok({ coords: { latitude: 10.2442, longitude: -67.6069, accuracy: 18 } }); };
    var i = document.getElementById('buscar'); i.value = 'salmon';
    i.dispatchEvent(new Event('input', { bubbles: true })); window.scrollTo(0, 0); 1`);
  await sleep(1600);
  const filaCoquitos = await ev(`(() => {
    const f = [...document.querySelectorAll('.row')].find((r) => /Coquitos de Salm/.test(r.textContent));
    return f ? Math.round(f.getBoundingClientRect().bottom) : null; })()`);
  await foto('buscador.png', { x: 0, y: 0, w: 390, h: Math.min(844, (filaCoquitos || 440) + 14) });

  // --- la ficha del plato con un ajuste ---------------------------------------
  await ev(`(() => { const f = [...document.querySelectorAll('.row')].find((r) => /Coquitos de Salm/.test(r.textContent));
    f.querySelector('.row__add').click(); })()`);
  await sleep(1400);
  await ev("document.querySelectorAll('.modal.is-open [data-adj]')[1]?.click(); 1");
  await sleep(900);
  await foto('plato.png');

  // --- entrega: ubicación, envío y total -----------------------------------------
  await ev("document.querySelector('.modal.is-open .btn--solid')?.click(); 1");
  await sleep(1200);
  await ev("document.getElementById('cartPill').click(); 1");
  await sleep(1200);
  await ev("document.querySelector('[data-siguiente]')?.click(); 1");
  await sleep(1000);
  await ev("document.querySelector('[data-mode=\"delivery\"]')?.click(); 1");
  await sleep(1000);
  await ev(`(function(){ var el = document.querySelector('[data-input="nombre"]');
    if (el) { el.value = 'Ana'; el.dispatchEvent(new Event('input', { bubbles: true })); } return 1; })()`);
  await sleep(500);
  await ev("document.querySelector('[data-geo]')?.click(); 1");
  await sleep(7500);     // teselas del mapa y la dirección de Nominatim
  await ev("document.querySelector('.geo')?.scrollIntoView({ block: 'start' }); 1");
  await sleep(1800);
  await foto('envio.png', await caja(['.geo__mapa', '.geo__datos', '.geo__dir']));
  await foto('total.png', await caja(['.drawer__foot .totals'], 16));
  await foto('cajon-entrega.png');

  await send('Emulation.clearDeviceMetricsOverride');
  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
