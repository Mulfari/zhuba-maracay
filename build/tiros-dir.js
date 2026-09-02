/* Captura el autocompletado de la dirección contra el Nominatim de verdad.
   Hace una sola consulta a propósito: el servicio es gratuito y pide respeto.
   uso: node tiros-dir.js <base> <prefijo> [--mobile] */
const fs = require('fs');
const http = require('http');

const args = process.argv.slice(2);
const MOBILE = args.includes('--mobile');
const [BASE, PREFIX] = args.filter((a) => !a.startsWith('--'));
const PORT = 9222;

const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CONFIG = { pagos: {}, anillos: { a1: 2, a2: 3.5, a3: 5, a4: 7 }, maxKm: 12, aviso: '' };

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

  await send('Page.navigate', { url: `${BASE}/pedir.html` });
  await sleep(3800);
  await ev(`localStorage.clear();
    localStorage.setItem('zhuba.config.v1', ${JSON.stringify(JSON.stringify(CONFIG))});
    localStorage.setItem('zhuba.branch.v1', '"restaurante"');`);
  await send('Page.navigate', { url: `${BASE}/pedir.html` });
  await sleep(4200);

  await ev("document.querySelector('[data-open=\"r-fukkatsu\"]').click()");
  await sleep(700);
  await ev("document.querySelector('[data-add]').click()");
  await sleep(600);
  await ev("document.getElementById('cartPill').click()");
  await sleep(800);
  await ev("document.querySelector('[data-siguiente]').click()");
  await sleep(500);
  await ev("document.querySelector('[data-mode=\"delivery\"]').click()");
  await sleep(700);
  await ev(`{ const c=document.querySelector('[data-input="nombre"]');
    c.value='Andrea Pérez'; c.dispatchEvent(new Event('input',{bubbles:true})); }`);
  await sleep(300);

  await ev(`{ const c=document.querySelector('[data-busca-dir]');
    c.focus(); c.value='Avenida Las Delicias';
    c.dispatchEvent(new Event('input',{bubbles:true})); }`);
  await sleep(3000);
  const lista = await ev("({n:document.querySelectorAll('[data-sugerencia]').length, textos:Array.from(document.querySelectorAll('[data-sugerencia]')).slice(0,3).map(b=>b.textContent.replace(/\\s+/g,' ').trim())})");
  console.log(JSON.stringify(lista, null, 1));
  await tirar('sugerencias');

  await ev("document.querySelector('[data-sugerencia=\"0\"]')?.click()");
  await sleep(4000);
  const puesto = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    return { direccion: store.service.fields.direccion, km: store.entrega?.km, envio: store.costeEnvio };
  })()`);
  console.log(JSON.stringify(puesto));
  await ev("document.querySelector('.geo')?.scrollIntoView({block:'center'})");
  await sleep(1400);
  await tirar('elegida');

  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
