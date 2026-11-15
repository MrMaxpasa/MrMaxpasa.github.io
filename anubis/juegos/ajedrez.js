/* Motor de ajedrez del Templo — reglas completas (enroque, al paso, promoción, tablas) y búsqueda alfa-beta.
   Tablero 0x88. Todo dentro de una función autocontenida para poder ejecutarla también en un Web Worker. */
function CHESS_ENGINE(){
'use strict';
const P=1,N=2,B=3,R=4,Q=5,K=6,VAL=[0,100,320,330,500,900,0],MATE=100000;
const ND=[33,31,18,14,-33,-31,-18,-14],BD=[17,15,-17,-15],RD=[16,1,-16,-1],KD=[17,15,-17,-15,16,1,-16,-1];
let seed=0x9E3779B9;function r32(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0}
const ZP=new Uint32Array(13*128*2);for(let i=0;i<ZP.length;i++)ZP[i]=r32();
const ZC=new Uint32Array(32);for(let i=0;i<32;i++)ZC[i]=r32();
const ZE=new Uint32Array(256);for(let i=0;i<256;i++)ZE[i]=r32();
const ZS=[r32(),r32()];
const CMASK=new Uint8Array(128).fill(15);CMASK[0]=13;CMASK[4]=12;CMASK[7]=14;CMASK[112]=7;CMASK[116]=3;CMASK[119]=11;
/* tablas de posición (vista de las blancas, a8 primero) */
const PST={
 1:[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
 2:[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
 3:[-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
 4:[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
 5:[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
 6:[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20],
 7:[-50,-40,-30,-20,-20,-30,-40,-50,-30,-20,-10,0,0,-10,-20,-30,-30,-10,20,30,30,20,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,20,30,30,20,-10,-30,-30,-30,0,0,0,0,-30,-30,-50,-30,-30,-30,-30,-30,-30,-50]};

function newState(){const S={b:new Int8Array(128),side:1,castle:15,ep:-1,half:0,k:[4,116],h1:0,h2:0,stack:[]};
  const back=[R,N,B,Q,K,B,N,R];for(let f=0;f<8;f++){S.b[f]=back[f];S.b[16+f]=P;S.b[96+f]=-P;S.b[112+f]=-back[f]}
  rehash(S);return S}
function load(o){const S={b:Int8Array.from(o.b),side:o.side,castle:o.castle,ep:o.ep,half:o.half,k:o.k.slice(),h1:0,h2:0,stack:[]};rehash(S);return S}
function snap(S){return{b:Array.from(S.b),side:S.side,castle:S.castle,ep:S.ep,half:S.half,k:S.k.slice()}}
function rehash(S){let a=0,c=0;for(let s=0;s<128;s++){if(s&0x88)continue;const p=S.b[s];if(p){const i=((p+6)*128+s)*2;a^=ZP[i];c^=ZP[i+1]}}
  a^=ZC[S.castle*2];c^=ZC[S.castle*2+1];if(S.ep>=0){a^=ZE[S.ep*2];c^=ZE[S.ep*2+1]}if(S.side<0){a^=ZS[0];c^=ZS[1]}S.h1=a|0;S.h2=c|0}
function xp(S,p,s){const i=((p+6)*128+s)*2;S.h1^=ZP[i];S.h2^=ZP[i+1]}
function hx(S,T,i){S.h1^=T[i*2];S.h2^=T[i*2+1]}
const key=S=>(S.h1>>>0).toString(36)+':'+(S.h2>>>0).toString(36);

function attacked(S,sq,by){const b=S.b;
  if(by>0){if(!((sq-15)&0x88)&&b[sq-15]===1)return true;if(!((sq-17)&0x88)&&b[sq-17]===1)return true}
  else{if(!((sq+15)&0x88)&&b[sq+15]===-1)return true;if(!((sq+17)&0x88)&&b[sq+17]===-1)return true}
  for(let i=0;i<8;i++){const t=sq+ND[i];if(!(t&0x88)&&b[t]===N*by)return true}
  for(let i=0;i<8;i++){const t=sq+KD[i];if(!(t&0x88)&&b[t]===K*by)return true}
  for(let i=0;i<4;i++){const d=BD[i];let t=sq+d;while(!(t&0x88)){const p=b[t];if(p){if(p===B*by||p===Q*by)return true;break}t+=d}}
  for(let i=0;i<4;i++){const d=RD[i];let t=sq+d;while(!(t&0x88)){const p=b[t];if(p){if(p===R*by||p===Q*by)return true;break}t+=d}}
  return false}
const inCheck=S=>attacked(S,S.k[S.side>0?0:1],-S.side);

/* jugada = origen | destino<<7 | promoción<<14 | marca<<17 (1 al paso, 2 enroque, 4 doble paso) */
function gen(S,caps){const b=S.b,sd=S.side,out=[];
  for(let s=0;s<128;s++){if(s&0x88){s+=7;continue}const p=b[s];if(!p||(p>0)!==(sd>0))continue;const a=p*sd;
    if(a===P){const d=16*sd,one=s+d,rank=s>>4,promoR=sd>0?6:1,startR=sd>0?1:6;
      if(!(one&0x88)&&!b[one]){if(rank===promoR){out.push(s|one<<7|Q<<14,s|one<<7|N<<14,s|one<<7|R<<14,s|one<<7|B<<14)}
        else if(!caps){out.push(s|one<<7);const two=one+d;if(rank===startR&&!b[two])out.push(s|two<<7|4<<17)}}
      for(const cd of [d-1,d+1]){const t=s+cd;if(t&0x88)continue;const q=b[t];
        if(q&&(q>0)!==(sd>0)){if(rank===promoR)out.push(s|t<<7|Q<<14,s|t<<7|N<<14,s|t<<7|R<<14,s|t<<7|B<<14);else out.push(s|t<<7)}
        else if(!q&&t===S.ep)out.push(s|t<<7|1<<17)}}
    else if(a===N||a===K){const D=a===N?ND:KD;for(let i=0;i<8;i++){const t=s+D[i];if(t&0x88)continue;const q=b[t];if(q&&(q>0)===(sd>0))continue;if(caps&&!q)continue;out.push(s|t<<7)}}
    else{const D=a===B?BD:a===R?RD:KD;for(let i=0;i<D.length;i++){const d=D[i];let t=s+d;while(!(t&0x88)){const q=b[t];if(q){if((q>0)!==(sd>0))out.push(s|t<<7);break}if(!caps)out.push(s|t<<7);t+=d}}}}
  if(!caps){
    if(sd>0){if((S.castle&1)&&!b[5]&&!b[6]&&b[7]===R&&b[4]===K&&!attacked(S,4,-1)&&!attacked(S,5,-1)&&!attacked(S,6,-1))out.push(4|6<<7|2<<17);
      if((S.castle&2)&&!b[1]&&!b[2]&&!b[3]&&b[0]===R&&b[4]===K&&!attacked(S,4,-1)&&!attacked(S,3,-1)&&!attacked(S,2,-1))out.push(4|2<<7|2<<17)}
    else{if((S.castle&4)&&!b[117]&&!b[118]&&b[119]===-R&&b[116]===-K&&!attacked(S,116,1)&&!attacked(S,117,1)&&!attacked(S,118,1))out.push(116|118<<7|2<<17);
      if((S.castle&8)&&!b[113]&&!b[114]&&!b[115]&&b[112]===-R&&b[116]===-K&&!attacked(S,116,1)&&!attacked(S,115,1)&&!attacked(S,114,1))out.push(116|114<<7|2<<17)}}
  return out}

function make(S,m){const b=S.b,f=m&127,t=(m>>7)&127,pr=(m>>14)&7,fl=m>>17,p=b[f],sd=S.side;
  const u={m,cap:b[t],castle:S.castle,ep:S.ep,half:S.half,h1:S.h1,h2:S.h2};S.stack.push(u);
  hx(S,ZC,S.castle);if(S.ep>=0)hx(S,ZE,S.ep);
  if(u.cap)xp(S,u.cap,t);
  xp(S,p,f);b[f]=0;const np=pr?pr*sd:p;b[t]=np;xp(S,np,t);
  if(fl&1){const c=t-16*sd;xp(S,b[c],c);b[c]=0}
  if(fl&2){let rf,rt;if(t===f+2){rf=f+3;rt=f+1}else{rf=f-4;rt=f-1}const rk=b[rf];xp(S,rk,rf);b[rf]=0;b[rt]=rk;xp(S,rk,rt)}
  if(p===K*sd)S.k[sd>0?0:1]=t;
  S.castle&=CMASK[f]&CMASK[t];
  S.ep=(fl&4)?f+16*sd:-1;
  S.half=(p===P*sd||u.cap||(fl&1))?0:S.half+1;
  hx(S,ZC,S.castle);if(S.ep>=0)hx(S,ZE,S.ep);
  S.side=-sd;S.h1^=ZS[0];S.h2^=ZS[1];
  return !attacked(S,S.k[sd>0?0:1],-sd)}
function unmake(S){const u=S.stack.pop(),m=u.m,b=S.b,f=m&127,t=(m>>7)&127,pr=(m>>14)&7,fl=m>>17;S.side=-S.side;const sd=S.side;
  const p=pr?P*sd:b[t];b[f]=p;b[t]=u.cap;
  if(fl&1)b[t-16*sd]=-P*sd;
  if(fl&2){let rf,rt;if(t===f+2){rf=f+3;rt=f+1}else{rf=f-4;rt=f-1}b[rf]=b[rt];b[rt]=0}
  if(p===K*sd)S.k[sd>0?0:1]=f;
  S.castle=u.castle;S.ep=u.ep;S.half=u.half;S.h1=u.h1;S.h2=u.h2}
function legal(S){const out=[];for(const m of gen(S,false)){if(make(S,m))out.push(m);unmake(S)}return out}

/* ---------- evaluación (desde el bando que mueve) ---------- */
function evaluate(S){const b=S.b;let sc=0,npW=0,npB=0,matW=0,matB=0,bW=0,bB=0,q=0;
  for(let s=0;s<128;s++){if(s&0x88){s+=7;continue}const p=b[s];if(!p)continue;const a=p>0?p:-p;if(a===K)continue;
    const r=s>>4,f=s&7,v=VAL[a];
    if(p>0){sc+=v+PST[a][(7-r)*8+f];matW+=v;if(a!==P)npW+=v;if(a===B)bW++}
    else{sc-=v+PST[a][r*8+f];matB+=v;if(a!==P)npB+=v;if(a===B)bB++}
    if(a===Q)q++}
  const end=q===0||(npW<=1300&&npB<=1300),kt=end?7:6,wk=S.k[0],bk=S.k[1];
  sc+=PST[kt][(7-(wk>>4))*8+(wk&7)]-PST[kt][(bk>>4)*8+(bk&7)];
  if(bW>=2)sc+=30;if(bB>=2)sc-=30;
  if(end){const d=matW-matB;if(d>=200||d<=-200){const win=d>0?wk:bk,lose=d>0?bk:wk,lf=lose&7,lr=lose>>4;
      const cmd=Math.max(3-lf,lf-4)+Math.max(3-lr,lr-4),kd=Math.abs((win&7)-lf)+Math.abs((win>>4)-lr),bonus=10*cmd+4*(14-kd);sc+=d>0?bonus:-bonus}}
  return sc*S.side}

/* ---------- búsqueda ---------- */
let deadline=0,stopped=false,nodes=0,killers=[],path=[],gameKeys=null;
function mscore(S,m,ply){const t=(m>>7)&127,f=m&127,cap=S.b[t],pr=(m>>14)&7;let s=0;
  if(cap)s=100000+VAL[cap>0?cap:-cap]*10-VAL[S.b[f]>0?S.b[f]:-S.b[f]];else if((m>>17)&1)s=100000+900;
  if(pr)s+=80000+VAL[pr];
  if(!s){const k=killers[ply];if(k){if(k[0]===m)s=9000;else if(k[1]===m)s=8000}}
  return s}
function order(S,ms,ply,first){const sc=ms.map(m=>m===first?1e9:mscore(S,m,ply));const idx=ms.map((_,i)=>i).sort((a,b)=>sc[b]-sc[a]);return idx.map(i=>ms[i])}
function tick(){if((++nodes&1023)===0&&Date.now()>deadline)stopped=true}
function qs(S,a,b,ply){tick();if(stopped)return 0;const sp=evaluate(S);if(sp>=b)return sp;if(sp>a)a=sp;if(ply>40)return sp;
  const ms=order(S,gen(S,true),ply,0);
  for(const m of ms){if(!make(S,m)){unmake(S);continue}const v=-qs(S,-b,-a,ply+1);unmake(S);if(stopped)return 0;if(v>=b)return v;if(v>a)a=v}
  return a}
function isRep(S){const k=S.h1+':'+S.h2;for(let i=path.length-2;i>=0;i-=2)if(path[i]===k)return true;return gameKeys&&gameKeys.has(key(S))}
function nm(S,d,a,b,ply){if(stopped)return 0;
  if(S.half>=100||isRep(S))return 0;
  const chk=inCheck(S);if(chk&&ply<12)d++;
  if(d<=0)return qs(S,a,b,ply);
  tick();
  const ms=order(S,gen(S,false),ply,0);let legalN=0,best=-MATE*2;path.push(S.h1+':'+S.h2);
  for(const m of ms){if(!make(S,m)){unmake(S);continue}legalN++;const v=-nm(S,d-1,-b,-a,ply+1);unmake(S);if(stopped){path.pop();return 0}
    if(v>best)best=v;if(v>a)a=v;
    if(a>=b){if(!S.b[(m>>7)&127]&&!((m>>14)&7)){const k=killers[ply]||(killers[ply]=[0,0]);if(k[0]!==m){k[1]=k[0];k[0]=m}}break}}
  path.pop();
  if(!legalN)return chk?-MATE+ply:0;
  return best}
/* nivel: depth (profundidad máxima), time (ms), noise (centipeones de ruido en la raíz), blunder (probabilidad de jugada al azar) */
function think(o){const S=load(o);gameKeys=new Set(o.keys||[]);deadline=Date.now()+(o.time||1000);stopped=false;nodes=0;killers=[];path=[];
  const root=legal(S);if(!root.length)return{m:0};if(root.length===1)return{m:root[0],d:0,nodes};
  if(o.blunder&&Math.random()<o.blunder)return{m:root[Math.floor(Math.random()*root.length)],d:0,nodes,blunder:true};
  const noise=o.noise||0;let best=root[0],scores=null,depthDone=0;
  for(let d=1;d<=(o.depth||4);d++){const res=[];let a=-MATE*2;
    const ordered=order(S,root,0,best);path=[S.h1+':'+S.h2];
    for(const m of ordered){make(S,m);const v=-nm(S,d-1,-MATE*2,noise?MATE*2:-a,1);unmake(S);if(stopped)break;res.push([m,v]);if(v>a)a=v}
    if(stopped&&d>1)break;
    if(res.length){scores=res;best=res.reduce((x,y)=>y[1]>x[1]?y:x)[0];depthDone=d}
    if(stopped||a>=MATE-200||Date.now()>deadline-(o.time||1000)*.45)break}
  if(noise&&scores){let bv=-Infinity;for(const [m,v] of scores){const w=v+(Math.random()*2-1)*noise;if(w>bv){bv=w;best=m}}}
  const bs=scores?scores.find(x=>x[0]===best):null;
  return{m:best,d:depthDone,nodes,score:bs?bs[1]:0}}

return{P,N,B,R,Q,K,MATE,newState,load,snap,gen,legal,make,unmake,attacked,inCheck,evaluate,think,key};
}

/* ================== EL AJEDREZ DE THOT — interfaz ==================
   Piezas egipcias dibujadas en SVG (originales): rey faraón con ankh, dama con disco solar y cuernos,
   alfil ibis, caballo chacal, torre pilono y peón escarabeo. El rival (Thot) piensa en un Web Worker. */
(function(){
'use strict';
const E=CHESS_ENGINE();
const LEVELS=[
  {id:'facil',name:'FÁCIL',sub:'Thot juega distraído',depth:1,time:350,noise:170,blunder:.14,base:300,ank:4,undo:true},
  {id:'normal',name:'NORMAL',sub:'Thot piensa sus jugadas',depth:3,time:1100,noise:22,blunder:0,base:700,ank:10,undo:true},
  {id:'dificil',name:'DIFÍCIL',sub:'La sabiduría entera de Thot',depth:9,time:2400,noise:0,blunder:0,base:1500,ank:25,undo:false}];
const FILES='abcdefgh',LET={2:'C',3:'A',4:'T',5:'D',6:'R'};
const sqName=s=>FILES[s&7]+(1+(s>>4));

/* ---------- piezas ---------- */
function pieceSVG(a,white){const F=white?'#F4EFE3':'#1d1813',L='#0A0A08',G=white?'#B8901F':'#D4AF37',I=white?'#0A0A08':'#D4AF37';
  const base='<path d="M21 91h58a4.5 4.5 0 0 0 0-9H21a4.5 4.5 0 0 0 0 9z"/><path d="M27 82h46l-5-8H32z"/>';
  let body='',det='';
  if(a===1){body='<path d="M35 74c0-11 5-17 10-20a13 13 0 1 1 10 0c5 3 10 9 10 20z"/>';
    det='<path d="M50 30v14M42 34l8 6 8-6" stroke="'+G+'" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M41 64h18" stroke="'+G+'" stroke-width="3"/>'}
  else if(a===4){body='<path d="M30 74l4-35h32l4 35z"/><path d="M27 39h46l-3-11H30z"/>';
    det='<path d="M45 74V60a5 5 0 0 1 10 0v14z" fill="'+G+'"/><circle cx="50" cy="33.5" r="3" fill="'+G+'" stroke="none"/><path d="M34 47h32M33 54h34" stroke="'+G+'" stroke-width="2"/>'}
  else if(a===2){body='<path d="M64 74c-3-8-2-15 2-21-6 1-13 0-19-3l-11 3c-3 1-5-2-3-4l12-12 3-17 7 11 5-14 4 16c7 6 10 15 9 25-1 6-3 11-5 16z"/>';
    det='<circle cx="52" cy="37" r="2.6" fill="'+G+'" stroke="none"/><path d="M56 56c-3 6-3 12-1 18" stroke="'+G+'" stroke-width="2.4" fill="none"/>'}
  else if(a===3){body='<path d="M35 74c-1-13 6-23 15-27 9 4 16 14 15 27z"/><circle cx="51" cy="35" r="10"/>';
    det='<path d="M43 38c-9 4-13 12-13 22" stroke="'+L+'" stroke-width="7.5" fill="none" stroke-linecap="round"/><path d="M43 38c-9 4-13 12-13 22" stroke="'+F+'" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="53" cy="33" r="2.4" fill="'+G+'" stroke="none"/><path d="M42 60h16" stroke="'+G+'" stroke-width="3"/>'}
  else if(a===5){body='<path d="M31 74l9-27h20l9 27z"/><circle cx="50" cy="40" r="8"/>';
    det='<path d="M33 31c0-13 8-20 17-20s17 7 17 20" stroke="'+L+'" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M33 31c0-13 8-20 17-20s17 7 17 20" stroke="'+G+'" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="50" cy="22" r="7.5" fill="#C2412D"/><path d="M39 55q11 6 22 0" stroke="'+G+'" stroke-width="3" fill="none"/>'}
  else if(a===6){body='<path d="M29 74l9-31h24l9 31z"/><circle cx="50" cy="38" r="7.5"/><path d="M41 34l2-13c0-7 4-10 7-10s7 3 7 10l2 13z"/>';
    det='<ellipse cx="50" cy="55" rx="3.2" ry="4" stroke="'+G+'" stroke-width="2.4" fill="none"/><path d="M50 59v10M44.5 62h11" stroke="'+G+'" stroke-width="2.6" stroke-linecap="round"/><path d="M44 27h12" stroke="'+G+'" stroke-width="2.4"/>'}
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="'+F+'" stroke="'+L+'" stroke-width="3" stroke-linejoin="round">'+base+body+'</g><g stroke-linejoin="round">'+det.replace(/stroke="#0A0A08"/g,'stroke="'+L+'"')+'</g>'+(white?'':'<g fill="none" stroke="'+I+'" stroke-width="1.2" opacity=".55">'+base+body+'</g>')+'</svg>'}

const CSS=`
.ch-wrap{position:absolute;left:0;right:0;top:64px;bottom:max(calc(86px + var(--ab)),calc(var(--bar,0px) + 14px));container-type:size;display:flex;align-items:center;justify-content:center;gap:clamp(14px,2.4cqw,34px);padding:0 max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px));box-sizing:border-box}
.ch-bbox{position:relative;flex:none;width:min(96cqh,100cqw - 360px);aspect-ratio:1}
.ch-frame{position:absolute;inset:0;padding:3.2%;box-sizing:border-box;background:linear-gradient(135deg,#3a2a14,#16110b);border:2px solid #C9A227;box-shadow:0 0 0 4px #0A0A08,0 0 0 6px #7A5C1E,8px 8px 0 6px rgba(201,162,39,.35),0 18px 40px rgba(0,0,0,.6)}
.ch-frame::before{content:"𓂀 𓋹 𓆣 𓇳 𓊽 𓅓 𓆑 𓈖 𓂋 𓏏";position:absolute;left:0;right:0;top:.3%;text-align:center;font-family:var(--f-glyph);font-size:2.1cqh;letter-spacing:.6em;color:rgba(201,162,39,.45);white-space:nowrap;overflow:hidden;pointer-events:none}
.ch-board{position:relative;width:100%;height:100%;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);box-shadow:0 0 0 2px #0A0A08;touch-action:manipulation}
.ch-sq{position:relative;border:0;padding:0;margin:0;cursor:pointer;background:#E8DAB5;-webkit-tap-highlight-color:transparent}
.ch-sq.d{background:#A9834D}
.ch-sq.d::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(0,0,0,.05) 0 2px,transparent 2px 6px);pointer-events:none}
.ch-sq .co{position:absolute;font:700 clamp(8px,1.7cqh,12px)/1 var(--f-ui);pointer-events:none;color:rgba(10,10,8,.55)}
.ch-sq.d .co{color:rgba(244,239,227,.75)}
.ch-sq .co.f{right:4%;bottom:3%}.ch-sq .co.r{left:4%;top:4%}
.ch-sq.last{box-shadow:inset 0 0 0 100vmax rgba(245,200,66,.38)}
.ch-sq.sel{box-shadow:inset 0 0 0 100vmax rgba(245,200,66,.62),inset 0 0 0 3px #F5C842}
.ch-sq.chk{background:radial-gradient(circle,#ff5a3c 0 28%,rgba(194,65,45,.55) 55%,transparent 75%),#A9834D}
.ch-sq:not(.d).chk{background:radial-gradient(circle,#ff5a3c 0 28%,rgba(194,65,45,.55) 55%,transparent 75%),#E8DAB5}
.ch-sq.mv::before{content:"";position:absolute;left:50%;top:50%;width:28%;height:28%;transform:translate(-50%,-50%);border-radius:50%;background:rgba(10,10,8,.32);pointer-events:none;z-index:3}
.ch-sq.mv.cap::before{width:86%;height:86%;background:none;box-shadow:inset 0 0 0 5px rgba(10,10,8,.38)}
.ch-sq.cur{outline:3px solid #2456B8;outline-offset:-3px;z-index:2}
@media (hover:hover){.ch-sq.mv:hover{box-shadow:inset 0 0 0 100vmax rgba(36,86,184,.28)}}
.ch-pcs{position:absolute;inset:0;pointer-events:none}
.ch-pc{position:absolute;width:12.5%;height:12.5%;transition:transform .2s cubic-bezier(.3,.8,.4,1),opacity .2s;filter:drop-shadow(0 3px 2px rgba(0,0,0,.45));will-change:transform}
.ch-pc svg{display:block;width:100%;height:100%;transform:scale(1.1);transform-origin:50% 60%}
.ch-pc.lift{filter:drop-shadow(0 6px 6px rgba(0,0,0,.5)) drop-shadow(0 0 6px rgba(245,200,66,.8));z-index:4}
.ch-pc.gone{opacity:0}
.ch-side{flex:0 1 320px;min-width:250px;align-self:stretch;display:flex;flex-direction:column;gap:12px;min-height:0;padding:6px 0}
.ch-rival{position:relative;display:flex;align-items:flex-end;gap:10px;min-height:0}
.ch-rival img{width:96px;flex:none;filter:drop-shadow(0 0 10px rgba(245,200,66,.25));-webkit-mask-image:linear-gradient(#000 80%,transparent);mask-image:linear-gradient(#000 80%,transparent)}
.ch-say{flex:1;position:relative;background:var(--ivory);color:var(--ink);font:500 13.5px/1.35 var(--f-ui);padding:10px 12px;box-shadow:4px 4px 0 var(--gold);transform:skewX(-3deg);margin-bottom:14px;min-height:3.2em}
.ch-say small{display:block;font:700 9px/1 var(--f-ui);letter-spacing:.3em;color:var(--bronze);margin-bottom:4px}
.ch-say .dots i{display:inline-block;width:5px;height:5px;margin:0 2px;border-radius:50%;background:var(--ink);animation:chDot 1s infinite}
.ch-say .dots i:nth-child(2){animation-delay:.15s}.ch-say .dots i:nth-child(3){animation-delay:.3s}
@keyframes chDot{50%{opacity:.2}}
.ch-card{background:rgba(10,10,8,.85);border:1.5px solid rgba(201,162,39,.7);box-shadow:5px 5px 0 rgba(201,162,39,.25);padding:10px 12px;display:flex;flex-direction:column;gap:6px;min-height:0}
.ch-card h4{margin:0;font:400 15px/1 var(--f-cond);letter-spacing:.14em;color:var(--gold-hi);display:flex;justify-content:space-between;align-items:center}
.ch-card h4 em{font:600 11px/1 var(--f-ui);font-style:normal;letter-spacing:.12em;color:rgba(244,239,227,.6)}
.ch-lvl{font:400 22px/1 var(--f-cond);letter-spacing:.06em;color:var(--ivory)}
.ch-lvl small{display:block;font:600 11px/1.3 var(--f-ui);letter-spacing:.04em;color:rgba(244,239,227,.6);margin-top:3px}
.ch-moves{flex:1;min-height:60px;overflow:auto;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:auto 1fr 1fr;gap:2px 10px;align-content:start;font:500 14px/1.45 var(--f-mono);color:rgba(244,239,227,.85);scrollbar-width:thin;scrollbar-color:var(--bronze) transparent}
.ch-moves .n{color:rgba(201,162,39,.7)}.ch-moves .lt{color:var(--gold-hi)}
.ch-cap{display:flex;flex-wrap:wrap;gap:0;min-height:24px;align-items:center}
.ch-cap i{display:block;width:24px;height:24px;margin-right:-6px}.ch-cap i svg{width:100%;height:100%}
.ch-cap b{margin-left:12px;font:400 15px/1 var(--f-cond);color:var(--gold-hi)}
.ch-capwrap{display:flex;flex-direction:column;gap:4px}
.ch-capwrap span{font:700 9px/1 var(--f-ui);letter-spacing:.24em;color:rgba(244,239,227,.5)}
/* inicio y promoción */
.ch-modal{position:absolute;inset:0;z-index:6;display:grid;place-items:center;padding:70px 14px 20px;background:rgba(5,4,3,.72);backdrop-filter:blur(3px)}
.ch-modal[hidden]{display:none}
.ch-start{position:relative;width:min(620px,100%);max-height:100%;overflow:auto;box-sizing:border-box;background:var(--ink);border:1.5px solid var(--gold);box-shadow:8px 8px 0 rgba(201,162,39,.4);padding:22px 22px 20px;display:grid;grid-template-columns:auto 1fr;gap:6px 18px;animation:sheetIn .32s cubic-bezier(.2,.9,.3,1.1) both}
.ch-start>img{grid-row:1/span 2;width:110px;align-self:end;-webkit-mask-image:linear-gradient(#000 80%,transparent);mask-image:linear-gradient(#000 80%,transparent)}
.ch-start .k{font:700 10px/1 var(--f-ui);letter-spacing:.32em;color:var(--gold)}
.ch-start h3{margin:6px 0 0;font:400 clamp(28px,4.4vw,42px)/1 var(--f-cond);letter-spacing:.04em;color:var(--ivory)}
.ch-start p{margin:8px 0 0;font:500 14px/1.45 var(--f-ui);color:rgba(244,239,227,.8)}
.ch-start .row{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;align-items:center}
.ch-start .lab{grid-column:1/-1;margin-top:12px;font:700 10px/1 var(--f-ui);letter-spacing:.3em;color:rgba(244,239,227,.55)}
.ch-lv{flex:1 1 150px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;border:0;cursor:pointer;text-align:left;padding:12px 14px 10px;background:rgba(244,239,227,.05);color:var(--ivory);box-shadow:inset 0 0 0 1.5px rgba(201,162,39,.4);transform:skewX(-6deg);transition:background .12s,transform .15s}
.ch-lv>*{transform:skewX(6deg)}
.ch-lv b{font:400 22px/1 var(--f-cond);letter-spacing:.06em}
.ch-lv small{font:600 11.5px/1.3 var(--f-ui);color:rgba(244,239,227,.65)}
.ch-lv em{font:700 10px/1 var(--f-ui);font-style:normal;letter-spacing:.18em;color:var(--gold-hi)}
.ch-lv.on{background:var(--gold-hi);color:var(--ink);box-shadow:4px 4px 0 var(--ink),5px 5px 0 var(--ivory)}
.ch-lv.on small,.ch-lv.on em{color:var(--ink)}
@media (hover:hover){.ch-lv:not(.on):hover{background:rgba(245,200,66,.16)}}
.ch-col{font:400 17px/1 var(--f-cond);letter-spacing:.1em;border:0;cursor:pointer;padding:8px 14px 6px;transform:skewX(-10deg);background:transparent;color:rgba(244,239,227,.7);box-shadow:inset 0 0 0 1.5px rgba(244,239,227,.3)}
.ch-col.on{background:var(--ivory);color:var(--ink);box-shadow:4px 4px 0 var(--gold)}
.ch-go{margin-left:auto;font:400 22px/1 var(--f-cond);letter-spacing:.08em;border:0;padding:11px 18px 9px;transform:skewX(-10deg);cursor:pointer;background:var(--gold-hi);color:var(--ink);box-shadow:4px 4px 0 var(--ivory)}
.ch-go:hover,.ch-go:focus-visible{background:var(--ivory)}
.ch-go kbd{font:700 10px/1 var(--f-ui);margin-left:8px;opacity:.6}
.ch-rec{grid-column:1/-1;font:600 11.5px/1.4 var(--f-ui);color:rgba(244,239,227,.55);margin-top:10px}
.ch-promo{background:var(--ink);border:1.5px solid var(--gold);box-shadow:6px 6px 0 rgba(201,162,39,.4);padding:14px 16px;text-align:center;animation:sheetIn .25s ease both}
.ch-promo .k{font:700 10px/1 var(--f-ui);letter-spacing:.3em;color:var(--gold)}
.ch-promo .pp{display:flex;gap:8px;margin-top:10px}
.ch-promo button{width:64px;height:64px;border:0;padding:4px;background:#E8DAB5;cursor:pointer;box-shadow:inset 0 0 0 2px #0A0A08}
.ch-promo button:hover,.ch-promo button:focus-visible{background:var(--gold-hi)}
@media (hover:none) and (pointer:coarse){.ch-go kbd{display:none}}
/* vertical */
@media (max-aspect-ratio:1/1){
  .ch-wrap{flex-direction:column;justify-content:flex-start;gap:8px;padding-top:4px}
  .ch-side{display:contents}
  .ch-rival{order:-2;width:100%;max-width:560px;align-items:center}
  .ch-rival img{width:62px}
  .ch-say{margin-bottom:0;font-size:12.5px;min-height:0}
  .ch-bbox{order:0;width:min(100cqw,100cqh - 170px)}
  .ch-card.lvl{display:none}
  .ch-card.mv{order:2;width:100%;max-width:560px;flex:1 1 0!important;min-height:0;padding:6px 10px}.ch-card.mv h4{font-size:13px}
  .ch-moves{grid-template-columns:auto 1fr 1fr auto 1fr 1fr;font-size:12.5px;min-height:0}
  .ch-card.cp{order:1;width:100%;max-width:560px;padding:6px 10px;flex-direction:row;justify-content:space-between}
  .ch-card.cp h4{display:none}
  .ch-start{grid-template-columns:1fr}.ch-start>img{display:none}
}
`;

function create(stage,api){
  const C=window.TEMPLO_LIB.cartas,S=C.sounds(api),T=api.t,R=api.reduced;
  const root=C.mount(stage,CSS);const touchUI=matchMedia('(hover:none) and (pointer:coarse)').matches;
  root.insertAdjacentHTML('beforeend','<div class="ch-wrap"><div class="ch-bbox"><div class="ch-frame"><div class="ch-board" id="ch-b" role="grid" aria-label="'+T('boardAria')+'"><div class="ch-pcs" id="ch-p"></div></div></div></div>'+
    '<div class="ch-side"><div class="ch-rival"><img src="'+api.base+'casino/thot.webp" alt=""><div class="ch-say" id="ch-say" aria-live="polite"></div></div>'+
    '<div class="ch-card lvl"><h4>'+T('level')+'<em id="ch-turn"></em></h4><div class="ch-lvl" id="ch-lvl"></div></div>'+
    '<div class="ch-card mv" style="flex:1"><h4>'+T('moves')+'<em id="ch-mn"></em></h4><ol class="ch-moves" id="ch-ml"></ol></div>'+
    '<div class="ch-card cp"><h4>'+T('captured')+'</h4><div class="ch-capwrap"><span>THOT</span><div class="ch-cap" id="ch-c1"></div></div><div class="ch-capwrap"><span>'+T('you')+'</span><div class="ch-cap" id="ch-c2"></div></div></div></div></div>'+
    '<div class="ch-modal" id="ch-m" hidden></div>');
  const $=s=>root.querySelector(s),boardEl=$('#ch-b'),pcsEl=$('#ch-p'),sayEl=$('#ch-say'),modal=$('#ch-m');
  const bar=C.acts(root,api);
  /* casillas */
  const sqEl={};
  for(let i=0;i<64;i++){const b=document.createElement('button');b.type='button';b.className='ch-sq';boardEl.insertBefore(b,pcsEl);b.dataset.i=i;
    b.addEventListener('click',()=>clickSq(viewToSq(i)));sqEl[i]=b}

  /* ---------- estado ---------- */
  let st,lvl=1,color='w',me=1,flipped=false,sel=-1,legalNow=[],lastMv=0,hist=[],keys=[],sans=[],busy=false,over=false,gen=0,cur=-1,kbd=false,undos=0,lostQueen=false,started=false;
  const viewToSq=i=>{const r=7-Math.floor(i/8),f=i%8;return flipped?(7-r)*16+(7-f):r*16+f};
  const sqToView=s=>{const r=s>>4,f=s&7;return flipped?r*8+(7-f):(7-r)*8+f};
  let worker=null;try{const src='const E=('+CHESS_ENGINE.toString()+')();onmessage=e=>postMessage(Object.assign({id:e.data.id},E.think(e.data)))';
    worker=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})))}catch(e){worker=null}
  const pending={};if(worker)worker.onmessage=e=>{const cb=pending[e.data.id];delete pending[e.data.id];cb&&cb(e.data)};
  function engineThink(o,cb){const id=++gen;const ok=d=>{if(id===gen&&!over)cb(d,id)};if(worker){pending[id]=ok;worker.postMessage(Object.assign({id},o))}else setTimeout(()=>ok(E.think(o)),30)}

  function say(txt,who){sayEl.innerHTML='<small>THOT</small>'+txt}
  function thinking(){sayEl.innerHTML='<small>THOT</small>'+T('thinking')+' <span class="dots"><i></i><i></i><i></i></span>'}
  function hud(){const L=LEVELS[lvl];api.setScore(L.name+' · '+T('move')+' '+(Math.floor(hist.length/2)+1));
    $('#ch-lvl').innerHTML=L.name+'<small>'+L.sub+'</small>';$('#ch-turn').textContent=over?'':st.side===me?T('yourTurn'):T('thotTurn');$('#ch-mn').textContent=hist.length?hist.length+'':''}

  /* ---------- dibujo ---------- */
  function paintSquares(){const chk=E.inCheck(st)?st.k[st.side>0?0:1]:-1;const lf=lastMv?lastMv&127:-1,lt=lastMv?(lastMv>>7)&127:-1;
    const targets=new Map();if(sel>=0)legalNow.filter(m=>(m&127)===sel).forEach(m=>targets.set((m>>7)&127,m));
    for(let i=0;i<64;i++){const s=viewToSq(i),el=sqEl[i],r=s>>4,f=s&7,dark=(r+f)%2===0;
      el.className='ch-sq'+(dark?' d':'')+(s===lf||s===lt?' last':'')+(s===sel?' sel':'')+(s===chk?' chk':'')+(targets.has(s)?' mv'+((st.b[s]||((targets.get(s)>>17)&1))?' cap':''):'')+(kbd&&i===cur?' cur':'');
      const vr=Math.floor(i/8),vc=i%8;let co='';if(vr===7)co+='<span class="co f">'+FILES[f]+'</span>';if(vc===0)co+='<span class="co r">'+(r+1)+'</span>';el.innerHTML=co;
      const p=st.b[s];el.setAttribute('aria-label',sqName(s)+(p?' '+T('p'+Math.abs(p))+' '+(p>0?T('white'):T('black')):''))}}
  function paintPieces(){pcsEl.textContent='';for(let s=0;s<128;s++){if(s&0x88){s+=7;continue}const p=st.b[s];if(!p)continue;const v=sqToView(s),el=document.createElement('div');
      el.className='ch-pc';el.dataset.s=s;el.style.left=(v%8)*12.5+'%';el.style.top=Math.floor(v/8)*12.5+'%';el.innerHTML=pieceSVG(Math.abs(p),p>0);if(s===sel)el.classList.add('lift');pcsEl.append(el)}}
  function paintCaptured(){const start={1:8,2:2,3:2,4:2,5:1};const cnt={1:{},'-1':{}};
    for(let s=0;s<128;s++){if(s&0x88){s+=7;continue}const p=st.b[s];if(!p||Math.abs(p)===6)continue;const c=cnt[p>0?1:-1];c[Math.abs(p)]=(c[Math.abs(p)]||0)+1}
    const VAL=[0,1,3,3,5,9];let mat={1:0,'-1':0};
    const html=side=>{let h='';for(const a of [5,4,3,2,1]){const miss=Math.max(0,start[a]-(cnt[side][a]||0));for(let i=0;i<miss;i++){h+='<i>'+pieceSVG(a,side>0)+'</i>';mat[-side]+=VAL[a]}}return h};
    const takenByThot=html(me),takenByMe=html(-me);const d=mat[me]-mat[-me];
    $('#ch-c1').innerHTML=takenByThot+(d<0?'<b>+'+(-d)+'</b>':'');$('#ch-c2').innerHTML=takenByMe+(d>0?'<b>+'+d+'</b>':'')}
  function paintMoves(){const ml=$('#ch-ml');let h='';for(let i=0;i<sans.length;i+=2)h+='<li class="n">'+(i/2+1)+'.</li><li'+(i===sans.length-1?' class="lt"':'')+'>'+sans[i]+'</li><li'+(i+1===sans.length-1?' class="lt"':'')+'>'+(sans[i+1]||'')+'</li>';ml.innerHTML=h;ml.scrollTop=ml.scrollHeight}
  function paintAll(){paintSquares();paintPieces();paintCaptured();paintMoves();hud()}

  /* ---------- notación ---------- */
  function san(m,list){const f=m&127,t=(m>>7)&127,pr=(m>>14)&7,fl=m>>17,a=Math.abs(st.b[f]);let s;
    if(fl&2)s=t>f?'O-O':'O-O-O';
    else{const cap=st.b[t]||(fl&1);
      if(a===1)s=(cap?FILES[f&7]+'x':'')+sqName(t)+(pr?'='+LET[pr]:'');
      else{const oth=list.filter(x=>x!==m&&((x>>7)&127)===t&&Math.abs(st.b[x&127])===a);let dis='';
        if(oth.length){if(!oth.some(x=>((x&127)&7)===(f&7)))dis=FILES[f&7];else if(!oth.some(x=>((x&127)>>4)===(f>>4)))dis=String((f>>4)+1);else dis=sqName(f)}
        s=LET[a]+dis+(cap?'x':'')+sqName(t)}}
    E.make(st,m);const chk=E.inCheck(st),mate=chk&&!E.legal(st).length;E.unmake(st);return s+(mate?'#':chk?'+':'')}

  /* ---------- reglas de final ---------- */
  function insufficient(){const pcs=[];for(let s=0;s<128;s++){if(s&0x88){s+=7;continue}const p=st.b[s];if(p&&Math.abs(p)!==6)pcs.push([Math.abs(p),s])}
    if(!pcs.length)return true;if(pcs.length===1&&(pcs[0][0]===2||pcs[0][0]===3))return true;
    if(pcs.every(x=>x[0]===3)){const c=pcs.map(x=>((x[1]>>4)+(x[1]&7))%2);return c.every(v=>v===c[0])}return false}
  function status(){const L=E.legal(st);if(!L.length)return E.inCheck(st)?'mate':'stalemate';
    if(st.half>=100)return 'fifty';if(insufficient())return 'material';
    const k=E.key(st);if(keys.filter(x=>x===k).length>=3)return 'repeat';return null}

  /* ---------- jugar ---------- */
  function doMove(m,cb){const f=m&127,t=(m>>7)&127,fl=m>>17,cap=st.b[t]||(fl&1),mover=st.b[f],capV=Math.abs(st.b[t]);
    const text=san(m,E.legal(st));const el=pcsEl.querySelector('[data-s="'+f+'"]'),vt=sqToView(t),vf=sqToView(f);
    if(fl&1){const ce=pcsEl.querySelector('[data-s="'+(t-16*st.side)+'"]');ce&&ce.classList.add('gone')}
    const te=pcsEl.querySelector('[data-s="'+t+'"]');if(te)te.classList.add('gone');
    if(el){el.classList.remove('lift');el.style.transform='translate('+((vt%8)-(vf%8))*100+'%,'+(Math.floor(vt/8)-Math.floor(vf/8))*100+'%)'}
    const side=st.side;E.make(st,m);st.stack.length=0;hist.push(m);keys.push(E.key(st));sans.push(text);lastMv=m;sel=-1;
    if(cap){api.noise(.09,1800,600,.16);api.tone(180,.08,'triangle',.08)}else{api.tone(240,.05,'triangle',.07);api.noise(.04,2400,1600,.07)}
    if(fl&2)setTimeout(()=>api.tone(300,.05,'triangle',.06),90);
    const chk=E.inCheck(st);if(chk)setTimeout(()=>{api.tone(880,.08,'square',.05);api.tone(660,.12,'square',.05,.07)},120);
    if(capV===5&&side!==me)lostQueen=true;
    setTimeout(()=>{paintAll();cb&&cb({cap:capV,chk,mover,side})},R?0:210)}
  function clickSq(s){if(over||busy||!started)return;if(st.side!==me)return;kbd=false;
    const p=st.b[s];
    if(sel>=0){const ms=legalNow.filter(m=>(m&127)===sel&&((m>>7)&127)===s);
      if(ms.length){if(ms.length>1){askPromo(ms);return}playerMove(ms[0]);return}
      if(p&&(p>0)===(me>0)&&s!==sel){sel=s;api.sfx.tick();paintSquares();paintPieces();return}
      sel=-1;paintSquares();paintPieces();return}
    if(p&&(p>0)===(me>0)){if(!legalNow.some(m=>(m&127)===s)){api.sfx.back&&api.sfx.back();return}sel=s;api.sfx.tick();paintSquares();paintPieces()}}
  function askPromo(ms){modal.hidden=false;modal.innerHTML='<div class="ch-promo" role="dialog" aria-label="'+T('promo')+'"><div class="k">'+T('promo')+'</div><div class="pp">'+
      [5,4,3,2].map(a=>'<button type="button" data-a="'+a+'" aria-label="'+T('p'+a)+'">'+pieceSVG(a,me>0)+'</button>').join('')+'</div></div>';
    modal.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const a=+b.dataset.a;modal.hidden=true;modal.textContent='';playerMove(ms.find(m=>((m>>14)&7)===a))}));
    setTimeout(()=>{const b=modal.querySelector('button');b&&b.focus()},30)}
  function playerMove(m){busy=true;acts();doMove(m,info=>{const s=status();if(s)return end(s);
      if(info.cap===5)say(T('sayQueenTaken'));else if(info.chk)say(T('sayChecked'));else if(info.cap>=3&&Math.random()<.5)say(T('sayLostPiece'));
      thotMove()})}
  function thotMove(){busy=true;acts();thinking();const L=LEVELS[lvl],t0=Date.now();
    engineThink(Object.assign(E.snap(st),{depth:L.depth,time:L.time,noise:L.noise,blunder:L.blunder,keys:keys.slice()}),(r,id)=>{
      const wait=Math.max(0,(R?120:520)-(Date.now()-t0));setTimeout(()=>{if(over||!r.m||id!==gen)return;
        doMove(r.m,info=>{const s=status();if(s)return end(s);
          if(info.chk)say(T('sayCheck'));else if(info.cap===5)say(T('sayTookQueen'));else if(info.cap>=3)say(pick(T('sayTook').split('|')));else if(Math.random()<.18)say(pick(T('sayIdle').split('|')));else say(T('sayYour'));
          busy=false;legalNow=E.legal(st);acts()})},wait)})}
  const pick=a=>a[Math.floor(Math.random()*a.length)];

  /* ---------- acciones ---------- */
  function acts(){if(!started||over){bar.set([]);return}const L=LEVELS[lvl];bar.set([
    {label:T('undo'),key:'z',on:undo,disabled:busy||!L.undo||hist.length<(me>0?2:3),alt:true},
    {label:T('resign'),key:'r',on:resign,disabled:busy,alt:true}])}
  function undo(){if(busy||over||!LEVELS[lvl].undo)return;const n=hist.length>=2&&st.side===me?2:0;if(!n)return;undos++;
    for(let i=0;i<n;i++){hist.pop();keys.pop();sans.pop()}rebuild();say(T('sayUndo'));acts()}
  function rebuild(){st=E.newState();for(const m of hist){E.make(st,m);st.stack.length=0}lastMv=hist.length?hist[hist.length-1]:0;sel=-1;legalNow=E.legal(st);paintAll()}
  function resign(){if(over||!started)return;
    modal.hidden=false;modal.innerHTML='<div class="ch-promo" role="dialog"><div class="k">'+T('resignQ')+'</div><div class="pp" style="justify-content:center"><button type="button" class="ch-col on" style="width:auto;height:auto;padding:9px 16px 7px" id="ch-ry">'+T('resignYes')+'</button><button type="button" class="ch-col" style="width:auto;height:auto;padding:9px 16px 7px;background:transparent;color:var(--ivory)" id="ch-rn">'+T('resignNo')+'</button></div></div>';
    $('#ch-ry').addEventListener('click',()=>{modal.hidden=true;gen++;end('resign')});$('#ch-rn').addEventListener('click',()=>{modal.hidden=true;modal.textContent=''});setTimeout(()=>$('#ch-rn').focus(),30)}

  function end(kind){if(over)return;over=true;busy=false;gen++;sel=-1;paintSquares();bar.set([]);const L=LEVELS[lvl],moves=Math.ceil(hist.length/2);
    let res=kind==='mate'?(st.side===me?'loss':'win'):kind==='resign'?'loss':'draw';
    let score=0,ankhs=1;if(res==='win'){score=L.base+Math.max(0,60-moves)*10;ankhs=L.ank+(moves<=30?Math.ceil(L.ank/2):0)}else if(res==='draw'){score=Math.round(L.base/3);ankhs=Math.max(2,Math.round(L.ank/3))}
    say(T('end_'+res));
    if(api.ach){api.ach('ajz-first');if(res==='win'){if(lvl>=0)api.ach('ajz-win');if(lvl>=1)api.ach('ajz-normal');if(lvl>=2){api.ach('ajz-hard');if(moves<=30&&!lostQueen)api.ach('ajz-perfect')}}}
    if(res==='win'){C.banner(root,api,T('banWin'),T('kind_'+kind),true);S.big()}else if(res==='draw'){C.banner(root,api,T('banDraw'),T('kind_'+kind));S.push()}else{C.banner(root,api,T('banLoss'),T('kind_'+kind));S.lose()}
    setTimeout(()=>api.finish({score,unit:'pts',ankhs,detail:T('detail').replace('{r}',T('res_'+res)).replace('{l}',L.name).replace('{k}',T('kind_'+kind)).replace('{m}',moves)}),R?300:1900)}

  /* ---------- inicio ---------- */
  function startScreen(){started=false;over=false;bar.set([]);modal.hidden=false;
    modal.innerHTML='<div class="ch-start" role="dialog" aria-label="'+T('title')+'"><img src="'+api.base+'casino/thot.webp" alt=""><div><div class="k">'+T('kicker')+'</div><h3>'+T('title')+'</h3></div><p>'+T('intro')+'</p>'+
      '<div class="lab">'+T('pickLevel')+'</div><div class="row" id="ch-lvs">'+LEVELS.map((L,i)=>'<button type="button" class="ch-lv'+(i===lvl?' on':'')+'" data-i="'+i+'"><b>'+L.name+'</b><small>'+L.sub+'</small><em>𓋹 '+L.ank+' '+T('perWin')+'</em></button>').join('')+'</div>'+
      '<div class="lab">'+T('pickColor')+'</div><div class="row"><button type="button" class="ch-col" data-c="w">'+T('cWhite')+'</button><button type="button" class="ch-col" data-c="b">'+T('cBlack')+'</button><button type="button" class="ch-col" data-c="r">'+T('cRandom')+'</button>'+
      '<button type="button" class="ch-go" id="ch-go">'+T('play')+'<kbd>ENTER</kbd></button></div><p class="ch-rec">'+T('rules')+'</p></div>';
    const paint=()=>{modal.querySelectorAll('.ch-lv').forEach(b=>b.classList.toggle('on',+b.dataset.i===lvl));modal.querySelectorAll('.ch-col').forEach(b=>b.classList.toggle('on',b.dataset.c===color))};paint();
    modal.querySelectorAll('.ch-lv').forEach(b=>b.addEventListener('click',()=>{lvl=+b.dataset.i;api.sfx.tick();paint()}));
    modal.querySelectorAll('.ch-col').forEach(b=>b.addEventListener('click',()=>{color=b.dataset.c;api.sfx.tick();paint()}));
    $('#ch-go').addEventListener('click',begin);setTimeout(()=>{const g=$('#ch-go');g&&g.focus({preventScroll:true})},60);
    st=E.newState();me=1;flipped=false;hist=[];keys=[E.key(st)];sans=[];lastMv=0;sel=-1;legalNow=[];paintAll();say(T('sayHello'))}
  function begin(){api.sfx.confirm();modal.hidden=true;modal.textContent='';me=color==='w'?1:color==='b'?-1:(Math.random()<.5?1:-1);flipped=me<0;
    st=E.newState();hist=[];keys=[E.key(st)];sans=[];lastMv=0;sel=-1;over=false;busy=false;undos=0;lostQueen=false;started=true;cur=me>0?sqToView(12):sqToView(100);
    paintAll();if(me>0){legalNow=E.legal(st);say(T('sayStartW'));acts()}else{say(T('sayStartB'));thotMove()}}

  /* ---------- teclado ---------- */
  const kd=e=>{if(!modal.hidden){const k=e.key;
      if(!started){if(k==='Enter'){e.preventDefault();begin();return}
        if(k==='ArrowRight'||k==='ArrowLeft'){e.preventDefault();lvl=(lvl+(k==='ArrowRight'?1:2))%3;api.sfx.tick();modal.querySelectorAll('.ch-lv').forEach(b=>b.classList.toggle('on',+b.dataset.i===lvl));return}
        if(k==='ArrowUp'||k==='ArrowDown'){e.preventDefault();const o=['w','b','r'];color=o[(o.indexOf(color)+(k==='ArrowDown'?1:2))%3];api.sfx.tick();modal.querySelectorAll('.ch-col').forEach(b=>b.classList.toggle('on',b.dataset.c===color));return}}
      return}
    if(!started||over)return;const k=e.key;if(k.length===1&&k!==' '&&bar.key(e))return;const mv={ArrowUp:-8,ArrowDown:8,ArrowLeft:-1,ArrowRight:1}[k];
    if(mv!==undefined){e.preventDefault();if(!kbd){kbd=true}else{const n=cur+mv;if(n>=0&&n<64&&!(mv===1&&n%8===0)&&!(mv===-1&&cur%8===0))cur=n}api.sfx.tick();paintSquares();return}
    if((k==='Enter'||k===' ')&&kbd){e.preventDefault();const was=kbd;clickSq(viewToSq(cur));kbd=was;paintSquares();return}
    if(k==='Escape'&&sel>=0){e.preventDefault();e.stopPropagation();sel=-1;paintSquares();paintPieces()}};
  addEventListener('keydown',kd,true);
  startScreen();
  return{restart(){gen++;startScreen()},stop(){gen++;over=true;if(worker)worker.terminate();removeEventListener('keydown',kd,true);root.remove()}};
}

window.TEMPLO.register('ajedrez',{create,help:[
  {t:'OBJETIVO',p:'Dar jaque mate al rey de Thot: atacarlo sin que pueda escapar. Eliges dificultad y color al empezar; las blancas mueven primero.'},
  {t:'LAS PIEZAS',p:'Rey (faraón con ankh): una casilla en cualquier dirección. Dama (disco solar): cualquier distancia en línea recta o diagonal. Torre (pilono): en línea recta. Alfil (ibis): en diagonal. Caballo (chacal): en «L», saltando piezas. Peón (escarabeo): avanza una casilla (dos en su primer movimiento) y captura en diagonal.'},
  {t:'JUGADAS ESPECIALES',p:'Enroque: el rey se mueve dos casillas hacia una torre que no se haya movido y la torre salta a su lado (no se puede enrocar en jaque ni cruzando casillas atacadas). Al paso: un peón puede capturar a otro que acaba de avanzar dos casillas a su lado. Promoción: el peón que llega al final se convierte en la pieza que elijas.'},
  {t:'TABLAS',p:'La partida acaba en tablas si quien mueve no tiene jugadas legales sin estar en jaque (ahogado), si no queda material para dar mate, si la misma posición se repite tres veces o tras 50 jugadas sin capturas ni movimientos de peón.'},
  {t:'CONTROLES',p:'Toca o haz clic en una pieza para ver sus movimientos y luego en la casilla de destino. Con teclado: flechas para moverte por el tablero y Enter para elegir. En Fácil y Normal puedes deshacer tu última jugada.'},
  {t:'PUNTOS Y ANKHS',p:'Ganar da más puntos y ankhs cuanto más difícil sea el nivel y menos jugadas necesites. Las tablas dan un tercio. Rendirse o perder da 1 ankh.'}],texts:{
  title:'EL AJEDREZ DE THOT',kicker:'TABLERO DEL DIOS DE LA SABIDURÍA',boardAria:'Tablero de ajedrez',
  intro:'Thot inventó la escritura, los números… y dice que también este juego. Demuéstrale que se equivoca.',
  pickLevel:'DIFICULTAD',pickColor:'TU COLOR',cWhite:'BLANCAS',cBlack:'NEGRAS',cRandom:'AL AZAR',play:'JUGAR',perWin:'POR VICTORIA',
  rules:'Reglas completas: enroque, captura al paso, promoción, ahogado y tablas. Pulsa «? REGLAS» si necesitas un repaso.',
  level:'DIFICULTAD',moves:'JUGADAS',captured:'CAPTURAS',you:'TÚ',yourTurn:'TU TURNO',thotTurn:'PIENSA THOT',lvlShort:'NIVEL',move:'JUGADA',
  undo:'DESHACER',resign:'RENDIRSE',resignQ:'¿TE RINDES ANTE THOT?',resignYes:'SÍ, ME RINDO',resignNo:'SEGUIR JUGANDO',promo:'ELIGE LA PROMOCIÓN',
  white:'blanca',black:'negra',p1:'peón',p2:'caballo',p3:'alfil',p4:'torre',p5:'dama',p6:'rey',
  thinking:'Pensando',
  sayHello:'«Elige con cuidado. Yo ya he pensado mis primeras diez jugadas.»',
  sayStartW:'«Las blancas mueven primero. Adelante, mortal.»',sayStartB:'«Juego con blancas. Observa y aprende.»',
  sayYour:'«Tu turno.»',sayCheck:'«Jaque. Mide bien tu siguiente paso.»',sayChecked:'«¿Jaque? Interesante…»',
  sayTookQueen:'«Tu dama ya pesa en mi balanza.»',sayQueenTaken:'«Mi dama… No lo había calculado. O eso crees.»',
  sayLostPiece:'«Un sacrificio necesario.»',sayTook:'«Esa pieza era mía desde hace tres jugadas.»|«Gracias por el regalo.»|«Lo que se deja suelto, se lo lleva el ibis.»',
  sayIdle:'«Hmm.»|«El tablero es como un papiro: todo queda escrito.»|«Cada casilla cuenta.»',sayUndo:'«Te concedo esa. Solo esa.»',
  end_win:'«Has vencido a la sabiduría. Lo apuntaré en mis papiros.»',end_loss:'«Jaque mate. La sabiduría siempre gana.»',end_draw:'«Tablas. Ninguno de los dos ha escrito la última palabra.»',
  banWin:'¡JAQUE MATE!',banLoss:'GANA THOT',banDraw:'TABLAS',
  kind_mate:'Jaque mate',kind_resign:'Abandono',kind_stalemate:'Ahogado',kind_fifty:'Regla de las 50 jugadas',kind_material:'Material insuficiente',kind_repeat:'Triple repetición',
  res_win:'Victoria',res_loss:'Derrota',res_draw:'Tablas',
  detail:'{r} en {l} · {k} · {m} jugadas'}});
})();
