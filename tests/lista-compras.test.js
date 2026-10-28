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
  r=await A.evaluate(ids=>{document.querySelector('[data-a=compComprei][data-i="Linha teste azul"]').click();const st=ids.map(id=>pedById(id).materiais.find(m=>m.item==='Linha teste azul').st);return {st,sai:!listaCompras().comprar.some(o=>o.item==='Linha teste azul')}},r.ids||await A.evaluate(()=>state.pedidos.filter(p=>!p.concluido).slice(0,2).map(p=>p.id)));
  ok(r.st.every(x=>x==='recebido')&&r.sai,'Comprei na lista marca o item comprado em todos os pedidos e ele sai da lista');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
