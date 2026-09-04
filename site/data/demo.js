/**
 * Datos de muestra para enseñar el panel funcionando.
 *
 * Nada de esto es real: los bancos, los teléfonos y las referencias están
 * inventados a propósito y llevan la marca DEMO donde se ven. Se cargan a
 * mano desde /admin y se borran igual; no viajan con la web ni los ve nadie
 * más, porque viven en el almacenamiento de este navegador.
 */

export const CONFIG_DEMO = {
  pagos: {
    'pago-movil': {
      banco: 'Banesco · 0134 (DEMO)',
      telefono: '0412-000 00 00',
      documento: 'J-00000000-0'
    },
    transferencia: {
      banco: 'Banesco · 0134 (DEMO)',
      numero: '0134 0000 0000 0000 0000',
      titular: 'Inversiones ZHUBA C.A. (DEMO)',
      documento: 'J-00000000-0'
    }
  },
  anillos: { a1: 2, a2: 3.5, a3: 5, a4: 7 },
  maxKm: 12,
  aviso: ''
};

/* Los pedidos se escriben con horas relativas para que siempre salgan «de
   hoy»: un panel de demostración con fechas de la semana pasada no enseña
   las métricas del día. */
const haceMin = (m) => Date.now() - m * 60000;

export const PEDIDOS_DEMO = [
  {
    id: 'D4K7QA', at: haceMin(6), state: 'nuevo',
    branch: 'restaurante', branchName: 'ZHUBA Restaurant', mode: 'delivery',
    fields: { nombre: 'Andrea Pérez', direccion: 'Av. Las Delicias, Res. Aragua, piso 4',
      referencia: 'Frente a la panadería', _note: 'Sin cubiertos, gracias' },
    lines: [
      { name: 'Fukkatsu ZHUBA Roll', variant: null, qty: 1, unit: 25.5,
        adjustments: ['Sin cebollín'], note: '' },
      { name: 'Cerveza Polar Pilsen', variant: null, qty: 2, unit: 3.5, adjustments: [], note: '' }
    ],
    subtotal: 32.5, count: 3, envio: 2, total: 34.5,
    entrega: { lat: 10.2759, lng: -67.5763, km: 1.4, anillo: 'a1', etiqueta: 'Hasta 2 km', precio: 2,
      direccion: 'Avenida Las Delicias, Andrés Bello, Maracay' },
    pago: { metodo: 'Pago móvil', metodoId: 'pago-movil', referencia: '004821',
      telefono: '0412-111 22 33', conComprobante: true, enBs: 27766.72,
      tasa: { valor: 804.83, fuente: 'Tasa oficial BCV', fecha: new Date().toISOString() } }
  },
  {
    id: 'M2P9XR', at: haceMin(19), state: 'cocina',
    branch: 'restaurante', branchName: 'ZHUBA Restaurant', mode: 'mesa',
    fields: { mesa: '14' },
    lines: [
      { name: 'Sashimi', variant: 'Salmón', qty: 1, unit: 14.5, adjustments: [], note: '' },
      { name: 'Volcán Okanoba', variant: null, qty: 1, unit: 21.5,
        adjustments: ['Sin picante'], note: 'La salsa aparte, por favor' }
    ],
    subtotal: 36, count: 2, envio: 0, total: 36,
    pago: { metodo: 'Efectivo al recibir', metodoId: 'efectivo', referencia: '',
      telefono: '', conComprobante: false, enBs: 28973.88,
      tasa: { valor: 804.83, fuente: 'Tasa oficial BCV', fecha: new Date().toISOString() } }
  },
  {
    id: 'B7T3LC', at: haceMin(41), state: 'listo',
    branch: 'cafe', branchName: 'ZHUBA Café', mode: 'pickup',
    fields: { nombre: 'Luis Bermúdez', hora: '17:30' },
    lines: [
      { name: 'Barquilla', variant: '2 porciones', qty: 2, unit: 9,
        adjustments: ['Sin sirope'], note: 'Una de pistacho y otra de chocolate' },
      { name: 'Espresso', variant: null, qty: 1, unit: 4, adjustments: [], note: '' }
    ],
    subtotal: 22, count: 3, envio: 0, total: 22,
    pago: { metodo: 'Transferencia', metodoId: 'transferencia', referencia: '9930041',
      telefono: '0424-555 66 77', conComprobante: false, enBs: 17706.26,
      tasa: { valor: 804.83, fuente: 'Tasa oficial BCV', fecha: new Date().toISOString() } }
  },
  {
    id: 'K8W1ZD', at: haceMin(78), state: 'completado',
    branch: 'cafe', branchName: 'ZHUBA Café', mode: 'delivery',
    fields: { nombre: 'María Estévez', direccion: 'Urb. El Castaño, calle 3, quinta Aurora',
      referencia: 'Portón verde', _note: '' },
    lines: [
      { name: 'Bubble Waffle al Gelato', variant: null, qty: 1, unit: 12.5, adjustments: [], note: '' },
      { name: 'Café Latte', variant: null, qty: 2, unit: 5, adjustments: ['Leche sin lactosa'], note: '' }
    ],
    subtotal: 22.5, count: 3, envio: 3.5, total: 26,
    entrega: { lat: 10.2996, lng: -67.5612, km: 3.6, anillo: 'a2', etiqueta: '2 – 4 km', precio: 3.5,
      direccion: 'El Castaño, Maracay' },
    pago: { metodo: 'Pago móvil', metodoId: 'pago-movil', referencia: '771204',
      telefono: '0416-330 12 45', conComprobante: true, enBs: 20925.58,
      tasa: { valor: 804.83, fuente: 'Tasa oficial BCV', fecha: new Date().toISOString() } }
  },
  {
    id: 'R5N6HF', at: haceMin(124), state: 'completado',
    branch: 'restaurante', branchName: 'ZHUBA Restaurant', mode: 'delivery',
    fields: { nombre: 'Jorge Aguilar', direccion: 'Av. Bolívar Norte, edificio Mar, piso 2',
      referencia: '', _note: 'Cumpleaños: si pueden, una velita' },
    lines: [
      { name: 'Sashimi Especial ZHUBA', variant: null, qty: 1, unit: 53.5, adjustments: [], note: '' },
      { name: 'Gin Tonic Freshened', variant: null, qty: 2, unit: 9, adjustments: [], note: '' }
    ],
    subtotal: 71.5, count: 3, envio: 5, total: 76.5,
    entrega: { lat: 10.2451, lng: -67.6042, km: 5.2, anillo: 'a3', etiqueta: '4 – 7 km', precio: 5,
      direccion: 'Av. Bolívar, Maracay' },
    pago: { metodo: 'Zelle', metodoId: 'zelle', referencia: 'ZL-88213',
      telefono: '0414-909 88 12', conComprobante: false, enBs: 61569.50,
      tasa: { valor: 804.83, fuente: 'Tasa oficial BCV', fecha: new Date().toISOString() } }
  }
];

/** Platos que se ven agotados, para que el inventario no salga todo en verde. */
export const AGOTADOS_DEMO = { 'r-volcan': false, 'c-brioche': false };
