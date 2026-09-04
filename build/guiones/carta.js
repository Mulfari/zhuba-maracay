/* Recorrido por la carta: baja, se detiene a mirar y sigue. */
module.exports = {
  nombre: 'carta',
  ruta: '/pedir',
  fotogramas: 150,
  preparar: "document.querySelector('#sedes .venue-pill[data-branch=\"restaurante\"]')?.click()",
  pasos: [
    { desde: 4, hasta: 68, durante: "window.scrollTo(0, {t} * 1150)" },
    { desde: 92, hasta: 148, durante: "window.scrollTo(0, 1150 + {t} * 950)" }
  ]
};
