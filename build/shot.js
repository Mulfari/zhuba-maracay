/* Full-page screenshots over the Chrome DevTools Protocol.
   usage: node shot.js <url> <out.png> <width> <height> [--mobile] [--reduce] */
const fs = require('fs');
const http = require('http');

const [, , URL_, OUT, W = '1440', H = '900', ...flags] = process.argv;
const MOBILE = flags.includes('--mobile');
const REDUCE = flags.includes('--reduce');
const PORT = 9222;

const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const targets = await get('/json/list');
  const page = targets.find(t => t.type === 'page');
  if (!page) throw new Error('no page target');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise(res => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

  await new Promise(r => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: +W, height: +H, deviceScaleFactor: 1, mobile: MOBILE
  });
  if (REDUCE) {
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
  }
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);                       // fonts, video, lazy images
  await send('Runtime.evaluate', {         // force every lazy image in
    expression: `document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');
                 window.scrollTo(0,document.body.scrollHeight);`
  });
  await sleep(2500);
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0,0)' });
  await sleep(1200);

  const { data } = await send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true
  });
  fs.writeFileSync(OUT, Buffer.from(data, 'base64'));
  console.log('wrote', OUT);
  ws.close();
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
