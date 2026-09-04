/* Se abre un plato, se marcan dos ajustes y se añade al pedido. */
module.exports = {
  nombre: 'plato',
  ruta: '/pedir',
  fotogramas: 200,
  preparar: "document.querySelector('#sedes .venue-pill[data-branch=\"restaurante\"]')?.click(); window.scrollTo(0, 1600)",
  pasos: [
    { en: 10, js: "document.querySelector('[data-open=\"r-fukkatsu\"]').click()" },
    { desde: 48, hasta: 82, durante: "document.querySelector('.modal__body').scrollTop = {t} * 430" },
    { en: 96, js: "document.querySelectorAll('[data-adj]')[1].click()" },
    { en: 118, js: "document.querySelectorAll('[data-adj]')[3].click()" },
    { desde: 134, hasta: 158, durante: "document.querySelector('.modal__body').scrollTop = 430 + {t} * 280" },
    { en: 172, js: "document.querySelector('[data-add]').click()" }
  ]
};
