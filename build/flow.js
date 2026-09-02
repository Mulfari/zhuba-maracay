/* Recorrido funcional de las dos páginas, vía CDP.
   uso: node flow.js <base>   (p. ej. http://localhost:4181 o la URL de producción) */
const http = require('http');
const BASE = (process.argv[2] || 'http://localhost:4181').replace(/\/$/, '');
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
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval error');
    return r.result?.value;
  };
  const ir = async (ruta) => { await send('Page.navigate', { url: BASE + ruta }); await sleep(4200); };

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  const out = [];
  const check = (name, ok, detail = '') => { out.push({ name, ok: !!ok, detail }); };

  /* ============================================================ portada */
  await ir('/');
  await ev('localStorage.clear()');
  await ir('/');

  const portada = await ev(`({
    fichas: document.querySelectorAll('.card').length,
    categorias: document.querySelectorAll('.cat').length,
    sinComanda: !document.querySelector('.cart-pill') && !document.querySelector('.drawer'),
    caminos: document.querySelectorAll('a[href^="pedir"]').length
  })`);
  check('la portada muestra la carta completa', portada.fichas > 50 && portada.categorias === 8, JSON.stringify(portada));
  check('la portada ya no lleva comanda', portada.sinComanda, JSON.stringify(portada));
  check('desde la portada hay varios caminos al pedido', portada.caminos >= 4, `${portada.caminos} enlaces`);

  await ev("document.querySelector('[data-open=\"r-sashimi\"]').click()");
  await sleep(600);
  const ficha = await ev(`({
    abierta: document.getElementById('modal').classList.contains('is-open'),
    precios: document.querySelectorAll('.ficha-lista li').length,
    sinAnadir: !document.querySelector('[data-add]'),
    enlace: document.querySelector('.modal__foot a')?.getAttribute('href') || ''
  })`);
  check('la ficha informa y remite al pedido, sin añadir',
    ficha.abierta && ficha.precios === 5 && ficha.sinAnadir && ficha.enlace.includes('plato=r-sashimi'),
    JSON.stringify(ficha));

  /* ====================================================== pedido en línea */
  await ir('/pedir.html');
  const lista = await ev(`({
    filas: document.querySelectorAll('.row').length,
    categorias: document.querySelectorAll('.cat').length,
    buscador: !!document.getElementById('buscar'),
    sinRecuadroVacio: document.querySelectorAll('.card__figure--empty').length === 0
  })`);
  check('la página de pedidos lista los platos en filas',
    lista.filas > 50 && lista.categorias === 8 && lista.buscador && lista.sinRecuadroVacio, JSON.stringify(lista));

  await ev("const b=document.getElementById('buscar'); b.value='salmón'; b.dispatchEvent(new Event('input'))");
  await sleep(400);
  const busca = await ev("({resultados: document.querySelectorAll('.row').length, hayIndice: !document.getElementById('indice').parentElement.hidden})");
  check('el buscador filtra la carta', busca.resultados > 3 && busca.resultados < 40 && !busca.hayIndice, JSON.stringify(busca));
  await ev("document.getElementById('buscarBorrar').click()");
  await sleep(400);

  await ev("document.querySelector('[data-open=\"r-sashimi\"]').click()");
  await sleep(600);
  const modal = await ev(`({
    open: document.getElementById('modal').classList.contains('is-open'),
    variants: document.querySelectorAll('[data-variant]').length,
    adj: document.querySelectorAll('[data-adj]').length,
    pair: !!document.querySelector('[data-pair]')
  })`);
  check('el modal trae variantes, ajustes y maridaje',
    modal.open && modal.variants === 5 && modal.adj > 3 && modal.pair, JSON.stringify(modal));

  await ev("document.querySelectorAll('[data-variant]')[4].click()");
  await sleep(200);
  check('el precio sigue a la variante elegida',
    (await ev("document.getElementById('modalTotal').textContent")).includes('18,00'));

  await ev("document.querySelectorAll('[data-adj]')[0].click(); document.querySelectorAll('[data-adj]')[3].click(); document.querySelector('[data-pair]').click(); document.getElementById('kitchenNote').value='Sin sésamo, por favor';");
  await sleep(200);
  check('el maridaje suma al total',
    (await ev("document.getElementById('modalTotal').textContent")).includes('27,50'));

  await ev("document.querySelectorAll('[data-qty]')[1].click()");
  await sleep(150);
  check('la cantidad multiplica el plato, no el maridaje',
    (await ev("document.getElementById('modalTotal').textContent")).includes('45,50'));

  await ev("document.querySelector('[data-add]').click()");
  await sleep(500);
  const cart = await ev("({count:document.getElementById('cartCount').textContent, visible:document.getElementById('cartPill').classList.contains('is-visible')})");
  check('la barra de comanda marca 3 ítems', cart.count === '3' && cart.visible, JSON.stringify(cart));

  await ev("document.getElementById('cartPill').click()");
  await sleep(600);
  const drawer = await ev("({lines:document.querySelectorAll('.line').length, mods:document.querySelector('.line__mods').textContent.replace(/\\s+/g,' ').trim(), note:document.querySelector('.line__note')?.textContent.trim(), upsell:document.querySelectorAll('[data-quick]').length, svc:document.querySelectorAll('[data-mode]').length})");
  check('el cajón lleva líneas, modificadores, nota y upsell',
    drawer.lines === 2 && drawer.mods.includes('Eel') && drawer.note.includes('sésamo') && drawer.upsell > 3 && drawer.svc === 3,
    JSON.stringify(drawer));

  await ev("document.querySelector('[data-mode=\"delivery\"]').click()");
  await sleep(400);
  await ev("document.querySelector('[data-checkout]').click()");
  await sleep(400);
  const blocked = await ev("({bad:document.querySelectorAll('.field.is-bad').length, orders:JSON.parse(localStorage.getItem('zhuba.orders.v1')||'[]').length})");
  check('el envío se bloquea si faltan datos', blocked.bad >= 2 && blocked.orders === 0, JSON.stringify(blocked));

  await ev(`
    const set=(id,v)=>{const el=document.querySelector('[data-input="'+id+'"]');
      el.value=v; el.dispatchEvent(new Event('input',{bubbles:true}));};
    set('nombre','Andrea'); set('zona','Las Delicias'); set('direccion','Av. Bolívar, Res. Aragua, piso 4');
    set('referencia','Frente a la panadería'); set('_note','Sin cubiertos, gracias');
  `);
  await sleep(300);
  const ticket = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    const {buildTicket, whatsappLink}=await import(new URL('js/ticket.js', location.href).href);
    return {txt:buildTicket(store), link:whatsappLink(store)};
  })()`);
  check('el ticket lleva sede, servicio, datos, líneas y total',
    ticket.txt.includes('ZHUBA Restaurant') && ticket.txt.includes('Delivery') &&
    ticket.txt.includes('Andrea') && ticket.txt.includes('Las Delicias') &&
    ticket.txt.includes('Eel (anguila)') && ticket.txt.includes('Sin sésamo') && ticket.txt.includes('TOTAL'));
  check('el enlace apunta al WhatsApp de la sede y va codificado',
    ticket.link.startsWith('https://wa.me/584124554207?text=') && ticket.link.length > 300 && !/\s/.test(ticket.link),
    ticket.link.slice(0, 70));

  await ev("document.getElementById('drawerClose').click()");
  await sleep(400);
  await ev("document.querySelector('#sedes .venue-pill[data-branch=\"cafe\"]').click()");
  await sleep(900);
  const cafe = await ev("({cats:document.querySelectorAll('.cat').length, first:document.querySelector('.cat h3').textContent, count:document.getElementById('cartCount').textContent})");
  check('cambiar de sede cambia carta y comanda',
    cafe.cats === 7 && cafe.first.includes('Gelato') && cafe.count === '0', JSON.stringify(cafe));

  await ir('/pedir.html');
  const vuelta = await ev("({count:document.getElementById('cartCount').textContent})");
  check('la sede elegida sobrevive a la recarga', vuelta.count === '0', JSON.stringify(vuelta));
  await ev("document.querySelector('#sedes .venue-pill[data-branch=\"restaurante\"]').click()");
  await sleep(800);
  check('la comanda del restaurante se recupera intacta',
    (await ev("document.getElementById('cartCount').textContent")) === '3');

  await ev("localStorage.setItem('zhuba.stock.v1', JSON.stringify({'r-fukkatsu':false}))");
  await ir('/pedir.html');
  const sold = await ev("({out:document.querySelector('[data-item=\"r-fukkatsu\"]').classList.contains('is-out'), disabled:document.querySelector('[data-open=\"r-fukkatsu\"]').disabled})");
  check('un plato agotado se bloquea en el pedido', sold.out && sold.disabled, JSON.stringify(sold));

  await ev("localStorage.removeItem('zhuba.stock.v1')");
  await ir('/pedir.html?plato=r-tartarzhuba');
  await sleep(700);
  const enlace = await ev("({abierto:document.getElementById('modal').classList.contains('is-open'), titulo:document.getElementById('modalTitle')?.textContent.trim()||''})");
  check('el enlace directo desde la portada abre el plato',
    enlace.abierto && enlace.titulo.includes('Tartar'), JSON.stringify(enlace));

  console.log('\n=== RECORRIDO FUNCIONAL ===');
  out.forEach((r) => console.log(`${r.ok ? 'OK  ' : 'FALLA'} ${r.name}${r.ok ? '' : '  → ' + r.detail}`));
  const bad = out.filter((r) => !r.ok).length;
  console.log(`\n${out.length - bad}/${out.length} comprobaciones correctas`);
  ws.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
