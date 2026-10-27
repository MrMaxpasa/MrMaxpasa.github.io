/* El laberinto del Duat — laberinto nuevo en cada nivel, visto desde arriba.
   Recoge la llave de Anubis, abre la puerta y escapa antes de que se apague la antorcha.
   Las momias patrullan y te persiguen si te ven. Movimiento por casillas al estilo clásico:
   sigues en la misma dirección y el giro pedido entra en el siguiente cruce. Todo dibujado por código. */
(function(){
'use strict';
const C={ink:'#0A0A08',gold:'#C9A227',hi:'#F5C842',ivory:'#F4EFE3',lapis:'#2456B8',red:'#C2412D'};
const DIRS={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]},OPP={u:'d',d:'u',l:'r',r:'l'};
const CSS=`
.lab-wrap{position:absolute;inset:0;overflow:hidden;background:#050403;touch-action:none;-webkit-user-select:none;user-select:none}
.lab-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.lab-msg{position:absolute;left:50%;top:36%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;display:flex;flex-direction:column;gap:14px;align-items:center;width:max-content;max-width:92%;z-index:3}
.lab-msg b{font:400 clamp(28px,5vw,54px)/1 var(--f-cond);letter-spacing:.06em;color:var(--ivory);background:var(--ink);border:2px solid var(--ivory);padding:8px 18px 6px;transform:skewX(-8deg);box-shadow:7px 7px 0 var(--gold)}
.lab-msg span{font:700 13px/1 var(--f-ui);letter-spacing:.3em;color:var(--gold-hi);animation:blink 1.3s steps(2,jump-none) infinite}
.lab-msg i{font:600 12px/1.4 var(--f-ui);font-style:normal;letter-spacing:.08em;color:rgba(244,239,227,.75);background:rgba(10,10,8,.6);padding:5px 10px;border-left:2px solid var(--gold)}
.lab-msg[hidden]{display:none}
.lab-pop{position:absolute;left:50%;top:max(78px,12%);transform:translate(-50%,-10px) skewX(-8deg);opacity:0;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:4px;background:var(--ink);border:2px solid var(--gold-hi);box-shadow:6px 6px 0 rgba(201,162,39,.55);padding:8px 16px 7px;transition:opacity .2s,transform .3s cubic-bezier(.2,.9,.3,1.3);z-index:2;max-width:88%}
.lab-pop.on{opacity:1;transform:translate(-50%,0) skewX(-8deg)}
.lab-pop b{font:400 clamp(18px,2.4vw,26px)/1 var(--f-cond);letter-spacing:.07em;color:var(--gold-hi);white-space:nowrap}
.lab-pop small{font:600 12px/1.25 var(--f-ui);letter-spacing:.06em;color:var(--ivory);text-align:center}
.lab-pad{position:absolute;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));width:150px;height:150px;z-index:2;display:none}
.lab-pad button{position:absolute;width:52px;height:52px;border:1.5px solid rgba(201,162,39,.8);background:rgba(10,10,8,.72);color:var(--gold-hi);font:400 22px/1 var(--f-cond);border-radius:10px;touch-action:none}
.lab-pad button:active,.lab-pad button.on{background:var(--gold-hi);color:var(--ink)}
.lab-pad .u{left:49px;top:0}.lab-pad .d{left:49px;bottom:0}.lab-pad .l{left:0;top:49px}.lab-pad .r{right:0;top:49px}
@media (hover:none) and (pointer:coarse){.lab-pad{display:block}}
`;
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=n=>Math.floor(Math.random()*n);

function create(stage,api){
  const T=api.t;
  const wrap=document.createElement('div');wrap.className='lab-wrap';
  const st=document.createElement('style');st.textContent=CSS;
  const cv=document.createElement('canvas'),cx=cv.getContext('2d');
  const touchUI=matchMedia('(hover:none) and (pointer:coarse)').matches;
  const msg=document.createElement('div');msg.className='lab-msg';
  msg.innerHTML='<b>'+T('readyTitle')+'</b><span>'+T(touchUI?'readyTouch':'readyKey')+'</span><i>'+T(touchUI?'tipTouch':'tipKey')+'</i>';
  const pop=document.createElement('div');pop.className='lab-pop';pop.setAttribute('aria-live','polite');
  const pad=document.createElement('div');pad.className='lab-pad';pad.innerHTML='<button class="u" aria-label="Arriba">▲</button><button class="l" aria-label="Izquierda">◀</button><button class="r" aria-label="Derecha">▶</button><button class="d" aria-label="Abajo">▼</button>';
  wrap.append(st,cv,pop,pad,msg);stage.append(wrap);
  let popT=0;function say(t,s){pop.innerHTML='<b>'+t+'</b>'+(s?'<small>'+s+'</small>':'');pop.classList.remove('on');void pop.offsetWidth;pop.classList.add('on');clearTimeout(popT);popT=setTimeout(()=>pop.classList.remove('on'),1700)}

  let VW=800,VH=600,TS=48;
  function resize(){const dpr=Math.min(2,devicePixelRatio||1),cw=Math.max(1,wrap.clientWidth),ch=Math.max(1,wrap.clientHeight);
    cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);VW=cw;VH=ch;cx.setTransform(dpr,0,0,dpr,0,0);
    TS=Math.round(Math.max(34,Math.min(58,Math.min(cw,ch)/9.5)))}
  resize();const ro=new ResizeObserver(resize);ro.observe(wrap);

  /* ---------- generación ---------- */
  let grid,GW,GH,level,score,lives,coins,torch,key,doorOpen,player,mummies,items,state,time,lvTime,camX,camY,flash,hurt,parts,raf=0,last=0,paused=false;
  function genMaze(cw,ch){GW=cw*2+1;GH=ch*2+1;grid=Array.from({length:GH},()=>new Array(GW).fill(1));
    const stack=[[0,0]],seen=new Set(['0,0']);grid[1][1]=0;
    while(stack.length){const [x,y]=stack[stack.length-1];const n=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[x+dx,y+dy]).filter(([a,b])=>a>=0&&b>=0&&a<cw&&b<ch&&!seen.has(a+','+b));
      if(!n.length){stack.pop();continue}const [nx,ny]=n[ri(n.length)];seen.add(nx+','+ny);grid[y*2+1+(ny-y)][x*2+1+(nx-x)]=0;grid[ny*2+1][nx*2+1]=0;stack.push([nx,ny])}
    /* abrir algunos muros para crear bucles (huir de las momias) */
    const extra=Math.floor(cw*ch*.12);for(let i=0;i<extra;i++){const x=1+ri(GW-2),y=1+ri(GH-2);if(grid[y][x]===1&&((grid[y][x-1]===0&&grid[y][x+1]===0&&grid[y-1][x]===1&&grid[y+1][x]===1)||(grid[y-1][x]===0&&grid[y+1][x]===0&&grid[y][x-1]===1&&grid[y][x+1]===1)))grid[y][x]=0}}
  function bfs(sx,sy){const d=Array.from({length:GH},()=>new Array(GW).fill(-1));const q=[[sx,sy]];d[sy][sx]=0;
    while(q.length){const [x,y]=q.shift();for(const k in DIRS){const [dx,dy]=DIRS[k],nx=x+dx,ny=y+dy;if(grid[ny]&&grid[ny][nx]===0&&d[ny][nx]<0){d[ny][nx]=d[y][x]+1;q.push([nx,ny])}}}return d}
  function floorCells(){const a=[];for(let y=1;y<GH;y+=2)for(let x=1;x<GW;x+=2)if(grid[y][x]===0)a.push([x,y]);return a}
  function newLevel(){level++;const n=Math.min(17,5+level*2);genMaze(n,Math.min(17,n));
    const d=bfs(1,1);let far=[1,1],fd=0;for(let y=1;y<GH;y+=2)for(let x=1;x<GW;x+=2)if(d[y][x]>fd){fd=d[y][x];far=[x,y]}
    /* llave: lejos del inicio y de la puerta */
    const dd=bfs(far[0],far[1]);let kc=[1,1],ks=-1;for(const [x,y] of floorCells()){const s=Math.min(d[y][x],dd[y][x]);if(s>ks){ks=s;kc=[x,y]}}
    key={x:kc[0],y:kc[1],got:false};doorOpen=false;
    player={x:1,y:1,px:1,py:1,dir:null,want:null,prog:0,face:'r',speed:5.2};
    items=[];const cells=floorCells().filter(([x,y])=>!(x===1&&y===1)&&!(x===far[0]&&y===far[1])&&!(x===kc[0]&&y===kc[1]));
    cells.sort(()=>Math.random()-.5);const nCoins=Math.round(cells.length*.16),nOil=1+Math.floor(level/2);
    for(let i=0;i<nCoins&&i<cells.length;i++)items.push({x:cells[i][0],y:cells[i][1],k:'ankh'});
    /* aceite lejos del inicio */
    const oilC=cells.slice(nCoins).filter(([x,y])=>d[y][x]>8);for(let i=0;i<nOil&&i<oilC.length;i++)items.push({x:oilC[i][0],y:oilC[i][1],k:'oil'});
    items.push({x:far[0],y:far[1],k:'door'});
    mummies=[];const nm=Math.min(7,level);const mc=cells.filter(([x,y])=>d[y][x]>10).sort(()=>Math.random()-.5);
    for(let i=0;i<nm&&i<mc.length;i++)mummies.push({x:mc[i][0],y:mc[i][1],px:mc[i][0],py:mc[i][1],dir:null,prog:0,speed:Math.min(4.3,2.2+level*.22),chase:0,ph:Math.random()*6});
    torch=1;lvTime=0;camX=player.x;camY=player.y;hud();say(T('level').replace('{n}',level),level===1?T('levelTip1'):T('levelTip'))}
  function reset(){level=0;score=0;lives=3;coins=0;state='ready';time=0;flash=0;hurt=0;parts=[];newLevel();msg.hidden=false;pop.classList.remove('on')}
  function hud(){api.setScore(T('lvl')+' '+level+' · '+score.toLocaleString('es-ES')+' pts · '+'♥'.repeat(Math.max(0,lives)))}
  const open=(x,y)=>grid[y]&&grid[y][x]===0&&!(items.some(i=>i.k==='door'&&i.x===x&&i.y===y)&&!doorOpen&&false);

  /* ---------- movimiento ---------- */
  function canGo(e,d){const [dx,dy]=DIRS[d];return open(e.x+dx,e.y+dy)}
  function stepPlayer(dt){const p=player;
    if(p.prog===0){if(p.want&&canGo(p,p.want)){p.dir=p.want}else if(p.dir&&!canGo(p,p.dir))p.dir=null;if(p.dir){p.face=p.dir==='l'||p.dir==='r'?p.dir:p.face}}
    if(!p.dir)return;p.prog+=dt*p.speed;
    if(p.prog>=1){p.x+=DIRS[p.dir][0];p.y+=DIRS[p.dir][1];p.prog=0;arrive()}
    const [dx,dy]=DIRS[p.dir];p.px=p.x+dx*p.prog;p.py=p.y+dy*p.prog}
  function arrive(){const p=player;
    for(const it of items){if(it.x!==p.x||it.y!==p.y||it.got)continue;
      if(it.k==='ankh'){it.got=true;coins++;score+=20;api.tone(1320,.06,'square',.05);api.tone(1980,.09,'triangle',.04,.05);burst(it.x,it.y,'#F5C842',6)}
      else if(it.k==='oil'){it.got=true;torch=Math.min(1,torch+.45);score+=50;say(T('oil'),'');api.tone(520,.1,'triangle',.06);api.tone(780,.16,'triangle',.05,.08);burst(it.x,it.y,'#F06A3C',12)}
      else if(it.k==='door'&&key.got){win();return}
      else if(it.k==='door'&&!key.got&&lvTime>1){say(T('locked'),T('lockedSub'))}}
    if(!key.got&&key.x===p.x&&key.y===p.y){key.got=true;doorOpen=true;score+=200;say(T('key'),T('keySub'));api.tone(660,.1,'triangle',.07);api.tone(990,.12,'triangle',.06,.09);api.tone(1320,.25,'sine',.05,.18);burst(p.x,p.y,'#F5C842',18)}
    hud()}
  function stepMummy(m,dt){
    if(m.prog===0){const p=player,dist=Math.abs(m.x-p.x)+Math.abs(m.y-p.y);
      /* ve al jugador si está en línea recta sin muros y cerca */
      let sees=false;if(dist<=7&&(m.x===p.x||m.y===p.y)){sees=true;const sx=Math.sign(p.x-m.x),sy=Math.sign(p.y-m.y);let x=m.x,y=m.y;while(x!==p.x||y!==p.y){x+=sx;y+=sy;if(grid[y][x]!==0){sees=false;break}}}
      if(sees)m.chase=3.5;
      const opts=Object.keys(DIRS).filter(d=>canGo(m,d));let pick=null;
      if(m.chase>0&&opts.length){/* persigue: casilla que acerca por el camino más corto */
        const d=bfs(p.x,p.y);let bd=1e9;for(const o of opts){const [dx,dy]=DIRS[o],v=d[m.y+dy][m.x+dx];if(v>=0&&v<bd){bd=v;pick=o}}}
      if(!pick){const fwd=opts.filter(o=>o!==OPP[m.dir]);const pool=fwd.length?fwd:opts;pick=pool.includes(m.dir)&&Math.random()<.7?m.dir:pool[ri(pool.length)]}
      m.dir=pick||null}
    m.chase=Math.max(0,m.chase-dt);if(!m.dir)return;m.prog+=dt*m.speed*(m.chase>0?1.15:.85);
    if(m.prog>=1){m.x+=DIRS[m.dir][0];m.y+=DIRS[m.dir][1];m.prog=0}
    const [dx,dy]=DIRS[m.dir];m.px=m.x+dx*m.prog;m.py=m.y+dy*m.prog;m.ph+=dt*6}
  function burst(x,y,c,n){for(let i=0;i<n;i++)parts.push({x:x+.5,y:y+.5,vx:rnd(-2.5,2.5),vy:rnd(-2.5,2.5),l:rnd(.3,.7),c})}
  function caught(){if(hurt>0)return;lives--;hurt=2;flash=.5;api.tone(160,.35,'sawtooth',.1,0,70);api.noise(.3,700,200,.2);api.duck&&api.duck();
    if(lives<=0){state='dead';setTimeout(finish,1100);hud();return}
    say(T('caught'),T('caughtSub'));player.x=player.px=1;player.y=player.py=1;player.dir=null;player.prog=0;hud()}
  function win(){const bonus=Math.max(0,Math.round(600-lvTime*8))+Math.round(torch*300);score+=500+bonus;
    api.tone(523,.12,'square',.06);api.tone(659,.12,'square',.06,.1);api.tone(784,.12,'square',.06,.2);api.tone(1047,.3,'triangle',.06,.3);
    if(api.ach){api.ach('lab-first');if(level>=5)api.ach('lab-5');if(level>=10)api.ach('lab-10')}
    say(T('escaped'),T('escapedSub').replace('{b}',bonus));state='between';setTimeout(()=>{if(state==='between'){state='play';newLevel()}},1400)}
  function finish(){if(state==='over')return;state='over';
    api.finish({score,unit:'pts',ankhs:1+Math.floor(score/400)+coins,detail:T('detail').replace('{l}',level-1).replace('{c}',coins)})}

  /* ---------- entrada ---------- */
  const KEYS={arrowup:'u',w:'u',arrowdown:'d',s:'d',arrowleft:'l',a:'l',arrowright:'r',d:'r'};
  function want(d){if(state==='ready'){state='play';msg.hidden=true;api.sfx.confirm()}if(state!=='play')return;player.want=d;if(player.prog===0&&!player.dir&&canGo(player,d))player.dir=d;
    /* media vuelta inmediata en un pasillo */
    if(player.dir&&d===OPP[player.dir]&&player.prog>0){const [dx,dy]=DIRS[player.dir];player.x+=dx;player.y+=dy;player.prog=1-player.prog;player.dir=d}}
  const kd=e=>{const d=KEYS[e.key.toLowerCase()];if(d){e.preventDefault();want(d)}else if((e.key===' '||e.key==='Enter')&&state==='ready'){e.preventDefault();want(player.want||'r')}};
  let sw=null;
  const pd=e=>{if(e.target.closest('.lab-pad'))return;sw={x:e.clientX,y:e.clientY};if(state==='ready'){state='play';msg.hidden=true;api.sfx.confirm()}};
  const pm=e=>{if(!sw)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y;if(Math.hypot(dx,dy)>24){want(Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'));sw={x:e.clientX,y:e.clientY}}};
  const pu=()=>{sw=null};
  addEventListener('keydown',kd);wrap.addEventListener('pointerdown',pd);wrap.addEventListener('pointermove',pm);addEventListener('pointerup',pu);
  pad.querySelectorAll('button').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();want(b.className.split(' ')[0])}));
  const vis=()=>{paused=document.hidden;last=performance.now()};document.addEventListener('visibilitychange',vis);

  /* ---------- bucle ---------- */
  function step(dt){time+=dt;flash=Math.max(0,flash-dt);hurt=Math.max(0,hurt-dt);
    if(state==='play'){lvTime+=dt;stepPlayer(dt);for(const m of mummies)stepMummy(m,dt);
      /* la antorcha se consume (más rápido en niveles altos) */
      torch=Math.max(0,torch-dt*(.018+level*.0025));if(torch<=0){lives=0;state='dead';say(T('dark'),'');api.tone(120,.6,'sine',.12,0,50);setTimeout(finish,1300);hud()}
      for(const m of mummies)if(Math.hypot(m.px-player.px,m.py-player.py)<.62)caught()}
    for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt}parts=parts.filter(p=>p.l>0);
    camX+=(player.px-camX)*Math.min(1,dt*8);camY+=(player.py-camY)*Math.min(1,dt*8)}
  function draw(){const ox=VW/2-(camX+.5)*TS,oy=VH/2-(camY+.5)*TS;cx.fillStyle='#050403';cx.fillRect(0,0,VW,VH);
    const x0=Math.max(0,Math.floor(-ox/TS)-1),x1=Math.min(GW-1,Math.ceil((VW-ox)/TS)+1),y0=Math.max(0,Math.floor(-oy/TS)-1),y1=Math.min(GH-1,Math.ceil((VH-oy)/TS)+1);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const sx=ox+x*TS,sy=oy+y*TS;
      if(grid[y][x]===1){cx.fillStyle='#2a2116';cx.fillRect(sx,sy,TS+.5,TS+.5);
        if(!grid[y+1]||grid[y+1][x]!==1){cx.fillStyle='#16110b';cx.fillRect(sx,sy+TS*.72,TS+.5,TS*.28+.5);cx.fillStyle='rgba(201,162,39,.45)';cx.fillRect(sx,sy+TS*.72,TS+.5,2)}
        cx.strokeStyle='rgba(0,0,0,.35)';cx.lineWidth=1;cx.strokeRect(sx+.5,sy+.5,TS-1,TS*.36);
        if((x*7+y*13)%11===0){cx.fillStyle='rgba(201,162,39,.25)';cx.font=Math.round(TS*.36)+'px "Noto Sans Egyptian Hieroglyphs", serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('𓂀𓋹𓆣𓇳𓊽𓅓'[(x+y)%6*2]+'𓂀𓋹𓆣𓇳𓊽𓅓'[(x+y)%6*2+1],sx+TS/2,sy+TS*.4)}}
      else{cx.fillStyle=(x+y)%2?'#0f0c08':'#120e09';cx.fillRect(sx,sy,TS+.5,TS+.5)}}
    /* objetos */
    for(const it of items){if(it.got)continue;const sx=ox+(it.x+.5)*TS,sy=oy+(it.y+.5)*TS;
      if(it.k==='ankh')drawAnkh(sx,sy+Math.sin(time*4+it.x)*2,TS*.26);
      else if(it.k==='oil')drawOil(sx,sy);
      else if(it.k==='door')drawDoor(ox+it.x*TS,oy+it.y*TS)}
    if(!key.got)drawKey(ox+(key.x+.5)*TS,oy+(key.y+.5)*TS+Math.sin(time*3)*3);
    for(const m of mummies)drawMummy(ox+(m.px+.5)*TS,oy+(m.py+.5)*TS,m);
    drawPlayer(ox+(player.px+.5)*TS,oy+(player.py+.5)*TS);
    for(const p of parts){cx.globalAlpha=Math.max(0,p.l*1.6);cx.fillStyle=p.c;cx.fillRect(ox+p.x*TS,oy+p.y*TS,3,3)}cx.globalAlpha=1;
    /* oscuridad: solo ilumina la antorcha */
    const px=ox+(player.px+.5)*TS,py=oy+(player.py+.5)*TS,flick=1+Math.sin(time*13)*.02+Math.sin(time*7.3)*.025,R=TS*(2+torch*4.2)*flick;
    const g=cx.createRadialGradient(px,py,R*.25,px,py,R);g.addColorStop(0,'rgba(5,4,3,0)');g.addColorStop(.6,'rgba(5,4,3,.35)');g.addColorStop(1,'rgba(5,4,3,.96)');
    cx.fillStyle=g;cx.fillRect(0,0,VW,VH);cx.globalCompositeOperation='lighter';const w=cx.createRadialGradient(px,py,0,px,py,R*.8);w.addColorStop(0,'rgba(240,140,50,.18)');w.addColorStop(1,'rgba(240,140,50,0)');cx.fillStyle=w;cx.fillRect(px-R,py-R,R*2,R*2);cx.globalCompositeOperation='source-over';
    /* la puerta brilla a través de la oscuridad cuando tienes la llave */
    if(key.got){const d=items.find(i=>i.k==='door'),dx=ox+(d.x+.5)*TS,dy=oy+(d.y+.5)*TS;const dg=cx.createRadialGradient(dx,dy,2,dx,dy,TS*1.4);dg.addColorStop(0,'rgba(245,200,66,.45)');dg.addColorStop(1,'rgba(245,200,66,0)');cx.fillStyle=dg;cx.fillRect(dx-TS*1.5,dy-TS*1.5,TS*3,TS*3);
      if(dx<0||dx>VW||dy<0||dy>VH){const a=Math.atan2(dy-VH/2,dx-VW/2),r=Math.min(VW,VH)*.42;edgeArrow(VW/2+Math.cos(a)*r,VH/2+Math.sin(a)*r,a)}}
    /* barra de la antorcha */
    const bw=Math.min(220,VW*.5),bx=VW/2-bw/2,by=touchUI?78:VH-24;cx.fillStyle='rgba(10,10,8,.75)';cx.fillRect(bx-4,by-16,bw+8,26);cx.fillStyle='rgba(244,239,227,.12)';cx.fillRect(bx,by,bw,6);
    cx.fillStyle=torch<.25?'#C2412D':'#F06A3C';cx.fillRect(bx,by,bw*torch,6);cx.fillStyle='#F4EFE3';cx.font='700 10px "Barlow Semi Condensed", sans-serif';cx.textAlign='left';cx.textBaseline='alphabetic';cx.fillText(T('torch')+(key.got?'  ·  '+T('hasKey'):''),bx,by-4);
    if(flash>0){cx.fillStyle='rgba(194,65,45,'+(flash*.5).toFixed(3)+')';cx.fillRect(0,0,VW,VH)}}
  function edgeArrow(x,y,a){cx.save();cx.translate(x,y);cx.rotate(a);cx.fillStyle=C.hi;cx.globalAlpha=.6+Math.sin(time*8)*.3;cx.beginPath();cx.moveTo(14,0);cx.lineTo(-8,-10);cx.lineTo(-3,0);cx.lineTo(-8,10);cx.closePath();cx.fill();cx.restore();cx.globalAlpha=1}
  function drawAnkh(x,y,s){cx.save();cx.translate(x,y);cx.strokeStyle=C.hi;cx.lineWidth=Math.max(2,s*.32);cx.lineCap='round';cx.shadowColor='rgba(245,200,66,.8)';cx.shadowBlur=8;
    cx.beginPath();cx.ellipse(0,-s*.45,s*.32,s*.42,0,0,Math.PI*2);cx.moveTo(0,0);cx.lineTo(0,s);cx.moveTo(-s*.55,s*.15);cx.lineTo(s*.55,s*.15);cx.stroke();cx.restore()}
  function drawOil(x,y){const s=TS*.24;cx.save();cx.translate(x,y);cx.fillStyle='#8a5a2a';cx.beginPath();cx.ellipse(0,s*.2,s*.8,s*.55,0,0,Math.PI*2);cx.fill();cx.strokeStyle=C.gold;cx.lineWidth=2;cx.stroke();
    cx.fillStyle='#F06A3C';cx.shadowColor='rgba(240,106,60,.9)';cx.shadowBlur=14;cx.beginPath();cx.ellipse(s*.6,-s*.25+Math.sin(time*14)*1.2,s*.22,s*.42,0,0,Math.PI*2);cx.fill();cx.restore()}
  function drawKey(x,y){const s=TS*.3;cx.save();cx.translate(x,y);cx.rotate(Math.sin(time*2)*.2);cx.shadowColor='rgba(245,200,66,.95)';cx.shadowBlur=16;cx.strokeStyle=C.hi;cx.lineWidth=Math.max(3,s*.3);cx.lineCap='round';
    cx.beginPath();cx.arc(0,-s*.55,s*.42,0,Math.PI*2);cx.moveTo(0,-s*.12);cx.lineTo(0,s*1.05);cx.moveTo(0,s*.55);cx.lineTo(s*.42,s*.55);cx.moveTo(0,s*.9);cx.lineTo(s*.32,s*.9);cx.stroke();cx.restore()}
  function drawDoor(sx,sy){cx.fillStyle='#16110b';cx.fillRect(sx+3,sy+3,TS-6,TS-6);cx.strokeStyle=key.got?C.hi:C.gold;cx.lineWidth=3;cx.strokeRect(sx+5,sy+5,TS-10,TS-10);
    cx.fillStyle=key.got?'rgba(245,200,66,.35)':'rgba(201,162,39,.12)';cx.fillRect(sx+9,sy+9,TS-18,TS-18);
    cx.fillStyle=key.got?C.hi:'rgba(201,162,39,.6)';cx.font=Math.round(TS*.42)+'px "Noto Sans Egyptian Hieroglyphs", serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(key.got?'𓉐':'𓊹',sx+TS/2,sy+TS/2+1)}
  function drawMummy(x,y,m){const s=TS*.36,b=Math.sin(m.ph)*1.5;cx.save();cx.translate(x,y+b);
    cx.fillStyle='rgba(0,0,0,.4)';cx.beginPath();cx.ellipse(0,s*.95,s*.75,s*.25,0,0,Math.PI*2);cx.fill();
    cx.fillStyle='#d9cfb4';cx.beginPath();cx.ellipse(0,s*.15,s*.62,s*.82,0,0,Math.PI*2);cx.fill();cx.beginPath();cx.arc(0,-s*.6,s*.42,0,Math.PI*2);cx.fill();
    cx.strokeStyle='rgba(90,70,40,.65)';cx.lineWidth=1.4;for(let i=-3;i<5;i++){cx.beginPath();cx.moveTo(-s*.62,i*s*.22);cx.lineTo(s*.62,i*s*.22+s*.12);cx.stroke()}
    /* brazos al frente */
    const fx=m.dir==='l'?-1:m.dir==='r'?1:0;cx.strokeStyle='#d9cfb4';cx.lineWidth=s*.28;cx.lineCap='round';cx.beginPath();cx.moveTo(-s*.35,-s*.05);cx.lineTo(-s*.35+fx*s*.7,-s*.2);cx.moveTo(s*.35,-s*.05);cx.lineTo(s*.35+fx*s*.7,-s*.2);cx.stroke();
    cx.fillStyle=m.chase>0?'#ff3b2a':'#C2412D';cx.shadowColor='rgba(255,59,42,.9)';cx.shadowBlur=m.chase>0?12:6;cx.beginPath();cx.arc(-s*.15+fx*s*.1,-s*.64,s*.08,0,Math.PI*2);cx.arc(s*.15+fx*s*.1,-s*.64,s*.08,0,Math.PI*2);cx.fill();cx.restore()}
  function drawPlayer(x,y){const s=TS*.36,f=player.face==='l'?-1:1,b=player.dir?Math.abs(Math.sin(time*14))*-2:0;
    if(hurt>0&&Math.floor(time*12)%2)return;cx.save();cx.translate(x,y+b);
    cx.fillStyle='rgba(0,0,0,.45)';cx.beginPath();cx.ellipse(0,s*.95,s*.7,s*.22,0,0,Math.PI*2);cx.fill();
    /* cuerpo con sudadera y ankh */
    cx.fillStyle='#14110e';cx.beginPath();cx.ellipse(0,s*.25,s*.6,s*.72,0,0,Math.PI*2);cx.fill();cx.strokeStyle=C.hi;cx.lineWidth=1.5;cx.beginPath();cx.ellipse(0,s*.08,s*.09,s*.12,0,0,Math.PI*2);cx.moveTo(0,s*.2);cx.lineTo(0,s*.5);cx.moveTo(-s*.14,s*.27);cx.lineTo(s*.14,s*.27);cx.stroke();
    /* cabeza de chacal con nemes */
    cx.scale(f,1);cx.fillStyle='#C9A227';cx.beginPath();cx.moveTo(-s*.5,-s*.35);cx.lineTo(s*.32,-s*.35);cx.lineTo(s*.2,s*.05);cx.lineTo(-s*.62,s*.05);cx.closePath();cx.fill();
    cx.fillStyle='#0A0A08';for(let i=0;i<3;i++)cx.fillRect(-s*.55+i*s*.26,-s*.33,s*.1,s*.36);
    cx.fillStyle='#17130f';cx.beginPath();cx.ellipse(0,-s*.62,s*.38,s*.34,0,0,Math.PI*2);cx.fill();cx.beginPath();cx.moveTo(s*.2,-s*.72);cx.lineTo(s*.78,-s*.5);cx.lineTo(s*.2,-s*.42);cx.closePath();cx.fill();
    cx.beginPath();cx.moveTo(-s*.25,-s*.8);cx.lineTo(-s*.18,-s*1.35);cx.lineTo(s*.02,-s*.86);cx.moveTo(s*.02,-s*.86);cx.lineTo(s*.14,-s*1.38);cx.lineTo(s*.26,-s*.82);cx.fill();
    cx.fillStyle=C.hi;cx.shadowColor='rgba(245,200,66,.9)';cx.shadowBlur=6;cx.beginPath();cx.arc(s*.18,-s*.66,s*.07,0,Math.PI*2);cx.fill();cx.restore()}
  function loop(t){raf=requestAnimationFrame(loop);if(paused){last=t;return}const dt=Math.min(.05,(t-last)/1000||0);last=t;step(dt);draw()}
  reset();last=performance.now();raf=requestAnimationFrame(loop);
  return{restart(){reset()},stop(){cancelAnimationFrame(raf);ro.disconnect();clearTimeout(popT);removeEventListener('keydown',kd);removeEventListener('pointerup',pu);document.removeEventListener('visibilitychange',vis);wrap.remove()}};
}
window.TEMPLO.register('laberinto',{create,help:[
  {t:'OBJETIVO',p:'Encuentra la llave de Anubis, vuelve a la puerta sellada y escapa. Cada nivel es un laberinto nuevo y un poco más grande.'},
  {t:'LA ANTORCHA',p:'Solo ves lo que ilumina tu antorcha, y se va consumiendo. Las vasijas de aceite la reavivan. Si se apaga, la partida termina.'},
  {t:'LAS MOMIAS',p:'Patrullan los pasillos. Si te ven en línea recta, sus ojos se encienden y te persiguen. Si te tocan pierdes una de tus 3 vidas y vuelves al inicio del nivel.'},
  {t:'CONTROLES',p:'Flechas o WASD. En móvil, desliza el dedo o usa la cruceta. Sigues avanzando en la misma dirección y el giro que pidas entra en el siguiente cruce.'},
  {t:'PUNTOS',p:'Ankhs del suelo, la llave, el aceite y cada salida suman. Escapar rápido y con mucha antorcha da más bonus.'}],texts:{
  readyTitle:'EL LABERINTO DEL DUAT',readyKey:'PULSA UNA FLECHA PARA EMPEZAR',readyTouch:'DESLIZA PARA EMPEZAR',
  tipKey:'Flechas o WASD · coge la llave y busca la puerta',tipTouch:'Desliza o usa la cruceta · coge la llave y busca la puerta',
  level:'NIVEL {n}',levelTip1:'Busca la llave dorada antes de que se apague la antorcha',levelTip:'El laberinto crece y las momias despiertan',lvl:'NIVEL',
  key:'¡LA LLAVE DE ANUBIS!',keySub:'La puerta brilla: síguela',locked:'PUERTA SELLADA',lockedSub:'Necesitas la llave',oil:'+ ACEITE',
  caught:'¡TE HA ATRAPADO!',caughtSub:'Vuelves al inicio del nivel',dark:'LA ANTORCHA SE APAGA',escaped:'¡HAS ESCAPADO!',escapedSub:'Bonus de salida: +{b}',
  torch:'ANTORCHA',hasKey:'LLAVE ✓',
  detail:'{l} laberintos superados · {c} ankhs recogidos'}});
})();
