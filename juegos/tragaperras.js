/* La tragaperras de Ra — 3 rodillos, 3 filas y 5 líneas. Fichas virtuales, sin dinero real.
   Rodillos de 30 posiciones con pesos fijos; parada elegida con crypto.getRandomValues.
   Retorno teórico 95,06 % (calculado de forma exacta enumerando las 8³ combinaciones por línea).
   Símbolos: iconos de la vitrina de logros (juegos/logros/iconos.webp). El disco solar de Ra es comodín. */
(function(){
'use strict';
/* índice en iconos.webp (cuadrícula 8×5) */
const SYM={sun:{i:15,n:'DISCO DE RA'},mask:{i:37,n:'MÁSCARA'},eye:{i:12,n:'OJO DE HORUS'},crown:{i:22,n:'CORONA'},cat:{i:35,n:'BASTET'},scep:{i:16,n:'CETRO'},pyr:{i:14,n:'PIRÁMIDES'},ankh:{i:39,n:'ANKH'}};
const W={sun:2,mask:2,eye:3,crown:3,cat:4,scep:5,pyr:5,ankh:6};
const PAY={sun:250,mask:70,eye:28,crown:16,cat:10,scep:6,pyr:4,ankh:3},TWO_ANKH=2,ONE_ANKH=1;
const LINES=[[1,1,1],[0,0,0],[2,2,2],[0,1,2],[2,1,0]];
const BETS=[1,2,5,10,25];
function rand(n){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}
function strip(seed){const s=[];for(const k in W)for(let i=0;i<W[k];i++)s.push(k);
  /* orden fijo distinto por rodillo (barajado determinista) */
  let x=seed;for(let i=s.length-1;i>0;i--){x=(x*1103515245+12345)&0x7fffffff;const j=x%(i+1);[s[i],s[j]]=[s[j],s[i]]}return s}
const REELS=[strip(7),strip(29),strip(113)];
function linePay(a,b,c){const t=[a,b,c];
  if(t.every(x=>x==='sun'))return{m:PAY.sun,k:'sun',n:3};
  let best=0,bk=null;for(const s in PAY){if(s==='sun')continue;if(t.every(x=>x===s||x==='sun')&&PAY[s]>best){best=PAY[s];bk=s}}
  if(best)return{m:best,k:bk,n:3};
  const isA=x=>x==='ankh'||x==='sun';
  if(isA(a)&&isA(b))return{m:TWO_ANKH,k:'ankh',n:2};
  if(isA(a))return{m:ONE_ANKH,k:'ankh',n:1};
  return null}

const CSS=`
.sl-room{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#3a1d0c 0%,#1a0d06 45%,#070403 100%)}
.sl-room::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(201,162,39,.05) 0 2px,transparent 2px 60px);pointer-events:none}
.sl-mach{position:absolute;left:50%;top:max(62px,8%);bottom:calc(100px + var(--ab));transform:translateX(-50%);aspect-ratio:.82;max-width:94%;display:flex;flex-direction:column;align-items:center;container-type:size}
.sl-top{position:relative;width:70%;aspect-ratio:3/1.15;display:grid;place-items:center;margin-bottom:-2cqh}
.sl-sun{position:absolute;width:40%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 38% 34%,#FFD27A,#F06A3C 45%,#9C2B18 80%);box-shadow:0 0 0 .8cqh #C9A227,0 0 0 1.4cqh #0A0A08,0 0 6cqh rgba(240,106,60,.55);animation:slPulse 2.6s ease-in-out infinite}
.sl-wings{position:absolute;inset:18% 0 26%;background:linear-gradient(90deg,transparent 0 2%,#C9A227 2% 40%,transparent 40% 60%,#C9A227 60% 98%,transparent 98%);clip-path:polygon(0 30%,40% 0,40% 100%,0 70%,100% 30%,60% 0,60% 100%,100% 70%);opacity:.9}
@keyframes slPulse{50%{box-shadow:0 0 0 .8cqh #C9A227,0 0 0 1.4cqh #0A0A08,0 0 9cqh rgba(240,106,60,.8)}}
.sl-title{position:relative;z-index:2;font:400 3.6cqh/1 var(--f-cond);letter-spacing:.14em;color:var(--ivory);background:var(--ink);border:.25cqh solid var(--gold-hi);padding:.8cqh 2cqh .5cqh;transform:skewX(-8deg) translateY(110%);box-shadow:.6cqh .6cqh 0 var(--gold)}
.sl-body{position:relative;width:100%;flex:1;min-height:0;background:linear-gradient(180deg,#2a1c0c,#140c05);border:.5cqh solid #C9A227;border-radius:3cqh 3cqh 1.5cqh 1.5cqh;box-shadow:0 0 0 .6cqh #0A0A08,inset 0 0 0 .5cqh rgba(0,0,0,.6),0 3cqh 5cqh rgba(0,0,0,.6);display:flex;flex-direction:column;align-items:center;padding:4cqh 4% 2.5cqh;box-sizing:border-box;gap:2cqh}
.sl-lights{position:absolute;inset:1.4cqh;border-radius:2cqh;pointer-events:none;background:radial-gradient(circle,#F5C842 0 .45cqh,transparent .55cqh) 0 0/4.2cqh 4.2cqh;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;padding:.9cqh;opacity:.55}
.sl-mach.spin .sl-lights,.sl-mach.win .sl-lights{animation:slLights .35s steps(2) infinite}
@keyframes slLights{50%{opacity:1;filter:brightness(1.6)}}
.sl-win{position:relative;width:100%;aspect-ratio:3/2.55;max-height:62%;background:#F4EFE3;border:.5cqh solid #0A0A08;box-shadow:0 0 0 .5cqh #C9A227,inset 0 1.5cqh 2cqh rgba(0,0,0,.35),inset 0 -1.5cqh 2cqh rgba(0,0,0,.35);display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden;--cell:calc(100% / 3)}
.sl-reel{position:relative;overflow:hidden;border-right:.35cqh solid rgba(10,10,8,.5)}
.sl-reel:last-child{border-right:0}
.sl-strip{position:absolute;left:0;right:0;top:0;will-change:transform}
.sl-cell{height:var(--h);display:grid;place-items:center}
.sl-ic{height:84%;max-width:84%;aspect-ratio:1;background:url("juegos/logros/iconos.webp") 0 0/800% 500% no-repeat;filter:drop-shadow(0 .3cqh 0 rgba(0,0,0,.25))}
.sl-strip.blur .sl-ic{filter:blur(1.2px)}
.sl-cell.hit{background:rgba(245,200,66,.38);animation:slHit .5s ease-in-out 3}
@keyframes slHit{50%{background:rgba(245,200,66,.7)}}
.sl-lines{position:absolute;inset:0;pointer-events:none}
.sl-lines path{fill:none;stroke:#C2412D;stroke-width:5px;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round;opacity:0;filter:drop-shadow(0 0 1px #fff)}
.sl-lines path.on{opacity:.9}
.sl-panel{width:100%;display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5cqh}
.sl-box{background:#0A0A08;border:.25cqh solid rgba(201,162,39,.7);padding:1cqh .8cqh .8cqh;display:flex;flex-direction:column;align-items:center;gap:.5cqh;min-width:0}
.sl-box small{font:700 1.5cqh/1 var(--f-ui);letter-spacing:.2em;color:rgba(244,239,227,.6);white-space:nowrap}
.sl-box b{font:400 3.6cqh/1 var(--f-cond);letter-spacing:.04em;color:var(--gold-hi);white-space:nowrap}
.sl-pay{width:100%;display:grid;grid-template-columns:repeat(4,1fr);gap:.6cqh 1.2cqh}
.sl-pay span{display:flex;align-items:center;gap:.6cqh;font:400 2.2cqh/1 var(--f-cond);color:var(--ivory);white-space:nowrap}
.sl-pay span i{display:block;width:3.2cqh;aspect-ratio:1;background:url("juegos/logros/iconos.webp") 0 0/800% 500% no-repeat}
.sl-pay span em{font-style:normal;color:rgba(244,239,227,.55);font-size:1.8cqh}
.sl-lever{position:absolute;right:-5.5%;top:30%;width:4%;height:30%;cursor:pointer}
.sl-lever::before{content:"";position:absolute;left:35%;top:6%;width:30%;bottom:0;background:linear-gradient(90deg,#7A5C1E,#F5C842,#7A5C1E);border-radius:1cqh;transform-origin:50% 100%;transition:transform .25s}
.sl-lever::after{content:"";position:absolute;left:-30%;top:-6%;width:160%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff8a6a,#C2412D 60%,#6b1a10);box-shadow:0 0 0 .3cqh #0A0A08;transition:transform .25s}
.sl-mach.pull .sl-lever::before{transform:scaleY(-.2)}.sl-mach.pull .sl-lever::after{transform:translateY(560%)}
@media (max-aspect-ratio:3/4){.sl-mach{top:64px;bottom:calc(118px + var(--ab));aspect-ratio:.72}.sl-lever{display:none}.sl-pay{grid-template-columns:repeat(2,1fr)}}
`;

function create(stage,api){
  const C=window.TEMPLO_LIB.cartas,S=C.sounds(api),T=api.t,R=api.reduced;
  const root=C.mount(stage,CSS);
  const START=api.casino?api.casino.chips:1000;let done=false;const persist=()=>{if(api.casino&&!done)api.casino.save(chips)};
  const ic=k=>{const n=SYM[k].i;return 'background-position:'+((n%8)/7*100).toFixed(3)+'% '+(Math.floor(n/8)/4*100).toFixed(3)+'%'};
  root.insertAdjacentHTML('beforeend','<div class="sl-room"></div><div class="sl-mach" id="sl-m"><div class="sl-top"><div class="sl-wings"></div><div class="sl-sun"></div><div class="sl-title">'+T('title')+'</div></div>'+
    '<div class="sl-body"><div class="sl-lights"></div><div class="sl-win" id="sl-w">'+[0,1,2].map(i=>'<div class="sl-reel"><div class="sl-strip"></div></div>').join('')+
    '<svg class="sl-lines" viewBox="0 0 30 25.5" preserveAspectRatio="none">'+LINES.map(l=>'<path d="M1 '+(l[0]*8.5+4.25)+' L5 '+(l[0]*8.5+4.25)+' L15 '+(l[1]*8.5+4.25)+' L25 '+(l[2]*8.5+4.25)+' L29 '+(l[2]*8.5+4.25)+'"/>').join('')+'</svg></div>'+
    '<div class="sl-panel"><div class="sl-box"><small>'+T('chips')+'</small><b id="sl-c">0</b></div><div class="sl-box"><small>'+T('bet')+'</small><b id="sl-b">0</b></div><div class="sl-box"><small>'+T('won')+'</small><b id="sl-g">0</b></div></div>'+
    '<div class="sl-pay">'+['sun','mask','eye','crown','cat','scep','pyr','ankh'].map(k=>'<span><i style="'+ic(k)+'"></i>×'+PAY[k]+(k==='sun'?' <em>'+T('wild')+'</em>':'')+'</span>').join('')+'</div>'+
    '<div class="sl-lever" aria-hidden="true"></div></div></div>');
  const $=s=>root.querySelector(s),mach=$('#sl-m'),winEl=$('#sl-w'),reels=[...root.querySelectorAll('.sl-reel')],strips=[...root.querySelectorAll('.sl-strip')],paths=[...root.querySelectorAll('.sl-lines path')];
  const bar=C.acts(root,api);const fmt=n=>Number(n).toLocaleString('es-ES');
  let chips,betI=1,spinning=false,stops=[0,0,0],gen=0,st;
  const cellH=()=>winEl.clientHeight/3;
  function cellHTML(k){return '<div class="sl-cell" style="--h:'+cellH()+'px"><i class="sl-ic" style="'+ic(k)+'"></i></div>'}
  const sym=(r,stop,row)=>REELS[r][(stop+row-1+30)%30];
  function paint(r){strips[r].style.transition='none';strips[r].style.transform='translateY(0)';strips[r].classList.remove('blur');strips[r].innerHTML=[0,1,2].map(row=>cellHTML(sym(r,stops[r],row))).join('')}
  function hud(){api.setScore(fmt(chips)+' '+T('unit'));$('#sl-c').textContent=fmt(chips);$('#sl-b').textContent=fmt(BETS[betI]*5)}
  function acts(){const total=BETS[betI]*5;bar.set([
    {label:T('spin'),key:'enter',keyLabel:'ENTER',on:spin,disabled:spinning||total>chips},
    {label:'−',sub:T('betLess'),key:'arrowdown',keys:['-'],keyLabel:'↓',on:()=>setBet(-1),disabled:spinning||betI===0,alt:true},
    {label:'+',sub:T('betMore'),key:'arrowup',keys:['+'],keyLabel:'↑',on:()=>setBet(1),disabled:spinning||betI===BETS.length-1||BETS[betI+1]*5>chips,alt:true},
    {label:T('leave'),key:'r',on:()=>end(T('left')),disabled:spinning,alt:true}])}
  function setBet(d){betI=Math.max(0,Math.min(BETS.length-1,betI+d));S.chip(1);hud();acts()}
  async function spin(){const total=BETS[betI]*5;if(spinning||done||total>chips)return;const g=++gen;spinning=true;
    chips-=total;persist();hud();acts();$('#sl-g').textContent='0';
    root.querySelectorAll('.sl-cell.hit').forEach(c=>c.classList.remove('hit'));paths.forEach(p=>p.classList.remove('on'));mach.classList.remove('win');
    mach.classList.add('pull','spin');setTimeout(()=>mach.classList.remove('pull'),300);api.tone(220,.12,'square',.05,0,440);
    const next=[rand(30),rand(30),rand(30)];const h=cellH();
    const tick=setInterval(()=>api.tone(1800+Math.random()*400,.02,'square',.02),70);
    await Promise.all(reels.map((_,r)=>new Promise(res=>{const n=R?3:14+r*6,cells=[];
      /* tira: lo nuevo arriba, relleno, lo actual abajo; se desplaza hacia abajo como un rodillo real */
      for(let i=0;i<3;i++)cells.push(sym(r,next[r],i));for(let i=0;i<n;i++)cells.push(REELS[r][rand(30)]);for(let i=0;i<3;i++)cells.push(sym(r,stops[r],i));
      strips[r].innerHTML=cells.map(cellHTML).join('');const dist=(cells.length-3)*h;
      strips[r].style.transition='none';strips[r].style.transform='translateY('+(-dist)+'px)';strips[r].classList.add('blur');void strips[r].offsetWidth;
      const dur=R?.25:.9+r*.38;strips[r].style.transition='transform '+dur+'s cubic-bezier(.25,.1,.25,1.06)';strips[r].style.transform='translateY(0)';
      setTimeout(()=>{if(g!==gen)return res();stops[r]=next[r];paint(r);api.tone(140,.08,'sine',.12);api.noise(.06,900,400,.08);res()},dur*1000+30)})));
    clearInterval(tick);if(g!==gen)return;mach.classList.remove('spin');
    /* premios */
    let win=0,big=null,lines=0;LINES.forEach((L,li)=>{const r=linePay(sym(0,stops[0],L[0]),sym(1,stops[1],L[1]),sym(2,stops[2],L[2]));
      if(!r)return;const p=r.m*BETS[betI];win+=p;lines++;paths[li].classList.add('on');for(let k=0;k<r.n;k++)strips[k].children[L[k]].classList.add('hit');
      if(r.n===3&&(!big||PAY[r.k]>PAY[big]))big=r.k});
    chips+=win;persist();st.spins++;st.best=Math.max(st.best,win);st.max=Math.max(st.max,chips);if(win>0)st.wins++;hud();$('#sl-g').textContent=fmt(win);
    if(api.ach&&big){if(big==='mask'||big==='sun')api.ach('sl-mask');if(big==='sun')api.ach('sl-ra')}
    if(big==='sun'){C.banner(root,api,T('jackpot'),'+'+fmt(win)+' '+T('unit'),true);S.big();mach.classList.add('win')}
    else if(win>=total*10){C.banner(root,api,T('bigWin'),'+'+fmt(win)+' '+T('unit'),true);S.big();mach.classList.add('win')}
    else if(win>total){S.win();S.chip(2)}else if(win>0)S.push();
    spinning=false;if(chips<BETS[0]*5){setTimeout(()=>end(T('broke')),900);return}
    while(betI>0&&BETS[betI]*5>chips)betI--;hud();acts()}
  function end(reason){if(done)return;done=true;gen++;bar.set([]);
    api.finish({score:chips,chips,unit:T('unit'),ankhs:0,detail:reason+' · '+T('detail').replace('{s}',st.spins).replace('{w}',st.wins).replace('{b}',fmt(st.best)).replace('{m}',fmt(st.max))})}
  const kd=e=>{if(done)return;bar.key(e)};addEventListener('keydown',kd);
  root.querySelector('.sl-lever').addEventListener('click',()=>{api.sfx.confirm();spin()});
  const ro=new ResizeObserver(()=>{if(!spinning)[0,1,2].forEach(paint)});ro.observe(winEl);
  function start(){gen++;done=false;spinning=false;chips=START;betI=chips>=50?1:0;st={spins:0,wins:0,best:0,max:START};stops=[rand(30),rand(30),rand(30)];[0,1,2].forEach(paint);hud();acts()}
  start();
  return{restart:start,cashout:()=>chips,stop(){gen++;done=true;ro.disconnect();removeEventListener('keydown',kd);root.remove()}};
}
window.TEMPLO.register('tragaperras',{create,help:[
  {t:'CÓMO SE JUEGA',p:'Elige cuánto apuestas por línea y tira de la palanca. Siempre juegas las 5 líneas: las tres filas y las dos diagonales. La apuesta total es 5 veces la apuesta por línea.'},
  {t:'PREMIOS',p:'Tres símbolos iguales en una línea pagan lo que indica la tabla multiplicado por tu apuesta por línea. El disco de Ra es comodín: sustituye a cualquier símbolo, y tres discos de Ra son el premio mayor (×250).'},
  {t:'ANKHS',p:'Un ankh en el primer rodillo de una línea te devuelve la apuesta de esa línea, y dos ankhs seguidos desde la izquierda la doblan.'},
  {t:'JUEGO LIMPIO',p:'Cada rodillo tiene 30 posiciones y se detiene al azar con el generador criptográfico del navegador. A largo plazo la máquina devuelve el 95 % de lo apostado: la casa siempre gana un poco.'}],texts:{
  title:'TRAGAPERRAS DE RA',unit:'fichas',chips:'FICHAS',bet:'APUESTA',won:'PREMIO',wild:'COMODÍN',
  spin:'TIRAR',betLess:'APUESTA',betMore:'APUESTA',leave:'RETIRARSE',
  jackpot:'¡EL SOL DE RA!',bigWin:'¡GRAN PREMIO!',broke:'Te has quedado sin fichas',left:'Te retiras de la máquina',
  detail:'{s} tiradas · {w} con premio · mayor premio {b} · máximo {m} fichas'}});
})();
