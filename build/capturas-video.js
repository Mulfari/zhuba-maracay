/* Captura los estados reales del sitio para el vídeo de Remotion.
   Nada de maquetas: son fotogramas de https://zhuba-maracay.vercel.app tal
   como se ven en un teléfono, más el ticket que genera el propio código.
   uso: node capturas-video.js <base> <carpeta destino> */
const fs = require('fs');
const path = require('path');
const http = require('http');

const [BASE, DEST] = process.argv.slice(2);
const PORT = 9222;
const W = 390, H = 844, DSF = 3;

/* Lo que el restaurante habría publicado en /admin. En el vídeo hacen falta
   para que el paso de pago no salga vacío. Van marcados como demostración. */
const CONFIG = {
  pagos: {
    'pago-movil': { banco: 'Banesco · 0134', telefono: '0412-455 42 07', documento: 'J-40123456-7' }
  },
  anillos: { a1: 2, a2: 3.5, a3: 5, a4: 7 },
  maxKm: 12, aviso: ''
};

const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(DEST, { recursive: true });
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
  const tirar = async (nombre, clip) => {
    const { data } = await send('Page.captureScreenshot',
      clip ? { format: 'png', clip, captureBeyondViewport: true } : { format: 'png' });
    const f = path.join(DEST, `${nombre}.png`);
    fs.writeFileSync(f, Buffer.from(data, 'base64'));
    console.log('·', nombre);
  };
  const abrir = async (ruta) => { await send('Page.navigate', { url: BASE + ruta }); await sleep(4200); };
  const listas = () => ev("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')");

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DSF, mobile: true });

  /* ------------------------------------------------------------- portada */
  await abrir('/');
  await ev(`localStorage.clear();
    localStorage.setItem('zhuba.config.v1', ${JSON.stringify(JSON.stringify(CONFIG))});
    localStorage.setItem('zhuba.branch.v1', '"restaurante"');`);
  await abrir('/');
  await ev("document.getElementById('cortina')?.remove()");
  await listas(); await sleep(2200);
  await tirar('01-hero-restaurante');

  await ev("document.querySelector('.hero__panel .venue-pill[data-branch=\"cafe\"]')?.click()");
  await sleep(1800); await listas(); await sleep(1200);
  await tirar('02-hero-cafe');

  /* --------------------------------------------------------------- carta */
  await abrir('/pedir');
  await ev("document.getElementById('cortina')?.remove()");
  await ev("document.querySelector('#sedes .venue-pill[data-branch=\"restaurante\"]')?.click()");
  await sleep(1200); await listas(); await sleep(2500);
  await tirar('03-carta');
  // Tira larga para poder desplazarla de verdad en el vídeo.
  await tirar('04-carta-tira', { x: 0, y: 0, width: W, height: 2100, scale: DSF });

  /* ---------------------------------------------------------- el plato */
  await ev("document.querySelector('[data-open=\"r-fukkatsu\"]').click()");
  await sleep(1400);
  await tirar('05-plato');
  await ev(`const a=document.querySelectorAll('[data-adj]'); a[1]?.click(); a[3]?.click();`);
  await sleep(700);
  await ev("document.querySelector('.modal__body').scrollTop = 420");
  await sleep(900);
  await tirar('06-plato-ajustes');

  await ev("document.querySelector('[data-add]').click()");
  await sleep(1400);
  await tirar('07-pill');

  /* -------------------------------------------------------------- pedido */
  await ev("document.getElementById('cartPill').click()");
  await sleep(1500);
  await tirar('08-pedido');

  await ev("document.querySelector('[data-siguiente]').click()");
  await sleep(800);
  await ev("document.querySelector('[data-mode=\"delivery\"]').click()");
  await sleep(900);
  await ev(`{const set=(i,v)=>{const el=document.querySelector('[data-input="'+i+'"]');
    if(el){el.value=v; el.dispatchEvent(new Event('input',{bubbles:true}));}};
    set('nombre','Andrea Pérez'); set('direccion','Av. Las Delicias, Res. Aragua, piso 4');}`);
  await sleep(700);
  await ev(`(async()=>{const {store}=await import(new URL('js/store.js', location.href).href);
    store.setEntrega(10.2759, -67.5763, 'Avenida Las Delicias, Andrés Bello, Maracay');})()`);
  await sleep(3200);
  await ev("document.querySelector('.geo')?.scrollIntoView({block:'center'})");
  await sleep(1200);
  await tirar('09-entrega');

  await ev("document.querySelector('[data-siguiente]').click()");
  await sleep(900);
  await ev("document.querySelector('[data-metodo=\"pago-movil\"]')?.click()");
  await sleep(900);
  await ev(`{const r=document.querySelector('[data-pago="referencia"]'); if(r){r.value='004821'; r.dispatchEvent(new Event('input',{bubbles:true}));}
    const t=document.querySelector('[data-pago="telefono"]'); if(t){t.value='0412-111 22 33'; t.dispatchEvent(new Event('input',{bubbles:true}));}}`);
  await sleep(900);
  await ev("document.querySelector('.drawer__body').scrollTop = document.querySelector('.drawer__body').scrollHeight");
  await sleep(800);
  await tirar('10-pago');

  /* ------------------------------- el ticket que se manda, del propio código */
  const ticket = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    const {buildTicket}=await import(new URL('js/ticket.js', location.href).href);
    const pago = { metodo:'Pago móvil', metodoId:'pago-movil', referencia:'004821',
      telefono:'0412-111 22 33', conComprobante:true, enBs: store.aBs(store.total), tasa: store.tasa };
    return { texto: buildTicket(store, { pago, entrega: store.entrega, envio: store.costeEnvio,
      total: store.total, id: 'D4K7QA' }), total: store.total, enBs: store.aBs(store.total),
      tasa: store.tasa?.valor ?? null, telefono: store.branch.phone };
  })()`);
  fs.writeFileSync(path.join(DEST, 'ticket.json'), JSON.stringify(ticket, null, 2));
  console.log('· ticket.json');

  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
