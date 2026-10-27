/* La danza de Hathor — juego de ritmo de 4 carriles.
   La canción se compone por código en tiempo real (darbuka, bordón, laúd y sistro en modo frigio dominante)
   y la partitura sale de la misma semilla que la melodía: cada nota que cae es una nota que suena.
   Reloj: AudioContext.currentTime (compensando la latencia de salida), así la imagen y el sonido no se separan. */
(function(){
'use strict';
const BPM=112,BEAT=60/BPM,S16=BEAT/4,BARS=34,TRAVEL=1.55,LEAD_IN=2.2;
const WIN={p:.045,g:.09,ok:.135};
const LANES=[{k:['arrowleft','d'],g:'𓋹',c:'#2456B8',n:'←'},{k:['arrowdown','f'],g:'𓂀',c:'#C9A227',n:'↓'},{k:['arrowup','j'],g:'𓆣',c:'#F4EFE3',n:'↑'},{k:['arrowright','k'],g:'𓇳',c:'#C2412D',n:'→'}];
/* secciones por compás: densidad de la partitura */
const SECT=[['intro',2],['a',8],['b',8],['break',2],['c',10],['outro',4]];
const SCALE=[0,1,4,5,7,8,10];      /* frigio dominante (Hijaz) */
const ROOT=50;                     /* Re */
const mid=n=>440*Math.pow(2,(n-69)/12);
function rng(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

const CSS=`
.hat-wrap{position:absolute;inset:0;overflow:hidden;background:#06050a;touch-action:none;-webkit-user-select:none;user-select:none}
.hat-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.hat-msg{position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;display:flex;flex-direction:column;gap:14px;align-items:center;width:max-content;max-width:92%;z-index:3}
.hat-msg b{font:400 clamp(28px,5vw,54px)/1 var(--f-cond);letter-spacing:.06em;color:var(--ivory);background:var(--ink);border:2px solid var(--ivory);padding:8px 18px 6px;transform:skewX(-8deg);box-shadow:7px 7px 0 var(--gold)}
.hat-msg span{font:700 13px/1 var(--f-ui);letter-spacing:.3em;color:var(--gold-hi);animation:blink 1.3s steps(2,jump-none) infinite}
.hat-msg i{font:600 12px/1.4 var(--f-ui);font-style:normal;letter-spacing:.08em;color:rgba(244,239,227,.75);background:rgba(10,10,8,.6);padding:5px 10px;border-left:2px solid var(--gold)}
.hat-msg[hidden]{display:none}
.hat-j{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%) skewX(-8deg);pointer-events:none;text-align:center;z-index:2}
.hat-j b{display:block;font:400 clamp(26px,4vw,44px)/1 var(--f-cond);letter-spacing:.08em;color:var(--ink);background:var(--gold-hi);padding:6px 14px 4px;box-shadow:5px 5px 0 var(--ivory);opacity:0}
.hat-j b.p{background:var(--gold-hi)}.hat-j b.g{background:var(--ivory)}.hat-j b.ok{background:#C98A52}.hat-j b.x{background:var(--ink);color:rgba(244,239,227,.7);box-shadow:0 0 0 2px rgba(244,239,227,.4)}
.hat-j b.on{animation:hatJ .45s ease-out forwards}
@keyframes hatJ{0%{opacity:0;transform:scale(.6)}25%{opacity:1;transform:scale(1.08)}70%{opacity:1;transform:scale(1)}100%{opacity:0;transform:translateY(-12px)}}
.hat-c{display:block;margin-top:8px;font:400 clamp(18px,2.4vw,26px)/1 var(--f-cond);letter-spacing:.1em;color:var(--ivory);text-shadow:0 2px 0 #000}
.hat-c:empty{display:none}
@media (prefers-reduced-motion:reduce){.hat-j b.on{animation-duration:.3s}}
`;

function create(stage,api){
  const T=api.t;
  const wrap=document.createElement('div');wrap.className='hat-wrap';
  const st=document.createElement('style');st.textContent=CSS;
  const cv=document.createElement('canvas'),cx=cv.getContext('2d');
  const touchUI=matchMedia('(hover:none) and (pointer:coarse)').matches;
  const msg=document.createElement('div');msg.className='hat-msg';
  msg.innerHTML='<b>'+T('readyTitle')+'</b><span>'+T(touchUI?'readyTouch':'readyKey')+'</span><i>'+T(touchUI?'tipTouch':'tipKey')+'</i>';
  const jd=document.createElement('div');jd.className='hat-j';jd.innerHTML='<b></b><span class="hat-c"></span>';
  wrap.append(st,cv,jd,msg);stage.append(wrap);
  const jb=jd.querySelector('b'),jc=jd.querySelector('.hat-c');

  /* Hathor: si existe su hoja de poses se usa; si no, se dibuja un emblema (disco solar entre cuernos) */
  const hImg=new Image();let hReady=false;hImg.onload=()=>{hReady=true};hImg.onerror=()=>{};hImg.src=api.base+'hathor/hathor.webp';

  let W=960,H=540,lanesX=0,laneW=100,lineY=420;
  function resize(){const dpr=Math.min(2,devicePixelRatio||1),cw=Math.max(1,wrap.clientWidth),ch=Math.max(1,wrap.clientHeight),ar=cw/ch;
    if(ar>=1){H=560;W=Math.round(560*ar)}else{W=420;H=Math.round(420/ar)}
    cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);cx.setTransform(cv.width/W,0,0,cv.width/W,0,0);
    laneW=Math.min(96,(W-24)/4);lanesX=W/2-laneW*2;lineY=H-(ar>=1?112:150)}
  resize();const ro=new ResizeObserver(resize);ro.observe(wrap);

  /* ---------- partitura + melodía (misma semilla) ---------- */
  function compose(){const r=rng(0x4A7408),notes=[],mel=[];let deg=3,lane=1,bar=0;
    for(const [sec,n] of SECT){for(let b=0;b<n;b++,bar++){for(let s=0;s<16;s++){const t=(bar*16+s)*S16,strong=s%4===0,half=s%8===0;let p=0,dbl=0;
      if(sec==='intro')p=bar>=1&&half?1:0;
      else if(sec==='a')p=strong?.9:s%2===0?.18:0;
      else if(sec==='b'){p=strong?.95:s%2===0?.5:.06;dbl=half&&b%2===1?.45:0}
      else if(sec==='break')p=s===0?1:0;
      else if(sec==='c'){p=strong?1:s%2===0?.62:(b%4===3?.38:.1);dbl=strong&&s%8===0?.5:0}
      else if(sec==='outro')p=b<3&&strong?.85:(b===3&&s===0?1:0);
      if(r()<p){const step=[-2,-1,-1,1,1,2][Math.floor(r()*6)];deg=Math.max(0,Math.min(13,deg+step));
        let nl=deg%4;if(nl===lane&&r()<.5)nl=(nl+(step>0?1:3))%4;lane=nl;
        const pitch=ROOT+12+Math.floor(deg/7)*12+SCALE[deg%7];
        notes.push({t,lane,hit:0});mel.push({t,pitch,dur:strong?S16*3:S16*1.6});
        if(r()<dbl){const l2=(lane+2)%4;notes.push({t,lane:l2,hit:0})}}}}}
    return{notes,mel,len:bar*16*S16}}
  const SONG=compose();
  const TOTAL=SONG.notes.length;

  /* ---------- audio ---------- */
  let A=null,bus=null,t0=0,sched=0,schedTimer=0,lat=0;
  function audioInit(){A=api.audio&&api.audio();if(!A)return false;const ac=A.ac;bus=ac.createGain();bus.gain.value=.9;
    const comp=ac.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3;bus.connect(comp);comp.connect(A.out);
    lat=(ac.outputLatency||0)+(ac.baseLatency||0);return true}
  function env(t,a,peak,d){const g=A.ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);g.connect(bus);return g}
  let nb=null;function noiseBuf(){if(nb)return nb;const ac=A.ac,n=Math.floor(ac.sampleRate*.3);nb=ac.createBuffer(1,n,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return nb}
  function nz(t,type,f,q,peak,d){const ac=A.ac,s=ac.createBufferSource();s.buffer=noiseBuf();const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;s.connect(fl);fl.connect(env(t,.002,peak,d));s.start(t);s.stop(t+d+.05)}
  function doum(t){const o=A.ac.createOscillator();o.frequency.setValueAtTime(115,t);o.frequency.exponentialRampToValueAtTime(52,t+.16);o.connect(env(t,.003,.5,.32));o.start(t);o.stop(t+.4)}
  function tek(t,v){nz(t,'bandpass',3400,2.2,.22*(v||1),.05);const o=A.ac.createOscillator();o.type='triangle';o.frequency.value=780;o.connect(env(t,.001,.05*(v||1),.03));o.start(t);o.stop(t+.06)}
  function riq(t,v){nz(t,'highpass',8000,.6,v,.06)}
  function oud(n,t,d,v){const ac=A.ac,o=ac.createOscillator(),o2=ac.createOscillator(),lp=ac.createBiquadFilter();o.type='sawtooth';o2.type='triangle';
    o.frequency.setValueAtTime(mid(n)*1.012,t);o.frequency.exponentialRampToValueAtTime(mid(n),t+.03);o2.frequency.value=mid(n)*2;
    lp.type='lowpass';lp.frequency.setValueAtTime(3200,t);lp.frequency.exponentialRampToValueAtTime(700,t+d);lp.Q.value=2;
    const e=env(t,.004,.09*(v||1),d);o.connect(lp);o2.connect(lp);lp.connect(e);o.start(t);o2.start(t);o.stop(t+d+.05);o2.stop(t+d+.05)}
  let drone=null;
  function startDrone(t){const ac=A.ac,g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+2);g.connect(bus);
    const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;lp.connect(g);
    const os=[ROOT-12,ROOT-5,ROOT].map((n,i)=>{const o=ac.createOscillator();o.type=i?'sawtooth':'triangle';o.frequency.value=mid(n);o.detune.value=(i-1)*6;o.connect(lp);o.start(t);return o});
    drone={g,os}}
  function stopDrone(){if(!drone)return;const t=A.ac.currentTime;drone.g.gain.cancelScheduledValues(t);drone.g.gain.setTargetAtTime(0,t,.3);drone.os.forEach(o=>o.stop(t+1.5));drone=null}
  /* ritmo maqsum por corcheas: D T · T D · T · */
  const MAQ=['D','T','','T','D','','T',''];
  let melIdx=0;
  function scheduler(){if(!A)return;const ac=A.ac,horizon=ac.currentTime+.25;
    while(sched<SONG.len&&t0+sched<horizon){const t=t0+sched,step=Math.round(sched/S16),s=step%16,bar=Math.floor(step/16);
      const sec=sectionOf(bar);
      if(s%2===0&&sec!=='break'){const m=MAQ[s/2];if(m==='D')doum(t);else if(m==='T')tek(t,1);else if(sec==='c'||sec==='b')tek(t,.45)}
      if(sec==='break'&&s===0)doum(t);
      if(sec!=='intro'&&sec!=='break')riq(t,s%4===0?.05:.025);
      if(bar===SONG.len/(16*S16)-1&&s===0){doum(t);tek(t+S16*2,1)}
      sched+=S16}
    while(melIdx<SONG.mel.length&&t0+SONG.mel[melIdx].t<horizon){const m=SONG.mel[melIdx++];oud(m.pitch,t0+m.t,m.dur,.85)}}
  function sectionOf(bar){let b=0;for(const [s,n] of SECT){if(bar<b+n)return s;b+=n}return 'outro'}
  const now=()=>A?A.ac.currentTime-t0-lat:(performance.now()/1000-t0);

  /* ---------- estado ---------- */
  let state='ready',score=0,combo=0,maxCombo=0,counts,raf=0,flash=[0,0,0,0],press=[0,0,0,0],beatPulse=0,lastBeat=-1,parts=[],noteIdx=0,ended=false;
  function reset(){state='ready';score=0;combo=0;maxCombo=0;counts={p:0,g:0,ok:0,x:0};noteIdx=0;ended=false;SONG.notes.forEach(n=>{n.hit=0});parts=[];msg.hidden=false;hud()}
  function hud(){api.setScore(score.toLocaleString('es-ES')+' pts'+(combo>4?' · ×'+combo:''))}
  function begin(){if(state!=='ready')return;state='play';msg.hidden=true;api.music&&api.music.stop();
    if(!bus&&!audioInit()){t0=performance.now()/1000+LEAD_IN}else{const ac=A.ac;if(ac.state==='suspended')ac.resume();t0=ac.currentTime+LEAD_IN;sched=0;melIdx=0;startDrone(ac.currentTime+.05);
      for(let i=0;i<4;i++){tek(ac.currentTime+.25+i*BEAT*.5,i===3?1.2:.7)}
      clearInterval(schedTimer);schedTimer=setInterval(scheduler,40);scheduler()}}
  function judge(d){const a=Math.abs(d);return a<=WIN.p?'p':a<=WIN.g?'g':a<=WIN.ok?'ok':null}
  function show(k){jb.className=k;jb.textContent=T('j_'+k);void jb.offsetWidth;jb.classList.add('on');jc.textContent=combo>=5?combo+' '+T('combo'):''}
  function hitLane(l){if(state==='ready'){begin();return}if(state!=='play')return;press[l]=.12;const t=now();
    let best=null;for(let i=noteIdx;i<SONG.notes.length;i++){const n=SONG.notes[i];if(n.t-t>WIN.ok)break;if(n.lane!==l||n.hit)continue;if(Math.abs(n.t-t)<=WIN.ok){best=n;break}}
    if(!best)return;const k=judge(best.t-t);best.hit=k;counts[k]++;combo++;maxCombo=Math.max(maxCombo,combo);
    const base=k==='p'?300:k==='g'?200:100;score+=Math.round(base*(1+Math.min(combo,50)/50));flash[l]=k==='p'?1:.7;
    const x=lanesX+laneW*(l+.5);for(let i=0;i<(k==='p'?14:8);i++)parts.push({x,y:lineY,vx:(Math.random()-.5)*220,vy:-Math.random()*260-40,l:.5,c:k==='p'?'#F5C842':'#F4EFE3'});
    if(A&&bus){const ac=A.ac;nz(ac.currentTime,'bandpass',k==='p'?6000:4200,3,.1,.05)}
    show(k);hud()}
  function missNote(n){n.hit='x';counts.x++;combo=0;show('x');hud()}
  function finish(){if(ended)return;ended=true;state='over';clearInterval(schedTimer);if(A)stopDrone();
    const acc=accuracy(),rank=acc>=.95?'S':acc>=.88?'A':acc>=.75?'B':acc>=.6?'C':'D';
    if(api.ach){api.ach('hat-first');if('SA'.includes(rank))api.ach('hat-a');if(rank==='S')api.ach('hat-s');if(counts.x===0)api.ach('hat-fc')}
    setTimeout(()=>api.music&&api.music.start(),600);
    api.finish({score,unit:'pts',ankhs:Math.round(3+acc*acc*22)+(counts.x===0?5:0),
      detail:T('detail').replace('{r}',rank).replace('{a}',(acc*100).toFixed(1).replace('.',',')).replace('{c}',maxCombo).replace('{p}',counts.p).replace('{g}',counts.g).replace('{o}',counts.ok).replace('{x}',counts.x)})}
  function accuracy(){return(counts.p+counts.g*.7+counts.ok*.4)/Math.max(1,TOTAL)}

  /* ---------- entrada ---------- */
  const kd=e=>{if(e.repeat)return;const k=e.key.toLowerCase();const l=LANES.findIndex(L=>L.k.includes(k));
    if(l>=0){e.preventDefault();hitLane(l);return}if((k===' '||k==='enter')&&state==='ready'){e.preventDefault();begin()}};
  const pd=e=>{e.preventDefault();if(state==='ready'){begin();return}const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W;
    const l=Math.floor((x-lanesX)/laneW);if(touchUI){hitLane(Math.max(0,Math.min(3,l)))}else if(l>=0&&l<4)hitLane(l)};
  addEventListener('keydown',kd);wrap.addEventListener('pointerdown',pd);
  const vis=()=>{if(!A)return;if(document.hidden&&state==='play')A.ac.suspend();else if(!document.hidden&&A.ac.state==='suspended')A.ac.resume()};document.addEventListener('visibilitychange',vis);

  /* ---------- dibujo ---------- */
  function draw(dt){const t=state==='play'||state==='over'?now():-LEAD_IN;
    if(state==='play'){/* fallos por tiempo */
      while(noteIdx<SONG.notes.length&&SONG.notes[noteIdx].hit)noteIdx++;
      for(let i=noteIdx;i<SONG.notes.length;i++){const n=SONG.notes[i];if(n.t-t>-WIN.ok)break;if(!n.hit)missNote(n)}
      if(t>SONG.len+1)finish()}
    const beat=Math.floor((t)/BEAT);if(beat!==lastBeat&&t>=0){lastBeat=beat;beatPulse=1}beatPulse=Math.max(0,beatPulse-dt*3.2);
    cx.fillStyle='#06050a';cx.fillRect(0,0,W,H);
    /* templo: resplandor y columnas */
    const g=cx.createRadialGradient(W/2,lineY-H*.42,10,W/2,lineY-H*.42,W*.7);g.addColorStop(0,'rgba(201,120,40,'+(.18+beatPulse*.12).toFixed(3)+')');g.addColorStop(1,'rgba(6,5,10,0)');cx.fillStyle=g;cx.fillRect(0,0,W,H);
    for(const side of [-1,1]){if(side<0&&lanesX>230&&hReady)continue;const x=W/2+side*(laneW*2+Math.max(30,(W/2-laneW*2)*.55));if(x<-40||x>W+40)continue;const cw=Math.min(64,Math.max(26,(W/2-laneW*2)*.35));
      cx.fillStyle='#16110b';cx.fillRect(x-cw/2,40,cw,H);cx.fillStyle='rgba(201,162,39,.35)';for(let y=70;y<H;y+=46)cx.fillRect(x-cw/2,y,cw,2);
      cx.fillStyle='rgba(201,162,39,.6)';cx.fillRect(x-cw/2-6,40,cw+12,10)}
    drawHathor(t);
    /* carriles */
    for(let l=0;l<4;l++){const x=lanesX+l*laneW;const lg=cx.createLinearGradient(0,0,0,lineY);lg.addColorStop(0,'rgba(20,16,10,0)');lg.addColorStop(1,'rgba(20,16,10,.85)');cx.fillStyle=lg;cx.fillRect(x+2,0,laneW-4,lineY+40);
      if(press[l]>0){cx.fillStyle='rgba(245,200,66,'+(press[l]*1.4).toFixed(3)+')';cx.fillRect(x+2,lineY-160,laneW-4,190)}
      cx.strokeStyle='rgba(201,162,39,.22)';cx.lineWidth=1;cx.beginPath();cx.moveTo(x+.5,0);cx.lineTo(x+.5,H);cx.stroke()}
    cx.beginPath();cx.moveTo(lanesX+laneW*4+.5,0);cx.lineTo(lanesX+laneW*4+.5,H);cx.stroke();
    /* línea de juicio y receptores */
    cx.fillStyle='rgba(245,200,66,'+(.5+beatPulse*.4).toFixed(3)+')';cx.fillRect(lanesX,lineY-1.5,laneW*4,3);
    for(let l=0;l<4;l++){const x=lanesX+laneW*(l+.5),L=LANES[l],r=laneW*.32*(1+flash[l]*.18);
      cx.fillStyle='#0A0A08';cx.beginPath();cx.arc(x,lineY,r,0,Math.PI*2);cx.fill();cx.strokeStyle=L.c;cx.lineWidth=3;cx.stroke();
      if(flash[l]>0){cx.strokeStyle='rgba(245,200,66,'+flash[l].toFixed(3)+')';cx.lineWidth=6;cx.beginPath();cx.arc(x,lineY,r+6+(1-flash[l])*14,0,Math.PI*2);cx.stroke()}
      cx.fillStyle=L.c;cx.font=Math.round(laneW*.32)+'px "Noto Sans Egyptian Hieroglyphs", serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(L.g,x,lineY+1);
      if(!touchUI&&state!=='play'){cx.fillStyle='rgba(244,239,227,.55)';cx.font='600 12px "Barlow Semi Condensed", sans-serif';cx.fillText(L.n+'  '+L.k[1].toUpperCase(),x,lineY+laneW*.5+8)}
      flash[l]=Math.max(0,flash[l]-dt*3.5);press[l]=Math.max(0,press[l]-dt)}
    /* notas */
    const pxs=(lineY+30)/TRAVEL;
    for(let i=noteIdx;i<SONG.notes.length;i++){const n=SONG.notes[i];const dtn=n.t-t;if(dtn>TRAVEL+.1)break;if(n.hit&&n.hit!=='x')continue;
      const y=lineY-dtn*pxs,x=lanesX+laneW*(n.lane+.5),L=LANES[n.lane],s=laneW*.27;if(y<-30)continue;
      cx.globalAlpha=n.hit==='x'?.3:1;cx.save();cx.translate(x,y);cx.rotate(Math.PI/4);
      cx.fillStyle=L.c;cx.shadowColor='rgba(245,200,66,.6)';cx.shadowBlur=10;cx.fillRect(-s,-s,s*2,s*2);cx.shadowBlur=0;
      cx.strokeStyle='#0A0A08';cx.lineWidth=2.5;cx.strokeRect(-s,-s,s*2,s*2);cx.strokeStyle='rgba(245,200,66,.9)';cx.lineWidth=1.5;cx.strokeRect(-s*.55,-s*.55,s*1.1,s*1.1);cx.restore();cx.globalAlpha=1}
    /* partículas */
    for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=600*dt;p.l-=dt;cx.globalAlpha=Math.max(0,p.l*2);cx.fillStyle=p.c;cx.fillRect(p.x,p.y,3,3)}cx.globalAlpha=1;parts=parts.filter(p=>p.l>0);
    /* progreso de la canción */
    const pr=Math.max(0,Math.min(1,t/SONG.len));cx.fillStyle='rgba(244,239,227,.12)';cx.fillRect(lanesX,lineY+laneW*.5+24,laneW*4,4);cx.fillStyle='#C9A227';cx.fillRect(lanesX,lineY+laneW*.5+24,laneW*4*pr,4);
    /* cuenta atrás */
    if(state==='play'&&t<0){const n=Math.ceil(-t/BEAT);if(n<=3){cx.fillStyle='#F4EFE3';cx.font='400 '+Math.round(H*.12)+'px Anton, Impact, sans-serif';cx.textAlign='center';cx.fillText(String(n),W/2,lineY-H*.32)}}}
  function drawHathor(t){const side=lanesX>230;const cxp=side?lanesX*.5:W/2,cy=side?lineY-H*.36:lineY-H*.52,s=side?Math.min(H*.5,lanesX*1.1):Math.min(H*.32,W*.42);
    if(hReady){/* hoja de 4 poses: espera, izquierda, derecha, celebra */
      const fw=hImg.width/4,fh=hImg.height;let f=0;if(state==='play'&&t>=0){const b=Math.floor(t/BEAT);f=combo>=30&&b%4===3?3:1+(b%2)}else if(state==='over')f=3;
      const dh=s*1.25,dw=dh*fw/fh;cx.globalAlpha=side?1:.85;cx.drawImage(hImg,f*fw,0,fw,fh,cxp-dw/2,cy-dh*.55+beatPulse*-4,dw,dh);cx.globalAlpha=1;return}
    /* emblema: disco solar entre cuernos de vaca, late con el compás */
    const r=s*.22*(1+beatPulse*.06);cx.save();cx.translate(cxp,cy);
    cx.strokeStyle='#C9A227';cx.lineWidth=Math.max(4,s*.05);cx.lineCap='round';cx.beginPath();cx.moveTo(-r*1.9,r*.9);cx.bezierCurveTo(-r*2.4,-r*.6,-r*1.4,-r*1.9,-r*.2,-r*1.9);cx.moveTo(r*1.9,r*.9);cx.bezierCurveTo(r*2.4,-r*.6,r*1.4,-r*1.9,r*.2,-r*1.9);cx.stroke();
    const sg=cx.createRadialGradient(-r*.3,-r*.3,r*.1,0,0,r);sg.addColorStop(0,'#F06A3C');sg.addColorStop(1,'#9C2B18');cx.fillStyle=sg;cx.shadowColor='rgba(240,106,60,.7)';cx.shadowBlur=30*(1+beatPulse);cx.beginPath();cx.arc(0,0,r,0,Math.PI*2);cx.fill();cx.shadowBlur=0;
    cx.strokeStyle='#F5C842';cx.lineWidth=3;cx.stroke();cx.fillStyle='rgba(244,239,227,.8)';cx.font='600 11px "Barlow Semi Condensed", sans-serif';cx.textAlign='center';cx.fillText('',0,0);cx.restore()}
  let last=performance.now();
  function loop(ts){raf=requestAnimationFrame(loop);const dt=Math.min(.05,(ts-last)/1000||0);last=ts;draw(dt)}
  reset();raf=requestAnimationFrame(loop);
  return{restart(){clearInterval(schedTimer);if(A){stopDrone();try{bus.disconnect()}catch(e){}bus=null}reset()},
    stop(){cancelAnimationFrame(raf);clearInterval(schedTimer);if(A){stopDrone();try{bus.disconnect()}catch(e){}if(A.ac.state==='suspended')A.ac.resume()}ro.disconnect();removeEventListener('keydown',kd);document.removeEventListener('visibilitychange',vis);wrap.remove();api.music&&api.music.start()}};
}
window.TEMPLO.register('hathor',{create,help:[
  {t:'OBJETIVO',p:'Sigue el ritmo de la música de Hathor. Las notas caen por cuatro carriles: púlsalas justo cuando tocan la línea dorada.'},
  {t:'CONTROLES',p:'Teclado: ← ↓ ↑ → o D F J K, una tecla por carril. Pantalla táctil: toca el carril de cada nota, en cualquier altura. A veces caen dos notas a la vez.'},
  {t:'PUNTUACIÓN',p:'PERFECTO, BIEN o REGULAR según lo cerca que pulses. El combo multiplica los puntos hasta ×2. Al final recibes un rango de S a D según tu precisión.'},
  {t:'SONIDO',p:'Se juega mejor con sonido. Si lo tienes desactivado, puedes jugar igual siguiendo las notas.'}],texts:{
  readyTitle:'LA DANZA DE HATHOR',readyKey:'PULSA ESPACIO PARA EMPEZAR',readyTouch:'TOCA PARA EMPEZAR',
  tipKey:'← ↓ ↑ → o D F J K · pulsa cuando la nota toque la línea',tipTouch:'Toca el carril cuando la nota toque la línea',
  j_p:'¡PERFECTO!',j_g:'¡BIEN!',j_ok:'REGULAR',j_x:'FALLO',combo:'COMBO',
  detail:'Rango {r} · {a} % de precisión · combo máximo {c} · {p} perfectos, {g} bien, {o} regular, {x} fallos'}});
})();
