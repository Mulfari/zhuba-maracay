/* Capturas de viewport (lo que ve el usuario), no de página completa.
   La captura "beyondViewport" expande el viewport y desvirtúa cualquier
   layout dependiente de la altura, así que aquí se hace scroll y se
   fotografía la ventana tal cual.

   uso: node shots.js <url> <prefijo> <w> <h> <sel|px> [más...] [--mobile] [--reduce] */
const fs = require('fs');
const http = require('http');

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const [URL_, PREFIX, W = '1440', H = '900', ...spots] = args.filter((a) => !a.startsWith('--'));
const MOBILE = flags.includes('--mobile');
const REDUCE = flags.includes('--reduce');
const PORT = 9222;

const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const targets = await get('/json/list');
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('sin pestaña');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: +W, height: +H, deviceScaleFactor: 1, mobile: MOBILE
  });
  if (REDUCE) {
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
  }
  await send('Page.navigate', { url: URL_ });
  await sleep(4200);
  await send('Runtime.evaluate', {
    expression: "document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')"
  });
  await sleep(900);

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];
    const expr = spot.startsWith('js:')
      ? spot.slice(3)
      : /^\d+$/.test(spot)
        ? `window.scrollTo(0, ${spot})`
        : `(document.querySelector('${spot}')||document.body).scrollIntoView({block:'start'})`;
    await send('Runtime.evaluate', { expression: expr });
    await sleep(1300);
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const out = `${PREFIX}-${i}.png`;
    fs.writeFileSync(out, Buffer.from(data, 'base64'));
    console.log('wrote', out, spot);
  }
  ws.close();
  process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
