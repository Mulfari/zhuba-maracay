/* Capturas del panel del local: métricas, cocina y la sección de cobro y envío.
   uso: node tiros-admin.js <base> <prefijo> [--mobile] */
const fs = require('fs');
const http = require('http');

const args = process.argv.slice(2);
const MOBILE = args.includes('--mobile');
const CONSERVAR = args.includes('--conservar');   // deja los pedidos que ya hay
const [BASE, PREFIX] = args.filter((a) => !a.startsWith('--'));
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
  let n = 0;
  const tirar = async (nombre) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const out = `${PREFIX}-${n++}-${nombre}.png`;
    fs.writeFileSync(out, Buffer.from(data, 'base64'));
    console.log('wrote', out);
  };

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', MOBILE
    ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
    : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  await send('Page.navigate', { url: `${BASE}/admin/` });
  await sleep(3800);
  if (!CONSERVAR) await ev("localStorage.clear()");
  await ev("sessionStorage.clear()");
  await send('Page.navigate', { url: `${BASE}/admin/` });
  await sleep(3800);
  await tirar('acceso');

  await ev(`document.getElementById('pin').value='1108';
    document.getElementById('gateForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));`);
  await sleep(1500);
  await tirar('panel');

  await ev("document.getElementById('cobro')?.scrollIntoView({block:'start'})");
  await sleep(900);
  await tirar('cobro');
  await ev("document.querySelector('#anillos')?.scrollIntoView({block:'center'})");
  await sleep(800);
  await tirar('envios');

  const estado = await ev(`({
    tasa: document.querySelector('#tasaEstado')?.textContent.replace(/\\s+/g,' ').trim() || '',
    metodos: document.querySelectorAll('#metodos .metodo').length,
    anillos: document.querySelectorAll('[data-anillo]').length,
    maxKm: document.querySelector('#maxKm')?.value ?? null,
    aviso: document.querySelector('#aviso') ? 'sí' : 'no'
  })`);
  console.log(JSON.stringify(estado, null, 1));

  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
