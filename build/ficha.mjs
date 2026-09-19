/**
 * Escribe la ficha de datos estructurados (JSON-LD) de las dos casas a partir
 * de los mismos ficheros que dibujan la web.
 *
 * Por qué se genera y no se escribe a mano: la carta tiene 103 platos con su
 * precio, su foto y sus alérgenos. Copiarlos a mano a un JSON garantiza que
 * el día que suba un precio, Google siga enseñando el viejo. Aquí la única
 * fuente son `data/menu-*.js` y `data/branches.js`, y este guion los traduce.
 *
 * Qué NO se escribe, y es a propósito:
 *
 *  · `aggregateRating`. La nota de Google se enseña en la página con enlace a
 *    su ficha para que cualquiera la compruebe, pero marcarla aquí es marcar
 *    una nota sobre uno mismo tomada de otro sitio, y la política de datos
 *    estructurados de Google lo prohíbe: arriesga que ignoren todo el
 *    marcado, no solo la nota.
 *  · `paymentAccepted`. Los datos de pago publicados hoy son de prueba. En
 *    cuanto el local dé los suyos, se añade aquí en una línea.
 *
 * uso: node build/ficha.mjs        (reescribe index.html y pedir.html)
 *      node build/ficha.mjs --ver  (solo enseña el JSON, no toca nada)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SITIO = path.join(AQUI, '..', 'site');
const BASE = 'https://zhuba-maracay.vercel.app';

const carga = (rel) => import(pathToFileURL(path.join(SITIO, rel)).href);

const { BRANCHES, COMPLEJO } = await carga('data/branches.js');
const { ENVIO } = await carga('data/pagos.js');
const MENUS = {
  restaurante: await carga('data/menu-restaurante.js'),
  cafe: await carga('data/menu-cafe.js')
};

/* Schema.org solo entiende de dieta unas cuantas cosas, y «orgánico» o
   «picante» no son una de ellas. */
const DIETAS = {
  vegano: 'https://schema.org/VeganDiet',
  vegetariano: 'https://schema.org/VegetarianDiet'
};

const absoluta = (rel) => `${BASE}/${String(rel).replace(/^\//, '')}`;
const dinero = (n) => n.toFixed(2);

/** La dirección, que es la misma para las dos casas: comparten complejo. */
const direccion = {
  '@type': 'PostalAddress',
  streetAddress: '17 Calle Los Clubes, casa nro 10, Urb. La Floresta',
  addressLocality: 'Maracay',
  addressRegion: 'Aragua',
  postalCode: '2101',
  addressCountry: 'VE'
};

/* Las coordenadas son las que el propio sitio usa para cobrar el envío: si
   estuvieran mal, el envío saldría mal, así que están comprobadas. */
const geo = {
  '@type': 'GeoCoordinates',
  latitude: ENVIO.origen.lat,
  longitude: ENVIO.origen.lng
};

const horarios = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
    opens: '12:00', closes: '00:00'
  },
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Thursday', 'Friday', 'Saturday'],
    opens: '12:00', closes: '01:00'
  }
];

/** Lo que cuesta un plato, en el idioma de schema.org. */
function ofertas(item) {
  const oferta = (precio, nombre) => ({
    '@type': 'Offer',
    ...(nombre ? { name: nombre } : {}),
    price: dinero(precio),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock'
  });

  if (item.price != null) return oferta(item.price);
  if (item.variants?.length) return item.variants.map((v) => oferta(v.price, v.name));
  return null;   // lo de vitrina no tiene precio, tiene aviso
}

function plato(item) {
  const of = ofertas(item);
  const dietas = (item.tags || []).map((t) => DIETAS[t]).filter(Boolean);
  return {
    '@type': 'MenuItem',
    name: item.name,
    ...(item.desc ? { description: item.desc } : {}),
    ...(item.img ? { image: absoluta(`img/${item.img}`) } : {}),
    ...(of ? { offers: of } : {}),
    ...(dietas.length ? { suitableForDiet: dietas.length === 1 ? dietas[0] : dietas } : {})
  };
}

function carta(sede) {
  const { CATEGORIES, ITEMS } = MENUS[sede.menu];
  return {
    '@type': 'Menu',
    '@id': `${BASE}/pedir#carta-${sede.id}`,
    name: `Carta de ${sede.name}`,
    inLanguage: 'es-VE',
    url: `${BASE}/pedir?sede=${sede.id}`,
    hasMenuSection: CATEGORIES.map((cat) => ({
      '@type': 'MenuSection',
      name: cat.name,
      ...(cat.blurb ? { description: cat.blurb } : {}),
      hasMenuItem: ITEMS.filter((i) => i.cat === cat.id).map(plato)
    })).filter((s) => s.hasMenuItem.length)
  };
}

/** De cuánto a cuánto se come aquí, sacado de la carta y no a ojo. */
function franjaDePrecio(sede) {
  const precios = MENUS[sede.menu].ITEMS
    .flatMap((i) => (i.price != null ? [i.price] : (i.variants || []).map((v) => v.price)))
    .filter((n) => typeof n === 'number');
  if (!precios.length) return null;
  return `$${Math.min(...precios).toFixed(2)}–$${Math.max(...precios).toFixed(2)}`;
}

function casa(sede, tipo, fotos) {
  const franja = franjaDePrecio(sede);
  return {
    '@type': tipo,
    '@id': `${BASE}/#${sede.id}`,
    name: sede.name,
    description: sede.heroSub,
    url: BASE,
    image: fotos.map((f) => absoluta(`img/${f}.webp`)),
    telephone: `+${sede.whatsapp}`,   // en E.164, que es lo que espera schema.org
    address: direccion,
    geo,
    hasMap: sede.maps,
    // «Otra zona de Maracay» es una opción del formulario, no un sitio: se
    // queda fuera y en su lugar va la ciudad entera.
    areaServed: [
      { '@type': 'City', name: 'Maracay', addressRegion: 'Aragua', addressCountry: 'VE' },
      ...sede.deliveryZones
        .filter((z) => !/^otra/i.test(z))
        .map((z) => ({ '@type': 'Place', name: `${z}, Maracay` }))
    ],
    openingHoursSpecification: horarios,
    ...(franja ? { priceRange: franja } : {}),
    currenciesAccepted: 'USD, VES',
    acceptsReservations: sede.whatsappDirect,
    hasMenu: carta(sede),
    sameAs: [
      'https://www.instagram.com/zhubarestaurant/',
      'https://www.facebook.com/zhubarestaurant/',
      'https://www.zhubarestaurant.com'
    ],
    potentialAction: {
      '@type': 'OrderAction',
      name: 'Pedir en línea',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE}/pedir?sede=${sede.id}`,
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform'
        ]
      },
      deliveryMethod: [
        'https://schema.org/OnSitePickup',
        'https://schema.org/ParcelService'
      ]
    }
  };
}

const restaurante = BRANCHES.find((b) => b.id === 'restaurante');
const cafe = BRANCHES.find((b) => b.id === 'cafe');

const grafo = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      ...casa(restaurante, 'Restaurant', restaurante.heroPhotos.flat().slice(0, 4)),
      servesCuisine: ['Japonesa', 'Tailandesa', 'Nikkei', 'Asiática contemporánea']
    },
    {
      ...casa(cafe, 'CafeOrCoffeeShop', cafe.heroPhotos.flat().slice(0, 4)),
      servesCuisine: ['Italiana', 'Pastelería', 'Cafetería']
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE}/#web`,
      url: BASE,
      name: 'ZHUBA Restaurant & Café',
      description: COMPLEJO.sub,
      inLanguage: 'es-VE',
      publisher: { '@id': `${BASE}/#restaurante` }
    }
  ]
};

/**
 * La carta entera son 90 kB de JSON. Repetirla en las dos páginas es cargarle
 * 90 kB a cada visita de un teléfono para algo que solo lee un robot, así que
 * la definición completa vive donde vive la carta —/pedir— y la portada se
 * limita a apuntar a ella por su `@id`, que es como schema.org enlaza cosas
 * entre páginas. Y va sin sangrar: el JSON-LD no lo lee nadie con los ojos.
 */
function bloque(conCarta) {
  const g = {
    ...grafo,
    '@graph': grafo['@graph'].map((n) => (
      n.hasMenu && !conCarta ? { ...n, hasMenu: { '@id': n.hasMenu['@id'] } } : n
    ))
  };
  return `<script type="application/ld+json">${JSON.stringify(g)}</script>`;
}

if (process.argv.includes('--ver')) {
  console.log(JSON.stringify(grafo, null, 2));
  process.exit(0);
}

const ABRE = '<!-- ficha:inicio · la genera build/ficha.mjs; no se edita a mano -->';
const CIERRA = '<!-- ficha:fin -->';

let tocados = 0;
for (const [pagina, conCarta] of [['index.html', false], ['pedir.html', true]]) {
  const ruta = path.join(SITIO, pagina);
  const html = fs.readFileSync(ruta, 'utf8');
  const i = html.indexOf(ABRE);
  const j = html.indexOf(CIERRA);
  if (i < 0 || j < 0) {
    console.error(`· ${pagina}: faltan las marcas de la ficha, no se toca`);
    continue;
  }
  const trozo = bloque(conCarta);
  const nuevo = html.slice(0, i) + ABRE + '\n' + trozo + '\n' + html.slice(j);
  if (nuevo !== html) { fs.writeFileSync(ruta, nuevo); tocados++; }
  console.log(`· ${pagina}: ${(trozo.length / 1024).toFixed(1)} kB`
    + `${conCarta ? ' con la carta entera' : ' (la carta, por referencia)'}`);
}

const platos = grafo['@graph']
  .filter((n) => n.hasMenu)
  .reduce((n, c) => n + c.hasMenu.hasMenuSection.reduce((m, s) => m + s.hasMenuItem.length, 0), 0);
console.log(`\n${platos} platos marcados en 2 cartas · ${tocados} página(s) reescritas`);
