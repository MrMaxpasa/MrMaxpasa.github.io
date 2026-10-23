/* Memoria de jeroglíficos — empareja las 8 parejas de cartas. Todo dibujado con HTML/CSS. */
(function(){
'use strict';
const GLYPHS=['𓂀','𓋹','𓆣','𓇳','𓊽','𓅓','𓆑','𓃭','𓁹','𓎛','𓉐','𓌳'];
const CSS=`
.mem-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:70px max(16px,env(safe-area-inset-right,0px)) 64px max(16px,env(safe-area-inset-left,0px));box-sizing:border-box}
.mem-board{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(8px,1.6vmin,16px);width:min(92vw,calc(100vh - 170px),640px);aspect-ratio:1;perspective:900px}
.mem-card{position:relative;border:0;padding:0;background:none;cursor:pointer;aspect-ratio:1;transform-style:preserve-3d;animation:memIn .45s cubic-bezier(.2,.9,.3,1.2) both;animation-delay:calc(var(--i)*35ms)}
@keyframes memIn{from{opacity:0;transform:translateY(24px) rotate(-6deg) scale(.9)}}
.mem-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .38s cubic-bezier(.3,1.3,.5,1)}
.mem-card.up .mem-in,.mem-card.ok .mem-in{transform:rotateY(180deg)}
.mem-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:grid;place-items:center;box-sizing:border-box}
.mem-back{background:radial-gradient(circle,rgba(201,162,39,.22) 1px,transparent 1.6px) 0 0/7px 7px,var(--ink);border:2px solid var(--gold);box-shadow:inset 0 0 0 4px var(--ink),inset 0 0 0 5px rgba(122,92,30,.9)}
.mem-back span{font-family:var(--f-glyph);font-size:clamp(18px,4.2vmin,34px);color:var(--bronze)}
.mem-front{transform:rotateY(180deg);background:repeating-linear-gradient(0deg,rgba(122,92,30,.08) 0 2px,transparent 2px 7px),var(--papyrus);border:2px solid var(--ink);box-shadow:4px 4px 0 var(--gold)}
.mem-front span{font-family:var(--f-glyph);font-size:clamp(30px,8vmin,64px);color:var(--ink);line-height:1}
.mem-card.ok .mem-front{background:var(--ink);border-color:var(--gold-hi);box-shadow:0 0 0 2px var(--gold-hi),0 0 22px rgba(245,200,66,.55)}
.mem-card.ok .mem-front span{color:var(--gold-hi)}
.mem-card.ok{animation:memOk .45s cubic-bezier(.3,1.8,.5,1)}
@keyframes memOk{40%{transform:scale(1.1)}}
.mem-card.no{animation:memNo .4s}
@keyframes memNo{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.mem-card.cur{outline:3px solid var(--gold-hi);outline-offset:4px}
.mem-card:focus-visible{outline:3px solid var(--gold-hi);outline-offset:4px}
.mem-combo{position:absolute;left:50%;top:76px;transform:translateX(-50%) skewX(-10deg);font:400 26px/1 var(--f-cond);letter-spacing:.08em;color:var(--ink);background:var(--gold-hi);padding:6px 14px 5px;box-shadow:4px 4px 0 var(--ivory);opacity:0;pointer-events:none}
.mem-combo.show{animation:comboPop .8s ease-out}
@keyframes comboPop{0%{opacity:0;transform:translateX(-50%) skewX(-10deg) scale(.6)}20%{opacity:1;transform:translateX(-50%) skewX(-10deg) scale(1.1)}70%{opacity:1}100%{opacity:0;transform:translateX(-50%) translateY(-14px) skewX(-10deg)}}
@media (prefers-reduced-motion:reduce){.mem-in{transition:none}}
`;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function create(stage,api){
  const wrap=document.createElement('div');wrap.className='mem-wrap';
  const st=document.createElement('style');st.textContent=CSS;
  const board=document.createElement('div');board.className='mem-board';board.setAttribute('role','grid');board.setAttribute('aria-label',api.t('aria'));
  const combo=document.createElement('div');combo.className='mem-combo';
  wrap.append(st,board,combo);stage.append(wrap);

  let cards,open,lock,moves,points,streak,matched,t0,timer,cur;
  function fmt(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
  function secs(){return t0?Math.floor((performance.now()-t0)/1000):0}
  function hud(){api.setScore(points.toLocaleString('es-ES')+' pts · '+fmt(secs()))}
  function build(){
    clearInterval(timer);board.textContent='';
    const pick=shuffle(GLYPHS.slice()).slice(0,8);cards=shuffle(pick.concat(pick)).map(g=>({g,up:false,ok:false}));
    open=[];lock=false;moves=0;points=0;streak=0;matched=0;t0=0;cur=0;
    cards.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='mem-card';b.style.setProperty('--i',i);
      b.setAttribute('aria-label',api.t('cardHidden'));
      b.innerHTML='<div class="mem-in"><div class="mem-face mem-back"><span>𓂀</span></div><div class="mem-face mem-front"><span>'+c.g+'</span></div></div>';
      b.addEventListener('click',()=>{cur=i;paintCur(false);flip(i)});c.el=b;board.append(b)});
    hud();timer=setInterval(hud,500);
  }
  function paintCur(show){cards.forEach((c,i)=>c.el.classList.toggle('cur',show&&i===cur))}
  function flip(i){const c=cards[i];if(lock||c.up||c.ok)return;
    if(!t0)t0=performance.now();
    c.up=true;c.el.classList.add('up');c.el.setAttribute('aria-label',api.t('cardShown').replace('{g}',c.g));
    api.tone(900,.05,'triangle',.06);api.noise(.06,2500,5000,.05);
    open.push(i);
    if(open.length===2){moves++;const [a,b]=open.map(k=>cards[k]);
      if(a.g===b.g){streak++;const gain=100*streak;points+=gain;matched+=2;open=[];
        setTimeout(()=>{a.ok=b.ok=true;a.el.classList.add('ok');b.el.classList.add('ok')},180);
        api.tone(660,.07,'square',.07);api.tone(990,.08,'square',.07,.06);api.tone(1320,.16,'triangle',.06,.12);
        if(streak>1){combo.textContent='COMBO ×'+streak+'  +'+gain;combo.classList.remove('show');void combo.offsetWidth;combo.classList.add('show')}
        hud();if(matched===cards.length)setTimeout(win,650)}
      else{streak=0;lock=true;
        setTimeout(()=>{a.el.classList.add('no');b.el.classList.add('no');api.tone(300,.12,'square',.06);api.tone(220,.18,'square',.05,.08)},260);
        setTimeout(()=>{[a,b].forEach(x=>{x.up=false;x.el.classList.remove('up','no');x.el.setAttribute('aria-label',api.t('cardHidden'))});open=[];lock=false},900)}}
  }
  function win(){clearInterval(timer);const s=secs(),bonus=Math.max(0,900-s*10),score=points+bonus;
    api.finish({score,unit:'pts',ankhs:1+Math.floor(score/150),
      detail:api.t('detail').replace('{m}',moves).replace('{t}',fmt(s)).replace('{b}',bonus)})}
  const kd=e=>{const k=e.key;let d=0;
    if(k==='ArrowRight'||k==='d'||k==='D')d=1;else if(k==='ArrowLeft'||k==='a'||k==='A')d=-1;else if(k==='ArrowDown'||k==='s'||k==='S')d=4;else if(k==='ArrowUp'||k==='w'||k==='W')d=-4;
    if(d){e.preventDefault();cur=(cur+d+16)%16;paintCur(true);cards[cur].el.focus({preventScroll:true});api.sfx.tick();return}
    if(k==='Enter'||k===' '){e.preventDefault();flip(cur)}};
  addEventListener('keydown',kd);
  build();
  return{restart(){build()},stop(){clearInterval(timer);removeEventListener('keydown',kd);wrap.remove()}};
}
window.TEMPLO.register('memoria',{create,texts:{
  aria:'Tablero de 16 cartas',cardHidden:'Carta boca abajo',cardShown:'Carta con el jeroglífico {g}',
  detail:'{m} movimientos · {t} · {b} de bonus por tiempo'}});
})();
