/* Propriedades do motor: pressão, contornos e compatibilidade dos traços. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
class CanvasPath{constructor(d=''){this.d=d}moveTo(){}lineTo(){}quadraticCurveTo(){}arc(){}closePath(){}}
const scope={Path2D:CanvasPath};scope.window=scope;vm.createContext(scope);
vm.runInContext(fs.readFileSync(path.join(root,'vendor/perfect-freehand-1.2.3.js'),'utf8'),scope);
vm.runInContext(fs.readFileSync(path.join(root,'js/ink.js'),'utf8'),scope);
const {Ink}=scope;
function line(kind,pressure){const p=[];for(let i=0;i<50;i++)p.push(100+i*4,200,pressure);return {engine:Ink.ENGINE,k:kind,w:10,c:'#123456',o:1,f:100,s:3,p}}
function height(st){const b=Ink.geom(st).box;return b[3]-b[1]}
assert.equal(height(line('esfero',10)),height(line('esfero',90)),'A esferográfica mantém a espessura com qualquer pressão');
assert(height(line('pincel',90))>height(line('pincel',10))*2,'O pincel responde à pressão registrada');
for(const kind of ['esfero','fina','pincel','tinteiro','lapis']){
 const st=line(kind,60),before=JSON.stringify(st),g=Ink.geom(st);
 if(!g.uniform)assert(g.outline?.length>3,kind+' utiliza perfect-freehand');else assert(Ink.svg(st).includes('data-ink-engine="continuous"'));assert(g.box.every(Number.isFinite));assert(!/NaN|Infinity/.test(g.svgPath));
 assert.equal(JSON.stringify(st),before,'Calcular geometria não altera os dados salvos');
 const clone=JSON.parse(JSON.stringify(st));assert.equal(Ink.geom(clone).svgPath,g.svgPath,'O traço permanece igual depois de serializar e reabrir');
 const filled=[];const ctx={canvas:{width:1000,height:1414},save(){},restore(){},setTransform(){},fill(p){filled.push(p.d)}};
 if(kind!=='lapis'&&!g.uniform){Ink.draw(ctx,st,1);assert.deepEqual(filled,[g.svgPath],'O canvas usa o mesmo contorno do SVG');assert(Ink.svg(st).includes(g.svgPath))}
}
for(const p of [[100,100,50],[100,100,50,100,100,50],[100,100,50,120,120,80,100,100,20],[100,100,0,101,101,0]]){
 const g=Ink.geom({...line('pincel',50),p});assert(g.box.every(Number.isFinite));assert(g.outline.length>3);assert(!/NaN|Infinity/.test(g.svgPath));
}
const tilt={...line('tinteiro',60),s:5,p:[100,100,60,30,45,140,120,70,40,90,180,110,50,50,135]};assert(Ink.geom(tilt).box.every(Number.isFinite));
const legacy=line('esfero',60);delete legacy.engine;assert.equal(Ink.geom(legacy).outline,null,'Traços antigos continuam no motor anterior');assert(Ink.svg(legacy).includes('stroke-width="10"'));
for(const st of [{...line('esfero',50),shape:'line'},{...line('esfero',50),ls:'dash'},line('hl',50)])assert.equal(Ink.geom(st).outline,null,'Formas, tracejados e marca-texto preservam o comportamento');
const live={...line('pincel',60),_live:true};const previous=Ink.geom(live).svgPath;live.p.push(400,260,80);assert.notEqual(Ink.geom(live).svgPath,previous,'A geometria acompanha os pontos de um traço em andamento');
const final={...line('pincel',60)},preview={...final,_live:true};assert.equal(Ink.geom(final).svgPath,Ink.geom(preview).svgPath,'Os mesmos pontos não mudam de aparência quando a caneta é levantada');
const textured={...line('pincel',60),f:60};assert.equal(Ink.svg(textured),null,'Fluxo e texturas não são descartados');
console.log('OK: perfect-freehand, pressão, espessura constante, pontos repetidos, inclinação, prévia, SVG/canvas, persistência e traços antigos.');

assert(Ink.svg({...line('esfero',60),f:40}).includes('opacity="0.4"'),'Fluxo baixo na esferográfica reduz intensidade sem textura que interrompa a linha');

// Saved PF and legacy uniform pens share exactly the same continuous geometry.
for(const k of ['esfero','fina'])for(const f of [40,100]){
 const st={...line(k,60),f},old={...st};delete old.engine;
 assert.equal(Ink.svg(st),Ink.svg(old),'A marca do motor não muda a caneta contínua');
 const library=scope.PerfectFreehand;scope.PerfectFreehand=null;
 assert.equal(Ink.svg({...st}),Ink.svg(old),'Canetas uniformes independem da biblioteca');
 scope.PerfectFreehand=library;
 assert(Ink.svg(old).includes(`opacity="${f/100}"`));
}

// Stabilization suppresses sensor jitter but follows small writing and fast motion.
for(const scale of [.5,1,2]){
 const filter=new Ink.Stabilizer(55,scale);filter.push(0,0);
 for(let i=0;i<20;i++)assert.equal(filter.push((i%2?.3:-.3)*scale,0),null,'Tremor fino não move a ponta');
 let tip;for(let x=1;x<=60;x++)tip=filter.push(x*scale,0)||tip;
 assert(60-tip[0]/scale<2,'Atraso em movimento lento fica abaixo de 2 px');
 tip=filter.push(90*scale,0);assert(90-tip[0]/scale<1.3,'A ponta acompanha movimento rápido');
 const end=filter.finish(91*scale,scale).at(-1);assert.equal(end[0],91*scale);assert.equal(end[1],scale);
 const loop=new Ink.Stabilizer(55,scale);loop.push(3*scale,0);let samples=0;
 for(let i=1;i<=48;i++){const a=i*Math.PI/24;if(loop.push(3*Math.cos(a)*scale,3*Math.sin(a)*scale))samples++}
 assert(samples>24,'Uma volta de 6 px permanece capturada');
}
const raw=new Ink.Stabilizer(0,1);raw.push(0,0);assert.deepEqual(Array.from(raw.push(1,2)),[1,2],'Estabilidade zero acompanha a entrada');
