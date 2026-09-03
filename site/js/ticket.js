/**
 * Traduce el carrito a un pedido legible para el local y a un enlace de
 * WhatsApp con el mensaje precargado, dirigido al número de la sede activa.
 *
 * El ticket lleva el pago dentro a propósito: quien lo recibe tiene que poder
 * cotejar la referencia sin salir del chat.
 */
import { money, bolivares } from './store.js';
import { SERVICE_MODES } from '../data/modifiers.js';

const pad = (n) => String(n).padStart(2, '0');

export function buildTicket(store, extra = {}) {
  const b = store.branch;
  const mode = SERVICE_MODES.find((m) => m.id === store.service.mode) || SERVICE_MODES[0];
  const f = store.service.fields || {};
  const entrega = extra.entrega ?? store.entrega;
  const envio = extra.envio ?? store.costeEnvio;
  const pago = extra.pago;
  const now = new Date();
  const L = [];

  L.push('*ZHUBA · PEDIDO*');
  if (extra.id) L.push(`Nº ${extra.id}`);
  L.push(`Sede: ${b.name}`);
  L.push(`Servicio: ${mode.label}`);
  L.push(`Enviado: ${pad(now.getDate())}/${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`);
  L.push('');

  L.push('*DATOS*');
  mode.fields.forEach((field) => {
    const v = (f[field.id] || '').trim();
    if (v) L.push(`${field.label}: ${v}`);
  });
  if (entrega) {
    L.push(`Ubicación: ${entrega.lat.toFixed(5)}, ${entrega.lng.toFixed(5)}`);
    if (entrega.direccion) L.push(`Referencia: ${entrega.direccion}`);
    L.push(`Distancia: ${entrega.km.toFixed(1)} km${entrega.etiqueta ? ` (${entrega.etiqueta})` : ''}`);
    L.push(`Mapa: https://www.google.com/maps?q=${entrega.lat},${entrega.lng}`);
  }
  L.push('');

  L.push('*PEDIDO*');
  store.cart.forEach((line) => {
    const name = line.variant ? `${line.name} (${line.variant})` : line.name;
    L.push(`${line.qty}× ${name} — ${money(line.unit * line.qty)}`);
    (line.adjustments || []).forEach((a) => L.push(`   · ${a}`));
    if ((line.note || '').trim()) L.push(`   ▸ Nota: ${line.note.trim()}`);
  });
  if ((f._note || '').trim()) { L.push(''); L.push(`Nota del pedido: ${f._note.trim()}`); }
  L.push('');

  L.push('*TOTALES*');
  L.push(`Subtotal (${store.count} ${store.count === 1 ? 'ítem' : 'ítems'}): ${money(store.subtotal)}`);
  if (store.service.mode === 'delivery') {
    L.push(`Envío: ${envio ? money(envio) : 'por confirmar'}`);
  }
  const total = extra.total ?? (store.subtotal + (envio || 0));
  L.push(`TOTAL: ${money(total)}`);
  if (pago?.enBs != null) {
    L.push(`En bolívares: ${bolivares(pago.enBs)}`);
    if (pago.tasa) L.push(`(${pago.tasa.fuente}: ${bolivares(pago.tasa.valor)} por dólar)`);
  }
  L.push('');

  if (pago) {
    L.push('*PAGO*');
    L.push(`Método: ${pago.metodo}`);
    if (pago.metodoId === 'efectivo') {
      L.push('Pendiente de pagar al recibir.');
    } else {
      if (pago.referencia) L.push(`Referencia: ${pago.referencia}`);
      if (pago.telefono) L.push(`Teléfono de quien paga: ${pago.telefono}`);
      L.push(pago.conComprobante
        ? 'Comprobante: se adjunta en este chat.'
        : 'Sin comprobante adjunto.');
    }
  }

  return L.join('\n');
}

export function whatsappLink(store, extra = {}) {
  return `https://wa.me/${store.branch.whatsapp}?text=${encodeURIComponent(buildTicket(store, extra))}`;
}

/** Resumen compacto que guarda el panel de cocina. */
export function orderSnapshot(store) {
  const b = store.branch;
  return {
    branch: b.id,
    branchName: b.name,
    mode: store.service.mode,
    fields: { ...(store.service.fields || {}) },
    lines: store.cart.map((l) => ({
      name: l.name, variant: l.variant, qty: l.qty, unit: l.unit,
      adjustments: [...(l.adjustments || [])], note: l.note || ''
    })),
    subtotal: store.subtotal,
    count: store.count
  };
}
