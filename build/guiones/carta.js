/* La carta, que es el plano que vende.
 *
 * Desde que los platos van en tarjetas de dos en dos, bajar por la carta es
 * pasar por delante de una pared de fotos de comida. Eso es lo que hay que
 * enseñar y es además lo único luminoso que tiene un sitio en negro: los
 * dos anuncios anteriores salían a 19 y a 31 de brillo sobre 255 porque
 * enseñaban carteles, no platos.
 *
 * Dos golpes de pulgar con su pausa en medio, que es como se lee una carta:
 * se baja, se para a mirar algo, y se sigue.
 */
module.exports = {
  nombre: 'carta',
  ruta: '/pedir',
  hora: '20:30',
  fotogramas: 210,
  preparar: `document.querySelector('#sedes .venue-pill[data-branch="restaurante"]')?.click();
    window.scrollTo(0, 250)`,
  pasos: [
    { desde: 10, hasta: 88, durante: 'window.scrollTo(0, 250 + {t} * 1250)' },
    // pausa de 20 fotogramas: el ojo se posa en una fila
    { desde: 108, hasta: 190, durante: 'window.scrollTo(0, 1500 + {t} * 1750)' }
  ]
};
