// Teste: etiquetas do corte (pacote + personalização), QR que abre a ficha da peça, PDF 10 × 8 cm, letra legível.
// Rodar: NODE_PATH=$(npm root -g) node tests/etiquetas.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path'),os=require('os'),{execFileSync}=require('child_process');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map();
async function dbop(o,p,data){if(o==='get')return {data:store.get(p)||null};if(o==='list')return [...store.entries()].filter(([k])=>k.split('/')[0]===p).map(([k,d])=>({id:k.split('/')[1],data:d}));if(o==='acquire')return {acquired:true};
  if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='delete')store.delete(p);return {}}
const cache=path.join(os.tmpdir(),'martins-cdn');fs.mkdirSync(cache,{recursive:true});
const cdn=url=>{const f=path.join(cache,url.replace(/[^a-z0-9.]+/gi,'_'));if(!fs.existsSync(f))execFileSync('curl',['-sfL','-o',f,url]);return fs.readFileSync(f)};
(async()=>{const b=await chromium.launch();const fake=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');const erros=[];
  const ctx=await b.newContext({viewport:{width:1000,height:800},acceptDownloads:true});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fake);
  await ctx.route(/cdnjs\.cloudflare\.com/,r=>r.fulfill({body:cdn(r.request().url()),contentType:'application/javascript'}));
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helenanenimga67@gmail.com'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await A.goto(APP);await A.waitForTimeout(1500);await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});
  // um pedido com peça masculina, feminina e várias personalizações
  const id=await A.evaluate(()=>{const p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&lotesDe(p.id).some(l=>(l.pers||[]).length));const l=lotesDe(p.id)[0];l.gen='F';l.variacao='Manga longa';
    l.pers=[{tipo:'bordado',parte:'Frente',pos:'Peito esquerdo',desc:'Logo 8 cm',id:'pz0'},{tipo:'bordado',parte:'Mangas',lado:'dir',desc:'Bandeira do Brasil',id:'pz1'},{tipo:'bordado',parte:'Mangas',lado:'esq',desc:'Bandeira USA',id:'pz2'},{tipo:'sublimacao',parte:'Costas',desc:'Logo grande 28 cm',id:'pz3'}];
    l.grade={'0':10,'2':10,'4':10,'6':10,'8':10,'10':10,'12':5,'14':5,PP:10,P:10,M:10,G:5};l.qtd=105;save();return p.id});

  console.log('1) Botão Etiquetas ao lado do PDF de produção');
  await A.evaluate(id=>A.pedido({id}),id);await A.waitForTimeout(300);
  ok(await A.evaluate(()=>{const a=document.querySelector('[data-a=docProd]'),b=document.querySelector('[data-a=docEtq]');return !!a&&!!b&&a.nextElementSibling===b}),'o botão Etiquetas fica logo depois do PDF de produção');
  await A.click('[data-a=docEtq]');await A.waitForFunction(()=>ui.sheet&&ui.sheet.tipo==='etq',null,{timeout:15000});await A.waitForTimeout(400);
  let r=await A.evaluate(id=>{const ls=lotesDe(id).filter(l=>!l.rework);const nPz=ls.reduce((a,l)=>a+gruposPers(l).length,0);return {ls:ls.length,nPz,pac:document.querySelectorAll('.tq-pac').length,pers:document.querySelectorAll('.tq-pers').length,qr:document.querySelectorAll('.tq-qr svg').length,
    txt:document.querySelector('.tq-pac').textContent,mangas:[...document.querySelectorAll('.tq-pers')].map(e=>e.textContent).find(t=>/Mangas/i.test(t))||''}},id);
  ok(r.pac===r.ls,`uma etiqueta de pacote por peça (${r.pac})`);ok(r.pers===r.nPz,`uma de personalização por parte e serviço (${r.pers})`);
  ok(r.qr===r.pac+r.pers,'todas têm QR code');
  ok(/FEMININA/.test(r.txt)&&/Manga longa/.test(r.txt)&&/TOTAL/.test(r.txt)&&/105/.test(r.txt),'o pacote mostra FEMININA, a variação e o total');
  ok(/Manga direita/.test(r.mangas)&&/Manga esquerda/.test(r.mangas),'mangas direita e esquerda vão na mesma etiqueta de MANGAS');

  console.log('2) Cabe e dá para ler');
  r=await A.evaluate(()=>{const els=[...document.querySelectorAll('.tq')];const mm=96/25.4;let menor=99;els.forEach(el=>el.querySelectorAll('*').forEach(x=>{if(x.childNodes.length&&[...x.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const f=parseFloat(getComputedStyle(x).fontSize)/mm;if(f<menor)menor=f}}));
    return {estoura:els.filter(el=>el.scrollHeight>el.clientHeight+1).length,menor:+menor.toFixed(2),w:els[0].getBoundingClientRect().width/mm,h:els[0].getBoundingClientRect().height/mm}});
  ok(r.estoura===0,'nenhuma etiqueta corta o conteúdo, mesmo com 12 tamanhos');ok(r.menor>=3.4,`a menor letra tem ${r.menor} mm (pelo menos 3,4 mm, uns 10 pontos)`);
  ok(Math.abs(r.w-100)<1&&Math.abs(r.h-80)<1,'tamanho real de 10 × 8 cm');

  console.log('3) PDF no tamanho da etiqueta');
  const [dl]=await Promise.all([A.waitForEvent('download',{timeout:60000}),A.click('[data-a=docPdf]')]);const pdf=fs.readFileSync(await dl.path()).toString('latin1');
  const box=(pdf.match(/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/)||[]).slice(1).map(Number);
  ok(/Etiquetas/.test(dl.suggestedFilename()),'o arquivo se chama Etiquetas …');ok(Math.abs(box[0]-283.46)<1&&Math.abs(box[1]-226.77)<1,`cada página tem 100 × 80 mm (${box.join(' × ')} pt)`);
  ok((pdf.match(/\/Type\s*\/Page[^s]/g)||[]).length===await A.evaluate(()=>document.querySelectorAll('.tq').length),'uma página por etiqueta');

  console.log('4) O QR code abre a ficha daquela peça');
  const lid=await A.evaluate(id=>lotesDe(id)[0].id,id);const link=await A.evaluate(()=>linkFicha(lotesDe(ui.sheet.id)[0]));
  ok(link.endsWith('#ficha='+encodeURIComponent(lid)),'o QR aponta para a ficha da peça');
  const B=await ctx.newPage();B.on('pageerror',e=>erros.push(e.message));await B.goto(APP+'#ficha='+encodeURIComponent(lid));await B.waitForFunction(()=>ui.sheet&&ui.sheet.t==='doc',null,{timeout:20000});
  r=await B.evaluate(()=>({tipo:ui.sheet.tipo,so:ui.sheet.so,fichas:paginasDoc(ui.sheet).length,pdf:!!document.querySelector('[data-a=docPdf]'),hash:location.hash}));
  ok(r.tipo==='prod'&&r.so===lid&&r.fichas===1,'abre só a ficha de produção daquela peça');ok(r.pdf,'com o botão de baixar o PDF');ok(!r.hash,'o endereço volta ao normal');

  console.log('5) Central de dúvidas');
  ok(await A.evaluate(()=>ajBusca('etiqueta')[0]?.f.q==='Como imprimo as etiquetas do corte?'),'"etiqueta" acha a resposta certa');
  ok(await A.evaluate(()=>ajBusca('paninho cortador escrever')[0]?.f.q==='Como imprimo as etiquetas do corte?'),'"paninho cortador escrever" acha a resposta certa');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros[0]:''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
