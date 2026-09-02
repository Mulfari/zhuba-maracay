
/* ==================================================== la lista de pedido */
/* Filas compactas en vez de tarjetas: para pedir se escanea y se toca, no se
   contempla. La miniatura es pequeña —y quien no tiene foto simplemente no la
   lleva, sin recuadro de relleno que finja una imagen que no existe. */
let filtro = '';

function fila(item) {
  const out = store.isOut(item.id);
  const vitrina = item.orderable === false;
  const { main, sub } = priceLabel(item);
  const opciones = item.variants?.length > 1 ? `${item.variants.length} opciones` : '';
  const dieta = item.tags.filter((t) => TAGS[t]?.kind === 'diet').slice(0, 2);

  return `
  <article class="row${out ? ' is-out' : ''}" data-item="${item.id}">
    ${item.img
      ? `<img class="row__thumb" src="img/${esc(item.img)}" alt="" loading="lazy" decoding="async" width="120" height="120">`
      : '<span class="row__thumb row__thumb--none" aria-hidden="true"></span>'}
    <div class="row__body">
      <h3>${esc(item.name)}</h3>
      <p>${esc(item.desc)}</p>
      <div class="row__meta">
        ${opciones ? `<span class="tag tag--opts">${opciones}</span>` : ''}
        ${dieta.map(tagChip).join('')}
        ${out ? '<span class="tag tag--out">Agotado</span>' : ''}
      </div>
    </div>
    <div class="row__end">
      <span class="row__price price">${sub ? `<small>${sub}</small>` : ''}${esc(main)}</span>
      ${vitrina
        ? '<span class="row__case">En vitrina</span>'
        : `<button class="row__add" data-open="${item.id}" ${out ? 'disabled' : ''}
             aria-label="Anadir ${esc(item.name)}">${ICON.plus}</button>`}
    </div>
  </article>`;
}

function platosVisibles() {
  const q = filtro.trim().toLowerCase();
  if (!q) return store.items;
  return store.items.filter((i) =>
    i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
}

let vigilarScroll = null;

function renderLista() {
  const indice = $('#indice');
  const lista = $('#lista');
  const items = platosVisibles();
  const buscando = !!filtro.trim();

  $('#buscarBorrar').hidden = !buscando;
  indice.parentElement.hidden = buscando;

  if (buscando) {
    lista.innerHTML = items.length
      ? `<section class="cat">
           <header class="cat__head"><div>
             <h3>${items.length} ${items.length === 1 ? 'resultado' : 'resultados'}</h3>
             <p>para «${esc(filtro.trim())}»</p>
           </div></header>
           <div class="rows">${items.map(fila).join('')}</div>
         </section>`
      : `<div class="empty"><span aria-hidden="true">乙</span>
           <p>Nada con «${esc(filtro.trim())}». Prueba con otro nombre o borra la búsqueda.</p></div>`;
    return;
  }

  indice.innerHTML = store.categories.map((c, i) =>
    `<button class="pill${i === 0 ? ' is-active' : ''}" data-cat="${c.id}">${esc(c.name)}</button>`).join('');

  lista.innerHTML = store.categories.map((c) => {
    const dentro = items.filter((i) => i.cat === c.id);
    if (!dentro.length) return '';
    return `
    <section class="cat" id="cat-${c.id}">
      <header class="cat__head">
        <div><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p></div>
        <span class="cat__kanji" aria-hidden="true">${esc(c.kanji)}</span>
      </header>
      <div class="rows">${dentro.map(fila).join('')}</div>
    </section>`;
  }).join('');

  const secciones = $$('.cat', lista);
  const marcar = (id) => {
    let activa = null;
    $$('.pill', indice).forEach((p) => {
      const on = `cat-${p.dataset.cat}` === id;
      p.classList.toggle('is-active', on);
      if (on) activa = p;
    });
    if (activa) {
      const destino = activa.offsetLeft - indice.clientWidth / 2 + activa.clientWidth / 2;
      indice.scrollTo({ left: Math.max(0, destino), behavior: 'smooth' });
    }
  };
  let actual = null;
  if (vigilarScroll) window.removeEventListener('scroll', vigilarScroll);
  vigilarScroll = () => {
    const linea = window.innerHeight * 0.3;
    let mejor = secciones[0];
    for (const s of secciones) { if (s.getBoundingClientRect().top - linea <= 0) mejor = s; else break; }
    if (mejor && mejor !== actual) { actual = mejor; marcar(mejor.id); }
  };
  vigilarScroll();
  window.addEventListener('scroll', vigilarScroll, { passive: true });
}

/* -------------------------------------------------------------- cabecera */
function pintarSede() {
  const b = store.branch;
  const raiz = document.documentElement;
  raiz.style.setProperty('--accent', b.accent);
  Object.entries(b.theme || {}).forEach(([k, v]) => raiz.style.setProperty(k, v));
  raiz.dataset.sede = b.id;

  $$('#sedes .venue-pill').forEach((el) =>
    el.setAttribute('aria-pressed', String(el.dataset.branch === b.id)));
  $('#sedeNota').textContent = b.kicker;
  $('#drawerSub').textContent = b.name;
}

function montarSedes() {
  const cont = $('#sedes');
  cont.innerHTML = BRANCHES.map((b) => `
    <button class="venue-pill" data-branch="${b.id}" aria-pressed="false">
      <strong>${esc(b.name)}</strong><span>${esc(b.short)}</span>
    </button>`).join('');
  cont.addEventListener('click', (e) => {
    const p = e.target.closest('.venue-pill');
    if (p) store.setBranch(p.dataset.branch);
  });
}

/* --------------------------------------------------------------- arranque */
export function mountPedidos() {
  montarSedes();
  renderLista();
  pintarSede();
  pintarEstado();
  setInterval(pintarEstado, 60000);
  renderPill();
  bindDrawer();

  $('#cartPill').addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#scrim').addEventListener('click', () => { closeModal(); closeDrawer(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($('#modal').classList.contains('is-open')) closeModal();
    else if ($('#drawer').classList.contains('is-open')) closeDrawer();
  });

  $('#indice').addEventListener('click', (e) => {
    const p = e.target.closest('.pill');
    if (!p) return;
    $(`#cat-${p.dataset.cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#lista').addEventListener('click', (e) => {
    const add = e.target.closest('[data-open]');
    if (add) { openModal(add.dataset.open); return; }
    const row = e.target.closest('.row');
    if (row && !store.isOut(row.dataset.item)) openModal(row.dataset.item);
  });

  const buscador = $('#buscar');
  let tecleo;
  buscador.addEventListener('input', () => {
    clearTimeout(tecleo);
    tecleo = setTimeout(() => { filtro = buscador.value; renderLista(); }, 160);
  });
  $('#buscarBorrar').addEventListener('click', () => {
    buscador.value = ''; filtro = ''; renderLista(); buscador.focus();
  });

  store.on((que) => {
    if (que === 'branch') {
      document.body.classList.add('is-switching');
      setTimeout(() => {
        renderLista(); pintarSede(); renderPill();
        if ($('#drawer').classList.contains('is-open')) renderCart();
        requestAnimationFrame(() => document.body.classList.remove('is-switching'));
      }, 180);
      toast(`Pidiendo en ${store.branch.name}`);
    }
    if (que === 'cart' || que === 'service') {
      renderPill();
      if ($('#drawer').classList.contains('is-open')) renderCart();
    }
    if (que === 'stock' || que === 'prices') renderLista();
  });

  // Enlace directo desde la portada: /pedir?plato=r-fukkatsu. Los identificadores
  // llevan la sede en el prefijo, así que se cambia sola si hace falta.
  const pedido = new URLSearchParams(location.search).get('plato');
  const item = pedido ? store.item(pedido) : null;
  if (item) {
    const sede = item.id.startsWith('c-') ? 'cafe' : 'restaurante';
    const cambia = sede !== store.branchId;
    if (cambia) store.setBranch(sede);
    setTimeout(() => {
      $(`#cat-${item.cat}`)?.scrollIntoView({ behavior: 'auto', block: 'start' });
      openModal(item.id);
    }, cambia ? 420 : 80);
  }
}
