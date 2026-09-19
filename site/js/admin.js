/**
 * Informe de la web.
 *
 * Cuenta lo que la página ha pedido: cuántos pedidos salieron, de qué casa,
 * por cuánto y de qué. El pedido en sí no pasa por aquí — se va al WhatsApp
 * del local y allí lo trabajan. Esto es el apunte contable, nada más.
 *
 * Las cifras salen del registro compartido si está configurado
 * (`data/remoto.js`); si no, de lo que haya en este navegador. El panel dice
 * cuál de las dos cosas está mirando, porque no significan lo mismo.
 */
import { store, money, bolivares, kilometros, BRANCHES, METODOS_PAGO } from './store.js';
import { listar } from './registro.js';
import { hayRegistro } from '../data/remoto.js';
import { entrar, token, salir } from './sesion.js';
import { PEDIDOS_DEMO } from '../data/demo.js';
import { SERVICE_MODES } from '../data/modifiers.js';
import { montar as montarPuesta } from './puesta.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const PIN = '1108';
const SESSION_KEY = 'zhuba.admin.ok';

let dias = 1;              // 1 = hoy · 7 · 30 · 0 = todo
let sede = 'todas';
let pedidos = [];          // los del periodo, ya filtrados por sede
/* Con el registro conectado, el informe enseña los pedidos reales, que al
   principio son cero. Para enseñarle el panel a alguien hace falta poder
   poner la muestra encima, y quitarla, sin mezclar una cosa con la otra. */
const MUESTRA_KEY = 'zhuba.admin.muestra';
let muestra = sessionStorage.getItem(MUESTRA_KEY) === '1';

/* ------------------------------------------------------------------ acceso */
/* Dos puertas. Sin registro compartido esto es una demostración con los
   pedidos de este navegador, y un código basta. Con registro, lo que hay
   detrás son las ventas del negocio: usuario y contraseña, y ese mismo
   acceso es el que autoriza a leer la tabla. */
function gate() {
  const dentro = hayRegistro() ? !!token() : sessionStorage.getItem(SESSION_KEY) === '1';
  $('#gate').hidden = dentro;
  $('#panel').hidden = !dentro;
  if (dentro) boot();
}

function bindGate() {
  const form = $('#gateForm');
  const error = $('#gateError');

  if (hayRegistro()) {
    $('#gateCampos').innerHTML = `
      <label class="sr-only" for="correo">Correo</label>
      <input id="correo" type="email" autocomplete="username" placeholder="correo" required>
      <label class="sr-only" for="clave">Contraseña</label>
      <input id="clave" type="password" autocomplete="current-password" placeholder="Contraseña" required>`;
    $('#gatePista').textContent = 'Con el usuario del informe.';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.textContent = 'Entrando…';
      const motivo = await entrar($('#correo').value.trim(), $('#clave').value);
      error.textContent = motivo;
      if (!motivo) gate();
    });
  } else {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if ($('#pin').value.trim() === PIN) {
        sessionStorage.setItem(SESSION_KEY, '1');
        error.textContent = '';
        gate();
      } else {
        error.textContent = 'Código incorrecto.';
        $('#pin').value = '';
        $('#pin').focus();
      }
    });
  }

  $('#logout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    salir();
    location.reload();
  });
}

/* ------------------------------------------------------------------ ayudas */
const nombreSede = (id) => BRANCHES.find((b) => b.id === id)?.name || id || '—';
const nombreModo = (id) => SERVICE_MODES.find((m) => m.id === id)?.label || id || '—';
const nombrePago = (id) => METODOS_PAGO.find((m) => m.id === id)?.nombre || (id ? id : 'Sin indicar');
const totalDe = (o) => o.total ?? o.subtotal ?? 0;
const itemsDe = (o) => (o.lines || []).reduce((n, l) => n + l.qty, 0);
const suma = (lista, fn) => lista.reduce((n, o) => n + (fn(o) || 0), 0);

/** La cifra en bolívares debajo de la de dólares, o nada si no hay tasa. */
const enBs = (usd) => {
  const v = store.aBs(usd);
  return v == null ? '' : `<small>${bolivares(v)}</small>`;
};

/** Desde cuándo cuenta el periodo elegido. */
function desde() {
  if (!dias) return 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime() - (dias - 1) * 86400000;
}

const fecha = (ts) => new Date(ts).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' });
// Sin «a. m.»: en una tabla estrecha esas cuatro letras le quitan el sitio
// al nombre de la casa, y la hora se entiende igual.
const hora = (ts) => new Date(ts).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false });

/* ------------------------------------------------------------------ cifras */
function pintarCifras() {
  const n = pedidos.length;
  const facturado = suma(pedidos, totalDe);
  const items = suma(pedidos, itemsDe);

  $('#metrics').innerHTML = `
    <div class="stat"><span>Pedidos</span><b>${n}</b></div>
    <div class="stat stat--ojo"><span>Suman</span><b>${money(facturado)}${enBs(facturado)}</b></div>
    <div class="stat"><span>Pedido medio</span><b>${n ? money(facturado / n) : '—'}</b></div>
    <div class="stat"><span>Platos</span><b>${items}</b></div>`;

  const envios = suma(pedidos, (o) => o.envio);
  const conEnvio = pedidos.filter((o) => o.mode === 'delivery').length;
  $('#metricsMas').textContent = n
    ? `${items} platos en ${n} ${n === 1 ? 'pedido' : 'pedidos'}`
      + ` · ${conEnvio} a domicilio${envios ? ` (${money(envios)} de envíos)` : ''}`
      + ` · ${new Set(pedidos.flatMap((o) => (o.lines || []).map((l) => l.name))).size} platos distintos`
    : 'Todavía no hay pedidos en este periodo.';
}

/* ---------------------------------------------------------- pedidos por día */
/** La serie del gráfico: por horas si el periodo es hoy, por días si no. */
function serie() {
  if (dias === 1) {
    const horas = Array.from({ length: 24 }, (_, h) => ({ etiqueta: h, n: 0 }));
    pedidos.forEach((o) => { horas[new Date(o.at).getHours()].n += 1; });
    return { barras: horas.map((h) => ({ n: h.n, pie: h.etiqueta % 6 === 0 ? `${h.etiqueta}h` : '' })),
             nota: 'por hora' };
  }
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  let n = dias;
  if (!n) {                                  // «todo»: desde el primer pedido
    const primero = Math.min(...pedidos.map((o) => o.at), hoy.getTime());
    n = Math.min(60, Math.max(7, Math.round((hoy.getTime() - primero) / 86400000) + 1));
  }
  const cubos = Array.from({ length: n }, (_, i) => {
    const d = new Date(hoy.getTime() - (n - 1 - i) * 86400000);
    return { dia: d, n: 0 };
  });
  pedidos.forEach((o) => {
    const i = Math.round((new Date(o.at).setHours(0, 0, 0, 0) - cubos[0].dia.getTime()) / 86400000);
    if (i >= 0 && i < cubos.length) cubos[i].n += 1;
  });
  const cada = Math.ceil(cubos.length / 7);
  return {
    barras: cubos.map((c, i) => ({ n: c.n, pie: i % cada === 0 || i === cubos.length - 1 ? fecha(c.dia.getTime()) : '' })),
    nota: `${cubos.length} días`
  };
}

function pintarBarras() {
  const { barras, nota } = serie();
  const tope = Math.max(1, ...barras.map((b) => b.n));
  $('#barrasTitulo').textContent = dias === 1 ? 'Pedidos de hoy' : 'Pedidos por día';
  $('#barrasNota').textContent = nota;
  $('#barras').innerHTML = barras.map((b) => `
    <div class="barra" style="height:${Math.max(2, Math.round((b.n / tope) * 100))}%" title="${b.n}">
      ${b.n ? `<b>${b.n}</b>` : ''}${b.pie ? `<i>${esc(b.pie)}</i>` : ''}
    </div>`).join('');
}

/* --------------------------------------------------------------- repartos */
function reparto(destino, pares) {
  const tope = Math.max(1, ...pares.map(([, n]) => n));
  const total = pares.reduce((n, [, v]) => n + v, 0);
  $(destino).innerHTML = pares.length && total
    ? pares.filter(([, n]) => n).map(([nombre, n]) => `
        <li>
          <span>${esc(nombre)}</span><b>${n}</b>
          <span class="linea"><i style="width:${Math.round((n / tope) * 100)}%"></i></span>
        </li>`).join('')
    : '<li class="muted">Sin datos en este periodo.</li>';
}

function cuenta(clave) {
  const m = new Map();
  pedidos.forEach((o) => { const k = clave(o); m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function pintarRepartos() {
  reparto('#porServicio', cuenta((o) => nombreModo(o.mode)));
  reparto('#porPago', cuenta((o) => nombrePago(o.pago?.metodoId)));
  reparto('#porSede', cuenta((o) => nombreSede(o.branch)));

  const tally = new Map();
  pedidos.forEach((o) => (o.lines || []).forEach((l) => {
    tally.set(l.name, (tally.get(l.name) || 0) + l.qty);
  }));
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  $('#top').innerHTML = top.length
    ? top.map(([nombre, n], i) => `<li><span class="rank">${i + 1}</span>${esc(nombre)}<b>${n}</b></li>`).join('')
    : '<li class="muted">Sin pedidos en este periodo.</li>';
}

/* ------------------------------------------------------- últimos pedidos */
function pintarLista() {
  const ultimos = [...pedidos].sort((a, b) => b.at - a.at).slice(0, 40);
  $('#listaNota').textContent = pedidos.length > ultimos.length
    ? `${ultimos.length} de ${pedidos.length}` : '';
  $('#lista').innerHTML = ultimos.length
    ? ultimos.map((o) => `
      <tr>
        <td>
          <b>${esc(nombreSede(o.branch))}<small>${esc(o.id || '')} · ${
            esc(nombreModo(o.mode))}${o.entrega?.km != null ? ` · ${kilometros(o.entrega.km)}` : ''}</small></b>
        </td>
        <td class="num"><span class="muted">${fecha(o.at)} ${hora(o.at)}</span></td>
        <td class="num solo-ancho"><span class="muted">${itemsDe(o)} pl.</span></td>
        <td class="num"><b>${money(totalDe(o))}<small>${esc(nombrePago(o.pago?.metodoId))}</small></b></td>
      </tr>`).join('')
    : '<tr><td class="muted">Sin pedidos en este periodo.</td></tr>';
}

/* --------------------------------------------------------------- el origen */
function pintarOrigen(origen, error) {
  const el = $('#origen');
  el.classList.toggle('is-compartido', origen === 'compartido');
  el.classList.toggle('is-error', origen === 'error');
  el.classList.toggle('is-muestra', origen === 'muestra');
  const texto = origen === 'muestra'
    ? 'Datos de muestra · inventados, no son pedidos de la web'
    : origen === 'sin-sesion'
    ? 'Sesión caducada · vuelve a entrar para ver el registro compartido'
    : origen === 'compartido'
    ? 'Registro compartido · todos los pedidos de la web'
    : origen === 'error'
      ? `No se pudo leer el registro (${error}) · enseñando solo este dispositivo`
      : 'Solo este dispositivo · el registro compartido no está configurado';
  el.querySelector('span').textContent = texto;
}

/* ------------------------------------------------------------------ pintar */
async function pintar() {
  const locales = store.orders.filter((o) => o.at >= desde());
  const { origen, error, pedidos: todos } = muestra
    ? { origen: 'muestra', pedidos: locales }
    : await listar(desde(), locales);
  pedidos = todos.filter((o) => sede === 'todas' || o.branch === sede);
  pintarOrigen(origen, error);
  pintarCifras();
  pintarBarras();
  pintarRepartos();
  pintarLista();
}

/* -------------------------------------------------------------------- boot */
/* ------------------------------------------------------------------ vistas */
/* El informe es lo de todos los días. La puesta en marcha se abre dos veces
   y se cierra para siempre, pero mientras queden datos de prueba publicados
   tiene que verse al entrar: de ahí la cifra roja en la pestaña. */
function vistas() {
  const nav = $('#vistas');
  const badge = $('#pmBadge');

  const refrescarBadge = ({ faltan }) => {
    badge.hidden = faltan.length <= 0;
    badge.textContent = String(faltan.length);
    badge.title = `${faltan.length} datos por confirmar con el local`;
  };

  const ver = (cual) => {
    $('#vistaInforme').hidden = cual !== 'informe';
    $('#vistaPuesta').hidden = cual !== 'puesta';
    // El periodo solo manda sobre el informe: en la otra vista estorba.
    $('#periodo').hidden = cual !== 'informe';
    $$('#vistas button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.vista === cual)));
  };

  nav.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-vista]');
    if (b) ver(b.dataset.vista);
  });

  montarPuesta($('#puesta'), refrescarBadge);
  ver('informe');
}

function boot() {
  vistas();
  $('#sede').innerHTML = `<option value="todas">Las dos casas</option>`
    + BRANCHES.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
  $('#sede').addEventListener('change', (e) => { sede = e.target.value; pintar(); });

  $('#periodo').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-dias]');
    if (!b) return;
    dias = Number(b.dataset.dias);
    $$('#periodo button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    pintar();
  });

  /* ---------------------------------------------------------- demostración */
  const estadoDemo = () => {
    const n = store.orders.length;
    $('#demoEstado').textContent = n
      ? `Hay ${n} ${n === 1 ? 'pedido' : 'pedidos'} guardados en este navegador.`
      : 'No hay nada guardado en este navegador.';
  };

  const ponerMuestra = (si) => {
    muestra = si;
    if (si) sessionStorage.setItem(MUESTRA_KEY, '1'); else sessionStorage.removeItem(MUESTRA_KEY);
  };

  $('#demoCargar').addEventListener('click', () => {
    store.orders = [...PEDIDOS_DEMO];
    localStorage.setItem('zhuba.orders.v1', JSON.stringify(store.orders));
    ponerMuestra(true);
    estadoDemo(); pintar();
  });

  $('#demoBorrar').addEventListener('click', () => {
    store.clearOrders();
    ponerMuestra(false);
    estadoDemo(); pintar();
  });

  $('#clearOrders').addEventListener('click', () => {
    if (!confirm('¿Borrar los pedidos guardados en este navegador?')) return;
    store.clearOrders();
    estadoDemo(); pintar();
  });

  estadoDemo();
  // La tasa hace falta para enseñar los bolívares debajo de los dólares.
  store.cargarTasa().finally(pintar);
  // Si el registro es compartido, otro teléfono puede pedir mientras miras.
  if (hayRegistro()) setInterval(pintar, 60000);
}

bindGate();
gate();
