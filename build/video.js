const {execFileSync}=require('child_process');
const FF='C:/Users/joses/Documents/burguer-san-jacinto/node_modules/ffmpeg-static/ffmpeg.exe';
const FP='C:/Users/joses/Documents/burguer-san-jacinto/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe';
const run=(a)=>execFileSync(FF,a,{stdio:['ignore','pipe','pipe']});
function dur(f){return parseFloat(execFileSync(FP,['-v','error','-show_entries','format=duration','-of','csv=p=0',f]).toString().trim());}
function loop(src,out,w,h,N,crf,codec){
  const D=dur(src); const off=(D-2*N).toFixed(3);
  const vf=`[0:v]trim=${N}:${D},setpts=PTS-STARTPTS,scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}[b];`+
           `[0:v]trim=0:${N},setpts=PTS-STARTPTS,scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}[h];`+
           `[b][h]xfade=transition=fade:duration=${N}:offset=${off},format=yuv420p[v]`;
  const a=['-y','-loglevel','error','-i',src,'-filter_complex',vf,'-map','[v]','-an'];
  if(codec==='webm') a.push('-c:v','libvpx-vp9','-crf',String(crf),'-b:v','0','-row-mt','1','-deadline','good','-cpu-used','3');
  else a.push('-c:v','libx264','-crf',String(crf),'-preset','slow','-profile:v','high','-pix_fmt','yuv420p','-movflags','+faststart');
  a.push(out); run(a);
}
loop('build/cand-room.mp4','site/assets/hero.mp4',1280,720,1.2,25);
loop('build/cand-room.mp4','site/assets/hero.webm',1280,720,1.2,34,'webm');
loop('build/cand-food.mp4','site/assets/cocina.mp4',960,540,1.2,26);
loop('build/cand-food.mp4','site/assets/cocina.webm',960,540,1.2,36,'webm');
run(['-y','-loglevel','error','-ss','0','-i','site/assets/hero.mp4','-frames:v','1','-q:v','4','site/assets/hero-poster.jpg']);
run(['-y','-loglevel','error','-ss','0','-i','site/assets/cocina.mp4','-frames:v','1','-q:v','4','site/assets/cocina-poster.jpg']);
const D=dur('site/assets/hero.mp4');
run(['-y','-loglevel','error','-ss','0','-i','site/assets/hero.mp4','-frames:v','1','build/f-first.png']);
run(['-y','-loglevel','error','-ss',String(D-0.08),'-i','site/assets/hero.mp4','-frames:v','1','build/f-last.png']);
run(['-y','-loglevel','error','-i','build/f-first.png','-i','build/f-last.png','-filter_complex','[0:v]scale=420:-1[a];[1:v]scale=420:-1[b];[a][b]hstack[out]','-map','[out]','-frames:v','1','build/loopcheck.png']);
console.log('done');
