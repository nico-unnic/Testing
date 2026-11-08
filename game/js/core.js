/* Núcleo: utilidades, rejilla, rutas, línea de visión, audio procedural y entrada. */
(function(){
'use strict';
const G = window.G = window.G || {};
G.$ = id => document.getElementById(id);
G.clamp = (v,a,b) => Math.max(a, Math.min(b, v));
G.lerp = (a,b,t) => a + (b-a)*t;
G.angDiff = (a,b) => { let d=a-b; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; return d; };
G.dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
G.sleep = s => new Promise(r => setTimeout(r, s*1000));

/* ---------- Rejilla ---------- */
class Grid {
  constructor(w,h){ this.w=w; this.h=h; const n=w*h;
    this.t=new Array(n).fill('#'); this.mat=new Array(n).fill('k');
    this.solid=new Uint8Array(n).fill(1); this.opaque=new Uint8Array(n).fill(1); }
  i(x,y){ return y*this.w+x; }
  in(x,y){ return x>=0&&y>=0&&x<this.w&&y<this.h; }
  tile(x,y){ return this.in(x,y)?this.t[this.i(x,y)]:'#'; }
  set(x,y,c,mat){ if(!this.in(x,y))return; const i=this.i(x,y); this.t[i]=c; if(mat)this.mat[i]=mat;
    this.solid[i] = (c==='#'||c==='G') ? 1 : 0; this.opaque[i] = c==='#' ? 1 : 0; }
  room(x0,y0,x1,y1,mat){ for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)this.set(x,y,'.',mat); }
  walk(x,y){ return this.in(x,y) && !this.solid[this.i(x,y)]; }
  blocks(x,y){ return !this.in(x,y) || this.opaque[this.i(x,y)]===1; }
}
G.Grid = Grid;

G.astar = function(grid,sx,sy,tx,ty,extraBlock){
  const W=grid.w,H=grid.h;
  const ok=(x,y)=>grid.walk(x,y) && !(extraBlock&&extraBlock(x,y));
  if (!ok(tx,ty)) return null;
  const N=W*H, g=new Float32Array(N).fill(1e9), from=new Int32Array(N).fill(-1), closed=new Uint8Array(N);
  const hx=(x,y)=>{const dx=Math.abs(x-tx),dy=Math.abs(y-ty);return Math.max(dx,dy)+0.414*Math.min(dx,dy);};
  const open=[sy*W+sx]; g[sy*W+sx]=0;
  while (open.length){
    let bi=0,bf=1e9;
    for (let i=0;i<open.length;i++){const n=open[i],f=g[n]+hx(n%W,(n/W)|0); if(f<bf){bf=f;bi=i;}}
    const cur=open.splice(bi,1)[0]; if (closed[cur]) continue; closed[cur]=1;
    const cx=cur%W, cy=(cur/W)|0;
    if (cx===tx&&cy===ty){ const out=[]; let n=cur; while(n!==sy*W+sx&&n!==-1){out.push({x:n%W+.5,y:((n/W)|0)+.5}); n=from[n];} return out.reverse(); }
    for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++){
      if (!dx&&!dy) continue; const nx=cx+dx, ny=cy+dy; if (!ok(nx,ny)) continue;
      if (dx&&dy&&(!ok(cx+dx,cy)||!ok(cx,cy+dy))) continue;
      const ni=ny*W+nx, ng=g[cur]+(dx&&dy?1.414:1);
      if (ng<g[ni]){ g[ni]=ng; from[ni]=cur; open.push(ni); }
    }
  }
  return null;
};
G.los = function(grid,x0,y0,x1,y1){
  const sx=Math.floor(x0), sy=Math.floor(y0), ex=Math.floor(x1), ey=Math.floor(y1);
  const d=Math.hypot(x1-x0,y1-y0), steps=Math.ceil(d/0.12);
  for (let i=1;i<steps;i++){
    const tx=Math.floor(x0+(x1-x0)*i/steps), ty=Math.floor(y0+(y1-y0)*i/steps);
    if ((tx===sx&&ty===sy)||(tx===ex&&ty===ey)) continue;
    if (grid.blocks(tx,ty)) return false;
  }
  return true;
};
G.cone = function(grid,ox,oy,angle,half,range,n=24){
  const pts=[[ox,oy]], sx=Math.floor(ox), sy=Math.floor(oy);
  for (let i=0;i<=n;i++){
    const a=angle-half+2*half*i/n, ca=Math.cos(a), sa=Math.sin(a); let r=0.1;
    for (;r<range;r+=0.1){ const tx=Math.floor(ox+ca*r), ty=Math.floor(oy+sa*r); if((tx!==sx||ty!==sy)&&grid.blocks(tx,ty)) break; }
    pts.push([ox+ca*r,oy+sa*r]);
  }
  return pts;
};

/* ---------- Audio procedural ---------- */
const A = G.audio = { ctx:null, master:null, amb:null, ambMode:null, muted:false };
A.init = function(){
  if (A.ctx) { if (A.ctx.state==='suspended') A.ctx.resume(); return; }
  try {
    A.ctx = new (window.AudioContext||window.webkitAudioContext)();
    A.master = A.ctx.createGain(); A.master.gain.value = 0.7; A.master.connect(A.ctx.destination);
    const len=A.ctx.sampleRate; A.noiseBuf=A.ctx.createBuffer(1,len,A.ctx.sampleRate);
    const d=A.noiseBuf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
  } catch(e){ A.ctx=null; }
};
function env(g,t,a,peak,dec){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec); }
A.tone = function(freq,dur,type='sine',vol=0.15,slide){
  if(!A.ctx) return; const t=A.ctx.currentTime, o=A.ctx.createOscillator(), g=A.ctx.createGain();
  o.type=type; o.frequency.setValueAtTime(freq,t); if(slide) o.frequency.exponentialRampToValueAtTime(slide,t+dur);
  env(g,t,0.01,vol,dur); o.connect(g); g.connect(A.master); o.start(t); o.stop(t+dur+0.05);
};
A.noise = function(dur,vol=0.2,freq=1200,q=0.8,type='bandpass'){
  if(!A.ctx) return; const t=A.ctx.currentTime, s=A.ctx.createBufferSource(), f=A.ctx.createBiquadFilter(), g=A.ctx.createGain();
  s.buffer=A.noiseBuf; f.type=type; f.frequency.value=freq; f.Q.value=q; env(g,t,0.005,vol,dur);
  s.connect(f); f.connect(g); g.connect(A.master); s.start(t, Math.random()*0.5); s.stop(t+dur+0.05);
};
A.sfx = function(name){
  if(!A.ctx||A.muted) return;
  switch(name){
    case 'step': A.noise(0.06,0.05,700+Math.random()*300,1.2); break;
    case 'stepRun': A.noise(0.08,0.12,500+Math.random()*200,1); break;
    case 'blip': A.tone(1300+Math.random()*200,0.02,'square',0.02); break;
    case 'flash': A.noise(0.12,0.35,4000,0.7,'highpass'); A.tone(2200,0.25,'sine',0.05,600); break;
    case 'alert': A.tone(520,0.12,'square',0.08); setTimeout(()=>A.tone(780,0.22,'square',0.08),110); break;
    case 'caught': A.tone(220,0.6,'sawtooth',0.12,110); A.tone(233,0.6,'sawtooth',0.1,116); break;
    case 'warn': A.tone(330,0.18,'triangle',0.12); setTimeout(()=>A.tone(262,0.3,'triangle',0.12),160); break;
    case 'ok': A.tone(660,0.09,'triangle',0.1); setTimeout(()=>A.tone(990,0.16,'triangle',0.1),90); break;
    case 'click': A.noise(0.03,0.15,2500,2); break;
    case 'door': A.noise(0.25,0.12,300,0.6,'lowpass'); break;
    case 'elevator': A.tone(880,0.4,'sine',0.08); setTimeout(()=>A.tone(660,0.6,'sine',0.08),300); break;
    case 'ring': for(let i=0;i<6;i++) setTimeout(()=>A.tone(i%2?640:800,0.05,'square',0.05),i*55); break;
    case 'radio': A.noise(0.12,0.08,1800,3); break;
    case 'lockStuck': A.noise(0.15,0.3,180,4); A.tone(90,0.25,'square',0.06); break;
    case 'heavyStep': A.noise(0.12,0.25,160,1.4,'lowpass'); break;
    case 'whoosh': A.noise(0.6,0.18,500,0.4,'lowpass'); break;
    case 'sting': A.tone(146,1.6,'sawtooth',0.06,140); A.tone(174,1.6,'sawtooth',0.05,165); A.tone(220,1.6,'sawtooth',0.04,208); break;
  }
};
A.ambient = function(mode){
  if(!A.ctx || A.ambMode===mode) return;
  A.ambMode=mode;
  if (A.amb){ const old=A.amb; old.g.gain.linearRampToValueAtTime(0.0001,A.ctx.currentTime+1); setTimeout(()=>old.nodes.forEach(n=>{try{n.stop()}catch(e){}}),1200); A.amb=null; }
  if (!mode) return;
  const t=A.ctx.currentTime, g=A.ctx.createGain(); g.gain.value=0.0001; g.connect(A.master);
  const nodes=[];
  const freqs = mode==='night' ? [55,82.4,110.3] : mode==='tense' ? [49,73.4,103.8] : [130.8,196,261.6];
  const vol = mode==='day' ? 0.012 : 0.03;
  freqs.forEach((f,i)=>{ const o=A.ctx.createOscillator(), og=A.ctx.createGain(); o.type= mode==='day'?'sine':'triangle'; o.frequency.value=f; o.detune.value=(i-1)*6;
    const lfo=A.ctx.createOscillator(), lg=A.ctx.createGain(); lfo.frequency.value=0.07+i*0.03; lg.gain.value=vol*0.5; lfo.connect(lg); lg.connect(og.gain);
    og.gain.value=vol; o.connect(og); og.connect(g); o.start(); lfo.start(); nodes.push(o,lfo); });
  if (mode!=='day'){ const s=A.ctx.createBufferSource(), f=A.ctx.createBiquadFilter(), ng=A.ctx.createGain(); s.buffer=A.noiseBuf; s.loop=true; f.type='lowpass'; f.frequency.value=260; ng.gain.value=0.05; s.connect(f); f.connect(ng); ng.connect(g); s.start(); nodes.push(s); }
  else { const s=A.ctx.createBufferSource(), f=A.ctx.createBiquadFilter(), ng=A.ctx.createGain(); s.buffer=A.noiseBuf; s.loop=true; f.type='bandpass'; f.frequency.value=900; f.Q.value=0.4; ng.gain.value=0.02; s.connect(f); f.connect(ng); ng.connect(g); s.start(); nodes.push(s); }
  g.gain.linearRampToValueAtTime(1,t+2);
  A.amb={g,nodes};
};

/* ---------- Entrada ---------- */
const I = G.input = { keys:{}, joy:{id:null,ox:0,oy:0,x:0,y:0,mag:0}, JR:52, handlers:{} };
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase(); if (I.keys[k]) { if(k===' '||k==='e') e.preventDefault(); return; } I.keys[k]=true;
  if (k===' '||k==='e'){ e.preventDefault(); I.handlers.actDown&&I.handlers.actDown(); }
  if (k==='enter') I.handlers.advance&&I.handlers.advance();
  if (k==='c') I.handlers.crouch&&I.handlers.crouch();
  if (k==='f') I.handlers.photo&&I.handlers.photo();
  if (k==='escape') I.handlers.pause&&I.handlers.pause();
  if (k>='1'&&k<='4') I.handlers.choice&&I.handlers.choice(+k-1);
});
addEventListener('keyup',e=>{ const k=e.key.toLowerCase(); I.keys[k]=false; if(k===' '||k==='e') I.handlers.actUp&&I.handlers.actUp(); });
addEventListener('blur',()=>{ I.keys={}; I.joy.id=null; I.joy.mag=0; });
I.bindCanvas = function(cv){
  cv.addEventListener('pointerdown',e=>{
    G.audio.init();
    if (I.handlers.canvasTap && I.handlers.canvasTap(e)) return;
    if (I.joy.id!==null || e.clientX>innerWidth*0.55) return;
    I.joy.id=e.pointerId; I.joy.ox=e.clientX; I.joy.oy=e.clientY; I.joy.x=I.joy.y=I.joy.mag=0;
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
  });
  cv.addEventListener('pointermove',e=>{
    const j=I.joy; if (e.pointerId!==j.id) return;
    let dx=e.clientX-j.ox, dy=e.clientY-j.oy, d=Math.hypot(dx,dy), M=I.JR*1.35;
    if (d>M){ j.ox=e.clientX-dx/d*M; j.oy=e.clientY-dy/d*M; dx=e.clientX-j.ox; dy=e.clientY-j.oy; d=M; }
    j.mag=Math.min(1,d/I.JR); j.x=d?dx/d:0; j.y=d?dy/d:0;
  });
  const end=e=>{ if(e.pointerId===I.joy.id){ I.joy.id=null; I.joy.mag=0; } };
  cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
  cv.addEventListener('contextmenu',e=>e.preventDefault());
};
I.move = function(){
  const k=I.keys; let x=(k.arrowright||k.d?1:0)-(k.arrowleft||k.a?1:0), y=(k.arrowdown||k.s?1:0)-(k.arrowup||k.w?1:0), run=!!k.shift, mag=(x||y)?1:0;
  if (I.joy.id!==null && I.joy.mag>0.2){ x=I.joy.x; y=I.joy.y; mag=I.joy.mag; run=I.joy.mag>0.94; }
  const l=Math.hypot(x,y); if (l>0){ x/=l; y/=l; }
  return {x,y,mag,run};
};
})();
