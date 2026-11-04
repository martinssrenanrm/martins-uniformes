// Teste: etiquetas do corte (pacote por tamanho + personalização), filtro por tipo de peça, duas etiquetas de 10 × 7,5 cm por folha de 10 × 15 cm,
// QR que abre a ficha da peça, letra legível.
// Rodar: NODE_PATH=$(npm root -g) node tests/etiquetas.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path'),os=require('os'),{execFileSync}=require('child_process');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map();
async function dbop(o,p,data){if(o==='get')return {data:store.get(p)||null};if(o==='list')return [...store.entries()].filter(([k])=>k.split('/')[0]===p).map(([k,d])=>({id:k.split('/')[1],data:d}));if(o==='acquire')return {acquired:true};
  if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='update'){if(!store.has(p))return {err:'invalid_argument'};merge(store.get(p),JSON.parse(JSON.stringify(data)))}if(o==='delete')store.delete(p);return {}}
const merge=(a,b)=>{for(const k of Object.keys(b)){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k]}return a};
const cache=path.join(os.tmpdir(),'martins-cdn');fs.mkdirSync(cache,{recursive:true});
const cdn=url=>{const f=path.join(cache,url.replace(/[^a-z0-9.]+/gi,'_'));if(!fs.existsSync(f))execFileSync('curl',['-sfL','-o',f,url]);return fs.readFileSync(f)};
(async()=>{const b=await chromium.launch();const fake=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');const erros=[];
  const ctx=await b.newContext({viewport:{width:1000,height:800},acceptDownloads:true});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fake);
  await ctx.route(/cdnjs\.cloudflare\.com/,r=>r.fulfill({body:cdn(r.request().url()),contentType:'application/javascript'}));
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helena@exemplo.test'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await A.goto(APP);await A.waitForTimeout(1500);await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});
  // um pedido com peça masculina, feminina e várias personalizações
  const id=await A.evaluate(()=>{const p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&lotesDe(p.id).some(l=>(l.pers||[]).length));const l=lotesDe(p.id)[0];l.gen='F';l.variacao='Manga longa';
    l.pers=[{tipo:'bordado',parte:'Frente',pos:'Peito esquerdo',desc:'Logo 8 cm',id:'pz0'},{tipo:'bordado',parte:'Mangas',lado:'dir',desc:'Bandeira do Brasil',id:'pz1'},{tipo:'bordado',parte:'Mangas',lado:'esq',desc:'Bandeira USA',id:'pz2'},{tipo:'sublimacao',parte:'Costas',desc:'Logo grande 28 cm',id:'pz3'}];
    l.grade={'0':10,'2':10,'4':10,'6':10,'8':10,'10':10,'12':5,'14':5,PP:10,P:10,M:10,G:5};l.qtd=105;
    // segunda peça, de outro tipo, com 10 P, 20 M e 15 G (o exemplo do pedido)
    const outro=state.produtos.find(x=>x.id!==l.prod);const l2=JSON.parse(JSON.stringify(l));Object.assign(l2,{id:l.id+'-b',prod:outro.id,gen:'U',variacao:'',pers:[],grade:{P:10,M:20,G:15},qtd:45});delete l2.qr;state.lotes.push(l2);
    save();return p.id});
  const tam=sel=>A.evaluate(s=>[...document.querySelectorAll(s)].map(e=>({z:e.querySelector('.tq-tz em')?.textContent,q:+(e.querySelector('.tq-tam span:not(.tq-tz) em')?.textContent||0),txt:e.textContent})),sel);

  console.log('1) Botão Etiquetas ao lado do PDF de produção');
  await A.evaluate(id=>A.pedido({id}),id);await A.waitForTimeout(300);
  ok(await A.evaluate(()=>{const a=document.querySelector('[data-a=docProd]'),b=document.querySelector('[data-a=docEtq]');return !!a&&!!b&&a.nextElementSibling===b}),'o botão Etiquetas fica logo depois do PDF de produção');
  await A.click('[data-a=docEtq]');await A.waitForFunction(()=>ui.sheet&&ui.sheet.tipo==='etq',null,{timeout:15000});await A.waitForTimeout(400);

  console.log('2) Pacote de costura: uma etiqueta por tamanho, com a quantidade daquele tamanho');
  let r=await A.evaluate(id=>{const ls=lotesDe(id).filter(l=>!l.rework);const nPz=ls.reduce((a,l)=>a+gruposPers(l).length,0);const nTam=ls.reduce((a,l)=>a+Object.values(l.grade||{}).filter(q=>q>0).length,0);
    return {nTam,nPz,pac:document.querySelectorAll('.tq-pac').length,pers:document.querySelectorAll('.tq-pers').length,qr:document.querySelectorAll('.tq-qr svg').length,
    mangas:[...document.querySelectorAll('.tq-pers')].map(e=>e.textContent).find(t=>/Mangas/i.test(t))||'',persTxt:document.querySelector('.tq-pers').textContent}},id);
  ok(r.pac===r.nTam,`uma etiqueta de pacote para cada tamanho com peças (${r.pac} de ${r.nTam})`);ok(r.pers===r.nPz,`uma de personalização por parte e serviço (${r.pers})`);
  ok(r.qr===r.pac+r.pers,'todas têm QR code');
  let T=await tam('.tq-pac');const Bx=T.filter(t=>!/FEMININA/.test(t.txt)),F=T.filter(t=>/FEMININA/.test(t.txt));
  ok(Bx.length===3&&Bx.map(t=>t.z+'='+t.q).join(' ')==='P=10 M=20 G=15','10 P, 20 M e 15 G geram 3 etiquetas: P com 10, M com 20 e G com 15');
  ok(F.length===12&&F.reduce((a,t)=>a+t.q,0)===105,'a peça com 12 tamanhos gera 12 etiquetas que somam as 105 peças');
  ok(T.every(t=>!/TOTAL/.test(t.txt)&&!t.txt.includes('PP')||t.z==='PP'),'cada etiqueta de pacote mostra só o seu tamanho (sem a grade inteira)');
  ok(F.every(t=>/FEMININA/.test(t.txt)&&/Manga longa/.test(t.txt)&&/Cor/.test(t.txt)&&/Tecido/.test(t.txt)&&/Personalização/.test(t.txt)&&/Entrega/.test(t.txt)&&/Peça/.test(t.txt)),'o pacote continua com cliente, peça, FEMININA, variação, cor, tecido, personalização, entrega e número da peça');
  ok(/TOTAL/.test(r.persTxt)&&/105/.test(r.persTxt),'a de personalização continua com a grade e o total');
  ok(/Manga direita/.test(r.mangas)&&/Manga esquerda/.test(r.mangas),'mangas direita e esquerda vão na mesma etiqueta de MANGAS');

  console.log('3) Duas etiquetas por folha de 10 × 15 cm, em ordem, sem repetir');
  const folhas=()=>A.evaluate(()=>{const mm=96/25.4;const pg=[...document.querySelectorAll('.tq-mesa .tq-pg')];const E=[...document.querySelectorAll('.tq-mesa .tq')];
    return {pg:pg.length,por:pg.map(p=>p.querySelectorAll('.tq').length),n:E.length,unicas:new Set(E.map(e=>e.querySelector('.tq-bar').textContent+'|'+e.textContent)).size,
      w:E[0].getBoundingClientRect().width/mm,h:E[0].getBoundingClientRect().height/mm,pw:pg[0].getBoundingClientRect().width/mm,ph:pg[0].getBoundingClientRect().height/mm}});
  // a prévia pode estar em escala; mede sem escala
  await A.evaluate(()=>document.querySelectorAll('.tq-wrap>.tq-pg').forEach(x=>x.style.transform=''));
  r=await folhas();
  ok(r.pg===Math.ceil(r.n/2)&&r.por.every(x=>x>=1&&x<=2),`${r.n} etiquetas em ${r.pg} folhas, até duas por folha`);ok(r.unicas===r.n,'nenhuma etiqueta repetida');
  ok(Math.abs(r.w-100)<1&&Math.abs(r.h-75)<1,`cada etiqueta tem 10 × 7,5 cm (${r.w.toFixed(1)} × ${r.h.toFixed(1)} mm)`);ok(Math.abs(r.pw-100)<1&&Math.abs(r.ph-150)<1,'cada folha tem 10 × 15 cm');
  ok(await A.evaluate(()=>[...document.styleSheets].some(s=>{try{return [...s.cssRules].some(x=>/@page etiqueta/.test(x.cssText)&&/100mm 150mm/.test(x.cssText)&&/margin: 0/.test(x.cssText))}catch(e){return false}})),'impressão no tamanho real: página 100 × 150 mm, sem margem');

  console.log('4) Cabe e dá para ler');
  r=await A.evaluate(()=>{const els=[...document.querySelectorAll('.tq-mesa .tq')];const mm=96/25.4;let menor=99;els.forEach(el=>el.querySelectorAll('*').forEach(x=>{if(x.childNodes.length&&[...x.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const f=parseFloat(getComputedStyle(x).fontSize)/mm;if(f<menor)menor=f}}));
    const qr=els.map(e=>e.querySelector('.tq-qr').getBoundingClientRect().width/mm);
    // nada escondido: cada parte da etiqueta fica inteira, sem encolher nem passar por cima da outra
    const espreme=els.filter(el=>{const fb=el.getBoundingClientRect();const K=[...el.children];return K.some((c,i)=>{const r=c.getBoundingClientRect();return r.bottom>fb.bottom+.5||c.scrollHeight>c.clientHeight+1&&!/-webkit-box/.test(getComputedStyle(c).display)||i&&r.top<K[i-1].getBoundingClientRect().bottom-.5})}).length;
    return {estoura:els.filter(el=>el.scrollHeight>el.clientHeight+1).length+espreme,menor:+menor.toFixed(2),qr:Math.min(...qr),tam:Math.min(...[...document.querySelectorAll('.tq-tam em')].map(e=>parseFloat(getComputedStyle(e).fontSize)/mm))}});
  ok(r.estoura===0,'nenhuma etiqueta corta o conteúdo, mesmo com 12 tamanhos');ok(r.menor>=3.4,`a menor letra tem ${r.menor} mm (pelo menos 3,4 mm, uns 10 pontos)`);
  ok(r.qr>=15.9,`QR code com pelo menos 16 mm (${r.qr.toFixed(1)} mm), dá para ler com o celular`);ok(r.tam>=7,`tamanho e quantidade em letra grande (${r.tam.toFixed(1)} mm)`);

  console.log('5) Filtro por tipo de peça: na tela, no PDF e na impressão');
  const tipos=await A.evaluate(id=>tiposEtqDe(pedById(id)),id);ok(tipos.length===2,'o pedido tem 2 tipos de peça para escolher');
  const b2=tipos.find(t=>t.id!==tipos[0].id);
  await A.click(`[data-a=etqTipo][data-v="${b2.id}"]`);await A.waitForTimeout(300);
  T=await tam('.tq-mesa .tq-pac');r=await A.evaluate(()=>({n:document.querySelectorAll('.tq-mesa .tq').length,pers:document.querySelectorAll('.tq-mesa .tq-pers').length,pg:document.querySelectorAll('.tq-mesa .tq-pg').length,
    on:[...document.querySelectorAll('[data-a=etqTipo]')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.v),imp:paginasDoc(ui.sheet).join('').split('class="tq ').length-1,dica:document.querySelector('.tq-mesa').previousElementSibling.textContent}));
  ok(T.length===3&&r.pers===0&&r.n===3,`só a ${b2.nome}: 3 etiquetas, sem as da outra peça`);ok(r.on.length===1&&r.on[0]===b2.id,'o botão da peça escolhida fica marcado (e "Todas" não)');
  ok(r.imp===3,'a impressão usa o mesmo filtro (3 etiquetas)');ok(r.pg===2,'3 etiquetas = 2 folhas, a última com a metade de baixo em branco');
  ok(await A.evaluate(()=>{const p=[...document.querySelectorAll('.tq-mesa .tq-pg')].pop();return p.querySelectorAll('.tq').length===1}),'a última folha tem só uma etiqueta');
  const [dl]=await Promise.all([A.waitForEvent('download',{timeout:60000}),A.click('[data-a=docPdf]')]);const pdf=fs.readFileSync(await dl.path()).toString('latin1');
  const box=(pdf.match(/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/)||[]).slice(1).map(Number);
  ok(/Etiquetas/.test(dl.suggestedFilename()),'o arquivo se chama Etiquetas …');ok(Math.abs(box[0]-283.46)<1&&Math.abs(box[1]-425.2)<1,`cada página do PDF tem 100 × 150 mm (${box.map(x=>x.toFixed(1)).join(' × ')} pt)`);
  ok((pdf.match(/\/Type\s*\/Page[^s]/g)||[]).length===2,'o PDF sai só com as folhas do filtro (2)');
  await A.click(`[data-a=etqTipo][data-v="${tipos[0].id}"]`);await A.waitForTimeout(300);
  r=await A.evaluate(()=>({n:document.querySelectorAll('.tq-mesa .tq').length,on:[...document.querySelectorAll('[data-a=etqTipo]')].filter(b=>b.getAttribute('aria-pressed')==='true').length}));
  const todas=await A.evaluate(id=>etiquetasDe(pedById(id)).length,id);ok(r.n===todas&&r.on===2,'marcando as duas peças, aparecem as etiquetas das duas');
  await A.click('[data-a=etqTipo][data-v=""]');await A.waitForTimeout(300);
  ok(await A.evaluate(()=>ui.sheet.tipos===null&&document.querySelector('[data-a=etqTipo][data-v=""]').getAttribute('aria-pressed')==='true'),'"Todas as peças" volta a mostrar tudo');

  console.log('6) O QR code abre a ficha daquela peça, para qualquer pessoa');
  r=await A.evaluate(id=>{const ls=lotesDe(id).filter(l=>!l.rework);return {qr:ls.map(l=>l.qr),link:linkFicha(ls[0]),lid:ls[0].id}},id);
  ok(r.qr.every(q=>/^[0-9a-f]{30}$/.test(q))&&new Set(r.qr).size===r.qr.length,'cada peça ganhou um código secreto diferente');
  ok(r.link.endsWith('#f='+r.qr[0])&&!r.link.includes(r.lid),'o QR leva o código secreto, não o número da peça');
  await A.waitForTimeout(1500);ok(store.get('lotes/'+r.lid)?.qr===r.qr[0],'o código fica guardado na nuvem');
  const C=await b.newContext({viewport:{width:390,height:800}});await C.exposeFunction('__dbop',dbop);await C.addInitScript(fake);
  await C.route(/cdnjs\.cloudflare\.com/,q=>q.fulfill({body:cdn(q.request().url()),contentType:'application/javascript'}));
  const st=await A.evaluate(()=>localStorage.getItem(KEY));await C.addInitScript(s=>{try{localStorage.setItem('martins-v8',s)}catch(e){}},st);
  const B=await C.newPage();B.on('pageerror',e=>erros.push(e.message));await B.goto(APP+'#f='+r.qr[0]);await B.waitForSelector('.pub-f',{timeout:20000});
  let s=await B.evaluate(()=>({sessao:localStorage.getItem('martins-sessao'),fichas:document.querySelectorAll('.pub-f .a4').length,pdf:!!document.querySelector('.pub-f [data-a=docPdf]'),login:!!document.querySelector('#lgEmail,.login'),nav:getComputedStyle(document.querySelector('.nav')||document.body).display}));
  ok(!s.sessao&&!s.login,'abre sem login');ok(s.fichas===1,'mostra só a ficha de produção daquela peça');ok(s.pdf,'com o botão de baixar o PDF');
  ok(await B.evaluate(()=>[...document.querySelectorAll('.a4 span:not(.fp-bol)')].every(x=>getComputedStyle(x).borderRadius!=='50%')),'a ficha não tem bolinhas soltas nos rótulos');
  await B.goto('about:blank');await B.goto(APP+'#f='+'0'.repeat(30));await B.waitForSelector('.conect',{timeout:20000});await B.waitForTimeout(500);
  ok(/não encontrada/.test(await B.textContent('#app')),'código errado não mostra nada do sistema');await C.close();

  console.log('7) Central de dúvidas');
  ok(await A.evaluate(()=>ajBusca('etiqueta')[0]?.f.q==='Como imprimo as etiquetas do corte?'),'"etiqueta" acha a resposta certa');
  ok(await A.evaluate(()=>ajBusca('paninho cortador escrever')[0]?.f.q==='Como imprimo as etiquetas do corte?'),'"paninho cortador escrever" acha a resposta certa');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros[0]:''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
