/* La carrera del chacal — runner 2D en canvas.
   Arte: juegos/carrera/ (anubis.webp atlas del personaje, obstaculos.webp, desierto.webp + luna.webp de fondo lejano, ruinas.webp de capa media).
   Fondos en parallax con mosaico en espejo; suelo, ankhs, ojo de Horus, polvo, estelas y amanecer dibujados por código.
   Dificultad justa: la separación entre obstáculos se calcula en TIEMPO (lo que dura el salto + margen de reacción),
   así que nunca hay tramos imposibles, solo cada vez más exigentes. */
(function(){
'use strict';
const ATLAS={"run1":{"x":4,"y":4,"w":144,"h":202,"ax":82,"ay":202},"run2":{"x":152,"y":4,"w":93,"h":203,"ax":45,"ay":203},"run3":{"x":249,"y":4,"w":119,"h":202,"ax":66,"ay":202},"run4":{"x":372,"y":4,"w":144,"h":200,"ax":81,"ay":200},"run5":{"x":520,"y":4,"w":119,"h":204,"ax":66,"ay":204},"run6":{"x":643,"y":4,"w":115,"h":202,"ax":65,"ay":202},"run7":{"x":762,"y":4,"w":120,"h":202,"ax":68,"ay":202},"run8":{"x":886,"y":4,"w":144,"h":202,"ax":84,"ay":202},"jump":{"x":1034,"y":4,"w":104,"h":197,"ax":48,"ay":197},"fall":{"x":1142,"y":4,"w":155,"h":229,"ax":79,"ay":229},"ready":{"x":1301,"y":4,"w":172,"h":177,"ax":72,"ay":177},"trip":{"x":1477,"y":4,"w":182,"h":146,"ax":96,"ay":146},"win":{"x":1663,"y":4,"w":102,"h":257,"ax":47,"ay":257}};
const SHEET={w:1769,h:265};
const OBS={"scarab":{"x":4,"y":4,"w":138,"h":124},"cobra":{"x":146,"y":4,"w":70,"h":168},"spikes":{"x":220,"y":4,"w":98,"h":112},"column":{"x":322,"y":4,"w":240,"h":82},"sarco":{"x":566,"y":4,"w":76,"h":205},"falcon":{"x":646,"y":4,"w":105,"h":150}};
const C={ink:'#0A0A08',bronze:'#7A5C1E',gold:'#C9A227',hi:'#F5C842',ivory:'#F4EFE3',sky:'#02070d'};
const GLYPHS='𓂀𓋹𓆣𓇳𓊽𓅓𓆑𓈖𓂋𓏏𓇋𓄿𓃀𓉐𓎛𓊪𓋴𓌳𓍯𓁹𓃭𓆓';
const SPR=.75,OSC=.625,FAR_S=1.45,RUIN_S=.47,FAR_SAND=262;
const LEAD=980;            /* los obstáculos nacen a la misma distancia del jugador en cualquier pantalla */
const BREAK_EVERY=400;     /* respiro cada 400 m */
/* obstáculos: metros a partir de los que salen y recorte de la caja de choque (izq, arriba, der, abajo) en px lógicos */
const TYPES={
  scarab:{min:0,hb:[10,12,8,0]},
  spikes:{min:0,hb:[8,16,8,0]},
  cobra:{min:150,hb:[8,8,10,0]},
  column:{min:350,hb:[8,10,8,0]},
  falcon:{min:550,hb:[16,22,12,16],fly:true},
  sarco:{min:800,hb:[6,6,6,0]}
};
/* segundos que dura el salto que pide cada cosa (para calcular el hueco siguiente) */
const AIR={scarab:.72,spikes:.72,cobra:.76,column:.8,sarco:.88,falcon:.55,double:.8,ruina:.92,eye:.6};

const CSS=`
.run-wrap{position:absolute;inset:0;overflow:hidden;background:#02070d;touch-action:none;-webkit-user-select:none;user-select:none}
.run-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.run-msg{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;display:flex;flex-direction:column;gap:14px;align-items:center;width:max-content;max-width:92%}
.run-msg b{font:400 clamp(30px,5vw,58px)/1 var(--f-cond);letter-spacing:.06em;color:var(--ivory);background:var(--ink);border:2px solid var(--ivory);padding:8px 18px 6px;transform:skewX(-8deg);box-shadow:7px 7px 0 var(--gold)}
.run-msg span{font:700 13px/1 var(--f-ui);letter-spacing:.3em;color:var(--gold-hi);animation:blink 1.3s steps(2,jump-none) infinite}
.run-msg i{font:600 12px/1.4 var(--f-ui);font-style:normal;letter-spacing:.08em;color:rgba(244,239,227,.7);background:rgba(10,10,8,.6);padding:5px 10px;border-left:2px solid var(--gold)}
.run-msg[hidden]{display:none}
.run-pop{position:absolute;left:50%;top:max(78px,11%);transform:translate(-50%,-14px) skewX(-8deg);opacity:0;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:4px;
  background:var(--ink);border:2px solid var(--gold-hi);box-shadow:6px 6px 0 rgba(201,162,39,.55);padding:8px 16px 7px;max-width:88%;transition:opacity .25s,transform .35s cubic-bezier(.2,.9,.3,1.2)}
.run-pop.on{opacity:1;transform:translate(-50%,0) skewX(-8deg)}
.run-pop b{font:400 clamp(18px,2.4vw,26px)/1 var(--f-cond);letter-spacing:.07em;color:var(--gold-hi);white-space:nowrap}
.run-pop small{font:600 12px/1.25 var(--f-ui);letter-spacing:.06em;color:var(--ivory);text-align:center}
.run-pop.new b::before{content:"NUEVO · ";color:var(--ivory)}
@media (prefers-reduced-motion:reduce){.run-pop{transition:opacity .2s}}
`;

function rnd(a,b){return a+Math.random()*(b-a)}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function create(stage,api){
  const T=api.t;
  const wrap=document.createElement('div');wrap.className='run-wrap';
  const st=document.createElement('style');st.textContent=CSS;
  const cv=document.createElement('canvas');const cx=cv.getContext('2d');
  const msg=document.createElement('div');msg.className='run-msg';
  msg.innerHTML='<b>'+T('readyTitle')+'</b><span>'+T(matchMedia('(hover:none) and (pointer:coarse)').matches?'readyTouch':'readyKey')+'</span><i>'+T('tip')+'</i>';
  const pop=document.createElement('div');pop.className='run-pop';pop.setAttribute('aria-live','polite');
  wrap.append(st,cv,msg,pop);stage.append(wrap);
  let popT=0;
  function say(title,sub,isNew){pop.className='run-pop'+(isNew?' new':'');pop.innerHTML='<b>'+title+'</b>'+(sub?'<small>'+sub+'</small>':'');
    void pop.offsetWidth;pop.classList.add('on');clearTimeout(popT);popT=setTimeout(()=>pop.classList.remove('on'),isNew?2600:1700)}

  /* ---------- recursos ---------- */
  const DIR=api.base+'carrera/';const imgs={};let pending=5,ready=false;
  const frames={},obsImg={};let ruinsC=null;
  function loaded(){if(--pending)return;
    for(const k in ATLAS)frames[k]=glowFrame(imgs.anubis,ATLAS[k]);
    for(const k in OBS)obsImg[k]=glowFrame(imgs.obs,OBS[k],'rgba(245,200,66,.45)',8);
    /* ruinas oscurecidas una sola vez para que no compitan con el primer plano */
    const r=imgs.ruins;ruinsC=document.createElement('canvas');ruinsC.width=r.width;ruinsC.height=r.height;const g=ruinsC.getContext('2d');
    g.drawImage(r,0,0);g.globalCompositeOperation='source-atop';const fog=g.createLinearGradient(0,0,0,r.height);
    fog.addColorStop(0,'rgba(6,12,22,.42)');fog.addColorStop(1,'rgba(4,8,14,.66)');g.fillStyle=fog;g.fillRect(0,0,r.width,r.height);
    ready=true}
  for(const [k,f] of [['anubis','anubis.webp'],['obs','obstaculos.webp'],['far','desierto.webp'],['moon','luna.webp'],['ruins','ruinas.webp']]){
    const im=new Image();im.onload=loaded;im.onerror=loaded;im.src=DIR+f;imgs[k]=im}
  function glowFrame(img,f,col,blur){const p=16,c=document.createElement('canvas');c.width=f.w+p*2;c.height=f.h+p*2;const g=c.getContext('2d');
    g.shadowColor=col||'rgba(245,200,66,.85)';g.shadowBlur=blur||14;g.drawImage(img,f.x,f.y,f.w,f.h,p,p,f.w,f.h);
    g.shadowBlur=0;g.drawImage(img,f.x,f.y,f.w,f.h,p,p,f.w,f.h);return{c,p,ax:f.ax||0,ay:f.ay||f.h,w:f.w,h:f.h}}
  const ankhImg=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.translate(32,32);
    g.shadowColor='rgba(245,200,66,.9)';g.shadowBlur=12;g.strokeStyle=C.hi;g.lineWidth=5;g.lineCap='round';
    for(let i=0;i<2;i++){g.beginPath();g.ellipse(0,-12,7,9,0,0,Math.PI*2);g.moveTo(0,-3);g.lineTo(0,22);g.moveTo(-12,1);g.lineTo(12,1);g.stroke()}
    g.shadowBlur=0;g.strokeStyle=C.ink;g.lineWidth=1.2;g.beginPath();g.ellipse(0,-12,4.2,6.2,0,0,Math.PI*2);g.stroke();return c})();
  /* ojo de Horus: medallón dorado con el ojo dibujado a mano (no depende de la fuente) */
  const eyeImg=(()=>{const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.translate(48,48);
    g.shadowColor='rgba(245,200,66,.95)';g.shadowBlur=16;g.fillStyle='#120f0b';g.beginPath();g.arc(0,0,30,0,Math.PI*2);g.fill();g.shadowBlur=0;
    g.strokeStyle=C.hi;g.lineWidth=3.5;g.stroke();g.strokeStyle='rgba(245,200,66,.5)';g.lineWidth=1.2;g.beginPath();g.arc(0,0,24,0,Math.PI*2);g.stroke();
    g.strokeStyle=C.hi;g.fillStyle=C.hi;g.lineWidth=2.6;g.lineCap='round';g.lineJoin='round';
    g.beginPath();g.moveTo(-17,-2);g.quadraticCurveTo(0,-15,17,-2);g.quadraticCurveTo(0,8,-17,-2);g.stroke();     /* párpados */
    g.beginPath();g.arc(1,-3,4.6,0,Math.PI*2);g.fill();                                                         /* pupila */
    g.beginPath();g.moveTo(-16,-10);g.quadraticCurveTo(0,-20,17,-9);g.stroke();                                 /* ceja */
    g.beginPath();g.moveTo(-3,4);g.lineTo(-6,15);g.stroke();                                                    /* lágrima */
    g.beginPath();g.moveTo(4,4);g.quadraticCurveTo(10,10,7,16);g.quadraticCurveTo(4,19,1,15);g.stroke();        /* espiral */
    return c})();
  const stars=Array.from({length:120},()=>({x:Math.random(),y:Math.random(),r:rnd(.6,1.7),t:Math.random()*6}));
  const streaks=Array.from({length:14},()=>({x:Math.random(),y:Math.random(),l:rnd(40,120)}));

  /* ---------- tamaño ---------- */
  let W=960,H=540,scale=1,GOFF=92,portrait=false;
  function resize(){const dpr=Math.min(2,window.devicePixelRatio||1),cw=Math.max(1,wrap.clientWidth),ch=Math.max(1,wrap.clientHeight),ar=cw/ch;
    portrait=ar<1;
    if(!portrait){H=540;W=Math.round(540*ar);GOFF=92}else{W=400;H=Math.round(400/ar);GOFF=Math.round(H*.25)}
    cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);scale=cv.width/W;cx.setTransform(scale,0,0,scale,0,0);cx.imageSmoothingQuality='high'}
  resize();const ro=new ResizeObserver(resize);ro.observe(wrap);
  const G=()=>H-GOFF;
  const meters=()=>dist/40;
  const spawnX=()=>Math.max(W+60,pl.x+LEAD);

  /* ---------- estado ---------- */
  let state='ready',dist=0,speed=460,time=0,coins=0,obs=[],items=[],dust=[],shards=[],nextSpawn=0,shake=0,deadT=0,raf=0,last=0,paused=false,flash=0,
      nextK='scarab',seen={},nextBreak=BREAK_EVERY,nextEye=320,rows={},rowId=0,bestM=0;
  const pl={x:0,y:0,vy:0,ground:true,hold:false,holdT:0,anim:0,buf:-9,lastG:0,land:0,shield:false,inv:0};
  function reset(){state='ready';dist=0;speed=460;time=0;coins=0;obs=[];items=[];dust=[];shards=[];nextSpawn=420;shake=0;deadT=0;flash=0;
    nextK=Math.random()<.5?'scarab':'spikes';seen={scarab:1,spikes:1};nextBreak=BREAK_EVERY;nextEye=320+rnd(0,160);rows={};rowId=0;
    pl.y=G();pl.vy=0;pl.ground=true;pl.hold=false;pl.anim=0;pl.buf=-9;pl.lastG=0;pl.land=0;pl.shield=false;pl.inv=0;
    msg.hidden=false;pop.classList.remove('on');hud()}
  function hud(){api.setScore(Math.floor(meters()).toLocaleString('es-ES')+' m · 𓋹 '+coins+(pl.shield?' · '+T('shieldHud'):''))}

  /* ---------- generador ---------- */
  const lw=k=>OBS[k].w*OSC,lh=k=>OBS[k].h*OSC;
  const widthOf=k=>k==='double'?lw('spikes')*2+34:k==='ruina'?lw('column')+30+lw('spikes'):k==='eye'?60:lw(k);
  /* curva de velocidad: sube rápido al principio y cada vez más despacio (tope ~950 hacia los 2.500 m) */
  const speedAt=m=>Math.min(950,460+500*(1-Math.exp(-m/850)));
  function pick(m){
    const pool=Object.keys(TYPES).filter(k=>m>=TYPES[k].min&&!(k==='falcon'&&nextK==='falcon'));
    if(m>=700)pool.push('double');
    if(m>=1500)pool.push('ruina');
    if(!pl.shield&&m>=nextEye&&nextK!=='eye')return 'eye';
    /* lo recién desbloqueado sale antes para presentarlo */
    const fresh=pool.find(k=>TYPES[k]&&!seen[k]);if(fresh)return fresh;
    return pool[Math.floor(Math.random()*pool.length)]}
  function gapAfter(cur,next,m){
    const R=Math.max(.3,.6-m/5000);                 /* margen de reacción: se encoge con la distancia, nunca baja de 0,3 s */
    const extra=rnd(0,Math.max(.28,1.1-m/2400));    /* aire aleatorio, cada vez menos */
    let t=(AIR[cur]+AIR[next])/2+R+extra;
    if(TYPES[next]&&!seen[next])t+=.7;              /* lo nuevo llega con aire de sobra */
    if(TYPES[cur]&&cur==='falcon')t+=.15;            /* el halcón va más rápido que el suelo */
    return Math.max(widthOf(cur)+60,speed*t+(widthOf(cur)-widthOf(next))/2)}
  function ankhArc(cx0){if(Math.random()>=.5)return;const hgt=rnd(160,210);
    for(let i=0;i<3;i++)items.push({x:cx0-90+i*90,y:G()-hgt+Math.abs(i-1)*22,got:false})}
  function addObs(k,x){const o={k,x,w:lw(k),h:lh(k),fy:0,ph:Math.random()*6};obs.push(o);return o}
  function spawn(){
    const m=meters(),x=spawnX();
    /* respiro: fila de ankhs a ras de suelo y unos segundos sin obstáculos */
    if(m>=nextBreak){const id=++rowId;rows[id]={n:8,got:0};
      for(let i=0;i<8;i++)items.push({x:x+i*46,y:G()-52-Math.sin(i/7*Math.PI)*34,got:false,row:id});
      say(T('breakTitle').replace('{m}',nextBreak.toLocaleString('es-ES')),T('breakSub'));
      nextBreak+=BREAK_EVERY;nextSpawn=dist+8*46+speed*1.7;return}
    const k=nextK;
    if(k==='eye'){items.push({x:x+30,y:G()-150,got:false,eye:true});nextEye=m+rnd(650,950)}
    else if(k==='double'){const a=addObs('spikes',x);addObs('spikes',x+a.w+34);ankhArc(x+a.w+17)}
    else if(k==='ruina'){const a=addObs('column',x);addObs('spikes',x+a.w+30);ankhArc(x+a.w/2+40)}
    else{const o=addObs(k,x);
      if(TYPES[k].fly){o.fy=G()-142-rnd(0,14);
        api.tone(1500,.18,'sawtooth',.03,0,900);api.tone(1900,.12,'triangle',.025,.12,1200);
        for(let i=0;i<3;i++)items.push({x:x+o.w/2-60+i*60,y:G()-44,got:false})}   /* premio por no saltar */
      else ankhArc(x+o.w/2)}
    if(TYPES[k]&&!seen[k]){seen[k]=1;say(T('n_'+k),T('h_'+k),true)}
    const n=pick(meters());nextSpawn=dist+gapAfter(k,n,m);nextK=n}
  function box(o){const hb=TYPES[o.k].hb;const top=o.fy?o.fy-o.h:G()-o.h,bot=o.fy?o.fy:G();
    return[o.x+hb[0],top+hb[1],o.x+o.w-hb[2],bot-hb[3]]}

  /* ---------- control ---------- */
  function press(){
    if(state==='ready'){state='run';msg.hidden=true;api.sfx.confirm();jump();return}
    if(state!=='run')return;
    if(pl.ground||time-pl.lastG<.09)jump();else pl.buf=time; /* salto guardado: entra al tocar suelo */
    pl.hold=true}
  function release(){pl.hold=false}
  function jump(){pl.vy=-930;pl.ground=false;pl.holdT=0;pl.hold=true;pl.buf=-9;pl.lastG=-9;
    for(let i=0;i<5;i++)dust.push({x:pl.x+rnd(-14,14),y:G(),vx:rnd(-140,-30),vy:rnd(-80,-20),l:.45});
    api.tone(420,.12,'square',.05,0,820);api.tone(820,.06,'triangle',.03,.04)}
  const kd=e=>{if(e.repeat)return;if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W'){e.preventDefault();press()}};
  const ku=e=>{if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W')release()};
  const pd=e=>{e.preventDefault();press()};const pu=()=>release();
  addEventListener('keydown',kd);addEventListener('keyup',ku);wrap.addEventListener('pointerdown',pd);addEventListener('pointerup',pu);
  const vis=()=>{paused=document.hidden;last=performance.now()};document.addEventListener('visibilitychange',vis);

  /* ---------- bucle ---------- */
  function breakShield(o){pl.shield=false;pl.inv=1;flash=.3;shake=.45;o.gone=true;
    for(let i=0;i<22;i++)shards.push({x:o.x+o.w/2+rnd(-14,14),y:(o.fy||G())-o.h/2+rnd(-14,14),vx:rnd(60,380),vy:rnd(-320,-60),r:rnd(0,6),vr:rnd(-12,12),l:rnd(.5,.9),s:rnd(3,7)});
    api.tone(880,.08,'square',.06);api.tone(440,.25,'triangle',.06,.05,220);api.noise(.18,2400,600,.12);say(T('shieldBreak'),'');api.ach&&api.ach('run-shield')}
  function step(dt){
    time+=dt;
    if(state==='run'){
      speed=speedAt(meters());dist+=speed*dt;
      if(dist>=nextSpawn)spawn();
      /* física con salto variable: mantener pulsado = salto más alto */
      let g=2700;if(pl.vy<0&&pl.hold&&pl.holdT<.22){g*=.42;pl.holdT+=dt}
      pl.vy+=g*dt;pl.y+=pl.vy*dt;
      if(pl.y>=G()){if(!pl.ground){pl.land=.12;for(let i=0;i<7;i++)dust.push({x:pl.x+rnd(-22,22),y:G(),vx:rnd(-110,50),vy:rnd(-100,-20),l:.5})}
        pl.y=G();pl.vy=0;pl.ground=true;pl.lastG=time;if(time-pl.buf<.13)jump()}
      pl.land=Math.max(0,pl.land-dt);pl.inv=Math.max(0,pl.inv-dt);
      pl.anim+=dt*(9+speed/80);
      if(pl.ground&&Math.random()<dt*16)dust.push({x:pl.x-16,y:G(),vx:rnd(-170,-60),vy:rnd(-50,-10),l:.4});
      for(const o of obs){o.x-=speed*(o.k==='falcon'?1.14:1)*dt;o.ph+=dt*9}
      for(const it of items)it.x-=speed*dt;
      obs=obs.filter(o=>o.x+o.w>-60&&!o.gone);items=items.filter(it=>it.x>-40&&!it.gone);
      /* colisiones */
      const px0=pl.x-22,px1=pl.x+24,py0=pl.y-124,py1=pl.y-6;
      if(pl.inv<=0)for(const o of obs){const b=box(o),bob=o.k==='falcon'?Math.sin(o.ph)*4:0;
        if(px1>b[0]&&px0<b[2]&&py1>b[1]+bob&&py0<b[3]+bob){if(pl.shield)breakShield(o);else die();break}}
      for(const it of items){if(it.got||Math.abs(it.x-pl.x)>(it.eye?44:38)||it.y<py0-14||it.y>py1+14)continue;
        it.got=true;it.t=0;
        if(it.eye){pl.shield=true;flash=.25;say(T('shieldTitle'),T('shieldSub'));api.tone(660,.1,'triangle',.06);api.tone(990,.12,'triangle',.05,.08);api.tone(1320,.2,'sine',.05,.16);continue}
        coins++;flash=.14;api.tone(1320,.06,'square',.05);api.tone(1980,.1,'triangle',.04,.05);
        if(it.row){const r=rows[it.row];if(r&&++r.got===r.n){coins+=2;api.ach&&api.ach('run-row');say(T('rowTitle'),'');api.tone(1568,.1,'square',.05,.08);api.tone(2093,.16,'triangle',.05,.16)}}}
      /* fila incompleta: si el primero se escapa, ya no hay bonus */
      for(const it of items)if(it.row&&!it.got&&it.x<pl.x-40&&rows[it.row])rows[it.row].n=-1;
      hud();
    }else if(state==='dead'){
      deadT+=dt;pl.x+=Math.max(0,160-deadT*260)*dt;
      if(pl.y<G()){pl.vy+=2700*dt;pl.y=Math.min(G(),pl.y+pl.vy*dt)}
      if(deadT>1.15){state='over';finish()}
    }
    for(const it of items)if(it.got){it.t+=dt;it.y-=180*dt;if(it.t>.35)it.gone=true}
    for(const d of dust){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=200*dt;d.l-=dt}dust=dust.filter(d=>d.l>0);
    for(const s of shards){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=900*dt;s.r+=s.vr*dt;s.l-=dt}shards=shards.filter(s=>s.l>0);
    shake=Math.max(0,shake-dt*3);flash=Math.max(0,flash-dt);
  }
  function die(){state='dead';deadT=0;shake=1;pl.vy=Math.max(pl.vy,0);
    for(let i=0;i<16;i++)dust.push({x:pl.x+rnd(-10,30),y:Math.min(G(),pl.y)-rnd(0,40),vx:rnd(-60,220),vy:rnd(-220,-40),l:.7});
    api.tone(150,.35,'sawtooth',.12,0,60);api.noise(.3,800,200,.25);api.duck&&api.duck()}
  function finish(){const m=Math.floor(meters()),bonus=Math.floor(m/250),f=ATLAS.win;if(coins>=60&&api.ach)api.ach('run-ankhs');
    api.finish({score:m,unit:'m',ankhs:coins+bonus,detail:T('detail').replace('{c}',coins).replace('{b}',bonus),
      portrait:{src:DIR+'anubis.webp',x:f.x,y:f.y,w:f.w,h:f.h,sheetW:SHEET.w,sheetH:SHEET.h}})}

  /* ---------- dibujo ---------- */
  /* mosaico en espejo: A, A volteada, A… así los bordes siempre casan */
  function tiled(img,off,y,s){const tw=img.width*s,th=img.height*s;let i=Math.floor(off/tw),x=i*tw-off;
    for(;x<W+1;x+=tw,i++){if(i&1){cx.save();cx.translate(x+tw,y);cx.scale(-1,1);cx.drawImage(img,0,0,tw+.5,th);cx.restore()}else cx.drawImage(img,x,y,tw+.5,th)}}
  function draw(){
    const g=G(),m=meters(),dawn=clamp((m-1200)/1800,0,1);cx.save();
    if(shake>0)cx.translate(rnd(-1,1)*shake*8,rnd(-1,1)*shake*5);
    cx.fillStyle=C.sky;cx.fillRect(-20,-20,W+40,H+40);
    const farTop=g-24-FAR_SAND*FAR_S,horizon=farTop+215*FAR_S;
    /* estrellas por encima del fondo pintado (en vertical hay mucho cielo); se apagan al amanecer */
    if(farTop>0){for(const s of stars){const y=s.y*(farTop+30);cx.globalAlpha=(.3+.35*Math.sin(time*1.5+s.t))*(1-dawn*.85);cx.fillStyle=C.ivory;cx.fillRect(s.x*W,y,s.r,s.r)}cx.globalAlpha=1}
    if(ready){
      tiled(imgs.far,dist*.035,farTop,FAR_S);
      if(farTop>-40){const fade=cx.createLinearGradient(0,farTop-2,0,farTop+60);fade.addColorStop(0,C.sky);fade.addColorStop(1,'rgba(2,7,13,0)');cx.fillStyle=fade;cx.fillRect(-20,farTop-2,W+40,62)}
      /* amanecer: cielo que se aclara hacia arriba y resplandor dorado en el horizonte */
      if(dawn>0){cx.globalCompositeOperation='screen';
        const top=cx.createLinearGradient(0,0,0,horizon);top.addColorStop(0,'rgba(30,40,90,'+(dawn*.35).toFixed(3)+')');top.addColorStop(.6,'rgba(120,60,90,'+(dawn*.28).toFixed(3)+')');top.addColorStop(1,'rgba(245,150,60,'+(dawn*.55).toFixed(3)+')');
        cx.fillStyle=top;cx.fillRect(-20,-20,W+40,horizon+20);
        const glow=cx.createRadialGradient(W*.5,horizon,10,W*.5,horizon,W*.7);glow.addColorStop(0,'rgba(255,190,90,'+(dawn*.55).toFixed(3)+')');glow.addColorStop(1,'rgba(255,190,90,0)');
        cx.fillStyle=glow;cx.fillRect(-20,horizon-W*.7,W+40,W*.7+(g-horizon));
        cx.globalCompositeOperation='source-over'}
      /* luna fija (está en el infinito) con brillo aditivo; palidece al amanecer */
      const ms=portrait?1.5:1.2,mw=imgs.moon.width*ms,mx=W*(portrait?.68:.72)-mw/2,my=portrait?Math.max(40,farTop*.45):Math.max(6,farTop+6);
      cx.globalAlpha=1-dawn*.65;cx.globalCompositeOperation='lighter';cx.drawImage(imgs.moon,mx,my,mw,imgs.moon.height*ms);cx.globalCompositeOperation='source-over';cx.globalAlpha=1;
      /* ruinas en parallax */
      tiled(ruinsC,dist*.3,g+4-ruinsC.height*RUIN_S,RUIN_S);
    }
    /* bruma a ras de suelo */
    const haze=cx.createLinearGradient(0,g-70,0,g);haze.addColorStop(0,'rgba(10,8,6,0)');haze.addColorStop(1,'rgba(10,8,6,.75)');cx.fillStyle=haze;cx.fillRect(-20,g-70,W+40,70);
    ground(dist,g);
    /* estelas de velocidad */
    const sp=Math.max(0,(speed-600)/350);
    if(sp>0&&state==='run'){cx.strokeStyle='rgba(245,200,66,'+(sp*.32).toFixed(3)+')';cx.lineWidth=1.4;cx.beginPath();
      for(const s of streaks){const x=((s.x*W-dist*1.6)%(W+200)+W+200)%(W+200)-100,y=g-20-s.y*(g*.55);cx.moveTo(x,y);cx.lineTo(x+s.l*(.5+sp),y)}cx.stroke()}
    /* ankhs y ojo de Horus */
    for(const it of items){if(it.x>W+40)continue;cx.globalAlpha=it.got?Math.max(0,1-it.t/.35):1;const b=Math.sin(time*4+it.x*.02)*4;
      if(it.eye){const s=1+Math.sin(time*6)*.06;cx.drawImage(eyeImg,it.x-34*s,it.y-34*s+b,68*s,68*s)}else cx.drawImage(ankhImg,it.x-26,it.y-26+b,52,52)}cx.globalAlpha=1;
    /* obstáculos */
    if(ready)for(const o of obs)if(o.x<W+40)drawObs(o,g);
    /* aviso en el borde para lo que aún no se ve */
    for(const o of obs){if(o.x<W-6)continue;const b=box(o),y=clamp((b[1]+b[3])/2,70,g-20),a=clamp(1-(o.x-W)/(LEAD*.9),.25,1),p=1+Math.sin(time*12)*.12;
      cx.save();cx.translate(W-24,y);cx.rotate(Math.PI/4);cx.scale(p,p);cx.globalAlpha=a;cx.fillStyle=C.ink;cx.fillRect(-11,-11,22,22);cx.strokeStyle=C.hi;cx.lineWidth=2.4;cx.strokeRect(-11,-11,22,22);cx.restore();
      cx.globalAlpha=a;cx.fillStyle=C.hi;cx.font='400 19px Anton, Impact, sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('!',W-24,y+1);cx.textAlign='start';cx.globalAlpha=1}
    /* polvo y esquirlas */
    cx.fillStyle='rgba(201,162,39,.6)';for(const d of dust){cx.globalAlpha=Math.max(0,d.l*2);cx.fillRect(d.x,d.y,3,3)}
    cx.fillStyle=C.hi;for(const s of shards){cx.globalAlpha=Math.max(0,s.l*1.4);cx.save();cx.translate(s.x,s.y);cx.rotate(s.r);cx.fillRect(-s.s/2,-s.s/4,s.s,s.s/2);cx.restore()}cx.globalAlpha=1;
    if(ready)drawPlayer();
    cx.restore();
    if(flash>0){cx.fillStyle='rgba(245,200,66,'+(flash*.35).toFixed(3)+')';cx.fillRect(0,0,W,H)}
  }
  function ground(off,g){
    const gr=cx.createLinearGradient(0,g,0,H);gr.addColorStop(0,'#1a140e');gr.addColorStop(1,'#0b0907');cx.fillStyle=gr;cx.fillRect(-20,g,W+40,H-g+20);
    cx.fillStyle=C.gold;cx.fillRect(-20,g,W+40,3);cx.fillStyle='rgba(245,200,66,.25)';cx.fillRect(-20,g+3,W+40,2);
    const tw=96,o=off%tw;cx.strokeStyle='rgba(201,162,39,.2)';cx.lineWidth=1.2;cx.beginPath();
    for(let x=-o-tw;x<W+tw;x+=tw){cx.moveTo(x,g+5);cx.lineTo(x,g+40);cx.moveTo(x+tw/2,g+40);cx.lineTo(x+tw/2,g+92)}
    cx.moveTo(-20,g+40);cx.lineTo(W+20,g+40);cx.moveTo(-20,g+92);cx.lineTo(W+20,g+92);cx.stroke();
    cx.font='20px "Noto Sans Egyptian Hieroglyphs", serif';cx.textBaseline='middle';
    const arr=[...GLYPHS],gw=48,go=off%(gw*arr.length);
    cx.fillStyle='rgba(201,162,39,.36)';for(let i=0,x=-go;x<W+gw;i++,x+=gw)cx.fillText(arr[i%arr.length],x,g+66);
    /* en vertical el suelo es más alto: segunda franja de relieves */
    if(H-g>150){const go2=(off*.9)%(gw*arr.length);cx.fillStyle='rgba(201,162,39,.18)';
      for(let i=0,x=-go2;x<W+gw;i++,x+=gw)cx.fillText(arr[(i*7+3)%arr.length],x,g+122);
      cx.strokeStyle='rgba(201,162,39,.14)';cx.beginPath();cx.moveTo(-20,g+150);cx.lineTo(W+20,g+150);cx.stroke()}}
  function drawObs(o,g){const f=obsImg[o.k];const s=OSC,dw=(f.w+f.p*2)*s,dh=(f.h+f.p*2)*s;
    if(o.k==='falcon'){const bob=Math.sin(o.ph)*4,sq=1+Math.sin(o.ph*1.6)*.06;
      cx.fillStyle='rgba(0,0,0,.3)';cx.beginPath();cx.ellipse(o.x+o.w/2,g+2,o.w*.35,4,0,0,Math.PI*2);cx.fill();
      cx.save();cx.translate(o.x+o.w/2,o.fy-o.h/2+bob);cx.scale(-1,sq);cx.drawImage(f.c,-dw/2,-dh/2,dw,dh);cx.restore();return}
    cx.fillStyle='rgba(0,0,0,.45)';cx.beginPath();cx.ellipse(o.x+o.w/2,g+2,o.w*.5,5,0,0,Math.PI*2);cx.fill();
    const y=g-o.h-f.p*s+(o.k==='column'?3:2);
    /* escarabajo y cobra miran hacia el chacal que llega */
    if(o.k==='scarab'||o.k==='cobra'){cx.save();cx.translate(o.x+o.w,0);cx.scale(-1,1);cx.drawImage(f.c,-f.p*s,y,dw,dh);cx.restore()}
    else cx.drawImage(f.c,o.x-f.p*s,y,dw,dh)}
  function drawPlayer(){
    let k;if(state==='dead'||state==='over')k='trip';else if(state==='ready')k='ready';else if(!pl.ground)k=pl.vy<-120?'jump':'fall';
    else k='run'+(1+Math.floor(pl.anim)%8);
    const f=frames[k];const sq=pl.land>0?1-pl.land*.6:1;
    const dw=(f.w+f.p*2)*SPR,dh=(f.h+f.p*2)*SPR*sq;const dx=pl.x-(f.ax+f.p)*SPR,dy=pl.y-(f.ay+f.p)*SPR*sq+(k==='trip'?8:0);
    cx.fillStyle='rgba(0,0,0,.5)';cx.beginPath();cx.ellipse(pl.x,G()+2,34*(1-Math.min(.6,(G()-pl.y)/300)),5,0,0,Math.PI*2);cx.fill();
    /* escudo: aura dorada que gira; tras romperse, parpadeo de invulnerabilidad */
    if(pl.shield){const cyy=pl.y-68,r=78+Math.sin(time*5)*3;cx.save();cx.globalCompositeOperation='lighter';
      const a=cx.createRadialGradient(pl.x,cyy,r*.55,pl.x,cyy,r);a.addColorStop(0,'rgba(245,200,66,0)');a.addColorStop(.8,'rgba(245,200,66,.16)');a.addColorStop(1,'rgba(245,200,66,0)');
      cx.fillStyle=a;cx.beginPath();cx.arc(pl.x,cyy,r,0,Math.PI*2);cx.fill();
      cx.strokeStyle='rgba(245,200,66,.55)';cx.lineWidth=2;cx.setLineDash([10,8]);cx.lineDashOffset=-time*40;cx.beginPath();cx.arc(pl.x,cyy,r*.86,0,Math.PI*2);cx.stroke();cx.restore()}
    if(pl.inv>0&&Math.floor(time*16)%2)cx.globalAlpha=.35;
    cx.drawImage(f.c,dx,dy,dw,dh);cx.globalAlpha=1}

  function loop(t){raf=requestAnimationFrame(loop);if(paused){last=t;return}
    const dt=Math.min(.033,(t-last)/1000||0);last=t;pl.x=Math.round(W*(portrait?.15:.17));step(dt);draw()}
  reset();last=performance.now();raf=requestAnimationFrame(loop);

  return{
    restart(){reset()},
    stop(){cancelAnimationFrame(raf);ro.disconnect();clearTimeout(popT);removeEventListener('keydown',kd);removeEventListener('keyup',ku);removeEventListener('pointerup',pu);
      document.removeEventListener('visibilitychange',vis);wrap.remove()}
  };
}

window.TEMPLO.register('carrera',{create,texts:{
  readyTitle:'LA CARRERA DEL CHACAL',readyKey:'PULSA ESPACIO PARA EMPEZAR',readyTouch:'TOCA PARA EMPEZAR',
  tip:'Mantén pulsado para saltar más alto · El «!» del borde avisa de lo que viene',
  breakTitle:'{m} M · RESPIRA',breakSub:'Coge la fila entera: +2 ankhs',rowTitle:'¡FILA COMPLETA! +2',
  shieldTitle:'OJO DE HORUS',shieldHud:'ESCUDO',shieldSub:'Aguanta un golpe',shieldBreak:'¡EL OJO TE HA SALVADO!',
  n_cobra:'COBRA',h_cobra:'Es más alta: salta con tiempo',
  n_column:'COLUMNA CAÍDA',h_column:'Es larga: salta un poco antes',
  n_falcon:'HALCÓN DE HORUS',h_falcon:'Vuela a ras de cabeza: ¡no saltes!',
  n_sarco:'SARCÓFAGO',h_sarco:'Mantén pulsado para saltar más alto',
  detail:'{c} ankhs recogidos · {b} de bonus por distancia'}});
})();
