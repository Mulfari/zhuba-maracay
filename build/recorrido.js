/* El recorrido de un cliente, en un teléfono, sobre producción. Además de
   que cada paso funcione, comprueba que el control que hay que tocar esté
   dentro de la pantalla en ese momento: en el escritorio siempre lo está. */
const http = require('http');
const BASE = process.argv[2] || 'https://zhuba-maracay.vercel.app';
const [W, H] = (process.argv[3] || '390x844').split('x').map(Number);
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
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) return { ERROR: r.exceptionDetails.exception?.description?.split('\n')[0] };
    return r.result?.value;
  };
  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  // Estas pruebas mandan pedidos de mentira. Con el registro compartido
  // conectado acabarían en el informe real del negocio: se corta el paso a
  // Supabase para esta pestaña, y el apunte falla en silencio como está
  // hecho para fallar.
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['*supabase.co/*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Browser.grantPermissions', { origin: BASE, permissions: ['geolocation'] });
  await send('Emulation.setGeolocationOverride', { latitude: 10.2442, longitude: -67.6069, accuracy: 20 });

  const pasos = [];
  const paso = (n, ok, detalle) => {
    pasos.push({ n, ok: !!ok });
    console.log((ok ? 'OK   ' : 'FALLA ') + n + (ok ? '' : '  -> ' + JSON.stringify(detalle)));
  };

  const TOCAR = 'window.__tocar = (sel, texto) => {' +
    ' const els = [...document.querySelectorAll(sel)];' +
    ' const el = texto ? els.find((e) => e.textContent.includes(texto)) : els[0];' +
    ' if (!el) return { hallado: false };' +
    ' const r = el.getBoundingClientRect();' +
    ' const aLaVista = r.top >= -1 && r.bottom <= innerHeight + 1 && r.left >= -1 && r.right <= innerWidth + 1;' +
    ' el.click();' +
    ' return { hallado: true, aLaVista, caja: [Math.round(r.top), Math.round(r.bottom)], alto: innerHeight };' +
    '};';

  await send('Page.navigate', { url: BASE + '/' }); await sleep(4500);
  await ev('localStorage.clear()');
  await send('Page.navigate', { url: BASE + '/' }); await sleep(4500);
  await ev(TOCAR);
  const t1 = await ev('__tocar("a.btn", "Pedir en línea")');
  paso('desde la portada se llega al pedido con el pulgar', t1.hallado && t1.aLaVista, t1);
  await sleep(4800);

  await ev(TOCAR);
  const buscado = await ev(`(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const i = document.querySelector('#buscar');
    i.focus(); i.value = 'salmon'; i.dispatchEvent(new Event('input', { bubbles: true }));
    await w(900);
    const filas = [...document.querySelectorAll('.row')].filter((f) => f.getBoundingClientRect().height > 0);
    return { n: filas.length, primero: (filas[0] || {}).textContent ? filas[0].textContent.trim().slice(0, 20) : '',
             barra: Math.round(document.querySelector('.ped-pegado').getBoundingClientRect().top) };
  })()`);
  paso('buscar «salmon» sin acento encuentra platos', buscado.n > 0 && buscado.n < 63, buscado);

  await ev('__tocar(".row__add")'); await sleep(1300);
  const modal = await ev(`(() => {
    const m = document.querySelector('.modal.is-open');
    if (!m) return { abierto: false };
    const b = m.querySelector('.btn--solid');
    const r = b.getBoundingClientRect();
    return { abierto: true, boton: b.textContent.trim().slice(0, 18),
             aLaVista: r.bottom <= innerHeight + 1, caja: [Math.round(r.top), Math.round(r.bottom)], alto: innerHeight };
  })()`);
  paso('el plato abre sus opciones y el botón de añadir queda a la vista',
    modal.abierto && modal.aLaVista, modal);

  await ev(TOCAR);
  await ev('__tocar(".modal.is-open .btn--solid")'); await sleep(1000);
  const t3 = await ev('__tocar("#cartPill")'); await sleep(1200);
  paso('la pastilla del pedido abre el cajón', t3.hallado && t3.aLaVista, t3);

  const t4 = await ev('__tocar("[data-siguiente]")'); await sleep(1300);
  paso('«Continuar» está a la vista sin rebuscar', t4.hallado && t4.aLaVista, t4);

  const entrega = await ev(`(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const dl = [...document.querySelectorAll('.svc button')].find((b) => /deliv/i.test(b.textContent));
    if (dl) dl.click(); await w(900);
    const n = document.querySelector('#f-nombre');
    if (n) { n.value = 'Prueba'; n.dispatchEvent(new Event('input', { bubbles: true })); }
    navigator.geolocation.getCurrentPosition = (ok) =>
      ok({ coords: { latitude: 10.2442, longitude: -67.6069, accuracy: 18 } });
    const geo = document.querySelector('[data-geo]');
    if (geo) geo.click(); await w(5600);
    const mapa = document.querySelector('.leaflet-container');
    const dir = document.querySelector('#f-direccion');
    const sig = document.querySelector('[data-siguiente]');
    const r = sig ? sig.getBoundingClientRect() : null;
    return { direccion: (dir && dir.value ? dir.value : '').slice(0, 44), mapa: !!mapa,
             mapaAlto: mapa ? Math.round(mapa.getBoundingClientRect().height) : 0,
             pin: !!document.querySelector('.leaflet-marker-icon, .pin'),
             totales: (document.querySelector('.totals') || {}).textContent
               ? document.querySelector('.totals').textContent.replace(/\\s+/g, ' ').slice(0, 80) : '',
             siguienteVisible: r ? r.bottom <= innerHeight + 1 : null };
  })()`);
  paso('la ubicación rellena la dirección y pone la chincheta en el mapa',
    entrega.direccion.length > 6 && entrega.mapa && entrega.pin, entrega);
  paso('el mapa cabe en el cajón y «Continuar» sigue a la vista',
    entrega.mapaAlto > 90 && entrega.siguienteVisible, entrega);

  await ev(TOCAR);
  await ev('__tocar("[data-siguiente]")'); await sleep(1300);
  const pago = await ev(`(() => {
    const env = document.querySelector('[data-enviar]');
    const r = env ? env.getBoundingClientRect() : null;
    return { falta: (document.querySelector('.falta') || {}).textContent || '',
             cuerpo: document.querySelector('.drawer__body').innerHTML
               .replace(/<svg[\\s\\S]*?<\\/svg>/g, '').replace(/\\s+/g, ' ').slice(0, 420),
             metodos: [...document.querySelectorAll('.pay button, [data-metodo], [data-pago]')].map((b) => b.textContent.trim().slice(0, 12)),
             hayEnviar: !!env, texto: env ? env.textContent.trim().slice(0, 34) : '',
             visible: r ? r.bottom <= innerHeight + 1 : null,
             caja: r ? [Math.round(r.top), Math.round(r.bottom)] : null, alto: innerHeight };
  })()`);
  paso('el paso del pago ofrece método y el botón de enviar cabe en pantalla',
    pago.hayEnviar && pago.visible, pago);
  console.log('   paso de pago:', JSON.stringify(pago).slice(0, 600));

  const salida = await ev(`(async () => {
    let abierto = '';
    const real = window.open;
    window.open = (u) => { abierto = u; return { closed: false }; };
    const boton = document.querySelector('[data-enviar]');
    const bloqueado = boton.disabled;
    boton.click();
    await new Promise((r) => setTimeout(r, 1200));
    window.open = real;
    const t = decodeURIComponent((abierto.split('text=')[1] || ''));
    if (bloqueado) return { bloqueado, wa: false, lleva: {}, muestra: '' };
    return { wa: abierto.indexOf('https://wa.me/') === 0, largo: t.length,
             lleva: { plato: /almón|almon/.test(t), bs: /Bs/.test(t), mapa: /maps/.test(t), total: /Total/i.test(t) },
             muestra: t.slice(0, 900) };
  })()`);
  paso('el mensaje sale a WhatsApp con el pedido escrito',
    salida.wa && salida.lleva.bs && salida.lleva.total, salida);
  console.log('\n--- mensaje que recibe el negocio ---\n' + (salida.muestra || ''));

  const mal = pasos.filter((p) => !p.ok).length;
  console.log('\n' + (pasos.length - mal) + '/' + pasos.length + ' pasos del recorrido en ' + W + 'x' + H);
  ws.close(); process.exit(mal ? 1 : 0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
