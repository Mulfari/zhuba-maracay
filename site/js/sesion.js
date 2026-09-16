/**
 * La sesión del panel.
 *
 * Dos puertas, según haya registro compartido o no:
 *
 *  · Sin registro, el panel solo enseña lo de este navegador y la puerta es
 *    un código de cuatro cifras. Basta para una demostración.
 *  · Con registro, las cifras son las ventas del negocio y no pueden quedar
 *    detrás de un código escrito en el propio JavaScript: se entra con el
 *    usuario y la contraseña de Supabase, y ese acceso es el que autoriza a
 *    leer la tabla. Las reglas de la tabla (supabase/pedidos.sql) permiten
 *    escribir a cualquiera y leer solo a quien ha iniciado sesión.
 */
import { REMOTO, hayRegistro } from '../data/remoto.js';

const CLAVE = 'zhuba.admin.sesion';

/** El token de acceso guardado, si no ha caducado. */
export function token() {
  try {
    const s = JSON.parse(sessionStorage.getItem(CLAVE) || 'null');
    if (!s || !s.access_token) return null;
    if (s.expira && Date.now() > s.expira) { sessionStorage.removeItem(CLAVE); return null; }
    return s.access_token;
  } catch { return null; }
}

/** Entra con correo y contraseña. Devuelve '' si todo fue bien, o el motivo. */
export async function entrar(correo, clave) {
  if (!hayRegistro()) return 'No hay registro compartido configurado.';
  try {
    const r = await fetch(`${REMOTO.url.replace(/\/+$/, '')}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: REMOTO.clave },
      body: JSON.stringify({ email: correo, password: clave })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.access_token) {
      return r.status === 400 ? 'Correo o contraseña incorrectos.'
        : `No se pudo entrar (${d.error_description || d.msg || r.status}).`;
    }
    sessionStorage.setItem(CLAVE, JSON.stringify({
      access_token: d.access_token,
      // un minuto de margen para no quedarse con un token recién caducado
      expira: Date.now() + Math.max(0, (d.expires_in || 3600) - 60) * 1000
    }));
    return '';
  } catch (e) {
    return `No se pudo conectar (${e.message || e}).`;
  }
}

export function salir() { sessionStorage.removeItem(CLAVE); }
