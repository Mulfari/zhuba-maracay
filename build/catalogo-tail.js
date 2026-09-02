/* ============================================= ficha del plato (informativa) */
/* En la portada no se pide: la ficha cuenta el plato y ofrece el camino a la
   página de pedidos, que es donde vive la comanda. */
let cambioSede;

function openModal(itemId) {
  const item = store.item(itemId);
  if (!item) return;
  const categoria = store.categories.find((c) => c.id === item.cat)?.name || '';
  const pairItem = item.pair ? store.item(item.pair) : null;
  const { main, sub } = priceLabel(item);
  const vitrina = item.orderable === false;

  $('#modalPanel').innerHTML = `
    <div class="modal__hero${item.img ? '' : ' modal__hero--empty'}">
      ${item.img ? `<img src="img/${esc(item.img)}" alt="${esc(item.name)}" width="520" height="520">` : ''}
      <button class="icon-btn modal__close" data-close aria-label="Cerrar">${ICON.close}</button>
      <div class="modal__title">
        <p class="eyebrow eyebrow--plain">${esc(categoria)}</p>
        <h3 class="display" id="modalTitle">${esc(item.name)}</h3>
      </div>
    </div>

    <div class="modal__body">
      <p class="lede" style="font-size:.92rem">${esc(item.desc)}</p>

      ${item.variants?.length ? `
      <div class="opt-group">
        <div class="opt-group__head"><h4>Se sirve en</h4></div>
        <ul class="ficha-lista">
          ${item.variants.map((v) => `
            <li><span>${esc(v.name)}</span><b class="price">${money(store.variantPrice(item, v))}</b></li>`).join('')}
        </ul>
      </div>` : `
      <div class="opt-group">
        <div class="opt-group__head"><h4>Precio</h4></div>
        <p class="ficha-precio price">${sub ? `<small>${sub}</small>` : ''}${esc(main)}</p>
      </div>`}

      ${pairItem ? `
      <div class="opt-group">
        <div class="opt-group__head"><h4>Marida con</h4></div>
        <p class="ficha-marida">${esc(pairItem.name)}
          <span>${esc(priceLabel(pairItem).main)}</span></p>
      </div>` : ''}

      ${item.tags.length ? `
      <div class="opt-group">
        <div class="opt-group__head"><h4>Alérgenos y dieta</h4></div>
        <div class="tags">${item.tags.map(tagChip).join('')}</div>
      </div>` : ''}
    </div>

    <div class="modal__foot">
      ${vitrina
        ? '<span class="ficha-vitrina">Pieza de vitrina · se elige en el mostrador</span>'
        : `<a class="btn btn--solid" style="flex:1" href="pedir?plato=${encodeURIComponent(item.id)}">
             Pedir este plato</a>`}
    </div>`;

  const modal = $('#modal');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  $('#scrim').classList.add('is-open');
  $('#modalPanel').querySelector('[data-close]')?.focus();
  $('#modalPanel').onclick = (e) => { if (e.target.closest('[data-close]')) closeModal(); };
}

function closeModal() {
  const modal = $('#modal');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
  $('#scrim').classList.remove('is-open');
}

/* ------------------------------------------------------------------ aviso */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2400);
}

/* ================================================================== sedes */
function renderVenues() {
  const grid = $('#venuesGrid');
  if (!grid) return;
  grid.innerHTML = BRANCHES.map((b) => `
    <article class="venue-card${b.id === store.branchId ? ' is-active' : ''}" data-branch="${b.id}">
      <div>
        <p class="eyebrow">${esc(b.kicker)}</p>
        <h3 class="display" style="margin-top:.5rem">${esc(b.name)}</h3>
      </div>
      <dl class="venue-card__rows">
        <div class="vrow"><dt>Dirección</dt><dd>${esc(b.address)}</dd></div>
        <div class="vrow"><dt>Horario</dt><dd>${b.hours.map((h) => `${esc(h.label)}<br><b style="color:var(--travertine)">${esc(h.value)}</b>`).join('<br><br>')}</dd></div>
        <div class="vrow"><dt>Teléfono</dt><dd><a href="${esc(b.phoneHref)}">${esc(b.phone)}</a></dd></div>
        <div class="vrow"><dt>Servicios</dt><dd><div class="chips">${b.services.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div></dd></div>
        <div class="vrow"><dt>Delivery</dt><dd>${b.deliveryZones.slice(0, 5).join(' · ')}.<br><span style="color:var(--travertine-3)">${esc(b.deliveryFeeNote)}</span></dd></div>
      </dl>
      <div class="venue-card__cta">
        <a class="btn btn--sm btn--solid" href="pedir">Pedir en línea</a>
        <a class="btn btn--sm" href="${esc(b.maps)}" target="_blank" rel="noopener">Cómo llegar</a>
        <button class="btn btn--sm btn--ghost" data-pick="${b.id}">Ver esta carta</button>
      </div>
    </article>`).join('');

  grid.onclick = (e) => {
    const pick = e.target.closest('[data-pick]');
    if (!pick) return;
    store.setBranch(pick.dataset.branch);
    $('#carta')?.scrollIntoView({ behavior: 'smooth' });
  };
}

/* ================================================================= arranque */
export function mountApp() {
  mountVenueSwitcher();
  renderHero();
  pintarEstado();
  setInterval(pintarEstado, 60000);
  renderVenues();
  renderMenu();
  paintBranchChrome();

  $('#scrim').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#modal').classList.contains('is-open')) closeModal();
  });

  store.on((what) => {
    if (what === 'branch') {
      paintBranchChrome();
      renderVenues();
      const relevo = () => { renderMenu(); renderHero(); paintBranchChrome(); };
      if (reducedMotion()) {
        relevo();
      } else {
        clearTimeout(cambioSede);
        document.body.classList.add('is-switching');
        cambioSede = setTimeout(() => {
          relevo();
          requestAnimationFrame(() => document.body.classList.remove('is-switching'));
        }, 190);
      }
      toast(`Estás viendo ${store.branch.name}`);
    }
    if (what === 'stock' || what === 'prices') renderMenu();
  });

  // el panel de cocina puede marcar agotados desde otra pestaña
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    if (e.key.startsWith('zhuba.stock') || e.key.startsWith('zhuba.prices')) {
      store.stock = JSON.parse(localStorage.getItem('zhuba.stock.v1') || '{}');
      store.prices = JSON.parse(localStorage.getItem('zhuba.prices.v1') || '{}');
      renderMenu();
    }
  });

  // el héroe se cierra al bajar; cada sección publica su propio progreso
  addExitProgress($('.hero'), '--p');
  addParallax($('#heroGrid'), -70);
  $$('.section').forEach((sec) => addExitProgress(sec, '--p'));
  revealAll();
}

export { toast };
