/* Dibujo: suelos, muros, mobiliario, personajes, luces y arte de reserva (retratos e ilustraciones). */
(function(){
'use strict';
const G = window.G;
const R = G.R = {};
const hash = (x,y) => { let h = x*374761393 + y*668265263; h = (h^(h>>13))*1274126177; return ((h^(h>>16))>>>0)/4294967295; };

/* ---------- Materiales ---------- */
const MAT = {
  m:{a:'#9ea3ad', b:'#969ba6', vein:'rgba(70,76,92,.35)'},   // mármol del vestíbulo
  w:{a:'#8f8a80', b:'#89847a', line:'rgba(0,0,0,.10)'},          // baldosa de oficina
  c:{a:'#5e4c48', b:'#5a4844', dot:'rgba(255,255,255,.04)'},     // moqueta
  k:{a:'#7a7d83', b:'#75787e', spot:'rgba(0,0,0,.06)'},          // hormigón
  p:{a:'#5d6572', b:'#59616e', line:'rgba(255,255,255,.05)'},    // hormigón pulido (antesala)
  g:{a:'#4b4e55', b:'#484b52', line:'rgba(240,200,80,.45)'},     // garaje
};
R.floor = function(ctx,grid,x,y){
  const m=MAT[grid.mat[grid.i(x,y)]]||MAT.k, h=hash(x,y);
  ctx.fillStyle=(x+y)%2?m.a:m.b; ctx.fillRect(x,y,1.01,1.01);
  const mat=grid.mat[grid.i(x,y)];
  if (mat==='m'){ ctx.strokeStyle=m.vein; ctx.lineWidth=0.025; ctx.beginPath(); ctx.moveTo(x+h,y); ctx.quadraticCurveTo(x+0.5,y+h,x+1-h*0.5,y+1); ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.strokeRect(x+0.01,y+0.01,0.98,0.98); }
  else if (mat==='w'){ ctx.strokeStyle=m.line; ctx.lineWidth=0.02; ctx.strokeRect(x,y,1,1); }
  else if (mat==='c'){ ctx.fillStyle=m.dot; for(let i=0;i<4;i++) ctx.fillRect(x+hash(x+i,y)*0.9,y+hash(x,y+i)*0.9,0.06,0.06); }
  else if (mat==='k'){ if(h>0.7){ ctx.fillStyle=m.spot; ctx.beginPath(); ctx.arc(x+h*0.8,y+0.5,0.18*h,0,7); ctx.fill(); } }
  else if (mat==='p'){ ctx.fillStyle=m.line; ctx.fillRect(x,y,1,0.02); }
  else if (mat==='g'){ if (x%4===0){ ctx.fillStyle=m.line; ctx.fillRect(x,y+0.1,0.05,0.8); } }
};
R.wall = function(ctx,grid,x,y){
  ctx.fillStyle='#262b37'; ctx.fillRect(x,y,1.01,1.01);
  const below=grid.tile(x,y+1);
  if (y+1<grid.h && below!=='#' ){
    const gr=ctx.createLinearGradient(0,y+0.42,0,y+1); gr.addColorStop(0,'#6d7280'); gr.addColorStop(1,'#4e5361');
    ctx.fillStyle=gr; ctx.fillRect(x,y+0.42,1.01,0.59);
    ctx.fillStyle='#8a8f9c'; ctx.fillRect(x,y+0.4,1.01,0.04);
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(x,y+0.96,1.01,0.05);
  } else { ctx.fillStyle='#2e3442'; ctx.fillRect(x+0.04,y+0.04,0.92,0.92); }
};
R.glass = function(ctx,x,y,t){
  ctx.fillStyle='rgba(150,200,230,.18)'; ctx.fillRect(x,y+0.3,1.01,0.4);
  ctx.fillStyle='#596273'; ctx.fillRect(x,y+0.68,1.01,0.08); ctx.fillRect(x,y+0.26,1.01,0.05);
  ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=0.03; ctx.beginPath(); ctx.moveTo(x+0.2,y+0.35); ctx.lineTo(x+0.45,y+0.62); ctx.stroke();
};
R.doorFrame = function(ctx,grid,x,y){
  const horiz = grid.tile(x-1,y)==='#'||grid.tile(x+1,y)==='#';
  ctx.fillStyle='#3d3427';
  if (horiz){ ctx.fillRect(x,y,0.08,1); ctx.fillRect(x+0.92,y,0.08,1); }
  else { ctx.fillRect(x,y,1,0.08); ctx.fillRect(x,y+0.92,1,0.08); }
};

/* ---------- Mobiliario ---------- */
function box(ctx,x,y,w,h,top,side,lip=0.18){
  ctx.fillStyle=side; ctx.fillRect(x,y+lip,w,h-lip+0.02);
  ctx.fillStyle=top; ctx.fillRect(x,y,w,h-lip);
}
function shadow(ctx,x,y,w,h){ ctx.fillStyle='rgba(0,0,0,.22)'; ctx.fillRect(x+0.08,y+0.12,w,h); }
R.prop = function(ctx,p,t,S){
  const {x,y,w,h}=p;
  switch(p.type){
    case 'desk': shadow(ctx,x,y,w,h); box(ctx,x+0.04,y+0.08,w-0.08,h-0.12,'#7b5e3f','#5a4430');
      if (p.lamp){ ctx.fillStyle='#2b2b2b'; ctx.beginPath(); ctx.arc(x+w-0.3,y+0.3,0.12,0,7); ctx.fill(); ctx.fillStyle='#f2d58a'; ctx.beginPath(); ctx.arc(x+w-0.3,y+0.3,0.06,0,7); ctx.fill(); }
      if (p.papers){ ctx.fillStyle='#e9e4d6'; ctx.fillRect(x+0.3,y+0.2,0.35,0.25); ctx.fillStyle='#dcd5c3'; ctx.fillRect(x+0.5,y+0.28,0.3,0.22); }
      if (p.pc){ ctx.fillStyle='#202530'; ctx.fillRect(x+w/2-0.25,y+0.12,0.5,0.32); ctx.fillStyle=S.night?'#6fb3ff':'#3d6e9c'; ctx.fillRect(x+w/2-0.21,y+0.15,0.42,0.24); }
      break;
    case 'reception': shadow(ctx,x,y,w,h); box(ctx,x,y+0.05,w,h-0.05,'#4a3b2d','#2f251b',0.3);
      ctx.fillStyle='#c9a45a'; ctx.fillRect(x,y+0.68,w,0.04);
      ctx.fillStyle='#202530'; ctx.fillRect(x+0.4,y+0.12,0.5,0.3); ctx.fillStyle='#3d6e9c'; ctx.fillRect(x+0.44,y+0.15,0.42,0.22);
      ctx.fillStyle='#d8d2c0'; ctx.fillRect(x+w-1.1,y+0.15,0.5,0.3);
      break;
    case 'column': ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x+0.58,y+0.62,0.44,0.4,0,0,7); ctx.fill();
      ctx.fillStyle='#d9dbe0'; ctx.beginPath(); ctx.arc(x+0.5,y+0.5,0.42,0,7); ctx.fill();
      ctx.fillStyle='#b9bcc4'; ctx.beginPath(); ctx.arc(x+0.5,y+0.5,0.3,0,7); ctx.fill(); break;
    case 'plant': ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.arc(x+0.56,y+0.58,0.34,0,7); ctx.fill();
      ctx.fillStyle='#5b4632'; ctx.beginPath(); ctx.arc(x+0.5,y+0.5,0.26,0,7); ctx.fill();
      for (let i=0;i<7;i++){ const a=i*0.9+Math.sin(t*0.6+i)*0.05; ctx.fillStyle=i%2?'#3f7a4a':'#4f9158'; ctx.beginPath(); ctx.ellipse(x+0.5+Math.cos(a)*0.2,y+0.5+Math.sin(a)*0.2,0.2,0.08,a,0,7); ctx.fill(); }
      break;
    case 'sofa': shadow(ctx,x,y,w,h); ctx.fillStyle='#6b3a34'; ctx.fillRect(x+0.08,y+0.05,w-0.16,h-0.1); ctx.fillStyle='#57302b'; ctx.fillRect(x+0.08,y+0.05,0.25,h-0.1);
      for(let i=0;i<h;i++){ ctx.fillStyle='#7d4740'; ctx.fillRect(x+0.38,y+i+0.12,w-0.52,0.76); } break;
    case 'monitors': box(ctx,x,y,w,h,'#1b1f29','#11141b',0.3);
      for (let i=0;i<w*2;i++){ const on=Math.sin(t*2+i*1.7)>-0.6; ctx.fillStyle=on?(i%3?'#2e6f9e':'#3e8a6a'):'#163042'; ctx.fillRect(x+0.08+i*0.5,y+0.08,0.4,0.28); ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(x+0.1+i*0.5,y+0.1+((t*0.4+i*0.3)%0.24),0.36,0.02); }
      break;
    case 'shelf': box(ctx,x,y,w,h,'#5b4a38','#3c3126',0.25);
      for (let i=0;i<w*3;i++){ ctx.fillStyle=['#8a6e4b','#6d7d8c','#a8925f','#5d6e5a'][(i*7+x)%4]; ctx.fillRect(x+0.06+i*0.33,y+0.08,0.24,0.42); } break;
    case 'locker': for(let i=0;i<w;i++){ box(ctx,x+i+0.03,y,0.94,h,'#55606f','#3d4552',0.3); ctx.fillStyle='#2b313b'; ctx.fillRect(x+i+0.45,y+0.12,0.04,0.35); } break;
    case 'cabinet': box(ctx,x+0.06,y,0.88,h,'#6b5238','#4a3826',0.32); ctx.fillStyle='#3a2c1e'; ctx.fillRect(x+0.49,y+0.06,0.02,0.6);
      ctx.fillStyle='#c9a45a'; ctx.fillRect(x+0.42,y+0.35,0.05,0.08); ctx.fillRect(x+0.53,y+0.35,0.05,0.08);
      if (S.player && S.player.hidden===p){ ctx.strokeStyle=`rgba(242,179,61,${0.55+0.3*Math.sin(t*4)})`; ctx.lineWidth=0.06; ctx.strokeRect(x+0.06,y,0.88,h); }
      break;
    case 'table': shadow(ctx,x,y,w,h); box(ctx,x+0.06,y+0.08,w-0.12,h-0.12,'#8a8d93','#666a72',0.15); break;
    case 'crate': shadow(ctx,x,y,w,h); box(ctx,x+0.06,y+0.04,w-0.12,h-0.08,'#8b6a43','#6a4f31',0.22); ctx.strokeStyle='#5a4329'; ctx.lineWidth=0.04; ctx.beginPath(); ctx.moveTo(x+0.1,y+0.1); ctx.lineTo(x+w-0.1,y+h-0.3); ctx.stroke(); break;
    case 'counter': box(ctx,x,y,w,h,'#c7c1b3','#9b9586',0.25); ctx.fillStyle='#2b2b2b'; ctx.fillRect(x+w-0.8,y+0.1,0.4,0.4); break;
    case 'car': { ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(x+0.15,y+0.2,w-0.1,h-0.2);
      const col=p.color||'#3b4a66'; ctx.fillStyle=col; ctx.beginPath(); ctx.roundRect(x+0.1,y+0.1,w-0.2,h-0.25,0.3); ctx.fill();
      ctx.fillStyle='#1b2232'; ctx.beginPath(); ctx.roundRect(x+0.7,y+0.25,w-1.5,h-0.55,0.15); ctx.fill();
      ctx.fillStyle='rgba(160,200,230,.25)'; ctx.fillRect(x+0.75,y+0.3,0.25,h-0.65);
      ctx.fillStyle='#f6e7b0'; ctx.fillRect(x+w-0.18,y+0.25,0.06,0.25); ctx.fillRect(x+w-0.18,y+h-0.6,0.06,0.25); break; }
    case 'elevator': for (let i=0;i<w;i++){ ctx.fillStyle='#9aa1ad'; ctx.fillRect(x+i+0.02,y+0.42,0.96,0.58); ctx.fillStyle='#7c838f'; ctx.fillRect(x+i+0.48,y+0.42,0.04,0.58); }
      ctx.fillStyle='#262b37'; ctx.fillRect(x,y,w,0.42); ctx.fillStyle='#f2b33d'; ctx.fillRect(x+w/2-0.12,y+0.12,0.24,0.14);
      ctx.fillStyle='#1b1f29'; ctx.font='0.16px IBM Plex Mono, monospace'; break;
    case 'stairs': { ctx.fillStyle='#4d525d'; ctx.fillRect(x,y,w,h);
      const down=p.dir==='down';
      for (let i=0;i<h*4;i++){ const yy=y+i*0.25, sh=down? i/(h*4) : 1-i/(h*4); ctx.fillStyle=`rgb(${Math.round(70+70*sh)},${Math.round(75+70*sh)},${Math.round(85+70*sh)})`; ctx.fillRect(x+0.05,yy+0.02,w-0.1,0.21); }
      ctx.fillStyle='#2b2f3a'; ctx.fillRect(x,y,0.06,h); ctx.fillRect(x+w-0.06,y,0.06,h); break; }
    case 'doorClosed': ctx.fillStyle='#6b5238'; ctx.fillRect(x+0.08,y+0.42,0.84,0.58); ctx.fillStyle='#c9a45a'; ctx.fillRect(x+0.74,y+0.7,0.07,0.07);
      if (p.label){ ctx.fillStyle='#e9e4d6'; ctx.fillRect(x+0.28,y+0.48,0.44,0.14); } break;
    case 'emergency': ctx.fillStyle='#7c838f'; ctx.fillRect(x+0.08,y+0.42,0.84,0.58); ctx.fillStyle='#b8423a'; ctx.fillRect(x+0.15,y+0.68,0.7,0.06);
      ctx.fillStyle='#3ccf72'; ctx.fillRect(x+0.3,y+0.15,0.4,0.14); break;
    case 'window': ctx.fillStyle='#8fb3c9'; ctx.fillRect(x,y+0.45,w,0.5); ctx.fillStyle='rgba(255,255,255,.35)'; for(let i=0;i<w;i++) ctx.fillRect(x+i+0.2,y+0.5,0.08,0.4);
      ctx.fillStyle='#3a404d'; for(let i=0;i<=w;i++) ctx.fillRect(x+i-0.03,y+0.45,0.06,0.5); break;
    case 'phone': { const ring=S.flags&&S.flags.phoneRinging; ctx.fillStyle='#1b1b1b'; ctx.fillRect(x+0.3+(ring?Math.sin(t*40)*0.03:0),y+0.25,0.4,0.28); ctx.fillStyle='#3a3a3a'; ctx.fillRect(x+0.34,y+0.3,0.32,0.08);
      if (ring){ ctx.strokeStyle='rgba(242,179,61,.8)'; ctx.lineWidth=0.04; for(let i=1;i<3;i++){ ctx.beginPath(); ctx.arc(x+0.5,y+0.4,0.25*i+((t*2)%0.25),-2.4,-0.7); ctx.stroke(); } } break; }
    case 'safe': box(ctx,x+0.1,y+0.05,0.8,0.9,'#4a4f5a','#353942',0.3); ctx.fillStyle='#c9a45a'; ctx.beginPath(); ctx.arc(x+0.5,y+0.35,0.1,0,7); ctx.fill(); break;
    case 'keyhook': { ctx.fillStyle='#5b4a38'; ctx.fillRect(x+0.15,y+0.42,0.7,0.5);
      const has=!S.flags||S.flags.keyOnHook!==false; if (has){ ctx.strokeStyle='#f2b33d'; ctx.lineWidth=0.06; ctx.beginPath(); ctx.arc(x+0.4,y+0.6,0.09,0,7); ctx.moveTo(x+0.49,y+0.6); ctx.lineTo(x+0.78,y+0.6); ctx.moveTo(x+0.7,y+0.6); ctx.lineTo(x+0.7,y+0.7); ctx.stroke(); }
      ctx.fillStyle='#2b2b2b'; ctx.beginPath(); ctx.arc(x+0.5,y+0.48,0.04,0,7); ctx.fill(); break; }
    case 'vault': { const open=S.flags&&S.flags.vaultOpen||0;
      ctx.fillStyle='#3c4250'; ctx.fillRect(x,y,w,h);
      ctx.save(); ctx.translate(x+0.5,y+h/2);
      if (open) { ctx.translate(-0.2,-h/2+0.2); ctx.rotate(-open*1.2); ctx.translate(0.2,h/2-0.2); }
      ctx.fillStyle='#262b35'; ctx.beginPath(); ctx.arc(0,0,h/2-0.02,0,7); ctx.fill();
      ctx.fillStyle='#9aa2b2'; ctx.beginPath(); ctx.arc(-0.05,0,h/2-0.12,0,7); ctx.fill();
      ctx.fillStyle='#7c8496'; ctx.beginPath(); ctx.arc(-0.05,0,h/2-0.4,0,7); ctx.fill();
      ctx.strokeStyle='#4c5468'; ctx.lineWidth=0.09; ctx.beginPath(); for(let i=0;i<3;i++){ const a=i*2.094+(S.flags&&S.flags.wheel||0); ctx.moveTo(-0.05,0); ctx.lineTo(-0.05+Math.cos(a)*0.55,Math.sin(a)*0.55); } ctx.stroke();
      ctx.fillStyle='#4c5468'; ctx.beginPath(); ctx.arc(-0.05,0,0.16,0,7); ctx.fill();
      for (let i=0;i<10;i++){ const a=i*0.628; ctx.fillStyle='#5d6576'; ctx.beginPath(); ctx.arc(-0.05+Math.cos(a)*(h/2-0.22),Math.sin(a)*(h/2-0.22),0.05,0,7); ctx.fill(); }
      ctx.restore(); break; }
    case 'sensor': { const armed=p.armed!==undefined?p.armed:true; ctx.fillStyle='#3a404d'; ctx.fillRect(x+0.25,y+0.45,0.5,0.35);
      ctx.fillStyle= armed ? `rgba(239,75,75,${0.6+0.4*Math.sin(t*5)})` : '#5cc98a'; ctx.beginPath(); ctx.arc(x+0.5,y+0.62,0.08,0,7); ctx.fill(); break; }
    case 'magsensor': ctx.fillStyle='#d9dbe0'; ctx.fillRect(x+0.1,y+0.2,0.35,0.18); ctx.fillRect(x+0.1,y+0.42,0.35,0.18); break;
    case 'smoke': { ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x+0.55,y+0.55,0.2,0,7); ctx.fill(); ctx.fillStyle='#e8e6e0'; ctx.beginPath(); ctx.arc(x+0.5,y+0.5,0.18,0,7); ctx.fill();
      const cam=S.flags&&S.flags.microcam; ctx.fillStyle= cam ? `rgba(242,179,61,${0.5+0.5*Math.sin(t*3)})` : '#9aa'; ctx.beginPath(); ctx.arc(x+0.5,y+0.5,0.04,0,7); ctx.fill(); break; }
    case 'chair': ctx.fillStyle='#262b37'; ctx.beginPath(); ctx.arc(x+0.5,y+0.5,0.24,0,7); ctx.fill(); ctx.fillStyle='#3a404d'; ctx.beginPath(); ctx.arc(x+0.5,y+0.5,0.17,0,7); ctx.fill(); break;
    case 'rolldoor': ctx.fillStyle='#8a8f9c'; ctx.fillRect(x+0.4,y,0.6,h); ctx.fillStyle='#6d7280'; for(let i=0;i<h*5;i++) ctx.fillRect(x+0.4,y+i*0.2,0.6,0.03);
      ctx.fillStyle='#f2b33d'; ctx.fillRect(x+0.4,y,0.08,h); break;
    case 'mat': ctx.fillStyle='#3a3029'; ctx.fillRect(x+0.05,y+0.1,w-0.1,h-0.2); ctx.strokeStyle='#5a4a3c'; ctx.lineWidth=0.04; ctx.strokeRect(x+0.12,y+0.18,w-0.24,h-0.36); break;
    case 'wallcam': { const a=p.angle||0; ctx.fillStyle='#596480'; ctx.beginPath(); ctx.arc(x+0.5,y+0.5,0.16,0,7); ctx.fill();
      ctx.save(); ctx.translate(x+0.5,y+0.5); ctx.rotate(a); ctx.fillStyle='#2b3142'; ctx.fillRect(0,-0.09,0.32,0.18); ctx.fillStyle=p.off?'#333b4f':(p.alarm?'#ef4b4b':'#e05050'); ctx.fillRect(0.26,-0.04,0.06,0.08); ctx.restore(); break; }
    case 'vitrine': shadow(ctx,x,y,w,h); ctx.fillStyle='#2b2f3a'; ctx.fillRect(x+0.05,y+0.1,w-0.1,h-0.15); ctx.fillStyle='rgba(170,210,240,.28)'; ctx.fillRect(x+0.12,y+0.16,w-0.24,h-0.32);
      for (let i=0;i<w*3;i++){ const px=x+0.25+i*0.3, py=y+h/2, tw=0.5+0.5*Math.sin(t*3+i*1.7); ctx.fillStyle=`rgba(230,245,255,${0.5+0.5*tw})`; ctx.beginPath(); ctx.moveTo(px,py-0.08); ctx.lineTo(px+0.06,py); ctx.lineTo(px,py+0.08); ctx.lineTo(px-0.06,py); ctx.fill(); }
      ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(x+0.15,y+0.18,0.05,h-0.36); break;
    case 'rug': ctx.fillStyle=p.col||'#4a2f2b'; ctx.fillRect(x+0.1,y+0.1,w-0.2,h-0.2); ctx.strokeStyle='rgba(201,164,90,.55)'; ctx.lineWidth=0.05; ctx.strokeRect(x+0.25,y+0.25,w-0.5,h-0.5); break;
    case 'bench': shadow(ctx,x,y,w,h); box(ctx,x+0.05,y+0.2,w-0.1,h-0.4,'#5b4a38','#3c3126',0.12); break;
    case 'floorlogo': { const cx=x+w/2, cy=y+h/2; ctx.strokeStyle='rgba(201,164,90,.55)'; ctx.lineWidth=0.06; ctx.beginPath(); ctx.arc(cx,cy,Math.min(w,h)/2-0.2,0,7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx,cy-0.9); ctx.lineTo(cx+0.75,cy-0.2); ctx.lineTo(cx,cy+0.95); ctx.lineTo(cx-0.75,cy-0.2); ctx.closePath(); ctx.moveTo(cx-0.75,cy-0.2); ctx.lineTo(cx+0.75,cy-0.2); ctx.stroke(); break; }
    case 'fusebox': ctx.fillStyle='#4b4f5c'; ctx.fillRect(x+0.2,y+0.45,0.6,0.5); ctx.fillStyle=S.camLoopT>0?'#5cc98a':'#f2b33d'; ctx.fillRect(x+0.45,y+0.55,0.1,0.12); break;
    case 'sign': ctx.fillStyle='#202837'; ctx.fillRect(x+0.05,y+0.5,w-0.1,0.3); break;
  }
};

/* ---------- Personajes ---------- */
R.person = function(ctx,e,t){
  const st=e.style, s=(e.crouch?0.84:1)*(st.big?1.18:1)*1.15, a=e.angle;
  ctx.save(); ctx.translate(e.x,e.y);
  ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0.04,0.1,0.33*s,0.27*s,0,0,7); ctx.fill();
  ctx.rotate(a); ctx.scale(s,s);
  const sw = e.moving ? Math.sin(e.phase||0) : 0;
  // piernas
  ctx.fillStyle=st.legs||'#1d212b';
  for (const side of [-1,1]){ ctx.beginPath(); ctx.ellipse(sw*side*0.13, side*0.1, 0.11, 0.065, 0, 0, 7); ctx.fill(); }
  // brazos
  ctx.fillStyle=st.coatDark||shade(st.coat,-0.25);
  for (const side of [-1,1]){ ctx.beginPath(); ctx.ellipse(-sw*side*0.1+0.02, side*0.25, 0.1, 0.075, 0, 0, 7); ctx.fill();
    ctx.fillStyle=st.skin; ctx.beginPath(); ctx.arc(-sw*side*0.1+0.11, side*0.25, 0.045, 0, 7); ctx.fill(); ctx.fillStyle=st.coatDark||shade(st.coat,-0.25); }
  // torso
  ctx.fillStyle=st.coat; ctx.beginPath(); ctx.roundRect(-0.16,-0.24,0.3,0.48,0.12); ctx.fill();
  if (st.trim){ ctx.fillStyle=st.trim; ctx.fillRect(0.05,-0.04,0.04,0.08); }
  if (e.flashlight){ ctx.fillStyle='#2b2b2b'; ctx.fillRect(0.12,0.16,0.16,0.06); ctx.fillStyle='#ffe7a8'; ctx.fillRect(0.27,0.16,0.03,0.06); }
  if (e.carry){ ctx.fillStyle='#e9e4d6'; ctx.fillRect(0.1,-0.3,0.12,0.08); }
  // cabeza
  ctx.fillStyle=st.skin; ctx.beginPath(); ctx.arc(0.02,0,0.14,0,7); ctx.fill();
  if (st.hair==='cap'){ ctx.fillStyle=st.hairCol; ctx.beginPath(); ctx.arc(0.0,0,0.145,0,7); ctx.fill(); ctx.fillRect(0.08,-0.1,0.1,0.2); }
  else if (st.hair==='bald'){ ctx.fillStyle='rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(-0.02,-0.04,0.06,0,7); ctx.fill(); }
  else if (st.hair==='bun'){ ctx.fillStyle=st.hairCol; ctx.beginPath(); ctx.arc(-0.01,0,0.145,Math.PI*0.45,Math.PI*1.55); ctx.fill(); ctx.beginPath(); ctx.arc(-0.13,0,0.07,0,7); ctx.fill(); }
  else { ctx.fillStyle=st.hairCol; ctx.beginPath(); ctx.arc(-0.01,0,0.145,Math.PI*0.4,Math.PI*1.6); ctx.fill(); if (st.hair==='sparse'){ ctx.fillStyle=st.skin; ctx.beginPath(); ctx.arc(0.0,0,0.07,0,7); ctx.fill(); } }
  if (st.beard){ ctx.fillStyle=st.beard; ctx.beginPath(); ctx.arc(0.07,0,0.1,-1.1,1.1); ctx.fill(); }
  if (st.glasses){ ctx.fillStyle='#111'; ctx.fillRect(0.12,-0.08,0.03,0.16); }
  ctx.restore();
};
function shade(hex,amt){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=(n>>8)&255,b=n&255; const f=amt<0?0:255, p=Math.abs(amt);
  r=Math.round((f-r)*p+r); g=Math.round((f-g)*p+g); b=Math.round((f-b)*p+b); return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }
R.shade = shade;

/* ---------- Luz ---------- */
let lc=null;
R.lighting = function(ctx,S,cam,vw,vh,dpr,ts){
  if (!S.night) return;
  if (!lc) lc=document.createElement('canvas');
  const LS=0.5, LW=Math.ceil(ctx.canvas.width*LS), LH=Math.ceil(ctx.canvas.height*LS);
  if (lc.width!==LW||lc.height!==LH){ lc.width=LW; lc.height=LH; }
  const l=lc.getContext('2d'); dpr=dpr*LS;
  l.setTransform(1,0,0,1,0,0); l.globalCompositeOperation='source-over'; l.clearRect(0,0,lc.width,lc.height);
  l.fillStyle=`rgba(3,6,16,${S.darkness||0.82})`; l.fillRect(0,0,lc.width,lc.height);
  l.setTransform(dpr*ts,0,0,dpr*ts,dpr*(vw/2-cam.x*ts),dpr*(vh/2-cam.y*ts));
  l.globalCompositeOperation='destination-out';
  const glow=(x,y,r,a=1)=>{ const g=l.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,`rgba(0,0,0,${a})`); g.addColorStop(1,'rgba(0,0,0,0)'); l.fillStyle=g; l.beginPath(); l.arc(x,y,r,0,7); l.fill(); };
  for (const L of S.map.lights||[]) glow(L.x,L.y,L.r,L.a||0.9);
  if (S.player && !S.player.hidden) glow(S.player.x,S.player.y,S.playerLight||2.4,0.75);
  for (const e of S.npcs){ if (e.flashlight && e.visible!==false){ glow(e.x,e.y,1.3,0.7);
      const pts=G.cone(S.map.grid,e.x,e.y,e.angle,e.fov||0.6,e.range||5,18); const g=l.createRadialGradient(e.x,e.y,0,e.x,e.y,e.range||5); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0.25)');
      l.fillStyle=g; l.beginPath(); l.moveTo(pts[0][0],pts[0][1]); for(const q of pts) l.lineTo(q[0],q[1]); l.closePath(); l.fill(); } }
  for (const b of S.beams||[]){ glow(b.x,b.y,b.r||2.5,b.a||0.8); }
  if (S.player && S.player.flashlight && !S.player.hidden){ const e=S.player; const pts=G.cone(S.map.grid,e.x,e.y,e.angle,0.5,4.5,16); const g=l.createRadialGradient(e.x,e.y,0,e.x,e.y,4.5); g.addColorStop(0,'rgba(0,0,0,.95)'); g.addColorStop(1,'rgba(0,0,0,0.2)'); l.fillStyle=g; l.beginPath(); l.moveTo(pts[0][0],pts[0][1]); for(const q of pts) l.lineTo(q[0],q[1]); l.closePath(); l.fill(); }
  ctx.setTransform(1,0,0,1,0,0); ctx.imageSmoothingEnabled=true; ctx.drawImage(lc,0,0,ctx.canvas.width,ctx.canvas.height); dpr=dpr/LS;
  // tintes de color de las luces
  ctx.setTransform(dpr*ts,0,0,dpr*ts,dpr*(vw/2-cam.x*ts),dpr*(vh/2-cam.y*ts));
  ctx.globalCompositeOperation='lighter';
  for (const L of S.map.lights||[]) if (L.col){ const g=ctx.createRadialGradient(L.x,L.y,0,L.x,L.y,L.r); g.addColorStop(0,L.col); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(L.x,L.y,L.r,0,7); ctx.fill(); }
  ctx.globalCompositeOperation='source-over';
};

/* ---------- Retratos ---------- */
const imgCache={}, cvCache={};
R.portraitEl = function(id, size){
  const C=G.CHARS[id]||{name:'?',style:{coat:'#555',skin:'#ccc',hairCol:'#333'}};
  const wrap=document.createElement('div'); wrap.style.cssText='width:100%;height:100%';
  const c=document.createElement('canvas'); c.width=c.height=size||300; drawPortrait(c,C); wrap.appendChild(c);
  const src=`assets/portraits/${id}.png`;
  if (imgCache[src]!==false){
    const img=new Image(); img.alt=C.name;
    img.onload=()=>{ imgCache[src]=true; wrap.innerHTML=''; wrap.appendChild(img); };
    img.onerror=()=>{ imgCache[src]=false; };
    img.src=src;
  }
  return wrap;
};
function drawPortrait(c,C){
  const x=c.getContext('2d'), s=c.width, st=C.style;
  const bg=x.createLinearGradient(0,0,0,s); bg.addColorStop(0,'#22314f'); bg.addColorStop(1,'#0e1527'); x.fillStyle=bg; x.fillRect(0,0,s,s);
  x.fillStyle='rgba(242,179,61,.18)'; x.beginPath(); x.arc(s*0.78,s*0.22,s*0.35,0,7); x.fill();
  // hombros
  x.fillStyle=st.coat; x.beginPath(); x.ellipse(s*0.5,s*1.02,s*(st.big?0.5:0.4),s*0.36,0,0,7); x.fill();
  if (st.trim){ x.fillStyle=st.trim; x.fillRect(s*0.47,s*0.78,s*0.06,s*0.22); }
  // cuello y cabeza
  x.fillStyle=shade(st.skin,-0.12); x.fillRect(s*0.43,s*0.55,s*0.14,s*0.16);
  x.fillStyle=st.skin; x.beginPath(); x.ellipse(s*0.5,s*0.45,s*0.17,s*0.21,0,0,7); x.fill();
  x.fillStyle=shade(st.skin,-0.2); x.beginPath(); x.ellipse(s*0.56,s*0.47,s*0.1,s*0.18,0,-1.4,1.4); x.fill();
  if (st.hair==='cap'){ x.fillStyle=st.hairCol; x.beginPath(); x.ellipse(s*0.5,s*0.29,s*0.2,s*0.09,0,0,7); x.fill(); x.fillRect(s*0.3,s*0.28,s*0.42,s*0.05); }
  else if (st.hair==='bald'){ x.fillStyle='rgba(255,255,255,.15)'; x.beginPath(); x.ellipse(s*0.45,s*0.3,s*0.06,s*0.03,0,0,7); x.fill(); }
  else if (st.hair==='bun'){ x.fillStyle=st.hairCol; x.beginPath(); x.ellipse(s*0.5,s*0.3,s*0.19,s*0.11,0,Math.PI,0); x.fill(); x.beginPath(); x.arc(s*0.5,s*0.2,s*0.07,0,7); x.fill(); }
  else { x.fillStyle=st.hairCol; x.beginPath(); x.ellipse(s*0.5,s*0.3,s*0.19,s*(st.hair==='sparse'?0.07:0.11),0,Math.PI,0); x.fill(); }
  if (st.beard){ x.fillStyle=st.beard; x.beginPath(); x.ellipse(s*0.5,s*0.57,s*0.14,s*0.1,0,0,Math.PI); x.fill(); }
  if (st.glasses){ x.strokeStyle='#111'; x.lineWidth=s*0.012; x.strokeRect(s*0.38,s*0.42,s*0.1,s*0.06); x.strokeRect(s*0.52,s*0.42,s*0.1,s*0.06); }
  x.fillStyle='#1a1a1a'; x.fillRect(s*0.4,s*0.44,s*0.05,s*0.02); x.fillRect(s*0.55,s*0.44,s*0.05,s*0.02);
  x.fillStyle='rgba(0,0,0,.35)'; x.fillRect(0,s*0.86,s,s*0.14);
  x.fillStyle='#ece6d6'; x.font=`${s*0.075}px "IBM Plex Mono", monospace`; x.textAlign='center'; x.fillText(C.name.toUpperCase(),s*0.5,s*0.95);
}

/* ---------- Ilustraciones de reserva ---------- */
R.illusFallback = function(c,key,t){
  const x=c.getContext('2d'), w=c.width, h=c.height;
  const bg=x.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#16223a'); bg.addColorStop(1,'#05080f'); x.fillStyle=bg; x.fillRect(0,0,w,h);
  const amber='rgba(242,179,61,'; x.save();
  if (key==='street'){
    x.fillStyle='#0c1426'; for(let i=0;i<9;i++){ const bw=w*0.11, bh=h*(0.3+((i*37)%5)/10); x.fillRect(i*bw*1.05,h*0.82-bh,bw,bh); for(let r=0;r<8;r++)for(let q=0;q<3;q++){ if(((i*13+r*7+q)%5)===0){ x.fillStyle=amber+'.7)'; x.fillRect(i*bw*1.05+bw*(0.15+q*0.27),h*0.82-bh+h*0.04+r*h*0.045,bw*0.14,h*0.02); x.fillStyle='#0c1426'; } } }
    x.fillStyle='#111a2c'; x.fillRect(0,h*0.82,w,h*0.18);
    x.fillStyle='#05080f'; x.beginPath(); x.ellipse(w*0.62,h*0.7,w*0.018,h*0.05,0,0,7); x.fill(); x.fillRect(w*0.6,h*0.72,w*0.04,h*0.12);
  } else if (key==='meeting'){
    const g=x.createRadialGradient(w*0.5,h*0.45,0,w*0.5,h*0.45,w*0.45); g.addColorStop(0,amber+'.35)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(0,0,w,h);
    x.fillStyle='#3a2e22'; x.fillRect(w*0.2,h*0.62,w*0.6,h*0.08);
    x.fillStyle='#e9e4d6'; for(let i=0;i<5;i++) x.fillRect(w*(0.3+i*0.09),h*0.6,w*0.06,h*0.03);
    x.fillStyle='#070b14'; [[0.24,0.48,1],[0.38,0.42,1.1],[0.5,0.38,1.25],[0.63,0.43,1],[0.76,0.47,0.95]].forEach(([px,py,sc])=>{ x.beginPath(); x.arc(w*px,h*py,h*0.06*sc,0,7); x.fill(); x.beginPath(); x.ellipse(w*px,h*(py+0.16),h*0.11*sc,h*0.1,0,Math.PI,0); x.fill(); });
  } else if (key==='keyclose'){
    x.strokeStyle=amber+'1)'; x.lineWidth=h*0.05; x.lineCap='round'; x.beginPath(); x.arc(w*0.32,h*0.5,h*0.13,0,7); x.moveTo(w*0.32+h*0.13,h*0.5); x.lineTo(w*0.72,h*0.5); x.moveTo(w*0.66,h*0.5); x.lineTo(w*0.66,h*0.62); x.moveTo(w*0.6,h*0.5); x.lineTo(w*0.6,h*0.58); x.stroke();
    x.fillStyle='#9aa2b2'; x.fillRect(w*0.72,h*0.25,w*0.06,h*0.5);
  } else if (key==='corridor'){
    x.fillStyle='#0a1120'; x.beginPath(); x.moveTo(0,0); x.lineTo(w*0.42,h*0.4); x.lineTo(w*0.58,h*0.4); x.lineTo(w,0); x.fill(); x.beginPath(); x.moveTo(0,h); x.lineTo(w*0.42,h*0.6); x.lineTo(w*0.58,h*0.6); x.lineTo(w,h); x.fill();
    const g=x.createLinearGradient(w*0.58,h*0.5,w*0.2,h); g.addColorStop(0,amber+'.55)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.beginPath(); x.moveTo(w*0.58,h*0.55); x.lineTo(w*0.1,h); x.lineTo(w*0.5,h); x.fill();
  } else {
    const r=h*0.33; x.fillStyle='#262b35'; x.beginPath(); x.arc(w*0.62,h*0.5,r*1.08,0,7); x.fill(); x.fillStyle='#8c95a8'; x.beginPath(); x.arc(w*0.62,h*0.5,r,0,7); x.fill();
    x.strokeStyle='#4c5468'; x.lineWidth=h*0.03; x.beginPath(); for(let i=0;i<3;i++){ const a=i*2.094+(t||0)*0.2; x.moveTo(w*0.62,h*0.5); x.lineTo(w*0.62+Math.cos(a)*r*0.75,h*0.5+Math.sin(a)*r*0.75); } x.stroke();
    const g=x.createLinearGradient(w*0.15,h*0.65,w*0.6,h*0.5); g.addColorStop(0,amber+'.0)'); g.addColorStop(1,amber+'.3)'); x.fillStyle=g; x.beginPath(); x.moveTo(w*0.18,h*0.62); x.lineTo(w*0.55,h*0.3); x.lineTo(w*0.6,h*0.7); x.fill();
    x.fillStyle='#05080f'; x.beginPath(); x.arc(w*0.16,h*0.55,h*0.05,0,7); x.fill(); x.fillRect(w*0.13,h*0.6,w*0.06,h*0.3);
  }
  x.restore();
};
})();
