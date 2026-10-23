/* La carrera del chacal — runner 2D en canvas.
   Personaje: atlas del Anubis (juegos/anubis-atlas.webp). Obstáculos, fondos y ankhs dibujados por código. */
(function(){
'use strict';
const ATLAS={"run1":{"x":4,"y":4,"w":218,"h":299,"ax":131,"ay":299},"run2":{"x":226,"y":4,"w":208,"h":302,"ax":124,"ay":302},"run3":{"x":438,"y":4,"w":231,"h":301,"ax":128,"ay":301},"run4":{"x":673,"y":4,"w":211,"h":291,"ax":126,"ay":291},"run5":{"x":888,"y":4,"w":236,"h":301,"ax":141,"ay":301},"run6":{"x":1128,"y":4,"w":223,"h":300,"ax":125,"ay":300},"jump":{"x":1355,"y":4,"w":212,"h":272,"ax":115,"ay":272},"fall":{"x":1571,"y":4,"w":240,"h":348,"ax":121,"ay":348},"trip":{"x":1815,"y":4,"w":321,"h":186,"ax":207,"ay":186},"win":{"x":2140,"y":4,"w":223,"h":427,"ax":110,"ay":427}};
const C={ink:'#0A0A08',coal:'#1C1814',bronze:'#7A5C1E',gold:'#C9A227',hi:'#F5C842',ivory:'#F4EFE3',lapis:'#2456B8'};
const GLYPHS='𓂀𓋹𓆣𓇳𓊽𓅓𓆑𓈖𓂋𓏏𓇋𓄿𓃀𓉐𓎛𓊪𓋴𓌳𓍯𓁹𓃭𓆓';
const SPR=0.5, GROUND_OFF=92;

const CSS=`
.run-wrap{position:absolute;inset:0;overflow:hidden;background:#0A0A08;touch-action:none;-webkit-user-select:none;user-select:none}
.run-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.run-msg{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;display:flex;flex-direction:column;gap:12px;align-items:center}
.run-msg b{font:400 clamp(30px,5vw,58px)/1 var(--f-cond);letter-spacing:.06em;color:var(--ivory);background:var(--ink);border:2px solid var(--ivory);padding:8px 18px 6px;transform:skewX(-8deg);box-shadow:7px 7px 0 var(--gold)}
.run-msg span{font:700 13px/1 var(--f-ui);letter-spacing:.3em;color:var(--gold-hi);animation:blink 1.3s steps(2,jump-none) infinite}
.run-msg[hidden]{display:none}
`;

function rnd(a,b){return a+Math.random()*(b-a)}

function create(stage,api){
  const wrap=document.createElement('div');wrap.className='run-wrap';
  const st=document.createElement('style');st.textContent=CSS;
  const cv=document.createElement('canvas');const cx=cv.getContext('2d');
  const msg=document.createElement('div');msg.className='run-msg';
  msg.innerHTML='<b>'+api.t('readyTitle')+'</b><span>'+api.t(matchMedia('(hover:none) and (pointer:coarse)').matches?'readyTouch':'readyKey')+'</span>';
  wrap.append(st,cv,msg);stage.append(wrap);

  /* ---------- recursos ---------- */
  const img=new Image();img.src=api.base+'anubis-atlas.webp';
  const frames={};let ready=false;
  img.onload=()=>{for(const k in ATLAS)frames[k]=glowFrame(ATLAS[k]);ready=true};
  function glowFrame(f){const p=18,c=document.createElement('canvas');c.width=f.w+p*2;c.height=f.h+p*2;const g=c.getContext('2d');
    g.shadowColor='rgba(245,200,66,.75)';g.shadowBlur=14;g.drawImage(img,f.x,f.y,f.w,f.h,p,p,f.w,f.h);
    g.shadowBlur=0;g.drawImage(img,f.x,f.y,f.w,f.h,p,p,f.w,f.h);return{c,p,ax:f.ax,ay:f.ay,w:f.w,h:f.h}}
  const ankhImg=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.translate(32,32);
    g.shadowColor='rgba(245,200,66,.9)';g.shadowBlur=12;g.strokeStyle=C.hi;g.lineWidth=5;g.lineCap='round';
    for(let i=0;i<2;i++){g.beginPath();g.ellipse(0,-12,7,9,0,0,Math.PI*2);g.moveTo(0,-3);g.lineTo(0,22);g.moveTo(-12,1);g.lineTo(12,1);g.stroke()}
    g.shadowBlur=0;g.strokeStyle=C.ink;g.lineWidth=1.2;g.beginPath();g.ellipse(0,-12,4.2,6.2,0,0,Math.PI*2);g.stroke();return c})();
  const stars=Array.from({length:70},()=>({x:Math.random(),y:Math.random()*.55,r:rnd(.5,1.6),t:Math.random()*6}));

  /* ---------- tamaño ---------- */
  let W=960,H=540,scale=1;
  function resize(){const dpr=Math.min(2,window.devicePixelRatio||1),cw=Math.max(1,wrap.clientWidth),ch=Math.max(1,wrap.clientHeight),ar=cw/ch;
    if(ar>=420/540){H=540;W=Math.round(540*ar)}else{W=420;H=Math.round(420/ar)}
    cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);scale=cv.width/W;cx.setTransform(scale,0,0,scale,0,0)}
  resize();const ro=new ResizeObserver(resize);ro.observe(wrap);
  const G=()=>H-GROUND_OFF;

  /* ---------- estado ---------- */
  let state='ready',dist=0,speed=430,time=0,coins=0,obs=[],items=[],dust=[],nextSpawn=600,shake=0,deadT=0,raf=0,last=0,paused=false;
  const pl={x:0,y:0,vy:0,ground:true,hold:false,holdT:0,anim:0};
  function reset(){state='ready';dist=0;speed=430;time=0;coins=0;obs=[];items=[];dust=[];nextSpawn=650;shake=0;deadT=0;
    pl.y=G();pl.vy=0;pl.ground=true;pl.hold=false;pl.anim=0;msg.hidden=false;hud()}
  function hud(){api.setScore(Math.floor(dist/40).toLocaleString('es-ES')+' m · 𓋹 '+coins)}

  /* ---------- obstáculos ---------- */
  const TYPES={
    scarab:{w:62,h:34,min:0},
    spikes:{w:100,h:30,min:0},
    cobra:{w:46,h:84,min:250},
    column:{w:56,h:108,min:600}
  };
  function spawn(){
    const m=dist/40,pool=Object.keys(TYPES).filter(k=>m>=TYPES[k].min);
    const k=pool[Math.floor(Math.random()*pool.length)],T=TYPES[k],x=W+60;
    obs.push({k,x,w:T.w,h:T.h});
    if(m>900&&Math.random()<.25&&(k==='scarab'||k==='spikes'))obs.push({k:'scarab',x:x+T.w+26,w:62,h:34});
    if(Math.random()<.5){const n=3,base=x+T.w/2-90,hgt=rnd(150,205);
      for(let i=0;i<n;i++)items.push({x:base+i*90,y:G()-hgt+Math.abs(i-1)*22,got:false})}
    const gap=rnd(430,820)*Math.sqrt(speed/430);nextSpawn=dist+gap+(T.w);
  }

  /* ---------- control ---------- */
  function press(){
    if(state==='ready'){state='run';msg.hidden=true;api.sfx.confirm();jump();return}
    if(state==='run'&&pl.ground)jump();
    pl.hold=true}
  function release(){pl.hold=false}
  function jump(){pl.vy=-930;pl.ground=false;pl.holdT=0;pl.hold=true;
    api.tone(420,.12,'square',.05,0,820);api.tone(820,.06,'triangle',.03,.04)}
  const kd=e=>{if(e.repeat)return;if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W'){e.preventDefault();press()}};
  const ku=e=>{if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W')release()};
  const pd=e=>{e.preventDefault();press()};const pu=()=>release();
  addEventListener('keydown',kd);addEventListener('keyup',ku);wrap.addEventListener('pointerdown',pd);addEventListener('pointerup',pu);
  const vis=()=>{paused=document.hidden;last=performance.now()};document.addEventListener('visibilitychange',vis);

  /* ---------- bucle ---------- */
  function step(dt){
    time+=dt;
    if(state==='run'){
      speed=Math.min(1000,430+time*11);dist+=speed*dt;
      if(dist>=nextSpawn)spawn();
      /* física con salto variable: mantener pulsado = salto más alto */
      let g=2700;if(pl.vy<0&&pl.hold&&pl.holdT<.22){g*=.42;pl.holdT+=dt}
      pl.vy+=g*dt;pl.y+=pl.vy*dt;
      if(pl.y>=G()){if(!pl.ground){for(let i=0;i<6;i++)dust.push({x:pl.x+rnd(-20,20),y:G(),vx:rnd(-80,40),vy:rnd(-90,-20),l:.5})}pl.y=G();pl.vy=0;pl.ground=true}
      pl.anim+=dt*(8+speed/90);
      if(pl.ground&&Math.random()<dt*14)dust.push({x:pl.x-18,y:G(),vx:rnd(-160,-60),vy:rnd(-50,-10),l:.4});
      for(const o of obs)o.x-=speed*dt;
      for(const it of items)it.x-=speed*dt;
      obs=obs.filter(o=>o.x+o.w>-40);items=items.filter(it=>it.x>-40&&!it.gone);
      /* colisiones */
      const px0=pl.x-24,px1=pl.x+26,py0=pl.y-128,py1=pl.y-4;
      for(const o of obs){const ox0=o.x+7,ox1=o.x+o.w-7,oy0=G()-o.h+6,oy1=G();
        if(px1>ox0&&px0<ox1&&py1>oy0&&py0<oy1){die();break}}
      for(const it of items){if(!it.got&&Math.abs(it.x-pl.x)<38&&it.y>py0-10&&it.y<py1+10){it.got=true;it.t=0;coins++;
        api.tone(1320,.06,'square',.05);api.tone(1980,.1,'triangle',.04,.05)}}
      hud();
    }else if(state==='dead'){
      deadT+=dt;pl.x+=Math.max(0,120-deadT*240)*dt;
      if(deadT>1.1&&state==='dead'){state='over';finish()}
    }
    for(const it of items)if(it.got){it.t+=dt;it.y-=180*dt;if(it.t>.35)it.gone=true}
    for(const d of dust){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=200*dt;d.l-=dt}dust=dust.filter(d=>d.l>0);
    shake=Math.max(0,shake-dt*3);
  }
  function die(){state='dead';deadT=0;shake=1;api.tone(150,.35,'sawtooth',.12,0,60);api.noise(.3,800,200,.25);api.duck&&api.duck()}
  function finish(){const m=Math.floor(dist/40),bonus=Math.floor(m/250);
    api.finish({score:m,unit:'m',ankhs:coins+bonus,detail:api.t('detail').replace('{c}',coins).replace('{b}',bonus),
      portrait:{src:api.base+'anubis-atlas.webp',x:ATLAS.win.x,y:ATLAS.win.y,w:ATLAS.win.w,h:ATLAS.win.h,sheetW:2367,sheetH:435}})}

  /* ---------- dibujo ---------- */
  function draw(){
    const g=G();cx.save();
    if(shake>0)cx.translate(rnd(-1,1)*shake*8,rnd(-1,1)*shake*5);
    /* cielo */
    const sky=cx.createLinearGradient(0,0,0,g);sky.addColorStop(0,'#0A0A08');sky.addColorStop(1,'#241c12');cx.fillStyle=sky;cx.fillRect(-20,-20,W+40,g+40);
    for(const s of stars){cx.globalAlpha=.35+.35*Math.sin(time*1.5+s.t);cx.fillStyle=C.ivory;cx.fillRect(s.x*W,s.y*H,s.r,s.r)}cx.globalAlpha=1;
    /* luna */
    const mx=W*.8,my=112;const halo=cx.createRadialGradient(mx,my,40,mx,my,170);halo.addColorStop(0,'rgba(245,200,66,.28)');halo.addColorStop(1,'rgba(245,200,66,0)');
    cx.fillStyle=halo;cx.fillRect(mx-180,my-180,360,360);cx.fillStyle=C.hi;cx.beginPath();cx.arc(mx,my,52,0,Math.PI*2);cx.fill();
    cx.fillStyle='rgba(201,162,39,.55)';for(const [ox,oy,r] of [[-14,-10,9],[16,14,6],[6,-24,4],[-20,18,4]]){cx.beginPath();cx.arc(mx+ox,my+oy,r,0,Math.PI*2);cx.fill()}
    /* dunas lejanas */
    dunes(dist*.08,g-70,46,'#17130e',C.bronze,.004);
    /* pirámides y obeliscos */
    monuments(dist*.28,g);
    dunes(dist*.5,g-14,18,'#120f0b','rgba(201,162,39,.5)',.009);
    /* suelo de templo */
    ground(dist,g);
    /* ankhs */
    for(const it of items){cx.globalAlpha=it.got?Math.max(0,1-it.t/.35):1;const b=Math.sin(time*4+it.x*.02)*4;cx.drawImage(ankhImg,it.x-26,it.y-26+b,52,52)}cx.globalAlpha=1;
    /* obstáculos */
    for(const o of obs)drawObs(o,g);
    /* polvo */
    cx.fillStyle='rgba(201,162,39,.55)';for(const d of dust){cx.globalAlpha=Math.max(0,d.l*2);cx.fillRect(d.x,d.y,3,3)}cx.globalAlpha=1;
    /* jugador */
    if(ready)drawPlayer();
    cx.restore();
  }
  function dunes(off,base,amp,fill,line,fr){
    cx.beginPath();cx.moveTo(-10,H);for(let x=-10;x<=W+10;x+=10){const t=(x+off);cx.lineTo(x,base-amp*(.55+.45*Math.sin(t*fr))*(.7+.3*Math.sin(t*fr*2.7+1)))}
    cx.lineTo(W+10,H);cx.closePath();cx.fillStyle=fill;cx.fill();
    cx.beginPath();for(let x=-10;x<=W+10;x+=10){const t=(x+off);const y=base-amp*(.55+.45*Math.sin(t*fr))*(.7+.3*Math.sin(t*fr*2.7+1));x<0?cx.moveTo(x,y):cx.lineTo(x,y)}
    cx.strokeStyle=line;cx.lineWidth=1.5;cx.stroke()}
  function monuments(off,g){
    const P=1100,items=[[80,150,'p'],[300,95,'p'],[470,190,'o'],[640,120,'p'],[860,70,'p'],[980,170,'o']];
    const start=Math.floor(off/P)*P;
    for(let rep=start;rep<off+W+P;rep+=P)for(const [ix,s,t] of items){const x=ix+rep-off;if(x<-260||x>W+260)continue;
      if(t==='p')pyramid(x,g-30,s);else obelisk(x,g-30,s)}}
  function pyramid(x,base,s){cx.beginPath();cx.moveTo(x-s,base);cx.lineTo(x,base-s*.85);cx.lineTo(x,base);cx.closePath();cx.fillStyle='#2a2116';cx.fill();
    cx.beginPath();cx.moveTo(x,base-s*.85);cx.lineTo(x+s,base);cx.lineTo(x,base);cx.closePath();cx.fillStyle='#16120d';cx.fill();
    cx.beginPath();cx.moveTo(x-s,base);cx.lineTo(x,base-s*.85);cx.lineTo(x+s,base);cx.strokeStyle='rgba(201,162,39,.75)';cx.lineWidth=1.6;cx.stroke();
    cx.beginPath();cx.moveTo(x,base-s*.85);cx.lineTo(x,base);cx.strokeStyle='rgba(201,162,39,.25)';cx.stroke();
    cx.fillStyle=C.hi;cx.beginPath();cx.moveTo(x,base-s*.85);cx.lineTo(x-s*.09,base-s*.77);cx.lineTo(x+s*.09,base-s*.77);cx.fill()}
  function obelisk(x,base,s){const w=s*.14;cx.fillStyle='#1d1711';cx.beginPath();cx.moveTo(x-w,base);cx.lineTo(x-w*.7,base-s);cx.lineTo(x,base-s-w);cx.lineTo(x+w*.7,base-s);cx.lineTo(x+w,base);cx.closePath();cx.fill();
    cx.strokeStyle='rgba(201,162,39,.7)';cx.lineWidth=1.4;cx.stroke();cx.fillStyle=C.hi;cx.beginPath();cx.moveTo(x-w*.7,base-s);cx.lineTo(x,base-s-w);cx.lineTo(x+w*.7,base-s);cx.fill()}
  function ground(off,g){
    cx.fillStyle='#16120d';cx.fillRect(-20,g,W+40,H-g+20);
    cx.fillStyle=C.gold;cx.fillRect(-20,g,W+40,3);
    const tw=96,o=off%tw;cx.strokeStyle='rgba(201,162,39,.22)';cx.lineWidth=1.2;
    for(let x=-o-tw;x<W+tw;x+=tw){cx.beginPath();cx.moveTo(x,g+3);cx.lineTo(x,g+40);cx.moveTo(x+tw/2,g+40);cx.lineTo(x+tw/2,H);cx.stroke()}
    cx.beginPath();cx.moveTo(-20,g+40);cx.lineTo(W+20,g+40);cx.stroke();
    cx.font='20px "Noto Sans Egyptian Hieroglyphs", serif';cx.fillStyle='rgba(201,162,39,.38)';cx.textBaseline='middle';
    const arr=[...GLYPHS],gw=48,go=off%(gw*arr.length);
    for(let i=0,x=-go;x<W+gw;i++,x+=gw)cx.fillText(arr[i%arr.length],x,g+66)}
  function edge(lw){cx.strokeStyle=C.ink;cx.lineWidth=lw||2.5;cx.stroke()}
  function drawObs(o,g){const x=o.x,y=g;
    if(o.k==='scarab'){
      cx.strokeStyle=C.bronze;cx.lineWidth=3;cx.beginPath();for(let i=0;i<3;i++){cx.moveTo(x+16+i*14,y-10);cx.lineTo(x+10+i*14,y)}cx.stroke();
      cx.beginPath();cx.ellipse(x+34,y-17,27,15,0,Math.PI,0);cx.lineTo(x+61,y-8);cx.lineTo(x+7,y-8);cx.closePath();cx.fillStyle='#120f0b';cx.fill();
      cx.strokeStyle=C.gold;cx.lineWidth=2.5;cx.stroke();
      cx.beginPath();cx.moveTo(x+34,y-31);cx.lineTo(x+34,y-9);cx.strokeStyle=C.gold;cx.lineWidth=1.6;cx.stroke();
      cx.beginPath();cx.arc(x+7,y-14,8,0,Math.PI*2);cx.fillStyle='#120f0b';cx.fill();cx.strokeStyle=C.gold;cx.lineWidth=2;cx.stroke();
      cx.fillStyle=C.hi;cx.beginPath();cx.arc(x+4,y-16,2,0,7);cx.fill();cx.fillStyle=C.lapis;cx.beginPath();cx.arc(x+42,y-20,3.2,0,7);cx.arc(x+26,y-20,3.2,0,7);cx.fill();
    }else if(o.k==='spikes'){
      cx.fillStyle='#120f0b';cx.fillRect(x,y-7,o.w,7);cx.strokeStyle=C.gold;cx.lineWidth=1.5;cx.strokeRect(x,y-7,o.w,7);
      const n=5,sw=o.w/n;for(let i=0;i<n;i++){const sx=x+i*sw;
        cx.beginPath();cx.moveTo(sx,y-7);cx.lineTo(sx+sw/2,y-o.h);cx.lineTo(sx+sw/2,y-7);cx.closePath();cx.fillStyle=C.hi;cx.fill();
        cx.beginPath();cx.moveTo(sx+sw/2,y-o.h);cx.lineTo(sx+sw,y-7);cx.lineTo(sx+sw/2,y-7);cx.closePath();cx.fillStyle=C.gold;cx.fill();
        cx.beginPath();cx.moveTo(sx,y-7);cx.lineTo(sx+sw/2,y-o.h);cx.lineTo(sx+sw,y-7);edge(1.6)}
    }else if(o.k==='cobra'){
      const path=()=>{cx.beginPath();cx.moveTo(x+40,y-3);cx.bezierCurveTo(x+4,y-6,x+6,y-30,x+24,y-40);cx.bezierCurveTo(x+40,y-50,x+34,y-66,x+22,y-70)};
      cx.lineCap='round';path();cx.strokeStyle=C.gold;cx.lineWidth=15;cx.stroke();path();cx.strokeStyle='#120f0b';cx.lineWidth=10;cx.stroke();
      cx.beginPath();cx.ellipse(x+21,y-72,13,15,-.15,0,Math.PI*2);cx.fillStyle='#120f0b';cx.fill();cx.strokeStyle=C.gold;cx.lineWidth=2.5;cx.stroke();
      cx.fillStyle=C.gold;for(let i=0;i<3;i++)cx.fillRect(x+16,y-74+i*6,10,2);
      cx.beginPath();cx.ellipse(x+12,y-82,7,5,-.3,0,Math.PI*2);cx.fillStyle='#120f0b';cx.fill();cx.strokeStyle=C.gold;cx.lineWidth=2;cx.stroke();
      cx.fillStyle=C.hi;cx.beginPath();cx.arc(x+9,y-84,1.8,0,7);cx.fill();
      cx.strokeStyle='#d0382c';cx.lineWidth=1.4;cx.beginPath();cx.moveTo(x+5,y-81);cx.lineTo(x-2,y-80);cx.lineTo(x-5,y-82);cx.moveTo(x-2,y-80);cx.lineTo(x-5,y-78);cx.stroke();
    }else if(o.k==='column'){
      cx.fillStyle='#1d1711';cx.fillRect(x+6,y-o.h+14,o.w-12,o.h-14);
      cx.beginPath();cx.moveTo(x,y-o.h+20);cx.lineTo(x+4,y-o.h+8);cx.lineTo(x+16,y-o.h+12);cx.lineTo(x+24,y-o.h);cx.lineTo(x+34,y-o.h+10);cx.lineTo(x+44,y-o.h+4);cx.lineTo(x+o.w,y-o.h+18);cx.lineTo(x+o.w-6,y-o.h+24);cx.lineTo(x+6,y-o.h+24);cx.closePath();
      cx.fillStyle='#2a2116';cx.fill();cx.strokeStyle=C.gold;cx.lineWidth=2;cx.stroke();
      cx.strokeStyle=C.gold;cx.lineWidth=2;cx.strokeRect(x+6,y-o.h+24,o.w-12,o.h-24);
      cx.fillStyle='#120f0b';cx.fillRect(x+2,y-8,o.w-4,8);cx.strokeRect(x+2,y-8,o.w-4,8);
      cx.font='16px "Noto Sans Egyptian Hieroglyphs", serif';cx.fillStyle='rgba(201,162,39,.85)';cx.textAlign='center';cx.textBaseline='middle';
      const arr=[...GLYPHS];for(let i=0;i<4;i++)cx.fillText(arr[(i*5+Math.floor(o.x/400))%arr.length],x+o.w/2,y-o.h+40+i*17);cx.textAlign='start';
      cx.strokeStyle='rgba(10,10,8,.9)';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(x+18,y-o.h+26);cx.lineTo(x+26,y-o.h+44);cx.lineTo(x+20,y-o.h+58);cx.stroke();
    }}
  function drawPlayer(){
    let k;if(state==='dead'||state==='over')k='trip';else if(!pl.ground)k=pl.vy<0?'jump':'fall';else if(state==='ready')k='run1';else k='run'+(1+Math.floor(pl.anim)%6);
    const f=frames[k];const bob=(state==='run'&&pl.ground)?Math.abs(Math.sin(pl.anim*Math.PI/1))*-4:0;
    const dw=(f.w+f.p*2)*SPR,dh=(f.h+f.p*2)*SPR;const dx=pl.x-(f.ax+f.p)*SPR,dy=pl.y-(f.ay+f.p)*SPR+bob+(k==='trip'?6:0);
    cx.fillStyle='rgba(0,0,0,.45)';cx.beginPath();cx.ellipse(pl.x,G()+2,32*(1-Math.min(.6,(G()-pl.y)/300)),5,0,0,Math.PI*2);cx.fill();
    cx.drawImage(f.c,dx,dy,dw,dh)}

  function loop(t){raf=requestAnimationFrame(loop);if(paused){last=t;return}
    const dt=Math.min(.033,(t-last)/1000||0);last=t;pl.x=Math.round(W*.17);step(dt);draw()}
  reset();last=performance.now();raf=requestAnimationFrame(loop);

  return{
    restart(){reset()},
    stop(){cancelAnimationFrame(raf);ro.disconnect();removeEventListener('keydown',kd);removeEventListener('keyup',ku);removeEventListener('pointerup',pu);
      document.removeEventListener('visibilitychange',vis);wrap.remove()}
  };
}

window.TEMPLO.register('carrera',{create,texts:{
  readyTitle:'LA CARRERA DEL CHACAL',readyKey:'PULSA ESPACIO PARA EMPEZAR',readyTouch:'TOCA PARA EMPEZAR',
  detail:'{c} ankhs recogidos · {b} de bonus por distancia'}});
})();
