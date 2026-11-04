(function(){
"use strict";
const $=s=>document.querySelector(s);
const HAS_CLAUDE=!!(window.claude&&window.claude.use);
const LW=1000, LH=1414;              // página lógica no formato A4
const LINE0=150, STEP=44, MARGIN=110; // pauta
const COVERS=[{id:'marinho',c:'#243b6b',n:'Marinho'},{id:'musgo',c:'#3e5a3b',n:'Musgo'},{id:'vinho',c:'#6e2835',n:'Vinho'},
  {id:'mostarda',c:'#b4862b',n:'Mostarda'},{id:'grafite',c:'#3a3e47',n:'Grafite'},{id:'petroleo',c:'#1e5963',n:'Petróleo'}];
const PAPERS=[{id:'pautado',n:'Pautado'},{id:'quadriculado',n:'Quadriculado'},{id:'pontilhado',n:'Pontilhado'},{id:'liso',n:'Liso'}];
const TONES=[{id:'branco',c:'#ffffff',n:'Branco'},{id:'marfim',c:'#fbf7ec',n:'Marfim'},{id:'amarelo',c:'#fdf2b6',n:'Amarelo'}];
const INK_COLORS=[['#1c1d24','Preto'],['#4a4f5c','Grafite'],['#1b2a5c','Azul-marinho'],['#2343a8','Azul'],['#1f6fd1','Azul-claro'],['#0f8a8a','Turquesa'],
  ['#2b7a4b','Verde'],['#7a9a1f','Oliva'],['#c4302b','Vermelho'],['#d9662b','Laranja'],['#8a5a2b','Marrom'],['#6a3ea1','Roxo'],['#c2407f','Magenta']];
const QUICK_IDX=[0,3,6,8,9,11];
const HL_COLORS=[['#ffd84a','Amarelo'],['#ffb347','Laranja'],['#8be39a','Verde'],['#8fd0ff','Azul'],['#ff9cc6','Rosa'],['#c9a7ff','Lilás']];
const KINDS=Ink.KINDS,KIND_ORDER=Ink.ORDER;
const QUICK_COLORS=QUICK_IDX.map(i=>INK_COLORS[i]);
const DEFAULT_PENS=[{id:'p1',k:'esfero',c:'#1c1d24',w:1.4,o:1},{id:'p2',k:'esfero',c:'#2343a8',w:1.4,o:1},{id:'p3',k:'tinteiro',c:'#1b2a5c',w:3.2,o:1},
  {id:'p4',k:'lapis',c:'#4a4f5c',w:1.8,o:.85},{id:'p5',k:'hl',c:'#ffd84a',w:24,o:.4}].map(p=>({...p,st:KINDS[p.k].st,f:KINDS[p.k].f}));
const MAX_PENS=8;
const ZOOMS=[0.75,1,1.5,2,3];
const MAX_DOC=240000; // limite do armazenamento remoto; IndexedDB permite páginas maiores

const ICON={
 zoom:'<circle cx="10" cy="10" r="6"/><path d="M14 14l7 7M7 10h6M10 7v6"/>',
 shapes:'<path d="M3 3h9v9H3z"/><circle cx="16" cy="16" r="5"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',
 pen:'<path d="M4 20l1.2-4.3L15.5 5.4a2 2 0 012.8 0l.3.3a2 2 0 010 2.8L8.3 18.8z"/><path d="M13.5 7.5l3 3"/>',
 fine:'<path d="M4 20l2-5L16 5l3 3L9 18z"/><path d="M4 20l2-1"/>',
 nib:'<path d="M12 3l5 8-5 10-5-10z"/><path d="M12 11v5"/><circle cx="12" cy="10" r="1.2"/>',
 brush:'<path d="M19 3l2 2-8.5 8.5-2-2z"/><path d="M10.5 11.5C7 11.5 6 14 6 16c0 1.6-1.2 2.6-3 3 4 1.5 9 .5 9.5-5.5"/>',
 pencil:'<path d="M4 20l1.2-4L15 6.2l2.8 2.8L8 18.8z"/><path d="M13.2 8l2.8 2.8"/><path d="M15 6.2l1.6-1.6a1.4 1.4 0 012 0l.8.8a1.4 1.4 0 010 2l-1.6 1.6"/>',
 hl:'<path d="M9 14l-4 4h5l2-2"/><path d="M9 14l7-9 4 3-6 9z"/><path d="M4 21h16"/>',
 eraser:'<path d="M8 20h12"/><path d="M5.5 15.5l9-9a2 2 0 012.8 0l2.2 2.2a2 2 0 010 2.8L12 19H8.5z"/><path d="M10 11l5 5"/>',
 undo:'<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 010 12"/>',
 redo:'<path d="M15 7l5 5-5 5"/><path d="M20 12H10a6 6 0 000 12"/>',
 finger:'<path d="M9 11V5a1.5 1.5 0 013 0v5"/><path d="M12 10V8.5a1.5 1.5 0 013 0V11"/><path d="M15 11a1.5 1.5 0 013 0v3a6 6 0 01-6 6h-1a6 6 0 01-5-2.7L4.5 14a1.5 1.5 0 012.5-1.6L9 15"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 lasso:'<path d="M8 16.5C4.6 15.6 3 13.5 3.5 11 4.2 7.2 8.6 4.5 13.4 4.7 18.2 5 21.2 7.8 20.6 11.2 20 14.6 15.6 17 11 16.8"/><path d="M9 15.5c-1.3.4-2 1.4-1.6 2.6.5 1.4 2.3 1.9 3.6 1.3"/>',
 close:'<path d="M6 6l12 12M18 6L6 18"/>',
 laser:'<path d="M4 20l6-6"/><path d="M10 14l2.5-2.5"/><circle cx="16" cy="8" r="3"/><path d="M16 2v1.5M16 12.5V14M22 8h-1.5M11.5 8H10M20.2 3.8l-1 1M12.8 11.2l-1 1M20.2 12.2l-1-1"/>',
 tape:'<path d="M4 9.5l12-6 4 8-12 6z"/><path d="M7 8l4 8M11 6l4 8"/>',
 paste:'<path d="M9 4h6v3H9z"/><path d="M8 5.5H6v15h12v-15h-2"/>',
 text:'<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
 spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M7.5 7.5l2 2M14.5 14.5l2 2M7.5 16.5l2-2M14.5 9.5l2-2"/>',
 minus:'<path d="M5 12h14"/>',
 more:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
 paper:'<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 pdf:'<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
 dots:'<circle cx="12" cy="6" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="18" r="1.3"/>'
};
const ico=(n,s=22)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const coverOf=id=>(COVERS.find(c=>c.id===id)||COVERS[0]);
const toneOf=id=>(TONES.find(t=>t.id===id)||TONES[0]);
const fmtDate=t=>{try{return new Date(t).toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}catch(e){return ''}};

/* ---------- Aviso ---------- */
let toastT;
function toast(msg,ms=2600){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,ms)}

/* ---------- Armazenamento ---------- */
const IDB={db:null,
  open(){return new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('sem IndexedDB'));
    const r=indexedDB.open('caderno-livre',1);
    r.onupgradeneeded=()=>{const d=r.result;for(const n of ['nbs','pgs','meta'])if(!d.objectStoreNames.contains(n))d.createObjectStore(n)};
    r.onsuccess=()=>{this.db=r.result;res()};r.onerror=()=>rej(r.error)})},
  tx(store,mode,fn){return new Promise((res,rej)=>{const t=this.db.transaction(store,mode),r=fn(t.objectStore(store));let out;
    if(r)r.onsuccess=()=>{out=r.result};t.oncomplete=()=>res(out);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})},
  get(s,k){return this.tx(s,'readonly',o=>o.get(k))},put(s,k,v){return this.tx(s,'readwrite',o=>o.put(v,k))},
  del(s,k){return this.tx(s,'readwrite',o=>o.delete(k))},all(s){return this.tx(s,'readonly',o=>o.getAll())}
};
const Store={mode:'memory',root:null,mem:{nbs:{},pgs:{},meta:null},
  async init(){
    try{
      if(window.claude&&window.claude.use){
        const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
        if(db&&user){const id=await user.id();if(id){this.root=db.doc('data/users/'+id+'/app');this.mode='db';return}}
      }
    }catch(e){}
    /* Fora do Claude: tudo fica no próprio aparelho, no IndexedDB (cabe muito
       mais que o localStorage). O que estava no localStorage é trazido junto. */
    try{await IDB.open();this.mode='idb';
      try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
      await this.migrateLocal();return}catch(e){}
    try{localStorage.setItem('cl:t','1');localStorage.removeItem('cl:t');this.mode='local'}catch(e){this.mode='memory'}
  },
  async migrateLocal(){
    let nbs;try{nbs=JSON.parse(localStorage.getItem('cl:nbs')||'null')}catch(e){nbs=null}
    if(!nbs||localStorage.getItem('cl:migrated'))return;
    for(const nb of Object.values(nbs)){
      for(const id of nb.pages||[]){const pg=this.lsGet('cl:pg:'+id,null);if(pg)await IDB.put('pgs',id,pg)}
      await IDB.put('nbs',nb.id,nb);
    }
    const meta=this.lsGet('cl:meta',null);if(meta)await IDB.put('meta','meta',meta);
    try{localStorage.setItem('cl:migrated','1')}catch(e){}
  },
  lsGet(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
  lsSet(k,v){localStorage.setItem(k,JSON.stringify(v))},
  async getMeta(){
    if(this.mode==='db'){const d=await this.root.get();return d.exists?d.data():null}
    if(this.mode==='idb')return (await IDB.get('meta','meta'))||null;
    if(this.mode==='local')return this.lsGet('cl:meta',null)||(this.lsGet('cl:seeded',false)?{seeded:true}:null);
    return this.mem.meta;
  },
  async writeMeta(body){
    if(this.mode==='idb')return IDB.put('meta','meta',body);
    if(this.mode==='db')return this.root.set(body);
    if(this.mode==='local')return this.lsSet('cl:meta',body);
    this.mem.meta=body;
  },
  async listNotebooks(){
    if(this.mode==='idb')return (await IDB.all('nbs')).map(x=>({...x,pages:[...(x.pages||[])]}));
    if(this.mode==='db'){const s=await this.root.collection('notebooks').get();return s.docs.map(d=>{const x=d.data();return {...x,id:d.id,pages:[...(x.pages||[])]}})}
    if(this.mode==='local'){const m=this.lsGet('cl:nbs',{});return Object.values(m).map(x=>({...x,pages:[...x.pages]}))}
    return Object.values(this.mem.nbs).map(x=>({...x,pages:[...x.pages]}));
  },
  async getPage(id){
    if(this.mode==='idb')return (await IDB.get('pgs',id))||null;
    if(this.mode==='db'){const d=await this.root.collection('pages').doc(id).get();return d.exists?d.data():null}
    if(this.mode==='local')return this.lsGet('cl:pg:'+id,null);
    return this.mem.pgs[id]||null;
  },
  async writeNotebook(nb){
    const body={title:nb.title,cover:nb.cover,paper:nb.paper,tone:nb.tone,pages:[...nb.pages],folder:nb.folder||'',favorite:!!nb.favorite,created:nb.created,updated:nb.updated};
    if(this.mode==='db')return this.root.collection('notebooks').doc(nb.id).set(body);
    if(this.mode==='idb')return IDB.put('nbs',nb.id,{...body,id:nb.id});
    if(this.mode==='local'){const m=this.lsGet('cl:nbs',{});m[nb.id]={...body,id:nb.id};return this.lsSet('cl:nbs',m)}
    this.mem.nbs[nb.id]={...body,id:nb.id};
  },
  async writePage(id,body){
    if(this.mode==='idb')return IDB.put('pgs',id,body);
    if(this.mode==='db')return this.root.collection('pages').doc(id).set(body);
    if(this.mode==='local')return this.lsSet('cl:pg:'+id,body);
    this.mem.pgs[id]=body;
  },
  async deletePage(id){
    if(this.mode==='idb')return IDB.del('pgs',id);
    if(this.mode==='db')return this.root.collection('pages').doc(id).delete();
    if(this.mode==='local'){try{localStorage.removeItem('cl:pg:'+id)}catch(e){}return}
    delete this.mem.pgs[id];
  },
  async deleteNotebook(nb){
    for(const p of nb.pages){await this.deletePage(p).catch(()=>{})}
    if(this.mode==='db')return this.root.collection('notebooks').doc(nb.id).delete();
    if(this.mode==='idb')return IDB.del('nbs',nb.id);
    if(this.mode==='local'){const m=this.lsGet('cl:nbs',{});delete m[nb.id];return this.lsSet('cl:nbs',m)}
    delete this.mem.nbs[nb.id];
  }
};

/* Fila: uma gravação por vez em cada documento, sempre a versão mais recente */
const queues={},oversizePages=new Set();let failing=false;
function updateSaveFailure(){failing=oversizePages.size>0||Object.values(queues).some(q=>q.failed)}
async function drainSaves(){flushAll();for(const q of Object.values(queues))if(q.failed&&!q.busy&&q.retry){q.next=q.retry;pump(q)}while(busyQueues())await new Promise(r=>setTimeout(r,20));if(failing)throw new Error('save_failed')}
function enqueue(key,fn){const q=queues[key]||(queues[key]={busy:false,next:null});q.next=fn;if(!q.busy)pump(q);setStatus()}
async function pump(q){
  q.busy=true;
  while(q.next){const fn=q.next;q.next=null;
    try{await fn();q.failed=false;q.retry=null;updateSaveFailure()}
    catch(e){
      if(e&&e.code==='unavailable'){await new Promise(r=>setTimeout(r,800+Math.random()*800));try{await fn();q.failed=false;q.retry=null;updateSaveFailure();continue}catch(e2){e=e2}}
      q.failed=true;q.retry=fn;updateSaveFailure();reportSaveError(e);
    }
  }
  q.busy=false;setStatus();
}
const pageTimers={};
function busyQueues(){return Object.values(queues).some(q=>q.busy||q.next)||Object.keys(pageTimers).length>0}
function setStatus(){const el=$('#status');if(!el)return;
  if(failing){el.textContent='Não salvo';el.className='status err';return}
  el.textContent=busyQueues()?'Salvando…':'Salvo';el.className='status'}
function reportSaveError(e){
  const c=e&&e.code;
  if(c==='quota_exceeded')toast('O espaço para cadernos acabou. Apague páginas ou cadernos que não usa mais.',5000);
  else if(c==='invalid_argument')toast('Esta página ficou cheia demais para salvar. Continue em uma página nova.',5000);
  else if(e&&e.name==='QuotaExceededError')toast('O navegador ficou sem espaço. Apague páginas ou cadernos antigos.',5000);
  else toast('Não consegui salvar agora. Vou tentar de novo na próxima mudança.',4000);
}
function pageBody(pg){return {nb:pg.nb||(S.nb&&S.nb.id),strokes:pg.strokes.slice(),texts:(pg.texts||[]).slice(),tapes:(pg.tapes||[]).slice(),background:pg.background||null}}
function saveNotebook(nb){nb.updated=Date.now();const snap={...nb,pages:[...nb.pages]};enqueue('nb:'+nb.id,()=>Store.writeNotebook(snap))}
function schedulePageSave(pg,delay=700){
  clearTimeout(pageTimers[pg.id]);
  pageTimers[pg.id]=setTimeout(()=>{delete pageTimers[pg.id];flushPage(pg)},delay);setStatus();
}
function flushPage(pg){
  const body=pageBody(pg);
  if(JSON.stringify(body).length>(Store.mode==='db'?MAX_DOC:32*1024*1024)){oversizePages.add(pg.id);updateSaveFailure();setStatus();reportSaveError({code:'invalid_argument'});return}
  oversizePages.delete(pg.id);updateSaveFailure();
  enqueue('pg:'+pg.id,()=>Store.writePage(pg.id,body));
  if(S.nb)saveNotebook(S.nb);
}
let prefT=null;
function metaBody(){return {v:5,shapes:!!S.shapes,tape:{...S.tape},gest:{...S.gest},seeded:true,pens:S.pens.map(p=>({...p})),active:S.active,eraser:{...S.eraser},hwr:{...S.hwr}}}
function savePrefs(now){clearTimeout(prefT);const go=()=>{prefT=null;const b=metaBody();enqueue('meta',()=>Store.writeMeta(b))};if(now)go();else prefT=setTimeout(go,700)}
function flushAll(){
  for(const id of Object.keys(pageTimers)){clearTimeout(pageTimers[id]);delete pageTimers[id];const pg=S.pages.find(p=>p.id===id);if(pg)flushPage(pg)}
  if(prefT)savePrefs(true);
}
addEventListener('pagehide',flushAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushAll()});

/* ---------- Desenho ---------- */
function drawPaper(ctx,k,paper,tone){
  ctx.fillStyle=toneOf(tone).c;ctx.fillRect(0,0,LW*k,LH*k);
  ctx.lineWidth=Math.max(1,1.1*k);
  if(paper==='pautado'){
    ctx.strokeStyle='#b7c8e3';ctx.beginPath();
    for(let y=LINE0;y<LH-50;y+=STEP){ctx.moveTo(0,y*k);ctx.lineTo(LW*k,y*k)}ctx.stroke();
    ctx.strokeStyle='#e4a1a1';ctx.beginPath();ctx.moveTo(MARGIN*k,0);ctx.lineTo(MARGIN*k,LH*k);ctx.stroke();
  }else if(paper==='quadriculado'){
    ctx.strokeStyle='#d2dae8';ctx.beginPath();
    for(let x=40;x<LW;x+=40){ctx.moveTo(x*k,0);ctx.lineTo(x*k,LH*k)}
    for(let y=40;y<LH;y+=40){ctx.moveTo(0,y*k);ctx.lineTo(LW*k,y*k)}ctx.stroke();
  }else if(paper==='pontilhado'){
    ctx.fillStyle='#a9b3c4';const r=Math.max(1,1.7*k);
    for(let y=40;y<LH;y+=40)for(let x=40;x<LW;x+=40){ctx.beginPath();ctx.arc(x*k,y*k,r,0,6.2832);ctx.fill()}
  }
}
function renderInto(ctx,k,strokes,paper,tone,texts,tapes,background){drawPaper(ctx,k,paper,tone);drawBackground(ctx,k,background);for(const s of strokes)Ink.draw(ctx,s,k);if(texts)drawTexts(ctx,k,texts);if(tapes)for(const t of tapes)Ink.drawTape(ctx,t,k,false)}
function drawTexts(ctx,k,texts,ox=0,oy=0){
  for(const t of texts){
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=t.c;ctx.textBaseline='alphabetic';
    ctx.font=(t.fs*k)+'px '+fontOf(t.font).css;const L=lineH(t),maxW=t.w*k,lh=L*k;let y=(t.y-oy+(L-t.fs)/2+t.fs*.92)*k;const tx=(t.x-ox)*k;
    for(const para of String(t.text).split('\n')){
      let line='';for(const word of para.split(/(\s+)/)){const test=line+word;if(ctx.measureText(test).width>maxW&&line.trim()){ctx.fillText(line.trimEnd(),tx,y);y+=lh;line=word.trimStart()}else line=test}
      ctx.fillText(line.trimEnd(),tx,y);y+=lh;
    }
    ctx.restore();
  }
}

/* ---------- Caderno de exemplo ---------- */
function scribble(x,base,len,color,w,seed,tall=1){
  const pts=[];const n=Math.max(6,Math.round(len/2.4));
  for(let i=0;i<n;i++){const t=i*0.52;
    const h=(9+5*Math.sin(seed+i*0.21))*tall*((i*7+Math.round(seed*10))%23<3?1.8:1);
    pts.push(Math.round((x+t*4.6-5.5*Math.sin(t))*10)/10,Math.round((base-6-h*0.5+h*0.5*Math.cos(t))*10)/10)}
  return {t:'pen',k:'esfero',c:color,w,o:1,s:2,p:pts};
}
function line(x1,y1,x2,y2,color,w,kind='esfero'){const pts=[];const n=24;for(let i=0;i<=n;i++){const f=i/n;pts.push(Math.round((x1+(x2-x1)*f)*10)/10,Math.round((y1+(y2-y1)*f+Math.sin(f*7)*1.2)*10)/10)}
  return {t:kind==='hl'?'hl':'pen',k:kind,c:color,w,o:KINDS[kind].o,s:2,p:pts}}
function sampleStrokes(){
  const S=[];let seed=1.3;const ink='#1c1d24',blue='#2343a8';
  const lineWords=(row,words,color=ink,w=2.4,tall=1,x0=MARGIN+24)=>{let x=x0;const y=LINE0+STEP*row-6;for(const L of words){S.push(scribble(x,y,L,color,w,seed+=.9,tall));x+=L+26}};
  lineWords(1,[90,150,110],blue,3.4,1.5);
  lineWords(3,[70,120,60,140,90]);
  lineWords(4,[110,80,160,70]);
  S.push(line(MARGIN+18,LINE0+STEP*4-18,MARGIN+400,LINE0+STEP*4-16,'#ffd84a',24,'hl'));
  lineWords(5,[60,130,100,90,120]);
  lineWords(6,[140,70,110]);
  S.push(line(MARGIN+24,LINE0+STEP*6+2,MARGIN+260,LINE0+STEP*6+3,'#c4302b',2.6));
  for(let r=8;r<=10;r++){const y=LINE0+STEP*r-6,x=MARGIN+28;
    S.push({t:'pen',k:'fina',c:ink,w:2,o:1,s:2,p:[x,y-24,x+22,y-24,x+22,y-2,x,y-2,x,y-24]});
    if(r<10)S.push({t:'pen',k:'esfero',c:'#2b7a4b',w:3.2,o:1,s:2,p:[x+3,y-14,x+10,y-5,x+28,y-34]});
    let xx=x+44;for(const L of [80+r*9,120,70-r*2]){S.push(scribble(xx,y,L,ink,2.4,seed+=.9));xx+=L+26}}
  const cx=MARGIN+560,cy=LINE0+STEP*9-14;const e=[];for(let i=0;i<=40;i++){const a=-0.4+i/40*6.6;e.push(Math.round((cx+150*Math.cos(a))*10)/10,Math.round((cy+52*Math.sin(a))*10)/10)}
  S.push({t:'pen',k:'esfero',c:blue,w:2.6,o:1,s:2,p:e});
  S.push(scribble(cx-90,cy+14,180,blue,2.6,seed+=.9,1.2));
  return S;
}
async function seedIfNeeded(list,meta){
  if(list.length||meta)return list;
  const nb={id:uid(),title:'Caderno de exemplo',cover:'marinho',paper:'pautado',tone:'branco',pages:[uid(),uid()],created:Date.now(),updated:Date.now()};
  await Store.writePage(nb.pages[0],{nb:nb.id,strokes:sampleStrokes()});
  await Store.writePage(nb.pages[1],{nb:nb.id,strokes:[]});
  await Store.writeNotebook(nb);await Store.writeMeta(metaBody());
  return [nb];
}

/* ---------- Biblioteca ---------- */
let NBS=[];
const libraryFilter={query:'',folder:'',favorites:false};
const searchContent=new Map();let searchToken=0;
async function loadLibrary(){
  const shelf=$('#shelf');shelf.innerHTML='<div class="lib-state">Abrindo seus cadernos…</div>';
  const slow=setTimeout(()=>{shelf.innerHTML='<div class="lib-state">Seus cadernos estão demorando para abrir. Confira a internet e espere mais um pouco.</div>'},10000);
  try{const meta=await Store.getMeta();applyMeta(meta);NBS=await seedIfNeeded(await Store.listNotebooks(),meta)}
  catch(e){clearTimeout(slow);shelf.innerHTML='<div class="lib-state">Não consegui abrir seus cadernos. Recarregue a página para tentar de novo.</div>';return}
  clearTimeout(slow);renderLibrary();
}
function renderLibrary(){
  const w=$('#where');w.hidden=false;
  w.className='where'+(Store.mode==='db'?'':' local');
  w.querySelector('span').textContent=Store.mode==='db'?'Salvo na sua conta, em qualquer aparelho':Store.mode==='idb'?'Salvo neste aparelho · faça backup de vez em quando':Store.mode==='local'?'Salvo só neste navegador':'Não está salvando: os cadernos somem ao fechar';
  const shelf=$('#shelf');
  renderLibraryFilters();
  const q=libraryFilter.query.toLocaleLowerCase('pt-BR');
  const list=NBS.filter(n=>(!libraryFilter.folder||n.folder===libraryFilter.folder)&&(!libraryFilter.favorites||n.favorite)&&(!q||(n.title+' '+(n.folder||'')+' '+(searchContent.get(n.id)||'')).toLocaleLowerCase('pt-BR').includes(q))).sort((a,b)=>(b.updated||0)-(a.updated||0));
  shelf.innerHTML=`<div class="book"><button class="new-book" id="newbook"><span class="plus">${ico('plus',22)}</span>Novo caderno</button></div>`+
    list.map(nb=>`<div class="book">
      <button class="cover" style="--c:${coverOf(nb.cover).c}" data-open="${esc(nb.id)}" aria-label="Abrir ${esc(nb.title)}">
        <span class="label">${esc(nb.title)}<small>${esc((PAPERS.find(p=>p.id===nb.paper)||PAPERS[0]).n)}</small></span></button>
      <div class="book-meta"><div><b>${nb.favorite?'★ ':''}${esc(nb.title)}</b>${nb.folder?`<small class="folder-label">${esc(nb.folder)}</small>`:''}<span>${nb.pages.length} ${nb.pages.length===1?'página':'páginas'} · ${fmtDate(nb.updated)}</span></div>
      <button class="icon-btn" data-opts="${esc(nb.id)}" aria-label="Opções de ${esc(nb.title)}">${ico('dots',20)}</button></div></div>`).join('');
  $('#newbook').onclick=()=>notebookDialog(null);
  shelf.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openNotebook(NBS.find(n=>n.id===b.dataset.open)));
  shelf.querySelectorAll('[data-opts]').forEach(b=>b.onclick=()=>notebookDialog(NBS.find(n=>n.id===b.dataset.opts)));
}

/* ---------- Diálogos ---------- */
function modal(html,onClose){
  const sc=document.createElement('div');sc.className='scrim';sc.innerHTML=`<div class="dialog" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(sc);
  const previousFocus=document.activeElement;
  const close=()=>{if(!sc.isConnected)return;sc.remove();if(previousFocus&&previousFocus.isConnected)previousFocus.focus();document.removeEventListener('keydown',onKey);onClose&&onClose()};
  const onKey=e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const all=[...sc.querySelectorAll('button:not([disabled]),input,select,textarea,[tabindex="0"]')];if(!all.length)return;const first=all[0],last=all[all.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};document.addEventListener('keydown',onKey);
  sc.addEventListener('pointerdown',e=>{if(e.target===sc)close()});
  queueMicrotask(()=>{if(!sc.contains(document.activeElement))sc.querySelector('input,button,select')?.focus()});
  return {el:sc,close};
}
function confirmDialog(title,text,okLabel,onOk){
  const m=modal(`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="actions"><button class="btn" data-x>Cancelar</button><button class="btn danger" data-ok>${esc(okLabel)}</button></div>`);
  m.el.querySelector('[data-x]').onclick=m.close;
  m.el.querySelector('[data-ok]').onclick=()=>{m.close();onOk()};
  m.el.querySelector('[data-ok]').focus();
}
function paperPreview(cv,paper,tone){const ctx=cv.getContext('2d');const k=cv.width/LW;renderInto(ctx,k,[],paper,tone)}
function pickerHTML(cur){
  return `<div class="field"><span>Papel</span><div class="opts" id="p-paper">${PAPERS.map(p=>`<button class="popt" data-v="${p.id}" aria-pressed="${p.id===cur.paper}"><canvas width="132" height="168"></canvas>${p.n}</button>`).join('')}</div></div>
  <div class="field"><span>Cor do papel</span><div class="opts" id="p-tone">${TONES.map(t=>`<button class="copt" style="--c:${t.c}" data-v="${t.id}" aria-pressed="${t.id===cur.tone}" aria-label="${t.n}" title="${t.n}"></button>`).join('')}</div></div>`;
}
function wirePicker(root,cur){
  const draw=()=>root.querySelectorAll('#p-paper .popt').forEach(b=>paperPreview(b.querySelector('canvas'),b.dataset.v,cur.tone));
  root.querySelectorAll('#p-paper .popt').forEach(b=>b.onclick=()=>{cur.paper=b.dataset.v;root.querySelectorAll('#p-paper .popt').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  root.querySelectorAll('#p-tone .copt').forEach(b=>b.onclick=()=>{cur.tone=b.dataset.v;root.querySelectorAll('#p-tone .copt').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()});
  draw();
}
function notebookDialog(nb){
  const isNew=!nb;const cur=nb?{title:nb.title,cover:nb.cover,paper:nb.paper,tone:nb.tone}:{title:'',cover:COVERS[(NBS.length+1)%COVERS.length].id,paper:'pautado',tone:'branco'};
  const m=modal(`<h2>${isNew?'Novo caderno':'Opções do caderno'}</h2>
    <label class="field"><span>Nome</span><input type="text" id="nb-title" maxlength="80" placeholder="Ex.: Audiências de novembro" value="${esc(cur.title)}"></label>
    <div class="field"><span>Capa</span><div class="opts" id="p-cover">${COVERS.map(c=>`<button class="copt" style="--c:${c.c}" data-v="${c.id}" aria-pressed="${c.id===cur.cover}" aria-label="${c.n}" title="${c.n}"></button>`).join('')}</div></div>
    ${pickerHTML(cur)}
    <label class="field"><span>Pasta</span><input id="nb-folder" type="text" maxlength="60" placeholder="Ex.: Estudos" value="${esc(nb&&nb.folder||'')}"></label>
    <label class="favorite-field"><input id="nb-favorite" type="checkbox" ${nb&&nb.favorite?'checked':''}> Favorito</label>
    <div class="actions">${isNew?'':'<button class="btn left" data-del>Excluir caderno</button>'}<button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>${isNew?'Criar caderno':'Salvar'}</button></div>`);
  const r=m.el;
  r.querySelectorAll('#p-cover .copt').forEach(b=>b.onclick=()=>{cur.cover=b.dataset.v;r.querySelectorAll('#p-cover .copt').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  wirePicker(r,cur);
  r.querySelector('[data-x]').onclick=m.close;
  if(!isNew)r.querySelector('[data-del]').onclick=()=>{m.close();confirmDialog('Excluir este caderno?',`"${nb.title}" e todas as ${nb.pages.length} páginas serão apagados para sempre.`,'Excluir',async()=>{
    NBS=NBS.filter(n=>n!==nb);renderLibrary();
    try{await Store.deleteNotebook(nb);toast('Caderno excluído.')}catch(e){reportSaveError(e)}})};
  const title=r.querySelector('#nb-title');if(isNew)setTimeout(()=>title.focus(),30);
  r.querySelector('[data-ok]').onclick=async()=>{
    const t=title.value.trim()||'Sem título',folder=r.querySelector('#nb-folder').value.trim(),favorite=r.querySelector('#nb-favorite').checked;m.close();
    if(isNew){
      const n={id:uid(),title:t,cover:cur.cover,paper:cur.paper,tone:cur.tone,folder,favorite,pages:[uid()],created:Date.now(),updated:Date.now()};
      NBS.push(n);enqueue('pg:'+n.pages[0],()=>Store.writePage(n.pages[0],{nb:n.id,strokes:[]}));saveNotebook(n);openNotebook(n,true);
    }else{Object.assign(nb,{title:t,cover:cur.cover,paper:cur.paper,tone:cur.tone,folder,favorite});saveNotebook(nb);renderLibrary()}
  };
}

/* ---------- Estado do editor e preferências ---------- */
const S={shapes:true,kbd:false,nb:null,pages:[],pens:DEFAULT_PENS.map(p=>({...p})),active:'p1',eraser:{mode:'inteiro',size:14},zoom:1,finger:true,penDevice:false,realPressure:false,undo:[],redo:[],cur:0};
try{const d=JSON.parse(localStorage.getItem('cl:dev')||'{}');if(typeof d.finger==='boolean')S.finger=d.finger;S.penDevice=!!d.penDevice;S.realPressure=d.pv===2&&!!d.realPressure;S.kbd=!!d.kbd}catch(e){}
function saveDevice(){try{localStorage.setItem('cl:dev',JSON.stringify({pv:2,kbd:S.kbd,finger:S.finger,penDevice:S.penDevice,realPressure:S.realPressure}))}catch(e){}}
function cleanPen(p){if(!p||!KINDS[p.k])return null;const K=KINDS[p.k];
  return {ls:['dot','dash'].includes(p.ls)?p.ls:'solid',id:String(p.id||uid()),k:p.k,c:/^#[0-9a-f]{6}$/i.test(p.c)?p.c:'#1c1d24',w:clamp(+p.w||K.def,K.min,K.max),o:clamp(+p.o||K.o,.1,1),
    st:clamp(p.st!=null?+p.st:K.st,0,100),f:clamp(p.f!=null?+p.f:K.f,10,100)}}
function applyMeta(meta){
  if(!meta)return;S.shapes=meta.shapes!==false;
  if(Array.isArray(meta.pens)){const pens=meta.pens.map(cleanPen).filter(Boolean).slice(0,MAX_PENS);if(pens.length)S.pens=pens}
  if(meta.eraser){S.eraser={mode:meta.eraser.mode==='parcial'?'parcial':'inteiro',size:clamp(+meta.eraser.size||14,4,60)}}
  if(!meta.v)S.pens.forEach(p=>{if(p.k==='esfero'&&p.f===92)p.f=100});
  if(!meta.v||meta.v<3){const old={esfero:2.6,fina:1.6,tinteiro:4.5,lapis:2.4};S.pens.forEach(p=>{if(old[p.k]===p.w)p.w=KINDS[p.k].def});
    if(meta.hwr&&meta.hwr.font==='patrick')meta.hwr.font='caderno'}
  if(!meta.v||meta.v<4){S.pens.forEach(p=>{if(p.k==='esfero'&&p.st===35)p.st=55;if(p.k==='fina'&&p.st===30)p.st=50})}
  if(meta.tape){const t=meta.tape;S.tape={mode:['traco','reta','ret'].includes(t.mode)?t.mode:'traco',w:clamp(+t.w||30,10,80),pat:['lisa','listras','bolinhas'].includes(t.pat)?t.pat:'listras',c:/^#[0-9a-f]{6}$/i.test(t.c)?t.c:'#a7d8f5'}}
  if(meta.gest)S.gest={scratch:meta.gest.scratch!==false,loop:meta.gest.loop!==false};
  if(meta.hwr){const h=meta.hwr;S.hwr={auto:!!h.auto,wait:clamp(+h.wait||2,1,6),font:FONTS.some(f=>f.id===h.font)?h.font:'caderno',precise:!!h.precise}}
  if(meta.active&&(['eraser','text','lasso','tape','laser'].includes(meta.active)||S.pens.some(p=>p.id===meta.active)))S.active=meta.active;
  if(!['eraser','text','lasso','tape','laser'].includes(S.active)&&!S.pens.some(p=>p.id===S.active))S.active=S.pens[0].id;
}
const activePen=()=>S.active==='eraser'?null:(S.pens.find(p=>p.id===S.active)||(['text','lasso','tape','laser'].includes(S.active)?null:S.pens[0]));

/* ---------- Editor ---------- */
const sc=$('#scroller');
async function openNotebook(nb,fresh){
  if(!nb)return;
  if(S.nb&&!(await closeNotebook()))return;
  S.loading=!fresh;S.nb=nb;S.undo=[];S.redo=[];S.pages=nb.pages.map(id=>({id,nb:nb.id,strokes:[],texts:[],tapes:[],dirty:true,el:null}));revealed.clear();
  $('#library').hidden=true;$('#editor').hidden=false;$('#title').value=nb.title;
  buildPages();buildTray();layout();setStatus();
  sc.scrollTop=0;
  if(!fresh){
    toast('Abrindo páginas…',10000);
    try{
      const datas=await Promise.all(nb.pages.map(id=>Store.getPage(id)));
      if(S.nb!==nb)return;
      datas.forEach((d,i)=>{const pg=S.pages[i];if(pg&&d&&Array.isArray(d.strokes)){pg.strokes=d.strokes.slice();pg.texts=Array.isArray(d.texts)?d.texts.slice():[];pg.tapes=Array.isArray(d.tapes)?d.tapes.slice():[];pg.background=d.background||null;pg.dirty=true;renderTexts(pg);renderTapes(pg)}});
       if(S.nb!==nb)return;S.loading=false;$('#toast').hidden=true;renderVisible();
    }catch(e){S.loading=false;S.nb=null;S.pages=[];$('#editor').hidden=true;$('#library').hidden=false;renderLibrary();toast('Não consegui abrir as páginas. Tente abrir o caderno novamente.',5000)}
  }
}
async function closeNotebook(){if(S.loading){toast('Espere as páginas terminarem de abrir.');return false}if(editing)finishEdit();if(act)cancelStroke();closeFocus();clearSel();try{await drainSaves()}catch(e){toast('Não foi possível salvar. O caderno continuará aberto.',5000);return false}S.nb=null;S.pages=[];$('#editor').hidden=true;$('#library').hidden=false;renderLibrary();return true}

function buildPages(){
  const wrap=$('#pages');wrap.innerHTML='';
  S.pages.forEach(pg=>wrap.appendChild(makePageEl(pg)));
  const add=document.createElement('button');add.className='add-page';add.innerHTML=ico('plus',20)+'Adicionar página';add.onclick=()=>addPage(S.pages.length-1);
  wrap.appendChild(add);numberPages();
}
function makePageEl(pg){
  const d=document.createElement('div');d.className='page';
  d.innerHTML='<canvas></canvas><svg class="ink-vector" viewBox="0 0 1000 1414" preserveAspectRatio="none" aria-hidden="true"></svg><div class="tlayer"></div><svg class="tapes" viewBox="0 0 1000 1414" preserveAspectRatio="none" aria-hidden="true"></svg><span class="pnum"></span>';
  pg.el=d;pg.base=d.children[0];pg.base.width=pg.base.height=1;d._pg=pg;return d;
}
function numberPages(){S.pages.forEach((pg,i)=>pg.el.querySelector('.pnum').textContent=(i+1)+' / '+S.pages.length)}

/* Uma única camada para o traço em andamento, colocada sobre a página ativa */
const liveCv=document.createElement('canvas');
const liveSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');liveSvg.classList.add('ink-vector','ink-live');liveSvg.setAttribute('viewBox','0 0 1000 1414');liveSvg.setAttribute('preserveAspectRatio','none');liveSvg.setAttribute('aria-hidden','true');
function attachLive(pg){
  if(liveCv.parentNode!==pg.el){pg.el.insertBefore(liveCv,pg.el.querySelector('.tlayer'));pg.el.insertBefore(liveSvg,pg.el.querySelector('.tlayer'))}
  if(liveCv.width!==pg.px){liveCv.width=pg.px;liveCv.height=Math.round(pg.px*LH/LW)}
}
function liveClear(){liveSvg.replaceChildren();const c=liveCv.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,liveCv.width,liveCv.height)}

/* Resolução: segue o devicePixelRatio da tela, com limite de área para não
   estourar a memória do Safari no iPad. Só as páginas perto da tela têm imagem. */
let pageCssW=600;
/* Desenha com 50% mais resolução em cada eixo e deixa o navegador reduzir
   para o tamanho da tela: mais amostras suavizam diagonais e curvas finas.
   pxFor mantém o limite de memória, inclusive em telas Retina e com zoom. */
function renderScale(){
  const vv=window.visualViewport,z=vv&&vv.scale>1?vv.scale:1;
  return clamp(Math.max(2,window.devicePixelRatio||1)*z*1.5,3,6);
}
function pxFor(css){
  const dpr=renderScale();let w=Math.round(css*dpr);
  const maxArea=12e6;if(w*w*LH/LW>maxArea)w=Math.floor(Math.sqrt(maxArea*LW/LH));
  return Math.max(2,Math.min(w,4096));
}
function layout(){
  const fit=Math.min(sc.clientWidth-(window.innerWidth>=700?120:32),820);
  pageCssW=Math.max(200,fit*S.zoom);const h=pageCssW*LH/LW;const px=pxFor(pageCssW);
  for(const pg of S.pages){pg.el.style.width=pageCssW+'px';pg.el.style.height=h+'px';pg.px=px;pg.dirty=true;pg.el.querySelector('.tlayer').style.transform='scale('+(pageCssW/LW)+')'}
  $('#zval').textContent=Math.round(S.zoom*100)+'%';
  $('#zout').disabled=S.zoom<=ZMIN+.001;$('#zin').disabled=S.zoom>=ZMAX-.001;
  renderVisible();
}
function ensureCanvas(pg){if(pg.base.width!==pg.px){pg.base.width=pg.px;pg.base.height=Math.round(pg.px*LH/LW);pg.dirty=true}}
function releaseCanvas(pg){if(pg.base.width>1){pg.base.width=1;pg.base.height=1;pg.el.querySelector('.ink-vector').replaceChildren();pg.dirty=true}}
function renderPage(pg){ensureCanvas(pg);const ctx=pg.base.getContext('2d');const k=pg.base.width/LW;ctx.setTransform(1,0,0,1,0,0);renderInto(ctx,k,[],S.nb.paper,S.nb.tone,null,null,pg.background);renderInkSvg(pg);pg.dirty=false;if(pg.background&&!backgrounds.has(pg.background.src))loadBackground(pg.background).then(()=>{if(S.pages.includes(pg)&&pg.base.width>1)scheduleRender(pg)}).catch(()=>toast('Não consegui carregar o fundo desta página.'))}
let rpQ=new Set(),rpF=0;
function scheduleRender(pg){rpQ.add(pg);if(!rpF)rpF=requestAnimationFrame(()=>{rpF=0;for(const p of rpQ)renderPage(p);rpQ.clear()})}
function renderVisible(){
  const vh=sc.clientHeight,top=sc.scrollTop,near0=top-vh*.6,near1=top+vh*1.6,far0=top-vh*2,far1=top+vh*3;
  let best=0,bestD=1e9;const mid=top+vh*0.35;
  S.pages.forEach((pg,i)=>{const t=pg.el.offsetTop,b=t+pg.el.offsetHeight;
    if(b>near0&&t<near1){if(pg.dirty||pg.base.width!==pg.px)renderPage(pg)}
    else if(b<far0||t>far1){if(!act||act.pg!==pg)releaseCanvas(pg)}
    const dd=mid<t?t-mid:mid>b?mid-b:0;if(dd<bestD){bestD=dd;best=i}});
  S.cur=best;$('#pchip').textContent='Página '+(best+1)+' de '+S.pages.length;
}
let rq=0;sc.addEventListener('scroll',()=>{if(!rq)rq=requestAnimationFrame(()=>{rq=0;renderVisible()})},{passive:true});
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(S.nb)layout()},150)});
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(S.nb)layout()},200)});

/* Zoom: o desenho é vetorial, então cada nível é redesenhado nítido */
const ZMIN=.75,ZMAX=3;
function setZoom(z,ax,ay){
  z=clamp(z,ZMIN,ZMAX);if(Math.abs(z-S.zoom)<.001)return;
  const r=sc.getBoundingClientRect();if(ax==null){ax=r.left+sc.clientWidth/2;ay=r.top+sc.clientHeight/2}
  const cx=sc.scrollLeft+(ax-r.left),cy=sc.scrollTop+(ay-r.top),ratio=z/S.zoom;
  S.zoom=z;layout();sc.scrollLeft=cx*ratio-(ax-r.left);sc.scrollTop=cy*ratio-(ay-r.top);renderVisible();
}
function stepZoom(dir){const n=dir>0?ZOOMS.find(v=>v>S.zoom+.01):[...ZOOMS].reverse().find(v=>v<S.zoom-.01);if(n!=null)setZoom(n)}
sc.addEventListener('wheel',e=>{if(!e.ctrlKey||!S.nb)return;e.preventDefault();setZoom(S.zoom*Math.exp(-e.deltaY*.01),e.clientX,e.clientY)},{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());

/* ---------- Estojo de canetas ---------- */
let hinted=false;
function penLabel(p){return KINDS[p.k].n+' · '+((INK_COLORS.concat(HL_COLORS).find(c=>c[0].toLowerCase()===p.c.toLowerCase())||[0,'cor própria'])[1]).toLowerCase()}
function buildTray(){
  const t=$('#tray');
  let h=S.pens.map(p=>{const on=S.active===p.id;const bar=clamp(p.w*(p.k==='hl'?.12:.7),2,7);
    return `<button class="tool penbtn" data-pen="${esc(p.id)}" aria-pressed="${on}" aria-label="${esc(penLabel(p))}${on?'. Toque de novo para ajustar':''}" title="${esc(penLabel(p))}${on?' — toque de novo para ajustar':''}" style="--pc:${p.c};--po:${p.o}">${ico(KINDS[p.k].icon)}<span class="pbar" style="height:${bar}px"></span></button>`}).join('');
  if(S.pens.length<MAX_PENS)h+=`<button class="tool" id="addpen" aria-label="Nova caneta" title="Nova caneta">${ico('plus',20)}</button>`;
  h+=`<span class="sep"></span><button class="tool" data-tapetool aria-pressed="${S.active==='tape'}" aria-label="Fita${S.active==='tape'?'. Toque de novo para ajustar':''}" title="Fita${S.active==='tape'?' — toque de novo para ajustar':''}">${ico('tape')}</button><button class="tool" data-laser aria-pressed="${S.active==='laser'}" aria-label="Caneta laser" title="Caneta laser: o traço some sozinho">${ico('laser')}</button><button class="tool" data-lasso aria-pressed="${S.active==='lasso'}" aria-label="Laço" title="Laço: contorne para selecionar">${ico('lasso')}</button><button class="tool" data-texttool aria-pressed="${S.active==='text'}" aria-label="Texto" title="Texto: toque na folha para escrever com o Rabiscar ou digitar">${ico('text')}</button><button class="tool" data-eraser aria-pressed="${S.active==='eraser'}" aria-label="Borracha${S.active==='eraser'?'. Toque de novo para ajustar':''}" title="Borracha (E)${S.active==='eraser'?' — toque de novo para ajustar':''}">${ico('eraser')}</button>
      <span class="sep"></span>
      <button class="tool" id="undo" aria-label="Desfazer" title="Desfazer (Ctrl+Z)">${ico('undo')}</button><button class="tool" id="redo" aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)">${ico('redo')}</button><span class="sep"></span>
      <button class="tool" id="finger" aria-pressed="${S.finger}" aria-label="Escrever com o dedo" title="${S.finger?'O dedo escreve. Use dois dedos para rolar.':'O dedo rola a página.'}">${ico('finger')}</button>`;
  t.innerHTML=h;
  t.querySelectorAll('[data-pen]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.pen;
    if(S.active===id){penDialog(S.pens.find(p=>p.id===id));return}
    clearSel();S.active=id;savePrefs();buildTray();
    if(!hinted){hinted=true;toast('Toque de novo na caneta para mudar tipo, cor, espessura, estabilidade e fluxo.',3400)}
  });
  const add=$('#addpen');if(add)add.onclick=()=>{const base=activePen()||S.pens[0];const p={...base,id:uid()};S.pens.push(p);S.active=p.id;savePrefs();buildTray();penDialog(p,true)};
  t.querySelector('[data-tapetool]').onclick=()=>{if(S.active==='tape'){tapeDialog();return}clearSel();S.active='tape';savePrefs();buildTray();toast('Passe a fita por cima do que quer esconder. Toque na fita para ver o que está embaixo. Toque de novo no botão para mudar cor e padrão.',5000)};
  t.querySelector('[data-laser]').onclick=()=>{if(S.active!=='laser'){clearSel();S.active='laser';savePrefs();buildTray();toast('Caneta laser: o traço brilha e some sozinho. Não fica salvo.',3500)}};
  t.querySelector('[data-lasso]').onclick=()=>{if(S.active!=='lasso'){clearSel();S.active='lasso';savePrefs();buildTray();toast('Desenhe uma volta em torno do que quer selecionar. Um risco reto vira um retângulo.',4000)}};
  t.querySelector('[data-texttool]').onclick=()=>{if(S.active!=='text'){clearSel();S.active='text';savePrefs();buildTray();toast('Toque na folha para criar uma caixa e escreva com a caneta por cima: o Rabiscar do iPad transforma em texto, sem abrir o teclado. Para digitar, use o botão Teclado.',6000)}};
  sc.classList.toggle('texttool',S.active==='text');
  t.querySelector('[data-eraser]').onclick=()=>{if(S.active==='eraser'){eraserDialog();return}clearSel();S.active='eraser';savePrefs();buildTray()};
  $('#undo').onclick=undo;$('#redo').onclick=redo;
  $('#finger').onclick=()=>{S.finger=!S.finger;saveDevice();buildTray();
    toast(S.finger?'O dedo escreve. Para rolar e dar zoom, use dois dedos.':'O dedo rola a página. Dois dedos dão zoom. Quem escreve é a caneta ou o mouse.',4000)};
  addFeatureTools(t);
  updUndo();
  const on=t.querySelector('[aria-pressed="true"]');if(on&&on.scrollIntoView)on.scrollIntoView({block:'nearest',inline:'nearest'});
}
function updUndo(){const u=$('#undo'),r=$('#redo');if(u)u.disabled=!S.undo.length;if(r)r.disabled=!S.redo.length}

/* Amostra da caneta: um traço com tremor de mão de verdade (pequeno ruído),
   passado pelo mesmo estabilizador e com velocidade variando, para que
   estabilidade e fluxo mostrem o efeito real. */
function previewStroke(cv,pen){
  const dpr=Math.min(window.devicePixelRatio||1,3);const cw=cv.clientWidth||400,ch=cv.clientHeight||110;
  cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);
  const pxu=pageCssW/LW,k=dpr*pxu;const ctx=cv.getContext('2d');ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle=S.nb?toneOf(S.nb.tone).c:'#fff';ctx.fillRect(0,0,cv.width,cv.height);
  const spanW=cw/pxu,spanH=ch/pxu,K=KINDS[pen.k],st=K.shape==='line'?2:3;
  const stab=new Ink.Stabilizer(pen.st,1/pxu);let seed=5;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const pts=[];const n=170;let lx=null,ly=null,pr=.6,last=[0,0];
  for(let i=0;i<=n;i++){const f=i/n;
    let x=spanW*.07+f*spanW*.86;
    let y=pen.k==='hl'?spanH*.5+Math.sin(f*3)*spanH*.04:spanH*.52+Math.sin(f*Math.PI*3.2)*spanH*.25*(1-f*.3);
    x+=(rnd()-.5)*2.6/pxu;y+=(rnd()-.5)*2.6/pxu;last=[x,y];
    const speed=.5+.5*Math.sin(f*Math.PI*2.4);pr=pr*.7+clamp(1.05-speed*.85,.12,1)*.3;
    const sm=stab.push(x,y);if(!sm)continue;
    if(lx!==null&&Math.hypot(sm[0]-lx,sm[1]-ly)<.5/pxu)continue;lx=sm[0];ly=sm[1];
    pts.push(Math.round(sm[0]*10)/10,Math.round(sm[1]*10)/10);if(st===3)pts.push(Math.round(pr*100));
  }
  for(const q of stab.finish(last[0],last[1])){pts.push(Math.round(q[0]*10)/10,Math.round(q[1]*10)/10);if(st===3)pts.push(Math.round(pr*100))}
  Ink.draw(ctx,{engine:Ink.ENGINE,t:pen.k==='hl'?'hl':'pen',k:pen.k,c:pen.c,w:pen.w,o:pen.o,f:pen.f,ls:pen.k==='hl'?undefined:pen.ls,s:st,p:pts,_live:true},k);
}
function swatchesHTML(list,cur,id){
  const inList=list.some(c=>c[0].toLowerCase()===cur.toLowerCase());
  return `<div class="opts sm" id="${id}">${list.map(([c,n])=>`<button class="copt" style="--c:${c}" data-v="${c}" aria-pressed="${c.toLowerCase()===cur.toLowerCase()}" aria-label="${n}" title="${n}"></button>`).join('')}
    <label class="copt custom" title="Outra cor" style="${!inList?'box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--accent)':''}"><input type="color" id="${id}-custom" value="${cur}" aria-label="Escolher outra cor"></label></div>`;
}
function penDialog(pen,isNew){
  if(!pen)return;
  const before={...pen};
  const render=()=>{
    const K=KINDS[pen.k];const step=K.max>20?1:.1;
    return `<h2>${isNew?'Nova caneta':'Ajustar caneta'}</h2><p>As mudanças valem para o que você escrever daqui em diante.</p>
    <canvas class="preview" id="pv" aria-label="Amostra do traço"></canvas>
    <div class="field" style="margin-top:16px"><span>Tipo</span><div class="chips" id="pk">${KIND_ORDER.map(k=>`<button class="chip" data-k="${k}" aria-pressed="${k===pen.k}">${ico(KINDS[k].icon,18)}${KINDS[k].n}</button>`).join('')}</div></div>
    <div class="field"><span>Cor</span>${swatchesHTML(pen.k==='hl'?HL_COLORS:INK_COLORS,pen.c,'pc')}</div>
    <div class="field"><span>Espessura</span><div class="range"><input type="range" id="pw" min="${K.min}" max="${K.max}" step="${step}" value="${pen.w}" aria-label="Espessura"><output id="pwv">${(+pen.w).toFixed(step<1?1:0)}</output></div></div>
    <div class="field"><span>Concentração</span><div class="range"><input type="range" id="po" min="10" max="100" step="5" value="${Math.round(pen.o*100)}" aria-label="Concentração"><output id="pov">${Math.round(pen.o*100)}%</output></div></div>
    ${pen.k==='hl'?'':`<div class="field"><span>Estilo do traço</span><div class="chips">${[['solid','Contínuo','0'],['dot','Pontilhado','.1 6'],['dash','Tracejado','8 6']].map(([v,n,d])=>`<button class="chip" data-ls="${v}" aria-pressed="${(pen.ls||'solid')===v}"><svg width="34" height="10" viewBox="0 0 34 10" aria-hidden="true"><path d="M2 7 C 10 1, 22 9, 32 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="${d}"/></svg>${n}</button>`).join('')}</div></div>`}
    <h3 class="subhead">Avançado</h3>
    <div class="field"><span>Estabilidade</span><div class="range"><input type="range" id="pst" min="0" max="100" step="1" value="${pen.st}" aria-label="Estabilidade"><output id="pstv">${pen.st}</output></div>
      <small class="hint">Tira o tremor da mão. No zero o traço sai exatamente como você fez; quanto mais alto, mais liso.</small></div>
    <div class="field"><span>Fluxo de tinta</span><div class="range"><input type="range" id="pf" min="10" max="100" step="1" value="${pen.f}" aria-label="Fluxo de tinta"><output id="pfv">${pen.f}</output></div>
      <small class="hint">Baixo: tinta mais seca, com falhas onde você escreve rápido e textura do papel. Alto: tinta cheia e uniforme.</small></div>
    <div class="actions">${S.pens.length>1?'<button class="btn left" data-del>Remover caneta</button>':''}<button class="btn" data-x>${isNew?'Cancelar':'Desfazer mudanças'}</button><button class="btn primary" data-ok>Pronto</button></div>`;
  };
  let cancelled=false;
  const m=modal(render(),()=>{if(!cancelled){savePrefs();buildTray()}});
  const dlg=m.el.querySelector('.dialog');
  const refresh=()=>{previewStroke(dlg.querySelector('#pv'),pen);buildTray()};
  const rerender=()=>{const y=dlg.scrollTop;dlg.innerHTML=render();wire();refresh();dlg.scrollTop=y};
  const slider=(id,out,fmt,set)=>{const el=dlg.querySelector(id);el.oninput=()=>{set(+el.value);dlg.querySelector(out).textContent=fmt(+el.value);refresh()}};
  const wire=()=>{
    dlg.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{
      const was=pen.k,k=b.dataset.k,K=KINDS[k];if(was===k)return;
      pen.k=k;if((was==='hl')!==(k==='hl'))pen.c=(k==='hl'?HL_COLORS:INK_COLORS)[0][0];
      pen.w=K.def;pen.o=K.o;pen.st=K.st;pen.f=K.f;rerender();
    });
    dlg.querySelectorAll('#pc [data-v]').forEach(b=>b.onclick=()=>{pen.c=b.dataset.v;rerender()});
    const cc=dlg.querySelector('#pc-custom');cc.oninput=()=>{pen.c=cc.value;refresh()};cc.onchange=rerender;
    slider('#pw','#pwv',v=>v.toFixed(KINDS[pen.k].max>20?0:1),v=>pen.w=v);
    slider('#po','#pov',v=>v+'%',v=>pen.o=v/100);
    dlg.querySelectorAll('[data-ls]').forEach(b=>b.onclick=()=>{pen.ls=b.dataset.ls;rerender()});
    slider('#pst','#pstv',v=>String(v),v=>pen.st=v);
    slider('#pf','#pfv',v=>String(v),v=>pen.f=v);
    dlg.querySelector('[data-ok]').onclick=m.close;
    dlg.querySelector('[data-x]').onclick=()=>{
      if(isNew){S.pens=S.pens.filter(p=>p!==pen);S.active=S.pens[S.pens.length-1].id}else Object.assign(pen,before);
      cancelled=true;m.close();savePrefs();buildTray();
    };
    const del=dlg.querySelector('[data-del]');if(del)del.onclick=()=>{
      const i=S.pens.indexOf(pen);S.pens.splice(i,1);S.active=S.pens[Math.max(0,i-1)].id;cancelled=true;m.close();savePrefs();buildTray();toast('Caneta removida.')};
  };
  wire();requestAnimationFrame(()=>previewStroke(dlg.querySelector('#pv'),pen));
}
function eraserDialog(){
  const e=S.eraser;
  const m=modal(`<h2>Borracha</h2><p>Escolha como ela apaga e o tamanho da ponta.</p>
    <div class="field"><span>Modo</span><div class="chips" id="em">
      <button class="chip" data-m="inteiro" aria-pressed="${e.mode==='inteiro'}">Apaga o traço inteiro</button>
      <button class="chip" data-m="parcial" aria-pressed="${e.mode==='parcial'}">Apaga só onde passa</button></div></div>
    <div class="field"><span>Tamanho</span><div class="range"><input type="range" id="es" min="4" max="60" step="1" value="${e.size}" aria-label="Tamanho da borracha"><output id="esv">${e.size}</output></div></div>
    <div class="actions"><button class="btn primary" data-ok>Pronto</button></div>`,()=>{savePrefs()});
  m.el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{e.mode=b.dataset.m;m.el.querySelectorAll('[data-m]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  const s=m.el.querySelector('#es');s.oninput=()=>{e.size=+s.value;m.el.querySelector('#esv').textContent=s.value};
  m.el.querySelector('[data-ok]').onclick=m.close;
}

/* ---------- Captura da caneta ----------
   Regras de toque no iPad:
   - caneta (pointerType "pen") sempre escreve;
   - depois que uma caneta é detectada, o dedo e a palma não escrevem mais:
     um dedo rola, dois dedos rolam e dão zoom;
   - toques enquanto a caneta está na tela, ou logo depois, são ignorados;
   - contatos muito largos (palma) são ignorados.
   A página inteira usa touch-action:none: quem decide o que é rolagem é o app,
   senão o Safari rolaria a página com a própria caneta. */
const touches=new Map();let act=null,gest=null,pan=null,penUpAt=0,inertia=0;
const pvals=new Set();
function notePen(e){
  if(!S.penDevice){S.penDevice=true;S.finger=false;saveDevice();buildTray();toast('Caneta detectada. A partir de agora só a caneta escreve; o dedo rola e dois dedos dão zoom.',5000)}
  if(!S.realPressure&&e.pressure>0&&e.pressure<1&&Math.abs(e.pressure-.5)>.004){pvals.add(Math.round(e.pressure*100));const v=[...pvals];if(pvals.size>=15&&Math.max(...v)-Math.min(...v)>=30){S.realPressure=true;saveDevice()}}
}
function tiltOf(e){
  if(e.altitudeAngle!=null&&e.altitudeAngle>0&&e.altitudeAngle<Math.PI/2-.02)return [e.altitudeAngle*180/Math.PI,((e.azimuthAngle||0)*180/Math.PI+360)%360];
  const tx=e.tiltX||0,ty=e.tiltY||0;if(!tx&&!ty)return [90,45];
  return [90-Math.min(90,Math.max(Math.abs(tx),Math.abs(ty))),(Math.atan2(ty,tx)*180/Math.PI+360)%360];
}
function toLocal(pg,e){const r=pg.el.getBoundingClientRect();return [(e.clientX-r.left)/r.width*LW,(e.clientY-r.top)/r.height*LH]}
sc.addEventListener('pointerdown',e=>{
  if(S.loading||e.target.closest('.tedit'))return;
  if(e.pointerType==='touch'){
    if(act&&act.pen)return;
    if((e.width||0)>48||(e.height||0)>48)return;
    stopInertia();
    touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    try{sc.setPointerCapture(e.pointerId)}catch(_){}
    if(touches.size>=2){if(act)cancelStroke();pan=null;startGesture();return}
    if(S.sel&&touches.size===1){const sh=selHit(e);if(sh){beginSelDrag(e,sh);return}}
    if(S.finger&&S.active!=='text'){startStroke(e);return}
    pan={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t0:e.timeStamp,vx:0,vy:0,t:e.timeStamp,target:e.target};return;
  }
  stopInertia();
  if(e.pointerType==='pen'){if(act)cancelStroke();notePen(e);if(gest)endGesture();touches.clear();pan=null}
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(S.active==='text')return;
  startStroke(e);
});
function startStroke(e){
  if(S.loading||!S.nb)return;
  const sh=selHit(e);if(sh){beginSelDrag(e,sh);return}
  if(S.sel){clearSel();e.preventDefault();return}
  const pageEl=e.target.closest('.page');if(!pageEl)return;
  e.preventDefault();if(editing)finishEdit();clearTimeout(hwrT);
  const pg=pageEl._pg;const [x,y]=toLocal(pg,e);
  try{sc.setPointerCapture(e.pointerId)}catch(_){}
  ensureCanvas(pg);if(pg.dirty)renderPage(pg);attachLive(pg);
  const isPen=e.pointerType==='pen';
  if(S.active==='eraser'){act={pid:e.pointerId,pg,pen:isPen,eraser:true,orig:new Map(pg.strokes.map((s,i)=>[s,i])),removed:[],created:new Set(),tRem:[],tpRem:[]};eraseAt(x,y);return}
  if(S.active==='lasso'){act={pid:e.pointerId,pg,pen:isPen,lasso:true,pts:[[x,y]]};return}
  if(S.active==='tape'){startTape(e,pg,x,y,isPen);return}
  if(S.active==='laser'){attachLaser(pg);const L={pg,pts:[[x,y]],end:0};lasers.push(L);act={pid:e.pointerId,pg,pen:isPen,laser:L};kickLaser();return}
  const pen=activePen(),K=KINDS[pen.k];
  const hasTilt=isPen&&tiltOf(e)[0]<88;
  const stride=K.shape==='line'?2:(hasTilt?5:3);
  const st={id:uid(),engine:Ink.ENGINE,t:pen.k==='hl'?'hl':'pen',k:pen.k,c:pen.c,w:pen.w,o:pen.o,f:pen.f,s:stride,p:[],_live:true};
  act={pid:e.pointerId,pg,pen:isPen,st,stab:new Ink.Stabilizer(pen.st,LW/pageCssW),lx:x,ly:y,px:x,py:y,rx:x,ry:y,lt:e.timeStamp,pr:.62,
    real:isPen,pred:null,hx:x,hy:y,eps:(.08+pen.st/100*.2)*LW/pageCssW};
  if(act.real)st.rp=1;
  if(pen.ls&&pen.ls!=='solid')st.ls=pen.ls;
  const th=tapeAt(pg,x,y);if(th)act.tapeHit=th;
  pushPt(x,y,e);drawLive();armHold(act);
}
function pushPt(x,y,ev){
  const a=act,st=a.st,r=v=>Math.round(v*10)/10;st.p.push(r(x),r(y));
  if(st.s>=3){let pr=a.pr;if(a.real){const raw=clamp(Number.isFinite(ev.pressure)?ev.pressure:.5,.05,1);a.prr=a.prr==null?raw:a.prr*.7+raw*.3;pr=a.prr}st.p.push(Math.round(pr*100))}
  if(st.s===5){const [al,az]=tiltOf(ev);st.p.push(Math.round(al),Math.round(az))}
}
sc.addEventListener('pointermove',e=>{
  if(e.pointerType==='pen'&&pan?.id===e.pointerId){pan=null;touches.delete(e.pointerId);stopInertia();notePen(e);startStroke(e)}
  if(e.pointerType==='touch'&&touches.has(e.pointerId)){
    touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(gest){moveGesture();return}
    if(pan&&pan.id===e.pointerId){const dx=e.clientX-pan.x,dy=e.clientY-pan.y,dt=Math.max(1,e.timeStamp-pan.t);
      sc.scrollBy(-dx,-dy);pan.vx=pan.vx*.5+(-dx/dt)*.5;pan.vy=pan.vy*.5+(-dy/dt)*.5;pan.x=e.clientX;pan.y=e.clientY;pan.t=e.timeStamp;return}
  }
  if(!act||e.pointerId!==act.pid)return;
  if(act.snapped)return;
  e.preventDefault();
  if(act.seld){moveSelDrag(e);return}
  if(act.tape){moveTape(e);return}
  if(act.laser){const [x,y]=toLocal(act.pg,e),P=act.laser.pts,l=P[P.length-1];if(Math.hypot(x-l[0],y-l[1])>1)P.push([x,y]);kickLaser();return}
  if(act.lasso){const [x,y]=toLocal(act.pg,e),l=act.pts[act.pts.length-1];if(Math.hypot(x-l[0],y-l[1])>1.5){act.pts.push([x,y]);drawLasso(act)}return}
  const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];
  const pxu=pageCssW/LW;
  for(const ev of (evs.length?evs:[e])){
    const [x,y]=toLocal(act.pg,ev);act.rx=x;act.ry=y;
    if(act.eraser){eraseAt(x,y);continue}
    /* pressão simulada pela velocidade real da mão (antes da estabilização) */
    const dt=Math.max(1,ev.timeStamp-act.lt),v=Math.hypot(x-act.px,y-act.py)*pxu/dt;
    if(v>0){act.pr=act.pr*.72+clamp(1.12-v*.42,.12,1)*.28;act.px=x;act.py=y;act.lt=ev.timeStamp}
    const sm=act.stab.push(x,y);if(!sm)continue;
    if(Math.hypot(sm[0]-act.lx,sm[1]-act.ly)<.5/pxu)continue;
    act.lx=sm[0];act.ly=sm[1];pushPt(sm[0],sm[1],ev);
  }
  if(act&&!act.eraser&&Math.hypot(act.rx-act.hx,act.ry-act.hy)*pxu>3){act.hx=act.rx;act.hy=act.ry;armHold(act)}
  if(act&&!act.eraser){
    act.pred=null;
    if(e.getPredictedEvents){const pe=e.getPredictedEvents();if(pe&&pe.length){const q=pe[pe.length-1];act.pred=toLocal(act.pg,q)}}
    drawLive();
  }
});
let liveF=0;
/* Traço em andamento: desenhado no próximo quadro, com um pequeno trecho
   "previsto" pelo navegador quando disponível, para reduzir o atraso visual. */
function drawLive(){if(liveF)return;liveF=requestAnimationFrame(()=>{liveF=0;if(!act||act.eraser)return;
  liveClear();let s=act.st;if(!act.snapped&&s.engine!==Ink.ENGINE)s={...s,p:Ink.simplify(s.p,s.s,act.eps)};
  if(act.pred){const st=s.s,p=s.p.slice(-st);p[0]=Math.round(act.pred[0]*10)/10;p[1]=Math.round(act.pred[1]*10)/10;s={...s,p:s.p.concat(p)}}
  const vector=Ink.svg(s);if(vector!==null)liveSvg.innerHTML=vector;else Ink.draw(liveCv.getContext('2d'),s,liveCv.width/LW)})}
function armHold(a){clearTimeout(a.holdT);a.holdT=setTimeout(()=>{tryLoopSelect(a);if(act===a&&S.shapes)tryShape(a)},650)}
function commitStroke(a){
  for(const q of (a.snapped?[]:a.stab.finish(a.rx,a.ry))){act=a;pushPt(q[0],q[1],{pressure:a.real?(a.prr??.5):a.pr})}act=null;
  delete a.st._live;
  if(!a.st.p.length)return;
  if(a.tapeHit){const b=Ink.geom(a.st).box;if(Math.hypot(b[2]-b[0],b[3]-b[1])-a.st.w<5){toggleTape(a.pg,a.tapeHit);return}}
  if(tryScratch(a.pg,a.st))return;
  if(!a.snapped&&a.st.engine!==Ink.ENGINE)a.st.p=Ink.simplify(a.st.p,a.st.s,a.eps);
  a.pg.strokes.push(a.st);
  appendInkSvg(a.pg,a.st);
  pushUndo({pg:a.pg.id,added:[a.st],removed:[]});schedulePageSave(a.pg);
  hwrStroke(a.pg,a.st);
}
function endPointer(e){
  if(e.pointerType==='touch'){touches.delete(e.pointerId);if(gest&&touches.size<2)endGesture();
    if(pan&&pan.id===e.pointerId){
      if(Math.hypot(e.clientX-pan.sx,e.clientY-pan.sy)<8&&e.timeStamp-pan.t0<350){const pe=pan.target.closest&&pan.target.closest('.page');if(pe){const [x,y]=toLocal(pe._pg,e);const t=tapeAt(pe._pg,x,y);if(t)toggleTape(pe._pg,t)}}
      else startInertia(pan.vx,pan.vy,e.timeStamp-pan.t);pan=null}}
  if(!act||e.pointerId!==act.pid)return;
  if(act.pen)penUpAt=performance.now();
  const a=act;act=null;
  clearTimeout(a.holdT);
  if(a.seld){endSelDrag(a);return}
  if(a.tape){endTape(a);return}
  if(a.laser){a.laser.end=performance.now();kickLaser();return}
  if(liveF){cancelAnimationFrame(liveF);liveF=0}
  liveClear();
  if(a.lasso){finishLasso(a);return}
  if(a.eraser){
    if(a.removed.length||a.created.size||a.tRem.length||a.tpRem.length)pushUndo({pg:a.pg.id,added:[...a.created],removed:a.removed.sort((x,y)=>x.i-y.i),tRem:a.tRem,tpRem:a.tpRem}),schedulePageSave(a.pg);
    renderPage(a.pg);return;
  }
  commitStroke(a);
}
sc.addEventListener('pointerup',endPointer);
sc.addEventListener('lostpointercapture',e=>{if(act?.pid===e.pointerId)endPointer(e);if(pan?.id===e.pointerId)pan=null;touches.delete(e.pointerId);if(gest&&touches.size<2)endGesture()});
sc.addEventListener('pointercancel',e=>{
  if(act&&e.pointerId===act.pid){if(act.pen)penUpAt=performance.now();cancelStroke()}
  if(e.pointerType==='touch'){touches.delete(e.pointerId);if(gest&&touches.size<2)endGesture();if(pan&&pan.id===e.pointerId)pan=null}
});
function cancelStroke(){
  if(!act)return;const a=act;act=null;clearTimeout(a.holdT);if(a.seld){endSelDrag(a);return}if(a.tape){renderTapes(a.pg);return}if(a.laser){a.laser.end=performance.now();return}liveClear();
  if(a.eraser){
    if(a.removed.length||a.created.size||a.tRem.length||a.tpRem.length){pushUndo({pg:a.pg.id,added:[...a.created],removed:a.removed.sort((x,y)=>x.i-y.i),tRem:a.tRem,tpRem:a.tpRem});schedulePageSave(a.pg)}
    renderPage(a.pg);
  }
}
/* Rolagem com um dedo, com inércia como no app nativo */
function startInertia(vx,vy,idle){
  if(idle>80||Math.hypot(vx,vy)<.08)return;let last=performance.now();
  const step=t=>{const dt=Math.min(32,t-last);last=t;sc.scrollBy(vx*dt,vy*dt);const d=Math.pow(.996,dt);vx*=d;vy*=d;
    inertia=Math.hypot(vx,vy)>.02?requestAnimationFrame(step):0};
  inertia=requestAnimationFrame(step);
}
function stopInertia(){if(inertia){cancelAnimationFrame(inertia);inertia=0}}
/* Dois dedos: rolar e zoom em pinça. Durante o gesto a página só é escalada
   visualmente; ao soltar, é redesenhada nítida no novo zoom. */
function two(){const [a,b]=[...touches.values()];return {mx:(a.x+b.x)/2,my:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)||1}}
function startGesture(){const t=two();gest={lmx:t.mx,lmy:t.my,d0:t.d,pinch:false}}
function moveGesture(){
  if(touches.size<2)return;const t=two(),g=gest;
  if(!g.pinch){
    sc.scrollBy(g.lmx-t.mx,g.lmy-t.my);g.lmx=t.mx;g.lmy=t.my;
    if(Math.abs(t.d/g.d0-1)>.06){const r=sc.getBoundingClientRect();
      Object.assign(g,{pinch:true,d0:t.d,m0x:t.mx,m0y:t.my,cx:sc.scrollLeft+t.mx-r.left,cy:sc.scrollTop+t.my-r.top,z0:S.zoom,scale:1,mx:t.mx,my:t.my});
      $('#pages').style.transformOrigin=g.cx+'px '+g.cy+'px'}
    return;
  }
  const z=clamp(g.z0*t.d/g.d0,ZMIN,ZMAX);g.scale=z/g.z0;g.mx=t.mx;g.my=t.my;
  $('#pages').style.transform=`translate(${t.mx-g.m0x}px,${t.my-g.m0y}px) scale(${g.scale})`;
}
function endGesture(){
  const g=gest;gest=null;const pages=$('#pages');pages.style.transform='';pages.style.transformOrigin='';
  if(!g||!g.pinch)return;
  const r=sc.getBoundingClientRect(),z=g.z0*g.scale,ratio=z/S.zoom;
  S.zoom=z;layout();sc.scrollLeft=g.cx*ratio-(g.mx-r.left);sc.scrollTop=g.cy*ratio-(g.my-r.top);renderVisible();
}
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?((px-ax)*dx+(py-ay)*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-ax-t*dx,py-ay-t*dy)}
function hits(s,x,y,R){const st=s.s||2,p=s.p,n=p.length/st,rad=R+s.w/2;
  for(let i=0;i<n;i++){const ax=p[i*st],ay=p[i*st+1];const bx=i+1<n?p[(i+1)*st]:ax,by=i+1<n?p[(i+1)*st+1]:ay;if(segDist(x,y,ax,ay,bx,by)<rad)return true}return false}
/* Borracha parcial: corta o traço nos dados, gerando novos traços com o que sobrou */
function splitStroke(s,x,y,R){
  const st=s.s||2,p=s.p,n=p.length/st,rad=R+s.w*0.35;const out=[];let run=[];
  const end=()=>{if(run.length>=st*2)out.push({...s,id:uid(),p:run});run=[]};
  for(let i=0;i<n;i++){const px=p[i*st],py=p[i*st+1];
    if(Math.hypot(px-x,py-y)<rad)end();else for(let j=0;j<st;j++)run.push(p[i*st+j])}
  end();return out;
}
function eraseAt(x,y){
  const pg=act.pg,R=S.eraser.size;let changed=false;const out=[];
  for(const s of pg.strokes){
    if(!hits(s,x,y,R)){out.push(s);continue}
    const pieces=S.eraser.mode==='parcial'?splitStroke(s,x,y,R):[];
    if(pieces.length===1&&pieces[0].p.length===s.p.length){out.push(s);continue}
    changed=true;
    if(act.orig.has(s))act.removed.push({s,i:act.orig.get(s)});else act.created.delete(s);
    for(const q of pieces){out.push(q);act.created.add(q)}
  }
  if(changed){pg.strokes=out;scheduleRender(pg)}
  const tHit=(pg.texts||[]).filter(t=>{const b=textBox(pg,t);return x>b[0]-R&&x<b[2]+R&&y>b[1]-R&&y<b[3]+R});
  if(tHit.length){act.tRem.push(...tHit);pg.texts=pg.texts.filter(t=>!tHit.includes(t));renderTexts(pg)}
  const tp=tapeAt(pg,x,y);if(tp){act.tpRem.push(tp);pg.tapes=pg.tapes.filter(t=>t!==tp);renderTapes(pg)}
  liveClear();const c=liveCv.getContext('2d'),k=liveCv.width/LW;c.strokeStyle='rgba(35,67,168,.75)';c.lineWidth=1.5;c.beginPath();c.arc(x*k,y*k,R*k,0,6.2832);c.stroke();
}

/* ---------- Textos na página ----------
   Um texto é um objeto próprio: {id, x, y, w, fs, c, font, text, src?}
   (posição e tamanho em unidades da página; src guarda os traços originais
   quando o texto veio da sua escrita, para poder voltar a ela). */
const FONTS=[
  {id:'caderno',n:'Caderno',css:'"Shadows Into Light Two","Patrick Hand",cursive'},
  {id:'indie',n:'Redonda',css:'"Indie Flower","Patrick Hand",cursive'},
  {id:'patrick',n:'Manuscrita',css:'"Patrick Hand","Comic Sans MS",cursive'},
  {id:'caveat',n:'Caneta',css:'"Caveat","Segoe Print",cursive'},
  {id:'lora',n:'Clássica',css:'"Lora",Georgia,"Times New Roman",serif'},
  {id:'figtree',n:'Moderna',css:'"Figtree",system-ui,sans-serif'}
];
const fontOf=id=>(FONTS.find(f=>f.id===id)||FONTS[0]);
/* Altura da linha do texto: no papel pautado segue a pauta; nos outros, 1,25 × a letra */
const lineH=t=>t.lh||t.fs*1.25;
const topFor=(base,fs,lh)=>base-(lh-fs)/2-fs*.92;
S.hwr={auto:false,wait:2,font:'caderno',precise:false};
function renderTexts(pg){
  const L=pg.el.querySelector('.tlayer');if(!L)return;
  const keep=editing&&editing.pg===pg?editing.ta:null;
  L.querySelectorAll('.tbox').forEach(n=>n.remove());
  for(const t of pg.texts||[]){
    if(editing&&editing.pg===pg&&editing.orig===t)continue;
    const d=document.createElement('div');d.className='tbox';d._t=t;
    Object.assign(d.style,{left:t.x+'px',top:t.y+'px',width:t.w+'px',fontSize:t.fs+'px',lineHeight:lineH(t)+'px',color:t.c,fontFamily:fontOf(t.font).css});
    d.textContent=t.text;L.insertBefore(d,keep);
  }
}
function textBox(pg,t){const L=pg.el.querySelector('.tlayer');for(const d of L.querySelectorAll('.tbox'))if(d._t===t)return [t.x,t.y,t.x+d.offsetWidth,t.y+d.offsetHeight];return [t.x,t.y,t.x+t.w,t.y+t.fs*1.3]}

/* Edição: a caixa vira um campo de texto de verdade. No iPad, escrever com a
   caneta sobre ele aciona o Rabiscar (Scribble); o teclado também funciona. */
let editing=null;
function startEdit(pg,t,isNew){
  if(editing)finishEdit();
  const L=pg.el.querySelector('.tlayer');
  const draft={...t};
  const ta=document.createElement('textarea');ta.className='tedit';ta.value=t.text||'';ta.setAttribute('aria-label','Texto');
  ta.spellcheck=true;ta.lang='pt-BR';ta.autocapitalize='sentences';
  /* modo caneta: o teclado fica escondido e o Rabiscar escreve direto na caixa */
  ta.setAttribute('inputmode',S.kbd?'text':'none');
  editing={pg,orig:isNew?null:t,draft,ta};
  styleEdit();L.appendChild(ta);renderTexts(pg);
  const grow=()=>{ta.style.height='auto';ta.style.height=Math.max(lineH(draft)*(ta.value?1:2.5),ta.scrollHeight)+'px'};
  ta.addEventListener('input',grow);grow();
  ta.addEventListener('blur',()=>setTimeout(()=>{if(editing&&editing.ta===ta&&document.activeElement!==ta)finishEdit()},120));
  ta.focus({preventScroll:true});
  showTextbar();
}
function styleEdit(){const {draft:t,ta}=editing;Object.assign(ta.style,{left:t.x+'px',top:t.y+'px',width:t.w+'px',fontSize:t.fs+'px',lineHeight:lineH(t)+'px',color:t.c,fontFamily:fontOf(t.font).css})}
function finishEdit(){
  if(!editing)return;const {pg,orig,draft,ta}=editing;editing=null;
  draft.text=ta.value.replace(/\s+$/,'');ta.remove();hideTextbar();
  const same=orig&&orig.text===draft.text&&orig.fs===draft.fs&&orig.c===draft.c&&orig.font===draft.font&&orig.w===draft.w;
  if(same){renderTexts(pg);return}
  const op={pg:pg.id,added:[],removed:[],tAdd:[],tRem:[]};
  if(orig)op.tRem.push(orig);
  if(draft.text){const nt={...draft,id:orig?orig.id:uid()};op.tAdd.push(nt)}
  if(!op.tAdd.length&&!op.tRem.length){renderTexts(pg);return}
  pg.texts=(pg.texts||[]).filter(x=>x!==orig).concat(op.tAdd);
  renderTexts(pg);pushUndo(op);schedulePageSave(pg);
}
function textAt(pg,x,y){for(const t of (pg.texts||[]).slice().reverse()){const b=textBox(pg,t);if(x>=b[0]-6&&x<=b[2]+6&&y>=b[1]-6&&y<=b[3]+6)return t}return null}
function textTap(e){
  if(S.active!=='text')return;
  if(S.loading||e.target.closest('.tedit'))return;
  const pageEl=e.target.closest('.page');if(!pageEl)return;
  const pg=pageEl._pg;const [x,y]=toLocal(pg,e);
  const hit=textAt(pg,x,y);
  if(hit){startEdit(pg,hit,false);return}
  if(editing){finishEdit();return}
  const fs=S.nb.paper==='pautado'?Math.round(STEP*.58):26;
  const ruled=S.nb.paper==='pautado',lh=ruled?STEP:fs*1.25;
  let top=y-lh/2;if(ruled){const n=Math.max(0,Math.round((y-LINE0)/STEP));top=topFor(LINE0+n*STEP,fs,lh)}
  const lastC=(activePen()||S.pens[0]).c;
  startEdit(pg,{x:Math.max(8,x),y:Math.max(4,top),w:Math.max(160,LW-Math.max(8,x)-30),fs,lh:ruled?STEP:undefined,c:lastC,font:S.hwr.font,text:''},true);
}
sc.addEventListener('click',textTap);

/* Barra de texto: fonte, tamanho, cor, excluir e voltar à escrita */
function showTextbar(){
  const b=$('#textbar');if(!editing)return;const t=editing.draft;
  b.innerHTML=FONTS.map(f=>`<button class="chip" data-font="${f.id}" aria-pressed="${t.font===f.id}" style="font-family:${f.css.replace(/"/g,"'")}">${f.n}</button>`).join('')+
    `<span class="sep"></span><button class="tool" data-fs="-1" aria-label="Diminuir letra">${ico('minus',18)}</button><output class="fsval">${Math.round(t.fs)}</output><button class="tool" data-fs="1" aria-label="Aumentar letra">${ico('plus',18)}</button>
     <span class="sep"></span>${QUICK_COLORS.map(([c,n])=>`<button class="swatch" style="--sw:${c}" data-tc="${c}" aria-pressed="${c===t.c}" aria-label="${n}"></button>`).join('')}
     <span class="sep"></span>${editing.orig&&editing.orig.src?`<button class="btn" data-undoconv>Voltar à escrita</button>`:''}
     <button class="btn" data-kbd aria-pressed="${!!S.kbd}">${S.kbd?'Esconder teclado':'Teclado'}</button>
     <button class="tool" data-tdel aria-label="Excluir texto" title="Excluir texto">${ico('trash',20)}</button><button class="btn primary" data-tok>Pronto</button>`;
  b.hidden=false;
  b.querySelectorAll('button').forEach(x=>x.addEventListener('pointerdown',e=>e.preventDefault()));
  b.querySelectorAll('[data-font]').forEach(x=>x.onclick=()=>{t.font=x.dataset.font;styleEdit();showTextbar()});
  b.querySelectorAll('[data-fs]').forEach(x=>x.onclick=()=>{t.fs=clamp(t.fs+(+x.dataset.fs)*2,10,120);styleEdit();editing.ta.dispatchEvent(new Event('input'));showTextbar()});
  b.querySelectorAll('[data-tc]').forEach(x=>x.onclick=()=>{t.c=x.dataset.tc;styleEdit();showTextbar()});
  b.querySelector('[data-kbd]').onclick=()=>{S.kbd=!S.kbd;saveDevice();const ta=editing.ta;ta.setAttribute('inputmode',S.kbd?'text':'none');ta.blur();setTimeout(()=>ta.focus({preventScroll:true}),30);showTextbar()};
  b.querySelector('[data-tdel]').onclick=()=>{editing.ta.value='';finishEdit()};
  b.querySelector('[data-tok]').onclick=()=>finishEdit();
  const u=b.querySelector('[data-undoconv]');if(u)u.onclick=()=>{const {pg,orig}=editing;editing.ta.remove();editing=null;hideTextbar();backToInk(pg,orig)};
}
function hideTextbar(){$('#textbar').hidden=true}
function backToInk(pg,t){
  const op={pg:pg.id,added:t.src.slice(),removed:[],tAdd:[],tRem:[t]};
  pg.texts=(pg.texts||[]).filter(x=>x!==t);pg.strokes=pg.strokes.concat(op.added);
  renderPage(pg);renderTexts(pg);pushUndo(op);schedulePageSave(pg);toast('Sua escrita voltou.');
}

/* ---------- Conversão automática pelo Claude ----------
   Depois de cada traço, um relógio espera a pausa escolhida. Se você voltar a
   escrever antes, ele recomeça. Quando a pausa termina, as linhas novas são
   lidas e trocadas por texto no mesmo lugar. */
const pending=new Map();let hwrT=null,hwrBusy=0;
function hwrStroke(pg,s){
  if(!S.hwr.auto||s.k==='hl')return;
  if(!pending.has(pg.id))pending.set(pg.id,new Set());
  pending.get(pg.id).add(s);armHwr();
}
function armHwr(){clearTimeout(hwrT);if(!S.hwr.auto)return;hwrT=setTimeout(runHwr,S.hwr.wait*1000)}
function runHwr(){
  if(act){armHwr();return}
  for(const [pid,set] of pending){
    const pg=S.pages.find(p=>p.id===pid);pending.delete(pid);if(!pg)continue;
    const list=[...set].filter(s=>pg.strokes.includes(s));
    if(list.length)convertStrokes(pg,list,true);
  }
}
function setHwrChip(){const c=$('#hwrchip');c.hidden=!hwrBusy;c.textContent=hwrBusy?'Lendo sua escrita…':''}
async function convertStrokes(pg,strokes,auto){
  const lines=HWR.clusterLines(strokes.filter(s=>s.k!=='hl'));
  if(!lines.length){if(!auto)toast('Não encontrei escrita para converter nesta página.');return}
  hwrBusy++;setHwrChip();
  let texts;
  try{texts=await HWR.recognize(lines,{precise:S.hwr.precise})}
  catch(e){
    hwrBusy--;setHwrChip();const c=e&&e.code;
    if(c==='not_granted'||c==='unavailable'||c==='sampling_disabled'||c==='images_unavailable'||c==='not_declared'||c==='capability_disabled'){
      S.hwr.auto=false;savePrefs();toast('A conversão precisa da sua permissão para usar o Claude. Ela foi desligada; ligue de novo em ⋯ › Escrita para texto.',6000)}
    else if(c==='rate_limited')toast('Muitas conversões seguidas. Espere um pouco e use ⋯ › Converter esta página.',5000);
    else if(c==='session_expired')toast('Sua sessão do Claude expirou. Entre de novo para converter.',5000);
    else toast('Não consegui ler a escrita agora. Tente de novo em ⋯ › Converter esta página.',5000);
    return;
  }
  hwrBusy--;setHwrChip();
  if(!S.pages.includes(pg))return;
  const op={pg:pg.id,added:[],removed:[],tAdd:[],tRem:[]};let n=0;
  lines.forEach((L,i)=>{
    const txt=texts[i];if(!txt)return;
    const present=L.strokes.filter(s=>pg.strokes.includes(s));if(present.length<L.strokes.length*.6)return;
    const [x0,y0,x1,y1]=L.box,h=Math.max(10,y1-y0);
    let fs=clamp(Math.min(h,L.medH*1.4)*.7,16,80);
    let base=y0+h*.8;
    if(S.nb.paper==='pautado'){const r=LINE0+Math.round((base-LINE0)/STEP)*STEP;if(Math.abs(r-base)<STEP*.5)base=r;fs=clamp(fs,STEP*.52,STEP*.66)}
    const cols={};for(const s of present)cols[s.c]=(cols[s.c]||0)+1;const c=Object.keys(cols).sort((a,b)=>cols[b]-cols[a])[0]||'#1c1d24';
    const ruled=S.nb.paper==='pautado';const t={id:uid(),lh:ruled?STEP:undefined,x:Math.max(4,x0),y:topFor(base,fs,ruled?STEP:fs*1.25),w:Math.min(LW-Math.max(4,x0)-8,Math.max(x1-x0+fs*3,140)),fs:Math.round(fs*10)/10,c,font:S.hwr.font,text:txt,src:present};
    for(const s of present)op.removed.push({s,i:pg.strokes.indexOf(s)});
    /* continua o texto anterior se esta linha vem logo depois dele (mesma linha ou a de baixo) */
    const lh=S.nb.paper==='pautado'?STEP:Math.max(L.medH*1.6,h);
    const last=S.lastT;let cur=null;
    if(last&&last.pg===pg.id)cur=op.tAdd.find(x=>x.id===last.tId)||(pg.texts||[]).find(x=>x.id===last.tId)||null;
    const j=cur?joinKind(L.box,last.written,last.lh):null;
    if(j){
      const nt={...cur,text:cur.text+(j==='same'?' ':'\n')+txt,src:(cur.src||[]).concat(present)};
      if(j==='same')nt.w=Math.min(LW-nt.x-8,Math.max(nt.w,x1-nt.x+nt.fs*2));
      const k=op.tAdd.indexOf(cur);if(k>=0)op.tAdd[k]=nt;else{op.tRem.push(cur);op.tAdd.push(nt)}
      const w=last.written;S.lastT={pg:pg.id,tId:nt.id,written:[Math.min(w[0],x0),Math.min(w[1],y0),Math.max(w[2],x1),Math.max(w[3],y1)],lh:last.lh};
    }else{op.tAdd.push(t);S.lastT={pg:pg.id,tId:t.id,written:[x0,y0,x1,y1],lh}}
    n++;
  });
  if(!n){if(!auto)toast('Não reconheci texto nessa escrita.');return}
  const rem=new Set(op.removed.map(r=>r.s));op.removed.sort((a,b)=>a.i-b.i);
  pg.strokes=pg.strokes.filter(s=>!rem.has(s));pg.texts=(pg.texts||[]).filter(t=>!op.tRem.includes(t)).concat(op.tAdd);
  renderPage(pg);renderTexts(pg);pushUndo(op);schedulePageSave(pg);
  if(!auto)toast(n===1?'1 linha convertida. Para corrigir, use a ferramenta de texto e toque nela.':n+' linhas convertidas. Para corrigir, use a ferramenta de texto e toque nelas.',4500);
}
function hwrDialog(){
  if(!(window.claude&&window.claude.use)){
    const m=modal(`<h2>Escrita para texto</h2><p>Para transformar sua letra em texto, use a ferramenta <b>T</b>: toque na folha e escreva com a caneta por cima da caixa. O Rabiscar do iPad converte na hora, sem internet e sem abrir o teclado.</p>
      <div class="field"><span>Fonte do texto</span><div class="chips" id="hf">${FONTS.map(f=>`<button class="chip" data-f="${f.id}" aria-pressed="${S.hwr.font===f.id}" style="font-family:${f.css.replace(/"/g,"'")};font-size:16px">${f.n}</button>`).join('')}</div></div>
      <small class="hint">No iPad: Ajustes › Apple Pencil › Rabiscar precisa estar ligado.</small>
      <div class="actions"><button class="btn primary" data-ok>Pronto</button></div>`,()=>savePrefs());
    m.el.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.hwr.font=b.dataset.f;m.el.querySelectorAll('[data-f]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
    m.el.querySelector('[data-ok]').onclick=m.close;return;
  }
  const h=S.hwr;
  const m=modal(`<h2>Escrita para texto</h2><p>Você escreve à mão e, depois de uma pausa, o Claude lê a linha e troca por texto digitado no mesmo lugar.</p>
    <div class="field"><span>Conversão automática</span><div class="chips"><button class="chip" data-auto="1" aria-pressed="${h.auto}">Ligada</button><button class="chip" data-auto="0" aria-pressed="${!h.auto}">Desligada</button></div></div>
    <div class="field"><span>Esperar depois de parar de escrever</span><div class="range"><input type="range" id="hw" min="1" max="6" step=".5" value="${h.wait}" aria-label="Tempo de espera"><output id="hwv">${h.wait.toString().replace('.',',')} s</output></div>
      <small class="hint">Se você voltar a escrever antes desse tempo, ele recomeça a contar. Aumente se a conversão estiver começando no meio da frase.</small></div>
    <div class="field"><span>Fonte do texto</span><div class="chips" id="hf">${FONTS.map(f=>`<button class="chip" data-f="${f.id}" aria-pressed="${h.font===f.id}" style="font-family:${f.css.replace(/"/g,"'")};font-size:16px">${f.n}</button>`).join('')}</div></div>
    <div class="field"><span>Leitura</span><div class="chips"><button class="chip" data-p="0" aria-pressed="${!h.precise}">Rápida</button><button class="chip" data-p="1" aria-pressed="${h.precise}">Mais precisa (mais lenta)</button></div>
      <small class="hint">A imagem da sua escrita é enviada para o Claude ler. Isso usa um pouco do seu plano do Claude.</small></div>
    <div class="actions"><button class="btn" data-now>Converter esta página agora</button><button class="btn primary" data-ok>Pronto</button></div>`,()=>{savePrefs();if(!S.hwr.auto){clearTimeout(hwrT);pending.clear()}});
  const r=m.el;const pressGroup=(sel,el)=>r.querySelectorAll(sel).forEach(x=>x.setAttribute('aria-pressed',x===el));
  r.querySelectorAll('[data-auto]').forEach(b=>b.onclick=()=>{h.auto=b.dataset.auto==='1';pressGroup('[data-auto]',b)});
  r.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{h.font=b.dataset.f;pressGroup('[data-f]',b)});
  r.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{h.precise=b.dataset.p==='1';pressGroup('[data-p]',b)});
  const w=r.querySelector('#hw');w.oninput=()=>{h.wait=+w.value;r.querySelector('#hwv').textContent=String(h.wait).replace('.',',')+' s'};
  r.querySelector('[data-ok]').onclick=m.close;
  r.querySelector('[data-now]').onclick=()=>{m.close();convertPage()};
}
function convertPage(){const pg=S.pages[S.cur];if(!pg)return;const list=pg.strokes.filter(s=>s.k!=='hl');if(!list.length){toast('Esta página não tem escrita para converter.');return}
  toast('Lendo a escrita desta página…',3000);convertStrokes(pg,list,false)}

/* ---------- Seleção (laço) e edição ----------
   O laço pega os traços com a maior parte dos pontos dentro dele e os textos
   cujo centro está dentro. Um risco quase reto vira um retângulo de seleção.
   Mover e redimensionar recalculam os pontos: o resultado continua vetorial. */
S.sel=null;S.clip=null;S.gest={scratch:true,loop:true};
function pip(poly,x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c}return c}
function enclosed(pg,poly){
  const strokes=pg.strokes.filter(s=>{const st=s.s||2,p=s.p,n=p.length/st;let inside=0;for(let i=0;i<n;i++)if(pip(poly,p[i*st],p[i*st+1]))inside++;return n>0&&inside>=n*.5});
  const texts=(pg.texts||[]).filter(t=>{const b=textBox(pg,t);return pip(poly,(b[0]+b[2])/2,(b[1]+b[3])/2)});
  return {strokes,texts};
}
function selBounds(pg,strokes,texts){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  const add=b=>{x0=Math.min(x0,b[0]);y0=Math.min(y0,b[1]);x1=Math.max(x1,b[2]);y1=Math.max(y1,b[3])};
  strokes.forEach(s=>add(Ink.geom(s).box));texts.forEach(t=>add(textBox(pg,t)));return [x0,y0,x1,y1]}
function setSel(pg,strokes,texts){
  clearSel();if(!strokes.length&&!texts.length)return false;
  S.sel={pg,strokes,texts,box:selBounds(pg,strokes,texts)};drawSel();showSelbar();return true;
}
function clearSel(){if(!S.sel)return;const el=S.sel.pg.el&&S.sel.pg.el.querySelector('.selbox');if(el)el.remove();S.sel=null;$('#selbar').hidden=true}
const SELPAD=8;
function drawSel(){
  const {pg,box}=S.sel;let el=pg.el.querySelector('.selbox');
  if(!el){el=document.createElement('div');el.className='selbox';el.innerHTML='<span class="selh" aria-label="Redimensionar"></span>';pg.el.appendChild(el)}
  Object.assign(el.style,{left:((box[0]-SELPAD)/LW*100)+'%',top:((box[1]-SELPAD)/LH*100)+'%',width:((box[2]-box[0]+SELPAD*2)/LW*100)+'%',height:((box[3]-box[1]+SELPAD*2)/LH*100)+'%',transform:''});
  el.querySelectorAll('.selimg').forEach(c=>c.remove());
}
function selHit(e){
  if(!S.sel)return null;if(e.target.closest('.selh'))return 'resize';
  const pageEl=e.target.closest('.page');if(!pageEl||pageEl._pg!==S.sel.pg)return null;
  const [x,y]=toLocal(S.sel.pg,e),b=S.sel.box;return x>=b[0]-SELPAD&&x<=b[2]+SELPAD&&y>=b[1]-SELPAD&&y<=b[3]+SELPAD?'move':null;
}
function beginSelDrag(e,mode){
  e.preventDefault();try{sc.setPointerCapture(e.pointerId)}catch(_){}
  const sel=S.sel,pg=sel.pg,[x,y]=toLocal(pg,e),b=sel.box,k=pg.base.width/LW;
  const el=pg.el.querySelector('.selbox');
  const cv=document.createElement('canvas');cv.className='selimg';
  cv.width=Math.max(1,Math.ceil((b[2]-b[0]+SELPAD*2)*k));cv.height=Math.max(1,Math.ceil((b[3]-b[1]+SELPAD*2)*k));
  const c=cv.getContext('2d');for(const s of sel.strokes)Ink.draw(c,s,k,b[0]-SELPAD,b[1]-SELPAD);drawTexts(c,k,sel.texts,b[0]-SELPAD,b[1]-SELPAD);
  el.appendChild(cv);
  const hide=new Set(sel.strokes);const ctx=pg.base.getContext('2d');ctx.setTransform(1,0,0,1,0,0);
  renderInto(ctx,k,[],S.nb.paper,S.nb.tone,null,null,pg.background);renderInkSvg(pg,hide);pg.dirty=true;
  pg.el.querySelectorAll('.tbox').forEach(d=>{if(sel.texts.includes(d._t))d.style.visibility='hidden'});
  const u=pg.el.offsetWidth/LW;el.style.transformOrigin=(SELPAD*u)+'px '+(SELPAD*u)+'px';
  act={pid:e.pointerId,pg,pen:e.pointerType==='pen',seld:true,mode,x0:x,y0:y,dx:0,dy:0,sc:1,u};
}
function moveSelDrag(e){
  const a=act,[x,y]=toLocal(a.pg,e),b=S.sel.box,el=a.pg.el.querySelector('.selbox');
  if(a.mode==='move'){a.dx=x-a.x0;a.dy=y-a.y0;el.style.transform=`translate(${a.dx*a.u}px,${a.dy*a.u}px)`}
  else{a.sc=clamp(((x-b[0])+(y-b[1]))/Math.max(4,(b[2]-b[0])+(b[3]-b[1])),.2,5);el.style.transform=`scale(${a.sc})`}
}
function endSelDrag(a){
  const b=S.sel.box;
  if(Math.abs(a.dx)<.5&&Math.abs(a.dy)<.5&&Math.abs(a.sc-1)<.01){renderPage(a.pg);renderTexts(a.pg);drawSel();return}
  const ox=b[0],oy=b[1],sc=a.sc,dx=a.dx,dy=a.dy;
  const f=(x,y)=>[ox+(x-ox)*sc+dx,oy+(y-oy)*sc+dy];
  replaceSel(s=>mapStroke(s,f,sc),t=>{const [nx,ny]=f(t.x,t.y);return {...t,id:uid(),x:nx,y:ny,fs:Math.round(t.fs*sc*10)/10,lh:t.lh?t.lh*sc:undefined,w:Math.min(LW-nx-4,t.w*sc),src:t.src?t.src.map(s=>mapStroke(s,f,sc)):undefined}});
}
function mapStroke(s,f,sc){const st=s.s||2,p=s.p.slice();for(let i=0;i<p.length;i+=st){const q=f(p[i],p[i+1]);p[i]=Math.round(q[0]*10)/10;p[i+1]=Math.round(q[1]*10)/10}
  const o={...s,id:uid(),p,w:Math.round(s.w*sc*100)/100};delete o._live;return o}
/* Troca os itens selecionados por novos (mover, redimensionar, recolorir, duplicar) num só passo de desfazer */
function replaceSel(fnS,fnT,keepOld){
  const sel=S.sel,pg=sel.pg,op={pg:pg.id,added:[],removed:[],tAdd:[],tRem:[]};
  const ns=sel.strokes.map(fnS),nt=sel.texts.map(fnT);
  if(!keepOld){for(const s of sel.strokes)op.removed.push({s,i:pg.strokes.indexOf(s)});op.removed.sort((a,b)=>a.i-b.i);op.tRem=sel.texts.slice();
    const rem=new Set(sel.strokes);pg.strokes=pg.strokes.filter(s=>!rem.has(s));pg.texts=(pg.texts||[]).filter(t=>!sel.texts.includes(t))}
  op.added=ns;op.tAdd=nt;pg.strokes=pg.strokes.concat(ns);pg.texts=(pg.texts||[]).concat(nt);
  renderPage(pg);renderTexts(pg);pushUndo(op);schedulePageSave(pg);setSel(pg,ns,nt);
}
function deleteSel(){
  const sel=S.sel,pg=sel.pg,op={pg:pg.id,added:[],removed:[],tAdd:[],tRem:sel.texts.slice()};
  for(const s of sel.strokes)op.removed.push({s,i:pg.strokes.indexOf(s)});op.removed.sort((a,b)=>a.i-b.i);
  const rem=new Set(sel.strokes);pg.strokes=pg.strokes.filter(s=>!rem.has(s));pg.texts=(pg.texts||[]).filter(t=>!sel.texts.includes(t));
  clearSel();renderPage(pg);renderTexts(pg);pushUndo(op);schedulePageSave(pg);
}
function copySel(){const sel=S.sel;S.clip={strokes:sel.strokes.map(s=>({...s,p:s.p.slice()})),texts:sel.texts.map(t=>({...t})),n:0};toast('Copiado. Para colar, use ⋯ › Colar ou o botão Colar.')}
function pasteClip(){
  if(!S.clip)return;const pg=S.pages[S.cur];if(!pg)return;
  S.clip.n++;const d=24*S.clip.n,f=(x,y)=>[x+d,y+d];
  const ns=S.clip.strokes.map(s=>mapStroke(s,f,1)),nt=S.clip.texts.map(t=>({...t,id:uid(),x:t.x+d,y:t.y+d}));
  pg.strokes=pg.strokes.concat(ns);pg.texts=(pg.texts||[]).concat(nt);
  renderPage(pg);renderTexts(pg);pushUndo({pg:pg.id,added:ns,removed:[],tAdd:nt,tRem:[]});schedulePageSave(pg);setSel(pg,ns,nt);
}
function showSelbar(){
  const b=$('#selbar'),sel=S.sel;
  b.innerHTML=`<span class="selcount">${sel.strokes.length+sel.texts.length} ${sel.strokes.length+sel.texts.length===1?'item':'itens'}</span><span class="sep"></span>
    <button class="btn" data-sa="dup">Duplicar</button><button class="btn" data-sa="copy">Copiar</button>${S.clip?'<button class="btn" data-sa="paste">Colar</button>':''}
    ${sel.strokes.length&&HAS_CLAUDE?'<button class="btn" data-sa="conv">Converter em texto</button>':''}<span class="sep"></span>
    ${QUICK_COLORS.map(([c,n])=>`<button class="swatch" style="--sw:${c}" data-sc="${c}" aria-label="Pintar de ${n.toLowerCase()}" title="${n}"></button>`).join('')}<span class="sep"></span>
    <button class="tool" data-sa="del" aria-label="Excluir seleção" title="Excluir">${ico('trash',20)}</button><button class="tool" data-sa="close" aria-label="Fechar seleção" title="Fechar">${ico('close',20)}</button>`;
  b.hidden=false;
  b.querySelectorAll('[data-sa]').forEach(x=>x.onclick=()=>{const a=x.dataset.sa;
    if(a==='dup')replaceSel(s=>mapStroke(s,(x,y)=>[x+24,y+24],1),t=>({...t,id:uid(),x:t.x+24,y:t.y+24}),true);
    else if(a==='copy'){copySel();showSelbar()}
    else if(a==='paste')pasteClip();
    else if(a==='conv'){const pg=S.sel.pg,list=S.sel.strokes.slice();clearSel();toast('Lendo a escrita selecionada…',3000);convertStrokes(pg,list,false)}
    else if(a==='del')deleteSel();
    else clearSel();
  });
  b.querySelectorAll('[data-sc]').forEach(x=>x.onclick=()=>{const c=x.dataset.sc;replaceSel(s=>({...s,id:uid(),c:s.k==='hl'?s.c:c}),t=>({...t,id:uid(),c}))});
}
/* Laço desenhado */
function drawLasso(a){
  liveClear();const c=liveCv.getContext('2d'),k=liveCv.width/LW;c.save();c.setLineDash([6,5]);c.lineWidth=1.6;c.strokeStyle='#2343a8';
  c.beginPath();a.pts.forEach((q,i)=>i?c.lineTo(q[0]*k,q[1]*k):c.moveTo(q[0]*k,q[1]*k));c.stroke();c.restore();
}
function finishLasso(a){
  liveClear();const P=a.pts;if(P.length<2)return;
  let L=0;for(let i=1;i<P.length;i++)L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);
  const D=Math.hypot(P[P.length-1][0]-P[0][0],P[P.length-1][1]-P[0][1]);
  let poly=P;
  if(D>L*.6){const [x0,y0]=P[0],[x1,y1]=P[P.length-1];poly=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]]}
  const f=enclosed(a.pg,poly);
  if(!setSel(a.pg,f.strokes,f.texts))toast('Nada foi selecionado. Desenhe o laço em volta do que quer pegar.');
}

/* ---------- Gestos da caneta ----------
   Riscar em zigue-zague por cima de algo apaga o que estava embaixo.
   Fazer uma volta fechada em torno de algo e segurar a caneta parada seleciona. */
function reversals(v,thr){let cnt=0,dir=0,ext=v[0];
  for(const x of v){if(dir===0){if(x-ext>thr){dir=1;ext=x}else if(ext-x>thr){dir=-1;ext=x}}
    else if(dir>0){if(x>ext)ext=x;else if(ext-x>thr){cnt++;dir=-1;ext=x}}
    else{if(x<ext)ext=x;else if(x-ext>thr){cnt++;dir=1;ext=x}}}
  return cnt}
let scratchHinted=false;
function tryScratch(pg,st){
  if(!S.gest.scratch||!['esfero','fina','tinteiro'].includes(st.k))return false;
  const s=st.s||2,p=st.p,n=p.length/s;if(n<14)return false;
  const xs=[],ys=[];let L=0;for(let i=0;i<n;i++){xs.push(p[i*s]);ys.push(p[i*s+1]);if(i)L+=Math.hypot(xs[i]-xs[i-1],ys[i]-ys[i-1])}
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),w=x1-x0,h=y1-y0,diag=Math.hypot(w,h);
  if(diag<12||L<diag*3)return false;
  const rx=reversals(xs,w*.45),ry=reversals(ys,h*.45);
  if(!(rx>=3||ry>=4))return false;
  const inBox=(x,y)=>x>=x0-3&&x<=x1+3&&y>=y0-3&&y<=y1+3;
  const victims=pg.strokes.filter(o=>{const os=o.s||2,op=o.p,on=op.length/os;let c=0;for(let i=0;i<on;i++)if(inBox(op[i*os],op[i*os+1]))c++;return on>0&&c>=on*.4});
  const tv=(pg.texts||[]).filter(t=>{const b=textBox(pg,t);return inBox((b[0]+b[2])/2,(b[1]+b[3])/2)});
  if(!victims.length&&!tv.length)return false;
  const op={pg:pg.id,added:[],removed:victims.map(v=>({s:v,i:pg.strokes.indexOf(v)})).sort((a,b)=>a.i-b.i),tAdd:[],tRem:tv};
  const rem=new Set(victims);pg.strokes=pg.strokes.filter(o=>!rem.has(o));pg.texts=(pg.texts||[]).filter(t=>!tv.includes(t));
  renderPage(pg);renderTexts(pg);pushUndo(op);schedulePageSave(pg);
  if(!scratchHinted){scratchHinted=true;toast('Apagado com o zigue-zague. Se não era isso, toque em desfazer.',4000)}
  return true;
}
let loopHinted=false;
function tryLoopSelect(a){
  if(act!==a||!S.gest.loop||a.st.k==='hl')return;
  const s=a.st.s||2,p=a.st.p,n=p.length/s;if(n<10)return;
  const pts=[];for(let i=0;i<n;i++)pts.push([p[i*s],p[i*s+1]]);
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const q of pts){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}
  const diag=Math.hypot(x1-x0,y1-y0);if(diag<30)return;
  if(Math.hypot(pts[n-1][0]-pts[0][0],pts[n-1][1]-pts[0][1])>Math.max(18,diag*.22))return;
  const f=enclosed(a.pg,pts);if(!f.strokes.length&&!f.texts.length)return;
  act=null;if(liveF){cancelAnimationFrame(liveF);liveF=0}liveClear();if(a.pen)penUpAt=performance.now();
  setSel(a.pg,f.strokes,f.texts);
  if(!loopHinted){loopHinted=true;toast('Selecionado. Levante a caneta e arraste para mover.',3500)}
}
function gestDialog(){
  const g=S.gest;
  const m=modal(`<h2>Gestos da caneta</h2><p>Atalhos feitos com a própria caneta, sem trocar de ferramenta.</p>
    <div class="field"><span>Riscar em zigue-zague apaga</span><div class="chips"><button class="chip" data-g="scratch" data-v="1" aria-pressed="${g.scratch}">Ligado</button><button class="chip" data-g="scratch" data-v="0" aria-pressed="${!g.scratch}">Desligado</button></div>
      <small class="hint">Rabisque para lá e para cá por cima de uma palavra e ela some. Sombreados em área vazia continuam sendo desenho.</small></div>
    <div class="field"><span>Circular e segurar seleciona</span><div class="chips"><button class="chip" data-g="loop" data-v="1" aria-pressed="${g.loop}">Ligado</button><button class="chip" data-g="loop" data-v="0" aria-pressed="${!g.loop}">Desligado</button></div>
      <small class="hint">Faça uma volta em torno do que quer pegar e segure a caneta parada por meio segundo antes de levantar.</small></div>
    <div class="actions"><button class="btn primary" data-ok>Pronto</button></div>`,()=>savePrefs());
  m.el.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{g[b.dataset.g]=b.dataset.v==='1';m.el.querySelectorAll(`[data-g="${b.dataset.g}"]`).forEach(x=>x.setAttribute('aria-pressed',x===b))});
  m.el.querySelector('[data-ok]').onclick=m.close;
}

function joinKind(b,w,lh){
  const midY=(b[1]+b[3])/2;
  if(midY>=w[3]-lh*1.2&&midY<=w[3]+lh*.2&&b[0]>w[0]+lh*.5&&b[0]-w[2]<=lh*6)return 'same';
  if(b[1]>=w[3]-lh*.3&&b[1]<=w[3]+lh*1.6&&b[0]<=w[0]+lh*3&&b[2]>=w[0])return 'next';
  return null}

/* ---------- Fita (washi) ----------
   Fica por cima de tudo na página, inclusive do texto digitado, para esconder
   respostas na hora de estudar. Um toque na fita levanta (deixa ver o que está
   embaixo) e outro toque põe de volta. Fitas levantadas voltam ao abrir o caderno. */
const TAPE_COLORS=[['#a7d8f5','Azul-claro'],['#b5ecf2','Água'],['#e3f7b5','Limão'],['#ffe58a','Amarelo'],['#fde0c8','Pêssego'],['#fbd3df','Rosa'],
  ['#e7c6f7','Lilás'],['#d9c8e8','Lavanda'],['#9fd6dc','Turquesa'],['#c8102e','Vermelho'],['#3a3e47','Grafite']];
S.tape={mode:'traco',w:30,pat:'listras',c:'#a7d8f5'};
const revealed=new Set();
function tapeSVG(t,rev){
  const op=rev?.16:(Ink.TAPE_ALPHA[t.pat]||1),pid='tp'+t.id,c=t.c;
  let def='';
  if(t.pat==='listras')def=`<pattern id="${pid}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="14" height="14" fill="${c}"/><rect width="4" height="14" fill="rgba(255,255,255,.7)"/></pattern>`;
  if(t.pat==='bolinhas')def=`<pattern id="${pid}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${c}"/><circle cx="3.5" cy="3.5" r="1.8" fill="rgba(255,255,255,.85)"/><circle cx="10.5" cy="10.5" r="1.8" fill="rgba(255,255,255,.85)"/></pattern>`;
  const paint=def?`url(#${pid})`:c,p=t.p;let shape;
  if(t.mode==='ret'){const x=Math.min(p[0],p[2]),y=Math.min(p[1],p[3]);shape=`<rect x="${x}" y="${y}" width="${Math.abs(p[2]-p[0])}" height="${Math.abs(p[3]-p[1])}" fill="${paint}"/>`}
  else{let d=`M${p[0]} ${p[1]}`;const n=p.length/2;
    if(n===1)d+=` L${p[0]+.01} ${p[1]}`;
    for(let i=1;i<n-1;i++){const mx=(p[i*2]+p[i*2+2])/2,my=(p[i*2+1]+p[i*2+3])/2;d+=` Q${p[i*2]} ${p[i*2+1]} ${mx} ${my}`}
    if(n>1)d+=` L${p[(n-1)*2]} ${p[(n-1)*2+1]}`;
    shape=`<path d="${d}" fill="none" stroke="${paint}" stroke-width="${t.w}" stroke-linecap="butt" stroke-linejoin="round"/>`}
  const outline=rev?(t.mode==='ret'?shape.replace(/fill="[^"]+"/,'fill="none" stroke="#2343a8" stroke-width="1.2" stroke-dasharray="5 4"'):''):'';
  return `${def?`<defs>${def}</defs>`:''}<g opacity="${op}">${shape}</g>${outline}`;
}
function renderTapes(pg,extra){
  const svg=pg.el.querySelector('.tapes');if(!svg)return;
  const list=(pg.tapes||[]).concat(extra?[extra]:[]);
  svg.innerHTML=list.map(t=>tapeSVG(t,revealed.has(t.id)&&t!==extra)).join('');
}
function tapeAt(pg,x,y){
  for(const t of (pg.tapes||[]).slice().reverse()){const p=t.p;
    if(t.mode==='ret'){if(x>=Math.min(p[0],p[2])&&x<=Math.max(p[0],p[2])&&y>=Math.min(p[1],p[3])&&y<=Math.max(p[1],p[3]))return t;continue}
    const n=p.length/2;for(let i=0;i<n;i++){const ax=p[i*2],ay=p[i*2+1],bx=i+1<n?p[i*2+2]:ax,by=i+1<n?p[i*2+3]:ay;if(segDist(x,y,ax,ay,bx,by)<t.w/2)return t}}
  return null;
}
function toggleTape(pg,t){if(revealed.has(t.id))revealed.delete(t.id);else revealed.add(t.id);renderTapes(pg)}
function setAllTapes(show){for(const pg of S.pages)for(const t of pg.tapes||[]){if(show)revealed.add(t.id);else revealed.delete(t.id)}S.pages.forEach(pg=>renderTapes(pg))}
function startTape(e,pg,x,y,isPen){
  const T=S.tape;act={pid:e.pointerId,pg,pen:isPen,tape:true,t:{id:uid(),mode:T.mode,w:T.w,pat:T.pat,c:T.c,p:[Math.round(x),Math.round(y)]}};
  if(T.mode!=='traco')act.t.p.push(Math.round(x),Math.round(y));renderTapes(pg,act.t);
}
function moveTape(e){
  const a=act,[x,y]=toLocal(a.pg,e),p=a.t.p;
  if(a.t.mode==='traco'){const n=p.length;if(Math.hypot(x-p[n-2],y-p[n-1])<3)return;p.push(Math.round(x),Math.round(y))}
  else{p[2]=Math.round(x);p[3]=Math.round(y)}
  renderTapes(a.pg,a.t);
}
function endTape(a){
  const p=a.t.p;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let i=0;i<p.length;i+=2){x0=Math.min(x0,p[i]);x1=Math.max(x1,p[i]);y0=Math.min(y0,p[i+1]);y1=Math.max(y1,p[i+1])}
  if(Math.hypot(x1-x0,y1-y0)<6){const hit=tapeAt(a.pg,p[0],p[1]);if(hit)toggleTape(a.pg,hit);else renderTapes(a.pg);return}
  a.pg.tapes=(a.pg.tapes||[]).concat(a.t);renderTapes(a.pg);
  pushUndo({pg:a.pg.id,added:[],removed:[],tAdd:[],tRem:[],tpAdd:[a.t],tpRem:[]});schedulePageSave(a.pg);
}
function tapeDialog(){
  const T=S.tape;
  const sw=(pat)=>{const t={id:'pv'+pat,mode:'ret',w:20,pat,c:T.c,p:[0,0,120,34]};return `<svg viewBox="0 0 120 34" width="92" height="26" aria-hidden="true">${tapeSVG(t,false)}</svg>`};
  const render=()=>`<h2>Fita</h2><p>Cubra palavras ou respostas. Um toque na fita levanta e mostra o que está embaixo; outro toque cobre de novo.</p>
    <div class="field"><span>Tipo</span><div class="chips">${[['traco','Traço'],['reta','Linha reta'],['ret','Retângulo']].map(([v,n])=>`<button class="chip" data-tm="${v}" aria-pressed="${T.mode===v}">${n}</button>`).join('')}</div></div>
    <div class="field"><span>Espessura</span><div class="range"><input type="range" id="tw" min="10" max="80" step="1" value="${T.w}" aria-label="Espessura da fita"><output id="twv">${T.w}</output></div></div>
    <div class="field"><span>Padrão</span><div class="chips">${[['lisa','Lisa'],['listras','Listrada'],['bolinhas','Bolinhas']].map(([v,n])=>`<button class="chip tapechip" data-tp="${v}" aria-pressed="${T.pat===v}">${sw(v)}<span>${n}</span></button>`).join('')}</div></div>
    <div class="field"><span>Cor</span><div class="opts sm">${TAPE_COLORS.map(([c,n])=>`<button class="copt" style="--c:${c}" data-tc="${c}" aria-pressed="${T.c===c}" aria-label="${n}" title="${n}"></button>`).join('')}</div></div>
    <div class="field"><span>Todas as fitas deste caderno</span><div class="chips"><button class="chip" data-all="0">Cobrir todas</button><button class="chip" data-all="1">Levantar todas</button></div></div>
    <div class="actions"><button class="btn primary" data-ok>Pronto</button></div>`;
  const m=modal(render(),()=>savePrefs());const dlg=m.el.querySelector('.dialog');
  const wire=()=>{
    dlg.querySelectorAll('[data-tm]').forEach(b=>b.onclick=()=>{T.mode=b.dataset.tm;dlg.innerHTML=render();wire()});
    dlg.querySelectorAll('[data-tp]').forEach(b=>b.onclick=()=>{T.pat=b.dataset.tp;dlg.innerHTML=render();wire()});
    dlg.querySelectorAll('[data-tc]').forEach(b=>b.onclick=()=>{T.c=b.dataset.tc;dlg.innerHTML=render();wire()});
    const w=dlg.querySelector('#tw');w.oninput=()=>{T.w=+w.value;dlg.querySelector('#twv').textContent=w.value};
    dlg.querySelectorAll('[data-all]').forEach(b=>b.onclick=()=>{setAllTapes(b.dataset.all==='1');toast(b.dataset.all==='1'?'Todas as fitas levantadas.':'Todas as fitas cobrindo de novo.')});
    dlg.querySelector('[data-ok]').onclick=m.close;
  };wire();
}

/* ---------- Caneta laser ----------
   Traço vermelho com brilho, para apontar ou explicar. Some sozinho pouco
   depois que você levanta a caneta e nunca é salvo. */
const laserCv=document.createElement('canvas');laserCv.className='laser';
const lasers=[];let laserF=0;
function attachLaser(pg){
  if(laserCv.parentNode!==pg.el)pg.el.insertBefore(laserCv,pg.el.querySelector('.pnum'));
  if(laserCv.width!==pg.px){laserCv.width=pg.px;laserCv.height=Math.round(pg.px*LH/LW)}
  laserCv._pg=pg;
}
function laserLoop(){
  laserF=0;const c=laserCv.getContext('2d'),k=laserCv.width/LW,now=performance.now();
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,laserCv.width,laserCv.height);
  for(let i=lasers.length-1;i>=0;i--){const L=lasers[i];if(L.end&&now-L.end>1700)lasers.splice(i,1)}
  for(const L of lasers){
    if(L.pg!==laserCv._pg||L.pts.length<2)continue;
    const fade=L.end?clamp(1-(now-L.end-1100)/600,0,1):1;if(fade<=0)continue;
    c.save();c.globalAlpha=fade;c.lineCap='round';c.lineJoin='round';c.setTransform(k,0,0,k,0,0);
    const path=new Path2D();path.moveTo(L.pts[0][0],L.pts[0][1]);for(let j=1;j<L.pts.length;j++){const a=L.pts[j-1],b=L.pts[j];path.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2)}
    c.shadowColor='rgba(255,70,110,.95)';c.shadowBlur=14*k;c.strokeStyle='rgba(255,120,150,.55)';c.lineWidth=9;c.stroke(path);
    c.shadowBlur=6*k;c.strokeStyle='#e0102f';c.lineWidth=3.2;c.stroke(path);
    c.shadowBlur=0;c.strokeStyle='rgba(255,235,240,.9)';c.lineWidth=1;c.stroke(path);
    c.restore();
  }
  if(lasers.length)laserF=requestAnimationFrame(laserLoop);
}
function kickLaser(){if(!laserF)laserF=requestAnimationFrame(laserLoop)}

/* ---------- Desfazer ---------- */
function pushUndo(op){S.undo.push(op);if(S.undo.length>200)S.undo.shift();S.redo=[];updUndo()}
function applyOp(op,reverse){
  const pg=S.pages.find(p=>p.id===op.pg);if(!pg)return;
  const add=reverse?op.removed:op.added.map(s=>({s,i:-1}));
  const rem=reverse?op.added:op.removed.map(r=>r.s);
  pg.strokes=pg.strokes.filter(s=>!rem.includes(s));
  for(const r of add){if(r.i>=0&&r.i<=pg.strokes.length)pg.strokes.splice(r.i,0,r.s);else pg.strokes.push(r.s)}
  const padd=reverse?(op.tpRem||[]):(op.tpAdd||[]),prem=reverse?(op.tpAdd||[]):(op.tpRem||[]);
  if(padd.length||prem.length){pg.tapes=(pg.tapes||[]).filter(t=>!prem.includes(t)).concat(padd);renderTapes(pg)}
  const tadd=reverse?(op.tRem||[]):(op.tAdd||[]),trem=reverse?(op.tAdd||[]):(op.tRem||[]);
  if(tadd.length||trem.length){pg.texts=(pg.texts||[]).filter(t=>!trem.includes(t)).concat(tadd);renderTexts(pg)}
  renderPage(pg);schedulePageSave(pg);
  const r=pg.el.getBoundingClientRect(),sr=sc.getBoundingClientRect();if(r.bottom<sr.top||r.top>sr.bottom)pg.el.scrollIntoView({block:'center'});
}
function undo(){if(editing)finishEdit();clearSel();const op=S.undo.pop();if(!op)return;applyOp(op,true);S.redo.push(op);updUndo()}
function redo(){clearSel();const op=S.redo.pop();if(!op)return;applyOp(op,false);S.undo.push(op);updUndo()}

/* ---------- Páginas ---------- */
function addPage(after){
  if(S.loading||!S.nb)return;
  const pg={id:uid(),nb:S.nb.id,strokes:[],texts:[],tapes:[],dirty:true,el:null};
  S.pages.splice(after+1,0,pg);S.nb.pages.splice(after+1,0,pg.id);
  const ref=S.pages[after+2]?S.pages[after+2].el:$('#pages .add-page');
  $('#pages').insertBefore(makePageEl(pg),ref);numberPages();layout();
  enqueue('pg:'+pg.id,()=>Store.writePage(pg.id,{nb:S.nb.id,strokes:[],texts:[]}));saveNotebook(S.nb);
  pg.el.scrollIntoView({block:'start',behavior:'smooth'});
}
function deletePage(i){
  if(S.loading||!S.nb)return;closeFocus();
  const pg=S.pages[i];
  if(S.pages.length===1){
    confirmDialog('Limpar esta página?','É a única página do caderno, então ela fica em branco em vez de ser removida.','Limpar',()=>{
      const rem=pg.strokes.map((s,j)=>({s,i:j}));const tr=(pg.texts||[]).slice(),tp=(pg.tapes||[]).slice();pg.strokes=[];pg.texts=[];pg.tapes=[];renderPage(pg);renderTexts(pg);renderTapes(pg);pushUndo({pg:pg.id,added:[],removed:rem,tRem:tr,tpRem:tp});schedulePageSave(pg)});return;
  }
  confirmDialog(`Apagar a página ${i+1}?`,'Tudo o que está escrito nela será apagado. Isso não pode ser desfeito.','Apagar página',()=>{
    clearTimeout(pageTimers[pg.id]);delete pageTimers[pg.id];
    S.pages.splice(i,1);S.nb.pages.splice(i,1);pg.el.remove();
    S.undo=S.undo.filter(o=>o.pg!==pg.id);S.redo=S.redo.filter(o=>o.pg!==pg.id);updUndo();
    numberPages();layout();saveNotebook(S.nb);
    enqueue('pg:'+pg.id,()=>Store.deletePage(pg.id));toast('Página apagada.');
  });
}
function paperDialog(){
  const cur={paper:S.nb.paper,tone:S.nb.tone};
  const m=modal(`<h2>Trocar papel</h2><p>Vale para todas as páginas deste caderno. O que você escreveu não muda.</p>${pickerHTML(cur)}<div class="actions"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Aplicar</button></div>`);
  wirePicker(m.el,cur);m.el.querySelector('[data-x]').onclick=m.close;
  m.el.querySelector('[data-ok]').onclick=()=>{m.close();S.nb.paper=cur.paper;S.nb.tone=cur.tone;S.pages.forEach(p=>p.dirty=true);renderVisible();saveNotebook(S.nb)};
}

/* ---------- Exportar PDF ---------- */
let dlP=null;
/* Entregar um arquivo: dentro do Claude pela janela de salvar dele; fora, como
   download normal do navegador (no iPad abre a opção de salvar em Arquivos). */
async function saveFile(name,blob){
  if(window.claude&&window.claude.use){if(!dlP)dlP=window.claude.use('downloads');const dl=await dlP;if(dl){await dl.save({filename:name,data:blob});return}}
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}

/* ---------- Backup ----------
   Um arquivo .json com todos os cadernos, páginas e ajustes. Restaurar só
   acrescenta: nunca apaga nem substitui um caderno seu; se já existir um com o
   mesmo nome e conteúdo diferente, o do backup entra como cópia. */
async function exportBackup(){
  toast('Juntando seus cadernos…',8000);
  try{await drainSaves();
    const nbs=await Store.listNotebooks();const pages={};
    for(const nb of nbs)for(const id of nb.pages){const p=await Store.getPage(id);if(p)pages[id]=p}
    const data={app:'caderno-livre',v:1,data:new Date().toISOString(),meta:metaBody(),notebooks:nbs,pages};
    const d=new Date(),stamp=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    await saveFile('caderno-livre-backup-'+stamp+'.json',new Blob([JSON.stringify(data)],{type:'application/json'}));
    toast('Backup pronto: guarde o arquivo no app Arquivos ou no iCloud Drive.',5000);
  }catch(e){if(e&&e.code==='declined')toast('Backup cancelado.');else toast('Não consegui gerar o backup. Tente de novo.',4000)}
}
function validateBackup(data){
  if(!data||data.app!=='caderno-livre'||!Array.isArray(data.notebooks)||!data.pages||typeof data.pages!=='object')throw new Error('invalid_backup');
  const finite=v=>typeof v==='number'&&Number.isFinite(v),color=v=>/^#[0-9a-f]{6}$/i.test(v),id=v=>typeof v==='string'&&/^[a-z0-9_-]{1,159}$/i.test(v)&&!['__proto__','constructor','prototype'].includes(v);
  const seen=new Set();
  for(const nb of data.notebooks){
    if(!nb||!id(nb.id)||seen.has(nb.id)||typeof nb.title!=='string'||!Array.isArray(nb.pages)||!nb.pages.length||new Set(nb.pages).size!==nb.pages.length)throw new Error('invalid_backup');seen.add(nb.id);
    for(const key of nb.pages){
      const pg=data.pages[key];if(!id(key)||!pg||!Array.isArray(pg.strokes))throw new Error('invalid_backup');
      for(const st of pg.strokes){const stride=st.s||2;if(![2,3,5].includes(stride)||!Array.isArray(st.p)||st.p.length<stride||st.p.length%stride||!st.p.every(finite)||!finite(st.w)||st.w<=0||st.w>100||!color(st.c))throw new Error('invalid_backup')}
      for(const t of pg.texts||[]){if(!id(t.id)||typeof t.text!=='string'||!['x','y','w','fs'].every(k=>finite(t[k]))||!color(t.c))throw new Error('invalid_backup')}
      for(const t of pg.tapes||[]){if(!id(t.id)||!Array.isArray(t.p)||!t.p.length||t.p.length%2||!t.p.every(finite)||!color(t.c)||!['ret','reta','traco'].includes(t.mode)||!['lisa','listras','bolinhas'].includes(t.pat)||!finite(t.w))throw new Error('invalid_backup')}
      if(pg.background&&(!/^data:image\/(jpeg|png);base64,[a-z0-9+/=]+$/i.test(pg.background.src)||!['x','y','w','h'].every(k=>finite(pg.background[k]))))throw new Error('invalid_backup');
    }
  }
}
function importBackup(){
  const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';
  inp.onchange=async()=>{
    const f=inp.files&&inp.files[0];if(!f)return;let data;
    try{if(f.size>100*1024*1024)throw new Error('large_backup');data=JSON.parse(await f.text());validateBackup(data)}catch(e){toast('Esse arquivo não é um backup válido do Caderno Livre.',5000);return}
    const staged=[];let added=0,copies=0;
    try{
      await drainSaves();const have=await Store.listNotebooks(),ids=new Set(have.map(n=>n.id));
      for(const nb of data.notebooks){
        const exists=ids.has(nb.id),mine=have.find(n=>n.id===nb.id);if(exists&&mine.updated===nb.updated)continue;
        const target={...nb,id:exists?uid():nb.id,title:nb.title+(exists?' (backup)':''),pages:[]},pages=[];
        // Todos os IDs de página são novos, mesmo quando o caderno é novo.
        // Assim nenhum arquivo importado pode substituir uma página existente.
        for(const old of nb.pages){const pg={...data.pages[old],nb:target.id},key=uid();target.pages.push(key);pages.push([key,pg])}
        staged.push({target,pages});ids.add(target.id);if(exists)copies++;else added++;
      }
      if(Store.mode==='idb'){
        await new Promise((resolve,reject)=>{const tx=IDB.db.transaction(['nbs','pgs'],'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);for(const {target,pages} of staged){for(const [id,body] of pages)tx.objectStore('pgs').put(body,id);tx.objectStore('nbs').put(target,target.id)}});
      }else for(const {target,pages} of staged){for(const [id,body] of pages)await Store.writePage(id,body);await Store.writeNotebook(target)}
      NBS=await Store.listNotebooks();renderLibrary();toast(added||copies?`Backup restaurado: ${added} caderno(s) novo(s)${copies?`, ${copies} como cópia`:''}.`:'Todos os cadernos desse backup já estavam aqui.',5000);
    }catch(e){toast('Não consegui restaurar o backup. Confira o espaço disponível e tente novamente.',5000)}
  };inp.click();
}

function backupDialog(){
  const m=modal(`<h2>Backup</h2><p>Seus cadernos ficam guardados neste aparelho. Salve um backup de vez em quando e guarde no app Arquivos ou no iCloud Drive.</p>
    <div class="actions" style="justify-content:flex-start"><button class="btn primary" data-exp>Salvar backup</button><button class="btn" data-imp>Restaurar backup</button></div>
    <small class="hint" style="margin-top:12px">Restaurar só acrescenta: nada do que já está aqui é apagado.</small>
    <div class="actions"><button class="btn" data-x>Fechar</button></div>`);
  m.el.querySelector('[data-exp]').onclick=()=>{m.close();exportBackup()};
  m.el.querySelector('[data-imp]').onclick=()=>{m.close();importBackup()};
  m.el.querySelector('[data-x]').onclick=m.close;
}
async function exportPdf(){
  flushAll();
  if(!window.jspdf){
    toast('Carregando o gerador de PDF…',8000);
    try{await new Promise((res,rej)=>{const t=document.createElement('script');t.src='vendor/jspdf.umd.min.js';t.onload=res;t.onerror=rej;document.head.appendChild(t)})}
    catch(e){toast('O gerador de PDF não carregou. Confira a internet e tente de novo.',4500);return}
  }
  toast('Preparando o PDF…',20000);
  try{
    try{await Promise.all(FONTS.map(f=>document.fonts.load('40px '+f.css)))}catch(e){}
    const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'pt',format:'a4',compress:true});
    const cv=document.createElement('canvas');cv.width=1240;cv.height=Math.round(1240*LH/LW);const ctx=cv.getContext('2d');
    for(let i=0;i<S.pages.length;i++){const pg=S.pages[i];await loadBackground(pg.background);if(i)pdf.addPage();ctx.setTransform(1,0,0,1,0,0);renderInto(ctx,cv.width/LW,pg.strokes,S.nb.paper,S.nb.tone,pg.texts,pg.tapes,pg.background);
      pdf.addImage(cv.toDataURL('image/jpeg',0.9),'JPEG',0,0,595.28,841.89)}
    const blob=pdf.output('blob');
    const name=(S.nb.title||'Caderno').replace(/[\\/:*?"<>|]+/g,' ').trim().slice(0,80)||'Caderno';
    await saveFile(name+'.pdf',blob);toast('PDF pronto.');
  }catch(e){
    if(e&&e.code==='declined')toast('Exportação cancelada.');
    else if(e&&e.code==='rate_limited')toast('Já tem uma exportação aberta. Termine ela primeiro.');
    else toast('Não consegui gerar o PDF. Tente de novo.',4000);
  }
}

/* ---------- Menu ⋯ ---------- */
function openMenu(anchor,items){
  document.querySelectorAll('.menu').forEach(m=>m.remove());
  const m=document.createElement('div');m.className='menu';m.setAttribute('role','menu');
  m.innerHTML=items.map((it,i)=>`<button role="menuitem" data-i="${i}" class="${it.danger?'danger':''}">${ico(it.icon,20)}${esc(it.label)}</button>`).join('');
  document.body.appendChild(m);
  const r=anchor.getBoundingClientRect();
  m.style.top=(r.bottom+6)+'px';m.style.left=Math.max(10,Math.min(innerWidth-m.offsetWidth-10,r.right-m.offsetWidth))+'px';
  const close=()=>{m.remove();document.removeEventListener('pointerdown',out,true)};
  const out=e=>{if(!m.contains(e.target))close()};setTimeout(()=>document.addEventListener('pointerdown',out,true));
  m.querySelectorAll('button').forEach(b=>b.onclick=()=>{close();items[+b.dataset.i].run()});
  m.querySelector('button').focus();
}

/* ---------- Tinta vetorial, documentos e ferramentas de estudo ---------- */
const inkMarkupCache=new WeakMap(),backgrounds=new Map();
function strokeMarkup(st){
  if(!st._live&&inkMarkupCache.has(st))return inkMarkupCache.get(st);
  let markup=Ink.svg(st);
  if(markup===null){
    const b=Ink.geom(st).box,x=Math.max(0,b[0]),y=Math.max(0,b[1]),w=Math.min(LW,b[2])-x,h=Math.min(LH,b[3])-y;
    if(w<=0||h<=0)return '';
    const k=Math.min(3,Math.sqrt(6e6/(w*h))),cv=document.createElement('canvas');cv.width=Math.max(1,Math.ceil(w*k));cv.height=Math.max(1,Math.ceil(h*k));
    Ink.draw(cv.getContext('2d'),st,k,x,y);
    markup=`<image x="${x}" y="${y}" width="${cv.width/k}" height="${cv.height/k}" href="${cv.toDataURL('image/png')}"/>`;
    cv.width=cv.height=1;
  }
  if(!st._live)inkMarkupCache.set(st,markup);return markup;
}
function appendInkSvg(pg,st){const svg=pg.el.querySelector('.ink-vector');svg.insertAdjacentHTML('beforeend',strokeMarkup(st));refreshFocus()}
function renderInkSvg(pg,hide){pg.el.querySelector('.ink-vector').innerHTML=pg.strokes.filter(s=>!hide||!hide.has(s)).map(strokeMarkup).join('');refreshFocus()}
function loadBackground(bg){
  if(!bg||!bg.src)return Promise.resolve();
  if(backgrounds.has(bg.src)){const hit=backgrounds.get(bg.src);backgrounds.delete(bg.src);backgrounds.set(bg.src,hit);return hit.ready}
  const img=new Image(),entry={img};entry.ready=new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('background_failed'))});
  backgrounds.set(bg.src,entry);img.src=bg.src;
  return entry.ready.then(()=>{while(backgrounds.size>4){const [key,old]=backgrounds.entries().next().value;if(key===bg.src||!old.img.complete)break;backgrounds.delete(key);old.img.src=''}}).catch(error=>{if(backgrounds.get(bg.src)===entry)backgrounds.delete(bg.src);throw error});
}
function drawBackground(ctx,k,bg){
  if(!bg||!bg.src)return;const img=backgrounds.get(bg.src)?.img;if(!img||!img.complete||!img.naturalWidth)return;
  const w=bg.w||LW,h=bg.h||LH;ctx.drawImage(img,(bg.x||0)*k,(bg.y||0)*k,w*k,h*k);
}

function renderLibraryFilters(){
  const folder=$('#library-folder'),search=$('#library-search');if(!folder)return;
  const values=[...new Set(NBS.map(n=>n.folder).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  folder.innerHTML='<option value="">Todas as pastas</option>'+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');folder.value=libraryFilter.folder;
  if(search.value!==libraryFilter.query)search.value=libraryFilter.query;
  $('#library-favorites').setAttribute('aria-pressed',String(libraryFilter.favorites));
}
async function searchLibrary(){
  const token=++searchToken;libraryFilter.query=$('#library-search').value.trim();renderLibrary();if(!libraryFilter.query)return;
  for(const nb of NBS){
    const pages=await Promise.all(nb.pages.map(id=>Store.getPage(id)));
    if(token!==searchToken)return;
    searchContent.set(nb.id,pages.flatMap(p=>(p?.texts||[]).map(t=>t.text)).join(' '));
  }
  if(token===searchToken)renderLibrary();
}

function addFeatureTools(tray){
  const extras=[['paper','Páginas',pageNavigator],['zoom','Escrita ampliada',openFocus],['shapes','Formas automáticas',()=>{S.shapes=!S.shapes;savePrefs();buildTray();toast(S.shapes?'Desenhe e segure para ajustar a forma.':'Formas automáticas desligadas.')}]];
  for(const [icon,label,run] of extras){const b=document.createElement('button');b.className='tool';b.title=label;b.setAttribute('aria-label',label);if(icon==='shapes')b.setAttribute('aria-pressed',String(!!S.shapes));b.innerHTML=ico(icon);b.onclick=run;tray.appendChild(b)}
}

function reorderPage(from,to){
  if(from===to||to<0||to>=S.pages.length)return;flushAll();if(editing)finishEdit();clearSel();closeFocus();
  const [pg]=S.pages.splice(from,1);S.pages.splice(to,0,pg);S.nb.pages=S.pages.map(p=>p.id);
  const add=$('#pages .add-page');S.pages.forEach(p=>$('#pages').insertBefore(p.el,add));numberPages();layout();saveNotebook(S.nb);
}
function duplicatePage(index){
  if(editing)finishEdit();const source=S.pages[index],pg={...structuredClone(pageBody(source)),id:uid(),nb:S.nb.id,dirty:true,el:null};
  S.pages.splice(index+1,0,pg);S.nb.pages=S.pages.map(p=>p.id);
  $('#pages').insertBefore(makePageEl(pg),source.el.nextSibling);renderTexts(pg);renderTapes(pg);numberPages();layout();
  enqueue('pg:'+pg.id,()=>Store.writePage(pg.id,pageBody(pg)));saveNotebook(S.nb);return pg;
}
function pageNavigator(){
  if(!S.nb||S.loading)return;
  if(editing)finishEdit();const m=modal('<h2>Páginas</h2><p>Toque na miniatura para ir até a folha. Use as setas para reordenar.</p><div class="page-grid"></div><div class="actions"><button class="btn" data-add>Nova página</button><button class="btn primary" data-close>Fechar</button></div>');m.el.querySelector('.dialog').classList.add('wide-dialog');
  const grid=m.el.querySelector('.page-grid');let generation=0;
  const draw=()=>{
    const current=++generation;
    grid.innerHTML=S.pages.map((pg,i)=>`<article class="page-card"><button class="page-thumb" data-go="${i}" aria-label="Abrir página ${i+1}"><canvas width="160" height="226"></canvas><span>Página ${i+1}</span></button><div class="page-actions"><button class="icon-btn" data-up="${i}" aria-label="Mover página ${i+1} para cima" ${i===0?'disabled':''}>↑</button><button class="icon-btn" data-down="${i}" aria-label="Mover página ${i+1} para baixo" ${i===S.pages.length-1?'disabled':''}>↓</button><button class="icon-btn" data-dup="${i}" aria-label="Duplicar página ${i+1}">⧉</button><button class="icon-btn" data-del="${i}" aria-label="Apagar página ${i+1}">${ico('trash',17)}</button></div></article>`).join('');
    const previews=[...grid.querySelectorAll('canvas')].map((cv,i)=>({cv,pg:S.pages[i]}));
    (async()=>{for(const {cv,pg} of previews){if(current!==generation||!m.el.isConnected)return;await loadBackground(pg.background);if(current!==generation||!m.el.isConnected||!S.nb)return;renderInto(cv.getContext('2d'),cv.width/LW,pg.strokes,S.nb.paper,S.nb.tone,pg.texts,pg.tapes,pg.background)}})().catch(()=>toast('Uma miniatura não pôde ser carregada.'));
    grid.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const pg=S.pages[+b.dataset.go];m.close();pg.el.scrollIntoView({block:'start'});renderVisible()});
    grid.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{reorderPage(+b.dataset.up,+b.dataset.up-1);draw()});
    grid.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{reorderPage(+b.dataset.down,+b.dataset.down+1);draw()});
    grid.querySelectorAll('[data-dup]').forEach(b=>b.onclick=()=>{duplicatePage(+b.dataset.dup);draw()});
    grid.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{m.close();closeFocus();deletePage(+b.dataset.del)});
  };draw();m.el.querySelector('[data-close]').onclick=m.close;m.el.querySelector('[data-add]').onclick=()=>{addPage(S.pages.length-1);draw()};
}

/* PDF é convertido em fundo de página. As anotações permanecem editáveis;
   o arquivo original não é modificado. A biblioteca de leitura é local. */
let pdfLibrary=null,pdfImportBusy=false;
function loadPdfLibrary(){
  if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  if(!pdfLibrary)pdfLibrary=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='vendor/pdf.min.js';script.onload=()=>resolve(window.pdfjsLib);script.onerror=()=>{pdfLibrary=null;script.remove();reject(new Error('pdf_library'))};document.head.appendChild(script)});
  return pdfLibrary;
}
function choosePdf(){
  if(pdfImportBusy||S.loading)return;const input=document.createElement('input');input.type='file';input.accept='.pdf,application/pdf';
  input.onchange=()=>{if(input.files[0])importPdfFile(input.files[0])};input.click();
}
async function importPdfFile(file){
  if(pdfImportBusy)return;pdfImportBusy=true;const notebook=S.nb,staged=[];let pdf=null,loading=null,cancelled=false;
  const m=modal('<h2>Importar PDF</h2><p role="status">Preparando o documento…</p><div class="actions"><button class="btn" data-cancel>Cancelar</button></div>',()=>{cancelled=true});
  m.el.querySelector('[data-cancel]').onclick=m.close;const status=m.el.querySelector('p');
  try{
    if(file.size>40*1024*1024)throw new Error('pdf_size');
    await drainSaves();const lib=await loadPdfLibrary();lib.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.js';
    loading=lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
    loading.onPassword=()=>{loading.destroy();};pdf=await loading.promise;
    if(pdf.numPages>100)throw new Error('pdf_pages');
    let total=0;for(let i=1;i<=pdf.numPages;i++){
      if(cancelled)throw new Error('cancelled');status.textContent=`Preparando página ${i} de ${pdf.numPages}…`;
      const page=await pdf.getPage(i),v=page.getViewport({scale:1}),scale=Math.min(1600/v.width,2200/v.height),viewport=page.getViewport({scale});
      const cv=document.createElement('canvas');cv.width=Math.ceil(viewport.width);cv.height=Math.ceil(viewport.height);
      await page.render({canvasContext:cv.getContext('2d'),viewport,background:'white'}).promise;
      const src=cv.toDataURL('image/jpeg',.9);total+=src.length;cv.width=cv.height=1;page.cleanup();
      if(total>50*1024*1024)throw new Error('pdf_size');
      const fit=Math.min(LW/v.width,LH/v.height),w=v.width*fit,h=v.height*fit;
      const pg={id:uid(),nb:null,strokes:[],texts:[],tapes:[],background:{src,x:(LW-w)/2,y:(LH-h)/2,w,h},dirty:true,el:null};
      if(Store.mode==='db'&&JSON.stringify(pageBody(pg)).length>MAX_DOC)throw new Error('pdf_remote_size');staged.push(pg);
    }
    if(cancelled||S.nb!==notebook)throw new Error('cancelled');
    const now=Date.now(),target=notebook||{id:uid(),title:file.name.replace(/\.pdf$/i,'').slice(0,80)||'PDF importado',cover:'marinho',paper:'liso',tone:'branco',pages:[],created:now,updated:now};
    for(const pg of staged){pg.nb=target.id;await Store.writePage(pg.id,pageBody(pg))}
    if(cancelled||S.nb!==notebook)throw new Error('cancelled');
    const next={...target,pages:target.pages.concat(staged.map(p=>p.id)),updated:Date.now()};await Store.writeNotebook(next);Object.assign(target,next);
    if(notebook){S.pages.push(...staged);for(const pg of staged){$('#pages').insertBefore(makePageEl(pg),$('#pages .add-page'));renderTexts(pg);renderTapes(pg)}numberPages();layout();staged[0].el.scrollIntoView({block:'start'})}
    else{NBS.push(target);renderLibrary();await openNotebook(target)}
    m.close();toast(`${staged.length} página(s) importada(s). Você já pode escrever sobre o PDF.`,5000);
  }catch(e){
    if(!cancelled){const msg=e.message==='pdf_pages'?'Importe PDFs com até 100 páginas.':e.message==='pdf_size'?'O documento é grande demais. Divida o PDF e importe em partes.':e.message==='pdf_remote_size'?'Este PDF excede o limite do armazenamento remoto. Abra o Caderno Livre no navegador para importar.':'Não consegui importar. Confira se o PDF é válido e não tem senha.';toast(msg,6000)}m.close();
    // Páginas só entram no caderno depois de todas terem sido preparadas.
    for(const pg of staged)if(!NBS.some(n=>n.pages.includes(pg.id)))await Store.deletePage(pg.id).catch(()=>{});
  }finally{pdfImportBusy=false;if(pdf)await pdf.destroy();else if(loading)await loading.destroy().catch(()=>{})}
}

/* Formas: reconhecimento local com tolerância conservadora. Só é aplicado
   depois de segurar a ponta; escrever normalmente nunca dispara o ajuste. */
function detectShape(st){
  const stride=st.s||2,p=st.p,n=p.length/stride;if(n<3)return null;
  const pts=[];for(let i=0;i<n;i++)pts.push([p[i*stride],p[i*stride+1]]);
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),w=x1-x0,h=y1-y0,diag=Math.hypot(w,h);
  if(diag<35)return null;const first=pts[0],last=pts[n-1],dist=Math.hypot(last[0]-first[0],last[1]-first[1]);
  if(dist>diag*.8&&pts.every(p=>segDist(p[0],p[1],...first,...last)<Math.max(3,diag*.035)))return {name:'Linha',type:'line',p:[...first,...last]};
  if(n<12||dist>diag*.2||Math.min(w,h)<20)return null;
  const edge=pts.reduce((sum,p)=>sum+Math.min((p[0]-x0)/w,(x1-p[0])/w,(p[1]-y0)/h,(y1-p[1])/h),0)/n;
  if(edge<.045){
    const corners=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];if(corners.every(c=>pts.some(p=>Math.hypot(c[0]-p[0],c[1]-p[1])<diag*.16)))return {name:'Retângulo',type:'rectangle',p:[x0,y0,x1,y0,x1,y1,x0,y1,x0,y0]};
  }
  const cx=(x0+x1)/2,cy=(y0+y1)/2,rx=w/2,ry=h/2,err=pts.reduce((s,p)=>s+Math.abs(Math.hypot((p[0]-cx)/rx,(p[1]-cy)/ry)-1),0)/n;
  if(err>.1)return null;const out=[];for(let i=0;i<=80;i++){const a=i/80*Math.PI*2;out.push(cx+rx*Math.cos(a),cy+ry*Math.sin(a))}return {name:'Elipse',type:'ellipse',p:out};
}
function tryShape(a){
  if(!a.st||a.snapped||a.st.k==='hl')return;const shape=detectShape(a.st);if(!shape)return;
  a.st={...a.st,p:shape.p,s:2,shape:shape.type,_live:true};a.snapped=true;a.pred=null;drawLive();toast(`${shape.name} ajustada. Solte a caneta para confirmar.`,1800);
}

/* Janela ampliada: escreve na mesma página, com coordenadas locais. A
   navegação muda a região de escrita sem rasterizar a tinta ampliada. */
let focusState=null,focusStroke=null,focusFrame=0;
function closeFocus(){if(focusStroke)finishFocusStroke();focusState=null;$('#writing-focus').hidden=true;document.querySelectorAll('.focus-region').forEach(n=>n.remove())}
function openFocus(){
  if(!S.nb||S.loading)return;if(editing)finishEdit();closeFocus();clearSel();
  const pg=S.pages[S.cur];focusState={pg,x:100,y:150,scale:2.8};$('#writing-focus').hidden=false;refreshFocus();
}
function refreshFocus(){
  if(!focusState||focusFrame)return;focusFrame=requestAnimationFrame(()=>{focusFrame=0;paintFocus()});
}
function paintFocus(){
  const f=focusState;if(!f)return;if(!S.pages.includes(f.pg)){closeFocus();return}
  const wrap=$('#focus-surface'),width=wrap.clientWidth||600,height=wrap.clientHeight||180;f.w=Math.min(LW,width/f.scale);f.h=height/f.scale;
  f.x=clamp(f.x,0,LW-f.w);f.y=clamp(f.y,0,LH-f.h);
  const cv=$('#focus-paper'),k=Math.min(3,window.devicePixelRatio||1);cv.width=Math.ceil(width*k);cv.height=Math.ceil(height*k);
  const c=cv.getContext('2d');c.save();c.translate(-f.x*f.scale*k,-f.y*f.scale*k);
  // drawPaper trabalha em coordenadas de pixel; drawBackground também.
  drawPaper(c,f.scale*k,S.nb.paper,S.nb.tone);drawBackground(c,f.scale*k,f.pg.background);c.restore();
  const svg=$('#focus-ink');svg.setAttribute('viewBox',`${f.x} ${f.y} ${f.w} ${f.h}`);
  svg.innerHTML=f.pg.strokes.map(strokeMarkup).join('')+(focusStroke?strokeMarkup(focusStroke.st):'');
  const tx=$('#focus-text');tx.width=cv.width;tx.height=cv.height;drawTexts(tx.getContext('2d'),f.scale*k,f.pg.texts||[],f.x,f.y);
  const tape=$('#focus-tapes');tape.setAttribute('viewBox',`${f.x} ${f.y} ${f.w} ${f.h}`);tape.innerHTML=(f.pg.tapes||[]).map(t=>tapeSVG(t,revealed.has(t.id))).join('');
  let region=f.pg.el.querySelector('.focus-region');if(!region){region=document.createElement('div');region.className='focus-region';f.pg.el.appendChild(region)}
  Object.assign(region.style,{left:(f.x/LW*100)+'%',top:(f.y/LH*100)+'%',width:(f.w/LW*100)+'%',height:(f.h/LH*100)+'%'});
  $('#focus-position').textContent=`Página ${S.pages.indexOf(f.pg)+1} · ${Math.round(f.scale*100)}%`;
}
function focusPoint(e){const f=focusState,r=$('#focus-surface').getBoundingClientRect();return [clamp(f.x+(e.clientX-r.left)/r.width*f.w,0,LW),clamp(f.y+(e.clientY-r.top)/r.height*f.h,0,LH)]}
function finishFocusStroke(cancel=false){
  const a=focusStroke;if(!a)return;focusStroke=null;
  if(!cancel){for(const q of a.stab.finish(a.x,a.y))a.st.p.push(q[0],q[1],62);delete a.st._live;a.pg.strokes.push(a.st);renderPage(a.pg);pushUndo({pg:a.pg.id,added:[a.st],removed:[]});schedulePageSave(a.pg);hwrStroke(a.pg,a.st)}refreshFocus();
}
function wireFocus(){
  const surface=$('#focus-surface');
  surface.addEventListener('pointerdown',e=>{
    if(!focusState||focusStroke||e.button>0)return;if(e.pointerType==='touch'&&S.penDevice)return;
    const pen=activePen();if(!pen){toast('Escolha uma caneta no estojo para escrever nesta janela.');return}
    e.preventDefault();surface.setPointerCapture(e.pointerId);if(e.pointerType==='pen')notePen(e);const [x,y]=focusPoint(e);
    focusStroke={pid:e.pointerId,pg:focusState.pg,x,y,stab:new Ink.Stabilizer(pen.st,1/focusState.scale),st:{...pen,id:uid(),engine:Ink.ENGINE,t:pen.k==='hl'?'hl':'pen',s:3,p:[x,y,Math.round((e.pressure||.62)*100)],_live:true}};refreshFocus();
  });
  surface.addEventListener('pointermove',e=>{const a=focusStroke;if(!a||a.pid!==e.pointerId)return;e.preventDefault();const events=e.getCoalescedEvents?.();for(const ev of events?.length?events:[e]){const [x,y]=focusPoint(ev);a.x=x;a.y=y;const q=a.stab.push(x,y);if(q)a.st.p.push(q[0],q[1],Math.round((ev.pressure||.62)*100))}refreshFocus()});
  surface.addEventListener('pointerup',e=>{if(focusStroke?.pid===e.pointerId)finishFocusStroke()});surface.addEventListener('pointercancel',e=>{if(focusStroke?.pid===e.pointerId)finishFocusStroke(true)});
  $('#focus-close').onclick=closeFocus;
  $('#focus-scale').onchange=e=>{if(focusState){if(focusStroke)finishFocusStroke();focusState.scale=+e.target.value;refreshFocus()}};
  document.querySelectorAll('[data-focus-move]').forEach(b=>b.onclick=()=>{const f=focusState;if(!f)return;finishFocusStroke();const dir=b.dataset.focusMove;if(dir==='left')f.x-=f.w*.7;if(dir==='right')f.x+=f.w*.7;if(dir==='up')f.y-=f.h*.7;if(dir==='down')f.y+=f.h*.7;if(dir==='next'){f.x=100;f.y+=STEP}refreshFocus()});
  sc.addEventListener('pointerdown',e=>{if(!focusState||focusStroke||!e.target.closest('.page'))return;if(e.pointerType==='pen'||e.pointerType==='mouse'){e.stopImmediatePropagation();e.preventDefault();focusState.pg=e.target.closest('.page')._pg;const [x,y]=toLocal(focusState.pg,e);focusState.x=x-focusState.w/2;focusState.y=y-focusState.h/2;document.querySelectorAll('.focus-region').forEach(n=>n.remove());refreshFocus()}},true);
}


/* ---------- Ligações ---------- */
$('#back').innerHTML=ico('back');$('#zin').innerHTML=ico('plus',20);$('#zout').innerHTML=ico('minus',20);$('#more').innerHTML=ico('more');
$('#back').onclick=closeNotebook;
$('#zin').onclick=()=>stepZoom(1);$('#zout').onclick=()=>stepZoom(-1);
$('#pentest-lib').onclick=()=>PenTest.open(modal,toast);
$('#backup-lib').onclick=backupDialog;
$('#title').addEventListener('change',()=>{if(!S.nb)return;S.nb.title=$('#title').value.trim()||'Sem título';$('#title').value=S.nb.title;saveNotebook(S.nb)});
$('#title').addEventListener('keydown',e=>{if(e.key==='Enter')e.target.blur()});
$('#more').onclick=e=>openMenu(e.currentTarget,[
  {icon:'paper',label:'Navegador de páginas',run:pageNavigator},
  {icon:'plus',label:'Nova página depois desta',run:()=>addPage(S.cur)},
  {icon:'zoom',label:'Janela de escrita ampliada',run:openFocus},
  {icon:'shapes',label:S.shapes?'Desligar formas automáticas':'Ligar formas automáticas',run:()=>{S.shapes=!S.shapes;savePrefs();toast(S.shapes?'Desenhe uma linha, círculo ou retângulo e segure a caneta por um instante.':'Formas automáticas desligadas.')}},
  {icon:'paper',label:'Importar PDF',run:choosePdf},
  {icon:'paper',label:'Trocar papel',run:paperDialog},
  {icon:'pdf',label:'Exportar em PDF',run:exportPdf},
  ...(S.clip?[{icon:'paste',label:'Colar',run:pasteClip}]:[]),
  {icon:'spark',label:'Escrita para texto…',run:hwrDialog},
  {icon:'lasso',label:'Gestos da caneta…',run:gestDialog},
  ...(HAS_CLAUDE?[{icon:'text',label:'Converter esta página em texto',run:convertPage}]:[]),
  {icon:'pen',label:'Testar caneta',run:()=>PenTest.open(modal,toast)},
  {icon:'trash',label:`Apagar a página ${S.cur+1}`,danger:true,run:()=>deletePage(S.cur)}
]);
document.addEventListener('keydown',e=>{
  if(S.loading||!S.nb||e.target.closest('input,textarea,select')||document.querySelector('.scrim'))return;
  const mod=e.ctrlKey||e.metaKey;
  if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
  if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return}
  if(S.sel&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();deleteSel();return}
  if(e.key==='Escape'&&S.sel){clearSel();return}
  if(mod&&e.key.toLowerCase()==='c'&&S.sel){e.preventDefault();copySel();return}
  if(mod&&e.key.toLowerCase()==='v'&&S.clip){e.preventDefault();pasteClip();return}
  if(mod)return;
  const key=e.key.toLowerCase();
  if(key==='e'){S.active='eraser';savePrefs();buildTray();return}
  if(/^[1-8]$/.test(key)&&S.pens[+key-1]){S.active=S.pens[+key-1].id;savePrefs();buildTray();return}
  if(key==='p'||key==='h'){const p=S.pens.find(q=>key==='h'?q.k==='hl':q.k!=='hl');if(p){S.active=p.id;savePrefs();buildTray()}}
});

wireFocus();
$('#import-pdf').onclick=choosePdf;
$('#library-search').oninput=()=>searchLibrary().catch(()=>toast('Não consegui completar a busca.'));
$('#library-folder').onchange=e=>{libraryFilter.folder=e.target.value;renderLibrary()};
$('#library-favorites').onclick=()=>{libraryFilter.favorites=!libraryFilter.favorites;renderLibrary()};
Store.init().then(loadLibrary);
})();

