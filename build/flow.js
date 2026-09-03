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
  const check = (name, ok, detail = '') => {
    out.push({ name, ok: !!ok, detail });
    console.log(`${ok ? 'OK  ' : 'FALLA'} ${name}${ok ? '' : '  -> ' + detail}`);
  };

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
  check('la portada ya no lleva pedido', portada.sinComanda, JSON.stringify(portada));
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
  await ev(`document.querySelector('#sedes .venue-pill[data-branch="restaurante"]')?.click()`);
  await sleep(700);
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
  check('la barra del pedido marca 3 ítems', cart.count === '3' && cart.visible, JSON.stringify(cart));

  await ev("document.getElementById('cartPill').click()");
  await sleep(600);
  const drawer = await ev("({lines:document.querySelectorAll('.line').length, mods:document.querySelector('.line__mods').textContent.replace(/\\s+/g,' ').trim(), note:document.querySelector('.line__note')?.textContent.trim(), upsell:document.querySelectorAll('[data-quick]').length, paso:document.querySelector('.pasos li.is-now')?.textContent.trim()||''})");
  check('el cajón lleva líneas, modificadores, nota y upsell',
    drawer.lines === 2 && drawer.mods.includes('Eel') && drawer.note.includes('sésamo') && drawer.upsell > 3,
    JSON.stringify(drawer));

  await ev("document.querySelector('[data-siguiente]').click()");
  await sleep(450);
  const entrega = await ev("({svc:document.querySelectorAll('[data-mode]').length, atras:!!document.querySelector('[data-atras]'), sinEnviar:!document.querySelector('[data-enviar]')})");
  check('el segundo paso pregunta cómo se entrega',
    entrega.svc === 3 && entrega.atras && entrega.sinEnviar, JSON.stringify(entrega));

  await ev("document.querySelector('[data-mode=\"delivery\"]').click()");
  await sleep(450);
  const blocked = await ev("({bloqueado:document.querySelector('[data-siguiente]').disabled, falta:document.querySelector('.falta')?.textContent||'', pedidos:JSON.parse(localStorage.getItem('zhuba.orders.v1')||'[]').length})");
  check('sin datos de entrega no se pasa al pago',
    blocked.bloqueado && blocked.falta.length > 0 && blocked.pedidos === 0, JSON.stringify(blocked));

  await ev(`
    const set=(id,v)=>{const el=document.querySelector('[data-input="'+id+'"]');
      if(el){el.value=v; el.dispatchEvent(new Event('input',{bubbles:true}));}};
    set('nombre','Andrea'); set('direccion','Av. Bolívar, Res. Aragua, piso 4');
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
    ticket.txt.includes('Andrea') && ticket.txt.includes('Av. Bolívar') &&
    ticket.txt.includes('Eel (anguila)') && ticket.txt.includes('Sin sésamo') && ticket.txt.includes('TOTAL'));
  check('el enlace apunta al WhatsApp de la sede y va codificado',
    ticket.link.startsWith('https://wa.me/584124554207?text=') && ticket.link.length > 300 && !/\s/.test(ticket.link),
    ticket.link.slice(0, 70));

  await ev("document.getElementById('drawerClose').click()");
  await sleep(400);
  await ev("document.querySelector('#sedes .venue-pill[data-branch=\"cafe\"]').click()");
  await sleep(900);
  const cafe = await ev("({cats:document.querySelectorAll('.cat').length, first:document.querySelector('.cat h3').textContent, count:document.getElementById('cartCount').textContent})");
  check('cambiar de sede cambia carta y pedido',
    cafe.cats === 7 && cafe.first.includes('Gelato') && cafe.count === '0', JSON.stringify(cafe));

  await ir('/pedir.html');
  const vuelta = await ev("({count:document.getElementById('cartCount').textContent})");
  check('la sede elegida sobrevive a la recarga', vuelta.count === '0', JSON.stringify(vuelta));
  await ev("document.querySelector('#sedes .venue-pill[data-branch=\"restaurante\"]').click()");
  await sleep(800);
  check('el pedido del restaurante se recupera intacto',
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

    /* =============================================== la entrada de la página */
  await ir('/');
  const entrada = await ev(`({
    // A los 4 s la cortina ya no está: ni tapa ni se come los clics.
    retirada: !document.getElementById('cortina'),
    fotosMarcadas: document.querySelectorAll('img[data-suave]').length,
    // Las perezosas de más abajo aún no han cargado, y está bien: lo que no
    // puede pasar es que una foto ya cargada se quede invisible.
    invisibles: Array.from(document.querySelectorAll('img[data-suave]'))
      .filter((i) => i.complete && i.naturalWidth && !i.classList.contains('is-cargada')).length,
    primeras: document.querySelectorAll('img[data-primera]').length
  })`);
  check('la cortina se retira sola y no deja capa encima',
    entrada.retirada && entrada.primeras >= 2, JSON.stringify(entrada));
  check('las fotos entran fundiéndose, y ninguna cargada se queda invisible',
    entrada.fotosMarcadas > 20 && entrada.invisibles === 0, JSON.stringify(entrada));

  const red = await ev(`(async()=>{
    const html = await (await fetch(new URL('pedir.html', location.href))).text();
    return {
      // El tope arranca con el HTML: si dependiera del módulo, en una red
      // lenta la cortina duraría justo lo que no debe.
      topeEnLinea: html.includes('setTimeout(function ()') && html.includes("getElementById('cortina')"),
      sinJs: html.includes('<noscript><style>.cortina { display: none }</style></noscript>')
    };
  })()`);
  check('la cortina tiene tope propio y no atrapa a nadie',
    red.topeEnLinea && red.sinJs, JSON.stringify(red));

  /* ================== las capas de fondo no dependen del alto del viewport */
  await ir('/');
  const fondo = await ev(`(async()=>{
    const css = await (await fetch(new URL('css/app.css', location.href))).text();
    const bloque = (sel) => {
      const i = css.indexOf(sel + ' {');
      return i === -1 ? '' : css.slice(i, css.indexOf('}', i));
    };
    const amb = bloque('.ambient'), gr = bloque('.grain');
    // @keyframes lleva llaves dentro: el recorte por la primera se queda corto.
    const iKf = css.indexOf('@keyframes grain {');
    const kf = iKf === -1 ? '' : css.slice(iKf, iKf + 340);
    return {
      // El viewport grande no cambia cuando el navegador esconde su barra;
      // el dinámico sí, y los porcentajes de una caja fija, también.
      ambienteAnclado: /height:\\s*100lvh/.test(amb) && !/inset:\\s*0;/.test(amb),
      granoAnclado: /100lvh/.test(gr) && !/inset:\\s*-50%/.test(gr),
      // El vaivén del grano en píxeles: en porcentaje, su amplitud cambiaba
      // con el alto de la pantalla.
      vaivenEnPixeles: kf.includes('px') && !/translate\\([^)]*%/.test(kf),
      sinDinamico: !/\\d(dvh|dvmin|dvmax)/.test(css)
    };
  })()`);
  check('el fondo no se mueve cuando el navegador esconde su barra',
    fondo.ambienteAnclado && fondo.granoAnclado && fondo.vaivenEnPixeles && fondo.sinDinamico,
    JSON.stringify(fondo));

  const refViewport = await ev(`(async()=>{
    const js = await (await fetch(new URL('js/motion.js', location.href))).text();
    return {
      // El paralaje mide contra una altura de referencia, no contra la viva.
      referencia: js.includes('vhRef') && js.includes('const vh = vhRef || vivo'),
      ignoraLaBarra: js.includes('soloLaBarra()') && /function onResize\\(\\)\\s*\\{\\s*\\n\\s*if \\(soloLaBarra\\(\\)\\) return;/.test(js)
    };
  })()`);
  check('el paralaje ignora el cambio de alto que trae la barra',
    refViewport.referencia && refViewport.ignoraLaBarra, JSON.stringify(refViewport));

  /* ================================= cada familia habla con su propia voz */
  const voz = await ev(`(async()=>{
    const {AJUSTES, ADJUSTMENT_MAP}=await import(new URL('data/modifiers.js', location.href).href);
    const cafe = await import(new URL('data/menu-cafe.js', location.href).href);
    const rest = await import(new URL('data/menu-restaurante.js', location.href).href);
    // Toda categoría de las dos cartas tiene familia, y toda familia dice
    // quién prepara y con qué ejemplo: si no, alguien se queda con «la cocina».
    const cats = [...cafe.CATEGORIES, ...rest.CATEGORIES].map((c) => c.id);
    const huerfanas = cats.filter((c) => !ADJUSTMENT_MAP[c]);
    const incompletas = Object.entries(AJUSTES)
      .filter(([, f]) => !f.quien || !f.ejemplo || !f.opciones?.length)
      .map(([k]) => k);
    return { cats: cats.length, huerfanas, incompletas,
             quienes: [...new Set(Object.values(AJUSTES).map((f) => f.quien))].sort() };
  })()`);
  check('toda la carta sabe quién la prepara',
    voz.cats === 15 && !voz.huerfanas.length && !voz.incompletas.length &&
    voz.quienes.length === 4, JSON.stringify(voz));

  const familias = [];
  for (const [id, espera] of [['c-barquilla', 'la heladería'], ['c-espresso', 'la barra'],
    ['r-moscow', 'la barra'], ['c-caesar', 'la cocina'], ['r-fukkatsu', 'la cocina']]) {
    await ir(`/pedir.html?plato=${id}`);
    await sleep(600);
    familias.push(await ev(`({id:'${id}', espera:'${espera}',
      etiqueta: document.querySelector('label[for=kitchenNote]')?.textContent.trim() || '',
      ejemplo: document.getElementById('kitchenNote')?.placeholder || '',
      grupo: Array.from(document.querySelectorAll('.modal__panel h4')).map(h=>h.textContent.trim()).join('|')})`));
  }
  check('a un helado no le habla la cocina',
    familias.every((f) => f.etiqueta === `Notas para ${f.espera}` && f.ejemplo.startsWith('Ej. ')),
    JSON.stringify(familias.map((f) => `${f.id}: ${f.etiqueta}`)));
  check('el ejemplo de la nota va con lo que se pide',
    familias.find((f) => f.id === 'c-barquilla').ejemplo.includes('sabores') &&
    familias.find((f) => f.id === 'r-fukkatsu').ejemplo.includes('cebollín') &&
    familias.find((f) => f.id === 'c-espresso').ejemplo.includes('lactosa'),
    JSON.stringify(familias.map((f) => f.ejemplo)));
  check('el grupo de ajustes ya no dice cocina',
    familias.every((f) => !/cocina/i.test(f.grupo)) &&
    familias.every((f) => f.grupo.includes('Cómo lo preparamos')),
    JSON.stringify(familias.map((f) => f.grupo)));

  const sinEuros = await ev(`(async()=>{
    const cafe = await import(new URL('data/menu-cafe.js', location.href).href);
    const rest = await import(new URL('data/menu-restaurante.js', location.href).href);
    const notas = [...cafe.ITEMS, ...rest.ITEMS].map((i) => i.priceNote || '').filter(Boolean);
    return { notas, conEuro: notas.filter((n) => n.includes('€')),
             pill: document.getElementById('cartTotal')?.textContent.trim() || '' };
  })()`);
  check('la carta ya no cotiza en euros',
    sinEuros.notas.length > 0 && !sinEuros.conEuro.length && !sinEuros.pill.includes('€'),
    JSON.stringify(sinEuros));

  /* ======================================== la dirección, en los dos sentidos */
  await ir('/pedir.html');
  await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    localStorage.clear();
    store.carts = {}; store.service = { mode:'delivery', fields:{} };
    store.setConfig({ anillos:{a1:2,a2:3.5,a3:5,a4:7}, maxKm:12, pagos:{} });
    store.setBranch('restaurante');
    return 1;
  })()`);
  await ir('/pedir.html');

  // Nominatim se sustituye por respuestas fijas: la prueba mira nuestro código,
  // no el servicio de terceros, y así no se le hacen peticiones a cada rato.
  await ev(`
    window.__geo = [];
    const real = window.fetch;
    window.fetch = (u, o) => {
      const url = String(u);
      if (url.includes('nominatim')) {
        window.__geo.push(url);
        if (url.includes('/reverse')) return Promise.resolve(new Response(JSON.stringify({
          display_name: 'Calle El Canal, La Floresta, Maracay, Girardot, Aragua',
          address: { road:'Calle El Canal', house_number:'12', neighbourhood:'La Floresta', city:'Maracay' }
        }), { status:200 }));
        if (url.includes('bounded=1')) return Promise.resolve(new Response(JSON.stringify([
          { lat:'10.2755', lon:'-67.5910', display_name:'Avenida Las Delicias, Las Delicias, Maracay, Aragua',
            address:{ road:'Avenida Las Delicias', neighbourhood:'Las Delicias', city:'Maracay' } },
          { lat:'10.2600', lon:'-67.6000', display_name:'Calle Bolívar, San Jacinto, Maracay, Aragua',
            address:{ road:'Calle Bolívar', neighbourhood:'San Jacinto', city:'Maracay' } }
        ]), { status:200 }));
        return Promise.resolve(new Response('[]', { status:200 }));
      }
      return real(u, o);
    };
  `);

  await ev("document.querySelector('[data-open=\"r-fukkatsu\"]').click()");
  await sleep(600);
  await ev("document.querySelector('[data-add]').click()");
  await sleep(500);
  await ev("document.getElementById('cartPill').click()");
  await sleep(700);
  await ev("document.querySelector('[data-siguiente]').click()");
  await sleep(500);
  await ev("document.querySelector('[data-mode=\"delivery\"]').click()");
  await sleep(600);

  const campo = await ev("({buscador:!!document.querySelector('[data-busca-dir]'), lista:!!document.getElementById('sugeDir'), pista:document.querySelectorAll('.field--busca .field__pista').length})");
  check('la dirección del delivery trae buscador', campo.buscador && campo.lista && campo.pista >= 1, JSON.stringify(campo));

  // 1) Escribir y elegir: el punto cae en el mapa solo.
  await ev(`{ const c=document.querySelector('[data-busca-dir]');
    c.value='Avenida Las Delicias'; c.dispatchEvent(new Event('input',{bubbles:true})); }`);
  await sleep(1600);
  const sugeridas = await ev("({n:document.querySelectorAll('[data-sugerencia]').length, primera:document.querySelector('[data-sugerencia]')?.textContent.replace(/\\s+/g,' ').trim()||'', abierta:!document.getElementById('sugeDir').hidden})");
  check('al escribir aparecen direcciones de Maracay',
    sugeridas.abierta && sugeridas.n === 2 && sugeridas.primera.includes('Avenida Las Delicias'),
    JSON.stringify(sugeridas));

  await ev("document.querySelector('[data-sugerencia=\"0\"]').click()");
  await sleep(2200);
  const elegida = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    return { direccion: store.service.fields.direccion, km: store.entrega?.km,
             envio: store.costeEnvio, mapa: !!document.querySelector('.geo__mapa .leaflet-marker-icon'),
             listaCerrada: !document.getElementById('sugeDir') || document.getElementById('sugeDir').hidden };
  })()`);
  check('elegir una dirección la marca en el mapa y cobra el envío',
    elegida.direccion.includes('Las Delicias') && elegida.km < 1 && elegida.envio === 2 &&
    elegida.mapa && elegida.listaCerrada, JSON.stringify(elegida));

  // 2) Usar la ubicación: la dirección se escribe sola en el formulario.
  await ev("document.querySelector('[data-geo-reset]').click()");
  await sleep(600);
  const limpio = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    return { direccion: store.service.fields.direccion, entrega: store.entrega };
  })()`);
  check('cambiar de ubicación borra la dirección que puso la web',
    limpio.direccion === '' && limpio.entrega === null, JSON.stringify(limpio));

  await ev(`navigator.geolocation.getCurrentPosition = (ok) =>
    ok({ coords:{ latitude:10.2755, longitude:-67.5910 } });
    document.querySelector('[data-geo]').click();`);
  await sleep(2600);
  const desdeGps = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    return { direccion: store.service.fields.direccion, guardada: JSON.parse(localStorage.getItem('zhuba.service.v1')||'{}').fields?.direccion,
             mostrada: document.querySelector('.geo__dir')?.textContent.trim() || '', km: store.entrega?.km };
  })()`);
  check('usar la ubicación escribe la dirección en el formulario',
    desdeGps.direccion === 'Calle El Canal 12, La Floresta' &&
    desdeGps.guardada === desdeGps.direccion && desdeGps.mostrada.includes('Maracay') &&
    desdeGps.km < 1, JSON.stringify(desdeGps));

  // 3) Lo escrito a mano no se pisa.
  await ev("document.querySelector('[data-geo-reset]').click()");
  await sleep(500);
  await ev(`{ const c=document.querySelector('[data-busca-dir]');
    c.value='Quinta Mi Casa, al lado del abasto'; c.dispatchEvent(new Event('input',{bubbles:true})); }`);
  await sleep(1500);
  await ev(`navigator.geolocation.getCurrentPosition = (ok) =>
    ok({ coords:{ latitude:10.2755, longitude:-67.5910 } });
    document.querySelector('[data-geo]')?.click();`);
  await sleep(2600);
  const aMano = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    return { direccion: store.service.fields.direccion, km: store.entrega?.km };
  })()`);
  check('la dirección escrita a mano no la pisa el GPS',
    aMano.direccion.startsWith('Quinta Mi Casa') && aMano.km < 1, JSON.stringify(aMano));

  // 4) Marcar a mano: el mapa se abre centrado en el restaurante.
  await ev("document.querySelector('[data-geo-reset]')?.click()");
  await sleep(600);
  const antes = await ev("({visible: !!document.querySelector('.geo__mapa:not([hidden])')})");
  await ev("document.querySelector('[data-mapa]').click()");
  await sleep(2600);
  const aMapa = await ev("({visible: !!document.querySelector('.geo__mapa:not([hidden])'), chincheta: document.querySelectorAll('.geo__mapa .leaflet-marker-icon').length, teselas: document.querySelectorAll('.geo__mapa img.leaflet-tile-loaded').length})");
  check('marcar en el mapa lo abre con la chincheta puesta',
    !antes.visible && aMapa.visible && aMapa.chincheta === 1 && aMapa.teselas > 3,
    JSON.stringify({ antes, aMapa }));

  const consultas = await ev("window.__geo.length");
  check('no se consulta el buscador de más', consultas <= 8, `${consultas} consultas`);

  /* ============================================== cobro y envío */
  await ir('/pedir.html');
  await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    localStorage.clear();
    store.config = { pagos:{}, anillos:{}, maxKm:12, minimoPedido:null, aviso:'', tasaManual:null };
    store.carts = {};
    store.setBranch('restaurante');
    return 1;
  })()`);
  await ir('/pedir.html');

  const tasa = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    await store.cargarTasa();
    return { valor: store.tasa?.valor || 0, enBs: store.aBs(10), metodos: store.metodosDisponibles().map(m=>m.id) };
  })()`);
  check('la tasa oficial se consulta y convierte',
    tasa.valor > 1 && Math.abs(tasa.enBs - tasa.valor * 10) < 0.02, JSON.stringify(tasa));
  check('sin datos publicados solo se ofrece efectivo',
    tasa.metodos.length === 1 && tasa.metodos[0] === 'efectivo', JSON.stringify(tasa.metodos));

  const zonas = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    store.setConfig({ anillos:{a1:2,a2:3.5,a3:5,a4:7}, maxKm:12,
      pagos:{'pago-movil':{banco:'Banesco 0134',telefono:'0412-0000000',documento:'J-000000000'}} });
    const cerca = store.setEntrega(10.2755, -67.5910);
    const medio = store.setEntrega(10.3100, -67.6200);
    const lejos = store.setEntrega(10.1500, -67.4000);
    store.limpiarEntrega();
    return { cerca:{km:cerca.km, precio:cerca.precio, fuera:cerca.fuera},
             medio:{km:medio.km, precio:medio.precio, fuera:medio.fuera},
             lejos:{km:lejos.km, fuera:lejos.fuera},
             metodos: store.metodosDisponibles().map(m=>m.id) };
  })()`);
  check('el envío se cobra por anillo de distancia',
    zonas.cerca.precio === 2 && zonas.medio.precio > 2 && !zonas.cerca.fuera, JSON.stringify(zonas));
  check('fuera de cobertura no hay delivery', zonas.lejos.fuera && zonas.lejos.km > 12, JSON.stringify(zonas.lejos));
  check('con datos publicados aparece el método de pago',
    zonas.metodos.includes('pago-movil'), JSON.stringify(zonas.metodos));

  await ev(`document.querySelector('[data-open="r-fukkatsu"]').click()`);
  await sleep(500);
  await ev(`document.querySelector('[data-add]').click()`);
  await sleep(400);
  await ev(`document.getElementById('cartPill').click()`);
  await sleep(500);
  const pasos = await ev(`({pasos:document.querySelectorAll('.pasos li').length,
    siguiente:!!document.querySelector('[data-siguiente]'),
    sinEnviar:!document.querySelector('[data-enviar]')})`);
  check('el pedido pasa por tres pasos antes de salir',
    pasos.pasos === 3 && pasos.siguiente && pasos.sinEnviar, JSON.stringify(pasos));

  await ev(`document.querySelector('[data-siguiente]').click()`);
  await sleep(350);
  await ev(`document.querySelector('[data-mode="delivery"]').click()`);
  await sleep(350);
  const bloqueo = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    const set=(id,v)=>{const el=document.querySelector('[data-input="'+id+'"]'); if(el){el.value=v; el.dispatchEvent(new Event('input',{bubbles:true}));}};
    set('nombre','Andrea'); set('direccion','Av. Bolívar');
    store.setEntrega(10.1500, -67.4000);
    await new Promise(r=>setTimeout(r,350));
    return { bloqueado: document.querySelector('[data-siguiente]').disabled,
             aviso: document.querySelector('.falta')?.textContent || '' };
  })()`);
  check('una zona lejana bloquea el paso al pago',
    bloqueo.bloqueado && /cobertura/i.test(bloqueo.aviso), JSON.stringify(bloqueo));

  const cobro = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    store.setEntrega(10.2755, -67.5910);
    await new Promise(r=>setTimeout(r,400));
    document.querySelector('[data-siguiente]').click();
    await new Promise(r=>setTimeout(r,400));
    const sinMetodo = document.querySelector('[data-enviar]').disabled;
    document.querySelector('[data-metodo="pago-movil"]').click();
    await new Promise(r=>setTimeout(r,350));
    const sinRef = document.querySelector('[data-enviar]').disabled;
    const datos = document.querySelectorAll('.datos-pago dd').length;
    const ref=document.querySelector('[data-pago="referencia"]'); ref.value='012345678'; ref.dispatchEvent(new Event('input',{bubbles:true}));
    const tel=document.querySelector('[data-pago="telefono"]'); tel.value='0412-1112233'; tel.dispatchEvent(new Event('input',{bubbles:true}));
    await new Promise(r=>setTimeout(r,350));
    return { sinMetodo, sinRef, datos, listo: !document.querySelector('[data-enviar]').disabled,
             envio: store.costeEnvio, total: store.total, subtotal: store.subtotal };
  })()`);
  check('el pago exige método, referencia y teléfono',
    cobro.sinMetodo && cobro.sinRef && cobro.listo, JSON.stringify(cobro));
  check('los datos de pago publicados se muestran al cliente', cobro.datos >= 4, `${cobro.datos} campos`);
  check('el envío entra en el total',
    Math.abs(cobro.total - (cobro.subtotal + cobro.envio)) < 0.001 && cobro.envio === 2, JSON.stringify(cobro));

  const ticketPago = await ev(`(async()=>{
    const {store}=await import(new URL('js/store.js', location.href).href);
    const {buildTicket}=await import(new URL('js/ticket.js', location.href).href);
    const pago = { metodo:'Pago móvil', metodoId:'pago-movil', referencia:'012345678',
      telefono:'0412-1112233', conComprobante:false, enBs: store.aBs(store.total), tasa: store.tasa };
    return buildTicket(store, { pago, entrega: store.entrega, envio: store.costeEnvio, total: store.total, id:'ABC123' });
  })()`);
  check('el ticket lleva pago, bolívares y ubicación',
    ticketPago.includes('*PAGO*') && ticketPago.includes('012345678') &&
    ticketPago.includes('Bs ') && ticketPago.includes('google.com/maps?q=') &&
    ticketPago.includes('Distancia:'), ticketPago.slice(0, 140));

  const salida = await ev(`(async()=>{
    window.__abierto = null;
    const real = window.open;
    window.open = (u) => { window.__abierto = u; return { closed:false }; };
    document.querySelector('[data-enviar]').click();
    await new Promise(r=>setTimeout(r,900));
    window.open = real;
    const {store}=await import(new URL('js/store.js', location.href).href);
    const pedidos = JSON.parse(localStorage.getItem('zhuba.orders.v1')||'[]');
    const ult = pedidos[0] || {};
    return {
      abierto: String(window.__abierto || '').slice(0, 24),
      pedidos: pedidos.length,
      estado: ult.state,
      metodoPago: ult.pago?.metodoId,
      referencia: ult.pago?.referencia,
      enBs: ult.pago?.enBs,
      envio: ult.envio,
      conUbicacion: !!ult.entrega,
      carroVacio: store.cart.length === 0,
      cajonCerrado: !document.getElementById('drawer').classList.contains('is-open')
    };
  })()`);
  check('enviar deja el pedido registrado antes de abrir WhatsApp',
    salida.abierto.startsWith('https://wa.me/') && salida.pedidos === 1 &&
    salida.estado === 'nuevo' && salida.metodoPago === 'pago-movil' &&
    salida.referencia === '012345678' &&
    salida.enBs > 0 && salida.envio === 2 && salida.conUbicacion,
    JSON.stringify(salida));
  check('tras enviar, el pedido queda limpio',
    salida.carroVacio && salida.cajonCerrado, JSON.stringify(salida));
  console.log('\n=== RECORRIDO FUNCIONAL ===');
  out.forEach((r) => console.log(`${r.ok ? 'OK  ' : 'FALLA'} ${r.name}${r.ok ? '' : '  → ' + r.detail}`));
  const bad = out.filter((r) => !r.ok).length;
  console.log(`\n${out.length - bad}/${out.length} comprobaciones correctas`);
  ws.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
