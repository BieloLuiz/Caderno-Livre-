/* Execute: node tests/browser.cjs (Playwright e Chromium disponíveis). */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
async function main(){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1024,height:900},deviceScaleFactor:2,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='caderno.test')return route.abort();const file=path.join(root,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html'});});
  await page.goto('http://caderno.test/');await page.locator('[data-open]').first().click();await page.waitForTimeout(500);
  assert(await page.locator('.ink-vector path').count()>0,'Tinta vetorial no exemplo');
  // Thin curved strokes must cover every column at 200% zoom, in SVG and export.
  const gaps=await page.evaluate(async()=>{
   const failures=[];
   for(const k of ['esfero','fina','pincel','tinteiro'])for(const engine of [undefined,Ink.ENGINE])for(const f of [40,100]){
    const p=[];for(let x=20;x<=220;x+=2)p.push(x,60+25*Math.sin(x/40),60);
    const st={k,engine,f,p,s:3,w:['pincel','tinteiro'].includes(k)?4:.8,o:1,c:'#000000'},scale=4;
    for(const mode of ['canvas','svg']){
     const cv=document.createElement('canvas');cv.width=960;cv.height=400;const ctx=cv.getContext('2d');
     if(mode==='canvas')Ink.draw(ctx,st,scale);
     else{const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="400" viewBox="0 0 240 100">${Ink.svg(st)}</svg>`);await img.decode();ctx.drawImage(img,0,0)}
     const data=ctx.getImageData(0,0,960,400).data;
     for(let x=84;x<876;x++){let peak=0;for(let y=100;y<360;y++)peak=Math.max(peak,data[(y*960+x)*4+3]);if(peak<255*f/100*.6){failures.push({k,engine,f,mode,x,peak});break}}
    }
   }
   return failures;
  });assert.deepEqual(gaps,[],'Curvas finas contínuas em SVG e canvas, novas e salvas, com fluxo baixo e cheio');
  const loopGaps=await page.evaluate(()=>{
   const failures=[];
   for(const k of ['pincel','tinteiro']){
    const p=[];for(let i=0;i<=180;i++){const t=i/180*Math.PI*4;p.push(250+135*Math.sin(t),280-210*Math.cos(t/2),Math.round(45+30*Math.sin(t*1.3)+(i%2?8:-8)))}
    const s={k,w:k==='pincel'?14:9,s:3,p,c:'#000000',o:1,f:100};
    const cv=document.createElement('canvas');cv.width=1000;cv.height=1200;const ctx=cv.getContext('2d');Ink.draw(ctx,s,2);
    const g=Ink.geom(s);for(let i=8;i<g.S.X.length-8;i++){const x=Math.round(g.S.X[i]*2),y=Math.round(g.S.Y[i]*2),data=ctx.getImageData(x-2,y-2,5,5).data;let peak=0;for(let j=3;j<data.length;j+=4)peak=Math.max(peak,data[j]);if(peak<100){failures.push({k,i});break}}
   }
   return failures;
  });assert.deepEqual(loopGaps,[],'Curvas fechadas e cruzamentos permanecem contínuos com pressão oscilante');
  const target=page.locator('.page').first();let r=await target.boundingBox();
  await page.mouse.move(r.x+220,r.y+150);await page.mouse.down();await page.mouse.move(r.x+390,r.y+260,{steps:35});await page.mouse.up();
  const count=await page.locator('.page .ink-vector path').count();assert(count>0);
  assert(await page.locator('.page .ink-vector path[data-ink-engine="continuous"]').count()>0,'A caneta usa o traço contínuo independente de perfect-freehand');
  await page.getByRole('button',{name:'Páginas',exact:true}).click();await page.getByRole('button',{name:'Duplicar página 1',exact:true}).click();assert.equal(await page.locator('.page-card').count(),3);
  await page.getByRole('button',{name:'Mover página 1 para baixo',exact:true}).click();await page.getByRole('button',{name:'Fechar',exact:true}).click();assert.equal(await page.locator('.page').count(),3);
  await page.getByRole('button',{name:'Escrita ampliada',exact:true}).click();await page.waitForTimeout(200);assert(await page.locator('#writing-focus').isVisible());
  r=await page.locator('#focus-surface').boundingBox();await page.mouse.move(r.x+40,r.y+70);await page.mouse.down();await page.mouse.move(r.x+180,r.y+90,{steps:30});await page.mouse.up();await page.getByRole('button',{name:'Próxima linha ↵'}).click();await page.getByRole('button',{name:'Fechar escrita ampliada'}).click();
  await page.getByRole('button',{name:'Aumentar zoom'}).click();await page.getByRole('button',{name:'Aumentar zoom'}).click();assert(await page.locator('.ink-vector path').count()>0);
  const navigation=await page.evaluate(()=>{
   const originalSvg=Ink.svg;const rpSeen=[];Ink.svg=st=>{rpSeen.push(!!st.rp);return originalSvg(st)};
   const surface=document.querySelector('.page .ink-vector'),scroll=document.querySelector('#scroller');
   const r=surface.getBoundingClientRect(),x=r.left+150,y=Math.max(280,r.top+120);
   const fire=(type,id,pointerType,px,py,pressure=.6)=>surface.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType,clientX:px,clientY:py,pressure,buttons:type==='pointerup'?0:1}));
   const before=surface.querySelectorAll('path').length;
   fire('pointerdown',901,'pen',x,y);fire('pointermove',901,'pen',x+40,y+30);fire('pointerup',901,'pen',x+40,y+30);
   const constantIsReal=rpSeen.some(Boolean);rpSeen.length=0;
   const wrote=surface.querySelectorAll('path').length>before;
   const top=scroll.scrollTop;
   fire('pointerdown',902,'touch',x,y);fire('pointermove',902,'touch',x,y-80);
   const moved=scroll.scrollTop>top;
   fire('pointerup',902,'touch',x,y-80);
   fire('pointerdown',903,'pen',x,y);fire('pointermove',903,'pen',x+40,y+10);fire('pointerup',903,'pen',x+40,y+10);
   rpSeen.length=0;fire('pointerdown',904,'pen',x,y+60,.1);for(let i=1;i<=24;i++)fire('pointermove',904,'pen',x+i*4,y+60,.1+.85*Math.abs(Math.sin(i/4)));fire('pointerup',904,'pen',x+96,y+60,0);
   const varyingIsReal=rpSeen.some(Boolean);
   Ink.svg=originalSvg;return {wrote,moved,constantIsReal,varyingIsReal};
  });assert.equal(navigation.constantIsReal,false,'Pressão fixa (caneta sem sensor, ex. GD14) é simulada pela velocidade');assert.equal(navigation.varyingIsReal,true,'Pressão que varia (Apple Pencil) é usada já no primeiro traço');assert(navigation.wrote,'A caneta escreve');assert(navigation.moved,'O dedo move o papel imediatamente após levantar a caneta');
  const handoff=await page.evaluate(()=>{
   const surface=document.querySelector('.page'),sc=document.querySelector('#scroller');sc.scrollTop=300;
   const fire=(type,id,x,y)=>surface.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',clientX:x,clientY:y,width:18,height:18}));
   fire('pointerdown',910,280,450);fire('pointerdown',911,480,450);
   fire('pointermove',910,280,400);fire('pointermove',911,480,400);
   fire('pointerup',911,480,400);fire('lostpointercapture',911,480,400);
   const before=sc.scrollTop;fire('pointermove',910,280,340);const delta=sc.scrollTop-before;
   fire('pointercancel',910,280,340);
   fire('pointerdown',912,280,400);const next=sc.scrollTop;fire('pointermove',912,280,350);const resumed=sc.scrollTop-next;fire('pointercancel',912,280,350);
   fire('pointerdown',913,300,400);fire('pointerdown',914,500,400);
   fire('pointermove',913,240,400);
   const pr=surface.getBoundingClientRect(),fx=(370-pr.left)/pr.width,fy=(400-pr.top)/pr.height;
   fire('pointermove',914,560,400);fire('pointerup',914,560,400);
   const after=surface.getBoundingClientRect(),anchorError=Math.hypot(after.left+fx*after.width-400,after.top+fy*after.height-400);
   const pinchTop=sc.scrollTop;fire('pointermove',913,240,350);const afterPinch=sc.scrollTop-pinchTop;fire('pointercancel',913,240,350);
   return {delta,resumed,anchorError,afterPinch};
  });assert.equal(handoff.delta,60,'O dedo restante continua movendo a página após gesto com dois dedos');assert.equal(handoff.resumed,50,'Arraste funciona após cancelamento do navegador');assert(handoff.anchorError<2,'Zoom mantém o ponto sob os dedos');assert.equal(handoff.afterPinch,50,'Arraste continua após pinça com zoom');
  await page.screenshot({path:'/tmp/caderno-vector-desktop.png'});
  await page.getByRole('button',{name:'Voltar para os cadernos'}).click();await page.waitForSelector('#library:not([hidden])');
  await page.locator('[data-opts]').first().click();await page.locator('#nb-folder').fill('Estudos');await page.locator('#nb-favorite').check();await page.getByRole('button',{name:'Salvar',exact:true}).click();
  await page.locator('#library-folder').selectOption('Estudos');await page.locator('#library-favorites').click();assert.equal(await page.locator('[data-open]').count(),1);await page.locator('#library-search').fill('inexistente');await page.waitForTimeout(200);assert.equal(await page.locator('[data-open]').count(),0);await page.locator('#library-search').fill('');
  await page.reload();await page.waitForSelector('[data-open]');await page.locator('[data-open]').first().click();await page.waitForTimeout(400);assert.equal(await page.locator('.page').count(),3);assert(await page.locator('.page .ink-vector path').count()>=count);
  assert(await page.locator('.page .ink-vector path[data-ink-engine="continuous"]').count()>0,'O contorno novo é preservado depois de reabrir o caderno');
  // Formas: manter a ponta parada por 650 ms ajusta uma linha.
  await page.locator('.page').first().scrollIntoViewIfNeeded();r=await page.locator('.page').first().boundingBox();await page.mouse.move(r.x+130,r.y+100);await page.mouse.down();await page.mouse.move(r.x+330,r.y+103,{steps:35});await page.waitForTimeout(850);await page.mouse.up();await page.waitForTimeout(100);
  assert.match(await page.locator('#toast').innerText(),/ajustada/);
  await page.getByRole('button',{name:'Voltar para os cadernos'}).click();await page.waitForSelector('#library:not([hidden])');
  // Um PDF mínimo real, construído sem dependências de geração.
  const stream='BT /F1 24 Tf 50 700 Td (Documento de teste) Tj ET';const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];let pdf='%PDF-1.4\n';const offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`}const xref=pdf.length;pdf+=`xref\n0 6\n0000000000 65535 f \n`+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Importar PDF',exact:true}).click();await (await chooser).setFiles({name:'Documento.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdf)});
  await page.waitForSelector('#editor:not([hidden])',{timeout:20000});await page.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('importada'));
  assert.equal(await page.locator('.page').count(),1);await page.waitForTimeout(200);
  const backgroundPixel=await page.locator('.page canvas').first().evaluate(c=>Array.from(c.getContext('2d').getImageData(100,100,1,1).data));assert.equal(backgroundPixel[3],255);
  await page.getByRole('button',{name:'Voltar para os cadernos'}).click();await page.waitForSelector('#library:not([hidden])');await page.reload();await page.waitForSelector('[data-open]');assert.equal(await page.locator('[data-open]').count(),2);
  await context.close();
  // Layout pequeno e caneta simulada por PointerEvent.
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block'});const small=await mobile.newPage();small.on('pageerror',e=>errors.push(e.stack));await mobile.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='caderno.test')return route.abort();const f=path.join(root,u.pathname==='/'?'index.html':u.pathname);return fs.existsSync(f)?route.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html'}):route.fulfill({status:404,body:''})});await small.goto('http://caderno.test/');await small.locator('[data-open]').first().tap();await small.waitForTimeout(300);await small.screenshot({path:'/tmp/caderno-vector-mobile.png'});assert.equal(await small.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mobile.close();
  assert.deepEqual(errors,[]);console.log('OK: escrita vetorial, zoom, páginas, duplicação, reordenação, janela ampliada, formas, pastas, favoritos, busca, PDF, persistência e layout móvel.');
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exit(1)});
