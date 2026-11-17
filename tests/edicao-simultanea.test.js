// Teste: duas pessoas mudam o MESMO pedido quase ao mesmo tempo (auditoria, 16/11). Antes, a lista inteira (checklist, comentários,
// etiquetas) de quem gravava por último ia por cima da do outro e uma marcação sumia sem aviso. Agora o app lê o pedido do banco antes
// de gravar e junta as duas versões (mescla3). Dois aparelhos de verdade (duas sessões do navegador) num banco falso compartilhado,
// que grava como o Supabase (update junta objetos, troca listas inteiras). O aparelho B NÃO recebe a mudança do A antes de gravar.
// Rodar: NODE_PATH=$(npm root -g) node tests/edicao-simultanea.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map();const junta=(a,b)=>{if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){const o={...a};for(const k of Object.keys(b))o[k]=k in a?junta(a[k],b[k]):b[k];return o}return b};
let intercala=null,casN=0,atrasoGet=0,sempreMuda=null,recusa=null,falhaGet=null,falhaMock=false;const oplog=[];const st=x=>JSON.stringify(x,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((o,k2)=>(o[k2]=v[k2],o),{}):v);
const dbop=async(o,p,data,esp)=>{const cp=x=>x==null?x:JSON.parse(JSON.stringify(x));oplog.push([o,p]);
  if(o==='set'&&falhaMock&&/^mockp?\//.test(p))return {err:'unavailable'};
  if(o==='get'&&falhaGet&&falhaGet===p)return {err:'unavailable'};
  if((o==='updSe'||o==='setSe')&&sempreMuda===p){const d=store.get(p);d.coment=[...(d.coment||[]),{id:'cmS'+casN,t:'outro aparelho '+casN,ts:Date.now(),por:'outro',m:[]}];store.set(p,d)}
  if(o==='criaSe'){if(store.has(p))return {ok:false};store.set(p,cp(data));return {ok:true}}
  if((o==='updSe'||o==='setSe')&&recusa===p)return {ok:false};
  if(o==='setSe'){casN++;if(st(store.get(p))!==st(esp))return {ok:false};store.set(p,cp(data));return {ok:true}}
  if(o==='updSe'){casN++;if(st(store.get(p))!==st(esp))return {ok:false};store.set(p,junta(store.get(p),cp(data)));return {ok:true}}
  if(o==='get'&&atrasoGet&&p.startsWith('pedidos/'))await new Promise(r=>setTimeout(r,atrasoGet));
  if(o==='get'&&intercala&&intercala.p===p){const r={data:cp(store.get(p))||null};const f=intercala.f;intercala=null;f();return r}
  if(o==='get')return {data:cp(store.get(p))||null};if(o==='list')return [...store.entries()].filter(([k])=>k.split('/')[0]===p).map(([k,d])=>({id:k.split('/').slice(1).join('/'),data:cp(d)}));if(o==='acquire')return {acquired:true};
  if(o==='set')store.set(p,cp(data));if(o==='update'){if(!store.has(p))return {err:'invalid_argument'};store.set(p,junta(store.get(p),cp(data)))}if(o==='delete')store.delete(p);return {}};
(async()=>{const b=await chromium.launch();const erros=[];
  // 1) monta o banco a partir dos dados de demonstração
  const c0=await b.newContext();await c0.exposeFunction('__dbop',dbop);const P0=await c0.newPage();await P0.addInitScript(()=>{window.claude={use:async()=>null}});await P0.goto(APP);await P0.waitForTimeout(900);
  const docs=await P0.evaluate(()=>{seed();state=normalizar(state);return paraDocs(state)});Object.entries(docs).forEach(([k,v])=>store.set(k,v));const U=docs['usuarios/'+Object.keys(docs).find(k=>k.startsWith('usuarios/')).split('/')[1]];await c0.close();
  const us=Object.entries(docs).filter(([k])=>k.startsWith('usuarios/')).map(([,v])=>v);
  const aparelho=async(u)=>{const c=await b.newContext();await c.exposeFunction('__dbop',dbop);await c.addInitScript(fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8'));
    await c.addInitScript(u=>{window.claude=window.claude||{};try{localStorage.setItem('martins-sessao',JSON.stringify({id:u.id,email:u.email}));localStorage.setItem('martins-v8-ajuda','1')}catch(e){}},u);
    const P=await c.newPage();P.on('pageerror',e=>erros.push(e.message));await P.goto(APP);await P.waitForFunction(()=>typeof NV!=='undefined'&&NV.pronto&&NV.modo==='nuvem',null,{timeout:20000});await P.waitForTimeout(600);return P};
  const A=await aparelho(us[0]),B=await aparelho(us[1]||us[0]);
  const espera=P=>P.waitForFunction(()=>!NV.busy&&!NV.Q.size,null,{timeout:15000});
  const PID=await A.evaluate(()=>state.pedidos.find(p=>!p.concluido&&!p.cancelado).id);
  console.log('1) Checklist: cada um marca um item');
  await A.evaluate(id=>{const p=pedById(id);A.qdCk({id,g:qdCkDe(p)[0].id,i:qdCkDe(p)[0].itens[0].id})},PID);await espera(A);
  await B.evaluate(id=>{const p=pedById(id);A.qdCk({id,g:qdCkDe(p)[0].id,i:qdCkDe(p)[0].itens[1].id})},PID);await espera(B);
  let s=store.get('pedidos/'+PID);ok(s.ck&&s.ck[0].itens[0].ok&&s.ck[0].itens[1].ok,'no banco ficaram as duas marcações (antes, a do B apagava a do A)');
  ok(s.ck[0].itens[0].por&&s.ck[0].itens[1].por,'cada item guarda quem marcou');
  let r=await B.evaluate(id=>{const p=pedById(id);return [p.ck[0].itens[0].ok,p.ck[0].itens[1].ok]},PID);ok(r[0]&&r[1],'o aparelho B passa a mostrar também a marcação do A');
  console.log('2) Comentários ao mesmo tempo');
  await A.evaluate(id=>{ui.sheet={t:'pedido',id};render();document.getElementById('cmNovo').value='Comentário do A';A.cmEnvia({id})},PID);await espera(A);
  await B.evaluate(id=>{ui.sheet={t:'pedido',id};render();document.getElementById('cmNovo').value='Comentário do B';A.cmEnvia({id})},PID);await espera(B);
  s=store.get('pedidos/'+PID);ok((s.coment||[]).map(c=>c.t).sort().join('|')==='Comentário do A|Comentário do B','os dois comentários ficaram no pedido');
  console.log('3) Um tira responsável, o outro põe etiqueta');
  const uid=us[0].id;await A.evaluate(([id,u])=>{const p=pedById(id);if(!(p.resp||[]).includes(u))A.qdResp({id,u})},[PID,uid]);await espera(A);
  await B.evaluate(([id,u])=>{const p=pedById(id);p.resp=[...(p.resp||[]),u];p.respEm={...(p.respEm||{}),[u]:{ts:now(),por:'x'}};save()},[PID,uid]);await espera(B);
  await A.evaluate(([id,u])=>{A.qdResp({id,u})},[PID,uid]);await espera(A);   // A tira
  await B.evaluate(id=>A.qdEtq({id,e:'urgente'}),PID);await espera(B);           // B (sem saber) põe etiqueta
  s=store.get('pedidos/'+PID);ok(!(s.resp||[]).includes(uid)&&(s.etq||[]).includes('urgente'),'o responsável tirado continua fora e a etiqueta posta continua lá');
  ok(s.ck&&s.ck[0].itens[0].ok&&s.ck[0].itens[1].ok&&(s.coment||[]).length===2,'nada do que já estava (checklist, comentários) se perdeu no caminho');
  console.log('4) Sem conflito: grava como antes');
  await A.evaluate(id=>{A.qdCk({id,g:qdCkDe(pedById(id))[1].id,i:qdCkDe(pedById(id))[1].itens[0].id})},PID);await espera(A);
  s=store.get('pedidos/'+PID);ok(s.ck[1].itens[0].ok&&s.ck[0].itens[0].ok,'uma mudança sozinha grava normalmente');
  const um=await A.evaluate(()=>{const b={a:1,l:['x','y'],c:[{id:1,v:1}]};return JSON.stringify(mescla3(b,{a:2,l:['x','y','m'],c:[{id:1,v:2}]},{a:1,l:['y','t'],c:[{id:1,v:1},{id:2,v:9}]}))});
  ok(um==='{"a":2,"l":["y","m","t"],"c":[{"id":1,"v":2},{"id":2,"v":9}]}','junção: valor mudado de um lado vale; lista simples junta e tira; lista com id junta item a item ('+um+')');

  console.log('5) Com a migração 019: outro aparelho grava entre a leitura e a gravação');
  const sem019=await B.evaluate(()=>NV.cas);
  await B.evaluate(()=>{NV.cas=undefined;const d0=NV.db.doc.bind(NV.db);NV.db.doc=p=>{const r=d0(p);r.updateSe=async(d,esp)=>{const x=await window.__dbop('updSe',p,d,esp);return x.ok===true};r.setSe=async(d,esp)=>{const x=await window.__dbop('setSe',p,d,esp);return x.ok===true};r.criaSe=async d=>(await window.__dbop('criaSe',p,d)).ok===true;return r}});
  intercala={p:'pedidos/'+PID,f:()=>{const d=store.get('pedidos/'+PID);d.coment=[...(d.coment||[]),{id:'cmX',t:'Gravado no meio',ts:Date.now(),por:'outro',m:[]}];store.set('pedidos/'+PID,d)}};
  await B.evaluate(id=>A.qdEtq({id,e:'nao-atrasar'}),PID);await espera(B);
  s=store.get('pedidos/'+PID);ok((s.coment||[]).some(c=>c.id==='cmX')&&(s.etq||[]).includes('nao-atrasar')&&casN>=2,`a gravação condicional recusou a versão velha, o app juntou e gravou de novo (${casN} tentativas); nada se perdeu`);

  console.log('6) Quem está digitando não perde o texto quando o app junta as versões');
  await A.evaluate(id=>{ui.sheet={t:'pedido',id};render();document.getElementById('cmNovo').value='Outro do A';A.cmEnvia({id})},PID);await espera(A);
  atrasoGet=500;await B.evaluate(id=>{ui.sheet={t:'pedido',id};render();const p=pedById(id);A.qdCk({id,g:qdCkDe(p)[1].id,i:qdCkDe(p)[1].itens[1].id});const c=document.getElementById('cmNovo');window.__cm=c;window.__blur=0;c.addEventListener('blur',()=>window.__blur++);c.focus();c.value='digitando no B'},PID);
  await espera(B);atrasoGet=0;await B.waitForTimeout(150);
  r=await B.evaluate(id=>({txt:document.getElementById('cmNovo').value,mesmo:document.getElementById('cmNovo')===window.__cm,blur:window.__blur,tem:(pedById(id).coment||[]).some(c=>c.t==='Outro do A')}),PID);
  ok(r.txt==='digitando no B'&&r.mesmo&&r.blur===0&&r.tem,'o campo não é redesenhado (texto e cursor ficam); o comentário do A entra nos dados e aparece ao fechar o pedido');

  r=await B.evaluate(()=>{ui.sheet=null;ui.tela='cadastros';ui.cad='ajustes';render();const e=document.getElementById('casSt');return {cas:NV.cas,txt:e?e.textContent:document.body.innerText.slice(0,0)}});
  ok(sem019===false&&r.cas===true,'sem a 019 o app sabe que a proteção é parcial; com a 019 passa a "completa"');
  const PP='pedidos/'+PID,escritas=desde=>oplog.slice(desde).filter(([o,p])=>p===PP&&(o==='set'||o==='update')).length;

  console.log('7) Com a 019: outro aparelho grava sem parar no mesmo pedido');
  let o0=oplog.length;sempreMuda=PP;await B.evaluate(()=>{ui.tela='pedidos';render()});
  await B.evaluate(id=>A.qdEtq({id,e:'evento'}),PID);
  await B.waitForFunction(p=>NV.conf&&NV.conf[p]>=1,PP,{timeout:15000});
  r=await B.evaluate(p=>({fila:NV.Q.has(p),st:NV.st,txt:document.getElementById('sync').textContent,toast:document.getElementById('toast').innerText}),PP);
  ok(escritas(o0)===0,'depois das tentativas recusadas, NENHUMA gravação sem condição foi feita ('+escritas(o0)+' gravações diretas)');
  ok(r.fila&&r.st==='conflito'&&/outra pessoa/.test(r.txt),'a mudança continua na fila e a tela avisa que outra pessoa estava mexendo');
  sempreMuda=null;await B.waitForFunction(p=>!NV.Q.has(p)&&!NV.busy,PP,{timeout:20000});s=store.get(PP);
  ok(s.evento===true&&(s.coment||[]).filter(c=>/^outro aparelho/.test(c.t)).length>=4&&(s.coment||[]).some(c=>c.t==='Gravado no meio'),'quando o outro para, o app tenta de novo sozinho: a etiqueta entra e nenhum comentário do outro some');


  console.log('8) A leitura do banco falha');
  o0=oplog.length;falhaGet=PP;await B.evaluate(id=>A.qdEtq({id,e:'evento'}),PID);
  await B.waitForFunction(p=>NV.st==='off'&&NV.Q.has(p)&&!NV.busy,PP,{timeout:15000});
  ok(escritas(o0)===0&&!oplog.slice(o0).some(([o,p])=>p===PP&&/Se$/.test(o)),'sem conseguir ler, não grava nada (nem com dados antigos)');
  falhaGet=null;await B.waitForFunction(p=>!NV.Q.has(p)&&!NV.busy,PP,{timeout:20000});
  ok(!store.get(PP).evento,'quando a leitura volta, grava a mudança pendente (tirou a etiqueta)');

  console.log('9) Mudança que tira um campo usa a gravação condicional do documento inteiro (doc_set_se)');
  await B.evaluate(id=>{pedById(id).zzTeste=1;save()},PID);await espera(B);o0=oplog.length;
  await B.evaluate(id=>{delete pedById(id).zzTeste;save()},PID);await espera(B);
  ok(!('zzTeste' in store.get(PP))&&oplog.slice(o0).some(([o,p])=>o==='setSe'&&p===PP)&&escritas(o0)===0,'o campo saiu com doc_set_se, sem gravação direta');

  console.log('10) Mudança feita no aparelho enquanto ele grava');
  atrasoGet=500;await B.evaluate(id=>{A.qdEtq({id,e:'urgente'});setTimeout(()=>{const p=pedById(id);p.coment=[...(p.coment||[]),{id:'cmL',t:'escrito durante a gravação',ts:Date.now(),por:'B',m:[]}];save()},150)},PID);
  await B.waitForTimeout(300);atrasoGet=0;await B.waitForFunction(p=>!NV.Q.has(p)&&!NV.busy,PP,{timeout:20000});await B.waitForTimeout(300);await espera(B);s=store.get(PP);
  r=await B.evaluate(id=>(pedById(id).coment||[]).some(c=>c.id==='cmL'),PID);
  ok((s.coment||[]).some(c=>c.id==='cmL')&&r,'o comentário escrito no meio da gravação não some (nem na tela, nem no banco)');

  console.log('11) Banco sem a 019 (função não existe)');
  await B.evaluate(()=>{NV.cas=undefined;const d0=NV.db.doc.bind(NV.db);NV.db.doc=p=>{const r=d0(p);r.updateSe=async()=>null;r.setSe=async()=>null;return r}});
  const addCm=(P,txt)=>P.evaluate(([id,txt])=>{const p=pedById(id);p.coment=[...(p.coment||[]),{id:'c'+txt.length+Date.now(),t:txt,ts:Date.now(),por:'x',m:[]}];save()},[PID,txt]);
  await addCm(A,'sem 019 do A');await espera(A);await addCm(B,'sem 019 do B');await espera(B);s=store.get(PP);
  r=await B.evaluate(()=>{ui.tela='cadastros';ui.cad='ajustes';render();return {cas:NV.cas,txt:(document.getElementById('casSt')||{}).textContent||''}});
  ok(r.cas===false&&/parcial/.test(r.txt)&&/019/.test(r.txt),'o app detecta e mostra em Ajustes › Onde ficam os dados: "proteção parcial", falta a 019');
  ok(['sem 019 do A','sem 019 do B'].every(x=>(s.coment||[]).some(c=>c.t===x)),'mesmo sem a 019, mudanças em momentos diferentes não se perdem (lê e junta antes de gravar)');
  await B.evaluate(()=>{ui.tela='pedidos';render()});

  console.log('12) Anexos do Trello: só conta como copiado depois de conferido na nuvem');
  await B.route('https://trello.com/**',r_=>{const u=r_.request().url();if(/ok\d?\.pdf/.test(u))return r_.fulfill({status:200,body:Buffer.alloc(2048,7),headers:{'access-control-allow-origin':'*','content-type':'application/pdf'}});
    if(/grande\.pdf/.test(u))return r_.fulfill({status:200,body:Buffer.alloc(16*1048576,1),headers:{'access-control-allow-origin':'*','content-type':'application/pdf'}});return r_.fulfill({status:401,body:'x',headers:{'access-control-allow-origin':'*'}})});
  await B.evaluate(id=>{const p=pedById(id);const mk=(i,n,tam)=>({id:'trx'+i,cli:p.cli||null,tipo:'link',link:'https://trello.com/1/cards/C/attachments/'+i+'/download/'+n,nome:n,tam,ts:now(),tr:'tx'+i,trDep:true,por:'importação'});
    state.arquivos=[...(state.arquivos||[]),mk(1,'ok.pdf',2048),mk(2,'ok2.pdf',2048),mk(3,'grande.pdf',16*1048576),mk(4,'login.pdf',100),mk(5,'ok5.pdf',2048)];p.anexos=[...(p.anexos||[]),'trx1','trx2','trx3','trx4','trx5'];save()},PID);await espera(B);
  falhaMock=true;r=await B.evaluate(async()=>{const n0=state.arquivos.length;const x=await trCopiar('trx1');const a=arqById('trx1');return {x,link:!!a.link,dep:a.trDep,erro:a.trErro&&a.trErro.motivo,n:state.arquivos.length-n0,copia:!!a.trCopia}});
  ok(!r.x.ok&&/nuvem/.test(r.x.motivo)&&r.link&&r.dep&&!r.copia&&r.n===0,'envio para a nuvem falhou: não marca como copiado, o link do Trello continua e o motivo fica guardado');
  falhaMock=false;r=await B.evaluate(async()=>{const n0=state.arquivos.length;const [x,y]=await Promise.all([trCopiar('trx1'),trCopiar('trx1')]);const a=arqById('trx1');return {x,y,link:!!a.link,dep:a.trDep,bin:a.bin,ver:a.ver&&a.ver[0]&&a.ver[0].link,n:state.arquivos.length-n0,erro:!!a.trErro}});
  const m1=store.get('mock/'+r.bin);
  ok(r.x.ok&&/já está copiando/.test(r.y.motivo),'dois toques seguidos: copia uma vez só');
  ok(!r.link&&r.dep===false&&r.bin==='A-trx1t'&&m1&&m1.tam>2048&&r.n===0&&!r.erro,'na nova tentativa: arquivo conferido na nuvem ('+(m1&&m1.tam)+' caracteres), mesma chave da tentativa anterior, nenhum arquivo repetido');
  ok(/trello\.com/.test(r.ver||''),'o link original do Trello fica guardado nas versões');
  r=await B.evaluate(async()=>{const x=await trCopiar('trx3');const RD=FileReader.prototype.readAsDataURL;FileReader.prototype.readAsDataURL=function(){setTimeout(()=>this.onerror&&this.onerror(new Error('x')),0)};const y=await trCopiar('trx5');FileReader.prototype.readAsDataURL=RD;const z=await trCopiar('trx4');return {x,y,z,dep:['trx3','trx4','trx5'].map(i=>arqById(i).trDep&&!!arqById(i).link)}});
  ok(!r.x.ok&&/15 MB/.test(r.x.motivo),'arquivo acima de 15 MB: identificado ('+r.x.motivo+')');ok(!r.y.ok&&/ler/.test(r.y.motivo),'falha ao ler o arquivo: identificada');ok(!r.z.ok&&/login/.test(r.z.motivo),'Trello pedindo login: identificado');
  ok(r.dep.every(Boolean),'nos três casos o anexo continua apontando para o Trello');
  r=await B.evaluate(async()=>{ui.tela='cadastros';ui.cad='ajustes';render();await A.trCopiaTodos();const t=document.getElementById('toast').innerText;render();return {t,c:(document.getElementById('trConta')||{}).textContent||'',dep:trDependentes().length}});
  ok(/2 anexos copiados e conferidos/.test(r.t)&&/2 continuam no Trello/.test(r.t),'"Tentar copiar todos" diz quantos foram copiados de verdade e quantos faltam ('+r.t.replace(/\s+/g,' ')+')');
  ok(/Copiados e conferidos: 3 · Pendentes: 2/.test(r.c)&&r.dep===2,'Ajustes › Quadro mostra copiados e pendentes ('+r.c+')');
  r=await B.evaluate(async()=>{const a0=NV.db.arq;NV.db.arq={sobe:async()=>{},apaga:async()=>{}};const nome=await arqPut('ZZst1','data:text/plain;base64,QUJD');NV.db.arq=a0;return nome});
  ok(/^b\//.test(r)&&store.get('mock/ZZst1').st===r,'com o Storage: arqPut devolve o nome gravado, que é o que a conferência compara no registro do arquivo');
  console.log('13) "Enviar a cópia" (arquivo escolhido à mão) também só marca depois de conferir');
  falhaMock=true;r=await B.evaluate(async()=>{const n0=state.arquivos.length;await arqEnviar([new File([new Uint8Array(3000).fill(5)],'login.pdf',{type:'application/pdf'})],{cli:arqById('trx4').cli,tipo:'auto',troca:'trx4'});const a=arqById('trx4');return {link:!!a.link,dep:a.trDep,n:state.arquivos.length-n0}});
  ok(r.link&&r.dep&&r.n===0,'falhou o envio: continua o link do Trello e não aparece arquivo novo');
  falhaMock=false;r=await B.evaluate(async()=>{await arqEnviar([new File([new Uint8Array(3000).fill(5)],'login.pdf',{type:'application/pdf'})],{cli:arqById('trx4').cli,tipo:'auto',troca:'trx4'});const a=arqById('trx4');return {link:!!a.link,dep:a.trDep,bin:a.bin,como:a.trCopia&&a.trCopia.como}});
  ok(r.bin==='A-trx4m'&&[...store.keys()].filter(k=>/^mock\/A-trx4/.test(k)&&!/~c$/.test(k)).length===1,'a nova tentativa usa a mesma chave da que falhou (sem arquivo repetido)');
  ok(!r.link&&r.dep===false&&store.get('mock/'+r.bin)&&r.como==='arquivo enviado','enviado de novo: conferido na nuvem e só então marcado como copiado');

  console.log('14) O banco recusa sem ninguém ter mexido');
  await B.evaluate(()=>{NV.cas=undefined;NV.casSet=undefined;const d0=NV.db.doc.bind(NV.db);NV.db.doc=p=>{const r=d0(p);r.updateSe=async(d,esp)=>(await window.__dbop('updSe',p,d,esp)).ok===true;r.setSe=async(d,esp)=>(await window.__dbop('setSe',p,d,esp)).ok===true;return r}});
  let o1=oplog.length;recusa=PP;await B.evaluate(id=>A.qdEtq({id,e:'evento'}),PID);
  await B.waitForFunction(p=>NV.conf&&NV.conf[p]>=1&&!NV.busy,PP,{timeout:15000});
  r=await B.evaluate(p=>({st:NV.st,fila:NV.Q.has(p),soLer:!!NV.soLer}),PP);
  ok(escritas(o1)===0&&r.fila&&r.st==='conflito'&&!r.soLer,'não grava nada, a mudança fica na fila e o app não descarta o que está pendente');
  console.log('15) Um pedido em conflito não segura os outros documentos');
  const outroLote=await B.evaluate(()=>{const l=state.lotes[0];l.obsTeste='salvou mesmo assim';save();return 'lotes/'+l.id});
  await B.waitForFunction(p=>!NV.Q.has(p),outroLote,{timeout:15000});
  ok(store.get(outroLote).obsTeste==='salvou mesmo assim'&&await B.evaluate(p=>NV.Q.has(p),PP),'o lote salvou enquanto o pedido em conflito continua esperando');
  recusa=null;await B.waitForFunction(p=>!NV.Q.has(p)&&!NV.busy,PP,{timeout:20000});
  ok(store.get(PP).evento===true,'quando o banco aceita, o pedido pendente é salvo');
  console.log('16) Banco com doc_update_se mas sem doc_set_se');
  await B.evaluate(()=>{NV.cas=undefined;NV.casSet=undefined;const d0=NV.db.doc.bind(NV.db);NV.db.doc=p=>{const r=d0(p);r.updateSe=async(d,esp)=>(await window.__dbop('updSe',p,d,esp)).ok===true;r.setSe=async()=>null;return r}});
  await B.evaluate(id=>{pedById(id).zz2=1;save()},PID);await espera(B);await B.evaluate(id=>{delete pedById(id).zz2;save()},PID);await espera(B);
  await B.evaluate(id=>A.qdEtq({id,e:'evento'}),PID);await espera(B);
  r=await B.evaluate(()=>({cas:NV.cas,set:NV.casSet,txt:casTexto()}));
  ok(!('zz2' in store.get(PP))&&!store.get(PP).evento&&r.cas===true&&r.set===false&&/quase completa/.test(r.txt),'só a mudança que tira campo fica sem condição; o resto continua protegido e Ajustes diz "quase completa"');
  console.log('17) Pedido apagado neste aparelho enquanto ele grava');
  const novoId=await B.evaluate(()=>{const p=JSON.parse(JSON.stringify(state.pedidos.find(p=>!p.cancelado)));p.id='TESTE-APAGA';p.coment=[];state.pedidos.push(p);save();return p.id});await espera(B);
  atrasoGet=400;await B.evaluate(id=>{pedById(id).obs='mudou';save();setTimeout(()=>{state.pedidos=state.pedidos.filter(p=>p.id!==id);save()},150)},novoId);
  await B.waitForTimeout(600);atrasoGet=0;await espera(B);await B.waitForTimeout(300);await espera(B);
  ok(!store.has('pedidos/'+novoId),'a exclusão feita no meio da gravação chega ao banco');
  console.log('18) Com a 019: pedido apagado em outro aparelho e editado neste volta, sem passar por cima de quem criou no meio');
  await B.evaluate(()=>{NV.cas=undefined;NV.casSet=undefined;const d0=NV.db.doc.bind(NV.db);NV.db.doc=p=>{const r=d0(p);r.updateSe=async(d,esp)=>(await window.__dbop('updSe',p,d,esp)).ok===true;r.setSe=async(d,esp)=>(await window.__dbop('setSe',p,d,esp)).ok===true;r.criaSe=async d=>(await window.__dbop('criaSe',p,d)).ok===true;return r}});
  let o2=oplog.length;store.delete(PP);await B.evaluate(id=>{const p=pedById(id);p.obs='editado depois de apagado lá';save()},PID);await espera(B);
  ok(store.get(PP)&&store.get(PP).obs==='editado depois de apagado lá'&&oplog.slice(o2).some(([o,p])=>o==='criaSe'&&p===PP)&&escritas(o2)===0,'recriado com doc_criar_se (sem gravação direta)');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.slice(0,3).join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
