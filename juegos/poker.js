/* Póker del Templo — Texas Hold'em contra tres rivales (Sobek, Bastet y Thot). Fichas virtuales, sin dinero real.
   Torneo: todos empiezan con 1.000 fichas y las ciegas suben cada 6 manos. */
(function(){
'use strict';
const LEVELS=[[10,20],[15,30],[25,50],[50,100],[75,150],[100,200],[150,300],[200,400],[300,600],[500,1000]];
const HANDS_PER_LEVEL=6;
const RIVALS=[
  {name:'SOBEK',glyph:'𓆋',style:{agg:.85,tight:.15,bluff:.16,slow:.05}},
  {name:'THOT',glyph:'𓅝',style:{agg:.3,tight:.75,bluff:.03,slow:.1}},
  {name:'BASTET',glyph:'𓃠',style:{agg:.55,tight:.4,bluff:.1,slow:.3}}];
const HAND_NAMES=['Carta alta','Pareja','Doble pareja','Trío','Escalera','Color','Full','Póker','Escalera de color','Escalera real'];

/* ---------- Evaluador ---------- */
const COMB=[];(function(){for(let a=0;a<7;a++)for(let b=a+1;b<7;b++)for(let c=b+1;c<7;c++)for(let d=c+1;d<7;d++)for(let e=d+1;e<7;e++)COMB.push([a,b,c,d,e])})();
function rank5(c){const vs=[c[0].v,c[1].v,c[2].v,c[3].v,c[4].v].sort((a,b)=>b-a);
  const flush=c[0].s===c[1].s&&c[0].s===c[2].s&&c[0].s===c[3].s&&c[0].s===c[4].s;
  const cnt={};for(const v of vs)cnt[v]=(cnt[v]||0)+1;
  const gr=Object.keys(cnt).map(v=>[cnt[v],+v]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
  let sh=0;if(gr.length===5){if(vs[0]-vs[4]===4)sh=vs[0];else if(vs[0]===14&&vs[1]===5)sh=5}
  let cat,k;
  if(sh&&flush){cat=8;k=[sh]}else if(gr[0][0]===4){cat=7;k=[gr[0][1],gr[1][1]]}
  else if(gr[0][0]===3&&gr[1][0]===2){cat=6;k=[gr[0][1],gr[1][1]]}else if(flush){cat=5;k=vs}
  else if(sh){cat=4;k=[sh]}else{cat=gr[0][0]===3?3:gr[0][0]===2?(gr[1][0]===2?2:1):0;k=gr.map(g=>g[1])}
  let s=cat;for(let i=0;i<5;i++)s=s*15+(k[i]||0);return s}
function best(cards){if(cards.length<5){return{score:-1,cards:[]}}
  if(cards.length===5)return{score:rank5(cards),cards:cards.slice()};
  let bs=-1,bc=null;const n=cards.length;
  for(const cb of COMB){if(cb[4]>=n)continue;const h=[cards[cb[0]],cards[cb[1]],cards[cb[2]],cards[cb[3]],cards[cb[4]]];const s=rank5(h);if(s>bs){bs=s;bc=h}}
  if(n===6){/* combinaciones de 6: las de COMB con índices <6 ya cubren todas */}
  return{score:bs,cards:bc}}
const catOf=s=>Math.floor(s/759375);
function handName(s){const c=catOf(s);if(c===8&&Math.floor(s/50625)%15===14)return HAND_NAMES[9];return HAND_NAMES[c]}
function equity(hole,board,opp,iters){const used=new Set(hole.concat(board).map(c=>c.r+c.s));
  const rest=[];['a','o','e','p'].forEach(s=>['2','3','4','5','6','7','8','9','10','J','Q','K','A'].forEach((r,i)=>{if(!used.has(r+s))rest.push({r,s,v:i+2})}));
  let win=0;const need=5-board.length;
  for(let it=0;it<iters;it++){
    for(let i=0;i<need+opp*2;i++){const j=i+Math.floor(Math.random()*(rest.length-i));const t=rest[i];rest[i]=rest[j];rest[j]=t}
    const bd=board.concat(rest.slice(0,need));const me=best(hole.concat(bd)).score;let better=0,ties=0;
    for(let o=0;o<opp;o++){const s=best([rest[need+o*2],rest[need+o*2+1]].concat(bd)).score;if(s>me){better=1;break}if(s===me)ties++}
    if(!better)win+=1/(ties+1)}
  return win/iters}

/* ---------- Rangos de manos ----------
   Fuerza preflop con la fórmula de Chen y percentil de cada mano entre las 1.326 combinaciones posibles:
   un rango del 0,3 = el 30 % de manos más fuertes. Sirve para que los rivales piensen qué puede llevar quien apuesta. */
function chen(a,b){const hi=Math.max(a.v,b.v),lo=Math.min(a.v,b.v),pts=v=>v===14?10:v===13?8:v===12?7:v===11?6:v/2;
  let s=pts(hi);if(hi===lo)return Math.max(5,s*2);if(a.s===b.s)s+=2;const gap=hi-lo-1;s-=gap<=0?0:gap===1?1:gap===2?2:gap===3?4:5;if(gap<=1&&hi<12)s+=1;return s}
const FULL=[];['a','o','e','p'].forEach(su=>['2','3','4','5','6','7','8','9','10','J','Q','K','A'].forEach((r,i)=>FULL.push({r,s:su,v:i+2})));
const PCT=(function(){const sc=[];for(let i=0;i<52;i++)for(let j=i+1;j<52;j++)sc.push(chen(FULL[i],FULL[j]));sc.sort((x,y)=>y-x);
  const m=new Map();sc.forEach((v,k)=>{m.set(v,(k+1)/sc.length)});return m})();
const handPct=(a,b)=>PCT.get(chen(a,b));
/* Equidad contra rivales con rango: cada rival roba solo manos dentro de su porcentaje (1 = cualquier mano) */
function equityR(hole,board,ranges,iters){const used=new Set(hole.concat(board).map(c=>c.r+c.s));const pool=FULL.filter(c=>!used.has(c.r+c.s)),n=pool.length;
  const need=5-board.length;let win=0;
  for(let it=0;it<iters;it++){let k=0;const opp=[];
    for(const r of ranges){let a,b;for(let t=0;t<40;t++){const i=k+Math.floor(Math.random()*(n-k));let j=k+Math.floor(Math.random()*(n-k-1));if(j>=i)j++;a=i;b=j;if(r>=1||handPct(pool[i],pool[j])<=r)break}
      const x=pool[a],y=pool[b];const ia=pool.indexOf(x);[pool[k],pool[ia]]=[pool[ia],pool[k]];const ib=pool.indexOf(y);[pool[k+1],pool[ib]]=[pool[ib],pool[k+1]];opp.push([pool[k],pool[k+1]]);k+=2}
    const bd=board.slice();for(let q=0;q<need;q++){const i=k+Math.floor(Math.random()*(n-k));[pool[k],pool[i]]=[pool[i],pool[k]];bd.push(pool[k]);k++}
    const me=best(hole.concat(bd)).score;let better=0,ties=0;
    for(const o of opp){const sc=best(o.concat(bd)).score;if(sc>me){better=1;break}if(sc===me)ties++}
    if(!better)win+=1/(ties+1)}
  return win/iters}

const CSS=`
.pk-area{position:absolute;left:10px;right:10px;top:68px;bottom:calc(92px + var(--ab));container-type:size}
.pk-table{left:50%;top:50%;width:min(86cqw,172cqh);aspect-ratio:2.05/1;transform:translate(-50%,-52%);border-radius:999px;--cw:clamp(38px,min(8.6cqw,15cqh),78px)}
.pk-arc{position:absolute;left:18%;right:18%;top:58%;aspect-ratio:1000/180;pointer-events:none}
.pk-arc svg{width:100%;height:100%}
.pk-arc text{font-family:var(--f-egypt);font-weight:700;fill:rgba(201,162,39,.42);letter-spacing:.2em}
.pk-arc text.s{fill:rgba(244,239,227,.3);font-family:var(--f-ui);letter-spacing:.45em}
.pk-board{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);display:flex;gap:calc(var(--cw)*.12)}
.pk-slot{width:var(--cw);aspect-ratio:5/7;border-radius:calc(var(--cw)*.07);border:1.5px dashed rgba(201,162,39,.22);position:relative}
.pk-slot .tc-card{position:absolute;inset:0}
.pk-pot{position:absolute;left:50%;top:17%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;--chw:22px}
.pk-pot b{font:400 clamp(16px,2cqw,24px)/1 var(--f-cond);letter-spacing:.06em;color:var(--ink);background:var(--gold-hi);padding:5px 10px 4px;transform:skewX(-10deg);box-shadow:3px 3px 0 var(--ink)}
.pk-pot small{font:700 10px/1 var(--f-ui);letter-spacing:.3em;color:rgba(244,239,227,.65)}
.pk-pot[hidden]{display:none}
.pk-lvl{position:absolute;left:50%;top:7.5%;transform:translateX(-50%);font:700 10px/1 var(--f-ui);letter-spacing:.32em;color:rgba(244,239,227,.5);white-space:nowrap}
.pk-seat{position:absolute;z-index:3;display:flex;align-items:center;gap:8px;transform:translate(-50%,-50%);transition:opacity .3s}
.pk-seat.s1{left:5%;top:50%}.pk-seat.s2{left:50%;top:0}.pk-seat.s3{left:95%;top:50%;flex-direction:row-reverse}
.pk-seat.s0{left:50%;top:94%;flex-direction:column-reverse;gap:6px}
.pk-av{position:relative;width:clamp(42px,5.4cqw,60px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 50% 35%,#2a2218,#0A0A08 70%);box-shadow:0 0 0 2px var(--gold),0 0 0 4px var(--ink),0 0 0 5px rgba(201,162,39,.5),0 6px 16px rgba(0,0,0,.6);display:grid;place-items:center;font-family:var(--f-glyph);font-size:clamp(22px,2.9cqw,32px);color:var(--gold-hi);flex:none}
.pk-plate{display:flex;flex-direction:column;gap:3px;background:var(--ink);border:1px solid rgba(201,162,39,.7);padding:5px 9px 4px;transform:skewX(-8deg);min-width:74px}
.pk-plate b{font:400 clamp(14px,1.5cqw,18px)/1 var(--f-cond);letter-spacing:.12em;color:var(--ivory)}
.pk-plate span{font:500 12px/1 var(--f-mono);color:var(--gold-hi)}
.pk-hole{display:flex;--cw:clamp(26px,3.6cqw,42px)}
.pk-hole .tc-card+.tc-card{margin-left:calc(var(--cw)*-.45)}
.pk-hole .tc-card:first-child{transform:rotate(-6deg)}.pk-hole .tc-card:last-child{transform:rotate(6deg)}
.pk-seat.s0 .pk-hole{--cw:clamp(52px,min(11cqw,19cqh),104px)}
.pk-seat.s0 .pk-hole .tc-card+.tc-card{margin-left:calc(var(--cw)*-.22)}
.pk-seat.s0 .pk-plate{flex-direction:row;align-items:baseline;gap:10px}
.pk-seat.turn .pk-av,.pk-seat.s0.turn .pk-plate{animation:pkTurn 1s ease-in-out infinite}
.pk-seat.s0.turn .pk-plate{border-color:var(--gold-hi)}
@keyframes pkTurn{50%{box-shadow:0 0 0 2px var(--gold-hi),0 0 0 4px var(--ink),0 0 18px 6px rgba(245,200,66,.55)}}
.pk-seat.fold{opacity:.42}
.pk-seat.out{opacity:.22}
.pk-seat .tc-bubble{left:50%;top:-30px;transform:translateX(-50%) skewX(-10deg)}
.pk-seat.s2 .tc-bubble{top:50%;left:calc(100% + 12px);transform:translateY(-50%) skewX(-10deg)}
.pk-seat.s0 .tc-bubble{top:auto;bottom:calc(100% + 6px)}
.pk-eq{position:absolute;left:calc(100% + 14px);top:38%;transform:translateY(-50%) skewX(-8deg);background:var(--ink);border:1px solid var(--gold);box-shadow:4px 4px 0 rgba(201,162,39,.35);padding:7px 11px 8px;display:flex;flex-direction:column;gap:5px;min-width:92px;animation:tcPop .3s ease both}
.pk-eq[hidden]{display:none}
.pk-eq small{font:700 9px/1.2 var(--f-ui);letter-spacing:.2em;color:rgba(244,239,227,.7);white-space:nowrap}
.pk-eq b{font:400 clamp(22px,2.6cqw,30px)/1 var(--f-cond);color:var(--gold-hi);font-variant-numeric:tabular-nums}
.pk-eq b.calc{opacity:.45}
.pk-eq i{display:block;height:4px;background:rgba(244,239,227,.15);position:relative}
.pk-eq i::after{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--p,0%);background:var(--gold-hi);transition:width .5s ease}
.pk-eq em{font:600 10px/1 var(--f-ui);font-style:normal;letter-spacing:.14em;color:rgba(244,239,227,.5);white-space:nowrap}
.pk-mine{font:400 clamp(14px,1.6cqw,18px)/1 var(--f-cond);letter-spacing:.1em;color:var(--gold-hi);text-shadow:0 1px 0 #000}
.pk-mine:empty{display:none}
.pk-d{position:absolute;z-index:4;width:22px;height:22px;border-radius:50%;background:var(--ivory);color:var(--ink);font:400 12px/22px var(--f-cond);text-align:center;box-shadow:0 0 0 2px var(--ink),0 0 0 3px var(--gold),0 2px 0 3px rgba(0,0,0,.4);transition:left .5s cubic-bezier(.3,1.2,.5,1),top .5s cubic-bezier(.3,1.2,.5,1);transform:translate(-50%,-50%)}
.pk-bet{position:absolute;z-index:2;display:flex;align-items:center;gap:5px;transform:translate(-50%,-50%);--chw:clamp(18px,2.2cqw,24px)}
.pk-bet span{font:400 14px/1 var(--f-cond);letter-spacing:.05em;color:var(--ivory);text-shadow:0 1px 2px #000}
.pk-bet.b0{left:50%;top:69%}.pk-bet.b1{left:21%;top:50%}.pk-bet.b2{left:50%;top:27%}.pk-bet.b3{left:79%;top:50%}
.pk-raise{position:absolute;right:max(14px,env(safe-area-inset-right,0px));bottom:calc(96px + var(--ab));z-index:6;display:flex;align-items:center;gap:6px;background:rgba(10,10,8,.92);border:1px solid var(--gold);padding:7px 8px;transform:skewX(-8deg);box-shadow:5px 5px 0 rgba(201,162,39,.4)}
.pk-raise[hidden]{display:none}
.pk-raise button{border:0;cursor:pointer;font:400 15px/1 var(--f-cond);letter-spacing:.08em;background:transparent;color:var(--ivory);box-shadow:inset 0 0 0 1.5px rgba(244,239,227,.5);padding:6px 9px 5px}
.pk-raise button:hover,.pk-raise button:focus-visible{background:var(--gold-hi);color:var(--ink);box-shadow:none}
.pk-raise output{min-width:64px;text-align:center;font:400 20px/1 var(--f-cond);color:var(--gold-hi);font-variant-numeric:tabular-nums}
.pk-raise small{font:700 9px/1 var(--f-ui);letter-spacing:.24em;color:rgba(244,239,227,.6)}
@container (max-aspect-ratio:1/1){
  .pk-table{width:min(80cqw,62cqh);aspect-ratio:1/1.55;--cw:clamp(36px,min(13.5cqw,9cqh),70px)}
  .pk-board{top:51%}
  .pk-arc{display:none}
  .pk-pot{top:37%}
  .pk-lvl{top:64%}
  .pk-seat.s1,.pk-seat.s3{flex-direction:column;gap:4px}
  .pk-seat.s1{left:6%;top:26%}.pk-seat.s3{left:94%;top:26%}
  .pk-seat.s1 .tc-bubble{left:0;transform:skewX(-10deg)}.pk-seat.s3 .tc-bubble{left:auto;right:0;transform:skewX(-10deg)}
  .pk-seat.s2 .tc-bubble{left:50%;top:auto;bottom:-28px;transform:translateX(-50%) skewX(-10deg)}
  .pk-seat.s2{top:4%}
  .pk-seat.s0{top:96%}
  .pk-hole{--cw:clamp(24px,7cqw,40px)}
  .pk-seat.s0 .pk-hole{--cw:clamp(52px,17cqw,90px)}
  .pk-plate{min-width:0;padding:4px 7px 3px}
  .pk-eq{left:calc(100% + 8px);min-width:0;padding:6px 8px 7px}
  .pk-bet.b0{top:71%}.pk-bet.b1{left:22%;top:40%}.pk-bet.b2{top:23%}.pk-bet.b3{left:78%;top:40%}
}
@media (max-width:700px){.pk-area{bottom:calc(150px + var(--ab))}.pk-raise{left:50%;right:auto;bottom:calc(104px + var(--ab));transform:translateX(-50%) skewX(-8deg)}}
`;
const HTML=`<div class="pk-area"><div class="pk-table tc-felt">
  <div class="pk-arc" aria-hidden="true"><svg viewBox="0 0 1000 180"><path id="pkArc" d="M80 10Q500 210 920 10" fill="none"/>
   <text font-size="34"><textPath href="#pkArc" startOffset="50%" text-anchor="middle">TEMPLO DE ANUBIS · HOLD'EM</textPath></text></svg></div>
  <div class="pk-lvl" id="pk-lvl"></div>
  <div class="pk-pot" id="pk-pot" hidden><small>BOTE</small><b id="pk-potv">0</b></div>
  <div class="pk-board" id="pk-board"><div class="pk-slot"></div><div class="pk-slot"></div><div class="pk-slot"></div><div class="pk-slot"></div><div class="pk-slot"></div></div>
  <div class="pk-d" id="pk-d">D</div>
</div></div>
<div class="pk-raise" id="pk-raise" hidden><small>SUBIR A</small><button type="button" data-r="-">−</button><output id="pk-rv">0</output><button type="button" data-r="+">+</button><button type="button" data-r="half">½ BOTE</button><button type="button" data-r="pot">BOTE</button></div>`;

function create(stage,api){
  const C=window.TEMPLO_LIB.cartas,S=C.sounds(api),R=api.reduced,T=api.t;
  const root=C.mount(stage,CSS);root.insertAdjacentHTML('beforeend',HTML);
  const $=s=>root.querySelector(s);
  const table=$('.pk-table'),boardEl=$('#pk-board'),potEl=$('#pk-pot'),potV=$('#pk-potv'),lvlEl=$('#pk-lvl'),dEl=$('#pk-d'),raiseEl=$('#pk-raise'),rv=$('#pk-rv');
  const slots=[...boardEl.children];
  const bar=C.acts(root,api);
  const fmt=n=>Number(n).toLocaleString('es-ES');
  let fast=false;
  const D=ms=>C.wait(R?Math.min(ms,140):fast?ms*.45:ms);

  /* --- Asientos --- */
  const players=[{name:T('you'),glyph:'',human:true}].concat(RIVALS.map(r=>Object.assign({},r))).map((p,i)=>{
    const el=document.createElement('div');el.className='pk-seat s'+i;
    el.innerHTML=p.human?'<div class="pk-plate"><b>'+p.name+'</b><span>0</span></div><div class="pk-mine"></div><div class="pk-hole"></div><div class="pk-eq" hidden aria-live="polite"><small>'+T('eqLabel')+'</small><b>—</b><i></i><em></em></div>':'<div class="pk-av" aria-hidden="true">'+p.glyph+'</div><div class="pk-plate"><b>'+p.name+'</b><span>0</span></div><div class="pk-hole"></div>';
    table.append(el);const bet=document.createElement('div');bet.className='pk-bet b'+i;table.append(bet);
    return Object.assign(p,{i,el,betEl:bet,holeEl:el.querySelector('.pk-hole'),chipsEl:el.querySelector('.pk-plate span'),mineEl:el.querySelector('.pk-mine')})});
  const me=players[0];
  const DPOS=[[50,80],[13,33],[37,12],[87,67]],DPOS_P=[[30,90],[22,17],[30,12],[78,17]];

  let hStat={act:0,raise:0},lastAgg=null,deck,board,btn,level,handNo,currentBet,minRaise,raisesSt,street,gen=0,done=false,st,pendingAct=null,raiseTo=0,between=false;
  const live=()=>players.filter(p=>!p.out);
  const inHand=()=>players.filter(p=>!p.out&&!p.folded);
  /* En el casino el montón inicial sale de la entrada en ankhs; las ciegas escalan con él */
  const START=api.casino?api.casino.chips:1000,K=START/1000;
  const blinds=()=>{const l=LEVELS[Math.min(level,LEVELS.length-1)];const r5=x=>Math.round(x/5)*5,bb=Math.max(10,r5(l[1]*K));return[Math.max(5,r5(bb/2)),bb]};
  const potTotal=()=>players.reduce((a,p)=>a+p.total,0);
  const nextIdx=(i,f)=>{for(let k=1;k<=4;k++){const j=(i+k)%4;if(f(players[j]))return j}return -1};
  function hud(){api.setScore(fmt(me.chips)+' '+T('unit'))}
  function paintSeat(p){p.chipsEl.textContent=fmt(p.chips);p.el.classList.toggle('fold',!!p.folded&&!p.out);p.el.classList.toggle('out',!!p.out);
    p.betEl.textContent='';if(p.bet>0){p.betEl.append(C.stackEl(p.bet));const s=document.createElement('span');s.textContent=fmt(p.bet);p.betEl.append(s)}}
  function paintAll(){players.forEach(paintSeat);const pt=potTotal()-players.reduce((a,p)=>a+p.bet,0);potEl.hidden=pt<=0;potV.textContent=fmt(pt);hud()}
  function bubble(p,txt,cls){p.el.querySelectorAll('.tc-bubble').forEach(x=>x.remove());if(!txt)return;const b=document.createElement('div');b.className='tc-bubble'+(cls?' '+cls:'');b.textContent=txt;p.el.append(b)}
  function turn(p){players.forEach(q=>q.el.classList.toggle('turn',q===p))}
  function placeD(){const port=table.getBoundingClientRect().width<table.getBoundingClientRect().height;const pos=(port?DPOS_P:DPOS)[btn];dEl.style.left=pos[0]+'%';dEl.style.top=pos[1]+'%'}
  /* Probabilidad de ganar del jugador contra las manos posibles de los rivales que siguen en la mano */
  let eqKey='',eqTimer=0;
  function updEq(){const box=me.el.querySelector('.pk-eq');const opp=inHand().length-1;
    if(done||me.folded||me.hole.length<2||opp<1){box.hidden=true;eqKey='';return}
    const key=me.hole.map(c=>c.r+c.s).join('')+'|'+board.length+'|'+opp;if(key===eqKey)return;eqKey=key;
    box.hidden=false;const b=box.querySelector('b');b.classList.add('calc');box.querySelector('em').textContent=T(opp===1?'eqVs1':'eqVs').replace('{n}',opp);
    clearTimeout(eqTimer);eqTimer=setTimeout(()=>{if(key!==eqKey)return;const e=equity(me.hole,board,opp,board.length===5?500:900);
      const pc=Math.round(e*100);b.textContent=pc+' %';b.classList.remove('calc');box.querySelector('i').style.setProperty('--p',pc+'%');
      box.setAttribute('aria-label',T('eqLabel')+' '+pc+' %')},30)}
  function mine(){updEq();if(me.folded||!me.hole.length){me.mineEl.textContent='';return}
    if(board.length){me.mineEl.textContent=handName(best(me.hole.concat(board)).score)}else me.mineEl.textContent=me.hole[0].v===me.hole[1].v?HAND_NAMES[1]:''}

  /* --- Acciones --- */
  function put(p,amt){amt=Math.max(0,Math.min(amt,p.chips));p.chips-=amt;p.bet+=amt;p.total+=amt;if(p.human&&api.casino&&!done)api.casino.save(p.chips);if(p.chips===0)p.allin=true;if(amt)S.chip(amt>200?3:1)}
  function apply(p,a){if(p.human&&a.t!=='fold'){hStat.act++;if(a.t==='raise')hStat.raise+=(a.to>=p.bet+p.chips)?2:1}
    if(a.t==='fold'){p.folded=true;bubble(p,T('aFold'),'x');p.holeEl.querySelectorAll('.tc-card').forEach(c=>c.classList.add('dim'))}
    else if(a.t==='check'){bubble(p,T('aCheck'))}
    else if(a.t==='call'){const amt=Math.min(currentBet-p.bet,p.chips);put(p,amt);bubble(p,p.allin?T('aAllin'):T('aCall')+' '+fmt(amt),p.allin?'k':'')}
    else if(a.t==='raise'){const to=Math.min(a.to,p.bet+p.chips);const inc=to-currentBet;put(p,to-p.bet);
      if(inc>0)lastAgg=p;if(inc>=minRaise)minRaise=inc;const wasZero=currentBet===0;currentBet=Math.max(currentBet,to);raisesSt++;
      bubble(p,p.allin?T('aAllin'):(wasZero?T('aBet'):T('aRaise'))+' '+fmt(to),'k');return inc>0}
    return false}

  function aiDecide(p){
    const opp=inHand().length-1,eq=equity(p.hole,board,Math.max(1,opp),R?110:200),s=p.style;
    const toCall=currentBet-p.bet,pot=potTotal(),bb=blinds()[1];
    const rel=eq*(opp+1)+(Math.random()-.5)*.28;
    const canRaise=p.chips>toCall&&raisesSt<4&&inHand().filter(q=>!q.allin).length>1;
    const sizeTo=f=>{let to=currentBet+Math.max(minRaise,Math.round((pot+toCall)*f/bb)*bb);if(to>=p.bet+p.chips*.7)to=p.bet+p.chips;return to};
    if(toCall===0){
      if(canRaise&&rel>1.45-.35*s.agg&&Math.random()>s.slow)return{t:'raise',to:sizeTo(.45+.4*Math.random()+(rel>2.1?.35:0))};
      if(canRaise&&Math.random()<s.bluff)return{t:'raise',to:sizeTo(.5)};
      return{t:'check'}}
    /* Ante una apuesta: equidad contra los rangos de quienes ya han puesto fichas (el que sube, más estrecho o más
       amplio según lo agresivo que haya sido) y margen por cada rival que aún tiene que hablar. */
    const facing=inHand().filter(q=>q!==p&&q.bet>0&&(q.bet>=currentBet||q.allin));
    const behind=inHand().filter(q=>q!==p&&!q.allin&&q.bet<currentBet&&!facing.includes(q)).length;
    const ranges=facing.length?facing.map(rangeOf):[1];
    const eqF=equityR(p.hole,board,ranges,R?160:320)+(Math.random()-.5)*.06;
    const odds=toCall/(pot+toCall),margin=.025*behind+.05*s.tight-.045*s.agg+(toCall>=p.chips?.02:0);
    if(canRaise&&eqF>Math.max(.62,odds+.22)-.06*s.agg&&Math.random()>s.slow*.6)return{t:'raise',to:sizeTo(.7+.5*Math.random())};
    if(eqF>=odds+margin||(toCall<=bb&&street===0&&rel>.75-s.agg*.3))return{t:'call'};
    if(canRaise&&street<3&&Math.random()<s.bluff*.35)return{t:'raise',to:sizeTo(.8)};
    return{t:'fold'}}
  /* Rango estimado de un rival: el humano se lee por su historial (cuanto más sube o va all-in, más amplio) */
  function rangeOf(q){if(q===lastAgg){if(q.human){const rate=(hStat.raise+1)/(hStat.act+5);return Math.min(1,Math.max(.12,.12+rate*1.1))}
      return Math.min(1,.18+q.style.agg*.35+q.style.bluff)}
    return lastAgg?.55:1}

  function humanTurn(){return new Promise(res=>{pendingAct=res;
    const toCall=currentBet-me.bet,bb=blinds()[1];
    const minTo=Math.min(me.bet+me.chips,currentBet+Math.max(minRaise,bb)),maxTo=me.bet+me.chips;
    raiseTo=currentBet>0?minTo:Math.min(maxTo,Math.max(minTo,Math.round(potTotal()/2/5)*5));
    const canRaise=me.chips>toCall;
    function setActs(){bar.set([
      {label:T('fold'),key:'f',on:()=>act({t:'fold'}),disabled:toCall===0,alt:true},
      toCall===0?{label:T('check'),key:'c',keys:['p'],on:()=>act({t:'check'})}:{label:T('call'),sub:toCall>=me.chips?T('allSub'):fmt(toCall),key:'c',keys:['i'],on:()=>act({t:'call'})},
      {label:currentBet?T('raise'):T('bet'),sub:fmt(raiseTo),key:'r',keys:['s'],on:()=>act({t:'raise',to:raiseTo}),disabled:!canRaise||raiseTo>=maxTo},
      {label:T('allin'),sub:fmt(maxTo),key:'a',on:()=>act({t:'raise',to:maxTo}),disabled:!canRaise}])}
    function upd(){rv.textContent=fmt(raiseTo);setActs()}
    raiseEl._step=d=>{const pot=potTotal();if(d==='+')raiseTo=Math.min(maxTo,raiseTo+bb);else if(d==='-')raiseTo=Math.max(minTo,raiseTo-bb);
      else{const f=d==='half'?.5:1;raiseTo=Math.max(minTo,Math.min(maxTo,currentBet+Math.round((pot+toCall)*f/5)*5))}S.tick();upd()};
    raiseEl.hidden=!canRaise||minTo>=maxTo;upd();turn(me);S.turn()})}
  function act(a){if(!pendingAct)return;const r=pendingAct;pendingAct=null;raiseEl.hidden=true;bar.set([]);r(a)}
  raiseEl.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&raiseEl._step)raiseEl._step(b.dataset.r)});

  /* --- Mano --- */
  async function bettingRound(first){const g=gen;if(first<0)return;
    let need=new Set(inHand().filter(p=>!p.allin).map(p=>p.i));
    if(need.size<=1){const only=players[[...need][0]];if(!only||only.bet>=currentBet)return}
    let i=first;
    while(need.size&&inHand().length>1){if(g!==gen)return;const p=players[i];
      if(need.has(i)){let a;
        if(p.human){a=await humanTurn()}else{turn(p);await D(520+Math.random()*520);if(g!==gen)return;a=aiDecide(p)}
        if(g!==gen)return;
        if(a.t==='check'&&p.bet<currentBet)a={t:'call'};
        const reopened=apply(p,a);need.delete(i);
        if(reopened)inHand().forEach(q=>{if(q!==p&&!q.allin)need.add(q.i)});
        if(p.allin)need.delete(i);
        paintAll();mine();if(p.human&&p.folded)fast=true
        await D(240)}
      i=(i+1)%4}
    turn(null)}
  async function sweep(){const g=gen;const bets=players.filter(p=>p.bet>0);if(!bets.length)return;
    potEl.hidden=false;await Promise.all(bets.map(p=>{const s=p.betEl.firstElementChild;p.betEl.querySelector('span')&&p.betEl.querySelector('span').remove();return s?C.flyOut(s,potEl,R):0}));
    if(g!==gen)return;players.forEach(p=>{p.bet=0});currentBet=0;lastAgg=null;minRaise=blinds()[1];raisesSt=0;S.chip(2);paintAll()}
  async function dealBoard(n){const g=gen;for(let k=0;k<n;k++){if(g!==gen)return;const c=deck.pop();board.push(c);const el=C.cardEl(c,false);slots[board.length-1].append(el);
    C.flyIn(el,dEl,0,R);S.deal();await D(200);C.reveal(el,c);S.flip();await D(n===3?110:260)}mine()}

  async function playHand(){const g=++gen;fast=false;between=false;bar.set([]);raiseEl.hidden=true;
    players.forEach(p=>{if(!p.out&&p.chips<=0)p.out=true});
    if(me.out)return end(false);if(live().length===1)return end(true);
    handNo++;st.hands++;level=Math.floor((handNo-1)/HANDS_PER_LEVEL);const [sb,bb]=blinds();
    if(handNo>1&&(handNo-1)%HANDS_PER_LEVEL===0){C.banner(root,api,T('blindsUp'),fmt(sb)+' / '+fmt(bb));await D(1300);if(g!==gen)return}
    lvlEl.textContent=T('level').replace('{s}',fmt(sb)).replace('{b}',fmt(bb)).replace('{n}',handNo);
    deck=C.deck(1);board=[];slots.forEach(s=>s.textContent='');
    players.forEach(p=>{p.hole=[];p.bet=0;p.total=0;p.folded=!!p.out;p.allin=false;p.holeEl.textContent='';bubble(p,'');p.el.querySelectorAll('.tc-card').forEach(c=>c.remove())});
    btn=nextIdx(btn,p=>!p.out);placeD();
    const heads=live().length===2;
    const sbI=heads?btn:nextIdx(btn,p=>!p.out),bbI=nextIdx(sbI,p=>!p.out);
    put(players[sbI],sb);put(players[bbI],bb);bubble(players[sbI],T('sb'));bubble(players[bbI],T('bb'));
    currentBet=bb;minRaise=bb;raisesSt=0;street=0;lastAgg=null;paintAll();mine();await D(450);
    for(let r=0;r<2;r++){let i=sbI;for(let k=0;k<4;k++){if(g!==gen)return;const p=players[i];
      if(!p.out){const c=deck.pop();p.hole.push(c);const el=C.cardEl(p.human?c:null,p.human);p.holeEl.append(el);C.flyIn(el,dEl,0,R);S.deal();await D(140)}
      i=(i+1)%4}}
    mine();await D(300);
    players.forEach(p=>bubble(p,''));
    await bettingRound(nextIdx(bbI,p=>!p.out));if(g!==gen)return;
    for(street=1;street<=3;street++){
      await sweep();if(g!==gen)return;
      if(inHand().length<2)break;
      await dealBoard(street===1?3:1);if(g!==gen)return;
      players.forEach(p=>{if(!p.folded)bubble(p,'')});
      await bettingRound(nextIdx(btn,p=>!p.out&&!p.folded));if(g!==gen)return}
    await sweep();if(g!==gen)return;
    turn(null);await finishHand(g)}

  function pots(){const lv=[...new Set(inHand().map(p=>p.total).filter(x=>x>0))].sort((a,b)=>a-b);let prev=0;const out=[];
    for(const L of lv){let amt=0;players.forEach(p=>{amt+=Math.max(0,Math.min(p.total,L)-prev)});out.push({amt,elig:inHand().filter(p=>p.total>=L)});prev=L}
    let left=0;players.forEach(p=>{left+=Math.max(0,p.total-prev)});if(left&&out.length)out[out.length-1].amt+=left;return out}

  async function finishHand(g){const alive=inHand();let meWon=0,title,sub,gold=false;
    if(alive.length===1){const w=alive[0],amt=potTotal();w.chips+=amt;
      if(w.human){meWon=amt;st.won++;title=T('youTake');gold=true;S.win()}else{title=T('takes').replace('{n}',w.name);S.lose()}
      sub='+'+fmt(amt)+' '+T('unit');bubble(w,'+'+fmt(amt),'k')}
    else{
      // revelar cartas
      for(const p of alive){if(!p.human){p.holeEl.querySelectorAll('.tc-card').forEach((el,k)=>C.reveal(el,p.hole[k]));S.flip();await D(260);if(g!==gen)return}}
      const res=new Map(alive.map(p=>[p,best(p.hole.concat(board))]));
      if(!me.folded){const sc=res.get(me).score;if(sc>st.best)st.best=sc}
      const ps=pots(),gains=new Map();let mainWinners=null;
      ps.forEach((pt,k)=>{const top=Math.max(...pt.elig.map(p=>res.get(p).score));const ws=pt.elig.filter(p=>res.get(p).score===top);
        const share=Math.floor(pt.amt/ws.length);let rem=pt.amt-share*ws.length;
        ws.forEach(w=>{gains.set(w,(gains.get(w)||0)+share)});
        if(rem){let j=btn;for(let n=0;n<4&&rem;n++){j=(j+1)%4;if(ws.includes(players[j])){gains.set(players[j],gains.get(players[j])+rem);rem=0}}}
        if(k===0)mainWinners=ws});
      gains.forEach((v,p)=>{p.chips+=v;bubble(p,'+'+fmt(v),'k')});
      alive.forEach(p=>{if(!gains.has(p))bubble(p,'')});
      // resaltar la jugada ganadora
      const winSet=new Set();const topW=[...gains.keys()].sort((a,b)=>res.get(b).score-res.get(a).score)[0];
      res.get(topW).cards.forEach(c=>winSet.add(c));
      const mark=el=>{const c=el._c;if(!c)return;el.classList.toggle('win',winSet.has(c));el.classList.toggle('dim',!winSet.has(c))};
      boardEl.querySelectorAll('.tc-card').forEach(mark);topW.holeEl.querySelectorAll('.tc-card').forEach(mark);
      const hn=handName(res.get(topW).score);
      if(gains.has(me)){meWon=gains.get(me);st.won++}
      if(gains.size>1&&gains.has(me)){title=T('split');sub=hn+' · +'+fmt(meWon);gold=true;S.push()}
      else if(gains.has(me)){title=T('youWin');sub=hn+' · +'+fmt(meWon);gold=true;catOf(res.get(me).score)>=5?S.big():S.win()}
      else{title=gains.size>1?T('splitOthers'):T('wins').replace('{n}',topW.name);sub=hn;S.lose()}}
    potEl.hidden=true;eqKey='done';me.el.querySelector('.pk-eq').hidden=true;players.forEach(p=>{p.total=0});paintAll();if(api.casino&&!done)api.casino.save(me.chips);st.max=Math.max(st.max,me.chips);
    C.banner(root,api,title,sub,gold);
    players.forEach(p=>{if(!p.out&&p.chips<=0){p.out=true;if(!p.human)setTimeout(()=>{if(g===gen)bubble(p,T('elim'),'x')},900)}});paintAll();
    await D(1700);if(g!==gen)return;
    if(me.out){C.banner(root,api,T('busted'),T('bustedSub'));await D(1600);if(g===gen)end(false);return}
    if(live().length===1){C.banner(root,api,T('champion'),fmt(me.chips)+' '+T('unit'),true);S.big();await D(1700);if(g===gen)end(true);return}
    between=true;bar.set([{label:T('nextHand'),key:'enter',keyLabel:'ENTER',on:()=>{if(between)playHand()}},{label:T('leave'),key:'l',on:()=>end(false,true),alt:true}])}

  function end(champ,left){if(done)return;done=true;gen++;bar.set([]);raiseEl.hidden=true;pendingAct=null;
    const reason=champ?T('rChamp'):left?T('rLeft'):T('rOut');
    api.finish({score:me.chips,chips:me.chips,unit:T('unit'),ankhs:0,detail:reason+' · '+T('detail').replace('{h}',st.hands).replace('{w}',st.won).replace('{b}',st.best>=0?handName(st.best):'—')})}

  const kd=e=>{if(done)return;if(bar.key(e))return;
    if(pendingAct&&!raiseEl.hidden){if(e.key==='ArrowUp'||e.key==='+'){e.preventDefault();raiseEl._step('+')}else if(e.key==='ArrowDown'||e.key==='-'){e.preventDefault();raiseEl._step('-')}}};
  addEventListener('keydown',kd);
  const ro=new ResizeObserver(()=>{if(btn>=0)placeD()});ro.observe(table);

  function start(){gen++;done=false;pendingAct=null;hStat={act:0,raise:0};lastAgg=null;handNo=0;level=0;btn=Math.floor(Math.random()*4);st={hands:0,won:0,best:-1,max:START};
    players.forEach(p=>{p.chips=START;p.out=false;p.folded=false;p.hole=[];p.bet=0;p.total=0;p.holeEl.textContent='';bubble(p,'')});
    slots.forEach(s=>s.textContent='');paintAll();root.querySelectorAll('.tc-banner').forEach(x=>x.remove());
    C.banner(root,api,T('welcome'),T('welcomeSub').replace('{n}',fmt(START)));setTimeout(()=>{if(!done)playHand()},R?300:1200)}
  start();
  return{restart:start,cashout:()=>me.chips,stop(){gen++;done=true;pendingAct=null;ro.disconnect();removeEventListener('keydown',kd);root.remove()}};
}
window.TEMPLO.register('poker',{create,texts:{
  unit:'fichas',you:'TÚ',eqLabel:'PROB. DE GANAR',eqVs1:'CONTRA 1 RIVAL',eqVs:'CONTRA {n} RIVALES',fold:'NO IR',check:'PASAR',call:'IGUALAR',raise:'SUBIR',bet:'APOSTAR',allin:'TODO',allSub:'TODO',
  aFold:'NO VA',aCheck:'PASA',aCall:'IGUALA',aRaise:'SUBE A',aBet:'APUESTA',aAllin:'¡ALL-IN!',sb:'CIEGA PEQUEÑA',bb:'CIEGA GRANDE',
  youTake:'¡TE LLEVAS EL BOTE!',takes:'{n} SE LLEVA EL BOTE',youWin:'¡GANAS LA MANO!',wins:'GANA {n}',split:'BOTE DIVIDIDO',splitOthers:'BOTE DIVIDIDO',
  blindsUp:'SUBEN LAS CIEGAS',level:'CIEGAS {s}/{b} · MANO {n}',elim:'ELIMINADO',
  busted:'ELIMINADO',bustedSub:'TE HAS QUEDADO SIN FICHAS',champion:'¡CAMPEÓN DE LA MESA!',
  nextHand:'SIGUIENTE MANO',leave:'LEVANTARSE',welcome:'¡A LA MESA!',welcomeSub:'TEXAS HOLD\'EM · {n} FICHAS CADA UNO',
  rChamp:'Campeón de la mesa',rLeft:'Te levantas de la mesa',rOut:'Eliminado',
  detail:'{h} manos · {w} botes ganados · mejor jugada: {b}'}});
})();
