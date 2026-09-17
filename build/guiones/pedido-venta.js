/* El pedido de punta a punta, para el vídeo de venta: se escribe «salmon»,
   se marca un ajuste, se añade el plato, y en la entrega «Usar mi ubicación» pone la chincheta y
   calcula distancia y envío solos. La ubicación es fija (3,6 km del local)
   para que el vídeo sea el mismo en cada grabación. En el formulario, solo un
   nombre de pila cualquiera; ni apellidos ni teléfono de nadie. */
const escribir = (texto) => `(function(){var i=document.getElementById('buscar');
  i.value=${JSON.stringify(texto)}; i.dispatchEvent(new Event('input',{bubbles:true}));})()`;

module.exports = {
  nombre: 'pedido-venta',
  ruta: '/pedir',
  fotogramas: 330,
  preparar: `document.querySelector('#sedes .venue-pill[data-branch="restaurante"]')?.click();
    window.scrollTo(0, 0);
    navigator.geolocation.getCurrentPosition = function (ok) {
      ok({ coords: { latitude: 10.2442, longitude: -67.6069, accuracy: 18 } });
    };`,
  pasos: [
    // buscar
    { en: 8, js: "document.getElementById('buscar').focus()" },
    { en: 14, js: escribir('s') },
    { en: 18, js: escribir('sa') },
    { en: 22, js: escribir('sal') },
    { en: 26, js: escribir('salm') },
    { en: 30, js: escribir('salmo') },
    { en: 34, js: escribir('salmon') },
    { en: 40, js: "document.getElementById('buscar').blur()" },
    // añadir los Coquitos de Salmón
    { en: 78, js: `(function(){var f=[].slice.call(document.querySelectorAll('.row'))
        .find(function(r){return /Coquitos de Salm/.test(r.textContent);});
      if (f) f.querySelector('.row__add').click();})()` },
    // se marca un ajuste: el plato se personaliza, sin recargo
    { en: 100, js: "document.querySelectorAll('.modal.is-open [data-adj]')[1]?.click()" },
    { en: 122, js: "document.querySelector('.modal.is-open .btn--solid')?.click()" },
    // al cajón y a la entrega
    { en: 156, js: "document.getElementById('cartPill').click()" },
    { en: 196, js: "document.querySelector('[data-siguiente]')?.click()" },
    { en: 214, js: "document.querySelector('[data-mode=\"delivery\"]')?.click()" },
    // la ubicación del cliente: chincheta, distancia y envío
    // un nombre de pila cualquiera: sin él, el pie del cajón avisa «falta nombre»
    { en: 228, js: `(function(){var el=document.querySelector('[data-input="nombre"]');
        if(el){el.value='Ana'; el.dispatchEvent(new Event('input',{bubbles:true}));}})()` },
    { en: 238, js: "document.querySelector('[data-geo]')?.click()" }
  ]
};
