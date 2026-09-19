/**
 * Lo que falta por preguntarle al local, en una lista que no se olvida.
 *
 * Durante el desarrollo hay decisiones que no se pueden tomar por el negocio
 * —cuánto cobra el envío, a qué teléfono se hace el pago móvil, si el precio
 * de un plato sigue siendo ese— y mientras no llegan se ponen datos
 * provisionales o de prueba. El problema no es ponerlos: es olvidarse de que
 * están puestos. Esta lista es la memoria.
 *
 * Cada ficha dice qué se pregunta, **por qué importa** y **dónde vive en el
 * código**, para que quien la rellene entienda qué está desbloqueando y quien
 * la lea después sepa qué archivo tocar.
 *
 * `urgencia` no es decoración:
 *   alta  · hoy hay un dato falso publicado o algo que impide cobrar
 *   media · limita lo que la web puede hacer, pero no engaña a nadie
 *   baja  · mejora, sin prisa
 */

export const GRUPOS = [
  { id: 'cobro', titulo: 'Cobro y envío', pie: 'Sin esto la web no puede cobrar nada.' },
  { id: 'legal', titulo: 'Legales', pie: 'Hace falta para las páginas de privacidad y términos.' },
  { id: 'carta', titulo: 'La carta', pie: 'Lo que se enseña de cada plato.' },
  { id: 'marca', titulo: 'Marca y presencia', pie: 'Cómo te encuentran y dónde vive la web.' }
];

export const FICHAS = [
  /* ------------------------------------------------------------- cobro */
  {
    id: 'pago-movil',
    grupo: 'cobro',
    urgencia: 'alta',
    titulo: 'Datos del pago móvil',
    porque: 'Hoy la web publica 0412-000 00 00 y un RIF en ceros. Es un dato de prueba '
          + 'puesto para poder enseñarte la página: tal como está, nadie te puede pagar.',
    pregunta: '¿A qué banco, teléfono y cédula o RIF se hace el pago móvil?',
    destino: "site/data/pagos.js · PAGOS_PUBLICADOS['pago-movil']",
    campos: [
      { id: 'banco', etiqueta: 'Banco', tipo: 'texto', ejemplo: 'Banesco (0134)' },
      { id: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', ejemplo: '0412-1234567' },
      { id: 'documento', etiqueta: 'Cédula o RIF', tipo: 'texto', ejemplo: 'J-123456789' }
    ]
  },
  {
    id: 'zelle',
    grupo: 'cobro',
    urgencia: 'alta',
    titulo: 'Datos de Zelle',
    porque: 'El correo publicado es pagos@example.com. Ese dominio está reservado para '
          + 'ejemplos y Zelle no lo admite: es un dato de prueba.',
    pregunta: '¿A qué correo y a nombre de quién llega el Zelle?',
    destino: "site/data/pagos.js · PAGOS_PUBLICADOS['zelle']",
    campos: [
      { id: 'correo', etiqueta: 'Correo', tipo: 'email', ejemplo: 'pagos@zhubarestaurant.com' },
      { id: 'titular', etiqueta: 'Titular', tipo: 'texto', ejemplo: 'Nombre y apellido del titular' }
    ]
  },
  {
    id: 'binance',
    grupo: 'cobro',
    urgencia: 'alta',
    titulo: 'Usuario de Binance Pay',
    porque: 'El Pay ID publicado son nueve ceros. Dato de prueba.',
    pregunta: '¿Cuál es el usuario o Pay ID de Binance?',
    destino: "site/data/pagos.js · PAGOS_PUBLICADOS['binance']",
    campos: [
      { id: 'usuario', etiqueta: 'Usuario o Pay ID', tipo: 'texto', ejemplo: 'zhuba_ve' }
    ]
  },
  {
    id: 'metodos',
    grupo: 'cobro',
    urgencia: 'media',
    titulo: 'Qué formas de pago aceptas',
    porque: 'La web solo ofrece un método cuando tiene todos sus datos, así que publicar '
          + 'uno que no usas no rompe nada — pero sobra, y ensucia el paso de pago.',
    pregunta: '¿Cuáles de estas cobras de verdad?',
    destino: 'site/data/pagos.js · METODOS_PAGO y PAGOS_PUBLICADOS',
    campos: [
      {
        id: 'acepta', etiqueta: 'Formas de pago', tipo: 'opciones',
        opciones: ['Pago móvil', 'Transferencia', 'Zelle', 'Binance Pay', 'Efectivo al recibir']
      }
    ]
  },
  {
    id: 'envio',
    grupo: 'cobro',
    urgencia: 'alta',
    titulo: 'Cuánto cuesta el envío',
    porque: 'Hoy la web cobra $1,50 de salida más $0,40 por kilómetro, con mínimo $2 y tope '
          + 'de 12 km. Son cifras puestas a ojo el 16/09 para poder enseñar el cálculo: '
          + 'están calibradas para que Maracay caiga entre $2 y $4, pero nadie las ha '
          + 'confirmado. El cliente ve ese número y lo da por bueno.',
    pregunta: '¿Cuánto le pagas al motorizado por viaje, y cómo quieres cobrarlo?',
    destino: 'site/data/pagos.js · ENVIO.tarifa',
    campos: [
      { id: 'base', etiqueta: 'Fijo por salir ($)', tipo: 'numero', ejemplo: '1.50' },
      { id: 'porKm', etiqueta: 'Por kilómetro ($)', tipo: 'numero', ejemplo: '0.40' },
      { id: 'minimo', etiqueta: 'Mínimo a cobrar ($)', tipo: 'numero', ejemplo: '2.00' },
      { id: 'maxKm', etiqueta: 'Hasta cuántos km reparten', tipo: 'numero', ejemplo: '12' }
    ],
    nota: 'Turmero y Palo Negro caen en 12,3 y 12,5 km: con el tope en 12 se quedan fuera.'
  },
  {
    id: 'minimo-pedido',
    grupo: 'cobro',
    urgencia: 'baja',
    titulo: 'Pedido mínimo para delivery',
    porque: 'Hoy no hay ninguno: se puede pedir un café y mandarlo a 10 km.',
    pregunta: '¿Hay un mínimo para que salga un delivery?',
    destino: 'site/data/pagos.js · ENVIO.minimoPedido',
    confirmable: 'No, sin mínimo',
    campos: [
      { id: 'minimoPedido', etiqueta: 'Mínimo ($)', tipo: 'numero', ejemplo: '10' }
    ]
  },

  /* ------------------------------------------------------------- legal */
  {
    id: 'razon-social',
    grupo: 'legal',
    urgencia: 'media',
    titulo: 'Razón social y RIF',
    porque: 'La web pide nombre, teléfono, dirección y ubicación exacta. Quien responda por '
          + 'esos datos tiene que aparecer con nombre y apellidos en el aviso legal.',
    pregunta: '¿A nombre de qué empresa y con qué RIF opera el local?',
    destino: 'las páginas legales (todavía por escribir)',
    campos: [
      { id: 'razon', etiqueta: 'Razón social', tipo: 'texto', ejemplo: 'Inversiones ZHUBA, C.A.' },
      { id: 'rif', etiqueta: 'RIF', tipo: 'texto', ejemplo: 'J-123456789' }
    ]
  },
  {
    id: 'correo-datos',
    grupo: 'legal',
    urgencia: 'media',
    titulo: 'Correo para temas de datos',
    porque: 'Un cliente tiene derecho a pedir que borres lo que tienes suyo, y necesita un '
          + 'sitio donde pedirlo. En la web ya aparece atencion@zhubarestaurant.com.',
    pregunta: '¿Ese correo sirve, o prefieres otro?',
    destino: 'la política de privacidad',
    confirmable: 'Sí, vale atencion@zhubarestaurant.com',
    campos: [
      { id: 'correo', etiqueta: 'Otro correo', tipo: 'email', ejemplo: 'datos@zhubarestaurant.com' }
    ]
  },
  {
    id: 'retencion',
    grupo: 'legal',
    urgencia: 'media',
    titulo: 'Cuánto se guardan los pedidos',
    porque: 'El registro que alimenta este informe guarda un apunte de cada pedido. En la '
          + 'política hay que decir cuánto tiempo se queda ahí, y luego hay que cumplirlo.',
    pregunta: '¿Cuántos meses quieres conservar el histórico de pedidos?',
    destino: 'la política de privacidad y una limpieza programada en Supabase',
    campos: [
      { id: 'meses', etiqueta: 'Meses', tipo: 'numero', ejemplo: '24' }
    ]
  },
  {
    id: 'registro',
    grupo: 'legal',
    urgencia: 'baja',
    titulo: 'Si quieres que se guarde el registro',
    porque: 'El apunte no lleva nombre ni dirección de nadie —solo cuántos, de qué y por '
          + 'cuánto— pero es una decisión tuya. Si dices que no, este informe se queda sin '
          + 'números y la web sigue funcionando igual.',
    pregunta: '¿Seguimos apuntando cada pedido para el informe?',
    destino: 'site/data/remoto.js · REMOTO',
    confirmable: 'Sí, que se siga apuntando',
    campos: [
      { id: 'decision', etiqueta: 'Si no, explica por qué', tipo: 'area', ejemplo: '' }
    ]
  },

  /* ------------------------------------------------------------- carta */
  {
    id: 'precios',
    grupo: 'carta',
    urgencia: 'alta',
    titulo: 'Que los precios sigan siendo estos',
    porque: 'Los 103 precios se sacaron de tu carta digital el 01/09/2026. Si alguno subió, '
          + 'la web está cobrando de menos y el cliente lo va a reclamar.',
    pregunta: '¿Los precios de la carta están al día?',
    destino: 'site/data/menu-restaurante.js y menu-cafe.js',
    confirmable: 'Sí, están al día',
    campos: [
      { id: 'cambios', etiqueta: 'Qué cambió', tipo: 'area', ejemplo: 'Fukkatsu ZHUBA Roll: 27,50' }
    ]
  },
  {
    id: 'gelato',
    grupo: 'carta',
    urgencia: 'media',
    titulo: 'Los sabores de gelato',
    porque: 'La carta dice «uno o dos sabores de gelato» y no dice cuáles. El cliente tiene '
          + 'que escribir para preguntarlo, que es justo lo que la web viene a evitar.',
    pregunta: '¿Qué sabores hay, y cambian por temporada?',
    destino: 'site/data/menu-cafe.js · variantes de la sección Gelato',
    campos: [
      { id: 'sabores', etiqueta: 'Sabores', tipo: 'area', ejemplo: 'Pistacho, stracciatella, …' }
    ]
  },
  {
    id: 'fotos-faltan',
    grupo: 'carta',
    urgencia: 'media',
    titulo: 'Fotos de 14 platos',
    porque: 'Desde que la carta va en tarjetas de dos en dos, un plato sin foto es medio '
          + 'cuadro oscuro en mitad de la pantalla. Antes pasaba desapercibido.',
    pregunta: 'Faltan: Montadito ZHUBA, Aguachile ZHUBA, Strudel de Manzana con Gelato, '
            + 'Bubble Waffle Fresa–Nutella, Fresas con Crema, Alta Pastelería, Bollería Fina, '
            + 'Honey-Dijon Chicken, Smoked Salmón, Carajillo, Café Bombón, Tropical Wild Iced '
            + 'Tea, Cranberry Iced Tea y Matcha Iced Tea.',
    destino: 'site/img/ y el campo `img` de cada plato',
    campos: [
      { id: 'como', etiqueta: 'Cómo las mandas', tipo: 'area', ejemplo: 'Por WhatsApp esta semana' }
    ]
  },
  {
    id: 'fotos-calidad',
    grupo: 'carta',
    urgencia: 'baja',
    titulo: 'Fotos sin la marca de agua',
    porque: 'Varias fotos traen el logo ZHUBA quemado encima, porque se bajaron de la carta '
          + 'digital. Con los originales la carta se ve bastante mejor.',
    pregunta: '¿Tienes los originales sin marca de agua?',
    destino: 'site/img/',
    confirmable: 'No hay originales, se quedan así',
    campos: [
      { id: 'donde', etiqueta: 'Dónde están', tipo: 'area', ejemplo: 'Drive del fotógrafo' }
    ]
  },

  /* ------------------------------------------------------------- marca */
  {
    id: 'dominio',
    grupo: 'marca',
    urgencia: 'alta',
    titulo: 'Mudar la web a zhubarestaurant.com',
    porque: 'La web vive en zhuba-maracay.vercel.app. Tú eres dueño de zhubarestaurant.com, '
          + 'que es a donde lleva el enlace de tu Instagram y donde está toda tu historia en '
          + 'Google. Mudarla ahí trae más visitas que cualquier otro ajuste, y de paso los '
          + '106 mil seguidores llegan a una carta que se puede pedir.',
    pregunta: '¿Movemos la web a tu dominio? Hace falta entrar donde lo compraste.',
    destino: 'Vercel · dominios del proyecto, y la URL base en toda la web',
    campos: [
      { id: 'proveedor', etiqueta: 'Dónde está comprado', tipo: 'texto', ejemplo: 'GoDaddy, Namecheap…' },
      { id: 'acceso', etiqueta: 'Quién tiene el acceso', tipo: 'texto', ejemplo: '' }
    ]
  },
  {
    id: 'nota-google',
    grupo: 'marca',
    urgencia: 'media',
    titulo: 'La nota de Google',
    porque: 'La web dice 4,8 con 768 reseñas, en dos sitios. No se ha podido comprobar, y un '
          + 'número viejo sobre uno mismo es un dato falso en la portada.',
    pregunta: '¿Cuántas reseñas y qué nota tienes hoy en tu perfil de Google?',
    destino: 'site/data/branches.js · RATING',
    confirmable: 'Sigue siendo 4,8 con 768',
    campos: [
      { id: 'nota', etiqueta: 'Nota', tipo: 'texto', ejemplo: '4,8' },
      { id: 'resenas', etiqueta: 'Reseñas', tipo: 'numero', ejemplo: '768' }
    ]
  },
  {
    id: 'horario',
    grupo: 'marca',
    urgencia: 'media',
    titulo: 'El horario',
    porque: 'La web enseña «abierto ahora» o «cerrado» según este horario, y Google lo lee '
          + 'de la ficha. Si está mal, manda gente a la puerta cerrada.',
    pregunta: 'Hoy dice: todos los días de 12:00 m. a 12:00 a.m., y de jueves a sábado hasta '
            + 'la 1:00 a.m. ¿Sigue así?',
    destino: 'site/data/branches.js · hours, y build/ficha.mjs',
    confirmable: 'Sí, ese es el horario',
    campos: [
      { id: 'horario', etiqueta: 'El horario correcto', tipo: 'area', ejemplo: '' }
    ]
  },
  {
    id: 'whatsapp',
    grupo: 'marca',
    urgencia: 'baja',
    titulo: 'A qué WhatsApp llegan los pedidos',
    porque: 'Todos los pedidos entran al 0412-4554207, indicando la sede dentro del mensaje. '
          + 'El café publica un enlace wa.me/message/… que no admite texto precargado, así '
          + 'que por ahí el pedido llegaría vacío.',
    pregunta: '¿Está bien que los dos vayan al mismo número, o el café tiene el suyo?',
    destino: 'site/data/branches.js · whatsapp de cada sede',
    confirmable: 'Sí, todo al 0412-4554207',
    campos: [
      { id: 'numeroCafe', etiqueta: 'Número del café', tipo: 'tel', ejemplo: '0412-0000000' }
    ]
  }
];

/** Cuántas fichas hay por grupo, para no contarlo en la vista. */
export const porGrupo = (grupo) => FICHAS.filter((f) => f.grupo === grupo);
