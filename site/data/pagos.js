/**
 * Cobro y envío.
 *
 * Los precios de la carta están anclados al dólar, pero se cobra en bolívares
 * a la tasa oficial. Aquí vive todo lo que hace falta para eso: de dónde sale
 * la tasa, con qué se puede pagar y cuánto cuesta llevarlo.
 *
 * IMPORTANTE — lo que va vacío va vacío a propósito. Los datos de pago del
 * restaurante y las tarifas de envío son suyos, no míos: se escriben aquí y
 * se despliegan. Mientras estén vacíos, la web lo dice y remite a WhatsApp
 * en vez de enseñar una cifra inventada.
 */

export const TASA = {
  // Dólar oficial (BCV). Devuelve { promedio, fechaActualizacion }.
  fuente: 'https://ve.dolarapi.com/v1/dolares/oficial',
  etiqueta: 'Tasa oficial BCV',
  // Si la consulta falla se usa la última conocida, guardada en el navegador.
  // Nunca se inventa una: sin tasa, la web muestra solo el precio en dólares.
  refrescarCada: 6 * 60 * 60 * 1000
};

/**
 * Los datos con los que el local cobra, tal y como los verá el cliente.
 *
 * Van aquí, en el sitio, y se despliegan: así los ve todo el mundo. Antes
 * se escribían en el panel, que solo los guardaba en ese navegador — y el
 * cliente, en su teléfono, seguía viendo «solo efectivo».
 *
 * Un método sin todos sus campos no se le ofrece a nadie, así que dejar
 * esto vacío es seguro: se cobra en efectivo y el resto se acuerda por
 * WhatsApp. Lo que no se sabe, no se inventa.
 */
export const PAGOS_PUBLICADOS = {
  // 'pago-movil':   { banco: '', telefono: '', documento: '' },
  // 'transferencia': { banco: '', cuenta: '', titular: '', documento: '' },
  // 'zelle':        { correo: '', titular: '' },
  // 'binance':      { usuario: '' }
};

/**
 * Métodos de cobro. `campos` son los datos que hacen falta para ofrecer cada
 * uno; sus valores están arriba, en PAGOS_PUBLICADOS. Un método al que le
 * falte un campo no se le ofrece a nadie.
 */
export const METODOS_PAGO = [
  {
    id: 'pago-movil', nombre: 'Pago móvil', nota: 'El más rápido para pagar en bolívares.',
    campos: [
      { id: 'banco', label: 'Banco', placeholder: 'Ej. Banesco 0134' },
      { id: 'telefono', label: 'Teléfono', placeholder: 'Ej. 0412-0000000' },
      { id: 'documento', label: 'Cédula o RIF', placeholder: 'Ej. J-000000000' }
    ]
  },
  {
    id: 'transferencia', nombre: 'Transferencia', nota: 'Cuenta en bolívares.',
    campos: [
      { id: 'banco', label: 'Banco', placeholder: 'Ej. Banesco' },
      { id: 'cuenta', label: 'Número de cuenta', placeholder: '0000 0000 0000 0000 0000' },
      { id: 'titular', label: 'Titular', placeholder: 'Nombre o razón social' },
      { id: 'documento', label: 'Cédula o RIF', placeholder: 'Ej. J-000000000' }
    ]
  },
  {
    id: 'zelle', nombre: 'Zelle', nota: 'Se paga en dólares, sin conversión.', enDolares: true,
    campos: [
      { id: 'correo', label: 'Correo', placeholder: 'pagos@ejemplo.com' },
      { id: 'titular', label: 'Titular', placeholder: 'Nombre del titular' }
    ]
  },
  {
    id: 'binance', nombre: 'Binance Pay', nota: 'Se paga en dólares, sin conversión.', enDolares: true,
    campos: [{ id: 'usuario', label: 'Usuario o Pay ID', placeholder: 'Ej. zhuba_ve' }]
  },
  {
    id: 'efectivo', nombre: 'Efectivo al recibir', nota: 'Pagas al recibir el pedido.',
    sinComprobante: true, campos: []
  }
];

/**
 * Envío por distancia, al estilo de un viaje: se toma la ubicación, se mide en
 * línea recta hasta el restaurante y cae en un anillo. Fuera del último, no
 * hay delivery — más vale decirlo antes que dejar a alguien esperando.
 */
export const ENVIO = {
  /**
   * Tarifa por distancia: una salida fija más tanto por kilómetro, con un
   * suelo opcional. Se calcula en cuanto el cliente marca a dónde va, y la
   * web enseña la cifra ahí mismo.
   *
   * Mientras `base` o `porKm` estén en null no hay tarifa y se cae a los
   * anillos de más abajo; si esos tampoco tienen precio, la web dice «por
   * confirmar». Nunca se inventa una cifra: el envío lo cobra el local.
   */
  // PROVISIONAL (16/09/2026): cifras para tantear, a falta de que el dueño
  // confirme cuánto le paga al motorizado por viaje. Calibradas para que
  // Maracay caiga entre $2 y $4 —centro 2,50 · Las Delicias 3,50 · El Castaño
  // 4,00— y el borde de los 12 km ronde los 6,50.
  tarifa: {
    base: 1.5,         // dólares por salir a repartir
    porKm: 0.4,        // dólares por kilómetro, en línea recta
    minimo: 2,         // suelo, en dólares
    redondearA: 0.5    // se redondea hacia arriba a este múltiplo (0 = sin redondeo)
  },

  // Centroide de la urbanización La Floresta según OpenStreetMap. La calle
  // exacta no está cartografiada; para medir anillos de kilómetros sobra.
  origen: { lat: 10.270717, lng: -67.587758 },
  // `precio` en dólares, null = sin definir. Los define el restaurante.
  anillos: [
    { id: 'a1', hasta: 2, etiqueta: 'Hasta 2 km', precio: null },
    { id: 'a2', hasta: 4, etiqueta: '2 – 4 km', precio: null },
    { id: 'a3', hasta: 7, etiqueta: '4 – 7 km', precio: null },
    { id: 'a4', hasta: 12, etiqueta: '7 – 12 km', precio: null }
  ],
  maxKm: 12,
  minimoPedido: null,     // dólares; null = sin mínimo
  // Ventana donde busca el autocompletado de direcciones (Nominatim):
  // el área de Maracay. Si ahí no hay nada se repregunta sin acotar, y
  // si el resultado cae lejos lo rechaza el propio cálculo de anillos.
  busqueda: { viewbox: '-67.78,10.43,-67.40,10.11', ciudad: 'Maracay' }
};

