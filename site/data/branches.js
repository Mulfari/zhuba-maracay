/**
 * Sedes / venues del complejo gastronómico ZHUBA.
 * Datos verificados: ficha de Google Maps, zhubarestaurant.com y los menús
 * digitales oficiales (app-menuqr.web.app, ids `zhuba1108` y `zhubacafe`).
 *
 * Para añadir una sede nueva basta con agregar un objeto a este array:
 * toda la UI (selector, WhatsApp, mapa, horarios, panel de cocina) se enlaza
 * dinámicamente a la sede activa. No hay nada codificado en la vista.
 */
export const BRANCHES = [
  {
    id: 'restaurante',
    name: 'ZHUBA Restaurant',
    short: 'Restaurante',
    kicker: 'Cocina asiática · Nikkei · Thai',
    tagline: 'Donde cada plato cuenta una historia y cada detalle refleja nuestro buen gusto.',
    menu: 'restaurante',
    phone: '+58 412-4554207',
    phoneHref: 'tel:+584124554207',
    // wa.me con número: admite mensaje precargado (ticket de cocina)
    whatsapp: '584124554207',
    whatsappDirect: 'https://wa.me/584124554207',
    address: '17 Calle Los Clubes, casa nro 10, Urb. La Floresta, Maracay 2101, Aragua',
    addressShort: 'Calle Los Clubes · La Floresta',
    maps: 'https://www.google.com/maps/search/?api=1&query=Zhuba+Restaurant+17+Calle+Los+Clubes+Maracay+Aragua',
    hours: [
      { label: 'Domingo a miércoles', value: '12:00 m. – 12:00 a.m.' },
      { label: 'Jueves a sábado', value: '12:00 m. – 1:00 a.m.' }
    ],
    hoursNote: 'Abierto todos los días. Servicio en mesa, delivery y pick-up.',
    services: ['Servicio en mesa', 'Delivery', 'Pick-up', 'Reservas por WhatsApp'],
    // Zonas de reparto: el negocio publica que hace delivery, pero no publica
    // tarifas ni polígonos. No se inventan: el costo se coordina por WhatsApp.
    deliveryZones: ['La Floresta', 'El Bosque', 'Las Delicias', 'Base Aragua', 'San Jacinto', 'Otra zona de Maracay'],
    deliveryFee: null,
    deliveryFeeNote: 'El costo de envío se confirma por WhatsApp según tu zona.',
    accent: '#D6A050'
  },
  {
    id: 'cafe',
    name: 'ZHUBA Café',
    short: 'Café',
    kicker: 'Pastelería de autor · Gelato · Paninis',
    tagline: 'Donde cada aroma cuenta una historia y cada atención refleja nuestro buen gusto.',
    menu: 'cafe',
    phone: '+58 412-4554207',
    phoneHref: 'tel:+584124554207',
    whatsapp: '584124554207',
    whatsappDirect: 'https://wa.me/message/VXIVBTNU3I5AC1',
    address: '17 Calle Los Clubes, casa nro 10, Urb. La Floresta, Maracay 2101, Aragua',
    addressShort: 'Área del café · mismo complejo',
    maps: 'https://www.google.com/maps/search/?api=1&query=Zhuba+Restaurant+17+Calle+Los+Clubes+Maracay+Aragua',
    hours: [
      { label: 'Domingo a miércoles', value: '12:00 m. – 12:00 a.m.' },
      { label: 'Jueves a sábado', value: '12:00 m. – 1:00 a.m.' }
    ],
    hoursNote: 'Abierto todos los días. Servicio en mesa, delivery y pick-up.',
    services: ['Servicio en mesa', 'Delivery', 'Pick-up', 'Vitrina de pastelería'],
    deliveryZones: ['La Floresta', 'El Bosque', 'Las Delicias', 'Base Aragua', 'San Jacinto', 'Otra zona de Maracay'],
    deliveryFee: null,
    deliveryFeeNote: 'El costo de envío se confirma por WhatsApp según tu zona.',
    accent: '#C77C4A'
  }
];

export const CONTACT = {
  email: 'atencion@zhubarestaurant.com',
  web: 'https://www.zhubarestaurant.com',
  instagram: 'https://www.instagram.com/zhubarestaurant/',
  facebook: 'https://www.facebook.com/zhubarestaurant/',
  fullMenuRestaurant: 'https://app-menuqr.web.app/?id=zhuba1108',
  fullMenuCafe: 'https://app-menuqr.web.app/?id=zhubacafe',
  currency: '€'
};

/** Reseñas verificadas en el perfil público de Google (extracto textual). */
export const REVIEWS = [
  {
    quote: 'Tenía 11 años sin venir a Venezuela, amante del sushi, y me recomendaron Zhuba. Sin duda…',
    author: 'Mariangela Dargenio',
    rating: 5,
    source: 'Google',
    when: 'Hace un mes'
  },
  {
    quote: 'Muy buena experiencia en Zhuba. La comida es excelente, bien presentada y con sabores cuidados.',
    author: 'Carlos Leon',
    rating: 5,
    source: 'Google',
    when: 'Hace un año'
  },
  {
    quote: 'La comida es normal a buena. Solo que muy caro; en ningún lado especifican que los precios del menú no incluyen el 10 % e IVA.',
    author: 'Dora Luciche',
    rating: 3,
    source: 'Google',
    when: 'Hace un año'
  }
];

export const RATING = { score: '4,8', count: 768, source: 'Google' };

export const getBranch = (id) => BRANCHES.find((b) => b.id === id) || BRANCHES[0];
