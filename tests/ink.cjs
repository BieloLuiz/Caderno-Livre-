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

