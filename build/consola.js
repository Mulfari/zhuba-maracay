/* Abre una URL y devuelve lo que la página escribió en consola y sus errores.
   uso: node consola.js <url> */
const http = require('http');
const URL_ = process.argv[2];
const PORT = 9222;

const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => { d += c; }); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const page = (await get('/json/list')).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const logs = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === 'Runtime.consoleAPICalled') {
      logs.push(`[${m.params.type}] ${m.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
    }
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      logs.push(`[error] ${d.exception?.description || d.text} @ ${d.url || ''}:${d.lineNumber}`);
    }
    if (m.method === 'Log.entryAdded') logs.push(`[${m.params.entry.level}] ${m.params.entry.text} ${m.params.entry.url || ''}`);
  });
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
  });
  await new Promise((r) => ws.addEventListener('open', r));
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);
  console.log(logs.length ? logs.join('\n') : '(consola limpia)');
  ws.close(); process.exit(0);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
