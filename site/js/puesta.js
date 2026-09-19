/**
 * La puesta en marcha: la lista de lo que falta preguntarle al local.
 *
 * Vive en el panel porque ahí es donde se sienta el dueño, y porque el propio
 * informe es el sitio natural para enterarse de que la web todavía cobra con
 * un teléfono de mentira.
 *
 * Dónde se guarda lo que se rellena, y por qué en dos sitios:
 *
 *  · En este navegador, siempre. Es lo que hace que rellenar media lista un
 *    martes y volver el jueves funcione, aunque no haya red.
 *  · En Supabase, si se entró con el usuario del informe. Sin esto, contestar
 *    desde el teléfono del dueño y leerlo desde el portátil no funcionaría, y
 *    esa es justo la situación en la que se usa: uno pregunta, el otro apunta.
 *
 * Lo remoto manda cuando existe y es más reciente. Si la tabla no está creada
 * —`supabase/ajustes.sql`— nada falla: se queda en local y lo dice.
 *
 * Lo que aquí se rellena **no configura la web**. La web lee sus datos del
 * código y se despliega; esto es el recado. Por eso el botón que importa es
 * el de copiar: saca los valores agrupados por el archivo donde van.
 */
import { FICHAS, GRUPOS, porGrupo } from '../data/puesta.js';
import { REMOTO, hayRegistro } from '../data/remoto.js';
import { token } from './sesion.js';

const CLAVE_LOCAL = 'zhuba.puesta.v1';
const CLAVE_FILA = 'puesta-en-marcha';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const vacio = () => ({ version: 1, at: null, fichas: {} });

/* ------------------------------------------------------------- guardado */

function leerLocal() {
  try { return JSON.parse(localStorage.getItem(CLAVE_LOCAL) || 'null') || vacio(); }
  catch { return vacio(); }
}
function escribirLocal(estado) {
  try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify(estado)); } catch { /* sin sitio */ }
}

const cabeceras = () => {
  const t = token();
  return t ? { apikey: REMOTO.clave, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : null;
};

/** Lo guardado en el registro compartido, o null si no hay o no se puede. */
async function leerRemoto() {
  const h = cabeceras();
  if (!hayRegistro() || !h) return null;
  try {
    const r = await fetch(
      `${REMOTO.url}/rest/v1/ajustes?clave=eq.${CLAVE_FILA}&select=valor,actualizado`,
      { headers: h }
    );
    if (!r.ok) return null;             // la tabla puede no existir todavía
    const [fila] = await r.json();
    return fila?.valor || null;
  } catch { return null; }
}

/** Sube el estado entero. Dispara y se olvida: perder el viaje no pierde nada. */
async function escribirRemoto(estado) {
  const h = cabeceras();
  if (!hayRegistro() || !h) return false;
  try {
    const r = await fetch(`${REMOTO.url}/rest/v1/ajustes?on_conflict=clave`, {
      method: 'POST',
      headers: { ...h, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ clave: CLAVE_FILA, valor: estado, actualizado: new Date().toISOString() })
    });
    return r.ok;
  } catch { return false; }
}

/* --------------------------------------------------------------- cuentas */

const estaLista = (estado, id) => estado.fichas[id]?.estado === 'listo';

export function cuenta(estado) {
  const listas = FICHAS.filter((f) => estaLista(estado, f.id));
  const faltan = FICHAS.filter((f) => !estaLista(estado, f.id));
  return {
    total: FICHAS.length,
    listas: listas.length,
    faltan,
    urgentes: faltan.filter((f) => f.urgencia === 'alta').length
  };
}

/* ----------------------------------------------------------------- vista */

const CHIP = {
  alta: { texto: 'Bloquea', clase: 'pm-u pm-u--alta' },
  media: { texto: 'Importante', clase: 'pm-u pm-u--media' },
  baja: { texto: 'Mejora', clase: 'pm-u pm-u--baja' }
};

function campoHTML(ficha, campo, valor) {
  const nombre = `${ficha.id}.${campo.id}`;
  if (campo.tipo === 'opciones') {
    const puestos = Array.isArray(valor) ? valor : [];
    return `
    <fieldset class="pm-ops">
      <legend>${esc(campo.etiqueta)}</legend>
      ${campo.opciones.map((o) => `
        <label><input type="checkbox" name="${esc(nombre)}" value="${esc(o)}"
          ${puestos.includes(o) ? 'checked' : ''}> ${esc(o)}</label>`).join('')}
    </fieldset>`;
  }
  const etiqueta = `<span>${esc(campo.etiqueta)}</span>`;
  if (campo.tipo === 'area') {
    return `<label class="pm-campo">${etiqueta}
      <textarea name="${esc(nombre)}" rows="2" placeholder="${esc(campo.ejemplo || '')}">${esc(valor || '')}</textarea>
    </label>`;
  }
  const tipo = { numero: 'number', email: 'email', tel: 'tel' }[campo.tipo] || 'text';
  const paso = campo.tipo === 'numero' ? ' step="any"' : '';
  return `<label class="pm-campo">${etiqueta}
    <input type="${tipo}"${paso} name="${esc(nombre)}" value="${esc(valor ?? '')}"
      placeholder="${esc(campo.ejemplo || '')}">
  </label>`;
}

/** Lo contestado, en una línea, para cuando la ficha está cerrada. */
function resumen(ficha, guardado) {
  if (!guardado) return '';
  if (guardado.confirmado) return ficha.confirmable || 'Confirmado';
  const partes = ficha.campos
    .map((c) => {
      const v = guardado.valores?.[c.id];
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) return null;
      return `${c.etiqueta}: ${Array.isArray(v) ? v.join(', ') : v}`;
    })
    .filter(Boolean);
  return partes.join(' · ') || 'Contestado';
}

/* Cerrada, la ficha enseña el porqué recortado a dos líneas; abierta, entero
   y una sola vez. Antes salía arriba cortado y abajo completo, y era la
   misma frase dos veces. */
function fichaHTML(ficha, estado, abierta) {
  const g = estado.fichas[ficha.id];
  const lista = g?.estado === 'listo';
  const chip = CHIP[ficha.urgencia];

  return `
  <article class="pm-ficha${lista ? ' is-lista' : ''}" data-ficha="${ficha.id}">
    <button class="pm-cab" type="button" data-abrir="${ficha.id}" aria-expanded="${abierta}">
      <i class="pm-punto" aria-hidden="true"></i>
      <span class="pm-cab__txt">
        <b>${esc(ficha.titulo)}</b>
        ${abierta ? '' : lista
          ? `<em>${esc(resumen(ficha, g))}</em>`
          : `<em class="pm-porque">${esc(ficha.porque)}</em>`}
      </span>
      ${lista ? '<span class="pm-listo">Listo</span>' : `<span class="${chip.clase}">${chip.texto}</span>`}
    </button>

    ${abierta ? `
    <form class="pm-cuerpo" data-form="${ficha.id}">
      <p class="pm-porque pm-porque--abierto">${esc(ficha.porque)}</p>
      <p class="pm-pregunta">${esc(ficha.pregunta)}</p>
      ${ficha.nota ? `<p class="pm-nota">${esc(ficha.nota)}</p>` : ''}
      <div class="pm-campos">
        ${ficha.campos.map((c) => campoHTML(ficha, c, g?.valores?.[c.id])).join('')}
      </div>
      <p class="pm-destino">Va en <code>${esc(ficha.destino)}</code></p>
      <div class="pm-botones">
        <button class="btn btn--sm btn--solid" type="submit">Guardar</button>
        ${ficha.confirmable
          ? `<button class="btn btn--sm btn--ghost" type="button" data-confirmar="${ficha.id}">${esc(ficha.confirmable)}</button>`
          : ''}
        ${lista ? `<button class="btn btn--sm btn--ghost" type="button" data-reabrir="${ficha.id}">Volver a dejarlo pendiente</button>` : ''}
      </div>
    </form>` : ''}
  </article>`;
}

function vistaHTML(estado, abierta, nube) {
  const c = cuenta(estado);
  const pct = Math.round((c.listas / c.total) * 100);

  const aviso = c.faltan.length === 0
    ? 'Todo contestado. Queda pasar los datos al código y desplegar.'
    : c.urgentes > 0
      ? `Faltan <b>${c.urgentes}</b> que impiden cobrar o que hoy publican un dato falso.`
      : `Faltan <b>${c.faltan.length}</b>, ninguna urgente.`;

  return `
  <div class="pm-barra">
    <div class="pm-barra__cifra">
      <b>${c.listas}</b><span>de ${c.total} contestadas</span>
    </div>
    <div class="pm-progreso"><i style="width:${pct}%"></i></div>
    <p class="pm-aviso">${aviso}</p>
    <p class="pm-nube ${nube.clase}"><i></i>${esc(nube.texto)}</p>
  </div>

  ${GRUPOS.map((grupo) => {
    const fichas = porGrupo(grupo.id);
    const hechas = fichas.filter((f) => estaLista(estado, f.id)).length;
    return `
    <section class="pm-grupo">
      <h3>${esc(grupo.titulo)} <span>${hechas} de ${fichas.length}</span></h3>
      <p class="pm-grupo__pie">${esc(grupo.pie)}</p>
      ${fichas.map((f) => fichaHTML(f, estado, abierta === f.id)).join('')}
    </section>`;
  }).join('')}

  <div class="pm-salidas">
    <button class="btn btn--sm btn--solid" type="button" data-copiar="falta">
      Copiar lo que falta, para pedírselo
    </button>
    <button class="btn btn--sm btn--ghost" type="button" data-copiar="hecho">
      Copiar lo contestado, para el desarrollador
    </button>
    <p class="pm-copiado" id="pmCopiado" hidden></p>
  </div>`;
}

/* -------------------------------------------------------------- recados */

/** El mensaje que se le manda al local con lo que falta. */
export function textoPendiente(estado) {
  const { faltan } = cuenta(estado);
  if (!faltan.length) return 'No falta nada por preguntar.';
  const orden = { alta: 0, media: 1, baja: 2 };
  const linea = (f, i) => `${i + 1}. ${f.titulo}\n   ${f.pregunta}`;
  return ['Hola. Para terminar de encender la web faltan estos datos:', '']
    .concat([...faltan].sort((a, b) => orden[a.urgencia] - orden[b.urgencia]).map(linea))
    .concat(['', 'Con esto queda lista para cobrar.'])
    .join('\n');
}

/** Lo contestado, agrupado por el archivo donde hay que ponerlo. */
export function textoHecho(estado) {
  const hechas = FICHAS.filter((f) => estaLista(estado, f.id));
  if (!hechas.length) return 'Todavía no hay nada contestado.';

  const porDestino = new Map();
  for (const f of hechas) {
    if (!porDestino.has(f.destino)) porDestino.set(f.destino, []);
    porDestino.get(f.destino).push(f);
  }

  const bloques = [...porDestino].map(([destino, fichas]) => {
    const cuerpo = fichas.map((f) => {
      const g = estado.fichas[f.id];
      if (g.confirmado) return `  ${f.titulo}: ${f.confirmable}`;
      const vals = f.campos
        .map((c) => {
          const v = g.valores?.[c.id];
          if (v == null || v === '' || (Array.isArray(v) && !v.length)) return null;
          return `    ${c.etiqueta}: ${Array.isArray(v) ? v.join(', ') : v}`;
        })
        .filter(Boolean);
      return `  ${f.titulo}:\n${vals.join('\n') || '    (sin valores)'}`;
    }).join('\n');
    return `${destino}\n${cuerpo}`;
  });

  return [`PUESTA EN MARCHA · ZHUBA · ${new Date().toLocaleDateString('es-VE')}`, '']
    .concat(bloques.join('\n\n'))
    .concat(['', 'Recordatorio: esto no configura la web. Hay que ponerlo en el código y desplegar.'])
    .join('\n');
}

/* ---------------------------------------------------------------- montaje */

/**
 * Pinta la lista dentro de `raiz`. `alCambiar` se llama con la cuenta cada
 * vez que se contesta algo: la pestaña lleva el número de lo que falta y
 * tiene que bajar en el momento, no la próxima vez que alguien la mire.
 */
export async function montar(raiz, alCambiar = () => {}) {
  let estado = leerLocal();
  let abierta = null;
  let nube = hayRegistro() && token()
    ? { clase: 'is-cargando', texto: 'Buscando lo guardado…' }
    : { clase: '', texto: 'Guardado solo en este navegador.' };

  const pintar = () => {
    raiz.innerHTML = vistaHTML(estado, abierta, nube);
    alCambiar(cuenta(estado));
  };

  const guardar = async () => {
    estado.at = new Date().toISOString();
    escribirLocal(estado);
    if (hayRegistro() && token()) {
      const ok = await escribirRemoto(estado);
      nube = ok
        ? { clase: 'is-compartido', texto: 'Guardado para todo el equipo.' }
        : { clase: 'is-error', texto: 'Guardado aquí. No se pudo subir: falta crear la tabla «ajustes».' };
      pintar();
    }
  };

  pintar();

  // Lo remoto manda si es más nuevo: uno pregunta desde el teléfono y el otro
  // apunta desde el portátil, y el que llega después no debe pisar al primero.
  const remoto = await leerRemoto();
  if (remoto) {
    const masNuevo = !estado.at || (remoto.at && remoto.at > estado.at);
    if (masNuevo) { estado = remoto; escribirLocal(estado); }
    nube = { clase: 'is-compartido', texto: 'Al día con el registro compartido.' };
    pintar();
  } else if (hayRegistro() && token()) {
    nube = { clase: '', texto: 'Guardado en este navegador. Para compartirlo, crea la tabla «ajustes».' };
    pintar();
  }

  raiz.addEventListener('click', (e) => {
    const cab = e.target.closest('[data-abrir]');
    if (cab) { abierta = abierta === cab.dataset.abrir ? null : cab.dataset.abrir; pintar(); return; }

    const conf = e.target.closest('[data-confirmar]');
    if (conf) {
      const id = conf.dataset.confirmar;
      estado.fichas[id] = { estado: 'listo', confirmado: true, valores: {}, at: new Date().toISOString() };
      abierta = null; pintar(); guardar(); return;
    }

    const re = e.target.closest('[data-reabrir]');
    if (re) {
      delete estado.fichas[re.dataset.reabrir];
      pintar(); guardar(); return;
    }

    const copiar = e.target.closest('[data-copiar]');
    if (copiar) {
      const texto = copiar.dataset.copiar === 'falta' ? textoPendiente(estado) : textoHecho(estado);
      const aviso = raiz.querySelector('#pmCopiado');
      navigator.clipboard?.writeText(texto).then(
        () => { aviso.hidden = false; aviso.textContent = 'Copiado. Ya se puede pegar.'; },
        () => { aviso.hidden = false; aviso.textContent = texto; }
      );
    }
  });

  raiz.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    const ficha = FICHAS.find((f) => f.id === form.dataset.form);
    const datos = new FormData(form);
    const valores = {};
    for (const campo of ficha.campos) {
      const nombre = `${ficha.id}.${campo.id}`;
      if (campo.tipo === 'opciones') valores[campo.id] = datos.getAll(nombre);
      else {
        const v = String(datos.get(nombre) ?? '').trim();
        if (v) valores[campo.id] = v;
      }
    }
    const algo = Object.values(valores).some((v) => (Array.isArray(v) ? v.length : v));
    estado.fichas[ficha.id] = algo
      ? { estado: 'listo', confirmado: false, valores, at: new Date().toISOString() }
      : { estado: 'pendiente', confirmado: false, valores, at: new Date().toISOString() };
    abierta = algo ? null : ficha.id;
    pintar();
    guardar();
  });
}
