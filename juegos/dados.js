/* Los dados de Set — sic bo con tres dados. Fichas virtuales, sin dinero real.
   Pagos de la mesa clásica; los dados salen de crypto.getRandomValues. */
(function(){
'use strict';
const CHIPS=[10,25,100,500];
const SUMPAY={4:60,5:30,6:17,7:12,8:8,9:6,10:6,11:6,12:6,13:8,14:12,15:17,16:30,17:60};
/* cada apuesta: id, pago (x a 1) y comprobación; los números sencillos pagan según cuántos dados coincidan */
function buildBets(){const B={};
  const isTriple=d=>d[0]===d[1]&&d[1]===d[2],sum=d=>d[0]+d[1]+d[2],cnt=(d,n)=>d.filter(x=>x===n).length;
  B.small={pay:1,ok:d=>!isTriple(d)&&sum(d)<=10};B.big={pay:1,ok:d=>!isTriple(d)&&sum(d)>=11};
  B.anyt={pay:30,ok:isTriple};
  for(let n=1;n<=6;n++){B['t'+n]={pay:180,ok:d=>isTriple(d)&&d[0]===n};B['d'+n]={pay:10,ok:d=>cnt(d,n)>=2};B['n'+n]={pay:1,ok:d=>cnt(d,n)>=1,mult:d=>cnt(d,n)}}
  /* en la mesa clásica las sumas también cuentan con triples (3 y 18 no se apuestan) */
  for(let s=4;s<=17;s++)B['s'+s]={pay:SUMPAY[s],ok:d=>sum(d)===s};
  return B}
const BETS=buildBets();
function rand6(){const a=new Uint32Array(1);crypto.getRandomValues(a);return 1+a[0]%6}
const PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function dieHTML(n,cls){return '<span class="dd-die '+(cls||'')+'" data-n="'+n+'">'+Array.from({length:9},(_,i)=>'<i'+(PIPS[n].includes(i)?' class="on"':'')+'></i>').join('')+'</span>'}

const CSS=`
.dd-table{left:50%;top:70px;bottom:calc(150px + var(--ab));width:min(96%,1180px);transform:translateX(-50%);border-radius:24px;display:flex;flex-direction:column;align-items:center;padding:14px 2.2% 16px;box-sizing:border-box;gap:12px}
.dd-top{display:flex;align-items:center;justify-content:center;gap:clamp(12px,3vw,40px);width:100%}
.dd-cup{position:relative;display:flex;gap:clamp(8px,1.4vw,16px);padding:12px 18px;background:radial-gradient(ellipse,#1b1206 0%,#0a0703 70%);border:2px solid #C9A227;border-radius:50%/40%;box-shadow:inset 0 0 20px rgba(0,0,0,.8),0 6px 18px rgba(0,0,0,.5)}
.dd-die{--s:clamp(38px,5.4vw,62px);width:var(--s);height:var(--s);display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:calc(var(--s)*.12);box-sizing:border-box;background:linear-gradient(145deg,#FBF6EA,#E3D7BC);border-radius:18%;box-shadow:inset 0 -3px 0 rgba(0,0,0,.18),0 4px 0 #7A5C1E,0 6px 10px rgba(0,0,0,.5)}
.dd-die i{display:block;width:100%;height:100%;min-width:0;min-height:0;border-radius:50%;transform:scale(.7)}.dd-die i.on{background:radial-gradient(circle at 35% 35%,#3a2a14,#0A0A08)}
.dd-die[data-n="1"] i.on,.dd-die[data-n="4"] i.on{background:radial-gradient(circle at 35% 35%,#e05a3c,#8a1f10)}
.dd-die.roll{animation:ddRoll .12s linear infinite}
@keyframes ddRoll{0%{transform:translateY(0) rotate(0)}25%{transform:translateY(-14%) rotate(40deg)}50%{transform:translateY(0) rotate(90deg)}75%{transform:translateY(-8%) rotate(140deg)}100%{transform:translateY(0) rotate(180deg)}}
.dd-die.land{animation:ddLand .35s cubic-bezier(.3,1.6,.5,1)}
@keyframes ddLand{0%{transform:scale(1.25) rotate(-12deg)}100%{transform:none}}
.dd-res{min-width:120px;display:flex;flex-direction:column;align-items:center;gap:4px}
.dd-res b{font:400 clamp(30px,4vw,48px)/1 var(--f-cond);color:var(--ivory);letter-spacing:.04em}
.dd-res span{font:700 10px/1 var(--f-ui);letter-spacing:.3em;color:rgba(244,239,227,.6)}
.dd-res em{font:400 15px/1 var(--f-cond);font-style:normal;letter-spacing:.1em;color:var(--gold-hi)}
.dd-board{width:100%;flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;justify-content:center;gap:6px;scrollbar-width:thin}
.dd-row{display:grid;gap:6px}
.dd-row.a{grid-template-columns:1.25fr 2.4fr 1.25fr}.dd-row.six{grid-template-columns:repeat(6,1fr)}.dd-row.sums{grid-template-columns:repeat(14,1fr)}
.dd-trip{display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:auto auto;gap:6px}
.dd-trip .dd-cell.anyt{grid-column:1/-1}
.dd-cell{position:relative;min-height:46px;border:1.5px solid rgba(201,162,39,.75);background:rgba(10,10,8,.28);color:var(--ivory);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:5px 2px;font:400 clamp(14px,1.6vw,20px)/1 var(--f-cond);letter-spacing:.06em;transition:background .15s;-webkit-tap-highlight-color:transparent}
.dd-cell small{font:700 clamp(8px,.8vw,10px)/1 var(--f-ui);letter-spacing:.14em;color:rgba(244,239,227,.6)}
.dd-cell .mini{display:flex;gap:2px}.dd-cell .mini .dd-die{--s:clamp(14px,1.6vw,20px);box-shadow:0 1px 0 #7A5C1E;padding:calc(var(--s)*.1)}
.dd-cell.big-c{min-height:84px;font-size:clamp(20px,2.6vw,32px)}
@media (hover:hover){.dd-cell:hover{background:rgba(245,200,66,.16)}}
.dd-cell.win{background:rgba(245,200,66,.42);box-shadow:inset 0 0 0 2px #F5C842;animation:ddWin .5s ease-in-out 3}
@keyframes ddWin{50%{background:rgba(245,200,66,.7)}}
.dd-cell .tc-stack{position:absolute;right:3px;top:3px;--chw:clamp(18px,2vw,26px);pointer-events:none}
.dd-cell .amt{position:absolute;left:3px;top:3px;font:400 12px/1 var(--f-cond);background:var(--ivory);color:var(--ink);padding:2px 4px 1px;pointer-events:none}
.dd-chips{position:absolute;left:50%;bottom:calc(70px + var(--ab));transform:translateX(-50%);display:flex;gap:clamp(8px,1.6vw,16px);align-items:center;z-index:4}
.dd-chipbtn{border:0;padding:0;background:none;cursor:pointer;border-radius:50%;position:relative;transition:transform .15s}
.dd-chipbtn .tc-chip{--chw:clamp(38px,4.6vw,52px)}
.dd-chipbtn.sel{transform:translateY(-8px);filter:drop-shadow(0 0 8px rgba(245,200,66,.8))}
.dd-chipbtn[disabled]{opacity:.3;cursor:default}
.dd-chipbtn kbd{position:absolute;left:50%;bottom:-14px;transform:translateX(-50%);font:700 9px/1 var(--f-ui);color:var(--gold)}
@media (hover:none) and (pointer:coarse){.dd-chipbtn kbd{display:none}}
@media (max-aspect-ratio:1/1){.dd-table{top:64px;bottom:calc(160px + var(--ab));padding:10px 3% 12px}.dd-row.sums{grid-template-columns:repeat(7,1fr)}.dd-row.a{grid-template-columns:1fr 1fr}.dd-row.a .dd-trip{grid-column:1/-1;order:3}.dd-cell{min-height:40px}.dd-cell.big-c{min-height:52px}.dd-res{min-width:80px}}
`;

function create(stage,api){
  const C=window.TEMPLO_LIB.cartas,S=C.sounds(api),T=api.t,R=api.reduced;
  const root=C.mount(stage,CSS);const fmt=n=>Number(n).toLocaleString('es-ES');
  const START=api.casino?api.casino.chips:1000;let done=false;const persist=()=>{if(api.casino&&!done)api.casino.save(chips)};
  const cell=(id,label,sub,cls,inner)=>'<button type="button" class="dd-cell '+(cls||'')+'" data-id="'+id+'" aria-label="'+label+' '+sub+'">'+(inner||'<span>'+label+'</span>')+'<small>'+sub+'</small></button>';
  const mini=(n,k)=>'<span class="mini">'+Array.from({length:k},()=>dieHTML(n)).join('')+'</span>';
  let trip='<div class="dd-trip">';for(let n=1;n<=6;n++)trip+=cell('t'+n,T('triple')+' '+n,'180:1','',mini(n,3));trip+=cell('anyt',T('anyTriple'),'30:1','anyt')+'</div>';
  let dbl='';for(let n=1;n<=6;n++)dbl+=cell('d'+n,T('double')+' '+n,'10:1','',mini(n,2));
  let sums='';for(let s=4;s<=17;s++)sums+=cell('s'+s,String(s),SUMPAY[s]+':1');
  let nums='';for(let n=1;n<=6;n++)nums+=cell('n'+n,T('number')+' '+n,'1:1 · 2:1 · 3:1','',mini(n,1));
  root.insertAdjacentHTML('beforeend','<div class="dd-table tc-felt"><div class="dd-top"><div class="dd-cup" id="dd-cup">'+dieHTML(1)+dieHTML(3)+dieHTML(6)+'</div><div class="dd-res" id="dd-res"><span>'+T('total')+'</span><b>—</b><em></em></div></div>'+
    '<div class="dd-board"><div class="dd-row a">'+cell('small',T('small'),'4–10 · 1:1','big-c')+trip+cell('big',T('big'),'11–17 · 1:1','big-c')+'</div>'+
    '<div class="dd-row six">'+dbl+'</div><div class="dd-row sums">'+sums+'</div><div class="dd-row six">'+nums+'</div></div></div><div class="dd-chips" id="dd-chips"></div>');
  const $=s=>root.querySelector(s),cup=$('#dd-cup'),res=$('#dd-res'),chipsEl=$('#dd-chips');
  const cells={};root.querySelectorAll('.dd-cell').forEach(c=>{cells[c.dataset.id]=c;c.addEventListener('click',()=>place(c.dataset.id));
    c.addEventListener('contextmenu',e=>{e.preventDefault();removeBet(c.dataset.id)})});
  const bar=C.acts(root,api);
  let chips,chipV=10,bets={},lastBets={},hist=[],phase='bet',gen=0,st;
  const staked=()=>Object.values(bets).reduce((a,b)=>a+b,0);
  function hud(){api.setScore(fmt(chips)+' '+T('unit')+(staked()?' · '+T('onTable')+' '+fmt(staked()):''))}
  function paintCell(id){const c=cells[id];c.querySelectorAll('.tc-stack,.amt').forEach(x=>x.remove());const v=bets[id];if(!v)return;
    const s=C.stackEl(v);c.append(s);const a=document.createElement('span');a.className='amt';a.textContent=fmt(v);c.append(a)}
  function renderChips(){chipsEl.textContent='';CHIPS.forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.className='dd-chipbtn'+(v===chipV?' sel':'');
    b.setAttribute('aria-label',T('pickChip').replace('{v}',v));b.append(C.chipEl(v));const k=document.createElement('kbd');k.textContent=i+1;b.append(k);
    b.disabled=v>chips;b.addEventListener('click',()=>{chipV=v;S.chip(1);renderChips()});chipsEl.append(b)})}
  function place(id){if(phase!=='bet')return;if(chipV>chips){S.lose();return}chips-=chipV;bets[id]=(bets[id]||0)+chipV;hist.push([id,chipV]);paintCell(id);S.chip(1);
    root.querySelectorAll('.dd-cell.win').forEach(c=>c.classList.remove('win'));hud();renderChips();acts()}
  function removeBet(id){if(phase!=='bet'||!bets[id])return;chips+=bets[id];delete bets[id];hist=hist.filter(h=>h[0]!==id);paintCell(id);S.chip(2);hud();renderChips();acts()}
  function undo(){const h=hist.pop();if(!h||phase!=='bet')return;bets[h[0]]-=h[1];chips+=h[1];if(bets[h[0]]<=0)delete bets[h[0]];paintCell(h[0]);S.chip(1);hud();renderChips();acts()}
  function clear(){if(phase!=='bet')return;Object.keys(bets).forEach(id=>{chips+=bets[id];delete bets[id];paintCell(id)});hist=[];S.chip(2);hud();renderChips();acts()}
  function repeat(){if(phase!=='bet')return;const need=Object.values(lastBets).reduce((a,b)=>a+b,0);if(!need||need>chips+staked())return;clear();
    Object.entries(lastBets).forEach(([id,v])=>{chips-=v;bets[id]=v;hist.push([id,v]);paintCell(id)});S.chip(3);hud();renderChips();acts()}
  function acts(){const t=staked(),lt=Object.values(lastBets).reduce((a,b)=>a+b,0);bar.set([
    {label:T('roll'),key:'enter',keyLabel:'ENTER',on:roll,disabled:phase!=='bet'||!t},
    {label:T('undo'),key:'z',on:undo,disabled:phase!=='bet'||!hist.length,alt:true},
    {label:T('clear'),key:'b',on:clear,disabled:phase!=='bet'||!t,alt:true},
    {label:T('repeat'),key:'x',on:repeat,disabled:phase!=='bet'||!lt||t>0||lt>chips,alt:true},
    {label:T('leave'),key:'r',on:()=>end(T('left')),disabled:phase!=='bet',alt:true}])}
  async function roll(){if(phase!=='bet'||!staked())return;const g=++gen;phase='roll';lastBets=Object.assign({},bets);persist();acts();
    root.querySelectorAll('.dd-cell.win').forEach(c=>c.classList.remove('win'));res.querySelector('b').textContent='…';res.querySelector('em').textContent='';
    const dice=[rand6(),rand6(),rand6()];
    const shake=setInterval(()=>{api.noise(.05,1800,3600,.05);cup.innerHTML=[0,1,2].map(()=>dieHTML(rand6(),'roll')).join('')},R?400:110);
    api.tone(260,.08,'triangle',.04);await C.wait(R?300:1200);clearInterval(shake);if(g!==gen)return;
    cup.innerHTML=dice.map(n=>dieHTML(n,'land')).join('');api.tone(180,.07,'sine',.1);api.tone(150,.07,'sine',.08,.08);api.tone(200,.06,'sine',.07,.16);
    const sum=dice[0]+dice[1]+dice[2],trip=dice[0]===dice[1]&&dice[1]===dice[2];
    res.querySelector('b').textContent=sum;res.querySelector('em').textContent=trip?T('tripleWord'):sum<=10?T('small'):T('big');
    let pay=0,stake=0,bestNet=0;Object.entries(bets).forEach(([id,v])=>{stake+=v;const B=BETS[id];if(B.ok(dice)){const m=B.mult?B.mult(dice):1,p=v+v*B.pay*m;pay+=p;bestNet=Math.max(bestNet,p-v);cells[id].classList.add('win')}});
    /* señalar en el tablero lo que ha salido aunque no se apostara */
    if(!trip)cells[sum<=10?'small':'big'].classList.add('win');if(cells['s'+sum])cells['s'+sum].classList.add('win');
    const net=pay-stake;chips+=pay;st.rolls++;st.max=Math.max(st.max,chips);if(net>0)st.won++;persist();
    if(api.ach){if(Object.keys(bets).some(id=>id[0]==='t'&&id!=='anyt'&&BETS[id].ok(dice)))api.ach('dc-triple');if(net>=500)api.ach('dc-big')}
    await C.wait(R?100:350);if(g!==gen)return;
    if(net>0){C.banner(root,api,T('win'),'+'+fmt(net)+' '+T('unit'),net>=stake*5);if(net>=stake*5)S.big();else S.win();S.chip(3)}
    else if(net===0&&pay>0){C.banner(root,api,T('push'));S.push()}
    else{C.banner(root,api,T('lose'),'−'+fmt(-net)+' '+T('unit'));S.lose()}
    await C.wait(R?200:1300);if(g!==gen)return;
    Object.keys(bets).forEach(id=>{delete bets[id];paintCell(id)});hist=[];phase='bet';hud();renderChips();
    if(chips<CHIPS[0]){end(T('broke'));return}acts()}
  function end(reason){if(done)return;done=true;gen++;chips+=staked();bets={};bar.set([]);chipsEl.hidden=true;
    api.finish({score:chips,chips,unit:T('unit'),ankhs:0,detail:reason+' · '+T('detail').replace('{r}',st.rolls).replace('{w}',st.won).replace('{m}',fmt(st.max))})}
  const kd=e=>{if(done)return;if(bar.key(e))return;if(phase==='bet'){const n='1234'.indexOf(e.key);if(n>=0&&CHIPS[n]<=chips){e.preventDefault();chipV=CHIPS[n];S.chip(1);renderChips()}}};
  addEventListener('keydown',kd);
  function start(){gen++;done=false;chips=START;bets={};lastBets={};hist=[];phase='bet';chipV=CHIPS[0];st={rolls:0,won:0,max:START};Object.keys(cells).forEach(paintCell);chipsEl.hidden=false;hud();renderChips();acts()}
  start();
  return{restart:start,cashout:()=>chips+staked(),stop(){gen++;done=true;removeEventListener('keydown',kd);root.remove()}};
}
window.TEMPLO.register('dados',{create,help:[
  {t:'CÓMO SE JUEGA',p:'Elige una ficha, toca las casillas donde quieras apostar (puedes apostar en varias) y pulsa TIRAR. Set agita tres dados y se pagan todas las casillas que acierten. Clic derecho en una casilla retira su apuesta.'},
  {t:'PEQUEÑO Y GRANDE',p:'Pequeño gana si la suma está entre 4 y 10; Grande, entre 11 y 17. Pagan 1 a 1, pero pierden si sale un triple (tres dados iguales).'},
  {t:'SUMAS',p:'Acierta la suma exacta de los tres dados. Cuanto menos probable, más paga: de 6 a 1 (sumas del centro) hasta 60 a 1 (4 o 17).'},
  {t:'DOBLES Y TRIPLES',p:'Doble: al menos dos dados con ese número (10 a 1). Triple concreto: los tres iguales a ese número (180 a 1). Cualquier triple: los tres iguales, sea cual sea el número (30 a 1).'},
  {t:'NÚMEROS',p:'Apuesta a un número del 1 al 6: paga 1 a 1 si sale en un dado, 2 a 1 si sale en dos y 3 a 1 si sale en los tres.'},
  {t:'JUEGO LIMPIO',p:'Los dados salen del generador criptográfico del navegador. Son los pagos de la mesa clásica: la ventaja de la casa va del 2,8 % (Pequeño y Grande) a cerca del 19 % (dobles y las sumas 9 y 12).'}],texts:{
  unit:'fichas',total:'SUMA',small:'PEQUEÑO',big:'GRANDE',triple:'TRIPLE',anyTriple:'CUALQUIER TRIPLE',double:'DOBLE',number:'NÚMERO',tripleWord:'¡TRIPLE!',
  roll:'TIRAR',undo:'DESHACER',clear:'BORRAR',repeat:'REPETIR',leave:'RETIRARSE',pickChip:'Elegir ficha de {v}',onTable:'en mesa',
  win:'¡GANAS!',push:'RECUPERAS',lose:'SET SE LO LLEVA',broke:'Te has quedado sin fichas',left:'Te retiras de la mesa',
  detail:'{r} tiradas · {w} ganadoras · máximo {m} fichas'}});
})();
