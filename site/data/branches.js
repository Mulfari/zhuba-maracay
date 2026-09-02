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
    // Titular del héroe: cada línea puede abrir con una palabra en cursiva dorada.
    heroTitle: [{ text: 'Sushi bar, wok' }, { em: 'y', text: 'barra fría' }],
    heroSub: 'Cocina asiática con acento nikkei y tailandés. Salmón noruego, atún saku, escolar y anguila en la barra fría; fuego vivo en el wok.',
    // La vitrina del héroe: fotos reales de la casa, en dos columnas.
    heroPhotos: [
      ['sashimi-especial-zhuba', 'moscow-mule', 'volcan-okanoba', 'coquitos-de-salmon'],
      ['unadon-kabayaki', 'tartar-zhuba', 'degustacion-de-nigiris', 'osaka-roll']
    ],
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
    // Misma gramática visual en las dos sedes; cambia la temperatura.
    // El restaurante es brasa: oro sobre piedra caliente.
    theme: {
      '--ember': '#D6A050', '--ember-hi': '#F2C97F', '--ember-deep': '#A87433',
      '--ink-on-accent': '#191207',
      '--amb-1': 'rgba(104, 74, 38, .17)', '--amb-2': 'rgba(74, 58, 42, .13)'
    },
    accent: '#D6A050'
  },
  {
    id: 'cafe',
    name: 'ZHUBA Café',
    short: 'Café',
    kicker: 'Pastelería de autor · Gelato · Paninis',
    tagline: 'Donde cada aroma cuenta una historia y cada atención refleja nuestro buen gusto.',
    heroTitle: [{ text: 'Gelato, vitrina' }, { em: 'y', text: 'café de altura' }],
    heroSub: 'Waffle hongkonesa hecha al momento, brioche siciliana rellena, alta pastelería con ingredientes italianos y paninis prensados al instante.',
    heroPhotos: [
      ['bubble-waffle-al-gelato', 'cafe-latte', 'barquillon', 'crispy-al-caesar'],
      ['alta-pasteleria', 'brownie-con-gelato', 'cafes-frios', 'roast-beef-schiacciata']
    ],
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
    // El café es la misma piedra a otra hora: acero azulado sobre el mismo
    // negro cálido, para que se note el cambio de sede sin cambiar de casa.
    theme: {
      '--ember': '#84AECB', '--ember-hi': '#BBD8EC', '--ember-deep': '#4E7690',
      '--ink-on-accent': '#0A131A',
      '--amb-1': 'rgba(50, 82, 108, .19)', '--amb-2': 'rgba(42, 60, 78, .15)'
    },
    accent: '#84AECB'
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
