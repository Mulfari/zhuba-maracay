/**
 * Auditoría de móvil: mide lo que suele romperse en un teléfono y que no se
 * ve en el escritorio.
 *
 *  · desborde horizontal (la página se mueve de lado)
 *  · objetivos táctiles por debajo de 40 px (el dedo falla)
 *  · texto por debajo de 11 px
 *  · campos con letra menor de 16 px: iOS hace zoom solo al tocarlos
 *  · peso descargado y número de peticiones
 *
 * uso: node movil.js <url> <ancho> <alto> ["<js previo>"]
 */
const http = require('http');

const [, , URL_, W = '390', H = '844', PREP = ''] = process.argv;
const PORT = 9222;

const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const AUDITORIA = `(() => {
  const vw = window.innerWidth;
  const nombre = (el) => {
    const cls = (typeof el.className === 'string' ? el.className : '').split(' ').filter(Boolean).slice(0, 2).join('.');
    return (el.tagName.toLowerCase() + (cls ? '.' + cls : '')).slice(0, 44);
  };
  const seVe = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && Number(s.opacity) > 0.05;
  };
  const todos = Array.from(document.querySelectorAll('body *')).filter(seVe);

  const desborda = todos
    .filter((el) => { const r = el.getBoundingClientRect(); return r.right > vw + 1 || r.left < -1; })
    .map((el) => { const r = el.getBoundingClientRect(); return { el: nombre(el), izq: Math.round(r.left), der: Math.round(r.right) }; })
    .slice(0, 10);

  const tocables = Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]'))
    .filter(seVe)
    .map((el) => { const r = el.getBoundingClientRect(); return {
      el: nombre(el), ancho: Math.round(r.width), alto: Math.round(r.height),
      txt: (el.textContent || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 26) }; });
  const chicos = tocables.filter((t) => t.alto < 40 || t.ancho < 40);

  const textoChico = todos
    .filter((el) => !el.children.length && el.textContent.trim())
    .map((el) => ({ px: Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10,
                    txt: el.textContent.replace(/\\s+/g, ' ').trim().slice(0, 28) }))
    .filter((x) => x.px < 11).slice(0, 8);

  const campos = Array.from(document.querySelectorAll('input, textarea, select')).filter(seVe)
    .map((el) => ({ campo: el.id || el.type || el.tagName, px: Math.round(parseFloat(getComputedStyle(el).fontSize)) }))
    .filter((x) => x.px < 16);

  const rec = performance.getEntriesByType('resource');
  return {
    viewport: vw + 'x' + window.innerHeight,
    desbordeHorizontal: document.documentElement.scrollWidth > vw + 1,
    desborda,
    tocables: tocables.length,
    chicos: chicos.slice(0, 14),
    textoChico,
    camposConZoomIOS: campos,
    pesoKB: Math.round(rec.reduce((n, r) => n + (r.transferSize || 0), 0) / 1024),
    peticiones: rec.length,
    altoPagina: document.body.scrollHeight
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

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',
    { width: Number(W), height: Number(H), deviceScaleFactor: 2, mobile: true });
  // Sin esto `pointer: coarse` no resuelve y las reglas del teléfono no se
  // aplican: la auditoría mediría una pantalla pequeña con ratón.
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
  await send('Page.navigate', { url: URL_ });
  await sleep(5200);
  if (PREP) { await ev(PREP); await sleep(2600); }
  console.log(JSON.stringify(await ev(AUDITORIA), null, 1));
  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
