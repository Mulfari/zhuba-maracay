/* Amplía las fotos de la carta a 1080 px para que aguanten a pantalla
   completa en el vídeo. Lo hace Chrome porque el ffmpeg que trae Remotion
   viene sin decodificador de webp.
   uso: node ampliar.js <origen> <destino> <nombre...> */
const fs = require('fs'), path = require('path'), http = require('http');
const [SRC, DEST, ...NOMBRES] = process.argv.slice(2);
const get = (p) => new Promise((r, j) => http.get({ host: '127.0.0.1', port: 9222, path: p }, (s) => {
  let d = ''; s.on('data', c => d += c); s.on('end', () => r(JSON.parse(d)));
}).on('error', j));
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(DEST, { recursive: true });
  const page = (await get('/json/list')).find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const p = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m.result); p.delete(m.id); } });
  const send = (m, q = {}) => new Promise(r => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: q })); });
  const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception.description); return r.result && r.result.value; };
  await new Promise(r => ws.addEventListener('open', r));
  await send('Page.navigate', { url: 'about:blank' }); await sleep(600);
  for (const n of NOMBRES) {
    const f = path.join(SRC, n + '.webp');
    if (!fs.existsSync(f)) { console.log('falta', n); continue; }
    const b64 = fs.readFileSync(f).toString('base64');
    const out = await ev(`(async()=>{
      const img = new Image();
      await new Promise((ok,err)=>{ img.onload=ok; img.onerror=err; img.src='data:image/webp;base64,${b64}'; });
      const c = document.createElement('canvas'); c.width = 1080; c.height = 1080;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, 1080, 1080);
      return c.toDataURL('image/jpeg', 0.92);
    })()`);
    const bin = Buffer.from(out.split(',')[1], 'base64');
    fs.writeFileSync(path.join(DEST, n + '.jpg'), bin);
    console.log('·', n, (bin.length / 1024).toFixed(0) + ' KB');
  }
  ws.close(); process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
