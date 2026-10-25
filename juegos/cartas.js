/* Baraja del Templo — cartas, fichas, banners y barra de acciones compartidas por las mesas de casino.
   Palos: ankhs (♠), ojos (♥), escarabajos (♣) y plumas (♦). Todo en SVG/CSS, sin imágenes. */
(function(){
'use strict';
const L=window.TEMPLO_LIB=window.TEMPLO_LIB||{};
if(L.cartas)return;

const SUITS=[
  {k:'a',name:'ankhs',color:'#0A0A08'},
  {k:'o',name:'ojos',color:'#2456B8'},
  {k:'e',name:'escarabajos',color:'#14705C'},
  {k:'p',name:'plumas',color:'#A8361C'}];
const RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

/* ---------- Símbolos ---------- */
const SYM={
a:'<path fill-rule="evenodd" d="M12 .9C9.2.9 7.3 3.5 7.3 6.6c0 2.4 1.2 4 2.6 5H3V15l3.2-.9h4.1L9.2 23.1h5.6l-1.1-9h4.1L21 15v-3.4h-6.9c1.4-1 2.6-2.6 2.6-5C16.7 3.5 14.8.9 12 .9zm0 2.6c1.2 0 2.1 1.4 2.1 3.2 0 1.9-.9 3.5-2.1 3.5S9.9 8.6 9.9 6.7c0-1.8.9-3.2 2.1-3.2z"/>',
o:'<path d="M1.6 5.6C7.4 1.4 15.6.9 22.4 4.2l-.4 1.9C15.6 3.4 8 3.9 2.4 7.4z"/><path fill-rule="evenodd" d="M1.4 11.3C7.6 4.3 16.4 4 22.6 10.6 16.6 17.6 7.4 17.8 1.4 11.3zm3.8.1c4.6 3.9 9.8 3.9 13.6-.7-4.2-4.1-9.6-4.1-13.6.7z"/><circle cx="12" cy="10.9" r="3.3"/><path d="M9.4 15.2h2.3l-.8 7.9H8.6zM13.4 15c.7 3.4 2.4 5.4 4.6 5.4.9 0 1.4-.6 1.1-1.3l-1 .2c-.1.2-.3.2-.5.2-1.3-.1-2.2-1.9-2.6-4.8z"/>',
e:'<path d="M9 1.3Q12-.2 15 1.3l-.5 2.4H9.5z"/><ellipse cx="12" cy="5.9" rx="4.6" ry="2.3"/><path d="M11.3 8.7C5.6 9 4.6 13.3 5 15.9c.6 4 3.2 6.6 6.3 7.1zM12.7 8.7c5.7.3 6.7 4.6 6.3 7.2-.6 4-3.2 6.6-6.3 7.1z"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M7.2 5.2 3.4 3.1M16.8 5.2l3.8-2.1M5.6 12.3l-3.8.5M18.4 12.3l3.8.5M5.9 17.6l-3.1 2.6M18.1 17.6l3.1 2.6"/>',
p:'<path fill-rule="evenodd" d="M7.4 23.4C5.3 15.6 5.9 7.4 11.5 2.3c2.9-2.5 8.4-2.2 8.6.5.1 1.3-1 1.8-2.3 1.7-1.6 2.3-1.9 5.6-1.6 9.1.3 3.6-.3 6.9-1.8 9.8zm3.3-.7c-.2-7.2.6-13 4-17.9l.9.5c-3.1 4.8-3.8 10.4-3.6 17.4z"/><path d="M10 9.4l4.3-2.3.5.9-4.6 2.4zM8.9 13.9l5.2-2.2.3 1-5.5 2.2zM8.7 18.4l5.4-1.8.1 1-5.6 1.8z" fill="#EEE4CB" opacity=".85"/>'};

/* ---------- Figuras (panel tinta + silueta dorada) ---------- */
const COLLAR='<path d="M8 90c0-11 9.5-18 22-18s22 7 22 18z"/><path fill="none" stroke="#0A0A08" stroke-width="1.6" d="M12.5 90c0-8.6 7.7-14 17.5-14s17.5 5.4 17.5 14M17 90c0-6.3 5.8-10 13-10s13 3.7 13 10M21.5 90c0-4 3.8-6 8.5-6s8.5 2 8.5 6"/><g fill="#0A0A08"><circle cx="15" cy="84" r="1.1"/><circle cx="20" cy="79.6" r="1.1"/><circle cx="26" cy="77" r="1.1"/><circle cx="34" cy="77" r="1.1"/><circle cx="40" cy="79.6" r="1.1"/><circle cx="45" cy="84" r="1.1"/></g>';
const FACES={
/* J — Anubis, el chacal */
J:'<path d="M23 73c-2-6-2.6-12-1.6-18 .8-5 2.4-9.6 2.6-14.4L19.4 9.6c-.2-1.6 1.4-2.2 2.4-1L33 22.4c3.6-.6 7.2.4 9.8 2.8L55.6 33c1.4.9 1.2 3-.4 3.4L45 38.6c-2.6 1.6-4.4 4.6-5.2 8.4-.8 4.4-.4 8.6 1.2 13L43 73z"/><path fill="#0A0A08" d="M35.4 28.6c2.2-.9 4.4-.5 5.8 1-2 1.4-4.2 1.4-5.8-1zM23.8 15.4l6.4 8.8-2.6 1.2z"/><path fill="none" stroke="#0A0A08" stroke-width="1.5" d="M26 42c1.6 9 1.4 18 .2 27M30.4 41.2c1.6 9.4 1.4 18.6.4 28M42 36.6l11.4-1.6"/>',
/* Q — la reina, corona alta */
Q:'<path d="M17.4 4.6 41 1.4c1.2-.2 2 .6 2.1 1.8l1.7 23.2-24.6 3.4z"/><path fill="none" stroke="#0A0A08" stroke-width="1.5" d="M19.6 22.6 43.8 19.4"/><path d="M42.4 18.8c2.6 1.2 2.8 3 2.6 5l.8 3.6 3.6 4.8c.6.9 0 1.6-1 1.8l-2 .4.8 2.6-1.2 1.2.6 1.8c.2 2.2-1.4 3.4-3.8 3.2l-3.4-.2c-1.8 0-2.6 1.4-2.6 3.4v5.8c0 4.4 1.6 9 4.6 12.8L43 73H22c.6-6 1-11.6.6-17-.4-5.2-1.6-10-2.6-15l.8-11.4z"/><path fill="#0A0A08" d="M37.6 28.4c1.8-.6 3.6-.3 4.8.8-1.6 1-3.4 1.1-4.8-.8zM32.4 33.6l-5.8 1.4 4.4 2z"/><circle cx="31.4" cy="10.6" r="2.6" fill="#0A0A08"/>',
/* K — el faraón con nemes y barba */
K:'<path d="M14 64c-1.6-12-1-24 2-34 2.4-9.4 8.6-17.8 18-18.4 6.4-.4 10.8 3.4 11 9.8l.4 4.4 3.8 5.6c.6 1 .2 1.8-.8 2l-1.8.4.8 2.4-1 1 .4 2c.2 2-1.2 3-3.2 2.8l-1.6-.2.2 2.2 1.8 9.4-4.8.6-1-7.4-2.4.2v9.2c0 4 1 8.6 3.2 12.8L41 73H22.6l-.4-9.6z"/><path fill="#0A0A08" d="M38.8 26.8c1.8-.6 3.6-.3 4.6.8-1.6 1-3.2 1.1-4.6-.8z"/><path fill="none" stroke="#0A0A08" stroke-width="1.5" d="M19.4 26.4c4-6.6 10.4-10.8 18-10.8M18 34c4.4-6.4 10.6-10 18-10.4M17.6 42c3.6-4.6 8.4-7.6 14-8.8M17.8 50c3-3.4 6.4-5.8 10.6-7.2M18.4 58c2.4-2.4 5-4 8-5M30 26v34"/><path d="M36.6 12.6c1.6-2.8 3.6-4.4 5.6-4.8l-.6 2.4c1.4.2 2.2 1.2 2.4 2.6z"/>'};

function suitSVG(k,size){return '<svg class="tc-suit" viewBox="0 0 24 24" width="'+(size||24)+'" height="'+(size||24)+'" style="color:'+SUITS.find(s=>s.k===k).color+'" aria-hidden="true"><g fill="currentColor">'+SYM[k]+'</g></svg>'}

/* Disposición clásica de pips en un lienzo 100×140 */
const PIPS={2:[[50,30],[50,110]],3:[[50,30],[50,70],[50,110]],4:[[30,30],[70,30],[30,110],[70,110]],
  5:[[30,30],[70,30],[50,70],[30,110],[70,110]],6:[[30,30],[70,30],[30,70],[70,70],[30,110],[70,110]],
  7:[[30,30],[70,30],[50,50],[30,70],[70,70],[30,110],[70,110]],8:[[30,30],[70,30],[50,50],[30,70],[70,70],[50,90],[30,110],[70,110]],
  9:[[30,30],[70,30],[30,56.7],[70,56.7],[50,70],[30,83.3],[70,83.3],[30,110],[70,110]],
  10:[[30,30],[70,30],[50,43],[30,56.7],[70,56.7],[30,83.3],[70,83.3],[50,97],[30,110],[70,110]]};
const IMG='juegos/cartas/';
const FIG={K:{img:'k-horus.webp',name:'HORUS'},Q:{img:'q-isis.webp',name:'ISIS'},J:{img:'j-sobek.webp',name:'SOBEK'}};
const FRONT_CACHE={};
function frontSVG(c){const key=c.r+c.s;if(FRONT_CACHE[key])return FRONT_CACHE[key];
  const S=SUITS.find(x=>x.k===c.s),col=S.color,sym='<g fill="currentColor">'+SYM[c.s]+'</g>';
  const use=(x,y,sz,flip)=>'<svg x="'+(x-sz/2)+'" y="'+(y-sz/2)+'" width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" overflow="visible">'+(flip?'<g transform="rotate(180 12 12)">'+sym+'</g>':sym)+'</svg>';
  const corner='<text x="11" y="25" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="'+(c.r==='10'?19:22)+'" fill="currentColor"'+(c.r==='10'?' letter-spacing="-1.5"':'')+'>'+c.r+'</text>'+use(11,36,13);
  let mid='';
  if(PIPS[c.r])mid=PIPS[c.r].map(([x,y])=>use(x,y,20,y>75)).join('');
  else if(c.r==='A')mid='<ellipse cx="50" cy="70" rx="27" ry="37" fill="none" stroke="#C9A227" stroke-width="2.4"/><ellipse cx="50" cy="70" rx="23" ry="33" fill="none" stroke="#0A0A08" stroke-width=".8" stroke-dasharray="2 2.6"/><path d="M38 113h24" stroke="#C9A227" stroke-width="2.4"/>'+use(50,68,40);
  else{const F=FIG[c.r];/* figura ilustrada dentro de un marco de tinta con su nombre */
    mid='<rect x="19" y="13" width="62" height="114" rx="3" fill="#0A0A08"/><svg x="20.5" y="14.5" width="59" height="111" viewBox="0 0 59 111" preserveAspectRatio="none"><rect width="59" height="111" fill="url(#tcFig)"/>'+
    '<image href="'+IMG+F.img+'" x="-6" y="2" width="71" height="109" preserveAspectRatio="xMidYMin slice"/></svg>'+
    '<rect x="22.5" y="16.5" width="55" height="107" rx="2" fill="none" stroke="#C9A227" stroke-width="1.2"/>'+
    '<rect x="19" y="112" width="62" height="15" fill="#0A0A08"/><path d="M19 112h62" stroke="#C9A227" stroke-width="1.2"/>'+
    '<text x="50" y="123.5" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="9.5" letter-spacing="1.6" fill="#F5C842">'+F.name+'</text>'+
    '<g style="color:'+(c.s==='a'?'#F5C842':col)+'">'+use(73,21,10)+'</g>'}
  const svg='<svg viewBox="0 0 100 140" style="color:'+col+'" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="7" fill="#EEE4CB"/>'+
    '<rect x="1" y="1" width="98" height="138" rx="7" fill="url(#tcPap)"/><rect x="4.5" y="4.5" width="91" height="131" rx="4.5" fill="none" stroke="#C9A227" stroke-width="1.1" opacity=".75"/>'+
    mid+corner+'<g transform="rotate(180 50 70)">'+corner+'</g></svg>';
  return FRONT_CACHE[key]=svg}
const BACK_SVG='<svg viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="7" fill="#0A0A08"/><rect x="5" y="5" width="90" height="130" rx="4" fill="url(#tcDots)" stroke="#C9A227" stroke-width="1.6"/>'+
  '<rect x="9" y="9" width="82" height="122" rx="2" fill="none" stroke="#7A5C1E" stroke-width=".9"/><path d="M50 30 80 70 50 110 20 70z" fill="#0A0A08" stroke="#C9A227" stroke-width="1.6"/><path d="M50 37 74.5 70 50 103 25.5 70z" fill="none" stroke="#7A5C1E" stroke-width=".8"/>'+
  '<svg x="33" y="53" width="34" height="34" viewBox="0 0 24 24" style="color:#F5C842"><g fill="currentColor">'+SYM.o+'</g></svg>'+
  '<g fill="#C9A227"><path d="M50 14l3 4-3 4-3-4zM50 118l3 4-3 4-3-4z"/></g></svg>';

/* ---------- Estética del bazar: reversos y tapetes ---------- */
const sv=(k,x,y,sz,col)=>'<svg x="'+x+'" y="'+y+'" width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" style="color:'+col+'"><g fill="currentColor">'+SYM[k]+'</g></svg>';
const frame=(bg,line,inner)=>'<rect x="1" y="1" width="98" height="138" rx="7" fill="'+bg+'"/><rect x="5" y="5" width="90" height="130" rx="4" fill="none" stroke="'+line+'" stroke-width="1.6"/><rect x="9" y="9" width="82" height="122" rx="2" fill="none" stroke="'+inner+'" stroke-width=".9"/>';
const RAYS=(()=>{let r='';for(let i=0;i<24;i++){const a=i*Math.PI/12;r+='<path d="M'+(50+Math.cos(a)*15).toFixed(1)+' '+(70+Math.sin(a)*15).toFixed(1)+'L'+(50+Math.cos(a)*(i%2?24:31)).toFixed(1)+' '+(70+Math.sin(a)*(i%2?24:31)).toFixed(1)+'" stroke="#F5C842" stroke-width="'+(i%2?1:1.8)+'"/>'}return r})();
const BACKS={
  horus:{name:'Ojo de Horus',price:0,svg:BACK_SVG},
  lapis:{name:'Anubis lapislázuli',price:60,svg:'<svg viewBox="0 0 100 140" aria-hidden="true"><rect width="100" height="140" rx="7" fill="#0A0A08"/><image href="'+IMG+'back-lapis.webp" width="100" height="140" preserveAspectRatio="xMidYMid slice"/></svg>'},
  papiro:{name:'Anubis de papiro',price:90,svg:'<svg viewBox="0 0 100 140" aria-hidden="true"><rect width="100" height="140" rx="7" fill="#0A0A08"/><image href="'+IMG+'back-papiro.webp" width="100" height="140" preserveAspectRatio="xMidYMid slice"/></svg>'},
  nilo:{name:'Jardín del Nilo',price:120,svg:'<svg viewBox="0 0 100 140" aria-hidden="true"><rect width="100" height="140" rx="7" fill="#0A0A08"/><image href="'+IMG+'back-nilo.webp" width="100" height="140" preserveAspectRatio="xMidYMid slice"/></svg>'},
  obsidiana:{name:'Anubis de obsidiana',price:140,svg:'<svg viewBox="0 0 100 140" aria-hidden="true"><rect width="100" height="140" rx="7" fill="#0A0A08"/><image href="'+IMG+'back-obsidiana.webp" width="100" height="140" preserveAspectRatio="xMidYMid slice"/></svg>'},
  sol:{name:'Sol de Ra',price:200,svg:'<svg viewBox="0 0 100 140" aria-hidden="true"><rect width="100" height="140" rx="7" fill="#0A0A08"/><image href="'+IMG+'back-sol.webp" width="100" height="140" preserveAspectRatio="xMidYMid slice"/></svg>'},
  luna:{name:'Noche de Jonsu',price:240,svg:'<svg viewBox="0 0 100 140" aria-hidden="true"><rect width="100" height="140" rx="7" fill="#0A0A08"/><image href="'+IMG+'back-luna.webp" width="100" height="140" preserveAspectRatio="xMidYMid slice"/></svg>'},
  oro:{name:'Oro del faraón',price:350,svg:'<svg viewBox="0 0 100 140" aria-hidden="true">'+frame('url(#tcGold)','#0A0A08','rgba(10,10,8,.5)')+'<rect x="9" y="9" width="82" height="122" fill="url(#tcDotsInk)"/><path d="M50 30 80 70 50 110 20 70z" fill="#0A0A08" stroke="#0A0A08" stroke-width="1.6"/><path d="M50 37 74.5 70 50 103 25.5 70z" fill="none" stroke="#C9A227" stroke-width=".9"/>'+sv('o',33,53,34,'#F5C842')+'</svg>'}};
const FELTS={
  lapis:{name:'Lapislázuli',price:0,c:['#1d3f7a','#122a55','#0b1a36','#060d1c']},
  malaquita:{name:'Malaquita',price:50,c:['#1f6e52','#145040','#0b3026','#051812']},
  granate:{name:'Granate',price:90,c:['#7a2424','#5a1818','#350d0d','#190505']},
  nilo:{name:'Aguas del Nilo',price:120,c:['#14666b','#0e4b50','#082f33','#031719']},
  obsidiana:{name:'Obsidiana',price:180,c:['#34302a','#211e1a','#141210','#080706']}};
let cos={back:'horus',felt:'lapis'};
function setCos(c){if(c&&BACKS[c.back])cos.back=c.back;if(c&&FELTS[c.felt])cos.felt=c.felt}
function feltVars(el,id){const f=(FELTS[id]||FELTS.lapis).c;['--fa','--fb','--fc','--fd'].forEach((v,i)=>el.style.setProperty(v,f[i]))}
const DEFS='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+
  '<pattern id="tcPap" width="100" height="6" patternUnits="userSpaceOnUse"><rect width="100" height="1.4" fill="rgba(122,92,30,.07)"/></pattern>'+
  '<pattern id="tcDots" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#0A0A08"/><circle cx="3" cy="3" r=".9" fill="rgba(201,162,39,.35)"/></pattern>'+
  '<pattern id="tcDotsInk" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".8" fill="rgba(10,10,8,.28)"/></pattern>'+
  '<pattern id="tcLat" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H10M0 0V10" stroke="rgba(245,200,66,.22)" stroke-width=".8"/></pattern>'+
  '<pattern id="tcAnkh" width="12" height="14" patternUnits="userSpaceOnUse"><svg width="7" height="7" x="2.5" y="3.5" viewBox="0 0 24 24"><g fill="rgba(201,162,39,.28)">'+SYM.a+'</g></svg></pattern>'+
  '<radialGradient id="tcFig" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#3a2c12"/><stop offset="1" stop-color="#0A0A08"/></radialGradient>'+
  '<linearGradient id="tcGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F5C842"/><stop offset=".55" stop-color="#C9A227"/><stop offset="1" stop-color="#8a6a22"/></linearGradient>'+
  '<radialGradient id="tcSun" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#8a2a18"/><stop offset="1" stop-color="#3a0d08"/></radialGradient>'+
  '<linearGradient id="tcObs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2620"/><stop offset=".5" stop-color="#0A0A08"/><stop offset="1" stop-color="#1c1814"/></linearGradient></defs></svg>';

/* ---------- CSS compartido ---------- */
const CSS=`
.tc-root{--ab:0px;position:absolute;inset:0;overflow:hidden;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
.tc-card{position:relative;width:var(--cw,72px);aspect-ratio:5/7;flex:none;perspective:700px;transition:transform .45s cubic-bezier(.2,.9,.3,1.1),opacity .3s,filter .3s}
.tc-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .42s cubic-bezier(.3,1.25,.5,1);transform:rotateY(0)}
.tc-card.up .tc-in{transform:rotateY(180deg)}
.tc-f{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:calc(var(--cw,72px)*.07);box-shadow:0 3px 0 rgba(0,0,0,.35),0 6px 14px rgba(0,0,0,.45)}
.tc-f>svg{display:block;width:100%;height:100%}
.tc-f{overflow:hidden}
.tc-front{transform:rotateY(180deg)}
.tc-card.win .tc-front{box-shadow:0 0 0 2px var(--gold-hi),0 0 18px rgba(245,200,66,.75)}
.tc-card.win{transform:translateY(-8%)}
.tc-card.dim{filter:brightness(.45) saturate(.6)}
.tc-chip{--c:#F4EFE3;--e:#0A0A08;position:relative;width:var(--chw,34px);height:var(--chw,34px);border-radius:50%;flex:none;
  background:radial-gradient(circle,var(--c) 0 47%,var(--e) 47% 51%,transparent 51%),repeating-conic-gradient(var(--c) 0 22.5deg,var(--e) 22.5deg 45deg);
  box-shadow:inset 0 0 0 2px rgba(0,0,0,.35),0 2px 0 rgba(0,0,0,.45);display:grid;place-items:center;font:400 calc(var(--chw,34px)*.32)/1 var(--f-cond);color:var(--e)}
.tc-chip[data-v="5"]{--c:#A8361C;--e:#F4EFE3}
.tc-chip[data-v="10"]{--c:#F4EFE3;--e:#0A0A08}
.tc-chip[data-v="25"]{--c:#2456B8;--e:#F4EFE3}
.tc-chip[data-v="100"]{--c:#C9A227;--e:#0A0A08}
.tc-chip[data-v="500"]{--c:#0A0A08;--e:#F5C842}
.tc-chip[data-v="1000"]{--c:#14705C;--e:#F4EFE3}
.tc-stack{position:relative;display:flex;flex-direction:column-reverse;align-items:center}
.tc-stack .tc-chip{margin-top:calc(var(--chw,34px)*-.84)}
.tc-stack .tc-chip:last-child{margin-top:0}
.tc-felt{position:absolute;background:radial-gradient(ellipse at 50% 42%,var(--fa,#1d3f7a) 0%,var(--fb,#122a55) 38%,var(--fc,#0b1a36) 70%,var(--fd,#060d1c) 100%);
  box-shadow:0 0 0 3px #0A0A08,0 0 0 9px #7A5C1E,0 0 0 11px #C9A227,0 0 0 14px #0A0A08,0 0 0 17px #3a2a0e,0 18px 50px rgba(0,0,0,.7),inset 0 0 60px rgba(0,0,0,.6)}
.tc-felt::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:repeating-linear-gradient(45deg,rgba(255,255,255,.012) 0 2px,transparent 2px 5px)}
.tc-arc{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.tc-arc text{font-family:var(--f-egypt);font-weight:700;fill:rgba(201,162,39,.55);letter-spacing:.18em}
.tc-acts{position:absolute;left:0;right:0;bottom:0;z-index:5;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px clamp(10px,2.4vw,30px);padding:12px max(14px,env(safe-area-inset-right,0px)) calc(12px + var(--ab) + env(safe-area-inset-bottom,0px)) max(14px,env(safe-area-inset-left,0px));
  background:rgba(10,10,8,.95);box-shadow:0 -2px 0 rgba(201,162,39,.6),0 -16px 30px rgba(0,0,0,.55)}
.tc-acts:empty{box-shadow:0 -2px 0 rgba(201,162,39,.35)}
.tc-act{position:relative;isolation:isolate;display:flex;align-items:center;gap:.3em;background:none;border:0;padding:.08em .35em .06em .15em;cursor:pointer;--fs:clamp(22px,2.7vw,36px);font-size:var(--fs);line-height:1;color:var(--ivory)}
.tc-act::before{content:"";position:absolute;inset:4% -8% 4% -6%;background:var(--gold);transform:skewX(-18deg) scaleX(0);transform-origin:left;transition:transform .18s cubic-bezier(.3,1.5,.5,1);z-index:-1;box-shadow:4px 4px 0 var(--ink),5px 5px 0 var(--ivory)}
.tc-act.sel::before{transform:skewX(-18deg) scaleX(1)}
.tc-act.sel .l-b,.tc-act.sel .l-c{color:var(--ink)}
.tc-act.sel .l-d{background:var(--ink);color:var(--gold-hi)}
.tc-act.sel .tc-w{animation:tcJolt .24s ease-out}
@keyframes tcJolt{40%{transform:translateX(5px) rotate(-1.5deg)}}
.tc-act kbd{font:700 10px/1 var(--f-ui);letter-spacing:.1em;color:var(--gold);border:1px solid rgba(201,162,39,.6);padding:3px 4px 2px;margin-left:.2em;transform:translateY(-.4em)}
.tc-act.sel kbd{color:var(--ink);border-color:var(--ink)}
.tc-act .tc-sub{font:700 11px/1 var(--f-ui);letter-spacing:.12em;color:var(--gold-hi);margin-left:.1em;transform:translateY(-.3em)}
.tc-act.sel .tc-sub{color:var(--ink)}
.tc-act[disabled]{opacity:.32;cursor:default;pointer-events:none}
.tc-act[hidden]{display:none}
.tc-banner{position:absolute;left:0;right:0;top:44%;z-index:8;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:6px;transform:translateY(-50%)}
.tc-band{position:relative;padding:10px 6vw 8px;font-size:clamp(34px,6vw,76px);line-height:1;transform:skewY(-4deg);animation:tcBand 1.5s cubic-bezier(.2,.9,.3,1) both}
.tc-band::before{content:"";position:absolute;inset:0 -30vw;background:var(--ink);box-shadow:0 5px 0 var(--gold),0 -5px 0 var(--gold),0 12px 0 var(--ink);z-index:-1}
.tc-band.gold::before{background:var(--gold-hi);box-shadow:0 5px 0 var(--ink),0 -5px 0 var(--ink),0 12px 0 var(--gold-hi)}
.tc-band.gold .l-b,.tc-band.gold .l-c{color:var(--ink)}
.tc-band.gold .l-d{background:var(--ink);color:var(--gold-hi)}
.tc-bsub{font:400 clamp(16px,2vw,24px)/1 var(--f-cond);letter-spacing:.12em;color:var(--ink);background:var(--ivory);padding:6px 12px 4px;transform:skewX(-10deg);box-shadow:4px 4px 0 var(--gold);animation:tcSub 1.5s ease both}
@keyframes tcBand{0%{transform:skewY(-4deg) translateX(-110vw)}16%{transform:skewY(-4deg) translateX(2vw)}22%,80%{transform:skewY(-4deg) translateX(0)}100%{transform:skewY(-4deg) translateX(110vw)}}
@keyframes tcSub{0%,12%{opacity:0;transform:skewX(-10deg) translateY(10px)}24%,80%{opacity:1;transform:skewX(-10deg)}100%{opacity:0}}
.tc-bubble{position:absolute;z-index:4;font:400 clamp(14px,1.6vw,19px)/1 var(--f-cond);letter-spacing:.08em;background:var(--ivory);color:var(--ink);padding:5px 9px 4px;transform:skewX(-10deg);box-shadow:3px 3px 0 var(--gold);white-space:nowrap;animation:tcPop .3s cubic-bezier(.3,1.8,.5,1) both}
.tc-bubble.k{background:var(--gold-hi)}
.tc-bubble.x{background:var(--ink);color:rgba(244,239,227,.55);box-shadow:3px 3px 0 rgba(244,239,227,.25)}
@keyframes tcPop{from{opacity:0;transform:skewX(-10deg) scale(.6)}}
.tc-val{font:400 clamp(15px,1.8vw,20px)/1 var(--f-cond);letter-spacing:.06em;background:var(--ink);color:var(--gold-hi);padding:4px 8px 3px;box-shadow:0 0 0 1.5px var(--gold);transform:skewX(-10deg);white-space:nowrap}
.tc-val.over{color:rgba(244,239,227,.6);box-shadow:0 0 0 1.5px rgba(244,239,227,.4)}
.tc-val.top{background:var(--gold-hi);color:var(--ink)}
@media (min-width:1100px){.tc-acts{padding-left:130px;padding-right:130px}}
@media (max-width:1099px){.tc-root{--ab:46px}}
@media (hover:none) and (pointer:coarse){.tc-act kbd{display:none}}
@media (prefers-reduced-motion:reduce){.tc-in,.tc-card{transition:none}.tc-band,.tc-bsub{animation-duration:1.6s;animation-name:tcFade}@keyframes tcFade{0%,100%{opacity:0}15%,85%{opacity:1}}}
`;

/* ---------- Utilidades ---------- */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function deck(n){const d=[];for(let k=0;k<(n||1);k++)SUITS.forEach(s=>RANKS.forEach((r,i)=>d.push({r,s:s.k,v:i+2})));return shuffle(d)}
function cardName(c){const n={J:'jota',Q:'reina',K:'rey',A:'as'}[c.r]||c.r;return n+' de '+SUITS.find(s=>s.k===c.s).name}
function cardEl(c,up){const el=document.createElement('div');el.className='tc-card'+(up?' up':'');
  el.innerHTML='<div class="tc-in"><div class="tc-f tc-back">'+BACKS[cos.back].svg+'</div><div class="tc-f tc-front">'+(c?frontSVG(c):'')+'</div></div>';
  el.setAttribute('role','img');el.setAttribute('aria-label',up&&c?cardName(c):'carta boca abajo');el._c=c;return el}
function reveal(el,c){if(c&&!el._c){el._c=c;el.querySelector('.tc-front').innerHTML=frontSVG(c)}el.classList.add('up');if(el._c)el.setAttribute('aria-label',cardName(el._c))}
function chipEl(v){const d=document.createElement('div');d.className='tc-chip';d.dataset.v=v;d.textContent=v>=1000?(v/1000)+'K':v;return d}
function chipBreak(n){const out=[];[1000,500,100,25,10,5].forEach(v=>{let k=Math.floor(n/v);if(out.length+k>8)k=Math.min(k,Math.max(1,8-out.length));for(let i=0;i<k&&out.length<8;i++){out.push(v);n-=v}});return out}
function stackEl(n){const s=document.createElement('div');s.className='tc-stack';chipBreak(n).forEach(v=>s.append(chipEl(v)));return s}
/* Vuelo desde un origen (FLIP) */
function flyIn(el,fromEl,delay,reduced){if(reduced||!fromEl){return}
  const a=fromEl.getBoundingClientRect(),b=el.getBoundingClientRect();
  const dx=(a.left+a.width/2)-(b.left+b.width/2),dy=(a.top+a.height/2)-(b.top+b.height/2);
  el.style.transition='none';el.style.transform='translate('+dx+'px,'+dy+'px) rotate(-14deg) scale(.8)';el.style.opacity='0';
  void el.offsetWidth;el.style.transition='';
  setTimeout(()=>{el.style.transform='';el.style.opacity=''},delay||0)}
function flyOut(el,toEl,reduced){return new Promise(res=>{if(reduced||!toEl){el.remove();return res()}
  const a=toEl.getBoundingClientRect(),b=el.getBoundingClientRect();
  el.style.transition='transform .38s cubic-bezier(.5,0,.7,.4),opacity .38s';
  el.style.transform='translate('+((a.left+a.width/2)-(b.left+b.width/2))+'px,'+((a.top+a.height/2)-(b.top+b.height/2))+'px) scale(.6)';el.style.opacity='0';
  setTimeout(()=>{el.remove();res()},400)})}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- Sonido ---------- */
function sounds(api){return{
  deal(){api.noise(.06,2600,7000,.05);api.tone(1300,.02,'triangle',.025)},
  flip(){api.noise(.05,1500,4200,.05);api.tone(700,.03,'triangle',.03)},
  chip(n){for(let i=0;i<Math.min(n||1,4);i++){api.tone(2300+i*180,.03,'square',.03,i*.045);api.tone(3400,.035,'triangle',.025,i*.045+.015)}},
  win(){[523,659,784,1047].forEach((f,i)=>api.tone(f,.12,'square',.055,i*.07))},
  big(){[523,659,784,1047,1319].forEach((f,i)=>api.tone(f,.14,'square',.06,i*.065));api.tone(1568,.4,'triangle',.05,.33)},
  lose(){api.tone(330,.14,'square',.05);api.tone(220,.24,'square',.045,.11)},
  push(){api.tone(520,.08,'triangle',.05);api.tone(520,.1,'triangle',.05,.1)},
  turn(){api.tone(880,.05,'triangle',.05);api.tone(1320,.08,'triangle',.05,.05)},
  tick(){api.sfx.tick()}}}

/* ---------- Banner tipo anuncio ---------- */
function banner(root,api,text,sub,gold){const b=document.createElement('div');b.className='tc-banner';b.setAttribute('role','status');
  const band=document.createElement('div');band.className='tc-band'+(gold?' gold':'');const w=document.createElement('span');w.className='word';band.append(w);b.append(band);
  if(api.collage)api.collage(w,text);else w.textContent=text;
  if(sub){const s=document.createElement('div');s.className='tc-bsub';s.textContent=sub;b.append(s)}
  root.querySelectorAll('.tc-banner').forEach(x=>x.remove());root.append(b);api.sfx.whoosh&&api.sfx.whoosh();
  setTimeout(()=>b.remove(),1550)}

/* ---------- Barra de acciones con estilo de menú ---------- */
function acts(root,api){
  const bar=document.createElement('div');bar.className='tc-acts';root.append(bar);
  let list=[],sel=-1;
  const touch=matchMedia('(hover:none) and (pointer:coarse)').matches;
  function paint(){list.forEach((a,i)=>a.el.classList.toggle('sel',i===sel))}
  function pick(i,sound){if(i===sel)return;sel=i;paint();if(sound)api.sfx.tick()}
  function valid(i){const a=list[i];return a&&!a.el.disabled&&!a.el.hidden}
  function set(items){bar.textContent='';sel=-1;
    list=items.map((it,i)=>{const b=document.createElement('button');b.type='button';b.className='tc-act';
      const w=document.createElement('span');w.className='word tc-w';b.append(w);
      if(api.collage)api.collage(w,it.label,true);else w.textContent=it.label;
      b.setAttribute('aria-label',it.label+(it.sub?' '+it.sub:''));
      if(it.sub){const s=document.createElement('span');s.className='tc-sub';s.textContent=it.sub;b.append(s)}
      if(it.key){const k=document.createElement('kbd');k.textContent=it.keyLabel||it.key.toUpperCase();b.append(k)}
      b.disabled=!!it.disabled;
      b.addEventListener('mouseenter',()=>{if(!touch)pick(i,true)});
      b.addEventListener('click',()=>{if(b.disabled)return;api.sfx.confirm();it.on()});
      bar.append(b);return Object.assign({el:b},it)});
    const first=list.findIndex((a,i)=>valid(i)&&!a.alt);if(!touch)pick(first,false)}
  function key(e){if(!list.length||bar.hidden)return false;const k=e.key;
    if(k==='ArrowRight'||k==='ArrowLeft'){e.preventDefault();const d=k==='ArrowRight'?1:-1;let i=sel;
      for(let n=0;n<list.length;n++){i=(i+d+list.length)%list.length;if(valid(i))break}if(valid(i))pick(i,true);return true}
    if((k==='Enter'||k===' ')&&valid(sel)){e.preventDefault();api.sfx.confirm();list[sel].on();return true}
    const low=k.toLowerCase();const hit=list.find(a=>a.key&&(a.key===low||(a.keys&&a.keys.includes(low))));
    if(hit&&!hit.el.disabled&&!hit.el.hidden){e.preventDefault();api.sfx.confirm();hit.on();return true}return false}
  function hide(h){bar.hidden=h;bar.style.visibility=h?'hidden':''}
  return{set,key,hide,bar}}

let cssDone=false;
function mount(stage,extraCss){const root=document.createElement('div');root.className='tc-root';feltVars(root,cos.felt);
  const st=document.createElement('style');st.textContent=CSS+(extraCss||'');root.append(st);
  root.insertAdjacentHTML('beforeend',DEFS);stage.append(root);return root}

L.cartas={BACKS,FELTS,setCos,feltVars,DEFS,get cos(){return Object.assign({},cos)},SUITS,RANKS,deck,shuffle,cardEl,reveal,cardName,chipEl,stackEl,chipBreak,flyIn,flyOut,wait,sounds,banner,acts,mount,suitSVG,frontSVG};
})();
