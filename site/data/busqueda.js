/**
 * Lo que el buscador necesita saber de la carta y que no está escrito en ella.
 *
 * El cliente busca con sus palabras, no con las de la carta. Escribe «sushi»
 * y espera rolls, nigiris y sashimi, aunque ninguno lleve esa palabra; escribe
 * «camarones» y en la carta pone «Ebi». Aquí se apunta ese puente.
 *
 * Todo en minúsculas y sin tildes. Solo equivalencias que existen de verdad en
 * las dos cartas: una que no aparezca en ningún plato no encuentra nada.
 */

/**
 * De qué va cada categoría, en las palabras del cliente. Sustituye al nombre de
 * la categoría como pista, porque el nombre engaña: «Aperitivos & Sushi Bar»
 * hacía que «sushi» devolviera el edamame y las alitas, y ni un roll.
 */
export const CLAVES_CATEGORIA = {
  // restaurante
  aperitivos: ['aperitivo', 'entrada', 'entrante', 'picar', 'compartir'],
  firma: ['sushi', 'roll', 'maki', 'firma'],
  tempura: ['sushi', 'roll', 'maki', 'tempura', 'panko', 'frito', 'crujiente'],
  tradicionales: ['sushi', 'roll', 'maki', 'clasico', 'tradicional'],
  sashimi: ['sushi', 'sashimi', 'nigiri', 'crudo', 'pescado'],
  crudos: ['tartar', 'ceviche', 'poke', 'crudo', 'aguachile', 'tiradito', 'pescado'],
  wok: ['wok', 'arroz', 'tallarin', 'fideo', 'noodle', 'pasta', 'salteado'],
  // sin «cerveza»: quien busca cerveza quiere las cervezas, no los cócteles de la misma barra
  barra: ['bebida', 'trago', 'coctel', 'cocktail', 'alcohol', 'bar'],
  // café
  gelato: ['gelato', 'helado', 'postre', 'dulce'],
  pasteleria: ['postre', 'dulce', 'pastel', 'pasteleria', 'torta', 'reposteria'],
  paninis: ['panini', 'sandwich', 'sanduche', 'emparedado', 'pan'],
  schiacciatas: ['schiacciata', 'sandwich', 'sanduche', 'focaccia', 'pan'],
  hojaldre: ['hojaldre', 'croissant', 'pastelito', 'reposteria', 'pan'],
  calientes: ['cafe', 'bebida', 'caliente', 'infusion'],
  frias: ['bebida', 'fria', 'frio', 'frappe', 'bubble', 'te', 'tea', 'iced', 'refresco']
};

/**
 * Palabra del cliente → palabras que usa la carta para lo mismo. La carta
 * mezcla español, inglés y japonés: el camarón es «ebi», el atún «saku» o
 * «tuna», el pollo «chicken».
 */
export const SINONIMOS = {
  camaron: ['ebi', 'langostino'],
  langostino: ['camaron', 'ebi'],
  ebi: ['camaron', 'langostino'],
  atun: ['tuna', 'saku'],
  tuna: ['atun', 'saku'],
  pollo: ['chicken'],
  chicken: ['pollo'],
  pavo: ['turkey'],
  carne: ['beef', 'lomito', 'res'],
  res: ['beef', 'carne', 'lomito'],
  queso: ['cheese'],
  anguila: ['kabayaki'],
  helado: ['gelato'],
  cafe: ['espresso', 'cappuccino', 'latte', 'macchiato', 'americano'],
  coffee: ['cafe', 'espresso'],
  vegetariano: ['vegano', 'veggie'],
  vegano: ['veggie'],
  veggie: ['vegano'],
  spicy: ['picante'],
  picante: ['spicy'],
  birra: ['cerveza'],
  cerveza: ['polar'],
  trago: ['coctel', 'cocktail'],
  coctel: ['cocktail'],
  cocktail: ['coctel'],
  chocolate: ['nutella', 'brownie'],
  tallarin: ['noodles', 'yakisoba', 'udon'],
  fideo: ['noodles', 'yakisoba', 'udon', 'tallarin'],
  te: ['tea', 'matcha', 'hibiscus']
};

/** Palabras que no ayudan a encontrar nada: «roll de salmón» busca roll y salmón. */
export const VACIAS = ['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'con', 'y', 'o', 'a', 'al',
  'en', 'para', 'por', 'que', 'quiero', 'algo', 'me', 'mi'];
