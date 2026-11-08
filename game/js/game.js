/* Motor: estado, personajes, sigilo, fotos, diálogos, menús y ejecución de capítulos. */
(function(){
'use strict';
const G = window.G, $ = G.$, A = G.audio, I = G.input, R = G.R;

G.CHARS = {
  vito:   {name:'Vito',   style:{coat:'#2d3443',skin:'#d9a982',hair:'short',hairCol:'#a3a3a3',beard:'#8f8f8f',legs:'#1b1f29'}},
  speedy: {name:'Speedy', style:{coat:'#6b4a2b',skin:'#e0b08a',hair:'sparse',hairCol:'#3a2a1e',legs:'#2a2f3d'}},
  elio:   {name:'Elio',   style:{coat:'#16181d',skin:'#d8a47c',hair:'short',hairCol:'#141414',glasses:true}},
  bruno:  {name:'Bruno',  style:{coat:'#5d6470',skin:'#c99372',hair:'bald',big:true}},
  aldo:   {name:'Aldo',   style:{coat:'#4a4036',skin:'#d6a58a',hair:'cap',hairCol:'#5a5a5a',beard:'#e8e8e8'}},
  marcel: {name:'Marcel', style:{coat:'#24365e',trim:'#c9a45a',skin:'#e3b391',hair:'short',hairCol:'#c4c4c4',glasses:true}},
  jansen: {name:'Jansen', style:{coat:'#7d8796',skin:'#e6c0a0',hair:'short',hairCol:'#d9c27a'}},
  verbeke:{name:'Verbeke',style:{coat:'#596170',trim:'#c9a45a',skin:'#e3b391',hair:'short',hairCol:'#e0cc8a'}},
  dirk:   {name:'Dirk',   style:{coat:'#596170',trim:'#c9a45a',skin:'#c89878',hair:'short',hairCol:'#2b2b2b'}},
  luc:    {name:'Luc',    style:{coat:'#4f7bb5',skin:'#e3b391',hair:'short',hairCol:'#6b4a2b'}},
  peeters:{name:'Sra. Peeters',style:{coat:'#9b3b3b',skin:'#e8c2a8',hair:'bun',hairCol:'#2b1f1a'}},
};

const cv=$('cv'), ctx=cv.getContext('2d');
let vw=0, vh=0, dpr=1, ts=40;
const cam={x:0,y:0};
const S = G.S = { npcs:[], flags:{}, interact:[], triggers:[], beams:[], photos:{}, warnings:0, night:false, mode:'title', map:null };
const ABORT = G.ABORT = {abort:true};
G.token = 0;

/* ---------- Progreso guardado ---------- */
const SAVE_KEY='golpes-ep1-v1';
G.P = { unlocked:['prologue'], trust:0, keyPhoto:false, plan:null, photos:{}, stats:{} };
G.loadProgress=()=>{ try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); if(s) Object.assign(G.P,s); }catch(e){} };
G.saveProgress=()=>{ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(G.P)); }catch(e){} };
G.unlock=id=>{ if(!G.P.unlocked.includes(id)) G.P.unlocked.push(id); G.saveProgress(); };

/* ---------- Tamaño ---------- */
function resize(){
  dpr=Math.min(S.night?1.5:2,window.devicePixelRatio||1); vw=innerWidth; vh=innerHeight;
  cv.width=Math.round(vw*dpr); cv.height=Math.round(vh*dpr);
  ts=G.clamp(Math.floor(Math.min(vw/15, vh/8.4)),32,68);
  const portrait = vh>vw*1.05 && matchMedia('(pointer:coarse)').matches;
  $('rotate').hidden=!portrait;
  if (S.mode==='title'){ const tc=$('titleCv'); if(!tc.hidden){ tc.width=innerWidth*dpr; tc.height=innerHeight*dpr; R.illusFallback(tc,'keyart',0); } }
  const ic=$('illusCv'); if (!$('illus').hidden && !ic.hidden && S.illusKey){ ic.width=Math.round(innerWidth*dpr); ic.height=Math.round(innerHeight*dpr); R.illusFallback(ic,S.illusKey,0); }
}
addEventListener('resize',resize);

/* ---------- Mapas y entidades ---------- */
function loadMap(id,opts={}){
  const m=G.MAPS[id]();
  S.map=m; S.mapId=id; const wasNight=S.night; S.night=!!opts.night; if (wasNight!==S.night) resize(); S.npcs=[]; S.interact=[]; S.triggers=[]; S.beams=[];
  S.cams = S.night ? m.cams.map(c=>({...c, t:Math.random()*6, angle:c.a0*Math.PI/180, susp:0, call:0})) : [];
  S.zonesArmed = opts.zonesArmed||false;
  const sp=m.spots[opts.spawn]||opts.at||{x:2,y:2};
  const p=S.player; p.x=sp.x; p.y=sp.y; p.hidden=null; p.angle=opts.angle!==undefined?opts.angle:p.angle;
  for (const pr of m.props) if (pr.hide) S.interact.push({id:'hide'+pr.x+'_'+pr.y, x:pr.x+0.5, y:pr.y+0.5, prop:pr, label:'Esconderse', hold:0, r:1.35,
     cond:()=>S.allowHide!==false, fn:()=>hide(pr)});
  cam.x=p.x; cam.y=p.y;
  S.hooks && S.hooks.onMap && S.hooks.onMap(id);
}
function makeEntity(id,o={}){
  const C=G.CHARS[o.char||id]||G.CHARS.luc;
  return Object.assign({id, char:o.char||id, style:C.style, x:0,y:0, angle:Math.PI/2, path:[], speed:2, role:'extra', fov:0.62, range:5,
    susp:0, state:'idle', wps:null, wi:0, timer:0, look:0, base:Math.PI/2, moving:false, phase:0, visible:true, alerted:false}, o);
}
function spawn(id,o={}){
  removeNpc(id);
  const sp = typeof o.at==='string' ? S.map.spots[o.at] : o.at;
  const e=makeEntity(id,o); e.x=sp.x; e.y=sp.y; e.base=e.angle;
  if (e.wps){ e.state='wait'; e.timer=e.wps[0][2]||1; }
  S.npcs.push(e); return e;
}
function removeNpc(id){ S.npcs=S.npcs.filter(e=>e.id!==id); }
const npc = id => S.npcs.find(e=>e.id===id);

/* ---------- Bucle ---------- */
let last=performance.now();
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  if (S.mode==='play' && $('rotate').hidden) update(dt);
  if (S.map) draw(now/1000);
  if (S.mode==='play'||S.mode==='cut') hud(); else if (S.mode==='fail'||S.mode==='menu'){ $('pad').hidden=true; }
  for (const w of waiters.slice()) if (w.fn()) { waiters.splice(waiters.indexOf(w),1); w.res(); }
  requestAnimationFrame(frame);
}
const waiters=[];

function freeAt(x,y){ const r=0.27, g=S.map.grid; return g.walk(Math.floor(x-r),Math.floor(y-r))&&g.walk(Math.floor(x+r),Math.floor(y-r))&&g.walk(Math.floor(x-r),Math.floor(y+r))&&g.walk(Math.floor(x+r),Math.floor(y+r)); }
function follow(e,speed,dt){
  if (!e.path.length) return false;
  let step=speed*dt;
  while (step>0 && e.path.length){ const t=e.path[0], dx=t.x-e.x, dy=t.y-e.y, d=Math.hypot(dx,dy);
    if (d<=step){ e.x=t.x; e.y=t.y; e.path.shift(); step-=d; } else { e.x+=dx/d*step; e.y+=dy/d*step; e.moveAngle=Math.atan2(dy,dx); step=0; } }
  return true;
}
function turn(e,target,rate,dt){ const d=G.angDiff(target,e.angle); e.angle+=G.clamp(d,-rate*dt,rate*dt); }
function pathTo(e,x,y){ const g=S.map.grid; let tx=Math.floor(x), ty=Math.floor(y);
  if (!g.walk(tx,ty)){ let best=null,bd=99; for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++) if(g.walk(tx+dx,ty+dy)){const d=Math.abs(dx)+Math.abs(dy); if(d<bd){bd=d;best=[tx+dx,ty+dy];}} if(!best) return []; [tx,ty]=best; }
  const p=G.astar(g,Math.floor(e.x),Math.floor(e.y),tx,ty)||[];
  if (p.length && Math.floor(x)===tx && Math.floor(y)===ty) p[p.length-1]={x,y};
  return p;
}

function update(dt){
  const p=S.player; S.time=(S.time||0)+dt;
  // Jugador
  p.moving=false; p.running=false;
  if (!S.locked && !p.hidden && !S.hold){
    const mv=I.move();
    if (mv.x||mv.y){
      const running=mv.run && !p.crouch, sp=p.crouch?1.8:running?5.2:3.3, st=sp*dt*(I.joy.id!==null&&!running?G.clamp(mv.mag*1.25,0.45,1):1);
      const ox=p.x, oy=p.y;
      const canX=freeAt(p.x+mv.x*st,p.y)&&!blockedByNpc(p.x+mv.x*st,p.y);
      if (canX) p.x+=mv.x*st;
      else if (Math.abs(mv.x)>0.5 && Math.abs(mv.y)<0.35){ const cy=Math.floor(p.y)+0.5, d=cy-p.y; if (Math.abs(d)>0.01){ const ny=p.y+Math.sign(d)*Math.min(Math.abs(d),st); if (freeAt(p.x,ny)) p.y=ny; } }
      const canY=freeAt(p.x,p.y+mv.y*st)&&!blockedByNpc(p.x,p.y+mv.y*st);
      if (canY) p.y+=mv.y*st;
      else if (Math.abs(mv.y)>0.5 && Math.abs(mv.x)<0.35){ const cx=Math.floor(p.x)+0.5, d=cx-p.x; if (Math.abs(d)>0.01){ const nx=p.x+Math.sign(d)*Math.min(Math.abs(d),st); if (freeAt(nx,p.y)) p.x=nx; } }
      p.angle=Math.atan2(mv.y,mv.x);
      if (Math.hypot(p.x-ox,p.y-oy)>0.0005){ p.moving=true; p.running=running; p.phase+=dt*sp*3.2;
        S.stepT=(S.stepT||0)-dt; if (S.stepT<=0){ S.stepT=running?0.27:p.crouch?0.6:0.4; A.sfx(running?'stepRun':'step');
          if (S.night && running) noise(p.x,p.y,4.8); else if (S.night && !p.crouch) noise(p.x,p.y,1.4); } }
    }
  }
  const ptx=Math.floor(p.x), pty=Math.floor(p.y);
  // Zonas de alarma
  if (S.zonesArmed && !p.hidden) for (const z of S.map.zones){ if (S.flags['off_'+z.id]) continue;
    if (ptx>=z.x0&&ptx<=z.x1&&pty>=z.y0&&pty<=z.y1) return G.fail(z.id==='heat'?'Has cruzado el campo del sensor térmico.':'El sensor de luz ha detectado tu linterna.'); }
  // Disparadores
  for (const t of S.triggers.slice()){ if (t.done) continue; const inside = t.rect ? (p.x>=t.rect[0]&&p.x<=t.rect[2]+1&&p.y>=t.rect[1]&&p.y<=t.rect[3]+1) : t.fn2&&t.fn2();
    if (inside){ if (t.once!==false) t.done=true; t.fn(); } }
  // Interacción
  S.action=currentAction();
  if (S.hold){ const a=S.action; if (!a || a.it!==S.hold.it) S.hold=null; else { S.hold.p+=dt/a.it.hold;
    if (a.it.stall && S.hold.p>=a.it.stall){ S.hold.p=a.it.stall; if(!S.hold.stalled){ S.hold.stalled=true; a.it.onStall&&a.it.onStall(); } }
    else if (S.hold.p>=1){ const it=S.hold.it; S.hold=null; A.sfx('ok'); it.fn(); } } }
  // Personajes
  S.maxSusp=0;
  for (const e of S.npcs.slice()) updateNpc(e,dt);
  for (const c of S.cams) updateCam(c,dt);
  // Temporizador
  if (S.alarmT>0){ S.alarmT-=dt; if (S.alarmT<=0) for (const g of S.npcs) if (g.speedBase){ g.speed=g.speedBase; } }
  if (S.camLoopT>0) S.camLoopT-=dt;
  for (const c of S.coinsFly||[]){ c.t+=dt/0.5; if (c.t>=1){ noise(c.tx,c.ty,5.5,'coin'); (S.coinsFloor=S.coinsFloor||[]).push({x:c.tx,y:c.ty}); } }
  if (S.coinsFly) S.coinsFly=S.coinsFly.filter(c=>c.t<1);
  if (S.timer){ S.timer.left-=dt; if (S.timer.left<=0){ const f=S.timer.onEnd; S.timer=null; f&&f(); } }
  if (S.toastT>0){ S.toastT-=dt; if (S.toastT<=0) $('toast').hidden=true; }
  if (S.radioT>0){ S.radioT-=dt; if (S.radioT<=0) $('radio').hidden=true; }
}
function blockedByNpc(x,y){ for (const e of S.npcs){ if (e.visible===false || e.ghost) continue; if (Math.hypot(e.x-x,e.y-y)<0.5 && Math.hypot(e.x-S.player.x,e.y-S.player.y)>=Math.hypot(e.x-x,e.y-y)) return true; } return false; }

function sees(e,range,fov){
  const p=S.player; if (p.hidden || e.visible===false) return 0;
  const dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy); const R0=range*(p.crouch?0.72:1);
  if (d<0.9 && e.role==='guard') return 1;
  if (d>R0) return 0;
  if (Math.abs(G.angDiff(Math.atan2(dy,dx),e.angle))>fov) return 0;
  if (!G.los(S.map.grid,e.x,e.y,p.x,p.y)) return 0;
  return 1-(d/R0)*0.6;
}
function inRestricted(){ const p=S.player; return S.map.restricted.find(z=>p.x>=z.x0&&p.x<z.x1+1&&p.y>=z.y0&&p.y<z.y1+1); }

function updateNpc(e,dt){
  e.look+=dt; e.moving=false;
  if (e.scripted){
    if (follow(e,e.scriptSpeed||e.speed,dt)){ turn(e,e.moveAngle,8,dt); e.moving=true; e.phase+=dt*e.speed*3; }
    else { e.scripted=false; const r=e.onArrive; e.onArrive=null; if (e.faceAfter!==undefined){ e.angle=e.faceAfter; e.base=e.angle; e.faceAfter=undefined; } r&&r(); }
  } else if (e.role==='friend'){
    const p=S.player, d=Math.hypot(p.x-e.x,p.y-e.y);
    if (d>1.6){ e.repath=(e.repath||0)-dt; if (e.repath<=0||!e.path.length){ e.path=pathTo(e,p.x,p.y); e.path.splice(-1,1); e.repath=0.4; }
      if (follow(e,Math.min(5,2.6+d*0.6),dt)){ turn(e,e.moveAngle,8,dt); e.moving=true; e.phase+=dt*9; } }
    else { e.path=[]; turn(e,Math.atan2(p.y-e.y,p.x-e.x),3,dt); }
  } else if (e.wps){
    if (e.state==='patrol'||e.state==='investigate'){
      const rush=e.state==='investigate';
      if (follow(e,rush?e.speed*1.45:e.speed,dt)){ turn(e,e.moveAngle,rush?8:6,dt); e.moving=true; e.phase+=dt*e.speed*3; }
      if (!e.path.length){ if (rush && e.checkCab){ const cab=e.checkCab; e.checkCab=null; e.angle=Math.atan2(cab.y+0.5-e.y,cab.x+0.5-e.x);
            if (S.player.hidden===cab) return G.fail(`${G.CHARS[e.char].name} ha abierto el armario. «¡Fuera de ahí!»`,'caught');
            A.sfx('door'); }
          if (rush){ e.state='look'; e.timer=2.4; e.searchLeft = e.searchLeft===undefined ? 2 : e.searchLeft; } else { e.state='wait'; const w=e.wps[e.wi]; e.timer=(w[2]||1)*(e.role==='guard'?0.6+Math.random()*0.8:1); if (w[3]!==undefined) e.faceTo=w[3]; } e.base=e.faceTo!==undefined?e.faceTo:e.angle; e.faceTo=undefined; e.look=0; }
    } else if (e.state==='wait'){
      e.timer-=dt; turn(e,e.base+Math.sin(e.look*1.4)*(e.lookAmp||0.6),4,dt);
      if (e.timer<=0){ e.wi=(e.wi+1)%e.wps.length; if (e.watchHook && S.flags.hasKey && e.hookWp!==undefined && Math.random()<0.35) e.wi=e.hookWp; const w=e.wps[e.wi]; e.path=pathTo(e,w[0]+0.5,w[1]+0.5); e.state='patrol'; }
    } else if (e.state==='look'){
      e.timer-=dt; e.angle=e.base+Math.sin(e.look*2.2)*1.1;
      if (e.timer<=0){
        if (e.searchLeft>0 && e.role==='guard'){ e.searchLeft--; const g=S.map.grid; let pt=null;
          for (let k=0;k<20&&!pt;k++){ const tx=Math.floor(e.x+(Math.random()*6-3)), ty=Math.floor(e.y+(Math.random()*6-3)); if (g.walk(tx,ty) && G.los(g,e.x,e.y,tx+0.5,ty+0.5)) pt=[tx+0.5,ty+0.5]; }
          if (pt){ e.path=pathTo(e,pt[0],pt[1]); e.state='investigate'; e.searching=true; return; } }
        e.searchLeft=undefined; e.searching=false; const w=e.wps[e.wi]; e.path=pathTo(e,w[0]+0.5,w[1]+0.5); e.state='patrol'; }
    }
  } else if (e.idleLook){
    const L=e.idleLook; e.angle = L.base + (Math.sin(e.look*(L.speed||0.5))>L.th ? L.alt : Math.sin(e.look*1.3)*0.25);
  }
  // Percepción
  if (S.locked && (e.role==='guard'||e.role==='staff')){ S.maxSusp=Math.max(S.maxSusp,e.susp); return; }
  if (e.role==='guard' && S.night){
    const alarm=S.alarmT>0, R0=e.range*(alarm?1.15:1);
    if (e.watchHook && S.flags.hasKey && S.map){ const h=e.watchHook, d=Math.hypot(h.x-e.x,h.y-e.y);
      if (d<R0 && Math.abs(G.angDiff(Math.atan2(h.y-e.y,h.x-e.x),e.angle))<e.fov && G.los(S.map.grid,e.x,e.y,h.x,h.y)) return G.fail('Verbeke ha mirado el gancho del almacén y estaba vacío. Mañana cambiarán la cerradura.','time'); }
    const s=sees(e,R0,e.fov);
    if (s>0){ e.susp=Math.min(1,e.susp+dt*Math.min(1.6,(0.8+2.4*s)*(S.player.crouch?0.65:1))); e.retarget=(e.retarget||0)-dt;
      if (e.susp>0.3 && e.retarget<=0 && !e.scripted){ e.path=pathTo(e,S.player.x,S.player.y); e.state='investigate'; e.retarget=0.4; }
      if (e.susp>0.3 && !e.alerted){ e.alerted=true; S.alerts=(S.alerts||0)+1; A.sfx('alert'); S.hooks&&S.hooks.onAlert&&S.hooks.onAlert(e); }
      if (e.susp>0.62 && !(S.alarmT>0)) raiseAlarm(e); }
    else { e.susp=Math.max(0,e.susp-dt*0.3); if (e.susp===0 && e.state!=='investigate') e.alerted=false; }
    if (e.susp>=1) return G.fail(e.caughtLine||'Te han visto.');
  } else if (e.role==='staff' && !S.locked){
    const z=inRestricted();
    if (z){ const s=sees(e,e.range,e.fov);
      if (s>0){ e.susp=Math.min(1,e.susp+dt*(1.0+2.0*s)); if (e.susp>=1){ e.susp=0; warning(e,z); } }
      else e.susp=Math.max(0,e.susp-dt*0.5);
    } else e.susp=Math.max(0,e.susp-dt*0.5);
  }
  S.maxSusp=Math.max(S.maxSusp,e.susp);
}
function updateCam(c,dt){
  if (S.locked) return;
  c.off = S.camLoopT>0; c.t+=dt; if (c.off){ c.susp=Math.max(0,c.susp-dt); const pr=S.map.props.find(q=>q.id===c.id); if(pr){pr.off=true;} return; } else { const pr=S.map.props.find(q=>q.id===c.id); if(pr) pr.off=false; } c.angle=(c.a0+(c.a1-c.a0)*(0.5+0.5*Math.sin(c.t*0.5)))*Math.PI/180;
  const pr=S.map.props.find(q=>q.id===c.id); if (pr){ pr.angle=c.angle; pr.alarm=c.susp>0.35; }
  const p=S.player; let s=0;
  if (!p.hidden){ const dx=p.x-c.x, dy=p.y-c.y, d=Math.hypot(dx,dy), Rr=c.range*(p.crouch?0.8:1);
    if (d<=Rr && Math.abs(G.angDiff(Math.atan2(dy,dx),c.angle))<=c.half && G.los(S.map.grid,c.x,c.y,p.x,p.y)) s=1-(d/Rr)*0.6; }
  c.call-=dt;
  if (s>0){ c.susp=Math.min(1,c.susp+dt*(0.55+1.4*s));
    if (c.susp>0.4 && c.call<=0){ const g=S.npcs.filter(e=>e.role==='guard'&&!e.scripted).sort((a,b)=>G.dist(a,p)-G.dist(b,p))[0];
      if (g){ g.path=pathTo(g,p.x,p.y); g.state='investigate'; } c.call=1.5; if(!c.alerted){c.alerted=true;S.alerts=(S.alerts||0)+1;A.sfx('alert');} if (c.susp>0.7 && !(S.alarmT>0)) raiseAlarm(null); } }
  else { c.susp=Math.max(0,c.susp-dt*0.4); if (c.susp===0) c.alerted=false; }
  S.maxSusp=Math.max(S.maxSusp,c.susp);
  if (c.susp>=1) G.fail('La cámara del vestíbulo te ha grabado. Dirk ya está llamando a la policía.');
}
function raiseAlarm(e){ S.alarmT=22; S.alarmBy=e?G.CHARS[e.char].name:'La cámara'; A.sfx('alert');
  for (const g of S.npcs) if (g.role==='guard' && g!==e && !g.scripted){ g.speedBase=g.speedBase||g.speed; g.speed=g.speedBase*1.2; } }
G.raiseAlarm=raiseAlarm;
function noise(x,y,r,kind){
  S.rings=S.rings||[]; S.rings.push({x,y,r,t:0});
  for (const e of S.npcs){ if (e.role!=='guard'||e.scripted||e.visible===false) continue; const d=Math.hypot(e.x-x,e.y-y);
    if (d<=r && (d<=r*0.5||G.los(S.map.grid,e.x,e.y,x,y))){ e.path=pathTo(e,x,y); e.state='investigate'; e.susp=Math.max(e.susp,0.2);
      if(!e.alerted){e.alerted=true;S.alerts=(S.alerts||0)+1; S.hooks&&S.hooks.onAlert&&S.hooks.onAlert(e,kind||'noise');} } }
}
G.noise=noise;

/* ---------- Advertencias (de día) ---------- */
const WARN_LINES = [
  '¿Se ha perdido, señor Sala? Esta zona es solo para personal.',
  'Señor Sala. Otra vez. Aquí no puede estar.',
  'Ya está bien. Voy a tener que informar de esto.',
];
const PHOTO_LINES = ['¿Qué está fotografiando, señor Sala?','¿Otra foto? Aquí dentro no se hacen fotos.','Deme esa cámara. Voy a informar de esto.'];
async function warning(e,z,photo){
  if (S.mode!=='play') return;
  S.warnings++; A.sfx('warn'); S.locked=true; S.hold=null; S.player.hidden=null;
  e.angle=Math.atan2(S.player.y-e.y,S.player.x-e.x);
  const tk=G.token;
  try {
    await G.api.say(e.char,(photo?PHOTO_LINES:WARN_LINES)[Math.min(2,S.warnings-1)]);
    if (tk!==G.token) return;
    if (S.warnings>=3) return G.fail('Has levantado demasiadas sospechas. Tu tapadera de inquilino se ha acabado antes de empezar.','cover');
    if (!photo){ await G.api.say('vito', ['Perdone. Pensaba que era el cuarto de las calderas.','Me he vuelto a confundir de puerta. La edad.','Ya me iba. De verdad.'][Math.min(2,S.warnings-1)]); }
    if (z){ const o=S.map.spots[z.out]; S.player.x=o.x; S.player.y=o.y; }
    G.api.toast(`Advertencia ${S.warnings} de 3. A la tercera se acaba tu tapadera.`);
  } catch(err){ if (err!==ABORT) throw err; }
  S.locked=false;
}

/* ---------- Interacción ---------- */
function currentAction(){
  const p=S.player;
  if (p.hidden) return {it:{label:'Salir', hold:0, fn:unhide}};
  let best=null,bd=99;
  for (const it of S.interact){ if (it.cond && !it.cond()) continue; const d=it.self?1.25:Math.hypot(it.x-p.x,it.y-p.y); if (d>(it.r||1.4)) continue;
    if (d<bd){ bd=d; best=it; } }
  return best?{it:best}:null;
}
function hide(pr){ const p=S.player;
  if (S.night) for (const e of S.npcs){ if (e.role!=='guard'||e.scripted) continue; if (sees(e,e.range*1.1,e.fov+0.15)>0 && e.susp>0.15){ e.checkCab=pr; e.path=pathTo(e,pr.x+0.5,pr.y+0.5); e.state='investigate'; e.susp=Math.max(e.susp,0.5); } }
  p.prev={x:p.x,y:p.y}; p.hidden=pr; p.x=pr.x+0.5; p.y=pr.y+0.5; A.sfx('door'); }
function unhide(){ const p=S.player; if (p.prev){ p.x=p.prev.x; p.y=p.prev.y; } p.hidden=null; A.sfx('door'); }
function actDown(){
  if (S.mode==='cut') return advance();
  if (S.mode!=='play' || S.locked) return;
  const a=S.action; if (!a) return;
  const label = typeof a.it.label==='function'?a.it.label():a.it.label;
  if (a.it.locked && a.it.locked()){ G.api.toast(a.it.lockedMsg||'No puedes hacer eso ahora.'); return; }
  if (!a.it.hold){ A.sfx('click'); a.it.fn(); return; }
  S.hold={it:a.it,p:0};
}
function actUp(){ S.hold=null; }

/* ---------- Fotos ---------- */
function throwCoin(){
  const p=S.player; if (S.mode!=='play'||S.locked||p.hidden||!S.night||!(S.coins>0)) return;
  S.coins--; A.sfx('click');
  const ca=Math.cos(p.angle), sa=Math.sin(p.angle); let r=0.4;
  for (; r<5.5; r+=0.1){ if (!S.map.grid.walk(Math.floor(p.x+ca*r),Math.floor(p.y+sa*r))){ r-=0.25; break; } }
  r=Math.max(0.6,r); (S.coinsFly=S.coinsFly||[]).push({sx:p.x,sy:p.y,tx:p.x+ca*r,ty:p.y+sa*r,t:0});
}
G.throwCoin=throwCoin;
function takePhoto(){
  if (S.mode!=='play'||S.locked||!S.photoEnabled||S.player.hidden) return;
  A.sfx('flash'); const fl=$('flash'); fl.style.transition='none'; fl.style.opacity='0.85'; requestAnimationFrame(()=>{ fl.style.transition='opacity .5s'; fl.style.opacity='0'; });
  const p=S.player;
  // ¿Te ha visto alguien?
  const witness=S.npcs.find(e=>e.role==='staff' && sees(e,e.range,e.fov)>0);
  let best=null, bs=99;
  for (const t of S.map.photos){ if (S.photos[t.id]) continue; if (t.hidden && !S.flags['photo_'+t.id]) continue;
    const dx=t.x-p.x, dy=t.y-p.y, d=Math.hypot(dx,dy); if (d>5.5) continue;
    const da=Math.abs(G.angDiff(Math.atan2(dy,dx),p.angle)); if (da>0.75) continue;
    if (!G.los(S.map.grid,p.x,p.y,t.lx!==undefined?t.lx:t.x,t.ly!==undefined?t.ly:t.y)) continue;
    const sc=d+da*3; if (sc<bs){ bs=sc; best=t; } }
  if (best){
    S.photos[best.id]={label:best.label, note:best.note, img:snapshot(best)};
    A.sfx('ok'); G.api.toast(`Foto: ${best.label}. Guardada en el expediente.`);
    S.hooks&&S.hooks.onPhoto&&S.hooks.onPhoto(best.id);
  } else G.api.toast('Nada que merezca una foto. Apunta hacia algo de la seguridad.');
  if (witness) setTimeout(()=>warning(witness,null,true),250);
}
function snapshot(t){
  try{
    const sx=((t.x-cam.x)*ts+vw/2)*dpr, sy=((t.y-cam.y)*ts+vh/2)*dpr, w=ts*5*dpr, h=ts*3.1*dpr;
    const c=document.createElement('canvas'); c.width=320; c.height=200; const x=c.getContext('2d');
    x.filter='grayscale(1) contrast(1.25) brightness(1.05)'; x.drawImage(cv,sx-w/2,sy-h/2,w,h,0,0,320,200);
    x.filter='none'; x.fillStyle='rgba(255,240,200,.08)'; x.fillRect(0,0,320,200);
    return c.toDataURL('image/jpeg',0.72);
  }catch(e){ return null; }
}

/* ---------- Dibujo ---------- */
function draw(t){
  const p=S.player, m=S.map, g=m.grid;
  const target=S.camTarget||p, halfW=vw/2/ts, halfH=vh/2/ts;
  const cl=(v,lo,hi)=>lo>hi?(lo+hi)/2:G.clamp(v,lo,hi);
  const tx=cl(target.x,halfW-0.5,m.w-halfW+0.5), ty=cl(target.y,halfH-0.8,m.h-halfH+0.8);
  cam.x+=(tx-cam.x)*0.12; cam.y+=(ty-cam.y)*0.12;
  ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#070a12'; ctx.fillRect(0,0,cv.width,cv.height);
  ctx.setTransform(dpr*ts,0,0,dpr*ts,dpr*(vw/2-cam.x*ts),dpr*(vh/2-cam.y*ts));
  const x0=Math.max(0,Math.floor(cam.x-halfW-1)), x1=Math.min(m.w-1,Math.ceil(cam.x+halfW+1)), y0=Math.max(0,Math.floor(cam.y-halfH-1)), y1=Math.min(m.h-1,Math.ceil(cam.y+halfH+1));
  for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++){ const c=g.tile(x,y); if (c!=='#') R.floor(ctx,g,x,y); }
  // zonas privadas (de día)
  if (!S.night) for (const z of m.restricted){ ctx.strokeStyle='rgba(239,75,75,.35)'; ctx.lineWidth=0.05; ctx.setLineDash([0.2,0.15]); ctx.strokeRect(z.x0+0.05,z.y0+0.05,z.x1-z.x0+0.9,z.y1-z.y0+0.9); ctx.setLineDash([]);
    ctx.fillStyle='rgba(239,75,75,.05)'; ctx.fillRect(z.x0,z.y0,z.x1-z.x0+1,z.y1-z.y0+1); }
  // zonas de alarma
  if (S.zonesArmed) for (const z of m.zones){ if (S.flags['off_'+z.id]) continue;
    ctx.fillStyle=`rgba(239,75,75,${0.1+0.05*Math.sin(t*4)})`; ctx.fillRect(z.x0,z.y0,z.x1-z.x0+1,z.y1-z.y0+1);
    ctx.strokeStyle=`rgba(255,110,110,${0.45+0.3*Math.sin(t*6)})`; ctx.lineWidth=0.025;
    for (let i=0;i<3;i++){ const xx=z.x0+0.25+i*0.25; ctx.beginPath(); ctx.moveTo(xx,z.y0); ctx.lineTo(xx,z.y1+1); ctx.stroke(); } }
  for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++){ const c=g.tile(x,y);
    if (c==='#') R.wall(ctx,g,x,y); else if (c==='G') R.glass(ctx,x,y,t); else if (c==='D') R.doorFrame(ctx,g,x,y); }
  const sorted=m.props.slice().sort((a,b)=>(a.y+a.h)-(b.y+b.h));
  for (const pr of sorted){ if (pr.x+pr.w<x0-1||pr.x>x1+1||pr.y+pr.h<y0-1||pr.y>y1+1) continue; R.prop(ctx,pr,t,S); }
  // marcador de interacción
  if (S.action && S.mode==='play' && !S.player.hidden){ const it=S.action.it; if (it.x!==undefined){ ctx.fillStyle=`rgba(242,179,61,${0.6+0.3*Math.sin(t*5)})`; ctx.beginPath(); const yy=it.y-0.75+Math.sin(t*4)*0.05; ctx.moveTo(it.x,yy+0.16); ctx.lineTo(it.x-0.1,yy); ctx.lineTo(it.x+0.1,yy); ctx.fill(); } }
  // conos (de día, sutiles; de noche los dibuja la luz + tinte)
  for (const e of S.npcs){ if (e.visible===false) continue;
    if (e.role==='staff' || (e.role==='guard')){ const pts=G.cone(g,e.x,e.y,e.angle,e.fov,e.range*(S.player.crouch?0.72:1),18);
      const al = S.night ? (e.susp>0.3?0.22:0.08) : (e.susp>0.05?0.12+e.susp*0.2:0.07);
      ctx.fillStyle = e.susp>0.3 ? `rgba(239,75,75,${al+0.06})` : (S.night?`rgba(255,230,160,${al})`:`rgba(255,255,255,${al})`);
      ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(const q of pts) ctx.lineTo(q[0],q[1]); ctx.closePath(); ctx.fill(); } }
  for (const c of S.cams){ if (c.off) continue; const pts=G.cone(g,c.x,c.y,c.angle,c.half,c.range*(S.player.crouch?0.8:1),18);
    ctx.fillStyle=c.susp>0.4?`rgba(239,75,75,${0.18+c.susp*0.2})`:`rgba(170,200,255,${0.1+c.susp*0.2})`; ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(const q of pts) ctx.lineTo(q[0],q[1]); ctx.closePath(); ctx.fill(); }
  for (const c of S.coinsFloor||[]){ ctx.fillStyle='#d9b25a'; ctx.beginPath(); ctx.arc(c.x,c.y,0.07,0,7); ctx.fill(); }
  for (const c of S.coinsFly||[]){ const x=c.sx+(c.tx-c.sx)*c.t, y=c.sy+(c.ty-c.sy)*c.t-Math.sin(c.t*Math.PI)*0.8; ctx.fillStyle='#f6d27a'; ctx.beginPath(); ctx.arc(x,y,0.09,0,7); ctx.fill(); }
  // rutas de los vigilantes (de noche)
  if (S.night) for (const e of S.npcs){ if (e.role!=='guard'||!e.path||!e.path.length||e.visible===false) continue; ctx.strokeStyle=e.state==='investigate'?'rgba(239,75,75,.35)':'rgba(255,230,160,.22)'; ctx.lineWidth=0.05; ctx.setLineDash([0.12,0.18]); ctx.beginPath(); ctx.moveTo(e.x,e.y); for (const n of e.path) ctx.lineTo(n.x,n.y); ctx.stroke(); ctx.setLineDash([]); }
  // anillos de ruido
  if (S.rings){ for (const r of S.rings){ r.t+=1/60; ctx.strokeStyle=`rgba(242,179,61,${0.6*(1-r.t/0.7)})`; ctx.lineWidth=0.06; ctx.beginPath(); ctx.arc(r.x,r.y,r.r*(r.t/0.7),0,7); ctx.stroke(); } S.rings=S.rings.filter(r=>r.t<0.7); }
  // personajes (orden por y)
  const people=S.npcs.filter(e=>e.visible!==false).concat(p.hidden?[]:[p]).sort((a,b)=>a.y-b.y);
  for (const e of people){ if (e===p && S.flags.vitoHidden) continue; R.person(ctx,e,t); }
  R.lighting(ctx,S,cam,vw,vh,dpr,ts);
  if (!S.night){ ctx.setTransform(dpr,0,0,dpr,0,0); const vg=ctx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*0.35,vw/2,vh/2,Math.max(vw,vh)*0.75); vg.addColorStop(0,'rgba(10,14,26,0)'); vg.addColorStop(1,'rgba(10,14,26,.45)'); ctx.fillStyle=vg; ctx.fillRect(0,0,vw,vh);
    ctx.fillStyle='rgba(255,200,120,.035)'; ctx.fillRect(0,0,vw,vh); }
  // capa de pantalla
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const toS=(wx,wy)=>[(wx-cam.x)*ts+vw/2,(wy-cam.y)*ts+vh/2];
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for (const e of S.npcs){ if (e.visible===false) continue; const [sx,sy]=toS(e.x,e.y-0.62);
    if (e.susp>0.12 || e.state==='investigate'){ ctx.font=`700 ${Math.round(ts*0.55)}px 'IBM Plex Sans Condensed',sans-serif`; ctx.fillStyle=e.susp>0.6?'#ef4b4b':'#f2b33d'; ctx.fillText(e.susp>0.6?'!':'?',sx,sy-ts*0.15); }
    else if (e.showName && Math.hypot(e.x-p.x,e.y-p.y)<4){ ctx.font=`500 ${Math.max(10,Math.round(ts*0.24))}px 'IBM Plex Mono',monospace`; ctx.fillStyle='rgba(236,230,214,.75)'; ctx.fillText(G.CHARS[e.char].name.toUpperCase(),sx,sy); } }
  for (const L of S.labels||[]){ if (L.map!==S.mapId) continue; const [sx,sy]=toS(L.x,L.y); if (sx<-60||sx>vw+60||sy<-20||sy>vh+20) continue;
    ctx.font=`500 ${Math.max(9,Math.round(ts*0.22))}px 'IBM Plex Mono',monospace`; ctx.fillStyle=L.col||'rgba(236,230,214,.45)'; ctx.fillText(L.text,sx,sy); }
  if (S.zonesArmed) for (const z of m.zones){ if (S.flags['off_'+z.id]) continue; const [sx,sy]=toS(z.x0+0.5,z.y1+0.6); ctx.font=`600 ${Math.max(10,Math.round(ts*0.24))}px 'IBM Plex Mono',monospace`; ctx.fillStyle='rgba(255,140,140,.85)'; ctx.fillText(z.label,sx,sy); }
  // joystick
  if (S.mode==='play' && !S.locked){ const j=I.joy, jx=j.id!==null?j.ox:Math.max(70,parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sl'))+70), jy=j.id!==null?j.oy:vh-78;
    ctx.strokeStyle=j.id!==null?'rgba(236,230,214,.35)':'rgba(236,230,214,.13)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(jx,jy,I.JR,0,7); ctx.stroke();
    if (j.id!==null){ const run=j.mag>0.94&&!p.crouch; ctx.fillStyle=run?'rgba(242,179,61,.75)':'rgba(236,230,214,.45)'; ctx.beginPath(); ctx.arc(jx+j.x*j.mag*I.JR,jy+j.y*j.mag*I.JR,22,0,7); ctx.fill();
      if (run){ ctx.font="600 10px 'IBM Plex Mono',monospace"; ctx.fillStyle='rgba(242,179,61,.9)'; ctx.fillText('CORRER',jx,jy-I.JR-12); } }
    else if (S.showJoyHint){ ctx.font="500 10px 'IBM Plex Mono',monospace"; ctx.fillStyle=`rgba(236,230,214,${0.35+0.25*Math.sin(t*3)})`; ctx.fillText('ARRASTRA',jx,jy); } }
  if (S.redFlash>0){ S.redFlash-=1/60; ctx.fillStyle=`rgba(239,75,75,${0.35*Math.abs(Math.sin(S.redFlash*10))})`; ctx.fillRect(0,0,vw,vh); }
}

/* ---------- HUD ---------- */
let lastAct='';
function hud(){
  const play=S.mode==='play' && !S.locked;
  const cut=S.mode==='cut'||!!S.backdrop;
  $('leftCol').style.visibility=cut?'hidden':'visible'; $('topMid').style.visibility=cut?'hidden':'visible';
  $('objBox').hidden=!S.objective; $('objText').textContent=S.objective||'';
  $('topMid').hidden=false;
  const showSusp = S.night || S.warnings>0 || S.maxSusp>0.02;
  $('suspRow').style.visibility=showSusp?'visible':'hidden';
  const b=$('suspBar'); b.style.width=(S.maxSusp*100)+'%'; b.classList.toggle('hot',S.maxSusp>0.55);
  const wc=$('warnChip'); wc.hidden=!(S.warnings>0 && !S.night); wc.textContent=`ADVERTENCIAS ${S.warnings}/3`;
  const tc=$('timeChip'); const chipT = S.timer ? `${S.timer.label} ${Math.ceil(S.timer.left)} s` : S.alarmT>0 ? `ALERTA · ${S.alarmBy} ha avisado por radio` : S.camLoopT>0 ? `CÁMARA EN BUCLE ${Math.ceil(S.camLoopT)} s` : S.flags.hasKey ? 'EL GANCHO ESTÁ VACÍO' : '';
  tc.hidden=!chipT; tc.textContent=chipT; tc.classList.toggle('warn',S.alarmT>0||!!S.flags.hasKey);
  const cb2=$('coinBtn'); cb2.hidden=!(S.night && S.coins!==undefined); $('coinN').textContent=S.coins||0; cb2.disabled=!(S.coins>0);
  $('topRight').hidden=!play||cut; $('photoCount').textContent=Object.keys(S.photos).length||Object.keys(G.P.photos||{}).length;
  $('pad').hidden=!play;
  $('photoBtn').hidden=!S.photoEnabled;
  const cb=$('crouchBtn'); cb.classList.toggle('on',!!S.player.crouch); cb.textContent=S.player.crouch?'De pie':'Agachar';
  const a=S.action, lbl=a?(typeof a.it.label==='function'?a.it.label():a.it.label):'';
  const key=a?lbl+(a.it.locked&&a.it.locked()?'L':''):'idle';
  if (key!==lastAct){ $('actLabel').textContent=a?lbl:'Usar'; $('actBtn').classList.toggle('idle',!a); lastAct=key; }
  $('actBtn').style.setProperty('--p',S.hold?S.hold.p:0);
}

/* ---------- Diálogo ---------- */
let dlgState=null;
function advance(){
  if (!dlgState) { if (S.cardRes){ const r=S.cardRes; S.cardRes=null; r(); } return; }
  if (dlgState.typing){ dlgState.typing=false; return; }
  if (dlgState.choices) return;
  const r=dlgState.res; dlgState=null; $('dlg').hidden=true; r(0);
}
function say(who,text,choices){
  const tk=G.token;
  return new Promise((res,rej)=>{
    const prevMode=S.mode; S.mode='cut'; S.hold=null;
    const C=G.CHARS[who]||{name:who};
    $('dlg').hidden=false; $('dlgName').textContent=who==='narrator'?'':C.name;
    const pw=$('dlgPortrait'); pw.innerHTML=''; pw.hidden=(who==='narrator'); if (who!=='narrator') pw.appendChild(R.portraitEl(who,300));
    const el=$('dlgText'); el.innerHTML=''; $('choices').innerHTML=''; $('dlgMore').hidden=true;
    const st=dlgState={typing:true,choices:null,res:(v)=>{ S.mode=prevMode==='cut'?'play':prevMode; if(S.mode==='cut') S.mode='play'; if (tk!==G.token) return rej(ABORT); res(v); }};
    const italic = text.startsWith('(') ;
    let i=0; const full=text;
    const tick=()=>{ if (dlgState!==st) return;
      if (!st.typing){ i=full.length; }
      i=Math.min(full.length,i+2);
      el.innerHTML = italic?`<em>${esc(full.slice(0,i))}</em>`:esc(full.slice(0,i));
      if (i%6===0) A.sfx('blip');
      if (i<full.length) setTimeout(tick,22); else { st.typing=false; done(); } };
    const done=()=>{
      if (choices && choices.length){ st.choices=choices;
        const box=$('choices'); box.innerHTML='';
        st.readyAt=performance.now()+350;
        choices.forEach((c,ci)=>{ const b=document.createElement('button'); b.className='choice'; b.innerHTML=`<b>${ci+1}</b>${esc(c)}`;
          b.addEventListener('click',ev=>{ ev.stopPropagation(); if (performance.now()<st.readyAt) return; pick(ci); }); box.appendChild(b); });
      } else $('dlgMore').hidden=false; };
    const pick=(ci)=>{ if (dlgState!==st||!st.choices) return; A.sfx('click'); dlgState=null; $('dlg').hidden=true; $('choices').innerHTML=''; st.res(ci); };
    st.pick=pick;
    tick();
  });
}
function esc(s){ return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
$('dlg').addEventListener('pointerdown',e=>{ if (e.target.closest('.choice')) return; e.preventDefault(); advance(); });
I.handlers.choice = ci => { if (dlgState&&dlgState.choices&&!dlgState.typing&&ci<dlgState.choices.length&&performance.now()>=dlgState.readyAt) dlgState.pick(ci); };

/* ---------- Pantallas ---------- */
function typeInto(el,text,speed=40){ return new Promise(res=>{ let i=0; el.textContent=''; const tk=()=>{ i++; el.textContent=text.slice(0,i); if(i%3===0&&text[i-1]!==' ')A.sfx('blip'); if(i<text.length&&!S.skipType) setTimeout(tk,speed); else { el.textContent=text; res(); } }; tk(); }); }
async function card(l1,l2,l3,hold=2.2){
  const tk=G.token; S.mode='cut'; $('card').hidden=false; $('cardL1').textContent=''; $('cardL2').textContent=''; $('cardL3').textContent='';
  S.skipType=false;
  const skip=new Promise(r=>{ S.cardRes=()=>{ S.skipType=true; r(); }; });
  await Promise.race([ (async()=>{ if(l1) await typeInto($('cardL1'),l1,28); if(l2) await typeInto($('cardL2'),l2,55); if(l3) await typeInto($('cardL3'),l3,18); await G.sleep(hold); })(), skip ]);
  if (l1) $('cardL1').textContent=l1; if (l2) $('cardL2').textContent=l2; if (l3) $('cardL3').textContent=l3;
  S.cardRes=null; S.skipType=false;
  if (tk!==G.token) throw ABORT;
  $('card').hidden=true; S.mode='play';
}
$('card').addEventListener('pointerdown',()=>{ G.audio.init(); S.cardRes&&S.cardRes(); });
function illus(key,kicker,text){
  const tk=G.token;
  return new Promise((res,rej)=>{
    S.mode='cut'; const el=$('illus'); el.hidden=false; $('illusK').textContent=kicker||''; $('illusText').textContent='';
    S.illusKey=key; const c=$('illusCv'); c.width=Math.round(innerWidth*dpr); c.height=Math.round(innerHeight*dpr); c.hidden=false; R.illusFallback(c,key,0);
    const im=$('illusImg'); im.style.backgroundImage='';
    const img=new Image(); img.onload=()=>{ im.style.backgroundImage=`url(${img.src})`; c.hidden=true; }; img.src=`assets/scenes/${key}.png`;
    const tapEl=el.querySelector('.tap'); tapEl.style.visibility='hidden';
    let typing=true; typeInto($('illusText'),text,18).then(()=>{ typing=false; tapEl.style.visibility='visible'; });
    const done=()=>{ if (typing){ S.skipType=true; setTimeout(()=>S.skipType=false,50); return; } el.removeEventListener('pointerdown',done); I.handlers.advanceIllus=null; el.hidden=true; S.mode='play'; if (tk!==G.token) return rej(ABORT); res(); };
    el.addEventListener('pointerdown',done); I.handlers.advanceIllus=done;
  });
}
function fade(on){ return new Promise(r=>{ $('fade').style.opacity=on?'1':'0'; setTimeout(r,480); }); }

let toastTimer;
function toast(text,dur=3.8){ const el=$('toast'); el.textContent=text; el.hidden=false; S.toastT=dur; }
function radio(who,text,dur=4.2,tag='radio'){
  const el=$('radio'); el.hidden=false; $('radioWho').textContent=(G.CHARS[who]||{name:who}).name+' · '+tag; $('radioText').textContent=text;
  const f=$('radioFace'); f.innerHTML=''; f.appendChild(R.portraitEl(who,80)); S.radioT=dur; A.sfx('radio');
}

/* ---------- Pausa, expediente, fallo ---------- */
function sheet(html){ $('sheetBody').innerHTML=html; $('sheet').hidden=false; }
function closeSheet(){ $('sheet').hidden=true; }
function dossierHTML(){
  const all=[...G.MAPS.planta0().photos,...G.MAPS.sotano().photos];
  const tiles=all.map((t,i)=>{ const ph=S.photos[t.id]||G.P.photos[t.id]; const r=((i*37)%7-3)*0.6;
    return ph ? `<div class="photo" style="--r:${r}deg"><div class="img" style="background-image:url(${ph.img||''})"></div><b>${t.label}</b><span>${t.note}</span></div>`
              : `<div class="photo empty" style="--r:${r}deg"><div class="img"></div><b>Sin foto</b><span>${t.hidden?'Algo que todavía no has visto.':'Algo de la seguridad del edificio.'}</span></div>`; }).join('');
  return `<p class="stamp">Expediente</p><h2>Centro del Diamante</h2><p class="meta">Notas de Vito · ${Object.keys(S.photos).length} fotos</p><div class="photos">${tiles}</div>`;
}
function openDossier(){ if (S.mode!=='play') return; S.mode='menu'; sheet(dossierHTML()+`<div class="pbtns"><button class="pbtn" id="closeD">Volver</button></div>`); $('closeD').onclick=()=>{ closeSheet(); S.mode='play'; }; }
function openPause(){
  if (S.mode!=='play') return; S.mode='menu';
  sheet(`<p class="stamp">Pausa</p><h2>${S.chapterTitle||''}</h2><p class="meta">${S.map?S.map.name:''}</p>
    <div class="pbtns"><button class="pbtn" id="pResume">Continuar</button><button class="pbtn alt" id="pRestart">Reiniciar capítulo</button>
    <button class="pbtn alt" id="pSound">${A.muted?'Activar sonido':'Silenciar'}</button><button class="pbtn alt" id="pTitle">Menú principal</button></div>`);
  $('pResume').onclick=()=>{ closeSheet(); S.mode='play'; };
  $('pRestart').onclick=()=>{ closeSheet(); G.runChapter(S.chapterId,{retry:true}); };
  $('pSound').onclick=()=>{ A.muted=!A.muted; if(A.master) A.master.gain.value=A.muted?0:0.7; closeSheet(); S.mode='play'; };
  $('pTitle').onclick=()=>{ closeSheet(); G.showTitle(); };
}
$('dossierBtn').addEventListener('click',openDossier);
$('pauseBtn').addEventListener('click',openPause);
const TIPS = {
  caught:'Agáchate cuando estés cerca de un vigilante: te ven a menos distancia y no haces ruido. Correr se oye desde lejos.',
  camera:'La cámara gira de lado a lado. Espera a que mire hacia el otro lado, o pásala por detrás de una columna.',
  alarm:'Las franjas rojas son los campos de los sensores. El térmico se ciega con la laca de Elio desde el lado de la puerta.',
  cover:'Las zonas con borde rojo son privadas. Entra solo cuando nadie mire hacia ti, y no hagas fotos delante de nadie.',
  time:'Verbeke mira el gancho del almacén en cada ronda (su ruta se ve en el suelo). Coge la llave justo después de que pase y devuélvela antes de que vuelva.',
};
G.fail = function(reason,kind){
  if (S.mode==='fail') return; const tk=G.token; G.token++; S.mode='fail'; S.locked=true; S.hold=null; S.redFlash=1; A.sfx('caught'); A.ambient(null);
  $('dlg').hidden=true; dlgState=null;
  kind = kind || (/cámara/i.test(reason)?'camera':/sensor/i.test(reason)?'alarm':/tiempo|cerradura/i.test(reason)?'time':'caught');
  setTimeout(()=>{
    sheet(`<p class="stamp red">${kind==='cover'?'Tapadera descubierta':'Detenido'}</p><h2>${kind==='cover'?'Te han calado':'Se acabó'}</h2><p class="meta">${S.chapterTitle||''}</p>
      <p>${reason}</p><p><b>Consejo:</b> ${TIPS[kind]||''}</p>${S.retryFrom?`<p><b>Al reintentar</b> vuelves a ${S.retryFrom}.</p>`:''}
      <div class="pbtns"><button class="pbtn" id="fRetry">Reintentar</button><button class="pbtn alt" id="fTitle">Menú principal</button></div>`);
    $('fRetry').onclick=()=>{ closeSheet(); G.runChapter(S.chapterId,{retry:true}); };
    $('fTitle').onclick=()=>{ closeSheet(); G.showTitle(); };
  },900);
};

/* ---------- API para los capítulos ---------- */
const guard = p => { const tk=G.token; return p.then(v=>{ if (tk!==G.token) throw ABORT; return v; }); };
const api = G.api = {
  get S(){ return S; }, get P(){ return G.P; },
  check(){ },
  loadMap(id,opts){ loadMap(id,opts); },
  async travel(id,spawn,opts={}){ S.locked=true; A.sfx(opts.sfx||'door'); await guard(fade(true)); loadMap(id,Object.assign({spawn,night:S.night,zonesArmed:S.zonesArmed},opts)); await G.sleep(0.15); await guard(fade(false)); S.locked=false; },
  spawn, remove:removeNpc, npc,
  say:(who,text,choices)=>guard(say(who,text,choices)),
  card:(a,b,c,h)=>guard(card(a,b,c,h)), illus:(k,a,b)=>guard(illus(k,a,b)),
  radio, toast,
  objective(t){ S.objective=t; if (t){ $('objBox').animate&&$('objBox').animate([{transform:'scale(1.04)'},{transform:'scale(1)'}],{duration:300}); } },
  wait:s=>{ const t0=S.time||0; return guard(new Promise(res=>waiters.push({fn:()=>(S.time||0)>=t0+s,res}))); },
  waitFor:fn=>guard(new Promise(res=>waiters.push({fn,res}))),
  moveTo(id,x,y,speed){ const e=npc(id); if(!e) return Promise.resolve(); if (typeof x==='string'){ const sp=S.map.spots[x]; speed=y; x=sp.x; y=sp.y; }
    e.path=pathTo(e,x,y); e.scripted=true; e.scriptSpeed=speed||e.speed; return guard(new Promise(r=>{ e.onArrive=r; if(!e.path.length){ e.scripted=false; r(); } })); },
  face(id,a){ const e=id==='player'?S.player:npc(id); if(e){ e.angle=a; e.base=a; } },
  faceTo(id,tid){ const e=npc(id), t=tid==='player'?S.player:npc(tid); if(e&&t){ e.angle=Math.atan2(t.y-e.y,t.x-e.x); e.base=e.angle; } },
  lock(v=true){ S.locked=v; if (v) S.hold=null; },
  fade:on=>guard(fade(on)),
  interact(it){ S.interact=S.interact.filter(o=>o.id!==it.id); S.interact.push(Object.assign({r:1.4,hold:0},it)); },
  unInteract(id){ S.interact=S.interact.filter(o=>o.id!==id); },
  trigger(t){ S.triggers.push(t); },
  label(map,x,y,text,col){ S.labels=S.labels||[]; S.labels.push({map,x,y,text,col}); },
  clearLabels(){ S.labels=[]; },
  timer(label,secs,onEnd){ S.timer={label,left:secs,onEnd}; }, clearTimer(){ S.timer=null; },
  hooks(h){ S.hooks=h; }, retryFrom(t){ S.retryFrom=t; }, sfx:A.sfx, ambient:A.ambient,
  camTo(x,y){ S.camTarget = x===null?null:{x,y}; },
  backdrop(key){ const el=$('backdrop'); if (!key){ el.hidden=true; S.backdrop=null; return; } S.backdrop=key; el.hidden=false;
    const c=$('backdropCv'); c.width=Math.round(innerWidth*dpr); c.height=Math.round(innerHeight*dpr); c.hidden=false; R.illusFallback(c,key,0);
    const im=$('backdropImg'); im.style.backgroundImage=''; const img=new Image(); img.onload=()=>{ if (S.backdrop===key){ im.style.backgroundImage=`url(${img.src})`; c.hidden=true; } }; img.src=`assets/scenes/${key}.png`; },
  setPhoto(v){ S.photoEnabled=v; }, photoCount:()=>Object.keys(S.photos).length,
  fail:(r,k)=>G.fail(r,k),
};

/* ---------- Capítulos ---------- */
G.chapters = {}; G.chapterOrder=[];
G.runChapter = async function(id,opts={}){
  G.token++; const tk=G.token;
  closeSheet(); $('title').hidden=true; $('card').hidden=true; $('illus').hidden=true; $('dlg').hidden=true; dlgState=null; $('fade').style.opacity='0';
  $('radio').hidden=true; $('toast').hidden=true; waiters.length=0; $('backdrop').hidden=true; S.backdrop=null;
  const carry = (opts.retry && S.chapterId===id) ? {alerts:S.alerts||0, time:S.time||0, attempts:(S.attempts||1)+1} : {alerts:0,time:0,attempts:1};
  const ch=G.chapters[id]; S.chapterId=id; S.chapterTitle=ch.title;
  Object.assign(S,{ mode:'play', locked:false, flags:{}, photos:{}, warnings:0, alerts:0, time:0, objective:'', timer:null, hooks:null, labels:[], photoEnabled:false, camTarget:null, alarmT:0, camLoopT:0, coins:undefined, coinsFly:[], coinsFloor:[], allowHide:true, zonesArmed:false, maxSusp:0, showJoyHint:false });
  S.player = makeEntity('vito',{x:2,y:2,angle:0}); S.player.crouch=false;
  S.alerts=carry.alerts; S.time=carry.time; S.attempts=carry.attempts; S.retryFrom='';
  G.unlock(id); G.P.last=id; G.saveProgress();
  try { await ch.run(api,opts); }
  catch(err){ if (err!==ABORT) { console.error(err); } }
};
G.showTitle = function(){
  G.token++; S.mode='title'; S.map=null; A.ambient(null);
  for (const id of ['objBox','topMid','topRight','pad','radio','toast','dlg','card','illus']) $(id).hidden=true;
  $('title').hidden=false; closeSheet();
  const has=G.P.unlocked.length>1 || G.P.last;
  $('contBtn').disabled=!has;
  const tc=$('titleCv'); tc.width=innerWidth*dpr; tc.height=innerHeight*dpr; R.illusFallback(tc,'keyart',0);
  const img=new Image(); img.onload=()=>{ $('titleBg').style.backgroundImage=`linear-gradient(90deg,rgba(5,8,15,.92) 25%,rgba(5,8,15,.2) 70%),url(${img.src})`; tc.hidden=true; }; img.src='assets/scenes/keyart.png';
};
$('newBtn').addEventListener('click',()=>{ A.init();
  if (G.P.unlocked.length>1 && !G.confirmNew){ G.confirmNew=true; $('newBtn').textContent='¿Borrar la partida guardada? Toca otra vez'; setTimeout(()=>{ G.confirmNew=false; $('newBtn').textContent='Nueva partida'; },3500); return; }
  G.confirmNew=false; $('newBtn').textContent='Nueva partida'; G.P.unlocked=['prologue']; G.P.photos={}; G.P.trust=0; G.P.keyPhoto=false; G.P.plan=null; G.saveProgress(); G.runChapter('prologue'); });
$('contBtn').addEventListener('click',()=>{ A.init(); G.runChapter(G.P.last||'prologue'); });
$('chapBtn').addEventListener('click',()=>{
  A.init();
  sheet(`<p class="stamp">Capítulos</p><h2>Diez capas</h2><div class="pbtns" style="flex-direction:column;align-items:stretch">`+
    G.chapterOrder.map(id=>{ const c=G.chapters[id], ok=G.P.unlocked.includes(id); return `<button class="pbtn ${ok?'':'alt'}" data-ch="${id}" ${ok?'':'disabled'}>${c.title}${ok?'':' · bloqueado'}</button>`; }).join('')+
    `<button class="pbtn alt" id="chClose">Volver</button></div>`);
  document.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>G.runChapter(b.dataset.ch));
  $('chClose').onclick=closeSheet;
});

/* ---------- Entrada ---------- */
I.handlers.actDown=()=>{ G.audio.init(); if (I.handlers.advanceIllus) return I.handlers.advanceIllus(); if (S.cardRes) return S.cardRes(); actDown(); };
I.handlers.actUp=actUp;
I.handlers.advance=()=>{ if (I.handlers.advanceIllus) return I.handlers.advanceIllus(); advance(); };
I.handlers.crouch=()=>{ if (S.mode==='play'&&!S.locked){ const p=S.player; p.crouch=!p.crouch; } };
I.handlers.photo=takePhoto;
I.handlers.pause=()=>{ if (!$('sheet').hidden && S.mode==='menu'){ closeSheet(); S.mode='play'; } else openPause(); };
I.bindCanvas(cv);
const ab=$('actBtn');
ab.addEventListener('pointerdown',e=>{ e.preventDefault(); G.audio.init(); try{ab.setPointerCapture(e.pointerId);}catch(_){} actDown(); });
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>ab.addEventListener(ev,actUp));
$('crouchBtn').addEventListener('pointerdown',e=>{ e.preventDefault(); I.handlers.crouch(); });
$('photoBtn').addEventListener('pointerdown',e=>{ e.preventDefault(); takePhoto(); });
$('coinBtn').addEventListener('pointerdown',e=>{ e.preventDefault(); throwCoin(); });
I.handlers.coin=throwCoin;

/* ---------- Arranque ---------- */
G.boot = function(){
  G.loadProgress(); resize(); S.player=makeEntity('vito');
  requestAnimationFrame(frame);
  G.showTitle();
};
window.__G = G;
})();
