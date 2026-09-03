/**
 * Opciones de personalización, etiquetas dietéticas y modos de servicio.
 * Los "ajustes de cocina" no llevan recargo: son preferencias de preparación,
 * no extras con precio. El menú oficial de ZHUBA no publica tarifas de extras,
 * así que aquí no se inventa ninguna.
 */

/** Etiquetas tal como las declara el menú digital oficial. */
export const TAGS = {
  picante:     { label: 'Picante',            icon: '🌶️', kind: 'diet' },
  vegano:      { label: 'Vegano',             icon: '🌱', kind: 'diet' },
  vegetariano: { label: 'Vegetariano',        icon: '🥬', kind: 'diet' },
  organico:    { label: 'Orgánico',           icon: '✦',  kind: 'diet' },
  gluten:      { label: 'Gluten',             icon: '',   kind: 'allergen' },
  lactosa:     { label: 'Lácteos',            icon: '',   kind: 'allergen' },
  crustaceos:  { label: 'Crustáceos',         icon: '',   kind: 'allergen' },
  moluscos:    { label: 'Moluscos',           icon: '',   kind: 'allergen' },
  pescados:    { label: 'Pescado',            icon: '',   kind: 'allergen' },
  huevos:      { label: 'Huevo',              icon: '',   kind: 'allergen' },
  cacahuetes:  { label: 'Cacahuete',          icon: '',   kind: 'allergen' },
  fcascara:    { label: 'Frutos de cáscara',  icon: '',   kind: 'allergen' },
  soja:        { label: 'Soja',               icon: '',   kind: 'allergen' },
  gsesamo:     { label: 'Sésamo',             icon: '',   kind: 'allergen' }
};

/* Ajustes por familia. Sin costo adicional.
   Cada familia dice también quién la prepara y con qué ejemplo: a un gelato
   no lo hace «la cocina», y «salsa aparte, sin cebollín» no le dice nada a
   quien está pidiendo un helado. */
export const AJUSTES = {
  barra_fria: {
    quien: 'la cocina',
    ejemplo: 'Ej. salsa aparte, sin cebollín, alergia a los frutos secos',
    opciones: ['Sin picante', 'Salsa spicy aparte', 'Sin cebollín', 'Sin queso crema',
      'Sin aguacate', 'Extra wasabi', 'Extra jengibre', 'Sin sésamo']
  },
  wok: {
    quien: 'la cocina',
    ejemplo: 'Ej. poca sal, sin picante, la salsa aparte',
    opciones: ['Sin picante', 'Poca sal', 'Sin cebolla', 'Salsa aparte',
      'Vegetales bien crocantes', 'Sin salsa de soya']
  },
  panaderia: {
    quien: 'la cocina',
    ejemplo: 'Ej. bien tostado, sin cebolla, cortado por la mitad',
    opciones: ['Sin cebolla', 'Sin picante', 'Salsa aparte', 'Bien tostado', 'Para llevar']
  },
  coctel: {
    quien: 'la barra',
    ejemplo: 'Ej. sin hielo, menos dulce, tráelo con el postre',
    opciones: ['Sin hielo', 'Menos dulce', 'Copa escarchada', 'Sin garnish']
  },
  cafe: {
    quien: 'la barra',
    ejemplo: 'Ej. leche sin lactosa, sin azúcar, poco hielo',
    opciones: ['Leche sin lactosa', 'Sin azúcar', 'Extra caliente', 'Doble shot', 'Para llevar']
  },
  gelato: {
    // El sabor no está en la carta y hay que decirlo: la barquilla se sirve
    // «con uno o dos sabores», así que el ejemplo lo pide lo primero.
    quien: 'la heladería',
    ejemplo: 'Ej. qué sabores quieres, sin sirope, es para regalo',
    opciones: ['Sin crema chantilly', 'Extra topping', 'Sin sirope', 'Para llevar']
  },
  pasteleria: {
    quien: 'la pastelería',
    ejemplo: 'Ej. sin sirope, con velita, es para regalo',
    opciones: ['Sin crema chantilly', 'Extra topping', 'Sin sirope', 'Para llevar']
  }
};

/** Qué familia de ajustes corresponde a cada categoría de la carta. */
export const ADJUSTMENT_MAP = {
  aperitivos: 'barra_fria', firma: 'barra_fria', tempura: 'barra_fria',
  tradicionales: 'barra_fria', sashimi: 'barra_fria', crudos: 'barra_fria',
  wok: 'wok', barra: 'coctel',
  gelato: 'gelato', pasteleria: 'pasteleria',
  paninis: 'panaderia', schiacciatas: 'panaderia', hojaldre: 'panaderia',
  calientes: 'cafe', frias: 'cafe'
};

export const ADJUSTMENT_NOTE =
  'Estos ajustes no tienen recargo publicado. Si tu petición implica un extra, te lo confirmamos al recibir el pedido.';

/** Modos de servicio. Los campos se renderizan desde aquí, no desde el HTML. */
export const SERVICE_MODES = [
  {
    id: 'mesa', label: 'En mesa', icon: 'table',
    hint: 'Ya estás en el salón: pásanos tu pedido.',
    fields: [{ id: 'mesa', label: 'Número de mesa', type: 'text', placeholder: 'Ej. 14', required: true }]
  },
  {
    id: 'pickup', label: 'Pick-up', icon: 'bag',
    hint: 'Lo preparamos y lo retiras en el 17 de Calle Los Clubes.',
    fields: [
      { id: 'nombre', label: 'Nombre de quien retira', type: 'text', placeholder: 'Ej. Andrea', required: true },
      { id: 'hora', label: 'Hora estimada', type: 'time', required: true }
    ]
  },
  {
    id: 'delivery', label: 'Delivery', icon: 'moped',
    hint: 'Marca en el mapa a dónde lo llevamos: el envío se calcula por distancia.',
    fields: [
      { id: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej. Andrea', required: true },
      { id: 'direccion', label: 'Dirección', type: 'text', placeholder: 'Calle, edificio o quinta, piso', required: true },
      { id: 'referencia', label: 'Punto de referencia', type: 'text', placeholder: 'Opcional', required: false }
    ]
  }
];

/** Estados del panel de cocina (KDS). */
export const ORDER_STATES = [
  { id: 'nuevo',      label: 'Nuevo',      color: '#D6A050' },
  { id: 'cocina',     label: 'En cocina',  color: '#C0442C' },
  { id: 'listo',      label: 'Listo',      color: '#6E8B72' },
  { id: 'completado', label: 'Completado', color: '#6B6155' }
];
