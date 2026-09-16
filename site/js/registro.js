/**
 * El registro de pedidos enviados.
 *
 * Dos fuentes con la misma cara: el navegador de siempre y, si está
 * configurada, la tabla compartida. El panel pregunta por aquí y no se
 * entera de cuál de las dos contesta.
 *
 * Importante: apuntar nunca puede frenar el envío. El mensaje a WhatsApp se
 * abre en el mismo gesto del dedo y si algo se interpone —una red lenta, la
 * tabla caída— el navegador del móvil bloquea la pestaña. Por eso `apuntar`
 * dispara y se olvida: si falla, se pierde el apunte, no el pedido.
 */
import { REMOTO, hayRegistro, apunte } from '../data/remoto.js';
import { token } from './sesion.js';

/* La clave anónima identifica a la aplicación; el token de la sesión, a la
   persona. Escribir lo puede hacer cualquiera con la clave; leer, solo quien
   ha entrado — y entonces manda su token. */
const cabeceras = (conSesion = false) => ({
  'Content-Type': 'application/json',
  apikey: REMOTO.clave,
  Authorization: `Bearer ${(conSesion && token()) || REMOTO.clave}`
});

const tabla = () => `${REMOTO.url.replace(/\/+$/, '')}/rest/v1/${REMOTO.tabla}`;

/** Apunta el pedido en la tabla compartida. Sin esperar y sin estorbar. */
export function apuntar(pedido) {
  if (!hayRegistro()) return;
  try {
    fetch(tabla(), {
      method: 'POST',
      headers: { ...cabeceras(), Prefer: 'return=minimal' },
      body: JSON.stringify(apunte(pedido)),
      keepalive: true          // sobrevive a que la pestaña se vaya a WhatsApp
    }).catch(() => {});
  } catch { /* el pedido ya va camino de WhatsApp: esto es secundario */ }
}

/**
 * Los pedidos desde una fecha, más recientes primero. Devuelve también de
 * dónde salen, porque el panel tiene que decirlo: no es lo mismo «lo que ha
 * vendido la web» que «lo que se pidió desde este teléfono».
 */
export async function listar(desde, locales) {
  if (!hayRegistro()) return { origen: 'local', pedidos: locales };
  if (!token()) return { origen: 'sin-sesion', pedidos: locales };
  const q = new URLSearchParams({
    select: '*', order: 'at.desc', limit: '1000',
    at: `gte.${new Date(desde).toISOString()}`
  });
  try {
    const r = await fetch(`${tabla()}?${q}`, { headers: cabeceras(true) });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return { origen: 'compartido', pedidos: (await r.json()).map(deApunte) };
  } catch (e) {
    return { origen: 'error', error: String(e.message || e), pedidos: locales };
  }
}

/** De fila de la tabla a la forma que ya usa el panel. */
function deApunte(fila) {
  return {
    id: fila.codigo,
    at: new Date(fila.at).getTime(),
    branch: fila.sede,
    mode: fila.servicio,
    subtotal: fila.subtotal,
    envio: fila.envio,
    total: fila.total,
    entrega: fila.km == null ? null : { km: fila.km },
    pago: { metodoId: fila.metodo, enBs: fila.total_bs },
    lines: (fila.lineas || []).map((l) => ({ name: l.nombre, qty: l.cantidad, unit: l.precio }))
  };
}
