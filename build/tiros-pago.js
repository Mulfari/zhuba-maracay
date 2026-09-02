/* Capturas de los tres pasos del pedido, con el local ya configurado.
   uso: node tiros-pago.js <base> <prefijo> [--mobile] */
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

/* Lo que el restaurante habría rellenado en /admin. Sólo vive en el navegador
   de prueba: no se guarda nada de esto en el repositorio. */
const CONFIG = {
  pagos: {
    'pago-movil': { banco: 'Banesco · 0134', telefono: '0412-455 42 07', documento: 'J-40123456-7' },
    transferencia: { banco: 'Banesco · 0134', numero: '0134 0000 0000 0000 0000', titular: 'Inversiones ZHUBA C.A.', documento: 'J-40123456-7' }
  },
  anillos: { a1: 2, a2: 3.5, a3: 5, a4: 7 },
  maxKm: 12,
  aviso: ''
};

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
  await sleep(4000);
  await ev(`localStorage.clear();
    localStorage.setItem('zhuba.config.v1', ${JSON.stringify(JSON.stringify(CONFIG))});
    localStorage.setItem('zhuba.branch.v1', '"restaurante"');`);
  await send('Page.navigate', { url: `${BASE}/pedir.html` });
  await sleep(4200);
  await ev("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')");
  await sleep(1200);
  await tirar('carta');

  await ev("document.querySelector('[data-open=\"r-fukkatsu\"]').click()");
  await sleep(900);
  await tirar('plato');
  await ev("document.querySelector('[data-add]').click()");
  await sleep(600);
  await ev("document.querySelector('[data-open=\"r-gyozas\"]')?.click()");
  await sleep(800);
  await ev("document.querySelector('[data-add]')?.click()");
  await sleep(700);

  await ev("document.getElementById('cartPill').click()");
  await sleep(1100);
  await tirar('paso1-comanda');

  await ev("document.querySelector('[data-siguiente]').click()");
  await sleep(600);
  await ev("document.querySelector('[data-mode=\"delivery\"]').click()");
  await sleep(700);
  await ev(`const set=(i,v)=>{const el=document.querySelector('[data-input="'+i+'"]');
    if(el){el.value=v; el.dispatchEvent(new Event('input',{bubbles:true}));}};
    set('nombre','Andrea Pérez'); set('direccion','Av. Bolívar, Res. Aragua, piso 4');
    set('referencia','Frente a la panadería');`);
  await sleep(600);
  await tirar('paso2-entrega');

  await ev(`(async()=>{const {store}=await import(new URL('js/store.js', location.href).href);
    store.setEntrega(10.2755, -67.5910, 'Urb. La Floresta, Maracay');})()`);
  await sleep(2600);
  await ev("document.querySelector('.geo')?.scrollIntoView({block:'center'})");
  await sleep(1400);
  await tirar('paso2-mapa');

  // El mapa de cerca: es donde se ve si las teselas y los marcadores cuadran.
  const caja = await ev("(()=>{const m=document.querySelector('#geoMapa');if(!m)return null;const r=m.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};})()");
  if (caja) {
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { ...caja, scale: 3 } });
    fs.writeFileSync(`${PREFIX}-mapa-cerca.png`, Buffer.from(data, 'base64'));
    console.log('wrote', `${PREFIX}-mapa-cerca.png`);
  }

  await ev("document.querySelector('[data-siguiente]').click()");
  await sleep(700);
  await tirar('paso3-pago');
  await ev("document.querySelector('[data-metodo=\"pago-movil\"]').click()");
  await sleep(800);
  await ev("document.querySelector('.datos-pago')?.scrollIntoView({block:'center'})");
  await sleep(700);
  await tirar('paso3-datos');

  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
