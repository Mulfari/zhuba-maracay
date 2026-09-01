/* End-to-end check of the deployed site over CDP. */
const http = require('http');
const PORT = 9222;
const URL_ = process.argv[2] || 'https://expresosdelcentro.vercel.app/';

const get = p => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const page = (await get('/json/list')).find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const consoleErrors = []; const failed = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') consoleErrors.push(m.params.entry.text);
    if (m.method === 'Network.loadingFailed') failed.push(m.params.errorText);
  });
  const send = (method, params = {}) => new Promise(r => {
    const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params }));
  });
  await new Promise(r => ws.addEventListener('open', r));
  await send('Page.enable'); await send('Log.enable'); await send('Network.enable');
  await send('Emulation.setEmulatedMedia', { features: [] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Network.setCacheDisabled', { cacheDisabled: true });

  const t0 = Date.now();
  await send('Page.navigate', { url: URL_ });
  await sleep(6000);

  const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;

  // 1. video actually playing + looping
  const v1 = await ev(`(v=>({t:v.currentTime,paused:v.paused,muted:v.muted,loop:v.loop,w:v.videoWidth,h:v.videoHeight,src:v.currentSrc.split('/').pop(),poster:!!v.poster,ready:v.readyState}))(document.getElementById('heroVideo'))`);
  await sleep(2200);
  const v2 = await ev(`(v=>({t:v.currentTime}))(document.getElementById('heroVideo'))`);

  // 2. parallax at two scroll positions
  const p0 = await ev(`(()=>{window.scrollTo(0,0);return 1})()`); await sleep(400);
  const a = await ev(`JSON.stringify([...document.querySelectorAll('[data-px]')].map(e=>getComputedStyle(e).transform))`);
  await ev(`window.scrollTo(0,1600)`); await sleep(700);
  const b = await ev(`JSON.stringify([...document.querySelectorAll('[data-px]')].map(e=>getComputedStyle(e).transform))`);
  const routeAt = await ev(`getComputedStyle(document.getElementById('routeFill')).transform`);

  // 3. links
  const links = await ev(`JSON.stringify([...document.querySelectorAll('a[href]')].map(a=>({t:a.textContent.trim().slice(0,26),h:a.getAttribute('href'),tgt:a.target||''})))`);

  // 4. metadata
  const meta = await ev(`JSON.stringify({title:document.title,desc:document.querySelector('meta[name=description]').content.length,og:document.querySelector('meta[property="og:image"]').content,canonical:document.querySelector('link[rel=canonical]').href,ld:!!document.querySelector('script[type="application/ld+json"]'),lang:document.documentElement.lang,h1:document.querySelectorAll('h1').length,h2:document.querySelectorAll('h2').length,imgNoAlt:[...document.images].filter(i=>!i.hasAttribute('alt')).length})`);

  // 5. perf
  const perf = await ev(`JSON.stringify((()=>{const n=performance.getEntriesByType('navigation')[0];const r=performance.getEntriesByType('resource');
    const lcp=performance.getEntriesByType('largest-contentful-paint').pop();
    return {domContentLoaded:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd),
      fcp:Math.round((performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime||0),
      lcp:lcp?Math.round(lcp.startTime):null,
      resources:r.length, bytes:Math.round(r.reduce((s,x)=>s+(x.transferSize||0),0)/1024)+'KB',
      slowest:r.map(x=>({n:x.name.split('/').pop().slice(0,24),d:Math.round(x.duration)})).sort((p,q)=>q.d-p.d).slice(0,5)};})())`);

  // 6. horizontal overflow at 390px
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(900);
  const overflow = await ev(`JSON.stringify({docW:document.documentElement.scrollWidth,win:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1})`);

  console.log('VIDEO t0        :', JSON.stringify(v1));
  console.log('VIDEO t+2.2s    :', JSON.stringify(v2), '=> advancing:', v2.t !== v1.t);
  console.log('PARALLAX @0     :', a);
  console.log('PARALLAX @1600  :', b);
  console.log('ROUTE FILL      :', routeAt);
  console.log('META            :', meta);
  console.log('PERF            :', perf);
  console.log('MOBILE OVERFLOW :', overflow);
  console.log('CONSOLE ERRORS  :', consoleErrors.length ? consoleErrors : 'none');
  console.log('FAILED REQUESTS :', failed.length ? failed : 'none');
  console.log('LINKS           :', links);
  ws.close(); process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
