/* Mayor o menor de Maat — adivina si la siguiente carta es mayor o menor y decide cuándo cobrar.
   Baraja de 52 cartas nueva en cada ronda, barajada con crypto.getRandomValues.
   El multiplicador de cada opción sale de las cartas que quedan en la baraja: 0,97 ÷ probabilidad (ventaja de la casa del 3 %).
   El empate pierde. El as es la carta más alta. */
(function(){
'use strict';
const CHIPS=[10,25,100,500],EDGE=.97,SKIPS=3;
function cryptoShuffle(a){for(let i=a.length-1;i>0;i--){const u=new Uint32Array(1);crypto.getRandomValues(u);const j=u[0]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
const CSS=`
.mm-table{left:50%;top:76px;bottom:calc(150px + var(--ab));width:min(94%,1000px);transform:translateX(-50%);border-radius:22px 22px 50% 50%/22px 22px 36% 36%;--cw:clamp(70px,min(16vw,15vh),132px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(8px,2vh,20px);padding:16px 3%;box-sizing:border-box}
.mm-crup{position:absolute;left:50%;top:1.5%;height:33%;transform:translateX(-50%);pointer-events:none;-webkit-mask-image:linear-gradient(#000 72%,transparent);mask-image:linear-gradient(#000 72%,transparent);filter:drop-shadow(0 0 12px rgba(245,200,66,.25))}
.mm-table.has-crup{justify-content:flex-end;padding-top:calc(33% * .6)}
.mm-table.has-crup .mm-who{display:none}
.mm-who{font:700 11px/1 var(--f-ui);letter-spacing:.42em;color:rgba(244,239,227,.7);display:flex;align-items:center;gap:8px}
.mm-who b{font-family:var(--f-glyph);font-weight:400;font-size:20px;color:var(--gold-hi);letter-spacing:0}
.mm-main{display:flex;align-items:center;justify-content:center;gap:clamp(16px,4vw,54px)}
.mm-slot{position:relative;width:var(--cw);aspect-ratio:5/7;border:2px dashed rgba(201,162,39,.35);border-radius:8px;display:grid;place-items:center}
.mm-slot .tc-card{position:absolute;inset:0;width:100%}
.mm-slot small{position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);font:700 9px/1 var(--f-ui);letter-spacing:.3em;color:rgba(201,162,39,.6);white-space:nowrap}
.mm-deck .tc-card:nth-child(2){transform:translate(3px,-3px)}.mm-deck .tc-card:nth-child(3){transform:translate(6px,-6px)}
.mm-pot{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:120px}
.mm-pot span{font:700 10px/1 var(--f-ui);letter-spacing:.3em;color:rgba(244,239,227,.6)}
.mm-pot b{font:400 clamp(30px,4.4vw,52px)/1 var(--f-cond);letter-spacing:.03em;color:var(--gold-hi);text-shadow:0 2px 0 #000}
.mm-pot em{font:400 15px/1 var(--f-cond);font-style:normal;letter-spacing:.1em;color:var(--ivory)}
.mm-steps{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;min-height:calc(var(--cw)*.5);max-width:100%}
.mm-steps .tc-card{--cw:calc(var(--cw)*.36);width:var(--cw)}
.mm-steps .tc-card.ok{box-shadow:0 0 0 2px #F5C842}
.mm-odds{display:flex;gap:18px;font:600 12px/1.3 var(--f-ui);letter-spacing:.06em;color:rgba(244,239,227,.7)}
.mm-odds b{color:var(--gold-hi);font-weight:700}
.mm-chips{position:absolute;left:50%;bottom:calc(70px + var(--ab));transform:translateX(-50%);display:flex;gap:clamp(8px,1.6vw,16px);align-items:center;z-index:4}
.mm-chips[hidden]{display:none}
.mm-chipbtn{border:0;padding:0;background:none;cursor:pointer;border-radius:50%;position:relative;transition:transform .15s}
.mm-chipbtn .tc-chip{--chw:clamp(38px,4.6vw,52px)}
@media (hover:hover){.mm-chipbtn:hover{transform:translateY(-6px)}}
.mm-chipbtn[disabled]{opacity:.3;cursor:default;transform:none}
.mm-chipbtn kbd{position:absolute;left:50%;bottom:-14px;transform:translateX(-50%);font:700 9px/1 var(--f-ui);color:var(--gold)}
@media (hover:none) and (pointer:coarse){.mm-chipbtn kbd{display:none}}
@media (max-aspect-ratio:3/4){.mm-table{top:66px;bottom:calc(170px + var(--ab));--cw:clamp(70px,24vw,120px);border-radius:20px 20px 46% 46%/20px 20px 20% 20%}.mm-pot{min-width:90px}}
`;

function create(stage,api){
  const C=window.TEMPLO_LIB.cartas,S=C.sounds(api),T=api.t,R=api.reduced;
  const root=C.mount(stage,CSS);const fmt=n=>Number(n).toLocaleString('es-ES');
  const START=api.casino?api.casino.chips:1000;let done=false;const persist=()=>{if(api.casino&&!done)api.casino.save(chips)};
  root.insertAdjacentHTML('beforeend','<div class="mm-table tc-felt"><div class="mm-who"><b>𓆄</b><span>MAAT · '+T('dealer')+'</span></div>'+
    '<div class="mm-main"><div class="mm-slot mm-deck" id="mm-deck"><small id="mm-left"></small></div><div class="mm-slot" id="mm-cur"><small>'+T('current')+'</small></div>'+
    '<div class="mm-pot"><span>'+T('pot')+'</span><b id="mm-pot">0</b><em id="mm-step"></em></div></div>'+
    '<div class="mm-odds" id="mm-odds"></div><div class="mm-steps" id="mm-steps"></div></div><div class="mm-chips" id="mm-chips"></div>');
  {const t=root.querySelector('.mm-table'),im=new Image();im.className='mm-crup';im.alt='';im.onload=()=>{t.prepend(im);t.classList.add('has-crup')};im.src=api.base+'casino/maat.webp'}
  const $=s=>root.querySelector(s),deckEl=$('#mm-deck'),curEl=$('#mm-cur'),potEl=$('#mm-pot'),stepEl=$('#mm-step'),stepsEl=$('#mm-steps'),oddsEl=$('#mm-odds'),chipsEl=$('#mm-chips'),leftEl=$('#mm-left');
  for(let i=0;i<3;i++)deckEl.append(C.cardEl(null,false));
  const bar=C.acts(root,api);
  let chips,bet,lastBet=25,deck,cur,pot,steps,skips,phase,gen=0,st;
  function hud(){api.setScore(fmt(chips)+' '+T('unit'))}
  function odds(){if(!cur)return{hi:0,lo:0,mh:0,ml:0};const n=deck.length,hi=deck.filter(c=>c.v>cur.v).length/n,lo=deck.filter(c=>c.v<cur.v).length/n;
    const m=p=>p>0?Math.floor(EDGE/p*100)/100:0;let mh=m(hi),ml=m(lo);if(mh<1.01)mh=0;if(ml<1.01)ml=0;return{hi,lo,mh,ml}}
  function paintOdds(){if(phase!=='play'){oddsEl.textContent='';return}const o=odds();
    oddsEl.innerHTML='<span>'+T('higher')+': <b>'+Math.round(o.hi*100)+' %</b></span><span>'+T('lower')+': <b>'+Math.round(o.lo*100)+' %</b></span><span>'+T('tie')+': <b>'+Math.round((1-o.hi-o.lo)*100)+' %</b></span>'}
  function paintPot(){potEl.textContent=fmt(phase==='bet'?bet:pot);stepEl.textContent=phase==='play'?T('steps').replace('{n}',steps)+(skips<SKIPS?' · '+T('skipsLeft').replace('{n}',skips):''):'';leftEl.textContent=deck?T('left').replace('{n}',deck.length):''}
  function renderChips(){chipsEl.textContent='';CHIPS.forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.className='mm-chipbtn';
    b.setAttribute('aria-label',T('addChip').replace('{v}',v));b.append(C.chipEl(v));const k=document.createElement('kbd');k.textContent=i+1;b.append(k);
    b.disabled=bet+v>chips;b.addEventListener('click',()=>addBet(v));chipsEl.append(b)})}
  function addBet(v){if(phase!=='bet'||bet+v>chips)return;bet+=v;S.chip(1);renderChips();paintPot();acts()}
  function clearBet(){if(phase!=='bet')return;bet=0;S.chip(2);renderChips();paintPot();acts()}
  function acts(){if(phase==='bet'){bar.set([
      {label:T('deal'),key:'enter',keyLabel:'ENTER',on:deal,disabled:bet<CHIPS[0]||bet>chips},
      {label:T('clear'),key:'b',on:clearBet,disabled:!bet,alt:true},
      {label:T('leave'),key:'r',on:()=>end(T('leftTable')),alt:true}]);return}
    if(phase!=='play'){bar.set([]);return}
    const o=odds();bar.set([
      {label:T('higher'),sub:o.mh?'×'+o.mh.toFixed(2):'—',key:'arrowup',keys:['m'],keyLabel:'↑',on:()=>guess('hi'),disabled:!o.mh},
      {label:T('lower'),sub:o.ml?'×'+o.ml.toFixed(2):'—',key:'arrowdown',keys:['n'],keyLabel:'↓',on:()=>guess('lo'),disabled:!o.ml},
      {label:T('skip'),sub:skips+'/'+SKIPS,key:'s',on:skip,disabled:!skips||deck.length<2,alt:true},
      {label:T('cash'),sub:fmt(pot),key:'c',on:cash,disabled:steps<1,alt:true}])}
  function setCur(c,from){curEl.querySelectorAll('.tc-card').forEach(x=>x.remove());const el=C.cardEl(c,true);curEl.append(el);if(from)C.flyIn(el,from,20,R);S.deal()}
  async function deal(){if(phase!=='bet'||bet<CHIPS[0]||bet>chips)return;const g=++gen;phase='deal';lastBet=bet;chips-=bet;persist();hud();chipsEl.hidden=true;bar.set([]);
    deck=cryptoShuffle(C.deck(1));pot=bet;steps=0;skips=SKIPS;stepsEl.textContent='';st.rounds++;
    cur=deck.pop();setCur(cur,deckEl);await C.wait(R?80:380);if(g!==gen)return;phase='play';paintPot();paintOdds();acts();S.turn()}
  async function guess(kind){if(phase!=='play')return;const o=odds(),m=kind==='hi'?o.mh:o.ml;if(!m)return;const g=++gen;phase='reveal';bar.set([]);
    const prevV=cur.v,nx=deck.pop(),ok=kind==='hi'?nx.v>prevV:nx.v<prevV;
    const old=curEl.querySelector('.tc-card');if(old){old.classList.toggle('ok',ok);stepsEl.append(old)}
    setCur(nx,deckEl);await C.wait(R?80:420);if(g!==gen)return;cur=nx;
    if(ok){steps++;pot=Math.floor(pot*m);st.best=Math.max(st.best,steps);S.win();if(api.ach){if(steps>=5)api.ach('mm-5');if(steps>=10)api.ach('mm-10')}
      if(deck.length<2){paintPot();return cash(true)}phase='play';paintPot();paintOdds();acts()}
    else{S.lose();C.banner(root,api,nx.v===prevV?T('tieLose'):T('wrong'),'−'+fmt(bet)+' '+T('unit'));pot=0;paintPot();await C.wait(R?200:1500);if(g!==gen)return;nextRound()}}
  async function skip(){if(phase!=='play'||!skips||deck.length<2)return;const g=++gen;skips--;phase='reveal';bar.set([]);const nx=deck.pop();
    const old=curEl.querySelector('.tc-card');if(old){old.style.opacity='.45';stepsEl.append(old)}setCur(nx,deckEl);await C.wait(R?60:300);if(g!==gen)return;cur=nx;phase='play';paintPot();paintOdds();acts()}
  async function cash(auto){if(phase!=='play'&&!auto)return;if(steps<1)return;const g=++gen;phase='cash';bar.set([]);const net=pot-bet;chips+=pot;persist();st.cashed++;st.max=Math.max(st.max,chips);hud();
    C.banner(root,api,T('cashed'),'+'+fmt(net)+' '+T('unit'),true);S.chip(3);if(net>=bet*4)S.big();await C.wait(R?200:1500);if(g!==gen)return;nextRound()}
  function nextRound(){curEl.querySelectorAll('.tc-card').forEach(x=>x.remove());stepsEl.textContent='';deck=null;cur=null;phase='bet';bet=Math.min(lastBet,chips);if(bet<CHIPS[0])bet=0;
    oddsEl.textContent='';chipsEl.hidden=false;if(chips<CHIPS[0]){end(T('broke'));return}renderChips();paintPot();acts();hud()}
  function end(reason){if(done)return;done=true;gen++;bar.set([]);chipsEl.hidden=true;
    api.finish({score:chips,chips,unit:T('unit'),ankhs:0,detail:reason+' · '+T('detail').replace('{r}',st.rounds).replace('{c}',st.cashed).replace('{b}',st.best).replace('{m}',fmt(st.max))})}
  const kd=e=>{if(done)return;if(bar.key(e))return;if(phase==='bet'){const n='1234'.indexOf(e.key);if(n>=0){e.preventDefault();addBet(CHIPS[n])}}};
  addEventListener('keydown',kd);
  function start(){gen++;done=false;chips=START;st={rounds:0,cashed:0,best:0,max:START};deck=null;cur=null;phase='bet';bet=Math.min(lastBet,chips);if(bet<CHIPS[0])bet=0;
    curEl.querySelectorAll('.tc-card').forEach(x=>x.remove());stepsEl.textContent='';chipsEl.hidden=false;renderChips();paintPot();paintOdds();acts();hud()}
  start();
  return{restart:start,cashout:()=>chips,stop(){gen++;done=true;removeEventListener('keydown',kd);root.remove()}};
}
window.TEMPLO.register('mayormenor',{create,help:[
  {t:'CÓMO SE JUEGA',p:'Apuesta y Maat destapa una carta. Di si la siguiente será MAYOR o MENOR. Si aciertas, tu bote se multiplica; si fallas, lo pierdes. El as es la carta más alta y el empate pierde.'},
  {t:'COBRAR',p:'Tras el primer acierto puedes COBRAR en cualquier momento y te llevas el bote entero. Cuanto más arriesgas, más crece… y más puedes perder.'},
  {t:'SALTAR',p:'Tres veces por ronda puedes saltar la carta actual sin arriesgar nada, por ejemplo si te ha salido un 8 y no lo ves claro.'},
  {t:'MULTIPLICADORES',p:'Cada botón muestra cuánto multiplica tu bote. Se calcula con las cartas que quedan en la baraja: lo poco probable paga mucho y lo casi seguro paga poco.'},
  {t:'JUEGO LIMPIO',p:'Cada ronda empieza con una baraja de 52 cartas barajada con el generador criptográfico del navegador. La casa se queda un 3 % en cada predicción.'}],texts:{
  unit:'fichas',dealer:'LA BANCA',current:'CARTA ACTUAL',pot:'BOTE',steps:'{n} aciertos',skipsLeft:'{n} saltos',left:'QUEDAN {n}',
  higher:'MAYOR',lower:'MENOR',tie:'EMPATE',skip:'SALTAR',cash:'COBRAR',deal:'REPARTIR',clear:'BORRAR',leave:'RETIRARSE',addChip:'Añadir {v} fichas a la apuesta',
  wrong:'¡MAAT GANA!',tieLose:'EMPATE: GANA MAAT',cashed:'¡COBRAS!',broke:'Te has quedado sin fichas',leftTable:'Te retiras de la mesa',
  detail:'{r} rondas · {c} cobradas · mejor racha {b} aciertos · máximo {m} fichas'}});
})();
