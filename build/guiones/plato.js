/* Un plato: se toca la tarjeta, sube su ficha, se quitan dos cosas y se
 * añade. Es el momento en que el dueño entiende que el cliente pide solo,
 * con los cambios de siempre, sin escribirle a nadie.
 *
 * Los tiempos están apretados a propósito. En el primer montaje la ficha se
 * quedaba cuatro segundos en la lista de casillas: en el vídeo eso eran
 * cuatro segundos de formulario en mitad de un anuncio de comida. Ahora la
 * foto grande aguanta segundo y cuarto, los ajustes pasan en otro segundo y
 * el botón de añadir llega enseguida.
 *
 * El scroll de partida es 1500 porque la tarjeta del Fukkatsu vive en 1752:
 * así el toque cae sobre su foto y se ve de dónde sale la ficha.
 */
module.exports = {
  nombre: 'plato',
  ruta: '/pedir',
  hora: '20:30',
  fotogramas: 125,
  preparar: `document.querySelector('#sedes .venue-pill[data-branch="restaurante"]')?.click();
    window.scrollTo(0, 1500)`,
  pasos: [
    { en: 12, js: "document.querySelector('[data-open=\"r-fukkatsu\"]').click()" },
    { desde: 50, hasta: 68, durante: "document.querySelector('.modal__body').scrollTop = {t} * 430" },
    { en: 74, js: "document.querySelectorAll('[data-adj]')[1].click()" },
    { en: 86, js: "document.querySelectorAll('[data-adj]')[3].click()" },
    { desde: 92, hasta: 106, durante: "document.querySelector('.modal__body').scrollTop = 430 + {t} * 300" },
    { en: 112, js: "document.querySelector('[data-add]').click()" }
  ]
};
