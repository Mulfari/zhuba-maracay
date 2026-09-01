/**
 * Carta — ZHUBA Restaurant.
 * Nombres, descripciones, variantes, precios y alérgenos tomados del menú
 * digital oficial del restaurante (app-menuqr.web.app/?id=zhuba1108).
 * Selección curada: la carta completa supera los 300 platos.
 * `price` en la moneda que publica el propio menú (€). `variants` = opciones
 * reales de preparación o proteína, cada una con su precio publicado.
 */
export const CATEGORIES = [
  { id: 'aperitivos', name: 'Aperitivos & Sushi Bar', kanji: '前菜', blurb: 'Para abrir la mesa: barra fría, tiraditos y bocados de la casa.' },
  { id: 'firma', name: 'Rolls de Firma', kanji: '特選', blurb: 'Las elaboraciones que solo existen aquí. Trufa, parrilla volcánica y capas.' },
  { id: 'tempura', name: 'Tempura & Panko', kanji: '天ぷら', blurb: 'Crujido caliente por fuera, frío y cremoso por dentro.' },
  { id: 'tradicionales', name: 'Rolls Tradicionales', kanji: '巻物', blurb: 'Los clásicos, hechos con el mismo pescado que los especiales.' },
  { id: 'sashimi', name: 'Sashimi & Nigiris', kanji: '刺身', blurb: 'Corte limpio, sin escondite. Elige tu pescado.' },
  { id: 'crudos', name: 'Tartares, Ceviches & Poke', kanji: '生', blurb: 'La esquina nikkei: leche de tigre, ají amarillo y aguacate trufado.' },
  { id: 'wok', name: 'Wok, Arroces & Tallarines', kanji: '炒', blurb: 'Fuego vivo. Elige proteína y el wok hace el resto.' },
  { id: 'barra', name: 'Coctelería & Cervezas', kanji: '酒', blurb: 'Barra creativa, frozen de la casa y cerveza bien fría.' }
];

export const ITEMS = [
  /* ---------------------------------------------------- APERITIVOS */
  {
    id: 'r-edamame', cat: 'aperitivos', name: 'Edamame', img: 'edamame.webp',
    desc: 'Tiernas vainas de soja seleccionadas. Un clásico imprescindible en dos versiones: la tradicional al vapor con flor de sal, o la vibrante opción salteada al wok con salsa de soja, ajo confitado y notas de jengibre y sésamo.',
    price: null,
    variants: [{ name: 'Al vapor', price: 8.5 }, { name: 'Salteados al wok', price: 9.5 }],
    tags: ['vegano', 'organico', 'soja'], pair: 'r-polar'
  },
  {
    id: 'r-wings', cat: 'aperitivos', name: 'Umami Wings', img: 'umami-wings.webp',
    desc: 'Alitas de pollo en doble cocción: primero rostizadas para preservar su jugosidad y luego salteadas al wok en una soja suave y brillante. Se finalizan con nuestra mezcla de especias Umami. Servicio de 8 unidades.',
    price: 9.5, variants: [], tags: ['organico', 'soja', 'gsesamo'], pair: 'r-stella'
  },
  {
    id: 'r-coquitos', cat: 'aperitivos', name: 'Coquitos de Salmón', img: 'coquitos-de-salmon.webp',
    desc: 'Quinoa rostizada y aguacate ligeramente trufado con kanikama y cebollín, envuelta en finas láminas de salmón fresco con una costra de panko y coco, aderezado con salsa de curry y anguila.',
    price: 15.5, variants: [], tags: ['organico', 'gluten', 'pescados', 'soja'], pair: 'r-gintonic'
  },
  {
    id: 'r-montadito', cat: 'aperitivos', name: 'Montadito ZHUBA', img: null,
    desc: 'Cubos de atún y salmón fresco, mix de caviar, aguacate trufado, limón y tajín, con un toque crujiente de kani y quinoa tostada, sobre una base crocante de arroz y salmón. Servicio de 4 unidades.',
    price: 16.5, variants: [], tags: ['picante', 'organico', 'gluten', 'pescados', 'soja', 'gsesamo'], pair: 'r-margarita'
  },
  {
    id: 'r-merotako', cat: 'aperitivos', name: 'Merotako al Olivo', img: 'merotako-al-olivo.webp',
    desc: 'Finas láminas de pulpo y mero fresco sobre un espejo de cítricos y sésamo, coronado con una emulsión de aceitunas, cebolla morada, sutiles notas de ají amarillo y crujientes de alcaparra.',
    price: 24.5, variants: [], tags: ['organico', 'moluscos', 'pescados', 'soja'], pair: 'r-gintonic'
  },
  {
    id: 'r-tiradito-atun', cat: 'aperitivos', name: 'Tiradito de Atún Saku', img: 'tiradito-de-atun-saku.webp',
    desc: 'Finas lonjas de atún Saku sobre un espejo de soya, cítricos y sésamo. Se corona con un chimichurri de algas marinas y láminas de rábano fresco, finalizado con sutiles puntos de Sriracha.',
    price: 23.5, variants: [], tags: ['picante', 'organico', 'pescados', 'soja'], pair: 'r-moscow'
  },
  {
    id: 'r-sushipizza', cat: 'aperitivos', name: 'Sushi Pizza', img: 'sushi-pizza.webp',
    desc: 'Crujiente pizza de arroz crunch y cangrejo crispy, coronada con slices de salmón noruego y atún Saku, kanikama, wakame, aguacate y cebollín, con puntos de salsa spicy, anguila y caviar capelín naranja.',
    price: 19, variants: [], tags: ['pescados', 'soja'], pair: 'r-stella'
  },

  /* ---------------------------------------------------------- FIRMA */
  {
    id: 'r-fukkatsu', cat: 'firma', name: 'Fukkatsu ZHUBA Roll', img: 'fukkatsu-zhuba-roll.webp', hero: true,
    desc: 'Salmón, camarón crocante, kani, aceite de trufa, caviar negro y aguacate. Coronado con un tartar spicy trufado de camarón crunch, sobre una ensalada de kani y salmón en aderezo fuji.',
    price: 25.5, variants: [], tags: ['organico', 'gluten', 'crustaceos', 'pescados', 'soja', 'gsesamo'], pair: 'r-zhubafrozen'
  },
  {
    id: 'r-sakuna', cat: 'firma', name: 'Sakuna Ebi', img: 'sakuna-ebi.webp', hero: true,
    desc: 'Camarones tempura, tartar de atún, aguacate y un acevichado de ajíes dulces y quinoa crocante. Coronado con finas láminas de aguacate, rábano y notas de ají amarillo.',
    price: 22.5, variants: [], tags: ['organico', 'gluten', 'crustaceos', 'pescados', 'soja', 'gsesamo'], pair: 'r-waikoloa'
  },
  {
    id: 'r-haitateki', cat: 'firma', name: 'Haita-teki Roll', img: 'haita-teki-roll.webp',
    desc: 'Atún Saku, salmón ahumado trufado, plátano maduro en salsa de anguila y aguacate. Coronado con un tartar de camarones tempura, kanikama crocante y caviar en pasta spicy thai.',
    price: 24.5, variants: [], tags: ['organico', 'lactosa', 'crustaceos', 'pescados', 'soja', 'gsesamo'], pair: 'r-mojito'
  },
  {
    id: 'r-smoked', cat: 'firma', name: 'Smoked Roll', img: 'smoked-roll.webp',
    desc: 'Relleno con anguila, salmón fresco y ahumado, queso crema, aguacate y nuestra salsa amai mayonesa. Coronado con quinoa, láminas de salmón fresco y una ensalada de kani con crujiente de tempura.',
    price: 23.5, variants: [], tags: ['lactosa', 'pescados', 'gsesamo'], pair: 'r-gintonic'
  },
  {
    id: 'r-hirokuebi', cat: 'firma', name: 'Hiroku Ebi Roll', img: 'hiroku-ebi-roll.webp',
    desc: 'Langostinos super crunch, ensalada de kani spicy, aguacate y queso crema. Su exterior deslumbra con un escarchado de tobiko rojo, coronado con langostinos crujientes bañados en fusión de salsas Fuji y anguila sobre un lecho de wakame.',
    price: 23, variants: [], tags: ['crustaceos', 'pescados', 'soja', 'gsesamo'], pair: 'r-zhubafrozen'
  },
  {
    id: 'r-sexbeach', cat: 'firma', name: 'Sex on the Beach Roll', img: 'sex-on-the-beach-roll.webp',
    desc: 'Salmón crispy, anguila, aguacate y kani trufado. Cubierto con láminas de pera marinada en tinto Merlot y salmón ahumado, y coronado con una ensalada de kani, salmón ahumado crocante, nueces y calamares japoneses.',
    price: 24.5, variants: [], tags: ['organico', 'pescados'], pair: 'r-waikoloa'
  },
  {
    id: 'r-atlanticnorway', cat: 'firma', name: 'Atlantic Norway', img: 'atlantic-norway.webp',
    desc: 'Salmón, aguacate, salmón ahumado crocante y una pasta de queso crema con Sriracha y caviar. Coronado con láminas de salmón fresco y una ensalada spicy de kani, wakame y quinoa crocante.',
    price: 24.5, variants: [], tags: ['pescados', 'soja', 'gsesamo'], pair: 'r-moscow'
  },
  {
    id: 'r-seikatsu', cat: 'firma', name: 'Seikatsu Roll', img: 'seikatsu-roll.webp',
    desc: 'Laminado de atún Saku y aguacate envuelto en arroz gohan sobre hoja de soja y sésamo, relleno con ensalada trufada spicy de kanikama en macerado ponzu, aceites herbales, almendras y aceite de trufas negras, coronado con ensalada de cangrejo.',
    price: 26.5, variants: [], tags: ['organico', 'pescados', 'fcascara', 'soja', 'gsesamo'], pair: 'r-gintonic'
  },
  {
    id: 'r-kanikani', cat: 'firma', name: 'Kani to Kani Roll', img: 'kani-to-kani-roll.webp',
    desc: 'Amante del kani, este es para ti. Ensalada de cangrejo en aderezo oriental, queso crema, cebollín, caviar de capelín, aguacate, cangrejo crunch y salsa spicy, cubierto con caviar verde y coronado con kanikama crocante.',
    price: 25, variants: [], tags: ['pescados', 'soja', 'gsesamo'], pair: 'r-stella'
  },
  {
    id: 'r-okayama', cat: 'firma', name: 'Okayama', img: 'okayama.webp',
    desc: 'Atún Saku fresco, cebollín, pepino, queso crema y aguacate. Topping de atún fresco y ensalada de wakame, kanikama, crocante de tempura y salsa spicy.',
    price: 25.5, variants: [], tags: ['pescados'], pair: 'r-moscow'
  },
  {
    id: 'r-kunsei', cat: 'firma', name: 'Kunsei Tataki Roll', img: 'kunsei-tataki-roll.webp',
    desc: 'Salmón crocante, queso crema macerado con cebollín, spicy, caviar capelín y ensalada de cangrejo; techado con slices de salmón en cocción tataki de nuestra parrilla volcánica y aguacate, coronado con pasta spicy de salmón ahumado, almendras y caviar.',
    price: 25.5, variants: [], tags: ['organico', 'pescados', 'soja', 'gsesamo'], pair: 'r-zhubafrozen'
  },
  {
    id: 'r-osaka', cat: 'firma', name: 'Osaka Roll', img: 'osaka-roll.webp',
    desc: 'Fresco y tropical: atún Saku, salmón fresco, queso crema y wakame, cubierto con slices de atún y aguacate y coronado con ensalada de wakame, salmón noruego, crocante de tempura, nueces y coulis de maracuyá.',
    price: 26, variants: [], tags: ['organico', 'pescados', 'fcascara', 'gsesamo'], pair: 'r-waikoloa'
  },

  /* -------------------------------------------------------- TEMPURA */
  {
    id: 'r-volcan', cat: 'tempura', name: 'Volcán Okanoba', img: 'volcan-okanoba.webp', hero: true,
    desc: 'Una imponente estructura de camarones tempura bañados en salsa spicy cítrica y perfumados con aceite de trufa. Se armoniza con tartar de atún fresco, ensalada de kani con texturas crujientes, aguacate y cebollín, coronada con crocantes de maíz.',
    price: 23.5, variants: [], tags: ['organico', 'gluten', 'crustaceos', 'pescados', 'soja', 'gsesamo'], pair: 'r-margarita'
  },
  {
    id: 'r-tamashi', cat: 'tempura', name: 'Tamashi Panko Roll', img: 'tamashi-panko-roll.webp',
    desc: 'Un roll al panko relleno de salmón fresco, camarones crunch, aguacate y queso crema. Coronado con más camarones crujientes en salsa fuji sobre una base de ensalada de cangrejo, wakame y salmón fresco, finalizado con salsa de anguila.',
    price: 24.5, variants: [], tags: ['gluten', 'lactosa', 'crustaceos', 'pescados', 'soja', 'gsesamo'], pair: 'r-stella'
  },
  {
    id: 'r-plantain', cat: 'tempura', name: 'Plantain Roll', img: 'plantain-roll.webp',
    desc: 'Crujiente roll sin arroz envuelto en plátano maduro, relleno de salmón al panko, salmón ahumado, anguila, queso crema y mango, con ensalada de wakame, plátano y kanikama en salsa ponzu y anguila.',
    price: 24.5, variants: [], tags: ['pescados'], pair: 'r-pinacolada'
  },
  {
    id: 'r-tiger', cat: 'tempura', name: 'Tiger Roll', img: 'tiger-roll.webp',
    desc: 'Fresco y crujiente. Elaborado con salmón fresco, queso crema y aguacate, empanizado y coronado con una ensalada de wakame, cangrejo y salmón fresco.',
    price: 23.5, variants: [], tags: ['pescados', 'soja', 'gsesamo'], pair: 'r-coronita'
  },
  {
    id: 'r-salmonpanko', cat: 'tempura', name: 'Salmon Panko Roll', img: 'salmon-panko-roll.webp',
    desc: 'Relleno de salmón noruego, aguacate, queso crema y ensalada de cangrejo en aderezo oriental. Coronado con bastones de salmón crujiente en aderezo especial ZHUBA.',
    price: 20.5, variants: [], tags: ['organico', 'gluten', 'lactosa', 'pescados', 'soja', 'gsesamo'], pair: 'r-mojito'
  },
  {
    id: 'r-tigercrab', cat: 'tempura', name: 'Tiger Crab Roll', img: 'tiger-crab-roll.webp',
    desc: 'Relleno con kanikama, queso crema, aguacate y anguila al panko; topping de calamares crocantes en salsa oriental sobre cama de ensalada de wakame y kanikama en aderezo ZHUBA y salsa anguila.',
    price: 26, variants: [], tags: ['moluscos', 'pescados', 'soja', 'gsesamo'], pair: 'r-gintonic'
  },
  {
    id: 'r-veggietempura', cat: 'tempura', name: 'Veggie Tempura Roll', img: 'veggie-tempura-roll.webp',
    desc: 'Roll vegano elaborado con frescos vegetales salteados al wok en soya, jengibre y sésamo. Topping de mukamame y nuestra salsa curry thai.',
    price: 16, variants: [], tags: ['vegano', 'vegetariano', 'soja', 'gsesamo'], pair: 'r-polar'
  },

  /* -------------------------------------------------- TRADICIONALES */
  {
    id: 'r-philadelphia', cat: 'tradicionales', name: 'Philadelphia Roll', img: 'philadelphia-roll.webp',
    desc: 'Un clásico reinventado. Relleno de atún Saku, pepino, aguacate y queso crema, cubierto con láminas de aguacate y coronado con ensalada de cangrejo en aderezo oriental.',
    price: 19.5, variants: [], tags: ['pescados', 'gsesamo'], pair: 'r-polar'
  },
  {
    id: 'r-dinamita', cat: 'tradicionales', name: 'Dinamita Roll', img: 'dinamita-roll.webp',
    desc: 'Un dinamita explosivo en sabor. Relleno de una pasta de kanikama con mayonesa japonesa y cubierto con caviar capelín. Coronado con nuestra ensalada dinamita.',
    price: 18, variants: [], tags: ['pescados', 'gsesamo'], pair: 'r-coronita'
  },
  {
    id: 'r-california', cat: 'tradicionales', name: 'California Roll', img: 'california-roll.webp',
    desc: 'Un clásico con el sabor de ZHUBA. Relleno de kanikama, pepino y aguacate, cubierto de caviar capelín y semillas de sésamo.',
    price: 17.5, variants: [], tags: ['organico', 'pescados', 'gsesamo'], pair: 'r-polar'
  },
  {
    id: 'r-alaska', cat: 'tradicionales', name: 'Alaska Clásico', img: 'alaska-clasico.webp',
    desc: 'Relleno de salmón noruego, aguacate y queso crema, envuelto en una capa de semillas de sésamo tostado.',
    price: 13.5, variants: [], tags: ['organico', 'lactosa', 'gsesamo'], pair: 'r-coronita'
  },
  {
    id: 'r-spicytuna', cat: 'tradicionales', name: 'Spicy Tuna Saku', img: 'spicy-tuna-saku.webp',
    desc: 'Atún Saku fresco marinado en Sriracha y aderezo spicy, con celery, queso crema y aguacate. Coronado con láminas de atún Saku y aguacate con puntos de salsa spicy.',
    price: 19.5, variants: [], tags: ['picante', 'organico', 'pescados', 'gsesamo'], pair: 'r-stella'
  },
  {
    id: 'r-salmonskin', cat: 'tradicionales', name: 'Salmón Skin', img: 'salmon-skin.webp',
    desc: 'Crocante piel de salmón, aguacate y queso crema. Con topping de aguacate y salsa anguila.',
    price: 14, variants: [], tags: ['organico', 'pescados', 'soja', 'gsesamo'], pair: 'r-polar'
  },

  /* ------------------------------------------------------- SASHIMI */
  {
    id: 'r-sashimi', cat: 'sashimi', name: 'Sashimi', img: 'sashimi.webp',
    desc: 'Finos cortes de pescado fresco servidos sobre hielo, la máxima expresión de pureza y sabor. Servicio de cuatro cortes.',
    price: null,
    variants: [
      { name: 'Salmón noruego', price: 14.5 }, { name: 'Atún Saku', price: 15.5 },
      { name: 'Escolar (white tuna)', price: 17.5 }, { name: 'Hamachi Toro (yellowtail)', price: 17.5 },
      { name: 'Eel (anguila)', price: 18 }
    ],
    tags: ['organico', 'pescados'], pair: 'r-gintonic'
  },
  {
    id: 'r-sashimi-especial', cat: 'sashimi', name: 'Sashimi Especial ZHUBA', img: 'sashimi-especial-zhuba.webp', hero: true,
    desc: 'Una degustación suprema que celebra la pureza del mar. Veinte cortes de nuestra selección de pescados, acompañados de arroz gohan y ponzu.',
    price: 53.5, variants: [], tags: ['organico', 'pescados'], pair: 'r-gintonic'
  },
  {
    id: 'r-mixsashimi', cat: 'sashimi', name: 'Mix de Sashimi', img: 'mix-de-sashimi.webp',
    desc: '3 tipos de pescado en 12 cortes a tu gusto, acompañado con wakame y aguacate, servido con ponzu.',
    price: 43.5, variants: [], tags: ['organico', 'pescados'], pair: 'r-moscow'
  },
  {
    id: 'r-nigiris', cat: 'sashimi', name: 'Nigiris', img: 'nigiris.webp',
    desc: 'Delicados bocados de arroz de sushi, moldeados a mano y coronados con un preciso corte de pescado fresco. 3 unidades por orden.',
    price: null,
    variants: [
      { name: 'Salmón noruego', price: 12.5 }, { name: 'Atún Saku', price: 13.5 },
      { name: 'Escolar (white tuna)', price: 14 }, { name: 'Hamachi Toro', price: 14 },
      { name: 'Eel (anguila)', price: 15.5 }, { name: 'Ikura (hueva de salmón)', price: 17.5 }
    ],
    tags: ['organico', 'pescados'], pair: 'r-stella'
  },
  {
    id: 'r-degustacion', cat: 'sashimi', name: 'Degustación de Nigiris', img: 'degustacion-de-nigiris.webp',
    desc: 'Una selección del chef con seis de las mejores piezas del día.',
    price: 24.5, variants: [], tags: ['organico', 'pescados'], pair: 'r-gintonic'
  },

  /* --------------------------------------------------------- CRUDOS */
  {
    id: 'r-tartarzhuba', cat: 'crudos', name: 'Tartar ZHUBA', img: 'tartar-zhuba.webp', hero: true,
    desc: 'Un domo de aguacate que revela en su interior un tartar explosivo de salmón noruego, atún Saku, kanikama, caviar capelín, mukamame, nueces y guisantes japoneses, unido con nuestro aderezo oriental y perfumado con aceite de trufas negras.',
    price: 21.5, variants: [], tags: ['organico', 'pescados', 'soja', 'gsesamo'], pair: 'r-waikoloa'
  },
  {
    id: 'r-tartarsaku', cat: 'crudos', name: 'Tartar Saku Tuna', img: 'tartar-saku-tuna.webp',
    desc: 'Dados de atún Saku marinados en aceite de sésamo y mayonesa japonesa especiada, servido sobre una cama de aguacate trufado y coronado con chips de noodles y plátano verde.',
    price: 17.5, variants: [], tags: ['picante', 'organico', 'pescados', 'soja', 'gsesamo'], pair: 'r-moscow'
  },
  {
    id: 'r-aguachile', cat: 'crudos', name: 'Aguachile ZHUBA', img: null,
    desc: 'Una refrescante preparación de mero y camarones curtidos en limón y chile, con pepino, rábano y cebolla morada en un vibrante caldo de leche de coco. Servido con chips de camote.',
    price: 20.5, variants: [], tags: ['organico', 'crustaceos', 'pescados'], pair: 'r-margarita'
  },
  {
    id: 'r-clasico', cat: 'crudos', name: 'Un Clásico', img: 'un-clasico.webp',
    desc: 'Dados de mero fresco marinados en la tradicional leche de tigre con limón y ají amarillo, mezclado con finos aliños frescos. Servido con crujientes chips de plátano verde.',
    price: 16, variants: [], tags: ['picante', 'organico', 'pescados'], pair: 'r-pinacolada'
  },
  {
    id: 'r-passions', cat: 'crudos', name: 'Ceviche Passions', img: 'ceviche-passions.webp',
    desc: 'Frescos dados de mero marinados en un vibrante coulis de maracuyá, leche de tigre y limón, con el toque de nuestros aliños frescos. Se sirve con chips de plátano verde.',
    price: 17.5, variants: [], tags: ['organico', 'pescados'], pair: 'r-waikoloa'
  },
  {
    id: 'r-causa', cat: 'crudos', name: 'Causa Especial ZHUBA', img: 'causa-especial-zhuba.webp',
    desc: 'Causa peruana construida sobre base de aguacate trufado, rellena con atún Saku en cocción tataki y kanikama en aderezo oriental, coronada con pulpo y camarones cocidos en cazuela en su propia reducción.',
    price: 19.5, variants: [], tags: ['picante', 'organico', 'lactosa', 'crustaceos', 'moluscos', 'gsesamo'], pair: 'r-mojito'
  },
  {
    id: 'r-olupoke', cat: 'crudos', name: '‘Olu ‘Olu Poke', img: 'olu-olu-poke.webp',
    desc: 'Tartar de atún, caviar capelín y tobiko, aguacate, wakame, edamame y kanikama marinado en aderezo oriental, con una ensalada de cebolla morada y pepino, sobre una cama de arroz gohan.',
    price: 24.5, variants: [], tags: ['organico', 'pescados', 'soja', 'gsesamo'], pair: 'r-moscow'
  },

  /* ------------------------------------------------------------ WOK */
  {
    id: 'r-arrozjapones', cat: 'wok', name: 'Arroz Frito Japonés', img: 'arroz-frito-japones.webp',
    desc: 'Un clásico reinventado al wok con huevo, cebollín, frijoles germinados, repollo coreano y finas julianas de zanahoria, todo salteado en una intensa salsa a base de soya y ostión.',
    price: null,
    variants: [
      { name: 'Especial (huevo, jamón y vegetales)', price: 12.5 }, { name: 'Pollo teriyaki', price: 15.5 },
      { name: 'Pollo y lomito', price: 18.5 }, { name: 'Pollo y camarones', price: 19 },
      { name: 'Solo camarones', price: 19.5 }, { name: 'Tres sabores (lomito, pollo y camarones)', price: 19.5 }
    ],
    tags: ['picante', 'organico', 'soja', 'gsesamo'], pair: 'r-polar'
  },
  {
    id: 'r-arrozcantones', cat: 'wok', name: 'Arroz Frito Estilo Cantonés', img: 'arroz-frito-estilo-cantones.webp',
    desc: 'Salteado al wok con la proteína de tu elección, huevo, cebollín, frijoles germinados, bok choy y zanahoria en una delicada salsa de cayena y sésamo. Esta preparación no contiene soya.',
    price: null,
    variants: [
      { name: 'Especial (huevo, jamón y vegetales)', price: 12.5 }, { name: 'Pollo teriyaki', price: 15.5 },
      { name: 'Pollo y lomito', price: 18.5 }, { name: 'Pollo y camarones', price: 19 },
      { name: 'Solo camarones', price: 19.5 }, { name: 'Tres sabores (lomito, pollo y langostinos)', price: 19.5 }
    ],
    tags: ['organico', 'soja', 'gsesamo'], pair: 'r-coronita'
  },
  {
    id: 'r-shaofan', cat: 'wok', name: 'Shāofàn de Mariscos & Mero', img: 'shaofan-de-mariscos-y-mero.webp',
    desc: 'Una atrevida fusión mediterránea-oriental. Arroz salteado al wok con mariscos frescos y cubos de mero, perfumado con hebras de azafrán, una reducción de langostinos, aceite de oliva, granos de soya y vegetales de temporada.',
    price: 29.5, variants: [], tags: ['organico', 'crustaceos', 'moluscos', 'pescados'], pair: 'r-gintonic'
  },
  {
    id: 'r-yakisoba', cat: 'wok', name: 'Yakisoba Clásico', img: 'yakisoba-clasico.webp',
    desc: 'Fideos de huevo salteados a fuego vivo en el wok con vegetales frescos, maíz bebé y tu elección de proteínas, todo unificado en nuestra emblemática salsa yakisoba.',
    price: null,
    variants: [
      { name: 'Pollo', price: 23 }, { name: 'Pollo y lomito', price: 24.5 },
      { name: 'Pollo y camarones', price: 24.5 }, { name: 'Lomito', price: 25 },
      { name: 'Solo camarones', price: 25.5 }, { name: 'Tres sabores', price: 25.5 }
    ],
    tags: ['organico', 'gluten', 'soja', 'gsesamo'], pair: 'r-stella'
  },
  {
    id: 'r-pekin', cat: 'wok', name: 'Pekin Noodles', img: 'pekin-noodles.webp',
    desc: 'Finos tallarines de arroz salteados al wok con una selección de vegetales frescos y tu proteína preferida, bañados en la tradicional y aromática salsa pekinesa.',
    price: null,
    variants: [
      { name: 'Pollo', price: 23.5 }, { name: 'Pollo y camarones', price: 24.5 },
      { name: 'Lomito', price: 25 }, { name: 'Pollo y lomito', price: 25 },
      { name: 'Solo camarones', price: 25.5 }, { name: 'Tres sabores', price: 25.5 }
    ],
    tags: ['organico', 'soja', 'gsesamo'], pair: 'r-polar'
  },
  {
    id: 'r-udon', cat: 'wok', name: 'Shōga Udon Noodles', img: 'shoga-udon-noodles.webp',
    desc: 'Tallarines udon gruesos y suaves salteados al wok con vegetales verdes y tu selección de proteínas, en un vibrante aderezo de jengibre, soya y sésamo.',
    price: null,
    variants: [
      { name: 'Lomito', price: 26 }, { name: 'Pollo y lomito', price: 26 },
      { name: 'Pollo y camarones', price: 26 }, { name: 'Lomito y camarones', price: 26.5 },
      { name: 'Solo camarones', price: 27 }
    ],
    tags: ['organico', 'gluten', 'soja', 'gsesamo'], pair: 'r-moscow'
  },
  {
    id: 'r-thaiseafood', cat: 'wok', name: 'Thai SeaFood', img: 'thai-seafood.webp',
    desc: 'Una delicia tailandesa elaborada con tallarines de arroz, calamares, langostinos, pulpo y vegetales frescos, salteados al wok en una cremosa y exótica salsa de leche de coco y curry amarillo.',
    price: 29.5, variants: [], tags: ['picante', 'organico', 'soja', 'gsesamo'], pair: 'r-pinacolada'
  },
  {
    id: 'r-yorokobi', cat: 'wok', name: 'Yorokobi', img: 'yorokobi.webp',
    desc: 'Trozos de pollo, lomito y/o langostinos salteados a fuego alto con vegetales de temporada en una profunda salsa de ostras, soya y jengibre. Servido humeante en plato caliente.',
    price: null,
    variants: [
      { name: 'Pollo', price: 19.5 }, { name: 'Pollo y lomito', price: 20.5 },
      { name: 'Pollo y camarones', price: 20.5 }, { name: 'Lomito', price: 21 },
      { name: 'Lomito y camarones', price: 21.5 }, { name: 'Solo camarones', price: 21.5 },
      { name: 'Tres sabores (lomito, pollo y camarones)', price: 21.5 }
    ],
    tags: ['organico', 'soja', 'gsesamo'], pair: 'r-stella'
  },
  {
    id: 'r-unadon', cat: 'wok', name: 'Unadon Kabayaki', img: 'unadon-kabayaki.webp', hero: true,
    desc: 'Auténtico de la gastronomía japonesa al estilo ZHUBA: filet de anguila caramelizado en plancha caliente con sake y salsa unadon, servido en vaporera de bambú sobre cama de arroz gohan, acompañado de vegetales salteados al wok.',
    price: 59.5, variants: [], tags: ['organico', 'gluten', 'pescados', 'soja'], pair: 'r-gintonic'
  },

  /* ---------------------------------------------------------- BARRA */
  {
    id: 'r-moscow', cat: 'barra', name: 'Moscow Mule', img: 'moscow-mule.webp',
    desc: 'Vodka, cerveza de jengibre y jugo de lima, servido en taza de cobre. Marida con toda nuestra gastronomía: el jengibre refresca y limpia el paladar entre bocados.',
    price: 8.5, variants: [], tags: []
  },
  {
    id: 'r-pinacolada', cat: 'barra', name: 'Piña Colada ZHUBA', img: 'pina-colada-zhuba.webp',
    desc: 'De nuestra coctelería creativa: cremosa piña colada elaborada con bases naturales de elaboración propia.',
    price: 9, variants: [], tags: []
  },
  {
    id: 'r-zhubafrozen', cat: 'barra', name: 'ZHUBA Cocktail Frozen', img: 'zhuba-cocktail-frozen.webp',
    desc: 'Vodka, ron blanco premium, licor de manzana verde, licor de melocotón, blue curaçao, licor de coco, reducción de maracuyá y bursting boba.',
    price: 8.5, variants: [], tags: []
  },
  {
    id: 'r-waikoloa', cat: 'barra', name: 'Waikoloa Cocktail Frozen', img: 'waikoloa-cocktail-frozen.webp',
    desc: 'Herbal y tropical: London Gin, maracuyá, licor de maracuyá, licor de mango, pera del cactus, sweet & sour, licor de coco y bursting boba.',
    price: 8.5, variants: [], tags: []
  },
  {
    id: 'r-margarita', cat: 'barra', name: 'Margarita', img: 'margarita.webp',
    desc: 'Tequila José Cuervo Silver, triple sec y zumo de limón fresco. En nuestra barra agregamos frutas y sabores naturales.',
    price: null,
    variants: [
      { name: 'Clásica shake', price: 8 }, { name: 'Clásica frozen', price: 8.5 },
      { name: 'Red berries', price: 8.5 }, { name: 'Peach mango', price: 8.5 },
      { name: 'Green apple – kiwi', price: 8.5 }, { name: 'Pineapple coconut', price: 8.5 },
      { name: 'Passions maracuyá', price: 8.5 }
    ],
    tags: []
  },
  {
    id: 'r-mojito', cat: 'barra', name: 'Mojitos', img: 'mojitos.webp',
    desc: 'Tradicional y refrescante: ron blanco, hierbabuena fresca, limón, azúcar y emulsiones frutales según tu elección.',
    price: null,
    variants: [
      { name: 'Clásico', price: 6.5 }, { name: 'Passions maracuyá', price: 7 },
      { name: 'Red berries', price: 7 }, { name: 'Coconut', price: 7 },
      { name: 'Menta vainilla', price: 7 }, { name: 'Green sours', price: 7 },
      { name: 'Mango tropical', price: 7 }
    ],
    tags: []
  },
  {
    id: 'r-gintonic', cat: 'barra', name: 'Gin Tonic Freshened', img: 'gin-tonic-freshened.webp',
    desc: 'Hendricks Gin, agua tónica, extracto puro de pepino y slices de piel de pepino para enaltecer las notas frescas y herbales.',
    price: 9.5, variants: [], tags: []
  },
  {
    id: 'r-coronita', cat: 'barra', name: 'Coronita', img: 'coronita.webp',
    desc: 'Cerveza pilsner de color amarillo pajizo con tonalidades doradas y suaves notas a cereales. 4,5° de alcohol.',
    price: 4.5, variants: [], tags: []
  },
  {
    id: 'r-stella', cat: 'barra', name: 'Cerveza Stella Artois', img: 'cerveza-stella-artois.webp',
    desc: 'Aroma floral, dulzura de malta bien equilibrada, amargor crujiente de lúpulo y final suave y seco.',
    price: 5.5, variants: [], tags: []
  },
  {
    id: 'r-polar', cat: 'barra', name: 'Cerveza Polar Pilsen', img: 'cerveza-polar-pilsen.webp',
    desc: 'Color dorado y espuma blanca, aroma ligero a malta y maíz. Cuerpo ligero, algo dulce. 4,5° G.L.',
    price: 3.5, variants: [], tags: []
  }
];
