/* Senet de Jonsu — el juego de mesa de los faraones contra el dios de la Luna. Fichas virtuales, sin dinero real.
   Reglas (reconstrucción de Kendall, simplificada): 5 piezas por jugador en un tablero de 30 casillas en zigzag.
   Tirada con 4 tablillas: 1-4 según las caras claras, 0 claras = 5. Con 1, 4 o 5 se vuelve a tirar.
   Caer sobre una pieza rival la intercambia, salvo si está protegida en pareja o en una casilla segura.
   Tres piezas seguidas bloquean el paso. Hay que caer exacto en la 26; la 27 (agua) devuelve a la 15.
   Se sale del tablero con tirada exacta: 26+5, 28+3, 29+2, 30+1. */
(function(){
'use strict';
const N=5,MIN=10;
const SAFE=new Set([26,28,29,30]);
const SPECIAL={15:{g:'𓋹',k:'renace'},26:{g:'𓄤',k:'belleza'},27:{g:'𓈗',k:'agua'},28:{g:'III',k:'tres'},29:{g:'II',k:'dos'},30:{g:'𓇳',k:'sol'}};
const sqPos=s=>{const i=s-1,r=Math.floor(i/10),c=r===1?9-(i%10):i%10;return[c,r]};

const CONE='<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="35" rx="13" ry="3.5" fill="rgba(0,0,0,.45)"/><path d="M20 3C17 3 9.5 25 8.5 31.5c-.3 2.2 4.6 4 11.5 4s11.8-1.8 11.5-4C30.5 25 23 3 20 3z" fill="#F5C842" stroke="#0A0A08" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 6c-1.5 1-5.5 14-6.6 21" stroke="#FFF3C2" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/><path d="M10 30.5c3 1.8 17 1.8 20 0" stroke="#7A5C1E" stroke-width="1.6" fill="none"/></svg>';
const SPOOL='<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="35" rx="13" ry="3.5" fill="rgba(0,0,0,.45)"/><path d="M8 9c0-3 24-3 24 0v2c0 2-6 3-7 6v6c1 3 7 4 7 6v3c0 3-24 3-24 0v-3c0-2 6-3 7-6v-6c-1-3-7-4-7-6z" fill="#C9CED6" stroke="#0A0A08" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="20" cy="9" rx="12" ry="2.6" fill="#EEF1F5" stroke="#0A0A08" stroke-width="1.6"/><path d="M14 17h12M14 23h12" stroke="#7E8794" stroke-width="1.4"/></svg>';

const CSS=`
.sn-wrap{position:absolute;left:0;right:0;top:64px;bottom:calc(86px + var(--ab));container-type:size}
.sn-deco{position:absolute;inset:-64px 0 0;pointer-events:none;background:repeating-linear-gradient(118deg,transparent 0 38px,rgba(122,92,30,.12) 38px 40px)}
.sn-deco::after{content:"";position:absolute;right:-4%;top:-6%;width:46%;height:70%;transform:skewX(-14deg);background:radial-gradient(circle,rgba(201,206,214,.16) 1.1px,transparent 1.7px) 0 0/9px 9px;-webkit-mask-image:linear-gradient(200deg,#000 10%,transparent 78%);mask-image:linear-gradient(200deg,#000 10%,transparent 78%)}
.sn-main{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,.62fr) minmax(0,2fr);gap:clamp(12px,2cqw,30px);padding:0 max(18px,env(safe-area-inset-right,0px)) 0 max(18px,env(safe-area-inset-left,0px));align-items:center}
.sn-left{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0}
.sn-jonsu{width:min(100%,46cqh);filter:drop-shadow(0 0 12px rgba(201,206,214,.25))}
.sn-jonsu img{display:block;width:100%}
.sn-say{position:absolute;left:0;right:0;top:4%;z-index:3;font:600 clamp(12px,1.25cqw,15px)/1.32 var(--f-ui);background:var(--ivory);color:var(--ink);padding:8px 11px 7px;transform:skewX(-8deg);box-shadow:4px 4px 0 #9EA6B3;animation:tcPop .3s cubic-bezier(.3,1.8,.5,1) both}
.sn-say::before{content:"JONSU";display:block;font:700 9px/1 var(--f-ui);letter-spacing:.3em;color:#5d6673;margin-bottom:3px}
.sn-right{display:flex;flex-direction:column;gap:clamp(10px,1.8cqh,18px);min-width:0;justify-content:center;height:100%}
.sn-score{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.sn-side{display:flex;align-items:center;gap:8px;font:700 10px/1 var(--f-ui);letter-spacing:.24em;color:rgba(244,239,227,.65)}
.sn-side .pcs{display:flex;gap:3px}
.sn-side .pcs i{width:clamp(16px,1.9cqw,22px);aspect-ratio:1;opacity:.25;display:block}
.sn-side .pcs i.on{opacity:1}
.sn-side .pcs i svg{display:block;width:100%}
.sn-side b{font:400 clamp(15px,1.6cqw,20px)/1 var(--f-cond);letter-spacing:.06em;color:var(--gold-hi)}
.sn-side.j b{color:#DDE2E9}
.sn-boardwrap{position:relative;padding:clamp(10px,1.3cqw,16px);background:linear-gradient(160deg,#3a2a14,#1c140a);border:1.5px solid var(--ivory);box-shadow:8px 8px 0 rgba(201,162,39,.85)}
.sn-boardwrap::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle,rgba(201,162,39,.14) 1px,transparent 1.6px) 0 0/8px 8px}
.sn-tag{position:absolute;top:-11px;left:14px;z-index:6;font:700 9.5px/1 var(--f-ui);letter-spacing:.22em;background:var(--lapis);color:var(--ivory);padding:5px 8px 4px;transform:skewX(-10deg)}
.sn-board{position:relative;display:grid;grid-template-columns:repeat(10,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr));gap:4px;aspect-ratio:10/3.15;width:100%}
.sn-sq{position:relative;grid-column:calc(var(--c) + 1);grid-row:calc(var(--r) + 1);background:repeating-linear-gradient(0deg,rgba(122,92,30,.09) 0 2px,transparent 2px 7px),#E6D7B3;box-shadow:inset 0 0 0 2px #0A0A08;display:grid;place-items:center;border:0;padding:0;cursor:default;font:400 clamp(11px,1.15cqw,15px)/1 var(--f-cond);color:rgba(10,10,8,.35)}
.sn-sq .no{position:absolute;left:4px;top:3px;font:600 9px/1 var(--f-mono);color:rgba(10,10,8,.4)}
.sn-sq.sp{background:linear-gradient(160deg,#F5C842,#B8901F);color:var(--ink)}
.sn-sq.sp .gl{font-family:var(--f-glyph);font-size:clamp(18px,2.4cqw,30px);line-height:1;color:var(--ink);opacity:.75}
.sn-sq.sp.t .gl{font-family:var(--f-cond);font-size:clamp(14px,1.8cqw,22px);letter-spacing:.1em}
.sn-sq.w{background:linear-gradient(160deg,#2a5ea8,#163a7c)}.sn-sq.w .gl{color:#BFD3F2;opacity:.9}
.sn-sq .ar{position:absolute;right:3px;bottom:2px;font:700 10px/1 var(--f-ui);color:rgba(10,10,8,.28)}
.sn-sq.tgt{cursor:pointer;box-shadow:inset 0 0 0 3px var(--gold-hi),0 0 0 2px var(--ink),0 0 18px rgba(245,200,66,.7);animation:snPulse .9s ease-in-out infinite;z-index:2}
@keyframes snPulse{50%{filter:brightness(1.18)}}
.sn-sq.last{box-shadow:inset 0 0 0 3px rgba(201,206,214,.85)}
.sn-off{position:absolute;right:-2px;top:50%;transform:translate(100%,-50%);display:none}
.sn-pieces{position:absolute;inset:0;pointer-events:none}
.sn-pc{position:absolute;left:calc((var(--c) + .5) * 10%);top:calc((var(--r) + .5) * 33.333%);width:min(8.4%,calc(30% - 6px));aspect-ratio:1;transform:translate(-50%,-56%);transition:left .38s cubic-bezier(.3,1.1,.4,1),top .38s cubic-bezier(.3,1.1,.4,1),opacity .3s,transform .3s;border:0;padding:0;background:none;pointer-events:none;z-index:3}
.sn-pc svg{display:block;width:100%;filter:drop-shadow(0 2px 0 rgba(0,0,0,.35))}
.sn-pc.mov{pointer-events:auto;cursor:pointer;animation:snBob .7s ease-in-out infinite;z-index:4}
.sn-pc.mov svg{filter:drop-shadow(0 0 7px rgba(245,200,66,.95))}
.sn-pc.sel{transform:translate(-50%,-70%) scale(1.15);animation:none}
.sn-pc.sel svg{filter:drop-shadow(0 0 10px rgba(255,255,255,.95)) drop-shadow(0 0 4px rgba(245,200,66,1))}
.sn-pc.gone{opacity:0;transform:translate(-50%,-140%) scale(.5)}
@keyframes snBob{50%{transform:translate(-50%,-68%)}}
.sn-play{display:flex;align-items:center;gap:clamp(12px,2cqw,24px);flex-wrap:wrap}
.sn-sticks{display:flex;gap:clamp(6px,.9cqw,10px);perspective:400px}
.sn-stick{width:clamp(14px,1.6cqw,20px);height:clamp(58px,8cqh,80px);border-radius:8px;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.3,1.4,.5,1)}
.sn-stick i{position:absolute;inset:0;border-radius:8px;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:inset 0 0 0 2px #0A0A08}
.sn-stick .l{background:repeating-linear-gradient(0deg,#E6D7B3 0 10px,#cdbb91 10px 12px)}
.sn-stick .d{background:#1c140a;transform:rotateY(180deg)}
.sn-stick .d::after{content:"";position:absolute;left:50%;top:18%;bottom:18%;width:2px;transform:translateX(-50%);background:rgba(201,162,39,.55)}
.sn-stick.dk{transform:rotateY(180deg)}
.sn-stick.throw{animation:snThrow .55s cubic-bezier(.3,.6,.4,1)}
@keyframes snThrow{30%{transform:translateY(-34px) rotateY(540deg) rotateZ(18deg)}60%{transform:translateY(-8px) rotateY(900deg)}}
.sn-res{display:flex;flex-direction:column;gap:5px}
.sn-res b{font:400 clamp(30px,3.6cqw,46px)/1 var(--f-cond);color:var(--ink);background:var(--gold-hi);padding:4px 14px 2px;transform:skewX(-10deg);box-shadow:4px 4px 0 var(--ivory);min-width:1.4em;text-align:center}
.sn-res b:empty{display:none}
.sn-res small{font:700 10px/1.3 var(--f-ui);letter-spacing:.24em;color:var(--gold-hi)}
.sn-turn{margin-left:auto;font:400 clamp(16px,1.7cqw,22px)/1 var(--f-cond);letter-spacing:.08em;padding:6px 12px 4px;transform:skewX(-10deg);white-space:nowrap}
.sn-turn.p{background:var(--gold-hi);color:var(--ink);box-shadow:3px 3px 0 var(--ivory)}
.sn-turn.j{background:#C9CED6;color:var(--ink);box-shadow:3px 3px 0 #5d6673}
.sn-bet{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.sn-bet[hidden]{display:none}
.sn-chip{border:0;padding:0;background:none;cursor:pointer;border-radius:50%;transition:transform .15s}
.sn-chip .tc-chip{--chw:clamp(36px,4cqw,48px)}
.sn-chip.on{transform:translateY(-5px)}.sn-chip.on .tc-chip{box-shadow:0 0 0 3px var(--gold-hi),0 0 16px rgba(245,200,66,.6)}
.sn-chip[disabled]{opacity:.3;cursor:default}
.sn-betv{font:400 clamp(16px,1.7cqw,22px)/1 var(--f-cond);letter-spacing:.06em;color:var(--ink);background:var(--gold-hi);padding:6px 11px 4px;transform:skewX(-10deg);box-shadow:3px 3px 0 var(--ivory)}
.sn-betv small{font:700 10px/1 var(--f-ui);letter-spacing:.2em;margin-right:6px}
.sn-hint{font:600 12px/1.3 var(--f-ui);color:rgba(244,239,227,.6)}
.tc-act{--fs:clamp(18px,2.1vw,30px)}
@container (max-aspect-ratio:1/1){
  .sn-main{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) auto;align-items:stretch;gap:10px}
  .sn-left{flex-direction:row;height:auto;justify-content:flex-start;align-items:flex-end;gap:10px}
  .sn-jonsu{width:min(24cqw,17cqh);flex:none;order:2;margin-left:auto}
  .sn-say{position:relative;left:auto;right:auto;top:auto;flex:1;align-self:center;font-size:12.5px}
  .sn-right{display:contents}
  .sn-score{order:1}
  .sn-boardwrap{min-height:0;display:flex;justify-content:center;box-shadow:5px 5px 0 rgba(201,162,39,.85)}
  .sn-board{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(10,minmax(0,1fr));aspect-ratio:auto;height:100%;width:min(100%,calc((100cqh - 230px) * .62))}
  .sn-sq{grid-column:calc(var(--r) + 1);grid-row:calc(var(--c) + 1)}
  .sn-pc{left:calc((var(--r) + .5) * 33.333%);top:calc((var(--c) + .5) * 10%);width:min(24%,calc(10% * 1.9))}
  .sn-play{gap:12px}.sn-stick{height:52px;width:15px}
  .sn-turn{font-size:15px}
}
`;

function create(stage,api){
  const C=window.TEMPLO_LIB.cartas,S=C.sounds(api),R=api.reduced,T=api.t;
  const root=C.mount(stage,CSS);
  const fmt=n=>Number(n).toLocaleString('es-ES');
  const D=ms=>C.wait(R?Math.min(ms,140):ms);
  root.insertAdjacentHTML('beforeend',`<div class="sn-wrap"><div class="sn-deco"></div><div class="sn-main">
    <div class="sn-left"><div class="sn-say" id="sn-say" role="status"></div><div class="sn-jonsu" id="sn-jonsu" aria-hidden="true"></div></div>
    <div class="sn-right">
      <div class="sn-score"><span class="sn-side p"><span>${T('you')}</span><span class="pcs" id="sn-op"></span><b id="sn-opn">0/5</b></span><span class="sn-side j"><b id="sn-ojn">0/5</b><span class="pcs" id="sn-oj"></span><span>JONSU</span></span></div>
      <div class="sn-boardwrap"><span class="sn-tag">${T('tag')}</span><div class="sn-board" id="sn-board" role="group" aria-label="${T('boardAria')}"><div class="sn-pieces" id="sn-pieces"></div></div></div>
      <div class="sn-play"><div class="sn-sticks" id="sn-sticks" aria-hidden="true"></div><div class="sn-res"><b id="sn-resv"></b><small id="sn-rest"></small></div>
        <div class="sn-bet" id="sn-bet"></div><span class="sn-turn" id="sn-turn"></span></div>
    </div></div></div>`);
  const $=s=>root.querySelector(s);
  const board=$('#sn-board'),piecesEl=$('#sn-pieces'),say=$('#sn-say'),sticksEl=$('#sn-sticks'),resv=$('#sn-resv'),rest=$('#sn-rest'),turnEl=$('#sn-turn'),betEl=$('#sn-bet');
  const img=new Image();img.alt='';img.onload=()=>$('#sn-jonsu').append(img);img.src=api.base+'casino/jonsu.webp';
  /* casillas */
  const sqEl={};
  for(let s=1;s<=30;s++){const [c,r]=sqPos(s);const el=document.createElement('button');el.type='button';el.tabIndex=-1;
    const sp=SPECIAL[s];el.className='sn-sq'+(sp?' sp'+(s===27?' w':'')+(sp.g.length<=3&&/^[IV]+$/.test(sp.g)?' t':''):'');
    el.style.setProperty('--c',c);el.style.setProperty('--r',r);
    el.innerHTML='<span class="no">'+s+'</span>'+(sp?'<span class="gl">'+sp.g+'</span>':'')+(s%10===0&&s<30?'<span class="ar">'+(r===0?'↓':'↓')+'</span>':'');
    el.setAttribute('aria-label',T('sqAria').replace('{n}',s)+(sp?' · '+T('sp_'+sp.k):''));
    el.addEventListener('click',()=>{if(phase==='choose'&&targetMap[s]!==undefined)doMove(targetMap[s])});
    board.insertBefore(el,piecesEl);sqEl[s]=el}
  for(let i=0;i<4;i++){const st=document.createElement('div');st.className='sn-stick';st.innerHTML='<i class="l"></i><i class="d"></i>';sticksEl.append(st)}
  const sticks=[...sticksEl.children];
  const offIcons=(el,svg)=>{el.innerHTML=Array.from({length:N},()=>'<i>'+svg+'</i>').join('')};offIcons($('#sn-op'),CONE);offIcons($('#sn-oj'),SPOOL);

  /* --- estado --- */
  const START=api.casino?api.casino.chips:1000;
  let chips,bet,chip,phase,gen=0,done=false,st,pieces,turn,roll,moves,selIdx,targetMap,firstP,matchStats;
  const persist=()=>{if(api.casino&&!done)api.casino.save(chips)};
  function hud(){api.setScore(fmt(chips)+' '+T('unit'))}
  function talk(t){say.textContent=t;say.style.animation='none';void say.offsetWidth;say.style.animation=''}
  const bar=C.acts(root,api);

  function occ(s){return pieces.find(p=>p.pos===s)}
  function render(){piecesEl.textContent='';pieces.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='sn-pc '+p.side;b.innerHTML=p.side==='p'?CONE:SPOOL;
      b.setAttribute('aria-label',(p.side==='p'?T('yourPiece'):T('hisPiece'))+' '+p.pos);
      b.addEventListener('click',()=>{if(phase!=='choose'||!b.classList.contains('mov'))return;const i=moves.findIndex(m=>m.p===p);if(i<0)return;if(selIdx===i)doMove(i);else{selIdx=i;paintSel()}});
      p.el=b;place(p);piecesEl.append(b)});paintOff()}
  function place(p){if(p.pos>30){p.el.classList.add('gone');return}const [c,r]=sqPos(p.pos);p.el.style.setProperty('--c',c);p.el.style.setProperty('--r',r);p.el.classList.remove('gone')}
  function paintOff(){const op=pieces.filter(p=>p.side==='p'&&p.pos>30).length,oj=pieces.filter(p=>p.side==='j'&&p.pos>30).length;
    $('#sn-op').querySelectorAll('i').forEach((i,k)=>i.classList.toggle('on',k<op));$('#sn-oj').querySelectorAll('i').forEach((i,k)=>i.classList.toggle('on',k<oj));
    $('#sn-opn').textContent=op+'/'+N;$('#sn-ojn').textContent=oj+'/'+N}

  /* --- reglas --- */
  function protectedAt(s,side){/* pieza de "side" en s protegida por una compañera adyacente en el camino */
    const n1=occ(s-1),n2=occ(s+1);return (n1&&n1.side===side)||(n2&&n2.side===side)}
  function blocked(from,to,side){/* tres piezas rivales seguidas dentro del recorrido (excluyendo la casilla de destino) */
    let run=0;for(let s=from+1;s<to;s++){const o=occ(s);if(o&&o.side!==side){run++;if(run>=3)return true}else run=0}return false}
  function legal(side,v){const out=[];
    pieces.filter(p=>p.side===side&&p.pos<=30).forEach(p=>{const s=p.pos,t=s+v;
      if(t>31)return;if(s<26&&t>26)return;
      if(t===31){out.push({p,from:s,to:31});return}
      const o=occ(t);if(o&&o.side===side)return;
      if(o){if(SAFE.has(t)||t===15&&false||protectedAt(t,o.side))return}
      if(blocked(s,t,side))return;
      out.push({p,from:s,to:t,hit:o||null})});
    return out}
  function throwSticks(){const lights=Array.from({length:4},()=>Math.random()<.5);const k=lights.filter(Boolean).length;return{lights,v:k===0?5:k}}

  /* --- apuesta --- */
  function betPhase(){phase='bet';selIdx=-1;moves=[];targetMap={};clearMarks();
    if(chips<MIN)return end(T('broke'));
    if(bet>chips||!bet)bet=Math.min(chips,Math.max(MIN,bet||25));
    resv.textContent='';rest.textContent=T('betHint');turnEl.textContent='';turnEl.className='sn-turn';
    renderBet();bar.set([{label:T('play'),key:'enter',keyLabel:'ENTER',keys:[' '],on:startMatch,disabled:bet<MIN||bet>chips},{label:T('leave'),key:'l',on:()=>end(T('left')),alt:true}]);hud()}
  function renderBet(){betEl.hidden=false;betEl.textContent='';[10,25,100,500].forEach(v=>{const b=document.createElement('button');b.type='button';b.className='sn-chip';b.append(C.chipEl(v));
      b.setAttribute('aria-label',T('addChip').replace('{v}',v));b.disabled=bet+v>chips;b.addEventListener('click',()=>{if(bet+v<=chips){bet+=v;S.chip(1);renderBet();betPhaseActs()}});betEl.append(b)});
    const c=document.createElement('button');c.type='button';c.className='sn-chip';c.innerHTML='<span class="sn-betv"><small>'+T('bet')+'</small>'+fmt(bet)+'</span>';c.title=T('clearBet');
    c.addEventListener('click',()=>{bet=0;S.chip(2);renderBet();betPhaseActs()});betEl.append(c)}
  function betPhaseActs(){bar.set([{label:T('play'),key:'enter',keyLabel:'ENTER',keys:[' '],on:startMatch,disabled:bet<MIN||bet>chips},{label:T('leave'),key:'l',on:()=>end(T('left')),alt:true}])}

  /* --- partida --- */
  function startMatch(){if(phase!=='bet'||bet<MIN||bet>chips)return;chips-=bet;persist();hud();betEl.hidden=true;st.matches++;
    pieces=[];for(let i=0;i<N;i++){pieces.push({side:'p',pos:1+2*i});pieces.push({side:'j',pos:2+2*i})}
    matchStats={hits:0};render();resv.textContent='';
    turn=firstP;firstP=firstP==='p'?'j':'p';
    C.banner(root,api,T('matchStart'),T('matchSub').replace('{b}',fmt(bet)));talk(T('sayStart'));
    setTimeout(()=>{if(!done&&pieces)nextTurn()},R?200:1300)}
  function nextTurn(){const g=gen;if(done)return;phase=turn==='p'?'throw':'ai';
    turnEl.textContent=turn==='p'?T('yourTurn'):T('hisTurn');turnEl.className='sn-turn '+turn;
    if(turn==='p'){bar.set([{label:T('throw'),key:'enter',keyLabel:'ENTER',keys:[' '],on:doThrow},{label:T('forfeit'),key:'r',on:forfeit,alt:true}]);rest.textContent=T('throwHint');S.turn()}
    else{bar.set([]);setTimeout(()=>{if(g===gen)doThrow()},R?120:380)}}
  async function doThrow(){if(phase!=='throw'&&phase!=='ai')return;const g=gen,who=turn;phase='rolling';bar.set([]);
    const t=throwSticks();roll=t.v;
    sticks.forEach((s,i)=>{s.classList.remove('throw');void s.offsetWidth;if(!R)s.classList.add('throw');s.classList.toggle('dk',!t.lights[i])});
    api.noise(.08,1500,4000,.05);setTimeout(()=>{api.tone(900,.03,'triangle',.05);api.noise(.05,2000,5000,.04)},R?0:420);
    await D(560);if(g!==gen)return;
    resv.textContent=roll;rest.textContent=[1,4,5].includes(roll)?T('again'):'';
    moves=legal(who,roll);
    if(!moves.length){rest.textContent=T('noMoves');talk(who==='p'?T('sayNoMovesYou'):T('sayNoMovesHim'));S.lose();await D(1100);if(g!==gen)return;turn=who==='p'?'j':'p';return nextTurn()}
    if(who==='p'){phase='choose';selIdx=moves.length===1?0:-1;paintChoose();
      bar.set([{label:T('move'),key:'enter',keyLabel:'ENTER',on:()=>{if(selIdx>=0)doMove(selIdx)},disabled:selIdx<0},{label:T('forfeit'),key:'r',on:forfeit,alt:true}]);
      rest.textContent=([1,4,5].includes(roll)?T('again')+' · ':'')+T('pickHint')}
    else{await D(280);if(g!==gen)return;doMove(aiPick())}}
  function clearMarks(){Object.values(sqEl).forEach(e=>e.classList.remove('tgt'));piecesEl.querySelectorAll('.sn-pc').forEach(e=>e.classList.remove('mov','sel'))}
  function paintChoose(){clearMarks();targetMap={};moves.forEach((m,i)=>{m.p.el.classList.add('mov');if(m.to<=30)targetMap[m.to]=i});paintSel()}
  function paintSel(){Object.values(sqEl).forEach(e=>e.classList.remove('tgt'));piecesEl.querySelectorAll('.sn-pc').forEach(e=>e.classList.remove('sel'));
    if(selIdx>=0){const m=moves[selIdx];m.p.el.classList.add('sel');if(m.to<=30)sqEl[m.to].classList.add('tgt');rest.textContent=m.to>30?T('bearHint'):T('toHint').replace('{n}',m.to)}
    else moves.forEach(m=>{if(m.to<=30)sqEl[m.to].classList.add('tgt')});
    if(phase==='choose')bar.set([{label:T('move'),key:'enter',keyLabel:'ENTER',on:()=>{if(selIdx>=0)doMove(selIdx)},disabled:selIdx<0},{label:T('forfeit'),key:'r',on:forfeit,alt:true}]);S.tick()}
  function aiPick(){let best=0,bs=-1e9;const myOff=pieces.filter(p=>p.side==='j'&&p.pos>30).length;
    moves.forEach((m,i)=>{let sc=Math.random()*6;
      if(m.to===31)sc+=100;if(m.to===26)sc+=42;if(m.to===27)sc-=70;
      if(m.hit){sc+=30+(m.to-m.from)*2;if(m.to>=20)sc+=10}
      const after=m.to;const mate=[after-1,after+1].some(s=>{const o=occ(s);return o&&o.side==='j'&&o!==m.p});if(mate&&after<=30)sc+=12;
      const oldMate=[m.from-1,m.from+1].some(s=>{const o=occ(s);return o&&o.side==='j'});if(oldMate)sc-=5;
      if(after<26){for(let d=1;d<=5;d++){const o=occ(after-d);if(o&&o.side==='p'&&!mate){sc-=7;break}}}
      sc+=(m.to-m.from)*1.5+(m.from>=20?4:0)-myOff;
      if(sc>bs){bs=sc;best=i}});return best}
  async function doMove(i){const m=moves[i];if(!m||(phase!=='choose'&&phase!=='rolling'&&phase!=='ai'))return;const g=gen,who=turn;phase='moving';clearMarks();bar.set([]);
    Object.values(sqEl).forEach(e=>e.classList.remove('last'));
    if(m.hit){m.hit.pos=m.from;place(m.hit);matchStats.hits+=who==='p'?1:0;talk(who==='p'?T('sayHitYou'):T('sayHitHim'));api.tone(330,.08,'square',.05);api.tone(220,.1,'square',.04,.07)}
    m.p.pos=m.to;place(m.p);S.deal();if(m.to<=30)sqEl[m.to].classList.add('last');
    if(m.to===31){S.win();talk(who==='p'?T('sayOffYou'):T('sayOffHim'));paintOff()}
    await D(360);if(g!==gen)return;
    if(m.p.pos===27){talk(who==='p'?T('sayWaterYou'):T('sayWaterHim'));api.noise(.3,300,1200,.06);let t=15;while(t>1&&occ(t))t--;m.p.pos=t;place(m.p);await D(450);if(g!==gen)return}
    const won=pieces.filter(p=>p.side===who&&p.pos>30).length===N;
    if(won)return finishMatch(who);
    if([1,4,5].includes(roll)){nextTurn();return}
    turn=who==='p'?'j':'p';nextTurn()}
  async function finishMatch(who){const g=gen;phase='over';bar.set([]);const oj=pieces.filter(p=>p.side==='j'&&p.pos>30).length;
    if(who==='p'){const perfect=oj===0;const win=bet*(perfect?3:2);chips+=win;st.won++;st.max=Math.max(st.max,chips);
      C.banner(root,api,perfect?T('perfect'):T('youWin'),'+'+fmt(win-bet)+' '+T('unit'),true);S.big();talk(T('sayLose'));
      if(api.ach){api.ach('sn-win');if(perfect)api.ach('sn-perfect')}}
    else{C.banner(root,api,T('hisWin'),'−'+fmt(bet)+' '+T('unit'));S.lose();talk(T('sayWin'))}
    persist();hud();await D(2000);if(g!==gen)return;betPhase()}
  function forfeit(){if(!pieces||phase==='bet'||phase==='over')return;gen++;phase='over';bar.set([]);C.banner(root,api,T('forfeitT'),'−'+fmt(bet)+' '+T('unit'));S.lose();talk(T('sayForfeit'));
    persist();hud();const g=gen;setTimeout(()=>{if(g===gen&&!done)betPhase()},R?300:1700)}

  function end(reason){if(done)return;done=true;gen++;phase='end';bar.set([]);
    api.finish({score:chips,chips,unit:T('unit'),ankhs:0,detail:reason+' · '+T('detail').replace('{m}',st.matches).replace('{w}',st.won).replace('{x}',fmt(st.max))})}

  const kd=e=>{if(done)return;
    if(phase==='choose'&&(e.key==='ArrowRight'||e.key==='ArrowLeft'||e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();const d=(e.key==='ArrowRight'||e.key==='ArrowDown')?1:-1;selIdx=selIdx<0?0:(selIdx+d+moves.length)%moves.length;paintSel();return}
    if(bar.key(e))return;
    if(phase==='bet'){const n='1234'.indexOf(e.key);if(n>=0){const v=[10,25,100,500][n];if(bet+v<=chips){e.preventDefault();bet+=v;S.chip(1);renderBet();betPhaseActs()}}}};
  addEventListener('keydown',kd);

  function start(){gen++;done=false;chips=START;bet=25;st={matches:0,won:0,max:START};firstP='p';pieces=null;piecesEl.textContent='';paintOffEmpty();talk(T('welcome'));betPhase()}
  function paintOffEmpty(){$('#sn-op').querySelectorAll('i').forEach(i=>i.classList.remove('on'));$('#sn-oj').querySelectorAll('i').forEach(i=>i.classList.remove('on'));$('#sn-opn').textContent='0/'+N;$('#sn-ojn').textContent='0/'+N}
  start();
  return{restart:start,cashout:()=>chips,stop(){gen++;done=true;removeEventListener('keydown',kd);root.remove()}};
}
window.TEMPLO.register('senet',{create,help:[
  {t:'OBJETIVO',p:'Sacar tus cinco conos dorados del tablero antes de que Jonsu saque sus cinco carretes plateados. El recorrido va en zigzag: fila de arriba de izquierda a derecha, la del medio de derecha a izquierda y la de abajo otra vez hacia la derecha, hasta la casilla 30.'},
  {t:'LA TIRADA',p:'Se lanzan cuatro tablillas: cuentan las caras claras (1, 2, 3 o 4) y si no sale ninguna clara valen 5. Con 1, 4 o 5 vuelves a tirar; con 2 o 3 pasa el turno.'},
  {t:'MOVER',p:'Elige una pieza que brille y se moverá tantas casillas como la tirada (con el teclado: flechas y Enter). No puedes caer sobre una pieza tuya. Si no hay ningún movimiento posible, pierdes el turno.'},
  {t:'ATACAR',p:'Si caes sobre una pieza de Jonsu, os intercambiáis el sitio. No se puede atacar una pieza protegida por otra compañera pegada a ella, ni las que están en las casillas 26, 28, 29 y 30. Tres piezas seguidas forman un muro que no se puede saltar.'},
  {t:'CASILLAS ESPECIALES',p:'15 · Casa del renacer (el ankh). 26 · Casa de la belleza: todas las piezas tienen que caer aquí con la tirada exacta antes de seguir. 27 · Casa del agua: si caes en ella vuelves a la 15. 28, 29 y 30: desde ellas se sale del tablero con un 3, un 2 o un 1 exactos. Desde la 26 también se sale con un 5.'},
  {t:'APUESTA',p:'Antes de cada partida eliges cuánto apuestas. Si ganas, cobras el doble; si ganas sin que Jonsu haya sacado ninguna pieza (eclipse total), el triple. Rendirse cuenta como derrota.'}],
texts:{
  unit:'fichas',you:'TÚ',tag:'TABLERO DE SENET',boardAria:'Tablero de senet',sqAria:'Casilla {n}',yourPiece:'Tu pieza en la casilla',hisPiece:'Pieza de Jonsu en la casilla',
  sp_renace:'casa del renacer',sp_belleza:'casa de la belleza',sp_agua:'casa del agua',sp_tres:'sales con un 3',sp_dos:'sales con un 2',sp_sol:'sales con un 1',
  play:'JUGAR PARTIDA',leave:'RETIRARSE',throw:'LANZAR',move:'MOVER',forfeit:'RENDIRSE',bet:'APUESTA',addChip:'Añadir {v} fichas a la apuesta',clearBet:'Quitar la apuesta',
  betHint:'ELIGE TU APUESTA Y EMPIEZA',throwHint:'LANZA LAS TABLILLAS',pickHint:'ELIGE QUÉ PIEZA MUEVES',toHint:'VA A LA CASILLA {n}',bearHint:'¡SALE DEL TABLERO!',again:'¡VUELVES A TIRAR!',noMoves:'SIN MOVIMIENTOS',
  yourTurn:'TU TURNO',hisTurn:'TURNO DE JONSU',matchStart:'¡QUE EMPIECE EL SENET!',matchSub:'APUESTA {b} FICHAS',
  youWin:'¡GANAS LA PARTIDA!',perfect:'¡ECLIPSE TOTAL!',hisWin:'JONSU SE TOMA LA REVANCHA',forfeitT:'TE RINDES',
  welcome:'«Thot me ganó una partida y se llevó parte de la luz de la Luna. Esta vez no pienso perder.»',sayStart:'«Lanza las tablillas. La Luna nos observa.»',
  sayHitYou:'«¡Eh! Esa casilla era mía.»',sayHitHim:'«Fuera de mi camino.»',sayOffYou:'«Una pieza menos… no te confíes.»',sayOffHim:'«Una de las mías ya ve el más allá.»',
  sayWaterYou:'«El agua del Nilo te devuelve a la casa del renacer.»',sayWaterHim:'«¡Agua! Bah, solo es un paseo hasta la 15.»',
  sayNoMovesYou:'«Sin movimientos. Pierdes el turno.»',sayNoMovesHim:'«No puedo mover… por esta vez.»',
  sayWin:'«La Luna vuelve a ser mía.»',sayLose:'«Imposible… ¿has estudiado con Thot?»',sayForfeit:'«Una retirada a tiempo también es sabiduría.»',
  broke:'Te has quedado sin fichas',left:'Te retiras de la mesa',
  detail:'{m} partidas · {w} ganadas · máximo {x} fichas'}});
})();
