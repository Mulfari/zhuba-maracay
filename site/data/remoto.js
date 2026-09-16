/**
 * Dónde queda registrado el pedido al enviarlo.
 *
 * El pedido se trabaja por WhatsApp: eso no cambia. Esto es solo el apunte
 * contable —cuántos pedidos salieron, de qué sede, por cuánto— para que el
 * panel pueda enseñar el resumen. Sin esto, cada pedido se queda en el
 * teléfono de quien lo hizo y no hay nada que contar.
 *
 * Vacío = no hay registro compartido y el panel solo ve lo de este
 * navegador. Con la URL y la clave puestas, el apunte viaja a la tabla.
 *
 * La clave anónima es pública a propósito: viaja en el navegador de cada
 * cliente y solo puede hacer lo que permitan las políticas de la tabla
 * (insertar un apunte, nada más). La clave de servicio NO va aquí ni en
 * ningún archivo del sitio.
 */
export const REMOTO = {
  url: '',            // https://xxxxxxxx.supabase.co
  clave: '',          // clave anónima / publishable
  tabla: 'pedidos'
};

export const hayRegistro = () => Boolean(REMOTO.url && REMOTO.clave);

/**
 * Lo que se apunta de cada pedido. A propósito no lleva nombre, dirección ni
 * coordenadas: eso ya le llega al local por WhatsApp, y para contar pedidos
 * no hace falta guardar dónde vive nadie. De la entrega solo queda la
 * distancia, que es lo que explica el coste del envío.
 */
export function apunte(pedido) {
  return {
    codigo: pedido.id,
    at: new Date(pedido.at || Date.now()).toISOString(),
    sede: pedido.branch,
    servicio: pedido.mode,
    items: pedido.lines.reduce((n, l) => n + l.qty, 0),
    subtotal: pedido.subtotal ?? null,
    envio: pedido.envio ?? null,
    total: pedido.total ?? pedido.subtotal ?? null,
    total_bs: pedido.pago?.enBs ?? null,
    tasa: pedido.pago?.tasa?.valor ?? null,
    metodo: pedido.pago?.metodoId || null,
    km: pedido.entrega?.km ?? null,
    lineas: pedido.lines.map((l) => ({
      nombre: l.name, variante: l.variant || null, cantidad: l.qty, precio: l.unit
    }))
  };
}
