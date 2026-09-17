/* La portada: el collage deriva solo y la página baja un poco, lo justo para
   que se lea el titular. Primer plano del vídeo de venta. */
module.exports = {
  nombre: 'portada',
  ruta: '/',
  hora: '20:30',
  fotogramas: 105,
  pasos: [
    { desde: 50, hasta: 104, durante: 'window.scrollTo(0, {t} * 140)' }
  ]
};
