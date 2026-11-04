/* Caderno Livre — escrita para texto
   1) agrupa os traços em linhas;
   2) desenha cada linha como imagem limpa (preto no branco);
   3) pede ao Claude a transcrição, em português do Brasil.
   Não mexe na página: quem aplica o resultado é o app. */
(function(){
"use strict";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* Agrupamento em linhas: dois traços estão na mesma linha quando suas faixas
   verticais se sobrepõem bastante. Acentos e pingos (traços baixinhos) vão para
   a linha mais próxima. Linhas muito separadas na horizontal viram blocos diferentes. */
function clusterLines(strokes){
  const items=strokes.map(s=>{const b=Ink.geom(s).box;return {s,x0:b[0],y0:b[1],x1:b[2],y1:b[3],h:b[3]-b[1],cy:(b[1]+b[3])/2}}).filter(i=>i.h>=0);
  if(!items.length)return [];
  const hs=items.map(i=>i.h).sort((a,b)=>a-b),medH=Math.max(8,hs[hs.length>>1]);
  const big=items.filter(i=>i.h>=medH*.35),small=items.filter(i=>i.h<medH*.35);
  big.sort((a,b)=>a.cy-b.cy);
  const lines=[];
  for(const it of big){
    let best=null,bestOv=0;
    for(const L of lines){const ov=Math.min(L.y1,it.y1)-Math.max(L.y0,it.y0);const r=ov/Math.min(it.h||1,L.h||1);
      if(r>bestOv&&(r>.4||Math.abs(L.cy-it.cy)<medH*.45)){bestOv=r;best=L}}
    if(best){best.items.push(it);best.y0=Math.min(best.y0,it.y0);best.y1=Math.max(best.y1,it.y1);best.h=best.y1-best.y0;
      best.cy=best.items.reduce((a,b)=>a+b.cy,0)/best.items.length;best.x0=Math.min(best.x0,it.x0);best.x1=Math.max(best.x1,it.x1)}
    else lines.push({items:[it],x0:it.x0,x1:it.x1,y0:it.y0,y1:it.y1,h:it.h,cy:it.cy});
  }
  for(const it of small){
    let best=null,bd=1e9;
    for(const L of lines){const d=it.cy<L.y0?L.y0-it.cy:it.cy>L.y1?it.cy-L.y1:0;const dd=d+Math.max(0,it.x0-L.x1-medH*2)+Math.max(0,L.x0-it.x1-medH*2);if(dd<bd){bd=dd;best=L}}
    if(best&&bd<medH*1.2){best.items.push(it);best.x0=Math.min(best.x0,it.x0);best.x1=Math.max(best.x1,it.x1);best.y0=Math.min(best.y0,it.y0);best.y1=Math.max(best.y1,it.y1)}
    else lines.push({items:[it],x0:it.x0,x1:it.x1,y0:it.y0,y1:it.y1,h:it.h,cy:it.cy});
  }
  /* separa blocos da mesma faixa com um vão horizontal grande (duas colunas) */
  const out=[];
  for(const L of lines){
    const its=L.items.slice().sort((a,b)=>a.x0-b.x0);let cur=null,reach=-1e9;const gap=Math.max(medH*4,120);
    for(const it of its){if(!cur||it.x0-reach>gap){cur={items:[],x0:it.x0,x1:it.x1,y0:it.y0,y1:it.y1};out.push(cur)}
      cur.items.push(it);cur.x1=Math.max(cur.x1,it.x1);cur.y0=Math.min(cur.y0,it.y0);cur.y1=Math.max(cur.y1,it.y1);reach=Math.max(reach,it.x1)}
  }
  return out.map(L=>({strokes:L.items.map(i=>i.s),box:[L.x0,L.y0,L.x1,L.y1],medH})).sort((a,b)=>a.box[1]-b.box[1]||a.box[0]-b.box[0]);
}

/* Imagem da linha: tinta preta, sem textura, altura de ~110 px para leitura */
function lineImage(line){
  const [x0,y0,x1,y1]=line.box,pad=Math.max(8,(y1-y0)*.25);
  const w=x1-x0+pad*2,h=y1-y0+pad*2;
  let k=clamp(110/h,.4,5);if(w*k>1800)k=1800/w;
  const cv=document.createElement('canvas');cv.width=Math.max(8,Math.round(w*k));cv.height=Math.max(8,Math.round(h*k));
  const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
  for(const s of line.strokes)Ink.draw(ctx,{...s,c:'#111111',o:1,f:100,_live:true},k,x0-pad,y0-pad);
  return new Promise(res=>cv.toBlob(b=>res(b),'image/png'));
}

const PROMPT=n=>`Você vai ler anotações escritas à mão por uma pessoa no Brasil, num caderno digital.
Cada uma das ${n} imagens anexadas é UMA linha da anotação, na ordem em que aparecem.
Transcreva exatamente o que está escrito em cada imagem, em português do Brasil.
Regras:
- mantenha acentos, cedilha, pontuação, maiúsculas, números e símbolos como foram escritos;
- separe as palavras com um espaço; não junte nem quebre palavras;
- não corrija gramática nem complete palavras incompletas;
- se a imagem for desenho, rabisco, seta, sublinhado ou não tiver texto legível, use null.
Responda somente com JSON neste formato, com exatamente ${n} itens:
{"linhas":["texto da imagem 1","texto da imagem 2",null]}`;

let sampleP=null;
function getSample(){if(!sampleP)sampleP=(window.claude&&window.claude.use)?window.claude.use('sample'):Promise.resolve(null);return sampleP}

/* Lê as linhas; devolve um texto (ou null) para cada linha, na mesma ordem.
   Erros saem como {code} para o app decidir o que dizer. */
async function recognize(lines,{precise}={}){
  const sample=await getSample();
  if(!sample)throw {code:'unavailable'};
  let max=8;try{const L=await sample.limits();if(!L.images)throw {code:'images_unavailable'};max=Math.max(1,L.images.maxCount||8)}catch(e){if(e&&e.code)throw e}
  const results=[];
  for(let i=0;i<lines.length;i+=max){
    const batch=lines.slice(i,i+max);
    const images=await Promise.all(batch.map(lineImage));
    const data=await sample.json(PROMPT(batch.length),{images,modelTier:precise?'default':'quick'});
    const arr=data&&Array.isArray(data.linhas)?data.linhas:Array.isArray(data)?data:[];
    for(let j=0;j<batch.length;j++){const t=arr[j];results.push(typeof t==='string'&&t.trim()?t.trim():null)}
  }
  return results;
}

window.HWR={clusterLines,lineImage,recognize};
})();
