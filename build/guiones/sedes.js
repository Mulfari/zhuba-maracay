/* La portada y el cambio de sede: cambia la temperatura de todo el sitio. */
module.exports = {
  nombre: 'sedes',
  ruta: '/',
  fotogramas: 130,
  pasos: [
    { desde: 4, hasta: 52, durante: "window.scrollTo(0, {t} * 250)" },
    { en: 70, js: "document.querySelector('.hero__panel .venue-pill[data-branch=\"cafe\"]')?.click()" }
  ]
};
