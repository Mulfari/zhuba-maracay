/**
 * Estado de la aplicación. Nada de esto sabe cómo se dibuja la interfaz:
 * guarda, calcula y avisa. La vista se suscribe con `store.on()`.
 */
import { BRANCHES, getBranch, CONTACT } from '../data/branches.js';
import * as REST from '../data/menu-restaurante.js';
import * as CAFE from '../data/menu-cafe.js';
import { TASA, METODOS_PAGO, ENVIO } from '../data/pagos.js';

const MENUS = { restaurante: REST, cafe: CAFE };

const K = {
  branch: 'zhuba.branch.v1',
  cart: 'zhuba.cart.v1',
  service: 'zhuba.service.v1',
  stock: 'zhuba.stock.v1',
  prices: 'zhuba.prices.v1',
  orders: 'zhuba.orders.v1',
  config: 'zhuba.config.v1',
  tasa: 'zhuba.tasa.v1'
};

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* modo privado */ }
};

/* La carta está anclada al dólar; el cobro se hace en bolívares a la tasa
   oficial. Se muestran las dos cifras: manda el dólar, informa el bolívar. */
export const money = (n) =>
  `${CONTACT.currency}${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* Los céntimos de bolívar sólo importan donde se paga de verdad. En la carta
   la cifra es una referencia y va redondeada: más corta y más legible. */
export const bolivares = (n, decimales = 2) =>
  `Bs ${Number(n).toLocaleString('es-VE', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}`;

/** Distancia en línea recta, en kilómetros. */
export function distanciaKm(a, b) {
  const R = 6371;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

class Store {
  constructor() {
    const saved = read(K.branch, BRANCHES[0].id);
    this.branchId = BRANCHES.some((b) => b.id === saved) ? saved : BRANCHES[0].id;
    this.carts = read(K.cart, {});
    this.service = read(K.service, { mode: 'mesa', fields: {} });
    this.stock = read(K.stock, {});     // { itemId: false }  → agotado
    this.prices = read(K.prices, {});   // { itemId: number } → precio sobrescrito
    this.orders = read(K.orders, []);
    // Lo que el restaurante configura desde /admin y aquí no se inventa.
    this.config = Object.assign(
      { pagos: {}, anillos: {}, maxKm: ENVIO.maxKm, minimoPedido: ENVIO.minimoPedido, aviso: '', tasaManual: null },
      read(K.config, {})
    );
    this.tasa = read(K.tasa, null);       // { valor, fecha, fuente }
    this.entrega = null;                  // { lat, lng, km, anillo, precio, direccion }
    this.pago = { metodo: null, referencia: '', telefono: '', comprobante: null };
    this.listeners = new Set();
  }

  /* ------------------------------------------------------------- eventos */
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(what = 'all') { this.listeners.forEach((fn) => fn(what, this)); }

  /* -------------------------------------------------------------- sedes */
  get branch() { return getBranch(this.branchId); }
  get menu() { return MENUS[this.branch.menu]; }
  get categories() { return this.menu.CATEGORIES; }
  get items() { return this.menu.ITEMS; }

  setBranch(id) {
    if (id === this.branchId || !BRANCHES.some((b) => b.id === id)) return;
    this.branchId = id;
    write(K.branch, id);
    this.emit('branch');
  }

  item(id) {
    for (const key of Object.keys(MENUS)) {
      const found = MENUS[key].ITEMS.find((i) => i.id === id);
      if (found) return found;
    }
    return null;
  }

  /* ------------------------------------------- inventario y precio base */
  isOut(id) { return this.stock[id] === false; }
  setStock(id, available) {
    if (available) delete this.stock[id]; else this.stock[id] = false;
    write(K.stock, this.stock);
    this.emit('stock');
  }

  /** Precio base efectivo: override del panel > precio del menú oficial. */
  basePrice(item) {
    if (this.prices[item.id] != null) return this.prices[item.id];
    if (item.price != null) return item.price;
    if (item.variants?.length) return Math.min(...item.variants.map((v) => v.price));
    return null;
  }
  setPrice(id, value) {
    if (value == null || value === '' || Number.isNaN(Number(value))) delete this.prices[id];
    else this.prices[id] = Number(value);
    write(K.prices, this.prices);
    this.emit('prices');
  }

  /**
   * Precio de una variante. Si el panel sobrescribió el precio base, se
   * aplica el mismo delta a la variante para no romper la relación.
   */
  variantPrice(item, variant) {
    if (!variant) return this.basePrice(item);
    const override = this.prices[item.id];
    if (override == null) return variant.price;
    const original = item.price != null ? item.price : Math.min(...item.variants.map((v) => v.price));
    return Math.max(0, Number((variant.price + (override - original)).toFixed(2)));
  }

  /* ------------------------------------------------------------ carrito */
  get cart() { return this.carts[this.branchId] || []; }
  set cart(lines) { this.carts[this.branchId] = lines; write(K.cart, this.carts); }

  get count() { return this.cart.reduce((n, l) => n + l.qty, 0); }
  get subtotal() { return this.cart.reduce((n, l) => n + l.unit * l.qty, 0); }

  add(line) {
    const lines = this.cart.slice();
    const key = (l) => [l.itemId, l.variant || '', (l.adjustments || []).join('|'), (l.note || '').trim()].join('¬');
    const twin = lines.find((l) => key(l) === key(line));
    if (twin) twin.qty += line.qty;
    else lines.push({ ...line, uid: uid() });
    this.cart = lines;
    this.emit('cart');
  }

  setQty(lineId, qty) {
    let lines = this.cart.slice();
    const line = lines.find((l) => l.uid === lineId);
    if (!line) return;
    line.qty = qty;
    if (line.qty <= 0) lines = lines.filter((l) => l.uid !== lineId);
    this.cart = lines;
    this.emit('cart');
  }

  remove(lineId) {
    this.cart = this.cart.filter((l) => l.uid !== lineId);
    this.emit('cart');
  }

  clearCart() { this.cart = []; this.emit('cart'); }

  /* ----------------------------------------------------------- servicio */
  setService(patch) {
    this.service = { ...this.service, ...patch, fields: { ...this.service.fields, ...(patch.fields || {}) } };
    write(K.service, this.service);
    this.emit('service');
  }

  /* ------------------------------------------------------------ pedidos */
  /** Se registra al confirmar por WhatsApp; alimenta el panel de cocina. */
  recordOrder(order) {
    this.orders = [{ ...order, id: uid().toUpperCase().slice(0, 6), at: Date.now(), state: 'nuevo' }, ...this.orders].slice(0, 200);
    write(K.orders, this.orders);
    this.emit('orders');
    return this.orders[0];
  }
  setOrderState(id, state) {
    const o = this.orders.find((x) => x.id === id);
    if (!o) return;
    o.state = state;
    write(K.orders, this.orders);
    this.emit('orders');
  }
  clearOrders() { this.orders = []; write(K.orders, this.orders); this.emit('orders'); }

  /* ------------------------------------------------- configuración del local */
  setConfig(patch) {
    this.config = { ...this.config, ...patch };
    write(K.config, this.config);
    this.emit('config');
  }

  /* ---------------------------------------------------------------- tasa */
  /**
   * Tasa oficial. Se consulta al cargar y se guarda; si la consulta falla se
   * usa la última conocida. Si no hay ninguna, no se inventa: la web enseña
   * solo el precio en dólares y lo dice.
   */
  async cargarTasa() {
    if (this.config.tasaManual) {
      this.tasa = { valor: Number(this.config.tasaManual), fecha: new Date().toISOString(), fuente: 'manual' };
      write(K.tasa, this.tasa);
      this.emit('tasa');
      return this.tasa;
    }
    const fresca = this.tasa && Date.now() - new Date(this.tasa.fecha).getTime() < TASA.refrescarCada;
    if (fresca) return this.tasa;
    try {
      const r = await fetch(TASA.fuente, { cache: 'no-store' });
      if (!r.ok) throw new Error('http ' + r.status);
      const d = await r.json();
      const valor = Number(d.promedio ?? d.venta ?? d.compra);
      if (!valor || Number.isNaN(valor)) throw new Error('sin valor');
      this.tasa = { valor, fecha: d.fechaActualizacion || new Date().toISOString(), fuente: TASA.etiqueta };
      write(K.tasa, this.tasa);
    } catch {
      /* se conserva la última conocida, si la hay */
    }
    this.emit('tasa');
    return this.tasa;
  }

  /** Dólares a bolívares. `null` si todavía no hay tasa. */
  aBs(usd) {
    if (!this.tasa?.valor || usd == null) return null;
    return Math.round(usd * this.tasa.valor * 100) / 100;
  }

  /* ---------------------------------------------------------------- pagos */
  /** Solo se ofrecen los métodos con todos sus datos publicados. */
  metodosDisponibles() {
    return METODOS_PAGO.filter((m) => {
      if (!m.campos.length) return true;                       // efectivo
      const datos = this.config.pagos[m.id] || {};
      return m.campos.every((c) => String(datos[c.id] || '').trim());
    });
  }
  datosPago(id) { return this.config.pagos[id] || {}; }

  /* ---------------------------------------------------------------- envío */
  get anillos() {
    return ENVIO.anillos.map((a) => ({ ...a, precio: this.config.anillos[a.id] ?? a.precio }));
  }
  get maxKm() { return Number(this.config.maxKm ?? ENVIO.maxKm); }

  /** Anillo que corresponde a una distancia, o null si queda fuera de alcance. */
  anilloPara(km) {
    if (km > this.maxKm) return null;
    return this.anillos.find((a) => km <= a.hasta) || null;
  }

  /** Fija la ubicación de entrega y calcula distancia, anillo y precio. */
  setEntrega(lat, lng, direccion = '') {
    const km = Math.round(distanciaKm(ENVIO.origen, { lat, lng }) * 100) / 100;
    const anillo = this.anilloPara(km);
    this.entrega = {
      lat, lng, direccion, km,
      anillo: anillo ? anillo.id : null,
      etiqueta: anillo ? anillo.etiqueta : null,
      precio: anillo ? anillo.precio : null,
      fuera: !anillo
    };
    this.emit('entrega');
    return this.entrega;
  }
  limpiarEntrega() { this.entrega = null; this.emit('entrega'); }

  /** Coste de envío aplicable ahora mismo: 0 si no es delivery. */
  get costeEnvio() {
    if (this.service.mode !== 'delivery') return 0;
    return this.entrega?.precio ?? 0;
  }
  get total() { return this.subtotal + this.costeEnvio; }

  /* --------------------------------------------------- aviso al restaurante */
  /**
   * Un sitio estático no puede avisar al local por su cuenta. Si el
   * restaurante configura un webhook, aquí se le manda la comanda en cuanto
   * el cliente marca que pagó — antes de abrir WhatsApp, que es justo donde
   * alguien puede abandonar el proceso con el pago ya hecho.
   */
  async avisar(pedido) {
    const url = String(this.config.aviso || '').trim();
    if (!/^https:\/\//i.test(url)) return { enviado: false, motivo: 'sin-webhook' };
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
      });
      return { enviado: true };
    } catch (e) {
      return { enviado: false, motivo: String(e.message || e) };
    }
  }
}

export const store = new Store();
export { MENUS, BRANCHES, CONTACT, METODOS_PAGO, ENVIO };
