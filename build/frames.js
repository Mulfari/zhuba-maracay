/* Dispara una acción y fotografía la pantalla en instantes concretos, para
   poder ver una transición en imágenes fijas.
   uso: node frames.js <url> <prefijo> <w> <h> "<acción>" <ms,ms,ms> */
const fs = require('fs');
const http = require('http');
const [, , URL_, PREFIX, W = '1440', H = '900', ACCION = '', MSS = '120,300,800'] = process.argv;
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

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);

  const marcas = MSS.split(',').map(Number);
  await send('Runtime.evaluate', { expression: ACCION });
  let transcurrido = 0;
  for (let i = 0; i < marcas.length; i++) {
    await sleep(Math.max(0, marcas[i] - transcurrido));
    transcurrido = marcas[i];
    const t0 = Date.now();
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${PREFIX}-${i}.png`, Buffer.from(data, 'base64'));
    transcurrido += Date.now() - t0;
    console.log('wrote', `${PREFIX}-${i}.png`, 'a los ~' + marcas[i] + ' ms');
  }
  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
