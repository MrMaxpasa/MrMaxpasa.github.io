/* El constructor de pirámides — apila bloques de un toque. El trozo que sobresale se corta y cae,
   así que la pirámide se estrecha sola. Encajes perfectos encadenados devuelven anchura.
   Fondo: desierto y luna de la carrera (juegos/carrera/); bloques, polvo y chispas dibujados por código. */
(function(){
'use strict';
const C={ink:'#0A0A08',gold:'#C9A227',hi:'#F5C842',ivory:'#F4EFE3',sky:'#02070d'};
const GLYPHS='𓂀𓋹𓆣𓇳𓊽𓅓𓆑𓈖𓂋𓏏𓇋𓄿𓃀𓉐𓎛𓊪𓋴𓌳𓍯𓁹𓃭𓆓';
const BH=30,BASE_W=250,PERFECT=6;
const CSS=`
.pyr-wrap{position:absolute;inset:0;overflow:hidden;background:#02070d;touch-action:none;-webkit-user-select:none;user-select:none;cursor:pointer}
.pyr-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.pyr-msg{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;display:flex;flex-direction:column;gap:14px;align-items:center;width:max-content;max-width:92%}
.pyr-msg b{font:400 clamp(28px,5vw,54px)/1 var(--f-cond);letter-spacing:.06em;color:var(--ivory);background:var(--ink);border:2px solid var(--ivory);padding:8px 18px 6px;transform:skewX(-8deg);box-shadow:7px 7px 0 var(--gold)}
.pyr-msg span{font:700 13px/1 var(--f-ui);letter-spacing:.3em;color:var(--gold-hi);animation:blink 1.3s steps(2,jump-none) infinite}
.pyr-msg i{font:600 12px/1.4 var(--f-ui);font-style:normal;letter-spacing:.08em;color:rgba(244,239,227,.75);background:rgba(10,10,8,.6);padding:5px 10px;border-left:2px solid var(--gold)}
.pyr-msg[hidden]{display:none}
.pyr-pop{position:absolute;left:50%;top:max(78px,12%);transform:translate(-50%,-10px) skewX(-8deg);opacity:0;pointer-events:none;font:400 clamp(20px,2.6vw,30px)/1 var(--f-cond);letter-spacing:.08em;color:var(--ink);background:var(--gold-hi);padding:7px 14px 5px;box-shadow:5px 5px 0 var(--ivory);transition:opacity .2s,transform .3s cubic-bezier(.2,.9,.3,1.3);white-space:nowrap}
.pyr-pop.on{opacity:1;transform:translate(-50%,0) skewX(-8deg)}
`;
const rnd=(a,b)=>a+Math.random()*(b-a);

function create(stage,api){
  const T=api.t;
  const wrap=document.createElement('div');wrap.className='pyr-wrap';
  const st=document.createElement('style');st.textContent=CSS;
  const cv=document.createElement('canvas'),cx=cv.getContext('2d');
  const msg=document.createElement('div');msg.className='pyr-msg';
  msg.innerHTML='<b>'+T('readyTitle')+'</b><span>'+T(matchMedia('(hover:none) and (pointer:coarse)').matches?'readyTouch':'readyKey')+'</span><i>'+T('tip')+'</i>';
  const pop=document.createElement('div');pop.className='pyr-pop';pop.setAttribute('aria-live','polite');
  wrap.append(st,cv,msg,pop);stage.append(wrap);
  let popT=0;function say(t){pop.textContent=t;pop.classList.remove('on');void pop.offsetWidth;pop.classList.add('on');clearTimeout(popT);popT=setTimeout(()=>pop.classList.remove('on'),900)}

  /* fondo reutilizado de la carrera */
  const far=new Image(),moon=new Image();let bgReady=0;far.onload=moon.onload=()=>bgReady++;far.src=api.base+'carrera/desierto.webp';moon.src=api.base+'carrera/luna.webp';
  const stars=Array.from({length:110},()=>({x:Math.random(),y:Math.random(),r:rnd(.6,1.7),t:Math.random()*6}));

  let W=960,H=540;
  function resize(){const dpr=Math.min(2,devicePixelRatio||1),cw=Math.max(1,wrap.clientWidth),ch=Math.max(1,wrap.clientHeight),ar=cw/ch;
    if(ar>=1){H=620;W=Math.round(620*ar)}else{W=440;H=Math.round(440/ar)}
    cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);cx.setTransform(cv.width/W,0,0,cv.width/W,0,0)}
  resize();const ro=new ResizeObserver(resize);ro.observe(wrap);

  /* ---------- estado ---------- */
  let state,blocks,mov,debris,sparks,camY,camT,streak,best,perfects,time,shake,raf=0,last=0,paused=false,coinsBonus;
  const GROUND=()=>H-70;                       /* y del suelo en coordenadas de mundo (cámara 0) */
  function reset(){state='ready';blocks=[{x:-BASE_W/2,w:BASE_W,y:0,g:0}];debris=[];sparks=[];camY=0;camT=0;streak=0;best=0;perfects=0;time=0;shake=0;coinsBonus=0;
    newMover();msg.hidden=false;hud()}
  function level(){return blocks.length-1}
  function speed(){return Math.min(560,190+level()*9)}
  function newMover(){const top=blocks[blocks.length-1],dir=blocks.length%2?1:-1,range=Math.max(170,Math.min(W*.42,330));
    mov={x:dir>0?-range-top.w/2:range-top.w/2,w:top.w,dir,range,y:(blocks.length)*BH,g:blocks.length}}
  function hud(){api.setScore(level()+' '+T('unitShort')+(streak>1?' · ×'+streak:''))}

  /* ---------- colocar ---------- */
  function drop(){
    if(state==='ready'){state='play';msg.hidden=true;api.sfx.confirm();return}
    if(state!=='play')return;
    const top=blocks[blocks.length-1],a0=Math.max(mov.x,top.x),a1=Math.min(mov.x+mov.w,top.x+top.w),ov=a1-a0;
    if(ov<=0){/* fallo: el bloque entero cae */
      debris.push({x:mov.x,w:mov.w,y:mov.y,vy:0,vx:mov.dir*120,r:0,vr:mov.dir*2.4,g:mov.g});mov=null;state='fall';shake=1;
      api.tone(140,.4,'sawtooth',.12,0,55);api.noise(.35,600,180,.25);api.duck&&api.duck();setTimeout(finish,1300);return}
    if(Math.abs(mov.x-top.x)<=PERFECT){/* encaje perfecto */
      streak++;perfects++;best=Math.max(best,streak);
      let w=top.w,x=top.x;if(streak>=3&&w<BASE_W){const g=Math.min(10,BASE_W-w);w+=g;x-=g/2}
      blocks.push({x,w,y:mov.y,g:mov.g,perfect:.6});
      for(let i=0;i<18;i++)sparks.push({x:x+Math.random()*w,y:mov.y+BH,vx:rnd(-90,90),vy:rnd(40,240),l:rnd(.4,.8)});
      const n=Math.min(streak,10);api.tone(523*Math.pow(2,n/12),.12,'triangle',.07);api.tone(1046*Math.pow(2,n/12),.18,'sine',.04,.06);
      if(streak>=3)say(T('perfect')+' ×'+streak);else say(T('perfect'));
      if(streak%5===0)coinsBonus++;
      if(api.ach&&streak>=10)api.ach('pyr-streak');
    }else{
      streak=0;const cutL=mov.x<a0,cut={x:cutL?mov.x:a1,w:mov.w-ov};
      debris.push({x:cut.x,w:cut.w,y:mov.y,vy:0,vx:(cutL?-1:1)*rnd(40,120),r:0,vr:(cutL?-1:1)*rnd(1,3),g:mov.g});
      blocks.push({x:a0,w:ov,y:mov.y,g:mov.g});
      api.tone(180,.12,'square',.07,0,90);api.noise(.12,900,300,.12)}
    for(let i=0;i<8;i++)sparks.push({x:blocks[blocks.length-1].x+Math.random()*blocks[blocks.length-1].w,y:mov.y,vx:rnd(-60,60),vy:rnd(-20,60),l:.35,dust:1});
    const L=level();
    if(api.ach){if(L>=20)api.ach('pyr-20');if(L>=50)api.ach('pyr-50')}
    if(L%10===0)say(T('floor').replace('{n}',L));
    newMover();hud()}
  function finish(){if(state==='over')return;state='over';const L=level(),ankhs=1+Math.floor(L/4)+coinsBonus;
    api.finish({score:L,unit:T('unit'),ankhs,detail:T('detail').replace('{p}',perfects).replace('{s}',best).replace('{b}',coinsBonus)})}

  /* ---------- entrada ---------- */
  const kd=e=>{if(e.repeat)return;if(e.key===' '||e.key==='Enter'||e.key==='ArrowDown'){e.preventDefault();drop()}};
  const pd=e=>{e.preventDefault();drop()};
  addEventListener('keydown',kd);wrap.addEventListener('pointerdown',pd);
  const vis=()=>{paused=document.hidden;last=performance.now()};document.addEventListener('visibilitychange',vis);

  /* ---------- bucle ---------- */
  function step(dt){time+=dt;
    if(mov&&state!=='over'&&state!=='fall'){const s=state==='ready'?150:speed();mov.x+=mov.dir*s*dt;
      if(mov.x+mov.w/2>mov.range){mov.x=mov.range-mov.w/2;mov.dir=-1}if(mov.x+mov.w/2<-mov.range){mov.x=-mov.range-mov.w/2;mov.dir=1}}
    for(const d of debris){d.vy-=1400*dt;d.y+=d.vy*dt;d.x+=d.vx*dt;d.r+=d.vr*dt}debris=debris.filter(d=>d.y>-H*2);
    for(const s of sparks){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy-=(s.dust?120:500)*dt;s.l-=dt}sparks=sparks.filter(s=>s.l>0);
    for(const b of blocks)if(b.perfect)b.perfect=Math.max(0,b.perfect-dt);
    /* cámara: la cima siempre a unos dos tercios de la altura */
    camT=Math.max(0,(blocks.length+1)*BH-(GROUND()-H*.38));camY+=(camT-camY)*Math.min(1,dt*5);
    shake=Math.max(0,shake-dt*2.5)}
  const sy=y=>GROUND()-y+camY;                  /* y del mundo (hacia arriba) a pantalla */
  function tone(g){const t=(g*37)%7;return t<2?['#C9A46A','#A9834D']:t<4?['#BE9A60','#9C7744']:t<6?['#D1AE72','#AD8850']:['#C4A064','#A27D47']}
  function drawBlock(b,alpha){const x=W/2+b.x,y=sy(b.y+BH),[top,side]=tone(b.g);cx.globalAlpha=alpha==null?1:alpha;
    const gr=cx.createLinearGradient(0,y,0,y+BH);gr.addColorStop(0,top);gr.addColorStop(1,side);cx.fillStyle=gr;cx.fillRect(x,y,b.w,BH);
    cx.fillStyle='rgba(255,240,200,.35)';cx.fillRect(x,y,b.w,2.5);cx.fillStyle='rgba(0,0,0,.28)';cx.fillRect(x,y+BH-3,b.w,3);
    cx.strokeStyle='rgba(60,40,15,.55)';cx.lineWidth=1;cx.strokeRect(x+.5,y+.5,b.w-1,BH-1);
    /* juntas de sillar */
    cx.strokeStyle='rgba(60,40,15,.35)';cx.beginPath();for(let k=1;k<b.w/46;k++){const jx=x+k*46+(b.g%2?23:0);if(jx<x+b.w-4){cx.moveTo(jx,y+3);cx.lineTo(jx,y+BH-3)}}cx.stroke();
    if(b.g%5===0&&b.g>0){cx.fillStyle='rgba(201,162,39,.85)';cx.fillRect(x,y+BH/2-6,b.w,12);cx.fillStyle='#3a2a10';cx.font='11px "Noto Sans Egyptian Hieroglyphs", serif';cx.textBaseline='middle';
      const arr=[...GLYPHS];for(let k=0,gx=x+6;gx<x+b.w-8;k++,gx+=16)cx.fillText(arr[(b.g+k)%arr.length],gx,y+BH/2+1)}
    if(b.perfect){cx.fillStyle='rgba(245,200,66,'+(b.perfect*.9).toFixed(3)+')';cx.fillRect(x-2,y-2,b.w+4,BH+4)}
    cx.globalAlpha=1}
  function draw(){
    const g=GROUND(),h=level(),dawn=Math.min(1,Math.max(0,(h-25)/35));cx.save();
    if(shake>0)cx.translate(rnd(-1,1)*shake*7,rnd(-1,1)*shake*5);
    cx.fillStyle=C.sky;cx.fillRect(-20,-20,W+40,H+40);
    /* fondo: desierto con fundido arriba, estrellas por encima y, al subir, amanecer */
    let fy=H;if(bgReady>=2){const sc=Math.max(W/far.width,1.3),fh=far.height*sc;fy=g-fh*.62+camY*.35;cx.drawImage(far,(W-far.width*sc)/2,fy,far.width*sc,fh);
      const fade=cx.createLinearGradient(0,fy-2,0,fy+fh*.35);fade.addColorStop(0,C.sky);fade.addColorStop(1,'rgba(2,7,13,0)');cx.fillStyle=fade;cx.fillRect(0,fy-2,W,fh*.35+2);fy+=fh*.4}
    for(const s of stars){const y=((s.y*H*1.6+camY*.15)%(H*1.6))-H*.3;if(y>fy)continue;cx.globalAlpha=(.3+.35*Math.sin(time*1.5+s.t))*(1-dawn*.8);cx.fillStyle=C.ivory;cx.fillRect(s.x*W,y,s.r,s.r)}cx.globalAlpha=1;
    if(bgReady>=2){const ms=1.3,mw=moon.width*ms;cx.globalAlpha=1-dawn*.6;cx.globalCompositeOperation='lighter';cx.drawImage(moon,W*.72-mw/2,30+camY*.05,mw,moon.height*ms);cx.globalCompositeOperation='source-over';cx.globalAlpha=1}
    if(dawn>0){const gr=cx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(40,40,90,'+(dawn*.35)+')');gr.addColorStop(1,'rgba(245,150,60,'+(dawn*.45)+')');cx.fillStyle=gr;cx.fillRect(0,0,W,H)}
    /* suelo de arena */
    const gy=sy(0);if(gy<H+10){const gr=cx.createLinearGradient(0,gy,0,H);gr.addColorStop(0,'#2a2014');gr.addColorStop(1,'#0e0a06');cx.fillStyle=gr;cx.fillRect(-20,gy,W+40,H-gy+30);cx.fillStyle=C.gold;cx.fillRect(-20,gy,W+40,2)}
    /* guía vertical del bloque de abajo */
    const top=blocks[blocks.length-1];
    if(mov&&state==='play'){cx.strokeStyle='rgba(245,200,66,.18)';cx.setLineDash([4,6]);cx.beginPath();cx.moveTo(W/2+top.x,sy(top.y+BH));cx.lineTo(W/2+top.x,sy(mov.y+BH)-6);cx.moveTo(W/2+top.x+top.w,sy(top.y+BH));cx.lineTo(W/2+top.x+top.w,sy(mov.y+BH)-6);cx.stroke();cx.setLineDash([])}
    for(const b of blocks){const y=sy(b.y+BH);if(y>H+40||y<-60)continue;drawBlock(b)}
    for(const d of debris){cx.save();const cxp=W/2+d.x+d.w/2,cyp=sy(d.y+BH/2);cx.translate(cxp,cyp);cx.rotate(d.r);cx.translate(-cxp,-cyp);drawBlock(d,.9);cx.restore()}
    if(mov&&state!=='fall'){drawBlock(mov);cx.shadowColor='rgba(245,200,66,.7)';cx.shadowBlur=14;cx.strokeStyle='rgba(245,200,66,.8)';cx.lineWidth=1.5;cx.strokeRect(W/2+mov.x,sy(mov.y+BH),mov.w,BH);cx.shadowBlur=0}
    for(const s of sparks){cx.globalAlpha=Math.max(0,s.l*1.6);cx.fillStyle=s.dust?'rgba(201,162,39,.7)':C.hi;cx.fillRect(W/2+s.x,sy(s.y),s.dust?3:2.5,s.dust?3:2.5)}cx.globalAlpha=1;
    cx.restore()}
  function loop(t){raf=requestAnimationFrame(loop);if(paused){last=t;return}const dt=Math.min(.033,(t-last)/1000||0);last=t;step(dt);draw()}
  reset();last=performance.now();raf=requestAnimationFrame(loop);
  return{restart(){reset()},stop(){cancelAnimationFrame(raf);ro.disconnect();clearTimeout(popT);removeEventListener('keydown',kd);document.removeEventListener('visibilitychange',vis);wrap.remove()}};
}
window.TEMPLO.register('piramide',{create,help:[
  {t:'OBJETIVO',p:'Levanta la pirámide más alta que puedas. Cada bloque se mueve de lado a lado sobre la torre: tócalo para soltarlo.'},
  {t:'EL CORTE',p:'Lo que sobresale del bloque de abajo se corta y cae, así que cada piso es un poco más estrecho. Si fallas del todo, se acaba la obra.'},
  {t:'ENCAJE PERFECTO',p:'Si lo dejas justo encima, no pierdes nada. A partir de tres perfectos seguidos, el bloque crece un poco y recuperas anchura. Cada cinco seguidos ganas un ankh extra.'},
  {t:'CONTROLES',p:'Toque, clic, Espacio, Enter o ↓ para soltar. Los bloques van más rápido cuanto más alta es la pirámide.'}],texts:{
  readyTitle:'EL CONSTRUCTOR DE PIRÁMIDES',readyKey:'PULSA ESPACIO PARA EMPEZAR',readyTouch:'TOCA PARA EMPEZAR',
  tip:'Suelta cada bloque justo encima del anterior · tres perfectos seguidos lo ensanchan',
  unit:'pisos',unitShort:'pisos',perfect:'¡PERFECTO!',floor:'¡PISO {n}!',
  detail:'{p} encajes perfectos · mejor racha ×{s} · {b} ankhs de bonus por rachas'}});
})();
