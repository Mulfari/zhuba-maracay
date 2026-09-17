/* Las dos casas: el título, el restaurante con sus fotos y horario, y el
   café debajo. Medido a 390×844: título a 2833 px, restaurante a 3097, café
   a 3851. */
module.exports = {
  nombre: 'casas',
  ruta: '/',
  hora: '20:30',
  fotogramas: 165,
  preparar: 'window.scrollTo(0, 2760)',
  pasos: [
    { desde: 36, hasta: 96, durante: 'window.scrollTo(0, 2760 + {t} * 320)' },
    { desde: 118, hasta: 164, durante: 'window.scrollTo(0, 3080 + {t} * 760)' }
  ]
};
