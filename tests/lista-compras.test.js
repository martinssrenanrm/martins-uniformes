// Teste: pedido da Martins de 28/10. Lista de compras com tudo que falta, somada por item, para imprimir, PDF ou WhatsApp.
// Rodar: NODE_PATH=$(npm root -g) node tests/lista-compras.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:820,height:1100}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null};window.print=()=>{window.__impresso=(window.__impresso||0)+1};window.open=u=>{window.__aberto=u}});await A.goto(APP);await A.waitForTimeout(1200);
  let r=await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.inicio=null;
    state.pedidos.forEach(p=>p.materiais.forEach(m=>{m.conf=true;m.st='ok'}));const ps=state.pedidos.filter(p=>!p.concluido).slice(0,2);
    ps.forEach(p=>{p.materiais.push({item:'Linha teste azul',un:'un',nec:10,est:0,conf:true,st:'comprar'})});ps[0].materiais.push({item:'Botão teste',un:'un',nec:50,est:20,conf:false,st:'comprar'});ps[1].materiais.push({item:'Zíper teste',un:'un',nec:5,est:0,conf:true,st:'pedido'});ps[1].evento=true;
    RC={};ui.sheet=null;A.fz({v:'esc'});const bt=!!document.querySelector('[data-a=compras]');
    const L=listaCompras();const lin=L.comprar.find(o=>o.item==='Linha teste azul'),bot=L.comprar.find(o=>o.item==='Botão teste');
    A.compras();const tela=document.getElementById('sheet').innerText;const txt=textoCompras(L);const pg=docCompras(L);
    return {bt,lin:lin&&lin.q,linPeds:lin&&lin.peds.length,bot:bot&&bot.q,botEst:bot&&bot.est,chegar:L.chegar.map(o=>o.item),tela:/Lista de compras/.test(tela)&&/Linha teste azul/.test(tela)&&/Enviar no WhatsApp/.test(tela)&&/Baixar PDF/.test(tela)&&/Imprimir/.test(tela),
      txt:/\*Lista de compras/.test(txt)&&/Linha teste azul\*: 20 unidades/.test(txt)&&/Zíper teste/.test(txt),evento:/★/.test(txt),pg:pg.length,doc:/LISTA DE COMPRAS/.test(pg[0])&&/Linha teste azul/.test(pg[0]),ids:ps.map(p=>p.id)}});
  ok(r.bt,'o Escritório tem o botão "Lista de compras"');
  ok(r.lin===20&&r.linPeds===2,'o mesmo item de dois pedidos aparece uma vez, somado (20 unidades)');
  ok(r.bot===30&&r.botEst,'usa estoque e marca o que ainda é estimativa');
  ok(r.chegar.includes('Zíper teste'),'separa o que já foi comprado e espera chegar');
  ok(r.tela,'a tela mostra a lista com Enviar no WhatsApp, Baixar PDF e Imprimir');
  ok(r.txt&&r.evento,'o texto para o WhatsApp sai pronto (com ★ nos pedidos de evento)');
  ok(r.pg>=1&&r.doc,'a folha A4 da lista é montada para imprimir e para o PDF');
  r=await A.evaluate(()=>{A.compWhats();const w=window.__aberto||'';A.compPrint();return {w:/^https:\/\/wa\.me\/\?text=/.test(w)&&decodeURIComponent(w).includes('Linha teste azul')}});
  await A.waitForTimeout(300);r.imp=await A.evaluate(()=>window.__impresso||0);
  ok(r.w,'Enviar no WhatsApp abre o WhatsApp com a lista');
  ok(r.imp>0,'Imprimir manda a lista para a impressora');
  r=await A.evaluate(ids=>{document.querySelector('[data-a=compMarca][data-m=comprei][data-i="Linha teste azul"]').click();const st=ids.map(id=>pedById(id).materiais.find(m=>m.item==='Linha teste azul').st);return {st,sai:!listaCompras().comprar.some(o=>o.item==='Linha teste azul')}},r.ids||await A.evaluate(()=>state.pedidos.filter(p=>!p.concluido).slice(0,2).map(p=>p.id)));
  ok(r.st.every(x=>x==='recebido')&&r.sai,'Comprei na lista marca o item comprado em todos os pedidos e ele sai da lista');
  // 29/10: Tecidos x Aviamentos (quem compra é diferente) e os 3 botões na lista somada
  r=await A.evaluate(()=>{const ps=state.pedidos.filter(p=>!p.concluido).slice(0,2);ps.forEach(p=>p.materiais.push({item:'Malha teste azul',un:'m',nec:12,est:0,conf:true,st:'comprar'},{item:'Gola teste Marinho',un:'un',nec:8,est:0,conf:true,st:'comprar'}));state.estoque['Gola teste Marinho']=20;RC={};
    const T=listaCompras('tecido').comprar.map(o=>o.item),Av=listaCompras('aviamento').comprar.map(o=>o.item);
    A.compras();document.querySelector('[data-a=compCatV][data-v=tecido]').click();const tela=document.getElementById('sheet').innerText;const txt=textoCompras(listaCompras(compCat()),compTit());const pg=docCompras(listaCompras(compCat()),compTit());
    const b3=document.querySelectorAll('[data-a=compMarca][data-i="Malha teste azul"]').length;
    document.querySelector('[data-a=compCatV][data-v=aviamento]').click();const b3a=document.querySelectorAll('[data-a=compMarca][data-i="Gola teste Marinho"]').length;
    let mem='';try{mem=localStorage.getItem('comp-cat')}catch(e){}
    return {T,Av,tecTela:/Malha teste azul/.test(tela)&&!/Gola teste Marinho/.test(tela),txt:/Lista de compras · Tecidos/.test(txt)&&/Malha teste azul/.test(txt)&&!/Gola teste/.test(txt),doc:/TECIDOS/.test(pg[0])&&!/Gola teste/.test(pg.join('')),b3,b3a,mem,esc:1}});
  ok(r.T.includes('Malha teste azul')&&!r.T.includes('Gola teste Marinho')&&r.Av.includes('Gola teste Marinho')&&!r.Av.includes('Malha teste azul'),'separa Tecidos (o que vai em metros) de Aviamentos');
  ok(r.tecTela,'a aba Tecidos mostra só os tecidos');
  ok(r.txt&&r.doc,'WhatsApp, PDF e Imprimir da aba Tecidos levam só os tecidos, com o título "Tecidos"');
  ok(r.b3===3&&r.b3a===3,'cada item da lista somada tem os 3 botões: Já tem, Comprei, Em falta');
  ok(r.mem==='aviamento','a aba escolhida fica guardada no aparelho');
  r=await A.evaluate(()=>{document.querySelector('[data-a=compMarca][data-m=falta][data-i="Gola teste Marinho"]').click();const fica=listaCompras().comprar.some(o=>o.item==='Gola teste Marinho')&&document.querySelector('[data-a=compMarca][data-m=falta][data-i="Gola teste Marinho"]').getAttribute('aria-pressed')==='true';A.compMove({i:'Gola teste Marinho'});const mov=listaCompras('tecido').comprar.some(o=>o.item==='Gola teste Marinho')&&state.catIns['Gola teste']==='tecido';const trava=!!state.pedidos.flatMap(p=>p.materiais).find(m=>m.item==='Gola teste Marinho'&&m.un==='un');A.compMove({i:'Gola teste Marinho'});const volta2=!('Gola teste' in state.catIns)&&listaCompras('aviamento').comprar.some(o=>o.item==='Gola teste Marinho');document.querySelector('[data-a=compMarca][data-m=tem][data-i="Gola teste Marinho"]').click();const ms=state.pedidos.flatMap(p=>p.materiais).filter(m=>m.item==='Gola teste Marinho');
    const r1={st:ms.map(m=>m.st),est:state.estoque['Gola teste Marinho'],baixa:ms.reduce((t,m)=>t+(m.baixa||0),0)};
    return {...r1,fica,mov,trava,volta2}});
  ok(r.st.every(x=>x==='ok')&&r.est===4&&r.baixa===16,'Já tem na lista somada tira do estoque o que cada pedido usa (20 − 8 − 8 = 4)');
  ok(r.fica,'Em falta confirma o item e ele fica na lista, com o botão marcado');
  ok(r.mov&&r.trava,'dá para mover um item para Tecidos (vale para todas as cores) sem mexer no que trava o corte');
  ok(r.volta2,'mover de novo volta ao padrão');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
