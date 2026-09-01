const http=require('http');const PORT=9222;
const get=p=>new Promise((res,rej)=>{http.get({host:'127.0.0.1',port:PORT,path:p},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const page=(await get('/json/list')).find(t=>t.type==='page');
const ws=new WebSocket(page.webSocketDebuggerUrl);let id=0;const pend=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id)}});
const send=(m,p={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}))});
await new Promise(r=>ws.addEventListener('open',r));
await send('Page.enable');
for(const [label,w,h,mob,thr] of [['desktop 1440',1440,900,false,null],['mobile 390 (slow 4G)',390,844,true,{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8}]]){
  await send('Network.enable');
  await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Network.emulateNetworkConditions', thr||{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:mob?2:1,mobile:mob});
  await send('Page.navigate',{url:'https://expresosdelcentro.vercel.app/?p='+Date.now()});
  await sleep(mob?11000:6500);
  const {result}=await send('Runtime.evaluate',{expression:`JSON.stringify((()=>{
    const n=performance.getEntriesByType('navigation')[0];
    const l=performance.getEntriesByType('largest-contentful-paint').pop();
    let cls=0;for(const e of performance.getEntriesByType('layout-shift')||[])if(!e.hadRecentInput)cls+=e.value;
    const r=performance.getEntriesByType('resource');
    return{fcp:Math.round((performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime||0),
      lcp:l?Math.round(l.startTime):null, lcpEl:l&&l.element?l.element.tagName+'.'+l.element.className.split(' ')[0]:(l?l.url.split('/').pop():null),
      cls:+cls.toFixed(4), load:Math.round(n.loadEventEnd), transferKB:Math.round(r.reduce((s,x)=>s+(x.transferSize||0),0)/1024)};})())`,returnByValue:true});
  console.log(label.padEnd(22),result.value);
}
ws.close();process.exit(0)})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
