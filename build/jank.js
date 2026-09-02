/* Mide la fluidez real del scroll: hace un barrido programado y cronometra
   cada fotograma. Devuelve cuántos se pasan del presupuesto y el peor.
   uso: node jank.js <url> <w> <h> ["<expresión previa>"] */
const http = require('http');
const [, , URL_, W = '1440', H = '900', PRE = ''] = process.argv;
const PORT = 9222;

const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const page = (await get('/json/list')).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'error');
    return r.result?.value;
  };

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
  // 4x de ralentización: así se ven los problemas que en este equipo se esconden
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);
  if (PRE) await ev(PRE);
  await sleep(600);

  const out = await ev(`(async () => {
    const marcas = [];
    let ultimo = performance.now();
    let seguir = true;
    function medir(t) { marcas.push(t - ultimo); ultimo = t; if (seguir) requestAnimationFrame(medir); }
    requestAnimationFrame((t) => { ultimo = t; requestAnimationFrame(medir); });

    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
    marcas.length = 0;
    // barrido de ~2.400 px en pasos pequeños, como una rueda de ratón
    for (let i = 0; i < 120; i++) {
      window.scrollBy(0, 20);
      await new Promise((r) => requestAnimationFrame(r));
    }
    await new Promise((r) => setTimeout(r, 300));
    seguir = false;

    const xs = marcas.filter((d) => d > 0).sort((a, b) => a - b);
    const pct = (q) => xs[Math.min(xs.length - 1, Math.floor(xs.length * q))];
    return {
      fotogramas: xs.length,
      mediana: +pct(0.5).toFixed(1),
      p95: +pct(0.95).toFixed(1),
      peor: +xs[xs.length - 1].toFixed(1),
      largos_33ms: xs.filter((d) => d > 33).length,
      largos_50ms: xs.filter((d) => d > 50).length
    };
  })()`);

  console.log(JSON.stringify(out));
  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
