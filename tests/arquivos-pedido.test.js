// Teste: arquivos do pedido com quem enviou, versões, tipo, link e exclusão registrada; comentários com menção (fase 2 do quadro, 16/11).
// Confere: "Enviado por … em …", "Editado por … em …" com selo, versão nova guarda a anterior (baixável), tirar do pedido deixa registro
// ("Excluído por"), pôr de volta, link, arrastar e soltar vários, comentário com autor/hora/"editado em" e aviso a quem precisa ver,
// histórico do pedido e eventos do catálogo; 360×640 sem cortes, alvos ≥ 48px, letra ≥ 16px.
// Rodar: NODE_PATH=$(npm root -g) node tests/arquivos-pedido.test.js
const { chromium } = require('playwright');const path=require('path'),fs=require('fs'),os=require('os');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'arqped-'));const F=n=>path.join(tmp,n);
fs.copyFileSync(path.join(__dirname,'fixtures/mockup-marinho.png'),F('foto amostra.png'));fs.writeFileSync(F('logo peito.emb'),'EMB-teste-1');fs.writeFileSync(F('ficha 6262.docx'),'docx-v1');fs.writeFileSync(F('ficha 6262 v2.docx'),'docx-versao-2');
(async()=>{const b=await chromium.launch();const erros=[];
  const A=await b.newPage({viewport:{width:900,height:1000}});A.on('pageerror',e=>erros.push(e.message));await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  const PID=await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;const p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&p.cli);ui.tela='pedidos';ui.pv='qd';ui.blk={['anx'+p.id]:true,['cm'+p.id]:true,['qh'+p.id]:true,['qd'+p.id]:true};A.pedido({id:p.id});return p.id});
  const espera=n=>A.waitForFunction(([id,n])=>(pedById(id).anexos||[]).length>=n,[PID,n],{timeout:15000});

  console.log('1) Enviar vários de uma vez: quem enviou, quando, tipo e tamanho');
  await A.evaluate(id=>A.anxPedAdd({id}),PID);await A.setInputFiles('#fArq',[F('foto amostra.png'),F('logo peito.emb'),F('ficha 6262.docx')]);await espera(3);await A.waitForTimeout(300);
  let r=await A.evaluate(id=>{const L=anexosPed(pedById(id)),eu=quemNome();const txt=document.querySelector('[data-blk="anx'+id+'"]').innerText;return {n:L.length,por:L.every(a=>a.por===eu&&a.ts>now()-6e4),cat:L.map(a=>a.cat),eu,enviado:(txt.match(/Enviado por/g)||[]).length,tam:/KB/.test(txt),hist:qdHistLista(pedById(id)).filter(e=>/Enviou o arquivo/.test(e.t)).length}},PID);
  ok(r.n===3&&r.por,'3 arquivos no pedido, cada um com quem enviou e quando ('+r.eu+')');
  ok(r.cat.join(',')==='foto,bordado,ficha','tipo do arquivo pelo formato: foto, bordado, ficha de produção ('+r.cat+')');
  ok(r.enviado>=3&&r.tam,'na lista: "Enviado por … em …" e o tamanho');ok(r.hist===3,'cada envio vai para o histórico do pedido');

  console.log('2) Mudar o nome e o tipo');
  r=await A.evaluate(id=>{const a=anexosPed(pedById(id))[1];A.axEd({k:a.id+'|p'});document.getElementById('axN-'+a.id).value='Programa bordado peito.emb';A.axNome({id:a.id,ped:id});A.axCat({id:a.id,ped:id,v:'fotolito'});
    const t=document.querySelector('[data-blk="anx'+id+'"]').innerText;return {nome:a.nome,ed:a.ed,cat:a.cat,selo:/editado/.test(t),edt:/Editado por/.test(t)}},PID);
  ok(r.nome==='Programa bordado peito.emb'&&r.ed&&r.ed.por&&r.ed.ts,'nome novo com quem mudou e quando');ok(r.selo&&r.edt,'selo "editado" e "Editado por … em …" na lista');ok(r.cat==='fotolito','tipo trocado para Fotolito/Tela');

  console.log('3) Versão nova guarda a anterior');
  const antes=await A.evaluate(id=>{const a=anexosPed(pedById(id)).find(a=>/ficha 6262/.test(a.nome));A.axEd({k:a.id+'|p'});A.axTroca({id:a.id,ped:id});return {id:a.id,bin:a.bin}},PID);
  await A.setInputFiles('#fArq',[F('ficha 6262 v2.docx')]);await A.waitForFunction(id=>(arqById(id).ver||[]).length===1,antes.id,{timeout:15000});await A.waitForTimeout(200);
  r=await A.evaluate(([id,pid])=>{const a=arqById(id);const t=document.querySelector('[data-blk="anx'+pid+'"]').innerText;return {mesmo:(pedById(pid).anexos||[]).includes(id)&&state.arquivos.filter(x=>x.nome==='ficha 6262 v2.docx').length===1,
    v0:a.ver[0],bin:a.bin,nome:a.nome,ed:a.ed&&a.ed.o,vers:/Versão 1: ficha 6262\.docx/.test(t)&&/Versão 2 \(a de agora\)/.test(t),bt:!!document.querySelector('[data-a=axVerBaixar]'),h:qdHistLista(pedById(pid)).some(e=>/versão 2/.test(e.t))}},[antes.id,PID]);
  ok(r.mesmo&&r.nome==='ficha 6262 v2.docx'&&r.bin!==antes.bin,'o arquivo continua o mesmo no pedido, agora com o conteúdo novo');
  ok(r.v0&&r.v0.bin===antes.bin&&r.v0.nome==='ficha 6262.docx'&&r.v0.por,'a versão anterior fica guardada com quem enviou e quando');
  ok(r.vers&&r.bt,'lista de versões com Baixar na anterior');ok(r.ed==='versão nova'&&r.h,'conta como editado e vai para o histórico');
  r=await A.evaluate(async id=>{const a=arqById(id);const d=await pegaBin(a.ver[0].bin);return d&&atob(d.split(',')[1])},antes.id);ok(r==='docx-v1','a versão antiga ainda abre ('+r+')');

  console.log('4) Tirar do pedido deixa registro');
  r=await A.evaluate(id=>{const a=anexosPed(pedById(id))[0];A.axEd({k:a.id+'|p'});document.querySelector(`[data-a=anxPedRm][data-a2="${a.id}"]`).click();const pede=!!ui.conf;A.confSim();const p=pedById(id);
    const t=document.querySelector('[data-blk="anx'+id+'"]').textContent;return {pede,fora:!(p.anexos||[]).includes(a.id),reg:(p.arqRm||[]).find(x=>x.id===a.id),guardado:!!arqById(a.id),txt:/Excluído por/.test(t)&&/Arquivos tirados do pedido \(1\)/.test(t),h:qdHistLista(p).some(e=>/Excluiu o arquivo/.test(e.t)),id:a.id}},PID);
  ok(r.pede&&r.fora,'tirar pede confirmação e tira do pedido');ok(r.reg&&r.reg.por&&r.reg.ts&&r.guardado,'o registro fica (quem tirou e quando) e o arquivo continua guardado');ok(r.txt&&r.h,'"Excluído por … em …" no pedido e no histórico');
  r=await A.evaluate(([pid,id])=>{A.axVolta({id,ped:pid});return (pedById(pid).anexos||[]).includes(id)},[PID,r.id]);ok(r,'Pôr de volta');

  console.log('5) Link e arrastar e soltar');
  r=await A.evaluate(id=>{A.axLink({id});document.getElementById('axLU').value='drive.google.com/pasta/123';document.getElementById('axLN').value='Fotos no Drive';A.axLinkOk({id});const a=anexosPed(pedById(id)).find(a=>a.link);
    return {a:a&&{link:a.link,nome:a.nome,por:a.por},abrir:!!document.querySelector(`[data-a=axAbrir][data-id="${a&&a.id}"]`)}},PID);
  ok(r.a&&r.a.link==='https://drive.google.com/pasta/123'&&r.a.nome==='Fotos no Drive'&&r.a.por,'link anexado com nome e quem pôs');ok(r.abrir,'link tem o botão Abrir');
  r=await A.evaluate(async id=>{const n0=pedById(id).anexos.length;const z=document.querySelector(`.anx-g[data-drop="${id}"]`);const dt=new DataTransfer();dt.items.add(new File(['corel'],'arte cliente.cdr'));dt.items.add(new File(['pdf'],'orcamento.pdf',{type:'application/pdf'}));
    z.dispatchEvent(new DragEvent('dragover',{dataTransfer:dt,bubbles:true,cancelable:true}));const marca=z.classList.contains('ax-drop-on');z.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));
    for(let k=0;k<50&&pedById(id).anexos.length<n0+2;k++)await new Promise(r=>setTimeout(r,100));return {marca,n:pedById(id).anexos.length-n0,nomes:anexosPed(pedById(id)).map(a=>a.nome).slice(-2)}},PID);
  ok(r.marca&&r.n===2,'arrastar e soltar dois arquivos de uma vez ('+r.nomes.join(', ')+')');

  console.log('6) Comentários');
  r=await A.evaluate(id=>{const u2=state.usuarios[1];document.getElementById('cmNovo').value='Cliente pediu bordado branco';A.cmMarca({id,u:u2.id});const kept=document.getElementById('cmNovo').value;A.cmEnvia({id});const c=pedById(id).coment[0];
    const t=document.querySelector('[data-blk="cm'+id+'"]').innerText;return {kept,c:{t:c.t,por:c.por,m:c.m,ts:c.ts>now()-6e4},avisou:/Avisou: @/.test(t),nome:uNomeQ(u2),h:qdHistLista(pedById(id)).some(e=>/Comentou/.test(e.t))}},PID);
  ok(r.kept==='Cliente pediu bordado branco','marcar quem avisar não apaga o texto');ok(r.c.por&&r.c.ts&&r.c.m.length===1,'comentário com autor, hora e quem precisa ver');ok(r.avisou&&r.h,'mostra "Avisou: @'+r.nome+'" e vai para o histórico');
  r=await A.evaluate(id=>{const c=pedById(id).coment[0];A.cmEd({c:c.id});document.getElementById('cmEdT').value='Cliente pediu bordado branco e azul';A.cmEdOk({id,c:c.id});const t=document.querySelector('[data-blk="cm'+id+'"]').innerText;return {t:c.t,ed:!!c.ed,hist:c.hist&&c.hist[0].t,txt:/editado em/.test(t)}},PID);
  ok(r.t==='Cliente pediu bordado branco e azul'&&r.ed&&r.txt,'mudar o próprio comentário mostra "editado em"');ok(r.hist==='Cliente pediu bordado branco','o texto anterior fica guardado');
  r=await A.evaluate(id=>{const u2=state.usuarios[1];document.getElementById('cmNovo').value='Falar com @'+uNomeQ(u2)+' amanhã';A.cmEnvia({id});const c=pedById(id).coment[1];const outro=state.usuarios[1];SESSAO={id:outro.id,email:outro.email};render();
    const bts=[...document.querySelectorAll('[data-blk="cm'+id+'"] [data-a=cmEd]')].length;const u0=state.usuarios[0];SESSAO={id:u0.id,email:u0.email};render();return {m:c.m.includes(u2.id),bts,neg:(A.cmEdOk({id,c:c.id}),true)}},PID);
  ok(r.m,'escrever @Nome também avisa a pessoa');ok(r.bts===0,'quem não escreveu não tem o botão de mudar');

  console.log('7) Eventos, observação editada e celular');
  r=await A.evaluate(()=>{const T=EV.fila.map(e=>e.tipo);return {fora:[...new Set(T.filter(t=>!EV_TIPOS[t]))],tem:['arquivo.enviado','arquivo.editado','arquivo.nova_versao','arquivo.tirado','comentario.criado','comentario.editado'].every(t=>T.includes(t))}});
  ok(!r.fora.length&&r.tem,'eventos do catálogo para envio, edição, versão, exclusão e comentários'+(r.fora.length?': '+r.fora:''));
  r=await A.evaluate(id=>{const p=pedById(id);p.obs='Gola branca';p.obsEd={ts:now(),por:'Fulana'};render();return /Editado por Fulana/.test(document.querySelector('.ped-head').innerText)},PID);ok(r,'observações mostram "Editado por … em …"');
  await A.setViewportSize({width:360,height:640});await A.evaluate(id=>{ui.axEd=anexosPed(pedById(id))[0].id+'|p';render()},PID);await A.waitForTimeout(200);
  r=await A.evaluate(id=>{const S=document.querySelector('#sheet');const zona=[...S.querySelectorAll(`[data-blk="anx${id}"],[data-blk="cm${id}"]`)];
    const largo=zona.flatMap(z=>[...z.querySelectorAll('*')]).filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>window.innerWidth+1}).map(e=>e.className).slice(0,3);
    const peq=zona.flatMap(z=>[...z.querySelectorAll('button,summary')]).filter(e=>e.offsetParent&&e.getBoundingClientRect().height<48).map(e=>(e.dataset.a||e.className||e.tagName)+':'+e.textContent.trim().slice(0,15));
    const letra=zona.flatMap(z=>[...z.querySelectorAll('*')]).filter(e=>e.offsetParent&&!e.closest('.dica')&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<16).map(e=>e.textContent.trim().slice(0,20));
    return {largo,peq:peq.slice(0,5),letra:letra.slice(0,5)}},PID);
  ok(!r.largo.length&&!r.peq.length&&!r.letra.length,'360×640: sem cortes, alvos ≥ 48px, letra ≥ 16px'+JSON.stringify(r));
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.slice(0,3).join(' | '):''));
  await b.close();fs.rmSync(tmp,{recursive:true,force:true});console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
