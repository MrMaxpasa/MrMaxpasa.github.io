/* La rueda de Thot — ruleta europea de un solo cero. Fichas virtuales, sin dinero real.
   Apuestas como en un casino real: pleno 35:1 · caballo 17:1 · transversal 11:1 · cuadro 8:1 · seisena 5:1 ·
   docena y columna 2:1 · suertes sencillas 1:1 (el cero las hace perder). */
(function(){
'use strict';
const WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const REDS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const colorOf=n=>n===0?'g':REDS.has(n)?'r':'n';
const FILL={r:'#A8361C',n:'#0A0A08',g:'#B8901F'};
const CHIPS=[5,10,25,100,500],MIN=5;
const STEP=360/37;
const NAMES={1:'PLENO',2:'CABALLO',3:'TRANSVERSAL',4:'CUADRO',6:'SEISENA'};

/* Tapete: posiciones [col, fila, ancho, alto] en la rejilla horizontal (h) y vertical (v).
   Las apuestas "entre números" se colocan en coordenadas de unidad (u = columna con el 0 en u∈[0,1], w = fila de arriba abajo, 0..3);
   en vertical se transforman con x = 3 − w, y = u. */
function buildBets(){const B={};const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
  for(let n=1;n<=36;n++){const c=Math.ceil(n/3),r=(n-1)%3;B['n'+n]={nums:[n],pay:35,name:'PLENO '+n,num:n,h:[1+c,3-r,1,1],v:[3+r,1+c,1,1]}}
  B.n0={nums:[0],pay:35,name:'PLENO 0',num:0,h:[1,1,1,3],v:[3,1,3,1]};
  [1,2,3].forEach(k=>{B['c'+k]={nums:range(1,36).filter(n=>(n-1)%3===k-1),pay:2,name:k+'ª COLUMNA',label:'2:1',h:[14,4-k,1,1],v:[2+k,14,1,1]}});
  [1,2,3].forEach(k=>{B['d'+k]={nums:range(12*k-11,12*k),pay:2,name:k+'ª DOCENA',label:k+'ª 12',h:[2+4*(k-1),4,4,1],v:[2,2+4*(k-1),1,4]}});
  [['lo',range(1,18),'1-18','FALTA (1-18)'],['even',range(1,36).filter(n=>n%2===0),'PAR','PAR'],['red',[...REDS],'ROJO','ROJO'],
   ['black',range(1,36).filter(n=>!REDS.has(n)),'NEGRO','NEGRO'],['odd',range(1,36).filter(n=>n%2),'IMPAR','IMPAR'],['hi',range(19,36),'19-36','PASA (19-36)']]
   .forEach(([id,nums,label,name],i)=>{B[id]={nums,pay:1,name,label,out:id,h:[2+2*i,5,2,1],v:[1,2+2*i,1,2]}});
  const Z=(nums,u,w,t)=>{nums=nums.slice().sort((a,b)=>a-b);const id='z'+nums.join('-');B[id]={nums,pay:36/nums.length-1,name:NAMES[nums.length]+' '+nums.join('-'),zone:{u,w,t}}};
  for(let n=1;n<=36;n++){const c=Math.ceil(n/3),rb=(n-1)%3;
    if(c<12)Z([n,n+3],c+1,2.5-rb,'bu');
    if(rb<2)Z([n,n+1],c+.5,2-rb,'bw');
    if(rb<2&&c<12)Z([n,n+1,n+3,n+4],c+1,2-rb,'pt');
  }
  for(let c=1;c<=12;c++){Z([3*c-2,3*c-1,3*c],c+.5,3,'bw');if(c<12)Z(range(3*c-2,3*c+3),c+1,3,'pt')}
  [1,2,3].forEach(n=>Z([0,n],1,2.5-(n-1),'bu'));
  Z([0,1,2],1,2,'pt');Z([0,2,3],1,1,'pt');Z([0,1,2,3],1,3,'pt');
  return B}

const CSS=`
.rl-wrap{position:absolute;left:0;right:0;top:64px;bottom:calc(86px + var(--ab));container-type:size}
.rl-deco{position:absolute;inset:-64px 0 0;pointer-events:none;background:repeating-linear-gradient(118deg,transparent 0 38px,rgba(122,92,30,.13) 38px 40px)}
.rl-deco::before{content:"";position:absolute;left:-6%;top:6%;width:50%;height:80%;transform:skewX(-14deg);background:radial-gradient(circle,rgba(201,162,39,.16) 1.1px,transparent 1.7px) 0 0/9px 9px;
  -webkit-mask-image:linear-gradient(160deg,#000 10%,transparent 78%);mask-image:linear-gradient(160deg,#000 10%,transparent 78%)}
.rl-main{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.7fr);gap:clamp(12px,2.4cqw,34px);padding:0 max(18px,env(safe-area-inset-right,0px)) 0 max(18px,env(safe-area-inset-left,0px));align-items:center}
.rl-left{position:relative;display:flex;flex-direction:column;align-items:center;gap:12px;min-width:0;height:100%;justify-content:center}
.rl-wheelbox{position:relative;width:min(86%,68cqh);aspect-ratio:1;margin-left:auto;transition:transform .55s cubic-bezier(.3,1.1,.4,1);z-index:2;transform-origin:50% 50%}
.rl-wheelbox svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(9px 9px 0 rgba(201,162,39,.85)) drop-shadow(0 16px 24px rgba(0,0,0,.6))}
.rl-wheelbox text{font-family:Anton,Impact,sans-serif}
.rl-thot{position:absolute;left:-4%;bottom:0;width:30%;z-index:3;pointer-events:none;filter:drop-shadow(0 0 10px rgba(245,200,66,.25))}
.rl-thot img{display:block;width:100%}
.rl-say{position:absolute;left:0;bottom:37%;z-index:4;max-width:44%;font:600 clamp(12px,1.25cqw,15px)/1.3 var(--f-ui);background:var(--ivory);color:var(--ink);padding:7px 10px 6px;transform:skewX(-8deg);box-shadow:4px 4px 0 var(--gold);animation:tcPop .3s cubic-bezier(.3,1.8,.5,1) both}
.rl-say::before{content:"THOT";display:block;font:700 9px/1 var(--f-ui);letter-spacing:.3em;color:var(--bronze);margin-bottom:3px}
.rl-hist{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;width:86%;margin-left:auto}
.rl-hist i{width:clamp(20px,2.1cqw,26px);height:clamp(20px,2.1cqw,26px);display:grid;place-items:center;font:400 clamp(10px,1.05cqw,13px)/1 var(--f-cond);font-style:normal;color:var(--ivory);transform:skewX(-10deg);box-shadow:2px 2px 0 var(--gold)}
.rl-hist i:first-child{transform:skewX(-10deg) scale(1.2);box-shadow:3px 3px 0 var(--gold-hi),0 0 10px rgba(245,200,66,.6)}
.rl-hist:empty::before{content:"ÚLTIMOS NÚMEROS";font:700 9px/1 var(--f-ui);letter-spacing:.3em;color:rgba(244,239,227,.4)}
.rl-right{display:flex;flex-direction:column;gap:clamp(8px,1.4cqh,14px);min-width:0;justify-content:center;height:100%}
.rl-bar{display:flex;align-items:center;gap:clamp(6px,1cqw,12px);flex-wrap:wrap}
.rl-chipbtn{border:0;padding:0;background:none;cursor:pointer;border-radius:50%;transition:transform .15s}
.rl-chipbtn .tc-chip{--chw:clamp(34px,4cqw,50px)}
.rl-chipbtn.on{transform:translateY(-5px)}
.rl-chipbtn.on .tc-chip{box-shadow:0 0 0 3px var(--gold-hi),0 0 16px rgba(245,200,66,.6)}
.rl-chipbtn[disabled]{opacity:.3;cursor:default}
.rl-total{margin-left:auto;font:400 clamp(16px,1.7cqw,22px)/1 var(--f-cond);letter-spacing:.06em;color:var(--ink);background:var(--gold-hi);padding:6px 11px 4px;transform:skewX(-10deg);box-shadow:3px 3px 0 var(--ivory);white-space:nowrap}
.rl-total small{font:700 10px/1 var(--f-ui);letter-spacing:.2em;margin-right:6px}
.rl-felt{position:relative;isolation:isolate;padding:clamp(12px,1.5cqw,18px) clamp(10px,1.4cqw,16px) clamp(10px,1.2cqw,14px);background:radial-gradient(ellipse at 50% 40%,var(--fb),var(--fd));border:1.5px solid var(--ivory);box-shadow:8px 8px 0 rgba(201,162,39,.85)}
.rl-felt::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle,rgba(201,162,39,.14) 1px,transparent 1.6px) 0 0/8px 8px}
.rl-tag{position:absolute;top:-11px;left:14px;z-index:7;font:700 9.5px/1 var(--f-ui);letter-spacing:.22em;background:var(--lapis);color:var(--ivory);padding:5px 8px 4px;transform:skewX(-10deg)}
.rl-tab{position:relative;display:grid;grid-template-columns:repeat(14,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1.25fr)) repeat(2,minmax(0,.9fr));gap:3px;aspect-ratio:14/5.4;width:100%}
.rl-c{position:relative;grid-column:var(--hc)/span var(--hcs);grid-row:var(--hr)/span var(--hrs);border:0;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;font:400 clamp(14px,1.75cqw,24px)/1 var(--f-cond);letter-spacing:.02em;color:var(--ivory);background:rgba(10,10,8,.55);transition:background .12s,color .12s,box-shadow .12s;min-width:0;min-height:0}
.rl-c.num.r{background:#A8361C}.rl-c.num.n{background:#0A0A08}
.rl-c.num{box-shadow:inset 0 0 0 1.5px rgba(10,10,8,.9),inset 0 0 0 3px rgba(201,162,39,.35)}
.rl-c.g{background:linear-gradient(160deg,#5a4318,#B8901F);color:var(--ink);flex-direction:column;gap:2px}
.rl-c.g b{font-family:var(--f-glyph);font-weight:400;font-size:1.15em}
.rl-c.o{background:rgba(10,10,8,.72);box-shadow:inset 0 0 0 1px rgba(201,162,39,.55)}
.rl-c.o .word{--fs:clamp(12px,1.35cqw,18px);filter:none}
.rl-c .dia{position:relative;display:inline-block;flex:none;width:1.3em;height:.9em;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);margin-right:.35em;background:#F4EFE3}
.rl-c .dia::before{content:"";position:absolute;inset:13%;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);background:var(--c)}
.rl-c:focus-visible,.rl-c.cover{background:var(--gold-hi)!important;color:var(--ink);outline:none;box-shadow:inset 0 0 0 2px var(--ink),3px 3px 0 var(--ivory);z-index:2}
.rl-c.cover .l-b,.rl-c.cover .l-c{color:var(--ink)}
.rl-c.cover .l-d{background:var(--ink);color:var(--gold-hi)}
@media (hover:hover){.rl-c:hover{background:var(--gold-hi)!important;color:var(--ink);box-shadow:inset 0 0 0 2px var(--ink),3px 3px 0 var(--ivory);z-index:2}.rl-c:hover .l-b,.rl-c:hover .l-c{color:var(--ink)}.rl-c:hover .l-d{background:var(--ink);color:var(--gold-hi)}.rl-z:hover{background:rgba(245,200,66,.6);box-shadow:0 0 0 2px var(--ink)}}
.rl-c.win{animation:rlWin .5s ease-in-out 4;box-shadow:inset 0 0 0 3px var(--gold-hi),0 0 18px rgba(245,200,66,.7);z-index:2}
@keyframes rlWin{50%{filter:brightness(1.6)}}
.rl-c.hit{background:var(--gold-hi)!important;color:var(--ink);box-shadow:inset 0 0 0 3px var(--ink),0 0 26px rgba(245,200,66,.95);z-index:3;animation:rlHit .45s cubic-bezier(.3,1.8,.5,1)}
@keyframes rlHit{40%{transform:scale(1.18)}}
.rl-zones{position:relative;grid-column:1/span 13;grid-row:1/span 3;z-index:4;pointer-events:none}
.rl-z{position:absolute;left:var(--hl);top:var(--ht);transform:translate(-50%,-50%);border:0;padding:0;background:transparent;cursor:pointer;pointer-events:auto;border-radius:3px}
.rl-z.bu{width:2.9%;height:22%}.rl-z.bw{width:4.6%;height:13%}.rl-z.pt{width:3.3%;height:15%;border-radius:50%;z-index:1}
.rl-z:focus-visible{background:rgba(245,200,66,.6);box-shadow:0 0 0 2px var(--ink);outline:none}
.rl-z.win{background:rgba(245,200,66,.75);box-shadow:0 0 14px rgba(245,200,66,.9)}
.rl-stake{position:absolute;z-index:6;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;--chw:clamp(22px,2.5cqw,32px)}
.rl-stake .tc-chip{font-size:calc(var(--chw)*.3);box-shadow:0 0 0 1.5px rgba(0,0,0,.65),0 3px 6px rgba(0,0,0,.6);animation:tcPop .25s cubic-bezier(.3,1.8,.5,1) both}
.rl-z .rl-stake{--chw:clamp(20px,2.2cqw,28px)}
.rl-stake.lose{transition:opacity .6s,transform .6s;opacity:0;transform:translate(-50%,-30%) scale(.7)}
.rl-info{display:flex;align-items:center;gap:10px;min-height:24px;flex-wrap:wrap}
.rl-hint{font:400 clamp(14px,1.5cqw,19px)/1 var(--f-cond);letter-spacing:.08em;color:var(--ink);background:var(--ivory);padding:5px 10px 4px;transform:skewX(-10deg);box-shadow:3px 3px 0 var(--gold);white-space:nowrap}
.rl-hint:empty{display:none}
.rl-hint b{font-weight:400;color:var(--bronze);margin-left:8px}
.rl-legend{font:700 10px/1.4 var(--f-ui);letter-spacing:.14em;color:rgba(244,239,227,.5)}
.rl-hint:not(:empty)+.rl-legend{display:none}
.tc-act{--fs:clamp(18px,2.1vw,30px)}
.rl-dim{position:absolute;inset:-64px 0 0;z-index:40;background:rgba(5,4,3,.62);opacity:0;pointer-events:none;transition:opacity .4s}
.rl-dim.on{opacity:1}
@media (hover:none) and (pointer:coarse){.rl-z.bu{width:4%;height:28%}.rl-z.bw{width:5.5%;height:17%}.rl-z.pt{width:4.4%;height:20%}}
@container (max-aspect-ratio:1/1){
  .rl-main{grid-template-columns:1fr;grid-template-rows:auto auto minmax(0,1fr) auto;align-items:stretch;gap:8px}
  .rl-left{flex-direction:row;height:auto;justify-content:flex-start;gap:10px;margin-bottom:24px}
  .rl-wheelbox{width:min(34cqw,24cqh);flex:none;margin-left:0}
  .rl-wheelbox svg{filter:drop-shadow(5px 5px 0 rgba(201,162,39,.85))}
  .rl-thot{position:relative;left:auto;bottom:auto;width:min(20cqw,15cqh);order:3;margin-left:auto;align-self:flex-end}
  .rl-say{position:relative;left:auto;bottom:auto;max-width:none;flex:1;align-self:center;font-size:12.5px}
  .rl-hist{position:absolute;left:0;right:0;top:calc(100% + 5px);justify-content:flex-start;width:auto;margin-left:0}
  .rl-hist i{width:18px;height:18px;font-size:10px}
  .rl-right{height:auto;min-height:0;display:contents}
  .rl-bar{gap:8px}.rl-chipbtn .tc-chip{--chw:38px}
  .rl-felt{min-height:0;display:flex;box-shadow:5px 5px 0 rgba(201,162,39,.85)}
  .rl-tab{grid-template-columns:.8fr .8fr repeat(3,minmax(0,1fr));grid-template-rows:repeat(14,minmax(0,1fr));aspect-ratio:auto;height:100%;width:100%;gap:2px}
  .rl-c{grid-column:var(--vc)/span var(--vcs);grid-row:var(--vr)/span var(--vrs);font-size:clamp(13px,4.2cqw,19px)}
  .rl-c.g{flex-direction:row;gap:6px}
  .rl-c.o{flex-direction:column}
  .rl-c.o .word{--fs:clamp(11px,3.3cqw,14px)}
  .rl-c.o.rb .word{display:none}
  .rl-c.o .dia{width:2.1em;height:1.45em;margin:0}
  .rl-zones{grid-column:3/span 3;grid-row:1/span 13}
  .rl-z{left:var(--vl);top:var(--vt)}
  .rl-z.bu{width:22%;height:2.9%}.rl-z.bw{width:13%;height:4.6%}.rl-z.pt{width:15%;height:3.4%}
  .rl-stake,.rl-z .rl-stake{--chw:22px}
  .rl-info{order:5;min-height:0}.rl-legend{display:none}
}
`;
const CSS_TOUCH_V=`@container (max-aspect-ratio:1/1){.rl-z.bu{width:30%;height:3.6%}.rl-z.bw{width:18%;height:5.6%}.rl-z.pt{width:20%;height:4.4%}}`;

function create(stage,api){
  const C=window.TEMPLO_LIB.cartas,S=C.sounds(api),R=api.reduced,T=api.t;
  const touch=matchMedia('(hover:none) and (pointer:coarse)').matches;
  const root=C.mount(stage,CSS+(touch?CSS_TOUCH_V:''));
  const BETS=buildBets();
  const fmt=n=>Number(n).toLocaleString('es-ES');
  const short=n=>n>=10000?Math.round(n/1000)+'K':n>=1000?(n/1000).toFixed(1).replace('.0','')+'K':String(n);
  root.insertAdjacentHTML('beforeend',`<div class="rl-wrap"><div class="rl-deco"></div><div class="rl-dim" id="rl-dim"></div><div class="rl-main">
    <div class="rl-left"><div class="rl-wheelbox" id="rl-wb"></div><div class="rl-thot" id="rl-thot" aria-hidden="true"></div><div class="rl-say" id="rl-say" role="status"></div><div class="rl-hist" id="rl-hist" aria-label="${T('histAria')}"></div></div>
    <div class="rl-right"><div class="rl-bar" id="rl-bar"></div><div class="rl-felt"><span class="rl-tag">${T('tag')}</span><div class="rl-tab" id="rl-tab" role="group" aria-label="${T('tableAria')}"><div class="rl-zones" id="rl-zones"></div></div></div>
      <div class="rl-info"><span class="rl-hint" id="rl-hint" aria-live="polite"></span><span class="rl-legend">${T('legend')}</span></div></div>
  </div></div>`);
  const $=s=>root.querySelector(s);
  const wb=$('#rl-wb'),tab=$('#rl-tab'),zonesEl=$('#rl-zones'),bar=$('#rl-bar'),hist=$('#rl-hist'),say=$('#rl-say'),dim=$('#rl-dim'),hint=$('#rl-hint');
  const thotImg=new Image();thotImg.alt='';thotImg.onload=()=>$('#rl-thot').append(thotImg);thotImg.src=api.base+'casino/thot.webp';

  /* --- Rueda: contornos de tinta, anillo de jeroglíficos, trama de puntos y sombra dorada --- */
  let svg='<svg viewBox="0 0 400 400" aria-hidden="true"><defs>'+
    '<pattern id="rlDots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1" fill="rgba(201,162,39,.32)"/></pattern>'+
    '<radialGradient id="rlBall" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#E9E2CF"/><stop offset="1" stop-color="#9c937c"/></radialGradient>'+
    '<path id="rlRing" d="M200 200m-187 0a187 187 0 1 1 374 0a187 187 0 1 1 -374 0"/></defs>'+
    '<circle cx="200" cy="200" r="199" fill="#0A0A08"/><circle cx="200" cy="200" r="196" fill="#C9A227"/><circle cx="200" cy="200" r="192" fill="#0A0A08"/>'+
    '<text font-size="10" fill="#F5C842" letter-spacing="3" dy="3.5" style="font-family:var(--f-glyph)"><textPath href="#rlRing">'+'𓂀 𓋹 𓆣 𓇳 𓅝 𓁢 𓃠 𓊽 '.repeat(6)+'</textPath></text>'+
    '<circle cx="200" cy="200" r="181" fill="#C9A227" stroke="#0A0A08" stroke-width="3"/><g id="rl-rot">';
  const P=(r,a)=>{const t=a*Math.PI/180;return[(200+r*Math.sin(t)).toFixed(2),(200-r*Math.cos(t)).toFixed(2)]};
  WHEEL.forEach((n,i)=>{const a0=(i-.5)*STEP,a1=(i+.5)*STEP;const [x1,y1]=P(177,a0),[x2,y2]=P(177,a1),[x3,y3]=P(142,a1),[x4,y4]=P(142,a0);
    svg+='<path d="M'+x1+' '+y1+'A177 177 0 0 1 '+x2+' '+y2+'L'+x3+' '+y3+'A142 142 0 0 0 '+x4+' '+y4+'Z" fill="'+FILL[colorOf(n)]+'" stroke="#0A0A08" stroke-width="2"/>';
    svg+='<text x="200" y="'+(200-157)+'" transform="rotate('+(i*STEP).toFixed(2)+' 200 200)" text-anchor="middle" font-size="17" fill="'+(n===0?'#0A0A08':'#F4EFE3')+'">'+n+'</text>';
    const [px,py]=P(142,a0),[qx,qy]=P(121,a0);svg+='<path d="M'+px+' '+py+'L'+qx+' '+qy+'" stroke="#C9A227" stroke-width="2"/>'});
  svg+='<circle cx="200" cy="200" r="142" fill="none" stroke="#0A0A08" stroke-width="3"/><circle cx="200" cy="200" r="121" fill="#16120c" stroke="#0A0A08" stroke-width="4"/><circle cx="200" cy="200" r="121" fill="url(#rlDots)"/><circle cx="200" cy="200" r="116" fill="none" stroke="#C9A227" stroke-width="2"/>';
  for(let k=0;k<4;k++){svg+='<g transform="rotate('+(k*90+STEP/2)+' 200 200)"><path d="M200 200L200 98" stroke="#0A0A08" stroke-width="9" stroke-linecap="round"/><path d="M200 200L200 98" stroke="#C9A227" stroke-width="5" stroke-linecap="round"/><circle cx="200" cy="98" r="7" fill="#F5C842" stroke="#0A0A08" stroke-width="2.5"/></g>'}
  svg+='<circle cx="200" cy="200" r="38" fill="#F5C842" stroke="#0A0A08" stroke-width="4"/><circle cx="200" cy="200" r="30" fill="#0A0A08"/><text x="200" y="213" text-anchor="middle" font-size="36" fill="#F5C842" style="font-family:var(--f-glyph)">𓂀</text></g>'+
    '<circle id="rl-ball" r="8" fill="url(#rlBall)" stroke="#0A0A08" stroke-width="1.6" cx="200" cy="7"/></svg>';
  wb.innerHTML=svg;const rot=wb.querySelector('#rl-rot'),ballEl=wb.querySelector('#rl-ball');
  const TRACK=186.5,POCKET=131;
  let wAng=0,bAng=-40,bRad=TRACK,lock=null,anim=null,raf=0,last=performance.now();
  function draw(){rot.setAttribute('transform','rotate('+wAng.toFixed(2)+' 200 200)');
    const a=(lock!==null?wAng+lock:bAng)*Math.PI/180,r=lock!==null?POCKET:bRad;ballEl.setAttribute('cx',(200+r*Math.sin(a)).toFixed(2));ballEl.setAttribute('cy',(200-r*Math.cos(a)).toFixed(2))}
  function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(anim)anim(now);else if(!R)wAng+=dt*9;draw();raf=requestAnimationFrame(loop)}
  raf=requestAnimationFrame(loop);
  function spinTo(n){return new Promise(res=>{const target=WHEEL.indexOf(n)*STEP;const dur=R?1300:6200;const w0=wAng,W=(R?360:1080)+Math.random()*360,wf=w0+W;
    if(lock!==null){bAng=wAng+lock;lock=null}const b0=bAng;let bf=wf+target;while(bf>b0-360*(R?1:5))bf-=360;
    const t0=performance.now();let lastPocket=-1,lastTick=0;
    anim=now=>{const t=Math.min(1,(now-t0)/dur);const ew=1-Math.pow(1-t,3),eb=1-Math.pow(1-t,2.4);
      wAng=w0+W*ew;bAng=b0+(bf-b0)*eb;
      if(t<.62)bRad=TRACK;else{const u=(t-.62)/.38;const drop=1-Math.pow(1-Math.min(1,u*1.25),2);const bounce=u<.8?Math.abs(Math.sin(u*Math.PI*3.2))*(1-u)*10:0;bRad=TRACK-(TRACK-POCKET)*drop+bounce}
      const rel=(((bAng-wAng)%360)+360)%360,pocket=Math.floor((rel+STEP/2)/STEP)%37;
      if(t>.5&&pocket!==lastPocket&&now-lastTick>45){lastPocket=pocket;lastTick=now;api.tone(2600+Math.random()*500,.012,'square',.018*(1.2-t))}
      if(t<.5&&now-lastTick>90){lastTick=now;api.noise(.05,1800,3600,.012)}
      if(t>=1){anim=null;lock=target;api.tone(1900,.03,'triangle',.06);api.noise(.06,1200,3000,.05);res()}}})}

  /* --- Tapete --- */
  const cells={},numCell={};
  function cover(id,on){if(!id)return;BETS[id].nums.forEach(n=>numCell[n]&&numCell[n].classList.toggle('cover',on));
    if(on){const b=BETS[id];hint.textContent=b.name;const p=document.createElement('b');p.textContent=T('pays').replace('{p}',b.pay);hint.append(p)}else hint.textContent=''}
  Object.entries(BETS).forEach(([id,b])=>{
    const el=document.createElement('button');el.type='button';
    if(b.zone){el.className='rl-z '+b.zone.t;const {u,w}=b.zone;
      el.style.setProperty('--hl',(u/13*100).toFixed(3)+'%');el.style.setProperty('--ht',(w/3*100).toFixed(3)+'%');
      el.style.setProperty('--vl',((3-w)/3*100).toFixed(3)+'%');el.style.setProperty('--vt',(u/13*100).toFixed(3)+'%');
      zonesEl.append(el)}
    else{el.className='rl-c'+(b.num!==undefined?' num '+colorOf(b.num):' o'+(/^c\d$/.test(id)?' col':'')+(b.out==='red'||b.out==='black'?' rb':''));
      const [hc,hr,hcs,hrs]=b.h,[vc,vr,vcs,vrs]=b.v;
      [['--hc',hc],['--hr',hr],['--hcs',hcs],['--hrs',hrs],['--vc',vc],['--vr',vr],['--vcs',vcs],['--vrs',vrs]].forEach(([k,v])=>el.style.setProperty(k,v));
      if(b.num===0)el.innerHTML='<b>𓋹</b><span>0</span>';
      else if(b.num!==undefined)el.textContent=b.num;
      else{if(b.out==='red'||b.out==='black'){const d=document.createElement('i');d.className='dia';d.style.setProperty('--c',b.out==='red'?'#A8361C':'#0A0A08');el.append(d)}
        const w=document.createElement('span');w.className='word';el.append(w);if(api.collage)api.collage(w,b.label,true);else w.textContent=b.label}
      tab.insertBefore(el,zonesEl);if(b.num!==undefined)numCell[b.num]=el}
    el.setAttribute('aria-label',T('betAria').replace('{b}',b.name).replace('{p}',b.pay));
    el.addEventListener('click',()=>place(id));
    el.addEventListener('contextmenu',e=>{e.preventDefault();removeFrom(id)});
    if(!touch){el.addEventListener('pointerenter',()=>cover(id,true));el.addEventListener('pointerleave',()=>cover(id,false))}
    el.addEventListener('focus',()=>cover(id,true));el.addEventListener('blur',()=>cover(id,false));
    cells[id]=el});

  /* --- Estado --- */
  const START=api.casino?api.casino.chips:1000;
  let chips,bets,undo,lastBets,chip,phase,gen=0,done=false,st,flashT=0;
  const tableTotal=()=>Object.values(bets).reduce((a,b)=>a+b,0);
  const persist=committed=>{if(api.casino&&!done)api.casino.save(chips+(committed?0:tableTotal()))};
  function hud(){api.setScore(fmt(chips)+' '+T('unit'));const t=$('#rl-total');if(t)t.innerHTML='<small>'+T('onTable')+'</small>'+fmt(tableTotal())}
  function talk(txt){say.textContent=txt;say.style.animation='none';void say.offsetWidth;say.style.animation=''}
  function renderBar(){bar.textContent='';CHIPS.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='rl-chipbtn'+(v===chip?' on':'');
      b.append(C.chipEl(v));b.setAttribute('aria-label',T('pickChip').replace('{v}',v));b.setAttribute('aria-pressed',String(v===chip));b.disabled=phase!=='bet';
      b.addEventListener('click',()=>{chip=v;S.chip(1);renderBar()});bar.append(b)});
    const t=document.createElement('span');t.className='rl-total';t.id='rl-total';bar.append(t);hud()}
  function paintStake(id){const el=cells[id];el.querySelectorAll(':scope > .rl-stake').forEach(x=>x.remove());const v=bets[id]||0;if(!v)return;
    const w=document.createElement('span');w.className='rl-stake';const ch=C.chipEl(v>=500?500:v>=100?100:v>=25?25:v>=10?10:5);ch.textContent=short(v);w.append(ch);el.append(w)}
  function place(id){if(phase!=='bet')return;let v=chip;if(chips<v){if(chips>=MIN)v=chips-chips%MIN;else{api.sfx.back();talk(T('noChips'));return}}
    chips-=v;bets[id]=(bets[id]||0)+v;undo.push([id,v]);paintStake(id);S.chip(1);persist(false);hud();acts();
    if(touch){/* en táctil, enseña un momento qué cubre la apuesta */Object.keys(cells).forEach(k=>k!==id&&cover(k,false));cover(id,true);clearTimeout(flashT);flashT=setTimeout(()=>cover(id,false),1300)}}
  function removeFrom(id){if(phase!=='bet'||!bets[id])return;for(let i=undo.length-1;i>=0;i--){if(undo[i][0]===id){const [,v]=undo.splice(i,1)[0];bets[id]-=v;chips+=v;if(!bets[id])delete bets[id];break}}
    paintStake(id);S.chip(1);persist(false);hud();acts()}
  function undoLast(){if(phase!=='bet'||!undo.length)return;const [id,v]=undo.pop();bets[id]-=v;chips+=v;if(!bets[id])delete bets[id];paintStake(id);S.chip(1);persist(false);hud();acts()}
  function clearBets(silent){if(phase!=='bet'&&!silent)return;chips+=tableTotal();Object.keys(bets).forEach(id=>{delete bets[id];paintStake(id)});undo=[];if(!silent){S.chip(2);persist(false);hud();acts()}}
  function repeat(){if(phase!=='bet'||!lastBets)return;const need=Object.values(lastBets).reduce((a,b)=>a+b,0);if(need>chips+tableTotal()){api.sfx.back();talk(T('noRepeat'));return}
    clearBets(true);Object.entries(lastBets).forEach(([id,v])=>{chips-=v;bets[id]=v;undo.push([id,v]);paintStake(id)});S.chip(3);persist(false);hud();acts()}
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const barA=C.acts(root,api);
  function acts(){const total=tableTotal();if(phase!=='bet'){barA.set([]);return}
    barA.set([
      {label:T('spin'),key:'enter',keyLabel:'ENTER',keys:[' '],on:spin,disabled:!total},
      {label:T('undo'),key:'u',on:undoLast,disabled:!undo.length,alt:true},
      {label:T('clear'),key:'b',on:()=>clearBets(false),disabled:!total,alt:true},
      {label:T('repeat'),key:'r',on:repeat,disabled:!lastBets||total>0,alt:true},
      {label:T('leave'),key:'l',on:()=>end(T('left')),alt:true}])}

  function rand37(){try{const u=new Uint32Array(1);let x;do{crypto.getRandomValues(u);x=u[0]}while(x>=4294967296-4294967296%37);return x%37}catch(e){return Math.floor(Math.random()*37)}}
  async function spin(){if(phase!=='bet'||!tableTotal())return;const g=++gen;phase='spin';lastBets=Object.assign({},bets);persist(true);
    renderBar();acts();talk(T('noMore'));S.turn();Object.keys(cells).forEach(id=>cover(id,false));
    Object.values(cells).forEach(c=>c.classList.remove('win','hit'));
    const big=matchMedia('(max-aspect-ratio:1/1)').matches&&!R;
    if(big){const r=wb.getBoundingClientRect(),s=root.getBoundingClientRect();const size=Math.min(s.width*.84,s.height*.56),k=size/r.width;
      wb.style.transform='translate('+((s.left+s.width/2)-(r.left+r.width/2))+'px,'+((s.top+s.height*.46)-(r.top+r.height/2))+'px) scale('+k+')';wb.style.zIndex=50;dim.classList.add('on')}
    const n=rand37();await spinTo(n);if(g!==gen)return;
    st.spins++;
    let pay=0,stake=0,bestWin=0,topPay=0;const winIds=[];
    Object.entries(bets).forEach(([id,v])=>{stake+=v;if(BETS[id].nums.includes(n)){const p=v*(BETS[id].pay+1);pay+=p;bestWin=Math.max(bestWin,p-v);topPay=Math.max(topPay,BETS[id].pay);winIds.push(id)}});
    const net=pay-stake;chips+=pay;st.max=Math.max(st.max,chips);if(pay>0)st.hits++;st.best=Math.max(st.best,bestWin);
    const col=colorOf(n),cname=col==='g'?T('zero'):col==='r'?T('red'):T('black');
    const dot=document.createElement('i');dot.style.background=FILL[col];dot.textContent=n;hist.prepend(dot);while(hist.children.length>12)hist.lastChild.remove();
    await C.wait(big?650:250);if(g!==gen)return;
    if(big){wb.style.transform='';dim.classList.remove('on');setTimeout(()=>{wb.style.zIndex=''},560)}
    numCell[n].classList.add('hit');winIds.forEach(id=>cells[id].classList.add('win'));
    Object.keys(bets).forEach(id=>{if(!winIds.includes(id)){const s=cells[id].querySelector(':scope > .rl-stake');if(s)s.classList.add('lose')}});
    if(pay>0){C.banner(root,api,n+' · '+cname,(net>=0?'+'+fmt(net):'+'+fmt(pay))+' '+T('unit'),true);if(topPay>=17)S.big();else S.win();S.chip(3);
      talk(topPay>=17?T('sayBig').replace('{n}',n):T('sayRes').replace('{n}',n).replace('{c}',cname.toLowerCase()))}
    else{C.banner(root,api,n+' · '+cname,T('noWin'));S.lose();talk(T('sayRes').replace('{n}',n).replace('{c}',cname.toLowerCase()))}
    hud();persist(true);
    await C.wait(R?900:2300);if(g!==gen)return;
    Object.keys(bets).forEach(id=>{delete bets[id];paintStake(id)});undo=[];
    phase='bet';renderBar();
    if(chips<MIN)return end(T('broke'));
    talk(pick(T('sayBet').split('|')));acts();persist(false)}

  function end(reason){if(done)return;if(phase==='bet')clearBets(true);done=true;gen++;phase='end';barA.set([]);
    api.finish({score:chips,chips,unit:T('unit'),ankhs:0,detail:reason+' · '+T('detail').replace('{s}',st.spins).replace('{h}',st.hits).replace('{b}',fmt(st.best)).replace('{m}',fmt(st.max))})}

  const kd=e=>{if(done)return;if(barA.key(e))return;if(phase==='bet'){const i='12345'.indexOf(e.key);if(i>=0){e.preventDefault();chip=CHIPS[i];S.chip(1);renderBar()}}};
  addEventListener('keydown',kd);

  function start(){gen++;done=false;chips=START;bets={};undo=[];lastBets=null;chip=10;phase='bet';st={spins:0,hits:0,best:0,max:START};
    hist.textContent='';Object.values(cells).forEach(c=>{c.classList.remove('win','hit','cover');c.querySelectorAll(':scope > .rl-stake').forEach(x=>x.remove())});
    wb.style.transform='';dim.classList.remove('on');lock=null;anim=null;hint.textContent='';
    renderBar();acts();talk(T('welcome'))}
  start();
  return{restart:start,cashout:()=>chips+(phase==='bet'?tableTotal():0),stop(){gen++;done=true;cancelAnimationFrame(raf);clearTimeout(flashT);removeEventListener('keydown',kd);root.remove()}};
}
window.TEMPLO.register('ruleta',{create,texts:{
  unit:'fichas',spin:'GIRAR',undo:'DESHACER',clear:'BORRAR',repeat:'REPETIR',leave:'RETIRARSE',onTable:'EN LA MESA',tag:'TAPETE · RULETA EUROPEA',
  red:'ROJO',black:'NEGRO',zero:'CERO',noWin:'SIN PREMIO',pays:'PAGA {p} A 1',
  legend:'PLENO 35:1 · CABALLO 17:1 · TRANSVERSAL 11:1 · CUADRO 8:1 · SEISENA 5:1 · DOCENA Y COLUMNA 2:1 · SENCILLAS 1:1',
  welcome:'«Hagan juego. Apuesta en un número, entre dos o en el cruce de cuatro, y pulsa GIRAR.»',noMore:'«No va más.»',
  sayBet:'«Hagan juego.»|«¿Rojo o negro? Yo ya lo he calculado.»|«Las probabilidades están escritas… en mis tablas.»|«Hagan juego, la rueda espera.»',
  sayRes:'«{n}, {c}.»',sayBig:'«¡{n}! Eso no estaba en mis cálculos…»',
  noChips:'«No te quedan fichas para esa apuesta.»',noRepeat:'«No te llegan las fichas para repetir la apuesta.»',
  broke:'Te has quedado sin fichas',left:'Te retiras de la mesa',
  pickChip:'Ficha de {v}',betAria:'Apostar a {b}, paga {p} a 1',tableAria:'Tapete de la ruleta',histAria:'Últimos números',
  detail:'{s} tiradas · {h} con premio · mejor premio {b} · máximo {m} fichas'}});
})();
