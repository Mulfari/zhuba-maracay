/* El cajón del pedido hasta el total, y ahí se corta.
 *
 * No se llega al paso del pago a propósito: los datos publicados hoy son de
 * prueba —ceros y un correo de ejemplo— y un anuncio que enseñe un teléfono
 * de pago móvil falso miente, aunque sea en una esquina y durante medio
 * segundo. Lo que tiene que quedar es que la distancia, el envío y el total
 * salen solos.
 */
module.exports = {
  nombre: 'pedido',
  ruta: '/pedir',
  hora: '20:30',
  fotogramas: 170,
  preparar: `document.querySelector('#sedes .venue-pill[data-branch="restaurante"]')?.click();
    setTimeout(function(){ document.querySelector('[data-open="r-fukkatsu"]').click();
      setTimeout(function(){ document.querySelector('[data-add]').click(); }, 800); }, 800)`,
  esperaPreparar: 4200,
  pasos: [
    { en: 8, js: "document.getElementById('cartPill').click()" },
    { en: 46, js: "document.querySelector('[data-siguiente]').click()" },
    { en: 66, js: "document.querySelector('[data-mode=\"delivery\"]').click()" },
    { en: 84, js: `{var set=function(i,v){var el=document.querySelector('[data-input="'+i+'"]');
        if(el){el.value=v; el.dispatchEvent(new Event('input',{bubbles:true}));}};
        set('nombre','Andrea Pérez'); set('direccion','Av. Las Delicias, Res. Aragua, piso 4');}` },
    { en: 100, js: `(async()=>{const m=await import(new URL('js/store.js', location.href).href);
        m.store.setEntrega(10.2759, -67.5763, 'Avenida Las Delicias, Andrés Bello, Maracay');})()` },
    { desde: 124, hasta: 164, durante: "document.querySelector('.drawer__body').scrollTop = {t} * 620" }
  ]
};
