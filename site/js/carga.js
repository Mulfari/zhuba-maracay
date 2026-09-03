/**
 * La entrada: una cortina breve mientras llega lo imprescindible, y fotos
 * que aparecen fundiéndose en vez de dar un salto.
 *
 * Sin esto la página se montaba a la vista: el texto pintaba con una serif
 * de repuesto y a los tres segundos saltaba a la de la casa recomponiendo
 * los renglones, y el mosaico del hero pasaba varios segundos en negro
 * mientras caían las fotos una a una. La cortina no hace la carga más
 * rápida —eso son bytes—; hace que no se vea montarse.
 */

/** Cuánto se espera como mucho antes de descubrir la página igualmente. */
const TOPE = 2500;

export function cortina() {
  const el = document.getElementById('cortina');
  if (!el) return;

  let ido = false;
  const quitar = () => {
    if (ido || !el.isConnected) return;
    ido = true;
    el.classList.add('is-out');
    // Se retira del árbol para que no quede una capa fija sobre los clics.
    setTimeout(() => el.remove(), 700);
  };

  // El tope de verdad lo pone un script en el propio HTML, que arranca con
  // la página y no cuando acaba de bajar este módulo. Aquí queda uno más,
  // por si este código llegara aún más tarde que aquel.
  const tope = setTimeout(quitar, TOPE);

  const fuentes = document.fonts ? document.fonts.ready : Promise.resolve();
  const esperada = (img) => (img.complete && img.naturalWidth
    ? Promise.resolve()
    : new Promise((ok) => {
      img.addEventListener('load', ok, { once: true });
      img.addEventListener('error', ok, { once: true });
    }));
  const fotos = Promise.all(
    Array.from(document.querySelectorAll('img[data-primera]')).map(esperada));

  Promise.all([fuentes, fotos]).then(() => { clearTimeout(tope); quitar(); });
}

/**
 * Cada foto entra fundiéndose cuando termina de decodificar. Solo toca las
 * que ya ha marcado este código: si el JS no llega a correr, las imágenes
 * se ven como siempre en vez de quedarse invisibles.
 */
export function fotosSuaves(raiz = document) {
  raiz.querySelectorAll('img:not([data-suave])').forEach((img) => {
    img.dataset.suave = '1';
    if (img.complete && img.naturalWidth) { img.classList.add('is-cargada'); return; }
    const lista = () => img.classList.add('is-cargada');
    img.addEventListener('load', lista, { once: true });
    img.addEventListener('error', lista, { once: true });
  });
}
