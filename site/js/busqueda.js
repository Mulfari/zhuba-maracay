/**
 * El buscador de la carta.
 *
 * Antes miraba si las letras de la búsqueda aparecían en algún sitio del plato,
 * y devolvía lo que encajara en el orden de la carta. Tres cosas salían mal:
 *
 *  · «sushi» devolvía el edamame y las alitas —su categoría se llama
 *    «Aperitivos & Sushi Bar»— y ni un roll, porque ningún roll dice «sushi».
 *  · «ramen» encontraba los Coquitos: su descripción dice «ligeRAMENte».
 *  · «cerveza» ponía cinco cócteles antes que la cerveza.
 *
 * Ahora cada palabra se busca como palabra (o como su comienzo), con las
 * equivalencias de data/busqueda.js, y cada plato suma según dónde encaja:
 * en el nombre vale mucho más que en la descripción. Si una palabra no está
 * en ninguna parte se prueba con la más parecida de la carta, para que
 * «salmom» enseñe salmón.
 *
 * Es una función pura: recibe los platos y la búsqueda, y no toca la página.
 */
import { TAGS } from '../data/modifiers.js';
import { CLAVES_CATEGORIA, SINONIMOS, VACIAS } from '../data/busqueda.js';

export const plano = (t) => String(t ?? '').toLowerCase()
  .normalize('NFD').replace(/\p{Diacritic}/gu, '');

const trocear = (t) => plano(t).split(/[^a-z0-9]+/).filter(Boolean);

/* Dónde encaja una palabra, y cuánto vale. El nombre manda; la categoría es la
   intención («sushi», «postre»); la descripción, un indicio. */
const PESOS = { nombre: 100, categoria: 70, variantes: 55, etiquetas: 50, descripcion: 15 };

const campos = new WeakMap();
/** Las palabras de cada parte del plato. Se calculan una vez por plato. */
function palabrasDe(item) {
  let c = campos.get(item);
  if (!c) {
    c = {
      nombre: trocear(item.name),
      categoria: (CLAVES_CATEGORIA[item.cat] || []).map(plano),
      variantes: trocear((item.variants || []).map((v) => v.name).join(' ')),
      etiquetas: trocear((item.tags || []).map((t) => TAGS[t]?.label || t).join(' ')),
      descripcion: trocear(item.desc)
    };
    campos.set(item, c);
  }
  return c;
}

/* Las palabras cortas tienen que ser la palabra entera: «te» no puede
   encontrar «tempura», ni «pan» el «panko». Las largas valen como comienzo:
   «camaron» encuentra «camarones». */
const encaja = (lista, termino) => lista.some((w) =>
  termino.length <= 3 ? w === termino : w.startsWith(termino));

/** «camarones» → camarones, camaron; «rolls» → rolls, roll. */
function formas(palabra) {
  const f = new Set([palabra]);
  if (palabra.length > 4 && palabra.endsWith('es')) f.add(palabra.slice(0, -2));
  if (palabra.length > 3 && palabra.endsWith('s')) f.add(palabra.slice(0, -1));
  return [...f];
}

/** La palabra y todo lo que en la carta significa lo mismo. */
function terminos(palabra) {
  const t = new Set();
  for (const f of formas(palabra)) {
    t.add(f);
    (SINONIMOS[f] || []).forEach((s) => t.add(s));
  }
  return [...t];
}

/** Cuánto encaja un plato con una palabra de la búsqueda (0 = nada). */
function puntos(item, lista) {
  const c = palabrasDe(item);
  let mejor = 0;
  for (const termino of lista) {
    for (const [campo, peso] of Object.entries(PESOS)) {
      if (peso > mejor && encaja(c[campo], termino)) mejor = peso;
    }
    // la palabra entera en el nombre, un poco por encima de solo su comienzo
    if (c.nombre.includes(termino)) mejor = Math.max(mejor, PESOS.nombre + 10);
  }
  return mejor;
}

function distancia(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previo = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
      previo = tmp;
    }
  }
  return d[b.length];
}

/** La palabra de la carta más parecida a una que no existe («salmom» → salmon). */
function parecida(palabra, items) {
  if (palabra.length < 4) return null;
  const tope = palabra.length >= 7 ? 2 : 1;
  const vocabulario = new Set();
  items.forEach((i) => {
    const c = palabrasDe(i);
    [...c.nombre, ...c.categoria, ...c.descripcion].forEach((w) => { if (w.length >= 4) vocabulario.add(w); });
  });
  Object.keys(SINONIMOS).forEach((w) => vocabulario.add(w));
  let mejor = null, menor = Infinity;
  for (const w of vocabulario) {
    if (Math.abs(w.length - palabra.length) > tope) continue;
    const d = distancia(palabra, w);
    if (d < menor || (d === menor && w.length < mejor.length)) { menor = d; mejor = w; }
  }
  return menor <= tope ? mejor : null;
}

/** Cómo se escribe de verdad una palabra en la carta: «salmon» → «salmón». */
function comoEnLaCarta(palabra, items) {
  for (const i of items) {
    for (const cruda of String(`${i.name} ${i.desc}`).toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
      if (plano(cruda) === palabra) return cruda;
    }
  }
  return palabra;
}

/**
 * Busca en unos platos. Devuelve los que encajan, del más al menos relevante,
 * y la corrección si alguna palabra se cambió por la más parecida.
 * «sin X» deja fuera lo que lleve X: «sin picante», «sin salmón».
 */
export function buscar(items, consulta) {
  const todas = trocear(consulta);
  const quitar = [], poner = [];
  for (let i = 0; i < todas.length; i++) {
    if (todas[i] === 'sin' && todas[i + 1]) { quitar.push(todas[++i]); continue; }
    if (!VACIAS.includes(todas[i])) poner.push(todas[i]);
  }
  if (!poner.length && !quitar.length) return { items, correccion: null };

  let correccion = null;
  const listas = poner.map((palabra) => {
    let lista = terminos(palabra);
    if (!items.some((it) => puntos(it, lista) > 0)) {
      const otra = parecida(palabra, items);
      if (otra) { lista = terminos(otra); correccion = { de: palabra, a: comoEnLaCarta(otra, items) }; }
    }
    return lista;
  });
  const fuera = quitar.map(terminos);

  return {
    correccion,
    items: items
      .map((item, orden) => {
        const parciales = listas.map((l) => puntos(item, l));
        if (parciales.some((p) => p === 0)) return null;           // todas las palabras tienen que estar
        // con «sin» manda la prudencia: fuera también si solo lo menciona la descripción
        if (fuera.some((l) => puntos(item, l) > 0)) return null;
        return { item, orden, total: parciales.reduce((a, b) => a + b, 0) };
      })
      .filter(Boolean)
      .sort((a, b) => b.total - a.total || a.orden - b.orden)
      .map((r) => r.item)
  };
}
