/**
 * Traduce el carrito a una comanda de cocina legible y a un enlace de
 * WhatsApp con el mensaje precargado, dirigido al número de la sede activa.
 */
import { money } from './store.js';
import { SERVICE_MODES } from '../data/modifiers.js';

const pad = (n) => String(n).padStart(2, '0');

export function buildTicket(store) {
  const b = store.branch;
  const mode = SERVICE_MODES.find((m) => m.id === store.service.mode) || SERVICE_MODES[0];
  const f = store.service.fields || {};
  const now = new Date();
  const L = [];

  L.push('*ZHUBA · COMANDA*');
  L.push(`Sede: ${b.name}`);
  L.push(`Servicio: ${mode.label}`);
  L.push(`Enviado: ${pad(now.getDate())}/${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`);
  L.push('');

  L.push('*DATOS*');
  mode.fields.forEach((field) => {
    const v = (f[field.id] || '').trim();
    if (v) L.push(`${field.label}: ${v}`);
  });
  L.push('');

  L.push('*PEDIDO*');
  store.cart.forEach((line) => {
    const name = line.variant ? `${line.name} (${line.variant})` : line.name;
    L.push(`${line.qty}× ${name} — ${money(line.unit * line.qty)}`);
    (line.adjustments || []).forEach((a) => L.push(`   · ${a}`));
    if ((line.note || '').trim()) L.push(`   ▸ Nota: ${line.note.trim()}`);
  });
  L.push('');

  L.push('*TOTALES*');
  L.push(`Subtotal (${store.count} ${store.count === 1 ? 'ítem' : 'ítems'}): ${money(store.subtotal)}`);
  if (store.service.mode === 'delivery') {
    L.push(`Envío: ${b.deliveryFee == null ? 'a coordinar' : money(b.deliveryFee)}`);
  }
  L.push(`TOTAL: ${money(store.subtotal + (store.service.mode === 'delivery' ? (b.deliveryFee || 0) : 0))}`);

  return L.join('\n');
}

export function whatsappLink(store) {
  return `https://wa.me/${store.branch.whatsapp}?text=${encodeURIComponent(buildTicket(store))}`;
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
