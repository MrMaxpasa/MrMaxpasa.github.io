/* Casino de Anubis — la sala: mesas como zonas interactivas, ventanilla de entrada con ankhs y bazar de Bastet.
   Moneda 100 % virtual: los ankhs se ganan en los minijuegos y nunca se compran ni se cambian por nada real. */
(function(){
'use strict';
const C=window.TEMPLO_LIB.cartas;
const RATE=10; /* 1 ankh = 10 fichas */
const GIFT=25;

const TX={
  title:'CASINO',back:'ESC · VOLVER',backTouch:'VOLVER',ankhs:'ANKHS',
  enter:'SENTARSE',bazar:'ENTRAR AL BAZAR',soon:'PRÓXIMAMENTE',cancel:'CANCELAR',confirm:'SENTARSE',all:'TODO',
  buyTitle:'ENTRADA A LA MESA',buyFor:'= {n} FICHAS',buyNo:'No te llegan los ankhs para esta entrada. Gana más en los minijuegos del Templo.',
  buyRule:'1 ankh = 10 fichas. Al levantarte, las fichas vuelven a ser ankhs.',
  hintKeys:'← → ELEGIR · ENTER ENTRAR · ESC VOLVER',hintTouch:'TOCA UNA MESA · TOCA DE NUEVO PARA ENTRAR',
  giftTitle:'INVITA LA CASA',giftLine:'«Te veo con los bolsillos vacíos. Toma, para que vuelvas a la mesa.»',
  shopTitle:'BAZAR DE BASTET',tabBacks:'REVERSOS',tabFelts:'TAPETES',buy:'COMPRAR',equip:'EQUIPAR',equipped:'EQUIPADO',owned:'TUYO',free:'DE SERIE',
  shopLine:'«Todo lo bonito tiene un precio. Lo que se compra aquí se queda en tu navegador.»',noMoney:'TE FALTAN {n} ANKHS',bought:'¡COMPRADO!',
  close:'ESC · CERRAR',closeTouch:'CERRAR',signA:'DE ANUBIS',titleRa:'SALÓN',signRa:'DE RA',goRoom:'CRUZAR ▸'};

const STATIONS=[
  {id:'senet',game:'senet',buys:[10,25,50,100,'all'],name:'SENET',sub:'EL JUEGO DE LOS FARAONES',crup:'JONSU',head:'croc',w:14,x:13,y:56,px:22,py:60,pw:34,
   line:'«Thot me ganó una partida y se llevó parte de la luz de la Luna. ¿Te atreves con la revancha?»'},
  {id:'ruleta',game:'ruleta',buys:[10,25,50,100,'all'],name:'LA RUEDA DE THOT',sub:'RULETA EGIPCIA',crup:'THOT',head:'ibis',w:14,x:87,y:56,px:78,py:60,pw:34,
   line:'«He calculado cada giro de la rueda. Hagan juego… si se atreven con las probabilidades.»'},
  {id:'bazar',shop:true,name:'BAZAR DE BASTET',sub:'REVERSOS Y TAPETES',crup:'BASTET',head:'cat',w:18,x:50,y:54,px:50,py:41,pw:42,
   line:'«Reversos de carta y tapetes para tus mesas. Pagas en ankhs, presumes en cada partida.»'},
  {id:'poker',game:'poker',name:'LA MESA DE LOS DIOSES',sub:'PÓKER · TEXAS HOLD\'EM',crup:'SOBEK · BASTET · THOT',w:25,x:29,y:81,px:27,py:91,pw:47,buys:[50,100,250],
   line:'«Siéntate. Los dioses no tenemos prisa… pero sí hambre de fichas.»'},
  {id:'blackjack',game:'blackjack',name:'BLACKJACK DE ANUBIS',sub:'LA BANCA PAGA 3 A 2',crup:'ANUBIS',head:'jackal',w:23,x:71,y:82,px:73,py:91,pw:45,buys:[10,25,50,100,'all'],
   line:'«La banca paga 3 a 2. Y la banca, querido, soy yo.»'},
  {id:'toRa',door:'ra',name:'SALÓN DE RA',sub:'TRAGAPERRAS · DADOS · MAYOR O MENOR',crup:'SALÓN DE RA',w:6,x:33,y:40,px:17,py:35,pw:17,
   line:'«Al otro lado de esta puerta brilla el Salón de Ra: tragaperras, los dados de Set y el mayor o menor de Maat.»'},
  /* --- Salón de Ra --- */
  {id:'toAnubis',room:'ra',door:'anubis',name:'SALÓN DE ANUBIS',sub:'VOLVER A LA SALA PRINCIPAL',crup:'SALÓN DE ANUBIS',w:6,x:22,y:45,px:50,py:37,pw:17,
   line:'«Por aquí se vuelve a la sala principal: póker, blackjack, ruleta, senet y el bazar de Bastet.»'},
  {id:'tragaperras',room:'ra',game:'tragaperras',buys:[10,25,50,100,'all'],name:'TRAGAPERRAS DE RA',sub:'3 RODILLOS · 5 LÍNEAS',crup:'RA',w:24,x:21,y:79,px:26,py:66,pw:46,
   line:'«Tres soles en línea y Ra te bendice con su premio mayor. Tira de la palanca.»'},
  {id:'dados',room:'ra',game:'dados',buys:[10,25,50,100,'all'],name:'LOS DADOS DE SET',sub:'SIC BO · TRES DADOS',crup:'SET',head:'jackal',w:22,x:50,y:84,px:50,py:93,pw:50,
   line:'«Tres dados, cien maneras de perder… y alguna de ganar. El caos decide, yo solo agito.»'},
  {id:'mayormenor',room:'ra',game:'mayormenor',buys:[10,25,50,100,'all'],name:'MAYOR O MENOR',sub:'LA BALANZA DE MAAT',crup:'MAAT',head:'cat',w:24,x:79,y:79,px:74,py:66,pw:46,
   line:'«¿Mayor o menor? La verdad está en la siguiente carta. Cobra a tiempo: la avaricia también se pesa.»'}];
const ORDERS={anubis:['senet','bazar','ruleta','poker','blackjack','toRa'],ra:['toAnubis','tragaperras','dados','mayormenor']};
/* Ilustraciones de crupieres disponibles en juegos/casino/ (se irán añadiendo) */
const ART={bazar:'bastet.webp',blackjack:'anubis.webp',ruleta:'thot.webp',senet:'jonsu.webp',dados:'set.webp',mayormenor:'maat.webp'};

/* Siluetas provisionales de crupier (traje con chaleco y pajarita) hasta tener las ilustraciones */
const HEADS={
  jackal:'<path d="M21 31 18 7l9 15h6l9-15-3 24c2 4 2 9 0 12l-6 8h-8l-6-8c-2-3-2-8 0-12z"/>',
  cat:'<path d="M20 30 19 13l8 9h6l8-9-1 17c3 4 3 10 0 14l-5 6H26l-5-6c-3-4-3-10-1-14z"/>',
  ibis:'<path d="M21 34c0-8 4-13 9-13s9 5 9 13c0 4-1 7-3 9l-1 2c2 4 1 11-3 17l-2-1c3-5 3-10 2-14h-4l-4-3c-2-3-3-6-3-10z"/>',
  croc:'<path d="M21 34c0-8 4-13 9-13s9 5 9 13v6l3 10c0 3-2 5-5 5h-14c-3 0-5-2-5-5l3-10z"/>'};
function crupSVG(head){return '<svg viewBox="0 0 60 92" aria-hidden="true"><g fill="#0A0A08" stroke="#C9A227" stroke-width="1.3" stroke-linejoin="round">'+
  '<path d="M5 92c0-20 10-30 25-30s25 10 25 30z"/>'+HEADS[head]+'</g>'+
  '<path d="M22 63l8 17 8-17" fill="none" stroke="#F4EFE3" stroke-width="1.6"/><path d="M24 64l6 3 6-3-6-2z" fill="#F5C842"/><path d="M30 67l-5-3v6zM30 67l5-3v6z" fill="#F5C842"/>'+
  '<circle cx="26.5" cy="38" r="1.6" fill="#F5C842"/><circle cx="33.5" cy="38" r="1.6" fill="#F5C842"/></svg>'}

function miniWheel(cls){const W=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26],RD=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]),st=360/37;
  const P=(r,a)=>{const t=a*Math.PI/180;return(200+r*Math.sin(t)).toFixed(1)+' '+(200-r*Math.cos(t)).toFixed(1)};
  let s='<svg viewBox="0 0 400 400" aria-hidden="true" class="'+cls+'"><circle cx="200" cy="200" r="199" fill="#0A0A08"/><circle cx="200" cy="200" r="194" fill="#C9A227"/><circle cx="200" cy="200" r="186" fill="#0A0A08"/><circle cx="200" cy="200" r="181" fill="#C9A227" stroke="#0A0A08" stroke-width="4"/><g class="mw-rot">';
  W.forEach((n,i)=>{const a0=(i-.5)*st,a1=(i+.5)*st;s+='<path d="M'+P(177,a0)+'A177 177 0 0 1 '+P(177,a1)+'L'+P(140,a1)+'A140 140 0 0 0 '+P(140,a0)+'Z" fill="'+(n===0?'#B8901F':RD.has(n)?'#A8361C':'#0A0A08')+'" stroke="#0A0A08" stroke-width="2.5"/>'});
  s+='<circle cx="200" cy="200" r="140" fill="none" stroke="#0A0A08" stroke-width="4"/><circle cx="200" cy="200" r="120" fill="#16120c" stroke="#0A0A08" stroke-width="5"/><circle cx="200" cy="200" r="114" fill="none" stroke="#C9A227" stroke-width="3"/>';
  for(let k=0;k<4;k++)s+='<g transform="rotate('+(k*90+st/2)+' 200 200)"><path d="M200 200V98" stroke="#0A0A08" stroke-width="12" stroke-linecap="round"/><path d="M200 200V98" stroke="#C9A227" stroke-width="6" stroke-linecap="round"/><circle cx="200" cy="98" r="9" fill="#F5C842" stroke="#0A0A08" stroke-width="3"/></g>';
  return s+'<circle cx="200" cy="200" r="40" fill="#F5C842" stroke="#0A0A08" stroke-width="5"/><circle cx="200" cy="200" r="31" fill="#0A0A08"/><text x="200" y="214" text-anchor="middle" font-size="38" fill="#F5C842" style="font-family:var(--f-glyph)">&#x13080;</text></g></svg>'}

const CSS=`
.cs-wrap{position:absolute;inset:0;container-type:size;display:grid;place-items:center;background:#070605}
@media (max-aspect-ratio:1/1){.cs-wrap{place-items:start center;padding:54px 0 158px;box-sizing:border-box}}
.cs-scene{position:relative;width:min(100cqw,177.78cqh);aspect-ratio:16/9;overflow:hidden;background:#0d0b09;container-type:inline-size;--P:0}
@container (max-aspect-ratio:1/1){.cs-scene{width:min(100cqw,56.25cqh);aspect-ratio:9/16;--P:1}}
.cs-wall{position:absolute;left:0;right:0;top:0;height:50%;background:linear-gradient(180deg,#080706 0%,#17120d 50%,#271e14 100%)}
.cs-wall::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3%;background:linear-gradient(#C9A227,#7A5C1E);box-shadow:0 4px 18px rgba(0,0,0,.7)}
.cs-frieze{position:absolute;left:0;right:0;top:3.5%;font-family:var(--f-glyph);font-size:2.2cqw;line-height:1;white-space:nowrap;overflow:hidden;color:rgba(201,162,39,.38);letter-spacing:.35em;border-block:1px solid rgba(201,162,39,.3);padding:.35em 0}
.cs-pil{position:absolute;top:0;height:50%;width:4.6%;background:linear-gradient(90deg,#1b150e,#3d301e 35%,#2a2015 70%,#120e09);box-shadow:0 0 30px rgba(0,0,0,.6)}
.cs-pil::before{content:"";position:absolute;left:-30%;right:-30%;top:15%;height:7%;background:linear-gradient(#F5C842,#7A5C1E);clip-path:polygon(0 0,100% 0,82% 100%,18% 100%)}
.cs-pil::after{content:"";position:absolute;left:0;right:0;bottom:3%;height:12%;background:repeating-linear-gradient(#C9A227 0 2px,transparent 2px 6px);opacity:.6}
.cs-lamp{position:absolute;top:0;width:2px;height:var(--h,18%);background:#7A5C1E}
.cs-lamp::after{content:"";position:absolute;left:50%;bottom:-1.4cqw;width:2.4cqw;height:1.6cqw;transform:translateX(-50%);background:linear-gradient(#F5C842,#9a7a24);clip-path:polygon(30% 0,70% 0,100% 100%,0 100%);box-shadow:0 0 0 0 transparent}
.cs-glow{position:absolute;width:26cqw;height:26cqw;border-radius:50%;transform:translate(-50%,-30%);background:radial-gradient(circle,rgba(245,200,66,.16),transparent 62%);pointer-events:none;animation:csFlick 5s ease-in-out infinite}
@keyframes csFlick{50%{opacity:.75}}
.cs-floor{position:absolute;left:-40%;right:-40%;top:50%;height:95%;transform-origin:50% 0;transform:perspective(46cqw) rotateX(62deg);
  background:linear-gradient(90deg,transparent 46%,rgba(201,162,39,.75) 46% 46.4%,#1b3466 46.4% 53.6%,rgba(201,162,39,.75) 53.6% 54%,transparent 54%),
  repeating-linear-gradient(90deg,rgba(201,162,39,.16) 0 1px,transparent 1px 6.25%),repeating-linear-gradient(0deg,rgba(201,162,39,.16) 0 1px,transparent 1px 9%),
  conic-gradient(#15110c 25%,#0b0907 0 50%,#15110c 0 75%,#0b0907 0) 0 0/12.5% 18%}
.cs-shade{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 70%,transparent 40%,rgba(0,0,0,.55) 100%)}
.cs-ht{position:absolute;pointer-events:none;width:34%;height:40%;background:radial-gradient(circle,rgba(201,162,39,.16) 1px,transparent 1.6px) 0 0/8px 8px;transform:skewX(-14deg)}
/* Marquesina */
.cs-sign{position:absolute;left:50%;top:6%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.3cqw;padding:1.1cqw 2.4cqw .9cqw;
  border:.55cqw solid transparent;background:linear-gradient(#0A0A08,#0A0A08) padding-box,repeating-linear-gradient(90deg,#F5C842 0 .6cqw,#5a4416 .6cqw 1.2cqw) border-box;background-size:auto,1.2cqw 100%;
  box-shadow:0 0 30px rgba(245,200,66,.25),0 10px 30px rgba(0,0,0,.6);animation:csChase 1.2s steps(2) infinite}
@keyframes csChase{to{background-position:0 0,1.2cqw 0}}
.cs-sign .word{--fs:4.6cqw}
.cs-sign small{font:700 1.15cqw/1 var(--f-egypt);letter-spacing:.5em;color:var(--gold-hi)}
/* Estaciones */
.cs-st{position:absolute;left:calc(var(--x)*1%);top:calc(var(--y)*1%);width:calc(var(--w)*1cqw);transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;border:0;padding:0;background:none;cursor:pointer;color:inherit;transition:transform .2s cubic-bezier(.3,1.4,.5,1),filter .2s}
.cs-st:focus-visible{outline:none}
.cs-st.sel{transform:translate(-50%,-100%) scale(1.05);z-index:3}
.cs-st:not(.sel){filter:brightness(.78) saturate(.85)}
.cs-st.sealed:not(.sel){filter:brightness(.55) saturate(.6)}
.cs-crup{position:relative;width:40%;margin-bottom:-14%;z-index:1;filter:drop-shadow(0 0 .6cqw rgba(245,200,66,.25))}
.cs-crup svg{display:block;width:100%}
.cs-crup.img{width:62%;margin-bottom:-18%}
.cs-crup.img img{display:block;width:100%}
.cs-st[data-id="ruleta"] .cs-crup.img{width:50%}.cs-st[data-id="senet"] .cs-crup.img{width:56%}
.cs-tab{position:relative;z-index:2;width:100%;aspect-ratio:2.4/1;display:grid;place-items:center}
.cs-felt{position:absolute;inset:8% 0 0;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,var(--fa),var(--fb) 45%,var(--fc) 75%,var(--fd));box-shadow:0 0 0 .3cqw #0A0A08,0 0 0 .7cqw #C9A227,0 0 0 .95cqw #0A0A08,0 1.4cqw 1.6cqw rgba(0,0,0,.65)}
.cs-felt.half{border-radius:12% 12% 50% 50%/12% 12% 70% 70%}
.cs-mini{position:relative;z-index:1;display:flex;gap:.3cqw;--cw:2.6cqw;transform:translateY(8%)}
.cs-mini .tc-card{--cw:2.6cqw}
.cs-mini .tc-card:nth-child(odd){transform:rotate(-7deg)}.cs-mini .tc-card:nth-child(even){transform:rotate(6deg)}
.cs-med{position:absolute;z-index:3;width:3.4cqw;aspect-ratio:1;border-radius:50%;background:#0A0A08;box-shadow:0 0 0 .2cqw #C9A227;display:grid;place-items:center;font-family:var(--f-glyph);font-size:2cqw;color:var(--gold-hi);transform:translate(-50%,-50%)}
.cs-wheel{position:relative;z-index:1;width:50%;transform:translateY(5%) perspective(30cqw) rotateX(46deg);filter:drop-shadow(0 .5cqw .4cqw rgba(0,0,0,.6))}
.cs-wheel svg{display:block;width:100%}
.mw-rot{transform-box:view-box;transform-origin:50% 50%;animation:mwSpin 16s linear infinite}
@keyframes mwSpin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.mw-rot{animation:none}}
.cs-senet{position:relative;z-index:1;width:80%;aspect-ratio:10/3;display:grid;grid-template-columns:repeat(10,1fr);gap:.12cqw;padding:.3cqw;background:#3a2a14;box-shadow:0 0 0 .25cqw #C9A227,0 .8cqw 1cqw rgba(0,0,0,.6);transform:perspective(20cqw) rotateX(28deg)}
.cs-senet i{background:#E6D7B3;font-style:normal;font-family:var(--f-glyph);font-size:.9cqw;color:#7A5C1E;display:grid;place-items:center}
.cs-senet i:nth-child(3n){background:#cdbb91}
.cs-booth{position:relative;z-index:2;width:100%;aspect-ratio:1.5/1}
.cs-awn{position:absolute;left:-4%;right:-4%;top:0;height:22%;background:repeating-linear-gradient(90deg,#C9A227 0 12.5%,#0A0A08 12.5% 25%);clip-path:polygon(0 0,100% 0,100% 70%,93.75% 100%,87.5% 70%,81.25% 100%,75% 70%,68.75% 100%,62.5% 70%,56.25% 100%,50% 70%,43.75% 100%,37.5% 70%,31.25% 100%,25% 70%,18.75% 100%,12.5% 70%,6.25% 100%,0 70%)}
.cs-shelf{position:absolute;left:6%;right:6%;top:28%;display:flex;justify-content:space-around;--cw:2.2cqw;border-bottom:.3cqw solid #7A5C1E;padding-bottom:.2cqw}
.cs-counter{position:absolute;left:0;right:0;bottom:0;height:38%;background:linear-gradient(#2a2015,#120e09);box-shadow:0 0 0 .2cqw #C9A227 inset,0 1cqw 1.4cqw rgba(0,0,0,.6)}
.cs-counter::before{content:"𓃠 𓋹 𓃠";position:absolute;inset:0;display:grid;place-items:center;font-family:var(--f-glyph);font-size:1.6cqw;color:rgba(245,200,66,.55);letter-spacing:.4em}
.cs-booth .cs-crup{position:absolute;left:50%;bottom:30%;transform:translateX(-50%);width:34%;margin:0;z-index:-1}
.cs-booth.has-img .cs-crup{width:36%;bottom:33%;z-index:1;filter:drop-shadow(0 0 .8cqw rgba(245,200,66,.3))}
.cs-booth.has-img .cs-shelf{top:auto;bottom:38%;left:2%;right:2%;justify-content:space-between;border:0;z-index:2}
.cs-booth.has-img .cs-shelf .tc-card:nth-child(2){margin-right:auto;margin-left:4%}.cs-booth.has-img .cs-shelf .tc-card:nth-child(3){margin-right:4%}
.cs-booth .cs-counter{z-index:3}
.cs-st:not(.sel) .cs-crup.img{filter:none}
.cs-plate{position:relative;z-index:4;margin-top:1.2cqw;display:flex;flex-direction:column;align-items:center;gap:.25cqw;background:var(--ink);border:1px solid rgba(201,162,39,.7);padding:.5cqw 1cqw .45cqw;transform:skewX(-10deg);box-shadow:.35cqw .35cqw 0 rgba(201,162,39,.4);white-space:nowrap;transition:background .15s,transform .2s}
.cs-plate b{font:400 1.5cqw/1 var(--f-cond);letter-spacing:.08em;color:var(--ivory)}
.cs-plate small{font:700 .75cqw/1 var(--f-ui);letter-spacing:.24em;color:var(--gold)}
.cs-st.sel .cs-plate{background:var(--gold-hi);border-color:var(--ink);box-shadow:.35cqw .35cqw 0 var(--ink),.5cqw .5cqw 0 var(--ivory);animation:tcJolt .26s ease-out}
.cs-st.sel .cs-plate b,.cs-st.sel .cs-plate small{color:var(--ink)}
.cs-st .cs-lock{position:absolute;z-index:5;top:auto;bottom:30%;left:50%;transform:translate(-50%,-50%) rotate(-10deg);font:400 1.2cqw/1 var(--f-cond);letter-spacing:.14em;color:#7FA2E8;border:.2cqw double #7FA2E8;padding:.35cqw .7cqw .25cqw;background:rgba(10,10,8,.7)}
.cs-ptr{position:absolute;z-index:6;left:50%;top:-2.6cqw;transform:translateX(-50%);font-family:var(--f-glyph);font-size:2.4cqw;color:var(--gold-hi);text-shadow:0 0 1cqw rgba(245,200,66,.8);opacity:0;transition:opacity .15s}
.cs-st.sel .cs-ptr{opacity:1;animation:csBob .7s ease-in-out infinite}
@keyframes csBob{50%{transform:translate(-50%,-.5cqw)}}
/* Puertas entre salas */
.cs-door{position:relative;z-index:2;width:100%;aspect-ratio:.62;border-radius:50% 50% 0 0/26% 26% 0 0;background:radial-gradient(ellipse at 50% 70%,rgba(245,170,70,.55),rgba(120,60,20,.35) 45%,#0A0A08 80%);box-shadow:0 0 0 .35cqw #0A0A08,0 0 0 .75cqw #C9A227,0 0 0 1cqw #0A0A08,0 0 3cqw rgba(245,200,66,.35);display:grid;place-items:center;overflow:hidden}
.cs-door[data-to="anubis"]{background:radial-gradient(ellipse at 50% 70%,rgba(80,120,200,.5),rgba(20,40,90,.4) 45%,#0A0A08 80%)}
.cs-door b{display:block;width:62%;filter:drop-shadow(0 0 .8cqw rgba(245,200,66,.9));animation:csDoor 1.6s ease-in-out infinite}.cs-door b svg{display:block;width:100%}
.cs-sign{width:max-content}.cs-scene.room-ra .cs-sign .word{margin:0 .3em 0 .1em}
@keyframes csDoor{50%{transform:translateY(-8%);opacity:.75}}
.cs-st.door .cs-plate b{font-size:1.15cqw}.cs-st.door .cs-plate small{display:none}
/* Mesas del Salón de Ra */
.cs-slots{position:relative;z-index:2;width:100%;display:flex;justify-content:center;gap:4%;align-items:flex-end}
.cs-slot{position:relative;width:29%;aspect-ratio:.62;background:linear-gradient(#3a2610,#140c05);border:.25cqw solid #C9A227;border-radius:1.2cqw 1.2cqw .4cqw .4cqw;box-shadow:0 0 0 .25cqw #0A0A08,0 1cqw 1.2cqw rgba(0,0,0,.6);display:flex;flex-direction:column;align-items:center;padding:12% 8% 8%;box-sizing:border-box;gap:8%}
.cs-slot::before{content:"";width:46%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 38% 34%,#FFD27A,#F06A3C 50%,#9C2B18);box-shadow:0 0 0 .2cqw #C9A227,0 0 1.4cqw rgba(240,106,60,.8);animation:slPulseM 2.4s ease-in-out infinite;animation-delay:var(--d)}
@keyframes slPulseM{50%{box-shadow:0 0 0 .2cqw #C9A227,0 0 2.6cqw rgba(240,106,60,1)}}
.cs-slot .rl{width:100%;display:grid;grid-template-columns:repeat(3,1fr);gap:4%;background:#F4EFE3;padding:6%;box-sizing:border-box;box-shadow:inset 0 0 0 .15cqw #0A0A08}
.cs-slot .rl i{aspect-ratio:1;background:url("juegos/logros/iconos.webp") 0 0/800% 500% no-repeat}
.cs-slot .lv{position:absolute;right:-14%;top:30%;width:8%;height:30%;background:linear-gradient(90deg,#7A5C1E,#F5C842,#7A5C1E)}
.cs-slot .lv::after{content:"";position:absolute;left:-60%;top:-20%;width:220%;aspect-ratio:1;border-radius:50%;background:#C2412D;box-shadow:0 0 0 .15cqw #0A0A08}
.cs-dice{position:relative;z-index:1;display:flex;gap:.7cqw;transform:translateY(10%)}
.cs-dice i{width:2.4cqw;aspect-ratio:1;border-radius:22%;background:linear-gradient(145deg,#FBF6EA,#E3D7BC);box-shadow:0 .25cqw 0 #7A5C1E;transform:rotate(var(--r));display:grid;place-items:center;font-style:normal;font:400 1.5cqw/1 var(--f-cond);color:#0A0A08}
.cs-scene.room-ra .cs-bg{display:none!important}
.cs-sunglow{display:none;position:absolute;left:50%;top:27%;width:30cqw;height:30cqw;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(255,200,90,.35),rgba(255,140,40,.1) 45%,transparent 68%);mix-blend-mode:screen;pointer-events:none;animation:csFlick 3.4s ease-in-out infinite}
.cs-scene.room-ra .cs-sunglow{display:block}
.cs-scene.fade{animation:csRoom .5s ease}
@keyframes csRoom{0%{filter:brightness(1)}40%{filter:brightness(0) blur(2px)}100%{filter:brightness(1)}}
.cs-st[data-room]:not(.here){display:none}
.cs-st[data-id="dados"] .cs-crup.img,.cs-st[data-id="mayormenor"] .cs-crup.img{width:52%}
/* Vertical (móvil) */
@container (max-aspect-ratio:1/1){
  .cs-st{left:calc(var(--px)*1%);top:calc(var(--py)*1%);width:calc(var(--pw)*1cqw)}
  .cs-frieze{font-size:4cqw;top:2%}
  .cs-sign{top:5.5%;padding:2cqw 4cqw 1.6cqw;border-width:1cqw;background-size:auto,2.2cqw 100%}
  @keyframes csChase{to{background-position:0 0,2.2cqw 0}}
  .cs-sign .word{--fs:10cqw}.cs-sign small{font-size:2.3cqw}
  .cs-wall{height:36%}.cs-pil{height:36%}.cs-floor{top:36%}
  .cs-plate{margin-top:2.2cqw;padding:1cqw 2cqw .9cqw}.cs-plate b{font-size:3.2cqw}.cs-plate small{font-size:1.6cqw}
  .cs-mini,.cs-mini .tc-card{--cw:5.4cqw}.cs-shelf{--cw:4.6cqw}
  .cs-med{width:7cqw;font-size:4cqw}.cs-lock{font-size:2.6cqw}.cs-ptr{font-size:5cqw;top:-5.5cqw}
  .cs-counter::before{font-size:3.4cqw}.cs-senet i{font-size:1.9cqw}
  .cs-glow{width:60cqw;height:60cqw}
  .cs-booth.has-img .cs-crup{width:30%}
  .cs-crup.img{width:44%;margin-bottom:-13%}
  .cs-st[data-id="ruleta"] .cs-crup.img,.cs-st[data-id="senet"] .cs-crup.img{width:42%}
  .cs-st.door .cs-plate b{font-size:2.4cqw}.cs-dice i{width:5cqw;font-size:3cqw}.cs-sunglow{top:22%;width:70cqw;height:70cqw}
  .cs-st[data-id="dados"] .cs-crup.img,.cs-st[data-id="mayormenor"] .cs-crup.img{width:44%}
}

/* Fondo ilustrado (si carga, sustituye a la sala dibujada con código) */
.cs-scene.has-bg{background:var(--bgh) center/cover no-repeat}
.cs-scene.has-bg .cs-wall,.cs-scene.has-bg .cs-pil,.cs-scene.has-bg .cs-lamp,.cs-scene.has-bg .cs-floor,.cs-scene.has-bg .cs-ht,.cs-scene.has-bg .cs-glow{display:none}
.cs-bg{display:none;position:absolute;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(245,200,66,.30),rgba(245,200,66,.08) 40%,transparent 68%);mix-blend-mode:screen;pointer-events:none;animation:csFlick 4.6s ease-in-out infinite;animation-delay:var(--d,0s)}
.cs-scene.has-bg .cs-bg.h{display:block}
.cs-scene.has-bg .cs-sign{top:5.4%;gap:.15cqw;padding:.55cqw 1.5cqw .45cqw;border-width:.38cqw;background-size:auto,.76cqw 100%;box-shadow:0 0 22px rgba(245,200,66,.3)}
@keyframes csChaseS{to{background-position:0 0,.76cqw 0}}
.cs-scene.has-bg .cs-sign{animation-name:csChaseS}
.cs-scene.has-bg .cs-sign .word{--fs:3.3cqw}
.cs-scene.has-bg .cs-sign small{font-size:.85cqw}
@container (max-aspect-ratio:1/1){
  .cs-scene.has-bg{background-image:var(--bgv)}
  .cs-scene.has-bg .cs-bg.h{display:none}.cs-scene.has-bg .cs-bg.v{display:block}
  .cs-scene.has-bg .cs-sign{top:3.9%;padding:1cqw 2.6cqw .8cqw;border-width:.7cqw;background-size:auto,1.4cqw 100%}
  @keyframes csChaseV{to{background-position:0 0,1.4cqw 0}}
  .cs-scene.has-bg .cs-sign{animation-name:csChaseV}
  .cs-scene.has-bg .cs-sign .word{--fs:6.6cqw}.cs-scene.has-bg .cs-sign small{font-size:1.6cqw}
}
/* HUD */
.cs-hud{position:absolute;left:0;right:0;top:0;z-index:7;display:flex;align-items:center;gap:12px;padding:14px max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px));pointer-events:none}
.cs-hud>*{pointer-events:auto}
.cs-hud .esc{margin:0}
.cs-hud .ankh-count{margin:0 0 0 auto}
.cs-hint{position:absolute;left:50%;top:22px;transform:translateX(-50%);z-index:6;font:700 10px/1 var(--f-ui);letter-spacing:.3em;color:rgba(244,239,227,.55);white-space:nowrap;pointer-events:none}
/* Diálogo del crupier */
.cs-dlg{position:absolute;left:50%;bottom:max(14px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:7;width:min(860px,calc(100% - 230px));box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px 18px;
  background:rgba(10,10,8,.94);border:1.5px solid var(--gold);box-shadow:6px 6px 0 rgba(201,162,39,.35);padding:18px 18px 14px}
.cs-dlg[hidden]{display:none}
.cs-who{position:absolute;left:14px;top:-15px;font:400 15px/1 var(--f-cond);letter-spacing:.14em;background:var(--gold-hi);color:var(--ink);padding:6px 12px 4px;transform:skewX(-12deg);box-shadow:3px 3px 0 var(--ink)}
.cs-say{margin:4px 0 0;font:500 15.5px/1.45 var(--f-ui);color:rgba(244,239,227,.92);min-height:2.9em}
.cs-say .tw{animation:fadeUp .25s ease both}
.cs-go{font:400 20px/1 var(--f-cond);letter-spacing:.08em;border:0;padding:11px 18px 9px;transform:skewX(-10deg);cursor:pointer;background:var(--gold-hi);color:var(--ink);box-shadow:4px 4px 0 var(--ivory);white-space:nowrap}
.cs-go:hover,.cs-go:focus-visible{background:var(--ivory)}
.cs-go[disabled]{background:transparent;color:rgba(244,239,227,.45);box-shadow:inset 0 0 0 1.5px rgba(244,239,227,.3);cursor:default}
.cs-go kbd{font:700 10px/1 var(--f-ui);margin-left:8px;opacity:.6}
@media (hover:none) and (pointer:coarse){.cs-go kbd{display:none}}
/* Modales */
.cs-modal{position:absolute;inset:0;z-index:9;display:grid;place-items:center;padding:70px 14px 20px;background:rgba(5,4,3,.72);backdrop-filter:blur(3px)}
.cs-modal[hidden]{display:none}
.cs-card{position:relative;box-sizing:border-box;width:min(560px,100%);max-height:100%;overflow:auto;background:var(--ink);border:1.5px solid var(--gold);box-shadow:8px 8px 0 rgba(201,162,39,.4);padding:22px 22px 20px;animation:sheetIn .32s cubic-bezier(.2,.9,.3,1.1) both}
.cs-card h3{margin:0 0 4px;font:400 clamp(26px,4vw,38px)/1 var(--f-cond);letter-spacing:.04em;color:var(--ivory)}
.cs-card .k{font:700 10px/1 var(--f-ui);letter-spacing:.32em;color:var(--gold)}
.cs-card p{font:500 14.5px/1.45 var(--f-ui);color:rgba(244,239,227,.82);margin:10px 0}
.cs-opts{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0 8px}
.cs-opt{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;border:0;background:none;cursor:pointer;padding:4px;color:var(--ivory);transition:transform .15s}
.cs-opt .tc-chip{--chw:62px;font-size:17px}
.cs-opt span{font:600 11px/1 var(--f-ui);letter-spacing:.12em;color:rgba(244,239,227,.7)}
.cs-opt i.g,.cs-card i.g{font-style:normal;font-family:var(--f-glyph)}
.cs-opt.sel{transform:translateY(-6px)}
.cs-opt.sel .tc-chip{box-shadow:0 0 0 3px var(--gold-hi),0 0 18px rgba(245,200,66,.6)}
.cs-opt[disabled]{opacity:.3;cursor:default}
.cs-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}
.cs-btn{font:400 18px/1 var(--f-cond);letter-spacing:.08em;border:0;padding:10px 16px 8px;transform:skewX(-10deg);cursor:pointer;background:var(--gold-hi);color:var(--ink);box-shadow:4px 4px 0 var(--ivory)}
.cs-btn.alt{background:transparent;color:var(--ivory);box-shadow:inset 0 0 0 1.5px rgba(244,239,227,.6)}
.cs-btn:hover,.cs-btn:focus-visible{background:var(--ivory);color:var(--ink)}
.cs-btn[disabled]{opacity:.35;cursor:default}
.cs-btn kbd{font:700 10px/1 var(--f-ui);margin-left:8px;opacity:.6}
@media (hover:none) and (pointer:coarse){.cs-btn kbd{display:none}}
.cs-note{font:600 12px/1.4 var(--f-ui)!important;color:rgba(244,239,227,.55)!important}
/* Bazar */
.cs-shop{width:min(900px,100%);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:18px}
.cs-shop .head{grid-column:1/-1;display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap}
.cs-shop .head .ankh-count{margin:0 0 0 auto;font-size:18px}
.cs-tabs{grid-column:1/-1;display:flex;gap:10px}
.cs-sk{width:78px;height:96px;object-fit:cover;object-position:50% 0;margin:-14px 0 -8px -4px;filter:drop-shadow(0 0 10px rgba(245,200,66,.35));animation:dropIn .45s cubic-bezier(.3,1.4,.5,1) .1s both}
.cs-tb{font:400 17px/1 var(--f-cond);letter-spacing:.1em;border:0;cursor:pointer;padding:8px 14px 6px;transform:skewX(-10deg);background:transparent;color:rgba(244,239,227,.65);box-shadow:inset 0 0 0 1.5px rgba(244,239,227,.3)}
.cs-tb.on{background:var(--ivory);color:var(--ink);box-shadow:4px 4px 0 var(--gold)}
.cs-list{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
.cs-item{display:flex;align-items:center;gap:10px;width:100%;border:0;cursor:pointer;text-align:left;background:rgba(244,239,227,.04);color:var(--ivory);padding:9px 12px;transform:skewX(-6deg);box-shadow:inset 0 0 0 1px rgba(201,162,39,.25);transition:background .12s}
.cs-item>*{transform:skewX(6deg)}
.cs-item.sel{background:var(--gold-hi);color:var(--ink);box-shadow:4px 4px 0 var(--ink),5px 5px 0 var(--ivory)}
.cs-item b{font:400 18px/1 var(--f-cond);letter-spacing:.05em;flex:1}
.cs-item em{font:700 11px/1 var(--f-ui);font-style:normal;letter-spacing:.14em;white-space:nowrap}
.cs-item em i{font-style:normal;font-family:var(--f-glyph);margin-right:4px}
.cs-item .sw{width:22px;height:22px;flex:none;border-radius:4px;box-shadow:0 0 0 1px var(--gold)}
.cs-prev{position:relative;min-height:240px;border-radius:999px/60%;display:grid;place-items:center;box-shadow:0 0 0 3px #0A0A08,0 0 0 7px #7A5C1E,0 0 0 9px #C9A227,0 0 0 12px #0A0A08}
.cs-prev .cards{display:flex;gap:14px;--cw:clamp(60px,9vw,96px)}
.cs-prev .cards .tc-card:first-child{transform:rotate(-8deg)}.cs-prev .cards .tc-card:last-child{transform:rotate(7deg)}
.cs-act{grid-column:1/-1;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.cs-act .msg{font:400 18px/1 var(--f-cond);letter-spacing:.08em;color:var(--gold-hi)}
@media (max-width:720px){.cs-dlg{width:calc(100% - 28px);bottom:58px;padding:16px 12px 11px;gap:6px 10px}.cs-say{font-size:13.5px;line-height:1.35;min-height:0;margin:2px 0 0}.cs-go{font-size:16px;padding:9px 12px 7px}#cs-sub{display:none}.cs-shop{grid-template-columns:1fr}.cs-prev{min-height:170px;order:-1}.cs-hint{display:none}}
`;

function mount(stage,host){
  const api=host;const S=C.sounds(api);const touch=matchMedia('(hover:none) and (pointer:coarse)').matches;
  const root=C.mount(stage,CSS);
  const fmt=n=>Number(n).toLocaleString('es-ES');
  const esc=host.esc;
  root.insertAdjacentHTML('beforeend',`<div class="cs-wrap"><div class="cs-scene" id="cs-scene">
    <div class="cs-wall"><div class="cs-frieze" aria-hidden="true">${'𓂀 𓋹 𓆣 𓇳 𓁢 𓅝 𓃠 𓆋 𓊽 𓎛 '.repeat(6)}</div></div>
    ${[6,27,73,94].map(x=>'<div class="cs-pil" style="left:'+(x-2.3)+'%"></div>').join('')}
    ${[[17,16],[39,22],[61,22],[83,16]].map(([x,h])=>'<div class="cs-lamp" style="left:'+x+'%;--h:'+h+'%"></div><div class="cs-glow" style="left:'+x+'%;top:'+(h+2)+'%"></div>').join('')}
    <div class="cs-floor"></div><div class="cs-ht" style="left:-6%;top:6%"></div><div class="cs-ht" style="right:-8%;bottom:-6%"></div>
    <i class="cs-bg h" style="left:18.5%;top:11%;width:13cqw;height:13cqw;--d:0s"></i><i class="cs-bg h" style="left:29.5%;top:18%;width:10cqw;height:10cqw;--d:1.3s"></i><i class="cs-bg h" style="left:70%;top:18%;width:10cqw;height:10cqw;--d:0.7s"></i><i class="cs-bg h" style="left:81.5%;top:11%;width:13cqw;height:13cqw;--d:2s"></i><i class="cs-bg h" style="left:27%;top:31%;width:6cqw;height:6cqw;--d:0.4s"></i><i class="cs-bg h" style="left:36.5%;top:31%;width:6cqw;height:6cqw;--d:1.8s"></i><i class="cs-bg h" style="left:63.5%;top:31%;width:6cqw;height:6cqw;--d:1.1s"></i><i class="cs-bg h" style="left:73%;top:31%;width:6cqw;height:6cqw;--d:2.4s"></i><i class="cs-bg v" style="left:10%;top:12%;width:26cqw;height:26cqw;--d:0s"></i><i class="cs-bg v" style="left:90%;top:12%;width:26cqw;height:26cqw;--d:1.5s"></i><i class="cs-bg v" style="left:4%;top:20%;width:13cqw;height:13cqw;--d:0.6s"></i><i class="cs-bg v" style="left:23%;top:20%;width:13cqw;height:13cqw;--d:2.1s"></i><i class="cs-bg v" style="left:77%;top:20%;width:13cqw;height:13cqw;--d:1s"></i><i class="cs-bg v" style="left:96%;top:20%;width:13cqw;height:13cqw;--d:2.6s"></i>
    <i class="cs-sunglow"></i><div class="cs-sign" aria-hidden="true"><span class="word" id="cs-title"></span><small id="cs-signsub">DE ANUBIS</small></div>
    <div id="cs-st"></div><div class="cs-shade"></div></div></div>
    <div class="cs-hud"><button class="esc" type="button" id="cs-back"></button><span class="ankh-count" id="cs-wallet"></span></div>
    <div class="cs-hint" id="cs-hint"></div>
    <div class="cs-dlg" id="cs-dlg" hidden><span class="cs-who" id="cs-who"></span><div><div class="k" id="cs-sub" style="font:700 10px/1 var(--f-ui);letter-spacing:.3em;color:var(--gold)"></div><p class="cs-say" id="cs-say"></p></div><button class="cs-go" type="button" id="cs-go"></button></div>
    <div class="cs-modal" id="cs-modal" hidden></div>`);
  const $=s=>root.querySelector(s);
  host.collage($('#cs-title'),TX.title);
  /* Fondo ilustrado: se aplica cuando han cargado las dos versiones (horizontal y vertical) */
  const BGS={anubis:['sala-h.webp','sala-v.webp'],ra:['ra-h.webp','ra-v.webp']},bgOk={};
  function applyBg(){const sc=$('#cs-scene'),b=BGS[room];if(!bgOk[room]){sc.classList.remove('has-bg');
      let n=0;b.forEach(f=>{const im=new Image();im.onload=()=>{if(++n===2){bgOk[room]=true;if(BGS[room]===b)applyBg()}};im.src=host.base+'casino/'+f});return}
    sc.style.setProperty('--bgh','url("'+host.base+'casino/'+b[0]+'")');sc.style.setProperty('--bgv','url("'+host.base+'casino/'+b[1]+'")');sc.classList.add('has-bg')}
  let room='anubis',ORDER=ORDERS.anubis;
  $('#cs-back').textContent=touch?TX.backTouch:TX.back;$('#cs-back').addEventListener('click',()=>host.back());
  $('#cs-hint').textContent=touch?TX.hintTouch:TX.hintKeys;
  C.feltVars($('#cs-scene'),host.equip.felt);

  /* --- Estaciones --- */
  const stEl=$('#cs-st');const els={};
  function stationHTML(s){let inner='';
    const crup=s.head?'<span class="cs-crup" data-who="'+s.id+'">'+crupSVG(s.head)+'</span>':'';
    if(s.id==='poker')inner='<span class="cs-tab"><span class="cs-felt"></span><span class="cs-mini" data-cards="5"></span>'+
      '<span class="cs-med" style="left:6%;top:52%">𓆋</span><span class="cs-med" style="left:50%;top:6%">𓅝</span><span class="cs-med" style="left:94%;top:52%">𓃠</span></span>';
    else if(s.id==='blackjack')inner=crup+'<span class="cs-tab"><span class="cs-felt half"></span><span class="cs-mini" data-cards="2"></span></span>';
    else if(s.id==='ruleta')inner=crup+'<span class="cs-tab"><span class="cs-felt"></span><span class="cs-wheel">'+miniWheel('')+'</span></span>';
    else if(s.id==='senet')inner=crup+'<span class="cs-tab"><span class="cs-senet">'+Array.from({length:30},(_,i)=>'<i>'+(i===14?'𓋹':i===25?'𓄤':i===29?'𓇳':'')+'</i>').join('')+'</span></span>';
    else if(s.door)inner='<span class="cs-door" data-to="'+s.door+'"><b><svg viewBox="0 0 40 40" aria-hidden="true">'+(s.door==='ra'?'<circle cx="20" cy="20" r="8" fill="#F5C842" stroke="#0A0A08" stroke-width="2"/>'+Array.from({length:8},(_,i)=>'<path d="M20 4v6" stroke="#F5C842" stroke-width="3" stroke-linecap="round" transform="rotate('+i*45+' 20 20)"/>').join(''):'<path d="M20 6 9 20h7v14h8V20h7z" fill="#F5C842" stroke="#0A0A08" stroke-width="2" stroke-linejoin="round"/>')+'</svg></b></span>';
    else if(s.id==='tragaperras'){const ic=n=>'background-position:'+((n%8)/7*100).toFixed(2)+'% '+(Math.floor(n/8)/4*100).toFixed(2)+'%';
      inner='<span class="cs-slots">'+[[15,37,15],[12,15,22],[37,37,39]].map((r,i)=>'<span class="cs-slot" style="--d:-'+(i*.8)+'s"><span class="rl">'+r.map(n=>'<i style="'+ic(n)+'"></i>').join('')+'</span><span class="lv"></span></span>').join('')+'</span>'}
    else if(s.id==='dados')inner=crup+'<span class="cs-tab"><span class="cs-felt half"></span><span class="cs-dice"><i style="--r:-12deg">5</i><i style="--r:9deg">3</i><i style="--r:-4deg">6</i></span></span>';
    else if(s.id==='mayormenor')inner=crup+'<span class="cs-tab"><span class="cs-felt half"></span><span class="cs-mini" data-cards="2"></span></span>';
    else if(s.id==='bazar')inner='<span class="cs-booth"><span class="cs-awn"></span><span class="cs-shelf" data-shelf="1"></span>'+crup+'<span class="cs-counter"></span></span>';
    return '<span class="cs-ptr" aria-hidden="true">𓋹</span>'+inner+(s.sealed?'<span class="cs-lock">'+TX.soon+'</span>':'')+'<span class="cs-plate"><b>'+esc(s.name)+'</b><small>'+esc(s.sub)+'</small></span>'}
  STATIONS.forEach(s=>{const b=document.createElement('button');b.type='button';b.className='cs-st'+(s.sealed?' sealed':'')+(s.door?' door':'');b.dataset.id=s.id;b.dataset.room=s.room||'anubis';
    ['x','y','px','py','w','pw'].forEach(k=>b.style.setProperty('--'+k,s[k]));b.innerHTML=stationHTML(s);b.setAttribute('aria-label',s.name+' · '+s.sub+(s.sealed?' · '+TX.soon:''));
    b.addEventListener('mouseenter',()=>{if(!touch)select(s.id,true)});
    b.addEventListener('click',()=>{if(touch&&sel!==s.id){select(s.id,true);return}select(s.id,false);activate()});
    stEl.append(b);els[s.id]=b});
  function decorate(){/* cartas y estanterías con la estética equipada */
    root.querySelectorAll('[data-cards]').forEach(m=>{m.textContent='';const n=+m.dataset.cards;const deck=C.deck(1);
      for(let i=0;i<n;i++){const up=!((m.closest('[data-id="blackjack"]')||m.closest('[data-id="mayormenor"]'))&&i===1);const el=C.cardEl(deck[i],up);m.append(el)}});
    root.querySelectorAll('[data-shelf]').forEach(m=>{m.textContent='';['lapis','papiro','sol','oro'].forEach(k=>{const d=document.createElement('div');d.className='tc-card';
      d.innerHTML='<div class="tc-in"><div class="tc-f tc-back">'+C.BACKS[k].svg+'</div></div>';m.append(d)})});
    C.feltVars($('#cs-scene'),host.equip.felt)}
  decorate();
  /* Ilustraciones: las que ya existan (ART) sustituyen a la silueta provisional */
  root.querySelectorAll('.cs-crup').forEach(c=>{const f=ART[c.dataset.who];if(!f)return;const img=new Image();img.alt='';img.decoding='async';
    img.onload=()=>{c.classList.add('img');const bo=c.closest('.cs-booth');if(bo)bo.classList.add('has-img');c.innerHTML='';c.append(img)};img.src=host.base+'casino/'+f});

  /* --- Selección y diálogo --- */
  let sel=null;
  const dlg=$('#cs-dlg'),go=$('#cs-go');
  function stationById(id){return STATIONS.find(s=>s.id===id)}
  function select(id,sound){if(sel===id)return;sel=id;Object.entries(els).forEach(([k,b])=>b.classList.toggle('sel',k===id));if(sound)api.sfx.tick();
    const s=stationById(id);dlg.hidden=false;$('#cs-who').textContent=s.crup;$('#cs-sub').textContent=s.name+' · '+s.sub;
    const say=$('#cs-say');say.innerHTML='<span class="tw">'+esc(s.line)+'</span>';
    if(s.sealed){go.disabled=true;go.textContent=TX.soon}else{go.disabled=false;go.innerHTML=(s.door?esc(TX.goRoom):esc(s.shop?TX.bazar:TX.enter)+' ▸')+'<kbd>ENTER</kbd>'}
    root.style.setProperty('--dlg',dlg.offsetHeight+'px')}
  go.addEventListener('click',()=>activate());
  function activate(){const s=stationById(sel);if(!s)return;if(s.sealed){api.sfx.back();return}api.sfx.confirm();if(s.door){setRoom(s.door,true);return}if(s.shop)openShop();else openBuy(s)}
  function setRoom(r,anim){room=r;ORDER=ORDERS[r];const sc=$('#cs-scene');sc.classList.toggle('room-ra',r==='ra');
    if(anim){sc.classList.remove('fade');void sc.offsetWidth;sc.classList.add('fade');api.sfx.whoosh&&api.sfx.whoosh()}
    const paint=()=>{Object.values(els).forEach(b=>b.classList.toggle('here',b.dataset.room===r));host.collage($('#cs-title'),r==='ra'?TX.titleRa:TX.title);$('#cs-signsub').textContent=r==='ra'?TX.signRa:TX.signA;applyBg();
      sel=null;Object.values(els).forEach(b=>b.classList.remove('sel'));dlg.hidden=true;if(!touch||anim)select(r==='ra'?'tragaperras':'blackjack',false)};
    if(anim)setTimeout(paint,200);else paint()}
  function moveSel(d){const i=ORDER.indexOf(sel);const n=i<0?(d>0?0:ORDER.length-1):(i+d+ORDER.length)%ORDER.length;select(ORDER[n],true);els[ORDER[n]].focus({preventScroll:true})}

  /* --- Modales --- */
  const modal=$('#cs-modal');let mkey=null;
  function closeModal(sound){modal.hidden=true;modal.textContent='';mkey=null;if(sound)api.sfx.back();if(sel&&els[sel])els[sel].focus({preventScroll:true})}
  modal.addEventListener('click',e=>{if(e.target===modal)closeModal(true)});

  function openBuy(s){const have=host.ankhs;let opts=s.buys.map(v=>v==='all'?{v:have,all:true}:{v});
    opts=opts.filter((o,i,a)=>!o.all||(o.v>0&&!a.some(x=>!x.all&&x.v===o.v)));
    let k=Math.max(0,opts.findIndex(o=>o.v<=have&&o.v>0));if(!opts.some(o=>o.v<=have&&o.v>0))k=-1;
    modal.innerHTML='<div class="cs-card" role="dialog" aria-label="'+esc(TX.buyTitle)+'"><div class="k">'+esc(TX.buyTitle)+'</div><h3>'+esc(s.name)+'</h3>'+
      '<p>'+esc(s.line)+'</p><div class="cs-opts" id="cs-opts"></div><p class="cs-note" id="cs-for"></p><p class="cs-note">'+esc(k<0?TX.buyNo:TX.buyRule)+'</p>'+
      '<div class="cs-row"><button class="cs-btn" type="button" id="cs-ok">'+esc(TX.confirm)+'<kbd>ENTER</kbd></button><button class="cs-btn alt" type="button" id="cs-no">'+esc(TX.cancel)+'<kbd>ESC</kbd></button></div></div>';
    modal.hidden=false;const box=$('#cs-opts');
    function paint(){box.querySelectorAll('.cs-opt').forEach((b,i)=>b.classList.toggle('sel',i===k));$('#cs-for').textContent=k>=0?TX.buyFor.replace('{n}',fmt(opts[k].v*RATE)):'';$('#cs-ok').disabled=k<0}
    opts.forEach((o,i)=>{const b=document.createElement('button');b.type='button';b.className='cs-opt';b.disabled=o.v>have||o.v<=0;
      const chip=C.chipEl(o.v>=500?500:o.v>=100?100:o.v>=25?25:10);chip.textContent=fmt(o.v);b.append(chip);
      const l=document.createElement('span');l.innerHTML=(o.all?esc(TX.all)+' · ':'')+'<i class="g">𓋹</i> '+esc(TX.ankhs);b.append(l);
      b.setAttribute('aria-label',fmt(o.v)+' ankhs');b.addEventListener('click',()=>{if(b.disabled)return;k=i;S.chip(1);paint()});
      b.addEventListener('dblclick',()=>{if(!b.disabled){k=i;ok()}});box.append(b)});
    paint();
    function ok(){if(k<0)return;const v=opts[k].v;if(host.play(s.game,v)){closeModal(false)}}
    $('#cs-ok').addEventListener('click',ok);$('#cs-no').addEventListener('click',()=>closeModal(true));
    setTimeout(()=>{const b=$('#cs-ok');b&&!b.disabled&&b.focus({preventScroll:true})},60);
    mkey=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const d=e.key==='ArrowRight'?1:-1;let j=k;for(let n=0;n<opts.length;n++){j=(j+d+opts.length)%opts.length;if(opts[j].v<=have&&opts[j].v>0)break}if(j!==k&&opts[j].v<=have){k=j;S.chip(1);paint()}return true}
      if(e.key==='Enter'){e.preventDefault();ok();return true}
      if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();closeModal(true);return true}return false}}

  function openShop(){let tab='back',k=0,msg='';
    modal.innerHTML='<div class="cs-card cs-shop" role="dialog" aria-label="'+esc(TX.shopTitle)+'"><div class="head">'+(ART.bazar?'<img class="cs-sk" src="'+host.base+'casino/'+ART.bazar+'" alt="">':'')+'<div><div class="k">'+esc(TX.shopLine)+'</div><h3>'+esc(TX.shopTitle)+'</h3></div><span class="ankh-count" id="cs-sw"></span></div>'+
      '<div class="cs-tabs"><button class="cs-tb" type="button" data-tab="back">'+TX.tabBacks+'</button><button class="cs-tb" type="button" data-tab="felt">'+TX.tabFelts+'</button></div>'+
      '<ul class="cs-list" id="cs-list"></ul><div class="cs-prev tc-felt" id="cs-prev" style="position:relative"><div class="cards" id="cs-cards"></div></div>'+
      '<div class="cs-act"><button class="cs-btn" type="button" id="cs-do"></button><button class="cs-btn alt" type="button" id="cs-x">'+esc(touch?TX.closeTouch:TX.close)+'</button><span class="msg" id="cs-msg"></span></div></div>';
    modal.hidden=false;
    const items=()=>{const src=tab==='back'?C.BACKS:C.FELTS;return Object.keys(src).map(id=>Object.assign({id,key:tab+':'+id},src[id]))};
    function state(it){const eq=host.equip[tab]===it.id,own=it.price===0||host.owned(it.key);return{eq,own}}
    function paint(){const list=$('#cs-list');list.textContent='';const its=items();k=Math.min(k,its.length-1);
      root.querySelectorAll('.cs-tb').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
      its.forEach((it,i)=>{const st=state(it);const li=document.createElement('li');const b=document.createElement('button');b.type='button';b.className='cs-item'+(i===k?' sel':'');
        const sw=tab==='felt'?'<span class="sw" style="background:radial-gradient(circle,'+it.c[0]+','+it.c[2]+')"></span>':'<span class="sw" style="background:#0A0A08;overflow:hidden">'+it.svg.replace('<svg ','<svg width="22" height="22" preserveAspectRatio="xMidYMid slice" ')+'</span>';
        b.innerHTML=sw+'<b>'+esc(it.name)+'</b><em>'+(st.eq?TX.equipped:st.own?(it.price===0?TX.free:TX.owned):'<i>𓋹</i>'+fmt(it.price))+'</em>';
        b.addEventListener('mouseenter',()=>{if(!touch&&k!==i){k=i;api.sfx.tick();paint()}});b.addEventListener('click',()=>{if(k!==i){k=i;api.sfx.tick();paint()}else doIt()});
        li.append(b);list.append(li)});
      const it=its[k],st=state(it);
      const cards=$('#cs-cards');cards.textContent='';const prevBack=tab==='back'?it.id:host.equip.back,prevFelt=tab==='felt'?it.id:host.equip.felt;
      C.feltVars($('#cs-prev'),prevFelt);
      const b1=document.createElement('div');b1.className='tc-card';b1.innerHTML='<div class="tc-in"><div class="tc-f tc-back">'+C.BACKS[prevBack].svg+'</div></div>';
      const f=C.cardEl({r:'K',s:'o',v:13},true),b2=b1.cloneNode(true);cards.append(b1,f,b2);
      const btn=$('#cs-do');btn.disabled=false;
      if(st.eq){btn.textContent=TX.equipped;btn.disabled=true}else if(st.own){btn.innerHTML=TX.equip+'<kbd>ENTER</kbd>'}else{btn.innerHTML=TX.buy+' · 𓋹 '+fmt(it.price)+'<kbd>ENTER</kbd>';if(it.price>host.ankhs)btn.disabled=true}
      $('#cs-msg').textContent=msg||(!st.own&&it.price>host.ankhs?TX.noMoney.replace('{n}',fmt(it.price-host.ankhs)):'');msg='';
      $('#cs-sw').innerHTML='<i>𓋹</i>'+fmt(host.ankhs)+' '+TX.ankhs}
    function doIt(){const it=items()[k],st=state(it);if(st.eq)return;
      if(!st.own){if(!host.buy(it.key,it.price)){api.sfx.back();return}S.chip(3);S.win();msg=TX.bought}else api.sfx.confirm();
      host.equipSet(tab,it.id);paintWallet();decorate();paint()}
    root.querySelectorAll('.cs-tb').forEach(b=>b.addEventListener('click',()=>{if(tab!==b.dataset.tab){tab=b.dataset.tab;k=0;api.sfx.tick();paint()}}));
    $('#cs-do').addEventListener('click',doIt);$('#cs-x').addEventListener('click',()=>closeModal(true));
    paint();
    mkey=e=>{const n=items().length;
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();k=(k+(e.key==='ArrowDown'?1:-1)+n)%n;api.sfx.tick();paint();return true}
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();tab=tab==='back'?'felt':'back';k=0;api.sfx.tick();paint();return true}
      if(e.key==='Enter'){e.preventDefault();doIt();return true}
      if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();closeModal(true);return true}return false}}

  /* --- Cartera y regalo de la casa --- */
  function paintWallet(){$('#cs-wallet').innerHTML='<i>𓋹</i>'+fmt(host.ankhs)+' '+TX.ankhs}
  function refresh(){paintWallet();decorate();closeModal(false);if(!room||!$('#cs-scene').querySelector('.cs-st.here'))setRoom(room||'anubis',false);
    if(host.giftAvailable()){if(room!=='anubis')setRoom('anubis',false);const n=host.takeGift();paintWallet();setTimeout(()=>{C.banner(root,api,TX.giftTitle,'+'+n+' 𓋹 ANKHS',true);S.chip(3)},500);
      select('blackjack',false);$('#cs-who').textContent='ANUBIS';$('#cs-say').innerHTML='<span class="tw">'+esc(TX.giftLine)+'</span>'}
    else if(!sel&&!touch)select(room==='ra'?'tragaperras':'blackjack',false)}
  refresh();

  return{refresh,
    key(e){if(mkey)return mkey(e);const k=e.key;
      if(k==='ArrowRight'||k==='ArrowDown'||k==='d'||k==='D'){e.preventDefault();moveSel(1);return true}
      if(k==='ArrowLeft'||k==='ArrowUp'||k==='a'||k==='A'){e.preventDefault();moveSel(-1);return true}
      if((k==='Enter'||k===' ')&&sel){e.preventDefault();activate();return true}
      if(k==='Escape'||k==='Backspace'){e.preventDefault();host.back();return true}return false},
    get modalOpen(){return !modal.hidden}};
}
window.TEMPLO_CASINO={mount,RATE,GIFT};
})();
