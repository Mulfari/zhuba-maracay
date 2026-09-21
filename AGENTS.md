# ZHUBA Restaurant & Café — carta digital y pedidos

Sitio de **ZHUBA**, complejo gastronómico asiático-nikkei en La Floresta, Maracay. Enseña la carta real, arma el pedido y lo manda por WhatsApp. Hecho por MulfAI para un cliente.

- **Producción:** https://zhuba-maracay.vercel.app · **Espejo:** https://mulfari.github.io/zhuba-maracay/
- **Repo:** https://github.com/Mulfari/zhuba-maracay

## Sitio estático, sin framework

**No hay build.** Son HTML, CSS y módulos ES nativos servidos tal cual. No metas React, ni empaquetador, ni dependencias de npm sin una razón de peso: la gracia de este proyecto es que carga instantáneo en un teléfono con mala señal, que es como lo abren sus clientes.

Para verlo en local basta con servir `site/` con cualquier servidor estático.

## Estructura

```
site/           lo único que se despliega
  index.html    portada
  pedir.html    carta y armado del pedido
  admin/        panel del restaurante
  data/*.js     los datos (carta, sucursales, pagos, modificadores)
  js/*.js       la lógica (store, pedir, sesión, ticket, búsqueda, ui)
  css/app.css
  img/          fotos de los platos en .webp
supabase/       ajustes.sql, pedidos.sql
build/          scripts e intermedios — NO se despliega
vercel.json     en la raíz, con outputDirectory: "site"
```

**Datos separados de la lógica:** `data/` contiene qué se muestra, `js/` cómo se comporta. Al cambiar la carta se toca `data/`, nunca `js/`.

## De dónde sale la carta

La carta real vive en un SPA de Vue de terceros (`app-menuqr.web.app`). Firestore rechaza la API REST anónima, así que los datos se sacaron **del store de Vue en la propia página**: `document.querySelector('#app').__vue__` y bajar por `$children` hasta el componente con `_data.products` y `_data.tabs`.

Son **347 platos y 31 categorías** con precios y variantes reales. **Nada está inventado.** Si hay que actualizar la carta, se vuelve a extraer de la misma fuente — no se escriben precios a mano.

## Despliegue

Push a `main` → Vercel despliega solo. El `vercel.json` está en la **raíz** (no en `site/`) con `outputDirectory: "site"`, para que el despliegue por CLI y el automático produzcan lo mismo.

Espejo de GitHub Pages: `git subtree push --prefix site origin gh-pages`.

Si hay que desplegar a mano:

```bash
vercel deploy --prod --yes --archive=tgz
```

**`--archive=tgz` no es opcional.** Sin él, las subidas de varios MB fallan a mitad con `deploy_failed / fetch failed`.

## Trampas conocidas

- **No escribas `vercel.json` desde un heredoc de Bash.** Se come una barra invertida y `"\\."` queda como `"\."`, que es JSON inválido. Escríbelo con la herramienta de archivos y reléelo para validarlo.
- Las URL por despliegue van protegidas con SSO y devuelven 302. Para comprobar que algo salió bien, usa el alias de producción (`zhuba-maracay.vercel.app`), que sí es público.
- `site/.env*` está en el `.gitignore`. No lo leas ni lo subas.

## Commits

En español y **describiendo lo que ve el cliente**, no el cambio técnico. El historial de este repo es así y conviene mantenerlo:

- ✅ "Tocar la foto del plato la abre entera"
- ✅ "Los botones de dentro del pedido, al tamaño de un dedo"
- ❌ "fix: update modal handler"

## Es de un cliente

Está en producción y ZHUBA lo usa para vender. **Avisa a José antes de tocar nada que afecte a la versión en vivo.**
