/* Regressões de dados e modo offline: node tests/integrity.cjs */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
async function main(){
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost'),file=path.join(root,u.pathname==='/'?'index.html':u.pathname);
  if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);return res.end()}
  let content=fs.readFileSync(file);if(u.pathname==='/js/app.js')content=Buffer.from(content.toString().replace('Store.init().then(loadLibrary);','window.__inspection={S,Store,IDB,drainSaves,renderTapes,setAllTapes,schedulePageSave,detectShape};Store.init().then(loadLibrary);'));
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webmanifest')?'application/manifest+json':file.endsWith('.png')?'image/png':'text/html');res.end(content);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1100,height:900},acceptDownloads:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route(/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//,r=>r.abort());
  page.setDefaultTimeout(15000);
  const origin=`http://127.0.0.1:${server.address().port}`;await page.goto(origin);await page.waitForSelector('[data-open]');
  console.log('Verificando instalação offline');await page.evaluate(async()=>{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Service worker não instalou')),15000))])});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.locator('[data-open]').first().click();await page.waitForFunction(()=>window.__inspection&&!window.__inspection.S.loading);
  console.log('Offline instalado, verificando dados');
  // Fitas em mais de uma página, com revelação em lote.
  await page.evaluate(()=>{const {S,renderTapes,setAllTapes}=window.__inspection;for(const pg of S.pages){pg.tapes=[{id:'tape'+pg.id,mode:'ret',w:20,pat:'lisa',c:'#a7d8f5',p:[100,100,300,150]}];renderTapes(pg)}setAllTapes(true);setAllTapes(false)});
  // Falha numa página não pode ser escondida por um salvamento de metadados.
  await page.evaluate(async()=>{const t=window.__inspection,write=t.Store.writePage,pg=t.S.pages[0];t.Store.writePage=async()=>{throw new Error('simulated_failure')};t.schedulePageSave(pg,0);await new Promise(r=>setTimeout(r,80));if(!document.querySelector('#status').textContent.includes('Não salvo'))throw new Error('Falha foi escondida');t.Store.writePage=write;await t.drainSaves()});
  // Detecção conservadora de formas; a escrita livre não deve virar retângulo.
  const shapeResults=await page.evaluate(()=>{const {detectShape}=window.__inspection;const rectangle={s:2,p:[]},ellipse={s:2,p:[]};for(const [a,b] of [[[100,100],[400,100]],[[400,100],[400,300]],[[400,300],[100,300]],[[100,300],[100,100]]])for(let i=0;i<20;i++){const t=i/19;rectangle.p.push(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)}for(let i=0;i<=60;i++){const a=i/60*Math.PI*2;ellipse.p.push(300+100*Math.cos(a),300+100*Math.sin(a))}return [detectShape(rectangle)?.type,detectShape(ellipse)?.type,detectShape({s:2,p:[0,0,10,30,20,0,30,30,40,0]})]});assert.deepEqual(shapeResults,['rectangle','ellipse',null]);
  await page.getByRole('button',{name:'Voltar para os cadernos'}).click();await page.waitForSelector('#library:not([hidden])');
  console.log('Verificando backup');
  // Exportar só depois de finalizar a fila de gravação.
  await page.getByRole('button',{name:'Backup',exact:true}).click();const backupDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Salvar backup',exact:true}).click();const backupFile=await (await backupDownload).path();const backup=JSON.parse(fs.readFileSync(backupFile));assert.equal(backup.notebooks.length,1);const oldPageId=backup.notebooks[0].pages[0];assert.equal(backup.pages[oldPageId].tapes.length,1);
  const fixture={app:'caderno-livre',notebooks:[{...backup.notebooks[0],id:'imported-notebook',title:'Backup isolado'}],pages:backup.pages};
  await page.getByRole('button',{name:'Backup',exact:true}).click();let chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Restaurar backup',exact:true}).click();await (await chooser).setFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});await page.waitForFunction(()=>document.querySelectorAll('[data-open]').length===2);
  const ids=await page.evaluate(async()=>{const t=window.__inspection,nbs=await t.Store.listNotebooks();return nbs.map(n=>({id:n.id,pages:n.pages}))});assert(!ids.find(n=>n.id==='imported-notebook').pages.includes(oldPageId));
  console.log('Verificando limpar/desfazer');
  // Limpar uma página única remove fitas e permite desfazer tudo.
  await page.getByRole('button',{name:'Novo caderno',exact:true}).click();await page.locator('#nb-title').fill('Página única');await page.getByRole('button',{name:'Criar caderno',exact:true}).click();
  await page.evaluate(()=>{const t=window.__inspection,pg=t.S.pages[0];pg.tapes=[{id:'single-tape',mode:'ret',w:20,pat:'lisa',c:'#a7d8f5',p:[100,100,300,150]}];t.renderTapes(pg);t.schedulePageSave(pg)});
  await page.getByRole('button',{name:'Mais opções'}).click();await page.getByRole('menuitem',{name:'Apagar a página 1'}).click();await page.getByRole('button',{name:'Limpar',exact:true}).click();assert.equal(await page.locator('.tapes rect').count(),0);await page.getByRole('button',{name:'Desfazer',exact:true}).click();assert.equal(await page.locator('.tapes rect').count(),1);
  await page.getByRole('button',{name:'Voltar para os cadernos'}).click();await page.waitForSelector('#library:not([hidden])');
  console.log('Verificando exportação offline');
  // A página e os geradores locais de PDF continuam disponíveis offline.
  await context.setOffline(true);await page.reload();await page.waitForSelector('[data-open]');await page.locator('[data-open]').first().click();await page.waitForFunction(()=>!window.__inspection.S.loading);
  assert(await page.evaluate(()=>typeof window.PerfectFreehand?.getStroke==='function'),'O motor de tinta está disponível offline');
  await page.getByRole('button',{name:'Mais opções'}).click();const pdfDownload=page.waitForEvent('download');await page.getByRole('menuitem',{name:'Exportar em PDF'}).click();const pdf=await pdfDownload;assert(pdf.suggestedFilename().endsWith('.pdf'));assert(fs.statSync(await pdf.path()).size>1000);
  assert.deepEqual(errors,[]);console.log('OK: falha de salvamento, formas, fitas em lote, limpar/desfazer, backup, colisões de IDs, reabertura offline e exportação PDF offline.');await context.close();
 }finally{await browser.close();await new Promise(r=>server.close(r))}
}
main().catch(e=>{console.error(e);process.exit(1)});
