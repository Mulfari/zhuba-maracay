const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const FF='C:/Users/joses/Documents/burguer-san-jacinto/node_modules/ffmpeg-static/ffmpeg.exe';
const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const out=path.join(__dirname,'..','site','img');
fs.mkdirSync(out,{recursive:true});
const files=['rest_images.txt','cafe_images.txt'];
(async()=>{
  const map={};const skipped=[];
  for(const f of files){
    const lines=fs.readFileSync(path.join(__dirname,f),'utf8').split('\n').filter(l=>l.trim());
    for(const line of lines){
      const i=line.indexOf('|');const title=line.slice(0,i).trim();const url=line.slice(i+1).trim();
      if(/LOGO/i.test(decodeURIComponent(url))){skipped.push(title);continue;}
      const s=slug(title);const tmp=path.join(out,s+'.tmp');const dest=path.join(out,s+'.webp');
      if(fs.existsSync(dest)){map[title]=s+'.webp';continue;}
      try{
        const r=await fetch(url);
        if(!r.ok){skipped.push(title+' HTTP'+r.status);continue;}
        fs.writeFileSync(tmp,Buffer.from(await r.arrayBuffer()));
        execFileSync(FF,['-y','-loglevel','error','-i',tmp,'-vf','scale=520:520:force_original_aspect_ratio=increase,crop=520:520','-quality','72',dest]);
        fs.unlinkSync(tmp);map[title]=s+'.webp';
      }catch(e){skipped.push(title+' ERR '+e.message);try{fs.unlinkSync(tmp)}catch(_){}}
    }
  }
  fs.writeFileSync(path.join(__dirname,'img-map.json'),JSON.stringify(map,null,1));
  console.log('ok',Object.keys(map).length,'skipped',skipped.length);
  if(skipped.length)console.log(skipped.join('\n'));
})();
