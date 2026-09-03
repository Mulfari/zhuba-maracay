/* Fotografía la carga en frío, con la red frenada, para ver qué se ve y en
   qué orden. Es la única forma de saber qué hay que suavizar.
   uso: node carga.js <url> <prefijo> [--mobile] [--rapido] */
const fs = require('fs');
const http = require('http');

const args = process.argv.slice(2);
const MOBILE = args.includes('--mobile');
const RAPIDO = args.includes('--rapido');
const [URL_, PREFIX] = args.filter((a) => !a.startsWith('--'));
const PORT = 9222;
const INSTANTES = (process.env.INSTANTES || '200,500,900,1400,2200,3200,4500').split(',').map(Number);

const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const page = (await get('/json/list')).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const hitos = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === 'Page.loadEventFired') hitos.push('load');
    if (m.method === 'Page.domContentEventFired') hitos.push('dom');
  });
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
  });

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Network.enable');
  await send('Network.clearBrowserCache');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  if (!RAPIDO) {
    // 4G lenta: es la red de un teléfono en la calle, no la de una oficina.
    await send('Network.emulateNetworkConditions', {
      offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8,
      uploadThroughput: 750 * 1024 / 8
    });
    await send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  await send('Emulation.setDeviceMetricsOverride', MOBILE
    ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
    : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  await send('Page.navigate', { url: 'about:blank' });
  await sleep(400);
  const t0 = Date.now();
  send('Page.navigate', { url: URL_ });

  for (const ms of INSTANTES) {
    const espera = ms - (Date.now() - t0);
    if (espera > 0) await sleep(espera);
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 });
    fs.writeFileSync(`${PREFIX}-${String(ms).padStart(4, '0')}ms.jpg`, Buffer.from(data, 'base64'));
    console.log(`${ms}ms`);
  }
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await send('Network.setCacheDisabled', { cacheDisabled: false });
  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
