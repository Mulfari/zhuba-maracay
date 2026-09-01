/* Recorrido funcional completo sobre la página real, vía CDP.
   uso: node flow.js <url> */
const http = require('http');
const URL_ = process.argv[2] || 'http://localhost:4181/';
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

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await ev('1');
  await send('Page.navigate', { url: URL_ });
  await sleep(4000);
  await ev("localStorage.clear()");
  await send('Page.navigate', { url: URL_ });
  await sleep(4000);

  const out = [];
  const check = (name, ok, detail = '') => { out.push({ name, ok: !!ok, detail }); };

  // --- 1. carta cargada
  const base = await ev("({cards:document.querySelectorAll('.card').length, cats:document.querySelectorAll('.cat').length, pills:document.querySelectorAll('.pill').length})");
  check('carta del restaurante renderizada', base.cards > 50 && base.cats === 8, JSON.stringify(base));

  // --- 2. abrir el modal de un plato con variantes (Sashimi)
  await ev("document.querySelector('[data-open=\"r-sashimi\"]').click()");
  await sleep(600);
  const modal = await ev("({open:document.getElementById('modal').classList.contains('is-open'), variants:document.querySelectorAll('[data-variant]').length, adj:document.querySelectorAll('[data-adj]').length, pair:!!document.querySelector('[data-pair]'), total:document.getElementById('modalTotal').textContent})");
  check('modal con variantes, ajustes y maridaje', modal.open && modal.variants === 5 && modal.adj > 3 && modal.pair, JSON.stringify(modal));

  // --- 3. elegir variante cara, dos ajustes, maridaje y nota
  await ev("document.querySelectorAll('[data-variant]')[4].click()");
  await sleep(200);
  const afterVariant = await ev("document.getElementById('modalTotal').textContent");
  check('el precio sigue a la variante elegida', afterVariant.includes('18,00'), afterVariant);

  await ev("document.querySelectorAll('[data-adj]')[0].click(); document.querySelectorAll('[data-adj]')[3].click(); document.querySelector('[data-pair]').click(); document.getElementById('kitchenNote').value='Sin sésamo, por favor';");
  await sleep(200);
  const withPair = await ev("document.getElementById('modalTotal').textContent");
  check('el maridaje suma al total del modal', withPair.includes('27,50'), withPair);

  await ev("document.querySelectorAll('[data-qty]')[1].click()"); // qty 2
  await sleep(150);
  const qty2 = await ev("document.getElementById('modalTotal').textContent");
  check('la cantidad multiplica el plato, no el maridaje', qty2.includes('45,50'), qty2);

  await ev("document.querySelector('[data-add]').click()");
  await sleep(500);

  // --- 4. estado del carrito
  const cart = await ev("({count:document.getElementById('cartCount').textContent, total:document.getElementById('cartTotal').textContent, visible:document.getElementById('cartPill').classList.contains('is-visible')})");
  check('la pastilla del carrito muestra 3 ítems', cart.count === '3' && cart.visible, JSON.stringify(cart));

  // --- 5. abrir el cajón y revisar la línea
  await ev("document.getElementById('cartPill').click()");
  await sleep(600);
  const drawer = await ev("({lines:document.querySelectorAll('.line').length, mods:document.querySelector('.line__mods').textContent.replace(/\\s+/g,' ').trim(), note:document.querySelector('.line__note')?.textContent.trim(), upsell:document.querySelectorAll('[data-quick]').length, svc:document.querySelectorAll('[data-mode]').length})");
  check('cajón con líneas, modificadores, nota y upsell',
    drawer.lines === 2 && drawer.mods.includes('Eel') && drawer.note.includes('sésamo') && drawer.upsell > 3 && drawer.svc === 3,
    JSON.stringify(drawer));

  // --- 6. validación del servicio: delivery sin datos no debe pasar
  await ev("document.querySelector('[data-mode=\"delivery\"]').click()");
  await sleep(400);
  await ev("document.querySelector('[data-checkout]').click()");
  await sleep(400);
  const blocked = await ev("({bad:document.querySelectorAll('.field.is-bad').length, orders:JSON.parse(localStorage.getItem('zhuba.orders.v1')||'[]').length})");
  check('el checkout se bloquea si faltan datos de delivery', blocked.bad >= 2 && blocked.orders === 0, JSON.stringify(blocked));

  // --- 7. rellenar y construir el ticket (sin abrir WhatsApp)
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
    return {txt:buildTicket(store), link:whatsappLink(store), sub:store.subtotal, count:store.count};
  })()`);
  check('el ticket lleva sede, servicio, datos, líneas y total',
    ticket.txt.includes('ZHUBA Restaurant') && ticket.txt.includes('Delivery') &&
    ticket.txt.includes('Andrea') && ticket.txt.includes('Las Delicias') &&
    ticket.txt.includes('Eel (anguila)') && ticket.txt.includes('Sin sésamo') &&
    ticket.txt.includes('TOTAL'), '');
  check('el enlace apunta al WhatsApp de la sede y va codificado',
    ticket.link.startsWith('https://wa.me/584124554207?text=') && ticket.link.length > 300 && !/\s/.test(ticket.link),
    ticket.link.slice(0, 80));

  // --- 8. cambio de sede: otra carta, carrito independiente
  await ev("document.getElementById('drawerClose').click()");
  await sleep(400);
  await ev("document.querySelector('.venue-pill[data-branch=\"cafe\"]').click()");
  await sleep(900);
  const cafe = await ev("({cats:document.querySelectorAll('.cat').length, first:document.querySelector('.cat h3').textContent, count:document.getElementById('cartCount').textContent, wa:document.getElementById('waTop').href, name:document.getElementById('venueName').textContent})");
  check('cambiar de sede cambia carta, carrito y WhatsApp',
    cafe.cats === 7 && cafe.first.includes('Gelato') && cafe.count === '0' && cafe.wa.includes('VXIVBTNU3I5AC1'),
    JSON.stringify(cafe));

  // --- 9. persistencia tras recarga
  await send('Page.navigate', { url: URL_ });
  await sleep(3800);
  const persisted = await ev("({branch:document.getElementById('venueName').textContent, count:document.getElementById('cartCount').textContent})");
  check('la sede elegida sobrevive a la recarga', persisted.branch.trim() === 'Café', JSON.stringify(persisted));

  await ev("document.querySelector('.venue-pill[data-branch=\"restaurante\"]').click()");
  await sleep(800);
  const backCart = await ev("({count:document.getElementById('cartCount').textContent, total:document.getElementById('cartTotal').textContent})");
  check('el carrito del restaurante se recupera intacto', backCart.count === '3', JSON.stringify(backCart));

  // --- 10. agotados desde el panel
  await ev("localStorage.setItem('zhuba.stock.v1', JSON.stringify({'r-fukkatsu':false}))");
  await send('Page.navigate', { url: URL_ });
  await sleep(3800);
  const sold = await ev("({out:!!document.querySelector('[data-item=\"r-fukkatsu\"]').querySelector('.card__sold'), disabled:document.querySelector('[data-open=\"r-fukkatsu\"]').disabled})");
  check('un plato marcado agotado se bloquea en la carta', sold.out && sold.disabled, JSON.stringify(sold));

  console.log('\n=== RECORRIDO FUNCIONAL ===');
  out.forEach((r) => console.log(`${r.ok ? 'OK  ' : 'FALLA'} ${r.name}${r.ok ? '' : '  → ' + r.detail}`));
  const bad = out.filter((r) => !r.ok).length;
  console.log(`\n${out.length - bad}/${out.length} comprobaciones correctas`);
  if (out.some((r) => r.name.startsWith('el ticket'))) {
    console.log('\n--- TICKET ---\n' + ticket.txt);
  }
  ws.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
