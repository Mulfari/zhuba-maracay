/* El cajón: pedido, entrega con mapa y pago. */
module.exports = {
  nombre: 'pedido',
  ruta: '/pedir',
  fotogramas: 250,
  preparar: `document.querySelector('#sedes .venue-pill[data-branch="restaurante"]')?.click();
    setTimeout(function(){ document.querySelector('[data-open="r-fukkatsu"]').click();
      setTimeout(function(){ document.querySelector('[data-add]').click(); }, 800); }, 800)`,
  esperaPreparar: 4200,
  pasos: [
    { en: 8, js: "document.getElementById('cartPill').click()" },
    { en: 54, js: "document.querySelector('[data-siguiente]').click()" },
    { en: 78, js: "document.querySelector('[data-mode=\"delivery\"]').click()" },
    { en: 96, js: `{var set=function(i,v){var el=document.querySelector('[data-input="'+i+'"]');
        if(el){el.value=v; el.dispatchEvent(new Event('input',{bubbles:true}));}};
        set('nombre','Andrea Pérez'); set('direccion','Av. Las Delicias, Res. Aragua, piso 4');}` },
    { en: 112, js: `(async()=>{const m=await import(new URL('js/store.js', location.href).href);
        m.store.setEntrega(10.2759, -67.5763, 'Avenida Las Delicias, Andrés Bello, Maracay');})()` },
    { desde: 150, hasta: 182, durante: "document.querySelector('.drawer__body').scrollTop = {t} * 540" },
    { en: 200, js: "document.querySelector('[data-siguiente]')?.click()" },
    { en: 226, js: "document.querySelector('[data-metodo=\"pago-movil\"]')?.click()" }
  ]
};
