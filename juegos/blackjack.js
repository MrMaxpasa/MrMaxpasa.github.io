/* Blackjack del Templo — contra la banca (Anubis). Fichas virtuales, sin dinero real.
   Reglas: 4 barajas, la banca se planta en 17, blackjack paga 3 a 2, doblar con 2 cartas, dividir una vez. */
(function(){
'use strict';
const MIN=10;
const CSS=`
.bj-table{left:50%;top:76px;bottom:calc(94px + var(--ab));width:min(94%,1120px);transform:translateX(-50%);border-radius:22px 22px 50% 50%/22px 22px 40% 40%;--cw:clamp(48px,min(15vw,11.5vh),104px)}
.bj-rack{position:absolute;left:50%;top:-2px;transform:translateX(-50%);display:flex;gap:3px;padding:4px 8px 5px;background:#0A0A08;border:1px solid #7A5C1E;border-top:0;border-radius:0 0 8px 8px}
.bj-rack i{display:block;width:clamp(16px,2.2vw,26px);height:8px;border-radius:2px;background:repeating-linear-gradient(90deg,var(--c) 0 3px,rgba(0,0,0,.35) 3px 4px);box-shadow:inset 0 -2px 0 rgba(0,0,0,.35)}
.bj-shoe{position:absolute;right:6%;top:7%;width:calc(var(--cw)*.78);aspect-ratio:5/7;transform:rotate(8deg)}
.bj-shoe .tc-card{position:absolute;inset:0;--cw:100%;width:100%}
.bj-shoe .tc-card:nth-child(2){transform:translate(3px,-3px)}.bj-shoe .tc-card:nth-child(3){transform:translate(6px,-6px)}
.bj-shoe::after{content:"";position:absolute;inset:-6px -8px -8px -4px;border:2px solid #7A5C1E;border-radius:6px;background:rgba(10,10,8,.35);z-index:-1}
.bj-discard{position:absolute;left:6%;top:9%;width:calc(var(--cw)*.6);aspect-ratio:5/7;border:1.5px dashed rgba(201,162,39,.25);border-radius:6px;transform:rotate(-8deg)}
.bj-dealer{position:absolute;left:0;right:0;top:6%;display:flex;flex-direction:column;align-items:center;gap:8px}
.bj-who{font:700 11px/1 var(--f-ui);letter-spacing:.42em;color:rgba(244,239,227,.7);display:flex;align-items:center;gap:8px}
.bj-who b{font-family:var(--f-glyph);font-weight:400;font-size:18px;color:var(--gold-hi);letter-spacing:0}
.bj-row{display:flex;align-items:center;gap:12px;min-height:calc(var(--cw)*1.4)}
.bj-cards{display:flex;align-items:center}
.bj-cards .tc-card{transform:rotate(var(--rot,0deg))}
.bj-cards .tc-card+.tc-card{margin-left:calc(var(--cw)*-.52)}
.bj-arcbox{position:absolute;left:10%;right:10%;top:34%;aspect-ratio:1000/260;max-height:24%;margin:0 auto;pointer-events:none}
.bj-arcbox svg{width:100%;height:100%}
.bj-arcbox text{font-family:var(--f-egypt);font-weight:700;fill:rgba(201,162,39,.6);letter-spacing:.14em}
.bj-arcbox text.s{fill:rgba(244,239,227,.32);font-family:var(--f-ui);letter-spacing:.4em}
.bj-hands{position:absolute;left:0;right:0;top:52%;display:flex;justify-content:center;gap:clamp(16px,5vw,70px)}
.bj-hands.betting .bj-row{min-height:0}
.bj-hands.betting .tc-val{display:none}
.bj-hbox{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;transition:opacity .3s}
.bj-hbox.idle{opacity:.5}
.bj-hbox.act::after{content:"𓋹";position:absolute;left:50%;top:-30px;transform:translateX(-50%);font-family:var(--f-glyph);font-size:22px;color:var(--gold-hi);text-shadow:0 0 10px rgba(245,200,66,.8);animation:bjBob .7s ease-in-out infinite}
@keyframes bjBob{50%{transform:translate(-50%,-5px)}}
.bj-spot{position:relative;width:calc(var(--cw)*.86);aspect-ratio:1;border-radius:50%;border:2px solid rgba(201,162,39,.7);box-shadow:0 0 0 5px rgba(10,10,8,.35),inset 0 0 0 4px rgba(201,162,39,.12);display:grid;place-items:center;--chw:calc(var(--cw)*.5)}
.bj-spot::before{content:"APUESTA";position:absolute;bottom:-17px;font:700 9px/1 var(--f-ui);letter-spacing:.3em;color:rgba(201,162,39,.55)}
.bj-amt{position:absolute;right:-12px;top:-8px;font:400 15px/1 var(--f-cond);letter-spacing:.04em;background:var(--ivory);color:var(--ink);padding:4px 7px 3px;transform:skewX(-10deg);box-shadow:3px 3px 0 var(--gold)}
.bj-amt:empty{display:none}
.bj-res{position:absolute;top:calc(var(--cw)*.55);left:50%;transform:translateX(-50%) skewX(-10deg);font:400 clamp(16px,2vw,22px)/1 var(--f-cond);letter-spacing:.1em;padding:5px 10px 4px;z-index:3;animation:tcPop .3s cubic-bezier(.3,1.8,.5,1) both;white-space:nowrap}
.bj-res.w{background:var(--gold-hi);color:var(--ink);box-shadow:3px 3px 0 var(--ink)}
.bj-res.l{background:var(--ink);color:rgba(244,239,227,.6);box-shadow:0 0 0 1.5px rgba(244,239,227,.3)}
.bj-res.p{background:var(--ivory);color:var(--ink);box-shadow:3px 3px 0 var(--gold)}
.bj-chips{position:absolute;left:50%;bottom:4.5%;transform:translateX(-50%);display:flex;gap:clamp(8px,1.6vw,16px);align-items:center;z-index:2}
.bj-chips[hidden]{display:none}
.bj-chipbtn{border:0;padding:0;background:none;cursor:pointer;border-radius:50%;position:relative;transition:transform .15s}
.bj-chipbtn .tc-chip{--chw:clamp(40px,5.2vw,56px)}
.bj-chipbtn:hover,.bj-chipbtn:focus-visible{transform:translateY(-6px)}
.bj-chipbtn:focus-visible{outline:2px solid var(--gold-hi);outline-offset:3px}
.bj-chipbtn[disabled]{opacity:.3;cursor:default;transform:none}
.bj-chipbtn kbd{position:absolute;left:50%;bottom:-15px;transform:translateX(-50%);font:700 9px/1 var(--f-ui);color:var(--gold);letter-spacing:.1em}
.bj-hint{position:absolute;left:0;right:0;bottom:calc(4.5% + clamp(40px,5.2vw,56px) + 26px);text-align:center;font:700 11px/1 var(--f-ui);letter-spacing:.3em;color:rgba(244,239,227,.6)}
.bj-hint[hidden]{display:none}
@media (hover:none) and (pointer:coarse){.bj-chipbtn kbd{display:none}}
@media (max-aspect-ratio:3/4){.bj-table{top:70px;bottom:calc(112px + var(--ab));width:94%;--cw:clamp(52px,min(19vw,11vh),96px);border-radius:20px 20px 46% 46%/20px 20px 22% 22%}.bj-arcbox{top:31%;left:4%;right:4%}.bj-hands{top:45%}.bj-shoe{right:5%;top:5%}.bj-discard{left:5%;top:6%}}
`;
const HTML=`<div class="bj-table tc-felt">
  <div class="bj-rack" aria-hidden="true"><i style="--c:#F4EFE3"></i><i style="--c:#2456B8"></i><i style="--c:#C9A227"></i><i style="--c:#0A0A08"></i><i style="--c:#14705C"></i><i style="--c:#C9A227"></i><i style="--c:#2456B8"></i><i style="--c:#F4EFE3"></i></div>
  <div class="bj-discard" aria-hidden="true"></div><div class="bj-shoe" aria-hidden="true"></div>
  <div class="bj-arcbox" aria-hidden="true"><svg viewBox="0 0 1000 260"><path id="bjArc1" d="M70 20Q500 290 930 20" fill="none"/><path id="bjArc2" d="M170 78Q500 352 830 78" fill="none"/>
    <text font-size="36"><textPath href="#bjArc1" startOffset="50%" text-anchor="middle">LA BANCA PAGA BLACKJACK 3 A 2</textPath></text>
    <text class="s" font-size="19"><textPath href="#bjArc2" startOffset="50%" text-anchor="middle">LA BANCA SE PLANTA EN 17</textPath></text></svg></div>
  <div class="bj-dealer"><div class="bj-who"><b>𓁢</b><span>ANUBIS · LA BANCA</span></div><div class="bj-row"><div class="bj-cards" id="bj-dc"></div><span class="tc-val" id="bj-dv" hidden></span></div></div>
  <div class="bj-hands" id="bj-hands"></div>
  <p class="bj-hint" id="bj-hint"></p>
  <div class="bj-chips" id="bj-chips"></div>
</div>`;

function create(stage,api){
  const C=window.TEMPLO_LIB.cartas,S=C.sounds(api),R=api.reduced,T=api.t;
  const root=C.mount(stage,CSS);root.insertAdjacentHTML('beforeend',HTML);
  const $=s=>root.querySelector(s);
  const shoeEl=$('.bj-shoe'),discard=$('.bj-discard'),dcEl=$('#bj-dc'),dvEl=$('#bj-dv'),handsEl=$('#bj-hands'),chipsEl=$('#bj-chips'),hint=$('#bj-hint');
  for(let i=0;i<3;i++)shoeEl.append(C.cardEl(null,false));
  const bar=C.acts(root,api);
  const fmt=n=>Number(n).toLocaleString('es-ES');
  const D=ms=>C.wait(R?Math.min(ms,120):ms);
  /* En el casino las fichas salen de tus ankhs (1 ankh = 10 fichas) y se guardan tras cada movimiento */
  const START=api.casino?api.casino.chips:1000,persist=()=>{if(api.casino&&!done)api.casino.save(chips)};

  let shoe,chips,bet,lastBet,hands,dealer,active,phase,gen=0,done=false,st;
  function hud(){api.setScore(fmt(chips)+' '+T('unit'))}
  function newShoe(){shoe=C.deck(4)}
  function draw(){if(shoe.length<20)newShoe();return shoe.pop()}
  function val(cs){let t=0,a=0;cs.forEach(c=>{if(!c)return;if(c.r==='A'){a++;t+=11}else t+=c.v>10?(c.r==='10'?10:10):c.v});
    while(t>21&&a){t-=10;a--}return{t,soft:a>0}}
  const ten=c=>c.v>=10&&c.r!=='A';
  const isBJ=h=>h.cards.length===2&&val(h.cards).t===21&&!h.split;
  function badge(el,cs,hideHole){const over=el===dvEl?T('dOver'):T('bust');const vis=hideHole?cs.slice(0,1):cs;const v=val(vis);el.hidden=!vis.length;
    el.textContent=v.t>21?over+' · '+v.t:(cs.length===2&&!hideHole&&v.t===21&&el._bj?'BLACKJACK':(v.soft&&v.t<21?(v.t-10)+'/'+v.t:v.t));
    el.classList.toggle('over',v.t>21);el.classList.toggle('top',v.t===21)}

  /* --- Mesa --- */
  function hbox(h,i){const b=document.createElement('div');b.className='bj-hbox';
    b.innerHTML='<div class="bj-row"><div class="bj-cards"></div><span class="tc-val" hidden></span></div><div class="bj-spot"><span class="bj-amt"></span></div>';
    h.el=b;h.cardsEl=b.querySelector('.bj-cards');h.valEl=b.querySelector('.tc-val');h.spot=b.querySelector('.bj-spot');h.amt=b.querySelector('.bj-amt');
    handsEl.append(b);paintBet(h);return b}
  function paintBet(h){h.spot.querySelectorAll('.tc-stack').forEach(x=>x.remove());if(h.bet>0){const s=C.stackEl(h.bet);h.spot.prepend(s)}h.amt.textContent=h.bet?fmt(h.bet):''}
  function addCard(cardsEl,c,up,flipLater){const el=C.cardEl(up?c:null,up);el.style.setProperty('--rot',((cardsEl.children.length%2?1:-1)*(1+Math.random()*2.5)).toFixed(1)+'deg');
    cardsEl.append(el);C.flyIn(el,shoeEl,20,R);S.deal();return el}

  /* --- Fase de apuesta --- */
  function betPhase(){phase='bet';handsEl.classList.add('betting');hands=[{cards:[],bet:Math.min(lastBet,chips)}];handsEl.textContent='';hbox(hands[0]);
    if(hands[0].bet<MIN)hands[0].bet=0;paintBet(hands[0]);bet=hands[0].bet;
    if(chips<MIN){return end(T('broke'))}
    chipsEl.hidden=false;hint.hidden=false;hint.textContent=T('betHint');renderChips();betActs();hud()}
  function renderChips(){chipsEl.textContent='';[10,25,100,500].forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.className='bj-chipbtn';
    b.setAttribute('aria-label',T('addChip').replace('{v}',v));b.append(C.chipEl(v));const k=document.createElement('kbd');k.textContent=i+1;b.append(k);
    b.disabled=bet+v>chips;b.addEventListener('click',()=>addBet(v));chipsEl.append(b)})}
  function addBet(v){if(phase!=='bet'||bet+v>chips)return;bet+=v;hands[0].bet=bet;paintBet(hands[0]);S.chip(1);renderChips();betActs()}
  function clearBet(){if(phase!=='bet')return;bet=0;hands[0].bet=0;paintBet(hands[0]);S.chip(2);renderChips();betActs()}
  function betActs(){bar.set([
    {label:T('deal'),key:'enter',keyLabel:'ENTER',on:deal,disabled:bet<MIN||bet>chips},
    {label:T('clear'),key:'b',on:clearBet,disabled:!bet,alt:true},
    {label:T('leave'),key:'r',on:()=>end(T('left')),alt:true}])}

  /* --- Reparto --- */
  async function deal(){if(phase!=='bet'||bet<MIN||bet>chips)return;const g=++gen;phase='deal';
    lastBet=bet;chips-=bet;persist();hud();chipsEl.hidden=true;hint.hidden=true;bar.set([]);handsEl.classList.remove('betting');
    // las cartas anteriores ya se retiraron al empezar la apuesta; reiniciamos la banca
    dcEl.textContent='';dvEl.hidden=true;dvEl._bj=false;dealer={cards:[],holeEl:null};
    const h=hands[0];h.cards=[];h.cardsEl.textContent='';st.hands++;
    const seq=[['p',true],['d',true],['p',true],['d',false]];
    for(const [who,up] of seq){if(g!==gen)return;const c=draw();
      if(who==='p'){h.cards.push(c);addCard(h.cardsEl,c,true);badge(h.valEl,h.cards)}
      else{dealer.cards.push(c);const el=addCard(dcEl,c,up);if(!up)dealer.holeEl=el;badge(dvEl,dealer.cards,true)}
      await D(300)}
    if(g!==gen)return;
    if(isBJ(h)){h.valEl._bj=true;badge(h.valEl,h.cards);await D(300);revealHole();badge(dvEl,dealer.cards);await D(350);return settle(g)}
    phase='play';active=0;focusHand();playActs()}
  function revealHole(){if(dealer.holeEl){C.reveal(dealer.holeEl,dealer.cards[1]);S.flip();dealer.holeEl=null}}
  function focusHand(){hands.forEach((h,i)=>{h.el.classList.toggle('act',hands.length>1&&i===active&&phase==='play');h.el.classList.toggle('idle',hands.length>1&&i!==active&&phase==='play')})}
  function playActs(){const h=hands[active];const two=h.cards.length===2;
    const canSplit=two&&hands.length===1&&(h.cards[0].r===h.cards[1].r||(ten(h.cards[0])&&ten(h.cards[1])))&&chips>=h.bet;
    bar.set([
      {label:T('hit'),key:'h',keys:['p'],on:hit},
      {label:T('stand'),key:'s',keys:['q'],on:stand},
      {label:T('double'),key:'d',on:dbl,disabled:!(two&&chips>=h.bet)},
      {label:T('split'),key:'v',on:split,disabled:!canSplit}])
    S.turn()}
  async function hit(){if(phase!=='play')return;const g=gen,h=hands[active],c=draw();h.cards.push(c);addCard(h.cardsEl,c,true);badge(h.valEl,h.cards);bar.set([]);
    await D(330);if(g!==gen)return;const t=val(h.cards).t;
    if(t>21){S.lose();next()}else if(t===21)next();else playActs()}
  function stand(){if(phase!=='play')return;next()}
  async function dbl(){if(phase!=='play')return;const g=gen,h=hands[active];if(chips<h.bet)return;chips-=h.bet;persist();h.bet*=2;h.doubled=true;paintBet(h);S.chip(2);hud();
    const c=draw();h.cards.push(c);const el=addCard(h.cardsEl,c,true);el.style.setProperty('--rot','90deg');badge(h.valEl,h.cards);bar.set([]);
    await D(420);if(g!==gen)return;if(val(h.cards).t>21)S.lose();next()}
  async function split(){if(phase!=='play')return;const g=gen,h=hands[0];if(chips<h.bet)return;chips-=h.bet;persist();hud();S.chip(2);bar.set([]);
    const c2=h.cards.pop();h.cards[0]&&(h.split=true);const h2={cards:[c2],bet:h.bet,split:true};hands.push(h2);
    const moved=h.cardsEl.lastElementChild;hbox(h2);h2.cardsEl.append(moved);badge(h.valEl,h.cards);badge(h2.valEl,h2.cards);
    const aces=h.cards[0].r==='A';
    for(const hh of hands){await D(320);if(g!==gen)return;const c=draw();hh.cards.push(c);addCard(hh.cardsEl,c,true);badge(hh.valEl,hh.cards)}
    await D(300);if(g!==gen)return;
    if(aces){active=hands.length;return dealerTurn()}
    active=0;if(val(h.cards).t===21)return next();focusHand();playActs()}
  function next(){active++;while(active<hands.length&&val(hands[active].cards).t===21)active++;
    if(active<hands.length){focusHand();playActs()}else dealerTurn()}
  async function dealerTurn(){const g=gen;phase='dealer';focusHand();bar.set([]);await D(250);if(g!==gen)return;
    revealHole();if(val(dealer.cards).t===21)dvEl._bj=true;badge(dvEl,dealer.cards);await D(520);
    const live=hands.some(h=>val(h.cards).t<=21);
    while(live&&val(dealer.cards).t<17){if(g!==gen)return;const c=draw();dealer.cards.push(c);addCard(dcEl,c,true);badge(dvEl,dealer.cards);await D(560)}
    if(g!==gen)return;settle(g)}

  /* --- Liquidación --- */
  async function settle(g){phase='settle';const dv=val(dealer.cards).t,dBJ=dealer.cards.length===2&&dv===21;let pay=0,staked=0,bj=false,anyWin=false;
    let lossLeft=lastBet;/* con blackjack de la banca solo se pierde la apuesta inicial: lo doblado o dividido se devuelve */
    hands.forEach(h=>{staked+=h.bet;const pv=val(h.cards).t;let res,p=0,lost=h.bet;
      if(dBJ&&!isBJ(h)){lost=Math.min(h.bet,lossLeft);lossLeft-=lost;p=h.bet-lost;res=lost>0?'l':'p'}
      else if(pv>21){res='l'}
      else if(isBJ(h)){if(dBJ){res='p';p=h.bet}else{res='w';p=h.bet+Math.floor(h.bet*1.5);bj=true}}
      else if(dv>21||pv>dv){res='w';p=h.bet*2}
      else if(pv===dv){res='p';p=h.bet}
      else res='l';
      pay+=p;if(res==='w'){anyWin=true;if(h.doubled&&api.ach)api.ach('bj-double')}
      const tag=document.createElement('div');tag.className='bj-res '+res;tag.textContent=res==='w'?'+'+fmt(p-h.bet):res==='p'?(dBJ&&!isBJ(h)?T('refund'):T('push')):'−'+fmt(lost);h.el.append(tag);
      if(res!=='p')h.cardsEl.querySelectorAll('.tc-card').forEach(c=>c.classList.add(res==='l'?'dim':'win'))});
    chips+=pay;persist();if(api.ach){if(bj)api.ach('bj-bj');if(chips>=2000)api.ach('bj-2000')}const net=pay-staked;st.max=Math.max(st.max,chips);if(anyWin)st.won++;if(bj)st.bj++;hud();
    if(bj){C.banner(root,api,'¡BLACKJACK!','+'+fmt(net)+' '+T('unit'),true);S.big()}
    else if(net>0){C.banner(root,api,dv>21?T('dealerBust'):T('youWin'),'+'+fmt(net)+' '+T('unit'),true);S.win();S.chip(3)}
    else if(net===0&&pay>0){C.banner(root,api,T('pushBig'));S.push()}
    else{const allBust=hands.every(h=>val(h.cards).t>21);C.banner(root,api,dBJ?T('dealerBJ'):allBust?T('busted'):T('houseWins'),'−'+fmt(-net)+' '+T('unit'));S.lose()}
    await D(1700);if(g!==gen)return;
    // retirar cartas al descarte
    const old=[...root.querySelectorAll('.bj-cards .tc-card')];old.forEach(el=>C.flyOut(el,discard,R));root.querySelectorAll('.bj-res').forEach(x=>x.remove());
    dvEl.hidden=true;await D(260);if(g!==gen)return;betPhase()}

  function end(reason){if(done)return;done=true;gen++;bar.set([]);chipsEl.hidden=true;hint.hidden=true;
    api.finish({score:chips,chips,unit:T('unit'),ankhs:0,detail:reason+' · '+T('detail').replace('{h}',st.hands).replace('{w}',st.won).replace('{b}',st.bj).replace('{m}',fmt(st.max))})}

  const kd=e=>{if(done||phase==='end')return;if(bar.key(e))return;
    if(phase==='bet'){const n='1234'.indexOf(e.key);if(n>=0){e.preventDefault();addBet([10,25,100,500][n])}}};
  addEventListener('keydown',kd);

  function start(){gen++;done=false;chips=START;lastBet=50;st={hands:0,won:0,bj:0,max:START};newShoe();dcEl.textContent='';dvEl.hidden=true;root.querySelectorAll('.tc-banner').forEach(x=>x.remove());betPhase()}
  start();
  return{restart:start,cashout:()=>chips,stop(){gen++;done=true;removeEventListener('keydown',kd);root.remove()}};
}
window.TEMPLO.register('blackjack',{create,help:[
  {t:'OBJETIVO',p:'Acercarte a 21 más que Anubis sin pasarte. Las figuras valen 10 y el as vale 1 u 11, lo que más te convenga.'},
  {t:'LA MANO',p:'Eliges tu apuesta y recibes dos cartas boca arriba. La banca recibe una boca arriba y otra boca abajo, que solo destapa cuando terminas.'},
  {t:'TUS ACCIONES',p:'PEDIR: otra carta. PLANTARSE: te quedas como estás. DOBLAR: doblas la apuesta y recibes una sola carta más. DIVIDIR: con dos cartas del mismo valor, las separas en dos manos con la misma apuesta cada una.'},
  {t:'LA BANCA',p:'Anubis pide carta hasta tener 17 o más y entonces se planta. Si se pasa de 21, ganan todas tus manos que sigan en juego.'},
  {t:'PAGOS',p:'Ganar paga 1 a 1. Blackjack (as + figura o 10 con las dos primeras cartas) paga 3 a 2. Empate: recuperas la apuesta. Si la banca tiene blackjack, solo pierdes la apuesta inicial: lo doblado o dividido se te devuelve.'}],texts:{
  unit:'fichas',deal:'REPARTIR',clear:'BORRAR',leave:'RETIRARSE',hit:'PEDIR',stand:'PLANTARSE',double:'DOBLAR',split:'DIVIDIR',
  bust:'TE PASAS',dOver:'SE PASA',refund:'DEVUELTA',dealerBJ:'¡BLACKJACK DE LA BANCA!',push:'EMPATE',pushBig:'EMPATE',youWin:'¡GANAS!',dealerBust:'¡LA BANCA SE PASA!',houseWins:'GANA LA BANCA',busted:'TE HAS PASADO',
  betHint:'ELIGE TU APUESTA Y REPARTE',addChip:'Añadir {v} fichas a la apuesta',
  broke:'Te has quedado sin fichas',left:'Te retiras de la mesa',
  detail:'{h} manos · {w} ganadas · {b} blackjacks · máximo {m} fichas'}});
})();
