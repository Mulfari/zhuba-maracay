/* Assert reduced-motion actually neutralises the parallax. */
const http = require('http');
const PORT = 9222;
const get = p => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const page = (await get('/json/list')).find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise(r => {
    const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params }));
  });
  await new Promise(r => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  const probe = `(() => {
    window.scrollTo(0, 1400);
    const g = s => getComputedStyle(document.querySelector(s)).transform;
    return JSON.stringify({
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      heroMedia: g('.hero__media'),
      heroInner: g('.hero__inner'),
      dishA: g('.dish--a'),
      bandImg: g('.band__img'),
      routeFill: g('.route__fill')
    });
  })()`;

  for (const reduce of [false, true]) {
    await send('Emulation.setEmulatedMedia', {
      features: reduce ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : []
    });
    await send('Page.navigate', { url: 'http://localhost:4181/?rm=' + reduce });
    await sleep(3500);
    const { result } = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
    await sleep(600);
    const { result: r2 } = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
    console.log(reduce ? '--- prefers-reduced-motion: reduce ---' : '--- motion allowed ---');
    console.log(r2.value);
  }
  ws.close(); process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
