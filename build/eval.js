/* Evalúa una expresión en la página abierta por CDP y devuelve el resultado.
   uso: node eval.js <url> <w> <h> "<expresión JS>" */
const http = require('http');
const [, , URL_, W = '1440', H = '900', EXPR] = process.argv;
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
  await sleep(4200);
  const r = await send('Runtime.evaluate', { expression: EXPR, returnByValue: true, awaitPromise: true });
  console.log(JSON.stringify(r.result?.value ?? r.exceptionDetails?.exception?.description ?? r, null, 1));
  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
