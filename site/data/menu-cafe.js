/**
 * Carta — ZHUBA Café.
 * Tomada del menú digital oficial del café (app-menuqr.web.app/?id=zhubacafe).
 * Misma estructura de datos que el restaurante: la vista no distingue entre
 * una sede y otra, solo cambia el conjunto de datos que recibe.
 */
export const CATEGORIES = [
  { id: 'gelato', name: 'Gelato & Postres', kanji: 'ジェラート', blurb: 'Waffle hecha al momento, brioche siciliana y gelato artesanal.' },
  { id: 'pasteleria', name: 'Pastelería de Autor', kanji: '菓子', blurb: 'La vitrina: bollería fina y alta pastelería con ingredientes italianos.' },
  { id: 'paninis', name: 'Paninis Gourmet', kanji: 'パニーニ', blurb: 'Pan de batata u orégano y parmesano, prensado al momento.' },
  { id: 'schiacciatas', name: 'Schiacciatas', kanji: '窯', blurb: 'Pan rústico italiano de crujido perfecto.' },
  { id: 'hojaldre', name: 'Hojaldre & Croissants', kanji: '層', blurb: 'Mantequilla, capas y relleno salado.' },
  { id: 'calientes', name: 'Café & Bebidas Calientes', kanji: '珈琲', blurb: 'Café ZHUBA fresco de altura, extraído a la vista.' },
  { id: 'frias', name: 'Bebidas Frías & Bubble Tea', kanji: '冷', blurb: 'Infusiones, mócteles sin alcohol y bursting boba.' }
];

export const ITEMS = [
  /* ------------------------------------------------------- GELATO */
  {
    id: 'c-barquilla', cat: 'gelato', name: 'Barquilla', img: 'barquilla.webp', hero: true,
    desc: 'Crujiente galleta de waffle hecha al momento en casa, servida con uno o dos sabores de gelato.',
    price: null,
    variants: [{ name: '1 porción', price: 7 }, { name: '2 porciones', price: 9 }],
    tags: ['gluten'], pair: 'c-espresso'
  },
  {
    id: 'c-tina', cat: 'gelato', name: 'Tina de Gelato', img: 'tina.webp',
    desc: 'Tina de 6 oz servida con una o dos porciones de gelato.',
    price: null,
    variants: [{ name: '1 porción', price: 7 }, { name: '2 porciones', price: 9 }],
    tags: ['organico'], pair: 'c-espresso'
  },
  {
    id: 'c-barquillon', cat: 'gelato', name: 'Barquillón', img: 'barquillon.webp',
    desc: 'Crujiente galleta de waffle hecha al momento en casa, servida con dos sabores de gelato y posibilidad de adicionar los toppings de tu preferencia.',
    price: 9.5, variants: [], tags: ['organico', 'gluten'], pair: 'c-americano'
  },
  {
    id: 'c-affogato', cat: 'gelato', name: 'Affogato', img: 'affogato.webp',
    desc: 'Escoge el sabor de tu gelato favorito y ahógalo en una copa con un doble espresso.',
    price: 9, variants: [], tags: ['organico'], pair: 'c-espresso'
  },
  {
    id: 'c-bubblegelato', cat: 'gelato', name: 'Bubble Waffle al Gelato', img: 'bubble-waffle-al-gelato.webp', hero: true,
    desc: 'Waffle hongkonesa servida con el gelato que más te gusta, crema chantilly, fresas frescas y un fondue de chocolate.',
    price: 11.5, variants: [], tags: ['organico', 'gluten'], pair: 'c-mokaccino'
  },
  {
    id: 'c-strudel', cat: 'gelato', name: 'Strudel de Manzana con Gelato', img: null,
    desc: 'Fresco y crujiente strudel caliente de manzana servido con el gelato que más te gusta.',
    price: 10.5, variants: [], tags: ['organico', 'gluten', 'lactosa'], pair: 'c-cappuccino'
  },
  {
    id: 'c-brownie', cat: 'gelato', name: 'Brownie con Gelato', img: 'brownie-con-gelato.webp',
    desc: 'Dos brownies triple chocolate servidos con el gelato de tu preferencia y chocolate fundido.',
    price: 10.5, variants: [], tags: ['organico', 'gluten'], pair: 'c-mokaccino'
  },
  {
    id: 'c-brioche', cat: 'gelato', name: 'Brioche Siciliana al Gelato', img: 'brioche-siciliana-al-gelato.webp',
    desc: 'Fresca brioche siciliana, untada con nutella o pistacchio dubai, rellena con el gelato que más te gusta.',
    price: 8, variants: [], tags: ['organico', 'gluten'], pair: 'c-latte'
  },
  {
    id: 'c-croissantgelato', cat: 'gelato', name: 'Croissant al Gelato', img: 'croissant-al-gelato.webp',
    desc: 'Fresco croissant caliente untado con nutella, relleno con el gelato que más te gusta y topping a tu gusto.',
    price: 9, variants: [], tags: ['gluten'], pair: 'c-cappuccino'
  },
  {
    id: 'c-bubblefresa', cat: 'gelato', name: 'Bubble Waffle Fresa – Nutella', img: null,
    desc: 'Waffle hongkonesa con nutella o el chocolate de tu preferencia, crema chantilly y fresas frescas.',
    price: 6.5, variants: [], tags: ['organico', 'gluten'], pair: 'c-cafesfrios'
  },
  {
    id: 'c-fresas', cat: 'gelato', name: 'Fresas con Crema', img: null,
    desc: 'Fresas frescas, crema chantilly sin lácteos y sirope de fresa.',
    price: 8, variants: [], tags: ['organico'], pair: 'c-espresso'
  },

  /* --------------------------------------------------- PASTELERÍA */
  {
    id: 'c-altapasteleria', cat: 'pasteleria', name: 'Alta Pastelería & Tentaciones Frías', img: 'alta-pasteleria.webp', hero: true,
    desc: 'La joya de la casa. Una selección exclusiva de nuestra vitrina, donde la frescura de la alta pastelería se encuentra con la nobleza de los ingredientes italianos.',
    price: null, variants: [], orderable: false, priceNote: '5 € – 7 € según la pieza',
    tags: ['organico', 'gluten', 'lactosa', 'huevos'], pair: 'c-espresso'
  },
  {
    id: 'c-bolleria', cat: 'pasteleria', name: 'Bollería Fina & Repostería de Autor', img: null,
    desc: 'Piezas selectas de nuestra vitrina, horneadas con los mejores ingredientes: cannolis, croissants de autor, crumbles rústicos y mucho más.',
    price: null, variants: [], orderable: false, priceNote: '3 € – 7 € según la pieza',
    tags: ['organico', 'gluten', 'lactosa', 'fcascara'], pair: 'c-cappuccino'
  },

  /* ------------------------------------------------------- PANINIS */
  {
    id: 'c-caesar', cat: 'paninis', name: 'Crispy al Caesar', img: 'crispy-al-caesar.webp', hero: true,
    desc: 'Milanesa de pollo crispy envuelta en un doble abrazo de quesos mozzarella gratinado y americano fundido, con un corazón de mézclum, aguacate y tomate al olivo.',
    price: 14, variants: [], tags: ['organico', 'gluten', 'lactosa'], pair: 'c-cafesfrios'
  },
  {
    id: 'c-turkey', cat: 'paninis', name: 'Turkey and Cheeses', img: 'turkey-and-cheeses.webp',
    desc: 'Una redefinición del clásico de pavo, con una trilogía de quesos: Muenster fundido, mozzarella tradicional y perlas de bocconcini.',
    price: 13.5,
    variants: [{ name: 'Pan de batata', price: 13.5 }, { name: 'Pan orégano & parmesano', price: 13.5 }],
    tags: ['organico', 'gluten'], pair: 'c-icedberries'
  },
  {
    id: 'c-tuna', cat: 'paninis', name: 'Tuna Deli', img: 'tuna-deli.webp',
    desc: 'Nuestra receta exclusiva de atún deli, preparada artesanalmente, acompañada de queso mozzarella sutilmente fundido y una vibrante selección fresca.',
    price: 13.5,
    variants: [{ name: 'Pan de batata', price: 13.5 }, { name: 'Pan orégano & parmesano', price: 13.5 }],
    tags: ['organico', 'gluten'], pair: 'c-mangolahia'
  },
  {
    id: 'c-philadelphia', cat: 'paninis', name: 'Chicken Philadelphia', img: 'chicken-philadelphia.webp',
    desc: 'Pollo al grill sumergido en doble cremosidad: mozzarella fundida con granos de maíz dulce y cheddar americano líquido, sobre un salteado de pimientos y cebolla caramelizados.',
    price: 13.5,
    variants: [{ name: 'Pan de batata', price: 13.5 }, { name: 'Pan orégano & parmesano', price: 13.5 }],
    tags: ['organico', 'gluten'], pair: 'c-cafesfrios'
  },
  {
    id: 'c-roastbeef', cat: 'paninis', name: 'Roast Beef', img: 'roast-beef.webp',
    desc: 'Generosas lonjas de roast beef tierno con la cremosidad del queso Muenster perfectamente fundido, equilibrado con tomate, mézclum y aceitunas.',
    price: 15,
    variants: [{ name: 'Pan de batata', price: 15 }, { name: 'Pan orégano & parmesano', price: 15 }],
    tags: [], pair: 'c-mangolahia'
  },
  {
    id: 'c-honeydijon', cat: 'paninis', name: 'Honey-Dijon Chicken', img: null,
    desc: 'Jugosa pechuga de pollo al grill, potenciada por una doble textura de quesos: mozzarella tradicional fundida y mozzarella fresca cremosa.',
    price: 13,
    variants: [{ name: 'Pan de batata', price: 13 }, { name: 'Pan orégano & parmesano', price: 13 }],
    tags: ['organico', 'gluten'], pair: 'c-icedberries'
  },

  /* -------------------------------------------------- SCHIACCIATAS */
  {
    id: 'c-schcarpaccio', cat: 'schiacciatas', name: 'Schiacciata au Carpaccio', img: 'schiacciata-au-carpaccio.webp',
    desc: 'El crujido rústico de nuestra schiacciata artesanal da paso a la suavidad del carpaccio de lomito finamente cortado, con mozzarella di bufala fresca y parmesano.',
    price: 15.5, variants: [], tags: ['organico', 'gluten'], pair: 'c-cafesfrios'
  },
  {
    id: 'c-schpomodoro', cat: 'schiacciatas', name: 'Chicken Schiacciata al Pomodoro', img: 'chicken-schiacciata-al-pomodoro.webp',
    desc: 'Nuestra schiacciata artesanal rellena con jugosa pechuga de pollo fileteada al grill, mozzarella fundida y salsa pomodoro de la casa.',
    price: 14.5, variants: [], tags: ['organico', 'gluten'], pair: 'c-mangolahia'
  },
  {
    id: 'c-schroastbeef', cat: 'schiacciatas', name: 'Roast Beef Schiacciata', img: 'roast-beef-schiacciata.webp',
    desc: 'Tierno roast beef envuelto en una irresistible fusión de quesos Muenster y bocconcini fundidos, con la frescura cremosa del aguacate y hojas verdes.',
    price: 16.5, variants: [], tags: ['organico', 'gluten'], pair: 'c-icedberries'
  },
  {
    id: 'c-schsalmon', cat: 'schiacciatas', name: 'Smoked Salmón', img: null,
    desc: 'Schiacciata artesanal crujiente rellena de un dúo de salmón fresco y ahumado premium, aguacate perfumado con trufa, crema de queso suave y nueces crocantes.',
    price: 19.5, variants: [], tags: ['organico', 'gluten', 'pescados', 'fcascara'], pair: 'c-cafesfrios'
  },

  /* ----------------------------------------------------- HOJALDRE */
  {
    id: 'c-croissants', cat: 'hojaldre', name: 'Croissants Rellenos', img: 'croissants-rellenos.webp',
    desc: 'Frescos y crujientes panecillos hojaldrados en forma de medialuna, hechos en casa.',
    price: null,
    variants: [
      { name: 'Pavo y queso philadelphia', price: 7.5 }, { name: 'Pavo y queso munster', price: 7.5 },
      { name: 'Mozzarella y maíz', price: 7.5 }, { name: 'Champiñones & mozzarella', price: 7.5 }
    ],
    tags: ['organico', 'gluten', 'lactosa', 'huevos', 'gsesamo'], pair: 'c-cappuccino'
  },
  {
    id: 'c-pastelitos', cat: 'hojaldre', name: 'Pastelitos de Hojaldre Rellenos', img: 'pastelitos-de-hojaldre-rellenos.webp',
    desc: 'Frescos y crujientes pasteles de hojaldre de mantequilla rellenos.',
    price: null,
    variants: [
      { name: 'Ricotta & espinaca', price: 5.5 }, { name: 'Ricotta', price: 5.5 },
      { name: 'Pollo thai', price: 6.5 }, { name: 'Carne mechada', price: 6.5 }
    ],
    tags: ['organico', 'gluten', 'lactosa', 'gsesamo'], pair: 'c-americano'
  },

  /* ----------------------------------------------------- CALIENTES */
  {
    id: 'c-espresso', cat: 'calientes', name: 'Espresso', img: 'espresso.webp',
    desc: 'Extracción sencilla de café ZHUBA fresco de altura.',
    price: null,
    variants: [{ name: 'Espresso', price: 4 }, { name: 'Espresso doble', price: 4 }, { name: 'Espresso lungo', price: 4 }],
    tags: ['vegano', 'organico'], pair: 'c-altapasteleria'
  },
  {
    id: 'c-americano', cat: 'calientes', name: 'Café Americano', img: 'cafe-americano.webp',
    desc: 'Extracción de espresso fresco de altura mezclado con agua a temperatura.',
    price: 4, variants: [], tags: ['vegano', 'organico'], pair: 'c-bolleria'
  },
  {
    id: 'c-macchiato', cat: 'calientes', name: 'Macchiato', img: 'macchiato.webp',
    desc: 'Extracción doble de espresso fresco de altura coronado con leche texturizada.',
    price: null,
    variants: [{ name: 'Macchiato', price: 4.5 }, { name: 'Macchiato cortado', price: 3.5 }],
    tags: ['vegetariano', 'organico'], pair: 'c-croissants'
  },
  {
    id: 'c-cappuccino', cat: 'calientes', name: 'Cappuccino', img: 'cappuccino.webp',
    desc: 'Extracción doble de espresso fresco de altura servido con leche fresca texturizada.',
    price: null,
    variants: [{ name: 'Pequeño', price: 4.5 }, { name: 'Grande', price: 5.5 }],
    tags: ['vegetariano', 'organico'], pair: 'c-altapasteleria'
  },
  {
    id: 'c-latte', cat: 'calientes', name: 'Café Latte', img: 'cafe-latte.webp', hero: true,
    desc: 'Extracción sencilla de espresso fresco de altura completado con leche vaporizada y texturizada. Disponible con leche sin lactosa.',
    price: null,
    variants: [
      { name: 'Original pequeño', price: 4.5 }, { name: 'Original grande', price: 5.5 },
      { name: 'Almendrado grande', price: 6 }, { name: 'Caramelo salado grande', price: 6 },
      { name: 'Caramel latte grande', price: 6 }, { name: 'Vainilla latte', price: 6 },
      { name: 'Al pistacchio grande', price: 7 }
    ],
    tags: ['vegetariano', 'organico'], pair: 'c-brioche'
  },
  {
    id: 'c-mokaccino', cat: 'calientes', name: 'Mokaccino Grande', img: 'mokaccino-grande.webp',
    desc: 'Salsa de chocolate dark mezclada con extracción doble de espresso fresco de altura, servido con leche texturizada. Disponible con leche sin lactosa.',
    price: 6.5, variants: [], tags: ['vegetariano', 'organico'], pair: 'c-brownie'
  },
  {
    id: 'c-carajillo', cat: 'calientes', name: 'Carajillo', img: null,
    desc: 'Doble extracción de espresso combinada con whisky o ron, según tu preferencia.',
    price: 7.5, variants: [], tags: [], pair: 'c-altapasteleria'
  },
  {
    id: 'c-bombon', cat: 'calientes', name: 'Café Bombón', img: null,
    desc: 'Bebida de café dulce e indulgente de origen español, combinando partes iguales de espresso y leche condensada azucarada.',
    price: 7, variants: [], tags: ['organico'], pair: 'c-brownie'
  },

  /* --------------------------------------------------------- FRÍAS */
  {
    id: 'c-cafesfrios', cat: 'frias', name: 'Cafés Fríos', img: 'cafes-frios.webp', hero: true,
    desc: 'Leche fresca texturizada en frío, mezclada con extracción de espresso de altura.',
    price: null,
    variants: [
      { name: 'Iced latte', price: 7 }, { name: 'Caramel iced latte', price: 7 },
      { name: 'Iced moka', price: 7 }, { name: 'Iced latte almendrado', price: 7.5 },
      { name: 'Salted caramel iced latte', price: 7.5 }, { name: 'Iced latte al pistacchio', price: 8.5 }
    ],
    tags: ['vegetariano', 'organico'], pair: 'c-bubblefresa'
  },
  {
    id: 'c-frappu', cat: 'frias', name: 'Frappu', img: 'frappu.webp',
    desc: 'Bebida frappé elaborada con gelato de vainilla, leche fresca, extracción de espresso de altura y el sabor de tu preferencia. Opcional sin café.',
    price: null,
    variants: [
      { name: 'Original frappuccino', price: 8 }, { name: 'Caramel frappuccino', price: 8 },
      { name: 'Moka frappuccino', price: 8 }, { name: 'Salted caramel frappuccino', price: 8.5 },
      { name: 'Frappuccino al pistacchio', price: 9 }
    ],
    tags: [], pair: 'c-brownie'
  },
  {
    id: 'c-icedberries', cat: 'frias', name: 'Iced Berries Hibiscus', img: 'iced-berries-hibiscus.webp',
    desc: 'Refrescante móctel elaborado con infusión de frutos rojos, hibiscus, maracuyá natural y extracto de tuna, la exótica fruta del cactus.',
    price: 7, variants: [], tags: ['vegano', 'organico'], pair: 'c-caesar'
  },
  {
    id: 'c-mangolahia', cat: 'frias', name: 'Mango Lahia Iced Tea', img: 'mango-lahia-iced-tea.webp',
    desc: 'Mango, piña, uva, flor de jamaica y pétalos de girasol infusionados, construido con concentrado natural de mango.',
    price: 7, variants: [], tags: ['organico'], pair: 'c-turkey'
  },
  {
    id: 'c-tropical', cat: 'frias', name: 'Tropical Wild Iced Tea', img: null,
    desc: 'Móctel elaborado con infusión de kiwi, fresa, frutos silvestres, flor de jamaica y hierbas.',
    price: 7, variants: [], tags: ['vegano', 'vegetariano', 'organico'], pair: 'c-tuna'
  },
  {
    id: 'c-cranberry', cat: 'frias', name: 'Cranberry Iced Tea', img: null,
    desc: 'Móctel elaborado con infusión de cranberry, extracto de tuna, hierbas y limón.',
    price: 7, variants: [], tags: ['vegano', 'vegetariano', 'organico'], pair: 'c-roastbeef'
  },
  {
    id: 'c-matcha', cat: 'frias', name: 'Matcha Iced Tea', img: null,
    desc: 'Té verde original matcha emulsionado con agua, zumo de limón 100 % natural y miel pura de abeja.',
    price: 7.5, variants: [], tags: ['vegetariano', 'vegano', 'organico'], pair: 'c-croissantgelato'
  },
];