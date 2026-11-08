/* Guion jugable del episodio 1: prólogo, capítulo 1 y capítulo 2. */
(function(){
'use strict';
const G = window.G;
const PI = Math.PI;
const catchAbort = p => p.catch(e=>{ if (e!==G.ABORT) console.error(e); });

function labelsDay(api){
  api.clearLabels();
  api.label('planta0',4.5,4.6,'SALA DE CONTROL · PRIVADO','rgba(255,150,150,.55)');
  api.label('planta0',12.5,2.4,'ARCHIVO'); api.label('planta0',19,4.4,'ASCENSORES'); api.label('planta0',26.5,6,'ESCALERA · SÓTANO');
  api.label('planta0',28,14.6,'GARAJE'); api.label('planta0',4.5,18.7,'SALIDA · HOVENIERSSTRAAT'); api.label('planta0',11,13.25,'RECEPCIÓN');
  api.label('planta4',15.5,9.35,'4.07 · SALA GEMS','rgba(242,179,61,.7)'); api.label('planta4',5.5,9.35,'PEETERS & ZONEN'); api.label('planta4',24,9.35,'OFFICE');
  api.label('sotano',4,13,'ALMACÉN · PRIVADO','rgba(255,150,150,.55)'); api.label('sotano',20.5,7.5,'ANTESALA'); api.label('sotano',3,4.4,'ESCALERA');
}

/* ===================== PRÓLOGO ===================== */
G.chapters.prologue = { title:'Prólogo · La llave no gira', async run(api){
  const S=api.S;
  api.ambient('tense');
  await api.card('Domingo, 03:12 · Sótano −2','Centro del Diamante','Amberes, Bélgica');
  api.hooks({ onMap(){ for (const p of S.map.props) if (p.type==='sensor') p.armed=false; } });
  api.loadMap('sotano',{night:true, spawn:'stairs', angle:PI/2});
  S.darkness=0.86; S.allowHide=false; S.flags.vitoTorch=true;
  api.label('sotano',20.5,7.5,'ANTESALA');
  api.spawn('speedy',{at:{x:4.4,y:3.4}, role:'friend', speed:3, flashlight:true, range:3.5, fov:0.5});
  S.player.flashlight=true;
  S.showJoyHint=true;
  api.objective('Llega a la puerta de la cámara acorazada.');
  await api.wait(0.9);
  api.radio('speedy','Por aquí. Despacio, que aquí abajo todo resuena.',4,'susurra');
  await api.waitFor(()=>S.player.x>9); S.showJoyHint=false;
  api.radio('speedy','Mira: lucecitas verdes. Elio dijo que si estaban verdes, estaba todo apagado. ¿Eso es verde? Yo lo veo verde.',5,'susurra');
  await api.waitFor(()=>S.player.x>21);
  api.interact({id:'vault', x:25.4,y:7.5, r:1.8, label:'Girar la llave', hold:2.4, stall:0.32, onStall:()=>{ S.flags.stalled=true; }, fn:()=>{}});
  api.objective('Mantén pulsado el botón para girar la llave.');
  await api.waitFor(()=>S.flags.stalled);
  api.lock(); api.sfx('lockStuck'); api.unInteract('vault'); S.redFlash=0.25;
  api.faceTo('speedy','player');
  await api.say('speedy','¿Qué pasa? ¿Por qué no gira?');
  await api.say('vito','Paciencia.');
  api.sfx('lockStuck');
  await api.wait(0.5);
  await api.say('speedy','Vito… Vito. Está atascada. ¿Por qué está atascada?');
  api.sfx('heavyStep'); await api.wait(0.7); api.sfx('heavyStep');
  S.beams=[{x:3.5,y:4.5,r:2.6,a:0.9}];
  api.camTo(5,6);
  for (let i=0;i<12;i++){ S.beams[0].y=3+i*0.18; S.beams[0].x=3.3+Math.sin(i)*0.3; await api.wait(0.08); }
  api.face('speedy',PI);
  await api.say('speedy','Vito. Se oye algo arriba.');
  api.camTo(null); await api.wait(0.5);
  await api.say('vito','(Sin girarse.) Respira, Pietro.');
  api.sfx('sting');
  await api.fade(true);
  await api.card('','18 meses antes','',1.8);
  G.unlock('ch1');
  G.runChapter('ch1');
}};

/* ===================== CAPÍTULO 1 ===================== */
G.chapters.ch1 = { title:'Capítulo 1 · El inquilino', async run(api,opts={}){
  const S=api.S, P=G.P;
  api.ambient('day');
  if (!opts.retry){
    await api.card('Capítulo 1','El inquilino','Septiembre de 2001 · Hoveniersstraat, Amberes');
    await api.illus('street','Barrio del diamante · Amberes','En Amberes pasa por estas calles el 80 % de los diamantes del mundo. Y por la noche, casi todos duermen en el mismo sitio.');
  }
  P.trust=0; P.keyPhoto=false; P.knowsVerbeke=false;
  const st={ met:false, escort:false, ritual:false, ritualDone:false, inBasement:0, phoneDone:false, left:false };
  labelsDay(api);
  const STATIC=['cam_lobby','monitores','sensor_heat','sensor_light','sensor_mag'];
  const nStatic=()=>STATIC.filter(id=>S.photos[id]).length;
  const objPhotos=()=>{ const n=nStatic(); api.objective(n>=4 ? `Ya tienes ${n} de 5 fotos. Cuando quieras, sal a la calle para reunirte con la banda.` : `Documenta la seguridad del edificio (${n}/5). Cámaras, sensores, monitores… Sin que nadie te vea.`); };

  api.hooks({
    onPhoto(id){
      if (id==='key'){ P.keyPhoto=true; catchAbort(api.say('vito','(Diez capas de seguridad… y la llave duerme en un trastero.)')); }
      if (st.phoneDone) objPhotos();
      if (id==='monitores') api.radio('speedy','¿Has entrado en la sala de control? ¿Tú estás loco? Bien. Bien hecho. Loco.',4);
    },
    onMap(id){
      if (id==='planta0'){
        api.spawn('marcel',{at:'marcel', role:'staff', angle:PI/2, range:6, fov:0.6, showName:true, idleLook:{base:PI/2, speed:0.5, th:0.55, alt:-2.2}});
        api.spawn('jansen',{at:'jansen', role:'staff', angle:-PI/2, range:6.5, fov:0.7, showName:true, idleLook:{base:-PI/2, speed:0.6, th:0.5, alt:1.0}});
        api.spawn('luc',{at:{x:3.5,y:12.5}, role:'extra', speed:1.6, wps:[[3,12,2],[14,15,1.5],[19,10,2],[8,10,1]]});
        api.interact({id:'marcel', x:10.5,y:11.6, r:2.5, label:()=>st.met?'Hablar con Marcel':'Presentarte', fn:()=>catchAbort(talkMarcel())});
        api.interact({id:'elev', x:19,y:1.2, r:1.7, label:'Subir a la 4ª planta', locked:()=>!st.met, lockedMsg:'Antes de subir, preséntate en recepción.', fn:()=>catchAbort(api.travel('planta4','elevator',{sfx:'elevator'}))});
        api.interact({id:'stairs', x:26.5,y:4.1, r:1.6, label:'Bajar al sótano', locked:()=>!st.met, lockedMsg:'Antes, preséntate en recepción.', fn:()=>catchAbort(goDown())});
        api.trigger({fn2:()=>S.player.y>18.4, once:false, fn:()=>{ if (st.left||!st.phoneDone) return; if (nStatic()>=4){ st.left=true; catchAbort(meeting()); } else api.toast('Todavía no tienes suficientes fotos. La banda necesita al menos 4.'); }});
      }
      if (id==='planta4'){
        api.spawn('luc',{at:{x:6,y:7}, role:'extra', speed:1.5, wps:[[5,7,2.5],[26,7,3],[24,10,3],[14,7,1]]});
        api.spawn('peeters',{at:'peeters', role:'extra', angle:PI/2, showName:true});
        api.interact({id:'elev4', x:2,y:6.2, r:1.6, label:'Bajar a la planta baja', fn:()=>catchAbort(api.travel('planta0','elevator',{sfx:'elevator'}))});
        api.interact({id:'peeters', x:4.5,y:10.5, r:2.2, label:'Hablar con la Sra. Peeters', fn:()=>catchAbort(talkPeeters())});
        if (!st.phoneDone){
          api.trigger({rect:[12,10,18,12], fn:()=>{ S.flags.phoneRinging=true; ring(); }});
          api.interact({id:'phone', x:15.5,y:11.4, r:1.5, label:'Coger el teléfono', cond:()=>S.flags.phoneRinging, fn:()=>catchAbort(phone())});
        }
      }
      if (id==='sotano'){
        for (const p of S.map.props) if (p.type==='sensor') p.armed=false;
        api.interact({id:'stairsUp', x:2.6,y:2.6, r:1.6, label:'Subir a la planta baja', fn:()=>catchAbort(api.travel('planta0','stairs'))});
        api.interact({id:'vaultD', x:25.2,y:7.5, r:1.5, label:'Mirar la cámara', fn:()=>api.toast('La puerta de la cámara. Abierta de 9:00 a 18:00 para los inquilinos con caja. Ahora está cerrada.')});
        S.flags.keyOnHook = st.ritualDone;
        if (st.escort){
          api.spawn('marcel',{at:'stairs', role:'staff', range:6, fov:0.6, showName:true, angle:PI/2});
          catchAbort((async()=>{ await api.moveTo('marcel',13.2,7.5,2.2); const m=api.npc('marcel'); if (m){ m.idleLook={base:0.2, speed:0.5, th:0.55, alt:PI}; } })());
        }
        if (st.ritualDone && !P.keyPhoto){ st.ritual=false; st.ritualDone=false; st.inBasement=0; S.flags.keyOnHook=true; api.toast('Al día siguiente vuelves al sótano un poco antes de las 18:00.',4); }
        if (!st.ritual){ const t0=S.time||0; api.trigger({fn2:()=>(S.time||0)-t0>8, fn:()=>catchAbort(ritual())}); }
      }
    },
  });

  async function talkMarcel(){
    api.lock(); api.faceTo('marcel','player'); const m=api.npc('marcel');
    if (!st.met){
      await api.say('marcel','Buenos días. ¿El señor…?');
      await api.say('vito','Sala. Vito Sala. Oficina 4.07.');
      await api.say('marcel','¡El italiano! Le esperaba. Aquí tiene su tarjeta de acceso. ¿Le gusta el fútbol, señor Sala?');
      const c=await api.say('vito','(Marcel espera una respuesta.)',['«Soy del Torino. Sufrir es lo mío.»','«No tengo tiempo para el fútbol.»','«¿Y usted de qué equipo es?»']);
      if (c===0){ P.trust=1; await api.say('marcel','¡Ja! Un hombre que sabe sufrir. Nos vamos a llevar bien, señor Sala.'); }
      else if (c===1){ P.trust=-1; await api.say('marcel','Ah. Bien. Cuarta planta. Ascensor al fondo.'); }
      else { P.trust=1; P.knowsVerbeke=true;
        await api.say('marcel','¡Del Antwerp! Desde niño. El club más antiguo de Bélgica, ¿sabe? Mi padre me llevaba al Bosuil cuando…');
        await api.say('narrator','(Diez minutos después.)');
        await api.say('marcel','…y por eso no confío en los porteros altos. En fin. Yo me voy a las seis. A partir de ahí esto es cosa de Verbeke, y ese no habla con nadie.'); }
      await api.say('marcel','Las cajas del sótano se visitan hasta las seis. Si necesita algo, aquí estoy.');
      st.met=true; api.objective('Sube a tu oficina: la 4.07. El ascensor está al fondo del vestíbulo.');
    } else {
      const lines = P.trust>0 ? ['¿Qué tal la oficina, señor Sala? Sin ventanas, ¿eh? Como en el Bosuil en los ochenta.','Verbeke baja a cerrar la cámara a las seis en punto. Ni un minuto más. Como un reloj suizo, pero belga.']
                              : ['Señor Sala.','Las cajas del sótano, hasta las seis.'];
      await api.say('marcel',lines[(st.mTalk=(st.mTalk||0)+1)%lines.length]);
    }
    if (m) m.angle=PI/2;
    api.lock(false);
  }
  async function talkPeeters(){
    api.lock();
    const t=(st.pTalk=(st.pTalk||0)+1);
    if (t===1){ await api.say('peeters','¿Nuevo? Bienvenido. Un consejo: lo que le cuente a Marcel lo sabrá todo el edificio antes de comer.');
      await api.say('vito','Lo tendré en cuenta.'); }
    else if (t===2){ await api.say('peeters','Dicen que la cámara de abajo tiene diez capas de seguridad. Mi marido dice que basta con una: que la gente no hable.'); }
    else await api.say('peeters','¿Otra vez por aquí? Usted no vende muchos diamantes, ¿verdad, señor Sala?');
    api.lock(false);
  }
  async function ring(){ try { while (S.flags.phoneRinging){ api.sfx('ring'); await api.wait(1.4); } } catch(e){} }
  async function phone(){
    S.flags.phoneRinging=false; api.lock(); api.sfx('click');
    await api.say('speedy','¿Ya estás dentro? ¿Cómo es? ¿Tiene ventanas? Yo no podría trabajar sin ventanas.');
    await api.say('vito','Pietro. Céntrate.');
    await api.say('speedy','Vale, vale. El Genio dice que necesita fotos. Todas las que puedas: cámaras, sensores, cerraduras. Todo.');
    await api.say('vito','Ya lo sé.');
    await api.say('speedy','Y que no te pillen haciéndolas. Elio dice que eso lo pongas en mayúsculas.');
    st.phoneDone=true; api.unInteract('phone'); api.setPhoto(true); api.lock(false);
    api.toast('Nuevo: botón FOTO (tecla F). Mira hacia algo de la seguridad y dispara. Si alguien te ve hacerlo, sospechará.',6);
    objPhotos();
  }
  async function goDown(){
    if (P.trust<1 && !st.escort){
      api.lock();
      await api.say('marcel','(Desde recepción.) ¡Señor Sala! Un momento. Al sótano, acompañado. Normas de la casa.');
      await api.say('vito','(Has empezado con mal pie con Marcel. Va a vigilarte.)');
      st.escort=true; api.lock(false);
    }
    await api.travel('sotano','stairs');
  }
  async function ritual(){
    if (st.ritual) return; st.ritual=true;
    api.toast('Son las 18:00. Pasos en la escalera: es Verbeke, que baja a cerrar la cámara. Fíjate en todo lo que hace.',5); api.sfx('heavyStep');
    S.flags.keyOnHook=false;
    api.spawn('verbeke',{at:'stairs', role:'staff', range:5.5, fov:0.6, speed:2.7, showName:true, angle:PI/2, carry:true});
    await api.moveTo('verbeke','vaultFront'); api.face('verbeke',0);
    for (let i=0;i<=10;i++){ S.flags.vaultOpen=i/10; await api.wait(0.07); }
    api.sfx('door'); await api.wait(1.5);
    for (let i=10;i>=0;i--){ S.flags.vaultOpen=i/10; await api.wait(0.06); }
    api.sfx('lockStuck');
    await api.moveTo('verbeke','keyhook'); api.face('verbeke',-PI/2);
    await api.wait(0.6); S.flags.keyOnHook=true; S.flags.photo_key=true; const v=api.npc('verbeke'); if (v) v.carry=false; api.sfx('click');
    await api.wait(6);
    S.flags.photo_key=false;
    await api.moveTo('verbeke','stairs'); api.remove('verbeke'); api.sfx('door');
    st.ritualDone=true;
    if (!P.keyPhoto) api.toast('Verbeke ha dejado algo en el almacén antes de irse. Si sales del sótano y vuelves, mañana repetirá la ronda.',5);
  }
  async function meeting(){
    api.lock(); await api.fade(true);
    G.P.photos={}; for (const [k,v] of Object.entries(S.photos)) G.P.photos[k]=v; G.saveProgress();
    await api.illus('meeting','Esa noche · un piso alquilado','Los cinco alrededor de la mesa. Las fotos de Vito, extendidas entre ceniceros y cajas de pizza.');
    await api.fade(false);
    const n=nStatic();
    await api.say('elio', n>=5 ? 'Térmico, luz, magnético… Esto es de juguete. Dadme laca, cinta y una placa de aluminio.' : 'Bien. Pero me faltan fotos, Vito. Lo que no veo, me lo invento. Y yo no me invento cosas.');
    await api.say('aldo','La llave es otra cosa. Una llave así no se copia de una foto.');
    await api.say('bruno', P.keyPhoto ? '(Bruno coge la foto del almacén y la deja en el centro de la mesa.)' : '(Bruno no dice nada. Mira a Vito.)');
    await api.say('speedy','(Con la boca llena.) ¿Y si la cogemos y ya está?');
    await api.say('vito','Si una mañana falta la llave, cambian la cerradura. Y nos quedamos sin golpe.');
    if (P.keyPhoto) await api.say('aldo','Pero si la tengo en la mano un minuto… saco un molde. Y vuelve al gancho antes de que nadie la eche de menos.');
    await api.say('elio','O me dejáis meter una cámara ahí abajo y la copiamos sin tocarla. Limpio.');
    const opts=['«Elio, mete tu cámara.» · Plan: microcámara'];
    if (P.keyPhoto) opts.push('«Aldo, prepara el molde.» · Plan: molde');
    else await api.say('vito','(Sin saber dónde guardan la llave, solo queda el plan de Elio.)');
    const c=await api.say('vito','(Todos te miran.)',opts);
    P.plan = c===1 ? 'mold' : 'cam';
    await api.say(c===1?'aldo':'elio', c===1 ? 'Un minuto. Es todo lo que necesito.' : 'Me pondré guapo para la cámara.');
    P.stats.ch1={ photos:Object.keys(S.photos).length, warnings:S.warnings, trust:P.trust, time:Math.round(S.time||0) };
    G.unlock('ch2'); G.saveProgress();
    G.runChapter('ch2');
  }

  api.loadMap('planta0',{spawn:'street', angle:-PI/2});
  S.showJoyHint=true;
  api.objective('Preséntate en recepción.');
  catchAbort((async()=>{ await api.waitFor(()=>S.player.y<16.5); S.showJoyHint=false; })());
}};

/* ===================== CAPÍTULO 2 ===================== */
G.chapters.ch2 = { title:'Capítulo 2 · La llave', async run(api,opts={}){
  const S=api.S, P=G.P, plan=P.plan||'cam';
  api.ambient('night');
  if (!opts.retry){
    await api.card('Capítulo 2','La llave','Marzo de 2002 · 02:40');
    await api.illus('corridor','Turno de noche','Arriba, Dirk vigila el vestíbulo. Abajo, Verbeke hace la ronda solo. Speedy espera en el garaje con el motor apagado.');
  }
  labelsDay(api);
  const st={ done:false, radioAlertT:0, ranTold:false, downTold:false, loopTold:false };
  S.coins=3;
  const objMain = plan==='cam' ? 'Baja al sótano. Ciega el sensor térmico con la laca de Elio y esconde la microcámara en el detector de humo de la antesala.' : 'Baja al sótano y coge la llave del almacén. Saca un molde y devuélvela al gancho antes de que Verbeke pase a mirarlo.';
  const objOut = 'Hecho. Sube por la escalera, sal por la puerta de emergencia y vuelve al coche de Speedy, en el garaje.';
  api.hooks({
    onAlert(e,kind){ const now=S.time||0; if (now-st.radioAlertT>7){ st.radioAlertT=now; api.radio('speedy',kind==='noise'?'¿Eso eran pasos? ¿Tuyos? Vito, más despacio…':'Vito. Vito. Vito.',3.5); } },
    onMap(id){
      if (id==='planta0'){
        S.map.props.push({type:'emergency',x:26,y:8,w:1,h:1,solid:true}); S.map.grid.solid[S.map.grid.i(26,8)]=1;
        if (!st.done) api.spawn('dirk',{at:{x:11.5,y:14.5}, role:'guard', speed:1.75, flashlight:true, range:5, fov:0.58, angle:PI/2, caughtLine:'Dirk te ha visto. «¡Alto! ¡No se mueva!»',
          wps:[[11,14,2.2,PI/2],[19,13,1.4],[18,9,3,-PI/2],[13,9,1.2],[6,9,2],[6,15,1.4],[13,17,1.5]]});
        else { api.spawn('dirk',{at:{x:24.5,y:15.2}, role:'guard', speed:1.6, flashlight:true, range:5, fov:0.58, angle:0, caughtLine:'Dirk te ha visto en el garaje. «¡Alto!»',
          wps:[[25,15,2,0],[31,14,2.5,PI/2],[30,11,1.5,PI],[24,10,2,PI/2]]});
          if (!st.garageTold){ st.garageTold=true; api.radio('speedy','Vito… el vigilante de arriba está dando vueltas por el garaje. Yo me agacho. Ya estoy agachado.',5); } }
        const loopOk = !!(G.P.photos && G.P.photos.monitores);
        api.interact({id:'loop', x:24.5,y:9.6, r:1.3, label:loopOk?'Meter el bucle de Elio en la cámara':'Caja de conexiones', hold:loopOk?2.5:0,
          cond:()=>!(S.camLoopT>0)&&!st.loopUsed, locked:()=>!loopOk, lockedMsg:'Caja de conexiones. Elio sabría qué cable tocar si le hubieras traído una foto de la sala de control.',
          fn:()=>{ st.loopUsed=true; S.camLoopT=25; api.radio('elio','Bucle puesto. Durante 25 segundos, la cámara del vestíbulo ve un vestíbulo vacío. De nada.',4.5); }});
        if (loopOk && !st.loopTold){ st.loopTold=true; catchAbort((async()=>{ await api.wait(7); api.radio('elio','Gracias a tu foto de la sala de control: en el pasillo de servicio hay una caja de conexiones. Puedo meter un bucle en la cámara. Una vez.',6); })()); }
        api.interact({id:'stairs', x:26.5,y:4.1, r:1.6, label:'Bajar al sótano', fn:()=>catchAbort(api.travel('sotano','stairs'))});
        api.interact({id:'emergIn', x:26,y:7.3, r:1.2, label:'Salir por la puerta de emergencia', fn:()=>{ api.sfx('door'); S.player.x=26; S.player.y=9.7; S.player.angle=PI/2; }});
        api.interact({id:'emergOut', x:26,y:9.7, r:1.1, label:'Puerta de emergencia', locked:()=>true, lockedMsg:'Solo se abre desde dentro.', fn:()=>{}});
        api.interact({id:'car', x:29.5,y:16.6, r:1.9, label:()=>st.done?'Subir al coche':'Coche de Speedy', locked:()=>!st.done, lockedMsg:'Speedy, desde dentro: «¿Ya? ¿Ya está? Ah, no. Vale. Te espero.»', fn:()=>catchAbort(ending())});
        api.spawn('speedy',{at:{x:29.6,y:15.4}, role:'extra', angle:PI/2, ghost:true, visible:false});
      }
      if (id==='sotano'){
        S.zonesArmed=true;
        if (S.flags.off_heat){ const pr=S.map.props.find(q=>q.id==='heat'); if(pr) pr.armed=false; }
        api.interact({id:'stairsUp', x:2.6,y:2.6, r:1.6, label:'Subir a la planta baja', fn:()=>catchAbort(api.travel('planta0','stairs'))});
        api.spawn('verbeke',{at:{x:10.5,y:7.3}, role:'guard', speed:1.65, flashlight:true, range:5, fov:0.58, angle:-PI/2, caughtLine:'Verbeke te ha visto. «¡Quieto ahí!»',
          wps:[[10,7,4,-PI/2],[14,7,2.5,0],[8,7,1],[4,10,2.2,PI-0.1],[2,7,1.5,PI]], watchHook:{x:2.5,y:10.15}});
        if (plan==='cam'){
          api.interact({id:'laca', x:19.4,y:3.6, r:1.3, label:'Laca al sensor térmico', hold:2.5, cond:()=>!S.flags.off_heat, fn:()=>{ S.flags.off_heat=true; const pr=S.map.props.find(q=>q.id==='heat'); if(pr) pr.armed=false; api.radio('elio','¿Ves? Laca. Cuarenta años de ingeniería alemana y una laca de supermercado.',4.5); }});
          api.interact({id:'smoke', x:21.5,y:4.7, r:1.5, label:'Colocar la microcámara', hold:3, cond:()=>!S.flags.microcam, fn:()=>{ S.flags.microcam=true; done('¡Bien! ¿Bien? Dime que bien.'); }});
        } else {
          S.flags.keyOnHook = !S.flags.hasKey;
          api.interact({id:'takeKey', x:2.5,y:10.2, r:1.3, label:'Coger la llave', hold:1, cond:()=>!S.flags.hasKey&&!S.flags.returned, fn:()=>{
            S.flags.hasKey=true; S.flags.keyOnHook=false; S.player.carry=true;
            api.objective('Saca el molde (mantén pulsado) y devuelve la llave al gancho. Verbeke mira el gancho en cada ronda.');
            api.radio('aldo','Con calma. La cera tiene que tocar todos los dientes. Cuatro segundos, ni uno menos.',4.5); }});
          api.interact({id:'mold', self:true, label:'Sacar el molde', hold:4, cond:()=>S.flags.hasKey&&!S.flags.molded, fn:()=>{ S.flags.molded=true; api.objective('Devuelve la llave al gancho del almacén. ¡Rápido!'); api.toast('Molde hecho. Ahora, la llave a su sitio.'); }});
          api.interact({id:'retKey', x:2.5,y:10.2, r:1.3, label:'Devolver la llave', hold:0.8, cond:()=>S.flags.hasKey&&S.flags.molded, fn:()=>{
            S.flags.hasKey=false; S.flags.returned=true; S.flags.keyOnHook=true; S.player.carry=false; done('¿Ya? ¿Ya está? ¡Aldo dice que te quiere!'); }});
        }
        if (!st.downTold){ st.downTold=true; api.radio('speedy','Abajo hay cobertura de pena. Si no te oigo, es que estás bien. O no. No sé.',4.5); }
      }
    },
  });
  function done(line){ st.done=true; api.objective(objOut); api.radio('speedy',line,4); api.sfx('ok'); }
  async function ending(){
    api.lock(); await api.fade(true); await api.fade(false);
    S.flags.vitoHidden=true;
    await api.say('speedy','(En el coche, comiendo.) ¿Ves? Fácil.');
    await api.say('vito','Tira eso. Me estás llenando el coche de migas.');
    await api.say('speedy','Luego lo tiro.');
    await api.say('vito','(Mira el edificio por el retrovisor. Quedan once meses.)');
    P.stats.ch2={ time:Math.round(S.time||0), alerts:S.alerts||0, plan };
    G.saveProgress();
    await api.fade(true);
    await api.card('Continuará','Capítulo 3 · La réplica','La banda construye una copia exacta de la cámara en un almacén de las afueras para ensayar el golpe.',2.6);
    G.showEnd();
  }
  api.loadMap('planta0',{night:true, spawn:'garage', angle:PI});
  S.darkness=0.8;
  api.objective(objMain);
  await api.wait(0.6);
  api.radio('speedy','Vale. Vale. Estoy aquí. Si pasa algo, toco el claxon. No, no toco el claxon. No sé qué hago.',5);
  catchAbort((async()=>{ await api.wait(6); api.toast('Corre solo si hace falta: de noche se oyen los pasos. Agáchate cerca de los vigilantes.',5); })());
}};

G.chapterOrder=['prologue','ch1','ch2'];

G.showEnd = function(){
  const P=G.P, c1=P.stats.ch1||{}, c2=P.stats.ch2||{};
  const fmt=s=>`${Math.floor((s||0)/60)}:${String((s||0)%60).padStart(2,'0')}`;
  G.token++; G.S.mode='menu';
  for (const id of ['objBox','topMid','topRight','pad','radio','toast']) G.$(id).hidden=true;
  G.$('fade').style.opacity='0';
  G.$('sheetBody').innerHTML=`<p class="stamp green">Fin del primer bloque</p><h2>Diez capas · Capítulos 0–2</h2><p class="meta">Tu partida</p>
    <div class="stats"><div><span>Fotos</span><b>${c1.photos||0}/6</b></div><div><span>Advertencias</span><b>${c1.warnings||0}</b></div><div><span>Marcel</span><b>${(P.trust||0)>0?'Amigo':'Desconfía'}</b></div>
    <div><span>Plan de la llave</span><b>${c2.plan==='mold'?'Molde':'Microcámara'}</b></div><div><span>Sospechas</span><b>${c2.alerts||0}</b></div><div><span>Tiempo cap. 2</span><b>${fmt(c2.time)}</b></div></div>
    <p>Lo que has decidido hoy cambia el golpe: cómo te mira Marcel, qué sabe la banda del sótano y cómo será la llave la noche del 15 de febrero.</p>
    <p><b>Próximamente:</b> Capítulo 3 · La réplica, Capítulo 4 · El golpe y Capítulo 5 · La basura.</p>
    <div class="pbtns"><button class="pbtn" id="eRe">Repetir capítulo 2</button><button class="pbtn alt" id="eTitle">Menú principal</button></div>`;
  G.$('sheet').hidden=false;
  G.$('eRe').onclick=()=>G.runChapter('ch2');
  G.$('eTitle').onclick=()=>G.showTitle();
};

G.boot();
})();
