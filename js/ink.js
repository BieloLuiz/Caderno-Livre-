/* Caderno Livre — motor de tinta
   Captura estabilizada, geometria do traço (contorno único, sem emendas),
   pincéis com comportamento próprio e fluxo de tinta.
   Coordenadas sempre na página lógica (1000 de largura). */
(function(){
"use strict";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- Ferramentas ----------
   w: espessura padrão · o: opacidade · f: fluxo de tinta (100 = cheio e uniforme)
   st: estabilidade · grain: textura de papel quando o fluxo cai */
const KINDS={
  esfero:  {n:'Esferográfica',icon:'pen',   min:.4,max:14,def:1.4,o:1,  f:100,st:55,grain:.35,shape:'var'},
  fina:    {n:'Caneta fina',  icon:'fine',  min:.3,max:8, def:1.0,o:1,  f:100,st:50,grain:.2,shape:'line'},
  tinteiro:{n:'Tinteiro',     icon:'nib',   min:.8,max:20,def:3.2,o:1,  f:82,st:40,grain:.3,shape:'var'},
  pincel:  {n:'Pincel',       icon:'brush', min:2, max:44,def:10, o:1,  f:86,st:45,grain:.25,shape:'var'},
  lapis:   {n:'Lápis',        icon:'pencil',min:.6,max:12,def:1.8,o:.9, f:70,st:25,grain:.85,shape:'var'},
  hl:      {n:'Marca-texto',  icon:'hl',    min:6, max:60,def:24, o:.4, f:100,st:60,grain:.12,shape:'line'}
};
const ORDER=['esfero','fina','tinteiro','pincel','lapis','hl'];
const kindOf=s=>s.k&&KINDS[s.k]?s.k:(s.t==='hl'?'hl':'esfero');
const alphaOf=s=>s.o!=null?s.o:KINDS[kindOf(s)].o;
const flowOf=s=>s.f!=null?s.f:100;   // traços antigos: tinta cheia

/* ---------- Estabilizador ----------
   Duas etapas com efeitos diferentes:
   1) "corda": a ponta só anda quando a caneta se afasta mais que o raio,
      o que elimina o tremor pequeno sem atrasar o movimento largo;
   2) filtro adaptativo: suaviza mais quando o movimento é lento e quase
      nada quando é rápido, para não deformar a letra.
   O raio é medido em pixels de tela, então o efeito é o mesmo em qualquer zoom. */
class Stabilizer{
  constructor(strength,unitsPerPx){
    const s=clamp(strength,0,100)/100;this.s=s;this.upp=unitsPerPx||1;
    this.r=s*s*9*this.upp;          // até 9 px de tela
    this.amin=1-s*0.78;             // peso mínimo do ponto novo
    this.bx=null;
  }
  push(x,y){
    if(this.bx===null){this.bx=this.sx=x;this.by=this.sy=y;return [x,y]}
    if(this.r>0){
      const dx=x-this.bx,dy=y-this.by,d=Math.hypot(dx,dy);
      if(d<=this.r)return null;
      const m=(d-this.r)/d;this.bx+=dx*m;this.by+=dy*m;
    }else{this.bx=x;this.by=y}
    const sp=Math.hypot(this.bx-this.sx,this.by-this.sy)/this.upp; // px de tela
    const a=Math.min(1,this.amin+sp*0.045);
    this.sx+=(this.bx-this.sx)*a;this.sy+=(this.by-this.sy)*a;
    return [this.sx,this.sy];
  }
  /* ao levantar a caneta, o traço alcança o ponto real em que ela saiu */
  finish(x,y){
    if(this.bx===null)return [];
    const d=Math.hypot(x-this.sx,y-this.sy);if(d<0.3)return [];
    const n=Math.min(8,Math.max(1,Math.ceil(d/(2*this.upp))));const out=[];
    for(let i=1;i<=n;i++){const t=i/n,e=1-(1-t)*(1-t);out.push([this.sx+(x-this.sx)*e,this.sy+(y-this.sy)*e])}
    return out;
  }
}

/* ---------- Geometria ----------
   Interpolação Catmull-Rom entre os pontos capturados, reamostrada em passos
   curtos, para que movimentos rápidos (pontos distantes) virem curvas, não retas. */
function samplesOf(s){
  const st=s.s||2,p=s.p,n=p.length/st;
  const X=[],Y=[],P=[],A=[],Z=[];
  const get=(i,j)=>p[clamp(i,0,n-1)*st+j];
  const pr=i=>st>=3?get(i,2)/100:.5, al=i=>st>=5?get(i,3):90, az=i=>st>=5?get(i,4):45;
  if(n===1){X.push(p[0]);Y.push(p[1]);P.push(pr(0));A.push(al(0));Z.push(az(0));return {X,Y,P,A,Z}}
  const step=Math.max(.6,Math.min(1.6,s.w*.25));
  /* Catmull-Rom centrípeta: a curva passa pelos pontos sem fazer laçadas nem
     bicos quando eles chegam com espaçamento desigual (o que acontece depois de
     tirar o tremor e em movimentos rápidos). */
  const kn=(ax,ay,bx,by)=>Math.max(1e-4,Math.sqrt(Math.hypot(bx-ax,by-ay)));
  for(let i=0;i<n-1;i++){
    let x0=get(i-1,0),y0=get(i-1,1);const x1=get(i,0),y1=get(i,1),x2=get(i+1,0),y2=get(i+1,1);let x3=get(i+2,0),y3=get(i+2,1);
    if(i===0){x0=2*x1-x2;y0=2*y1-y2}
    if(i+2>n-1){x3=2*x2-x1;y3=2*y2-y1}
    const t0=0,t1=t0+kn(x0,y0,x1,y1),t2=t1+kn(x1,y1,x2,y2),t3=t2+kn(x2,y2,x3,y3);
    const seg=Math.hypot(x2-x1,y2-y1);const m=Math.max(1,Math.ceil(seg/step));
    const p1=pr(i),p2=pr(i+1),a1=al(i),a2=al(i+1),z1=az(i),z2=az(i+1);
    for(let j=0;j<m;j++){const u=j/m,t=t1+(t2-t1)*u;
      const A1x=(t1-t)/(t1-t0)*x0+(t-t0)/(t1-t0)*x1,A1y=(t1-t)/(t1-t0)*y0+(t-t0)/(t1-t0)*y1;
      const A2x=(t2-t)/(t2-t1)*x1+(t-t1)/(t2-t1)*x2,A2y=(t2-t)/(t2-t1)*y1+(t-t1)/(t2-t1)*y2;
      const A3x=(t3-t)/(t3-t2)*x2+(t-t2)/(t3-t2)*x3,A3y=(t3-t)/(t3-t2)*y2+(t-t2)/(t3-t2)*y3;
      const B1x=(t2-t)/(t2-t0)*A1x+(t-t0)/(t2-t0)*A2x,B1y=(t2-t)/(t2-t0)*A1y+(t-t0)/(t2-t0)*A2y;
      const B2x=(t3-t)/(t3-t1)*A2x+(t-t1)/(t3-t1)*A3x,B2y=(t3-t)/(t3-t1)*A2y+(t-t1)/(t3-t1)*A3y;
      X.push((t2-t)/(t2-t1)*B1x+(t-t1)/(t2-t1)*B2x);Y.push((t2-t)/(t2-t1)*B1y+(t-t1)/(t2-t1)*B2y);
      P.push(p1+(p2-p1)*u);A.push(a1+(a2-a1)*u);Z.push(z1+(z2-z1)*u);
    }
  }
  X.push(get(n-1,0));Y.push(get(n-1,1));P.push(pr(n-1));A.push(al(n-1));Z.push(az(n-1));
  /* Suavização da linha central: tira o tremor fino do sensor (que deixa a
     borda ondulada no zoom) sem mudar o desenho da letra. A janela é curta,
     proporcional à espessura, e as pontas ficam exatamente onde você parou. */
  const N=X.length,win=Math.max(1,Math.round(Math.max(1.1,s.w*.45)/step));
  if(N>4)for(let pass=0;pass<2;pass++){
    const x=X.slice(),y=Y.slice();
    for(let i=1;i<N-1;i++){const m=Math.min(win,i,N-1-i);let sx=0,sy=0;for(let j=-m;j<=m;j++){sx+=x[i+j];sy+=y[i+j]}X[i]=sx/(2*m+1);Y[i]=sy/(2*m+1)}
  }
  return {X,Y,P,A,Z};
}

/* Simplificação (Ramer–Douglas–Peucker): tira os pontos que só carregam o
   tremor da mão e mantém os que definem a forma (curvas e cantos). eps é a
   distância máxima, em unidades da página, que um ponto descartado podia
   estar da linha final. */
function simplify(p,st,eps){
  const n=p.length/st;if(n<3||eps<=0)return p.slice();
  const keep=new Uint8Array(n);keep[0]=keep[n-1]=1;const stack=[0,n-1];
  while(stack.length){const b=stack.pop(),a=stack.pop();
    const ax=p[a*st],ay=p[a*st+1],bx=p[b*st],by=p[b*st+1],dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;let md=0,mi=-1;
    for(let i=a+1;i<b;i++){const px=p[i*st],py=p[i*st+1];let t=L?((px-ax)*dx+(py-ay)*dy)/L:0;t=t<0?0:t>1?1:t;const d=Math.hypot(px-ax-t*dx,py-ay-t*dy);if(d>md){md=d;mi=i}}
    if(md>eps){keep[mi]=1;stack.push(a,mi,mi,b)}}
  const out=[];for(let i=0;i<n;i++)if(keep[i])for(let j=0;j<st;j++)out.push(p[i*st+j]);
  return out;
}
/* Raio do traço em cada ponto: aqui cada ferramenta ganha seu comportamento */
function radii(s,kind,S){
  const n=S.X.length,R=new Array(n),w=s.w;
  for(let i=0;i<n;i++){
    const pr=S.P[i],i0=Math.max(0,i-2),i1=Math.min(n-1,i+2);
    const dx=S.X[i1]-S.X[i0],dy=S.Y[i1]-S.Y[i0];
    let r;
    switch(kind){
      case 'esfero':r=w;break;                                  // sempre uniforme, como uma esferográfica de verdade
      case 'tinteiro':{                                          // pena chanfrada: largura depende da direção
        const nib=(S.A[i]<88?S.Z[i]:45)*Math.PI/180+Math.PI/4;
        const a=Math.atan2(dy,dx);r=w*(0.22+1.0*Math.abs(Math.sin(a-nib)))*(0.78+0.44*pr);break}
      case 'pincel':r=w*(0.06+1.2*pr*pr);break;                  // muito sensível à pressão/velocidade
      case 'lapis':{const tilt=1-clamp(S.A[i],20,90)/90;r=w*(0.8+0.35*pr)*(1+tilt*2.2);break} // deitado = mais largo
      default:r=w;
    }
    R[i]=r/2;
  }
  /* afina pontas no pincel e no tinteiro */
  if(kind==='pincel'||kind==='tinteiro'){const L=Math.min(n>>1,kind==='pincel'?14:6);
    for(let i=0;i<L;i++){const f=.25+.75*(i/L);R[i]*=f;R[n-1-i]*=f}}
  /* suaviza a largura para não tremer */
  for(let pass=0;pass<2;pass++){let prev=R[0];for(let i=1;i<n-1;i++){const cur=R[i];R[i]=(prev+cur*2+R[i+1])/4;prev=cur}}
  for(let i=0;i<n;i++)R[i]=Math.max(.25,R[i]);
  return R;
}
/* Forma do traço: união de círculos (um em cada ponto) e das faixas que os
   ligam. Como cada faixa usa só a direção do próprio trecho, curvas fechadas
   não "dobram" o contorno nem criam bicos. Pontos em trechos retos e de
   espessura constante são descartados (interpolação adaptativa). Tudo vai
   numa forma só, preenchida de uma vez, com antisserrilhamento do navegador. */
function stampPath(S,R){
  const n=S.X.length,path=new Path2D();
  const circle=(i)=>{const r=R[i];path.moveTo(S.X[i]+r,S.Y[i]);path.arc(S.X[i],S.Y[i],r,0,Math.PI*2,false)};
  if(n===1){circle(0);return path}
  const keep=[0];
  for(let i=1;i<n-1;i++){
    const j=keep[keep.length-1];const dx=S.X[i]-S.X[j],dy=S.Y[i]-S.Y[j],d=Math.hypot(dx,dy);
    const ex=S.X[i+1]-S.X[i],ey=S.Y[i+1]-S.Y[i];
    let da=Math.abs(Math.atan2(ey,ex)-Math.atan2(dy,dx));if(da>Math.PI)da=2*Math.PI-da;
    if(d>Math.min(1.6,R[i]*.8+.3)||da>.03||Math.abs(R[i]-R[j])>R[j]*.035)keep.push(i);
  }
  keep.push(n-1);
  for(let q=0;q<keep.length;q++){
    const i=keep[q];circle(i);if(!q)continue;
    const j=keep[q-1],ax=S.X[j],ay=S.Y[j],bx=S.X[i],by=S.Y[i],ra=R[j],rb=R[i];
    const d=Math.hypot(bx-ax,by-ay);if(d<1e-4)continue;
    const ux=(bx-ax)/d,uy=(by-ay)/d,nx=-uy,ny=ux,sn=(ra-rb)/d;if(Math.abs(sn)>=1)continue;
    const cs=Math.sqrt(1-sn*sn);
    const m1x=sn*ux+cs*nx,m1y=sn*uy+cs*ny,m2x=sn*ux-cs*nx,m2y=sn*uy-cs*ny;
    const P=[[ax+ra*m1x,ay+ra*m1y],[bx+rb*m1x,by+rb*m1y],[bx+rb*m2x,by+rb*m2y],[ax+ra*m2x,ay+ra*m2y]];
    let area=0;for(let k=0;k<4;k++){const p=P[k],o=P[(k+1)%4];area+=p[0]*o[1]-o[0]*p[1]}
    if(area<0)P.reverse();
    path.moveTo(P[0][0],P[0][1]);path.lineTo(P[1][0],P[1][1]);path.lineTo(P[2][0],P[2][1]);path.lineTo(P[3][0],P[3][1]);path.closePath();
  }
  return path;
}
function linePath(S){const path=new Path2D();path.moveTo(S.X[0],S.Y[0]);for(let i=1;i<S.X.length;i++)path.lineTo(S.X[i],S.Y[i]);if(S.X.length===1)path.lineTo(S.X[0]+.01,S.Y[0]);return path}

/* Cache: a geometria de cada traço é calculada uma vez e reaproveitada em
   qualquer zoom (o desenho é vetorial; o zoom só muda a escala). */
const cache=new WeakMap();
function geom(s){
  let g=cache.get(s);if(g)return g;
  const kind=kindOf(s),K=KINDS[kind],S=samplesOf(s);
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let i=0;i<S.X.length;i++){const x=S.X[i],y=S.Y[i];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  let path,R=null,pad=s.w/2+1;
  const dashed=s.ls==='dot'||s.ls==='dash';
  if(K.shape==='line'||dashed)path=linePath(S);
  else{R=radii(s,kind,S);path=stampPath(S,R);let m=0;for(const r of R)if(r>m)m=r;pad=m+1}
  g={kind,S,R,path,dashed,box:[x0-pad,y0-pad,x1+pad,y1+pad]};
  if(Object.isFrozen(s)||!s._live)cache.set(s,g);
  return g;
}

/* ---------- Textura de papel (para fluxo baixo e lápis) ---------- */
let grainC=null;
function grainCanvas(){
  if(grainC)return grainC;
  grainC=document.createElement('canvas');grainC.width=grainC.height=128;const g=grainC.getContext('2d');
  let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<2600;i++){g.fillStyle=`rgba(0,0,0,${0.2+rnd()*0.7})`;const w=rnd()<.25?2:1;g.fillRect(Math.floor(rnd()*128),Math.floor(rnd()*128),w,1)}
  return grainC;
}
let scratch=null;
function layer(w,h){if(!scratch)scratch=document.createElement('canvas');if(scratch.width<w)scratch.width=Math.ceil(w);if(scratch.height<h)scratch.height=Math.ceil(h);return scratch}

/* ---------- Desenho de um traço ----------
   ctx deve estar sem transformação; k = pixels por unidade da página. */
function draw(ctx,s,k,ox,oy){
  const g=geom(s),K=KINDS[g.kind],a=alphaOf(s),f=flowOf(s)/100;
  const tx=-(ox||0)*k,ty=-(oy||0)*k;
  const simple=a>=1&&f>=.995&&g.kind!=='lapis';
  const paint=(c)=>{
    if(g.dashed){c.lineCap='round';c.lineJoin='round';c.lineWidth=s.w;c.strokeStyle=s.c;
      c.setLineDash(s.ls==='dot'?[.001,s.w*2.8]:[s.w*5,s.w*3.6]);c.stroke(g.path);c.setLineDash([])}
    else if(K.shape==='line'){c.lineCap='round';c.lineJoin='round';c.lineWidth=s.w;c.strokeStyle=s.c;c.stroke(g.path)}
    else{c.fillStyle=s.c;c.fill(g.path)}
  };
  if(simple){ctx.save();ctx.setTransform(k,0,0,k,tx,ty);paint(ctx);ctx.restore();return}
  const W=ctx.canvas.width,H=ctx.canvas.height;
  const bx=Math.max(0,Math.floor(g.box[0]*k+tx)),by=Math.max(0,Math.floor(g.box[1]*k+ty));
  const bw=Math.min(W,Math.ceil(g.box[2]*k+tx))-bx,bh=Math.min(H,Math.ceil(g.box[3]*k+ty))-by;
  if(bw<=0||bh<=0)return;
  const L=layer(bw,bh),lc=L.getContext('2d');
  lc.setTransform(1,0,0,1,0,0);lc.globalAlpha=1;lc.globalCompositeOperation='source-over';lc.clearRect(0,0,bw,bh);
  lc.setTransform(k,0,0,k,tx-bx,ty-by);paint(lc);
  /* Fluxo: a tinta "falha" onde a caneta andou rápido (pressão simulada baixa)
     e a textura do papel aparece quando o fluxo é baixo. */
  if(f<.995&&g.R){
    lc.globalCompositeOperation='destination-out';
    const S=g.S,R=g.R,n=S.X.length;let acc=0;
    const kf=g.kind==='tinteiro'?.34:g.kind==='pincel'?.3:g.kind==='lapis'?.2:.26;
    for(let i=0;i<n;i++){acc+=1;if(acc<Math.max(1,R[i]*.7/Math.max(.6,Math.min(1.6,s.w*.25))))continue;acc=0;
      const al=(1-f)*(1-S.P[i])*kf;if(al<.01)continue;
      lc.globalAlpha=al;lc.beginPath();lc.arc(S.X[i],S.Y[i],R[i]*1.05,0,6.2832);lc.fill()}
  }
  const grain=g.kind==='lapis'?K.grain*(1.15-f*.55):K.grain*(1-f)*1.6;
  if(grain>.02){
    lc.setTransform(1,0,0,1,0,0);lc.globalCompositeOperation='destination-out';lc.globalAlpha=clamp(grain,0,.9);
    const pat=lc.createPattern(grainCanvas(),'repeat');
    try{pat.setTransform(new DOMMatrix().translate(-(bx%128),-(by%128)))}catch(e){}
    lc.fillStyle=pat;lc.fillRect(0,0,bw,bh);
  }
  lc.globalCompositeOperation='source-over';lc.globalAlpha=1;lc.setTransform(1,0,0,1,0,0);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=a;if(g.kind==='hl')ctx.globalCompositeOperation='multiply';
  ctx.drawImage(L,0,0,bw,bh,bx,by,bw,bh);ctx.restore();
}
function invalidate(s){cache.delete(s)}

/* ---------- Fita (washi) ----------
   Faixa larga com ponta reta, em três padrões. Fica por cima de tudo na página
   (inclusive do texto digitado) e pode ser levantada com um toque para estudar. */
const TAPE_ALPHA={lisa:1,listras:1,bolinhas:1};
function tapeTile(pat,c,px){
  const t=document.createElement('canvas');t.width=t.height=Math.max(4,Math.round(px));const g=t.getContext('2d'),n=t.width;
  g.fillStyle=c;g.fillRect(0,0,n,n);
  if(pat==='listras'){g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=n*.22;g.beginPath();
    for(let o=-n;o<=n*2;o+=n/2){g.moveTo(o,n);g.lineTo(o+n,0)}g.stroke()}
  if(pat==='bolinhas'){g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.arc(n*.25,n*.25,n*.12,0,7);g.arc(n*.75,n*.75,n*.12,0,7);g.fill()}
  return t;
}
function tapePath(t){
  const p=t.p,path=new Path2D();
  if(t.mode==='ret'){const x=Math.min(p[0],p[2]),y=Math.min(p[1],p[3]);path.rect(x,y,Math.abs(p[2]-p[0]),Math.abs(p[3]-p[1]));return path}
  path.moveTo(p[0],p[1]);const n=p.length/2;
  if(n===1){path.lineTo(p[0]+.01,p[1]);return path}
  for(let i=1;i<n-1;i++){const mx=(p[i*2]+p[i*2+2])/2,my=(p[i*2+1]+p[i*2+3])/2;path.quadraticCurveTo(p[i*2],p[i*2+1],mx,my)}
  path.lineTo(p[(n-1)*2],p[(n-1)*2+1]);return path;
}
function drawTape(ctx,t,k,revealed){
  const pat=ctx.createPattern(tapeTile(t.pat,t.c,14*k),'repeat');
  try{pat.setTransform(new DOMMatrix().scale(1/k))}catch(e){}
  ctx.save();ctx.setTransform(k,0,0,k,0,0);ctx.globalAlpha=revealed?.18:(TAPE_ALPHA[t.pat]||1);
  const path=tapePath(t);
  if(t.mode==='ret'){ctx.fillStyle=pat;ctx.fill(path)}
  else{ctx.lineCap='butt';ctx.lineJoin='round';ctx.lineWidth=t.w;ctx.strokeStyle=pat;ctx.stroke(path)}
  ctx.restore();
}

window.Ink={KINDS,ORDER,kindOf,alphaOf,flowOf,Stabilizer,draw,geom,invalidate,simplify,drawTape,TAPE_ALPHA};
})();
