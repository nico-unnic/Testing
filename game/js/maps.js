/* Mapas del Centro del Diamante. Coordenadas en casillas. */
(function(){
'use strict';
const G = window.G;

function build(w,h,fn){
  const grid=new G.Grid(w,h), props=[];
  const P=(type,x,y,o={})=>{ const p=Object.assign({type,x,y,w:1,h:1,solid:true,opaque:false},o); props.push(p); return p; };
  const m=fn(grid,P)||{};
  for (const p of props){ if (!p.solid && !p.opaque) continue;
    for (let yy=p.y;yy<p.y+p.h;yy++) for (let xx=p.x;xx<p.x+p.w;xx++){ if(!grid.in(xx,yy)) continue; const i=grid.i(xx,yy);
      if (p.solid) grid.solid[i]=1; if (p.opaque) grid.opaque[i]=1; } }
  return Object.assign({w,h,grid,props,spots:{},restricted:[],zones:[],photos:[],cams:[],lights:[]},m);
}

const MAPS = G.MAPS = {};

/* ---------- Planta baja ---------- */
MAPS.planta0 = () => build(34,20,(g,P)=>{
  g.room(1,8,21,18,'m');                       // vestíbulo
  g.room(1,1,8,6,'w');                         // sala de control
  for (let x=1;x<=8;x++) g.set(x,7,'G','w');
  g.set(7,7,'D','w');
  g.room(10,1,15,6,'w'); g.set(12,7,'D','w');  // archivo
  g.room(17,1,21,6,'m'); for (const x of [18,19,20]) g.set(x,7,'D','m'); // vestíbulo de ascensores
  g.set(22,3,'D','k'); g.set(23,3,'D','k');    // paso a la escalera
  g.room(24,1,28,7,'k'); g.set(26,8,'D','k');  // escalera
  g.room(23,9,32,12,'k'); g.set(22,10,'D','m'); g.set(22,11,'D','m'); // pasillo de servicio
  g.room(24,14,32,18,'g'); g.set(28,13,'D','k'); // garaje
  g.set(4,19,'E','m'); g.set(5,19,'E','m');
  g.set(33,16,'X','g');

  P('mat',3,17,{w:4,h:2,solid:false});
  P('floorlogo',9,14,{w:4,h:3,solid:false});
  P('vitrine',1,10,{w:1,h:2}); P('vitrine',20,13,{w:1,h:2}); P('vitrine',13,18,{w:3,h:1});
  P('bench',8,18,{w:3,solid:true});
  P('reception',9,12,{w:4});
  P('column',7,10,{opaque:true}); P('column',7,15,{opaque:true}); P('column',16,10,{opaque:true}); P('column',16,15,{opaque:true});
  P('sofa',1,14,{h:3});
  P('plant',1,9); P('plant',21,9); P('plant',1,18); P('plant',21,18); P('plant',13,17);
  P('monitors',2,1,{w:5});
  P('desk',3,3,{w:3,pc:true,papers:true});
  P('locker',1,6,{w:2,opaque:true});
  P('shelf',10,1,{w:6,opaque:true});
  P('table',12,3,{w:2});
  P('cabinet',15,5,{opaque:true,hide:true}); P('cabinet',10,5,{opaque:true,hide:true});
  P('elevator',18,0,{w:2,solid:false});
  P('stairs',25,1,{w:3,h:3,dir:'down'});
  P('locker',29,9,{w:3,opaque:true}); P('cabinet',32,9,{opaque:true,hide:true});
  P('crate',23,12); P('crate',24,12); P('fusebox',24,8,{solid:false});
  P('car',24,16,{w:3,h:2,color:'#3b4a66',opaque:true}); P('car',28,16,{w:3,h:2,color:'#6b2f2f',opaque:true});
  P('rolldoor',33,15,{h:3,solid:false});
  P('wallcam',21,7,{solid:false,angle:2.3,id:'lobbycam'});
  P('sign',9,7,{w:3,solid:false});
  return {
    name:'Planta baja',
    spots:{ street:{x:4.5,y:17.6}, receptionFront:{x:10.5,y:13.6}, marcel:{x:10.5,y:11.4}, elevator:{x:19,y:1.7}, stairs:{x:26,y:4.6},
      secOut:{x:7.5,y:8.7}, jansen:{x:4.5,y:2.3}, garage:{x:31.6,y:16.5}, corridor:{x:27,y:10.5}, emergencyIn:{x:26,y:7.3}, emergencyOut:{x:26,y:9.7},
      lobbyC:{x:11,y:15}, archive:{x:12.5,y:4.5} },
    restricted:[{x0:1,y0:1,x1:8,y1:6,out:'secOut',name:'la sala de control'}],
    photos:[
      {id:'cam_lobby', x:21.5,y:7.5, lx:21.3, ly:8.1, label:'Cámara del vestíbulo', note:'Gira sin parar. Detrás de la columna del fondo hay un punto ciego.'},
      {id:'monitores', x:4.5,y:1.5, lx:4.5, ly:1.95, label:'Sala de control', note:'Seis monitores. Si la noche del golpe hay alguien aquí mirando, se acabó.'},
    ],
    cams:[{id:'lobbycam', x:21.5,y:7.65, a0:105, a1:175, range:9, half:0.36}],
    lights:[
      {x:11,y:12.3,r:3.2,col:'rgba(242,180,80,.10)'}, {x:4.5,y:2,r:3.6,col:'rgba(80,140,255,.12)'}, {x:4.5,y:18.4,r:2.4,col:'rgba(60,220,120,.10)'},
      {x:19,y:1.2,r:1.8}, {x:30,y:10.5,r:2.6,col:'rgba(242,190,90,.06)'}, {x:26,y:15,r:3}, {x:31,y:15.5,r:3}, {x:26,y:6.6,r:2.2,col:'rgba(60,220,120,.10)'},
      {x:11,y:16,r:2.2,a:0.5}, {x:15,y:9.5,r:2.5,a:0.55},
    ],
  };
});

/* ---------- Cuarta planta ---------- */
MAPS.planta4 = () => build(30,14,(g,P)=>{
  g.room(1,6,28,8,'c');
  g.room(1,10,10,12,'w'); g.set(5,9,'D','w');     // Peeters & Zonen
  g.room(12,10,18,12,'w'); g.set(15,9,'D','w');   // 4.07
  g.room(20,10,28,12,'w'); g.set(24,9,'D','w');   // office
  P('elevator',1,5,{w:2,solid:false});
  for (const [x,l] of [[5,'4.01'],[10,'4.02'],[16,'4.03'],[22,'4.04'],[26,'4.05']]) P('doorClosed',x,5,{solid:false,label:l});
  P('plant',27,6); P('plant',8,8); P('plant',20,8);
  P('desk',14,11,{w:2,pc:true}); P('phone',15,11,{solid:false}); P('window',13,13,{w:5,solid:false});
  P('plant',18,10); P('shelf',12,10,{opaque:true});
  P('desk',3,11,{w:3,pc:true,papers:true}); P('safe',1,12); P('plant',10,10); P('shelf',8,12,{w:2,opaque:true});
  P('counter',21,12,{w:6}); P('table',26,10,{w:2});
  P('window',2,13,{w:7,solid:false}); P('window',21,13,{w:6,solid:false});
  return { name:'Cuarta planta',
    spots:{ elevator:{x:2,y:6.7}, office:{x:15.5,y:10.5}, peeters:{x:4.5,y:10.4}, corrE:{x:26,y:7}, corrW:{x:6,y:7}, kitchen:{x:23,y:11} } };
});

/* ---------- Sótano −2 ---------- */
MAPS.sotano = () => build(28,16,(g,P)=>{
  g.room(1,1,5,4,'k'); g.set(3,5,'D','k');
  g.room(1,6,14,8,'k');
  g.room(1,10,6,14,'k'); g.set(4,9,'D','k');
  g.room(16,3,25,12,'p'); g.set(15,7,'D','p');
  for (const y of [6,7,8]) g.set(26,y,'.','p');
  P('stairs',1,1,{w:2,h:2,dir:'up'});
  P('vault',26,6,{h:3,opaque:true});
  P('magsensor',26,5,{solid:false});
  P('sensor',20,2,{solid:false,id:'heat'}); P('sensor',23,13,{solid:false,id:'light'});
  P('smoke',21,4,{solid:false});
  P('keyhook',2,9,{solid:false});
  P('shelf',1,14,{w:3,opaque:true}); P('locker',5,14,{w:2,opaque:true}); P('cabinet',6,10,{opaque:true,hide:true});
  P('desk',9,6,{w:2,lamp:true,papers:true});
  P('crate',6,8,{opaque:true}); P('crate',12,6,{opaque:true}); P('cabinet',8,8,{opaque:true,hide:true});
  P('cabinet',16,12,{opaque:true,hide:true}); P('cabinet',5,1,{opaque:true,hide:true}); P('cabinet',5,6,{opaque:true,hide:true});
  return { name:'Sótano −2',
    spots:{ stairs:{x:1.6,y:3.6}, corrW:{x:2.5,y:7}, storageOut:{x:4.5,y:7.3}, storageIn:{x:4.5,y:10.7}, anteDoor:{x:14.5,y:7.5}, anteIn:{x:17.2,y:7.5},
      vaultFront:{x:25,y:7.5}, keyhook:{x:2.5,y:10.4}, verbekeDesk:{x:10,y:7.3}, smoke:{x:21.5,y:5.2}, corrMid:{x:8,y:7} },
    restricted:[{x0:1,y0:10,x1:6,y1:14,out:'storageOut',name:'el almacén'}],
    zones:[{id:'heat',x0:20,y0:3,x1:20,y1:12,label:'TÉRMICO'},{id:'light',x0:23,y0:3,x1:23,y1:12,label:'LUZ'}],
    photos:[
      {id:'sensor_heat', x:20.5,y:2.7, lx:20.5, ly:3.1, label:'Sensor térmico', note:'Calor y movimiento. Elio dirá que se puede cegar.'},
      {id:'sensor_light', x:23.5,y:13.3, lx:23.5, ly:12.9, label:'Sensor de luz', note:'Si alguien enciende una linterna ahí dentro, salta.'},
      {id:'sensor_mag', x:26.5,y:5.5, lx:25.9, ly:6.0, label:'Sensor magnético', note:'Dos placas en el marco. Si se separan con la alarma puesta: alarma.'},
      {id:'key', x:2.5,y:9.6, lx:2.5, ly:10.15, label:'La llave', note:'La llave de la cámara no está en ninguna caja fuerte. Cuelga de un gancho en el almacén.', hidden:true},
    ],
    lights:[
      {x:3,y:2.2,r:2.4,col:'rgba(60,220,120,.10)'}, {x:7,y:7,r:2.8,col:'rgba(242,190,90,.07)'}, {x:10.6,y:6.5,r:2.6,col:'rgba(242,190,90,.12)'},
      {x:20.5,y:3,r:1.4,col:'rgba(239,75,75,.18)'}, {x:23.5,y:12.8,r:1.4,col:'rgba(239,75,75,.18)'}, {x:24.5,y:7.5,r:1.8,a:0.5}, {x:4,y:12,r:1.6,a:0.45},
    ],
  };
});
})();
