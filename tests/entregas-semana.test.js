// Teste: pedido de 12/11. Em Pedidos, botão "Planilha de entregas por semana": pedidos em aberto agrupados pela semana da entrega
// (segunda a sexta), com Nº pedido, Cliente, Quant. Ficha, Itens e Entrega, para PDF ou imprimir.
// Rodar: NODE_PATH=$(npm root -g) node tests/entregas-semana.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:820,height:1100}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null};window.print=()=>{window.__impresso=(window.__impresso||0)+1}});await A.goto(APP);await A.waitForTimeout(1200);
  let r=await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.inicio=null;
    const dt=s=>new Date(s+'T15:00:00').getTime();const ab=state.pedidos.filter(p=>!p.concluido&&!p.cancelado&&lotesDe(p.id).some(l=>!l.rework));
    const [a,b2,c,d]=ab;a.entrega=dt('2026-11-16');b2.entrega=dt('2026-11-21');c.entrega=dt('2026-10-30');d.entrega=dt('2026-09-30');a.ficha='6129';b2.ficha='';b2.evento=true;
    ab.slice(4).forEach(p=>p.entrega=dt('2026-12-08'));const fora=state.pedidos.find(p=>p.concluido);
    RC={};ui.sheet=null;ui.pv='ped';ui.tela='pedidos';render();const bt=!!document.querySelector('[data-a=entregas]');
    const W=semanasEntrega(),tits=W.map(w=>w.tit),sem16=W.find(w=>/16\/11/.test(w.tit));
    const la=sem16&&sem16.linhas.find(l=>l.id===a.id),lb=sem16&&sem16.linhas.find(l=>l.id===b2.id);
    const fichas=gruposFicha(lotesDe(a.id).filter(l=>!l.rework)).length;
    A.entregas();const tela=document.getElementById('sheet').innerText;const pg=docEntregas(W);
    return {bt,tits,ordem:sem16&&sem16.linhas.map(l=>l.id).join(),esperado:[a.id,b2.id].join(),la,lb,fichas,foraId:fora&&fora.id,todos:W.flatMap(w=>w.linhas.map(l=>l.id)),
      tela:/Entregas por semana/.test(tela)&&/Baixar PDF/.test(tela)&&/Imprimir/.test(tela)&&tela.includes(a.cliente),
      doc:pg.length>=1&&/ENTREGAS POR SEMANA/.test(pg[0])&&/Nº pedido/.test(pg[0])&&/Quant\. Ficha/.test(pg[0])&&pg.join('').includes('6129')&&/NÃO ATRASAR/.test(pg.join('')),
      plur:[plurPE(10,'Polo'),plurPE(1,'Polo'),plurPE(3,'Calça de moletom'),plurPE(2,'Moletom'),plurPE(4,'Avental'),plurPE(5,'Colete Refletivo')]}});
  ok(r.bt,'a tela Pedidos tem o botão "Planilha de entregas por semana"');
  ok(r.tits.includes('NOVEMBRO - Terceira semana - 16/11 ao dia 20/11'),'semana de segunda a sexta, com o mês e a ordem da semana no título');
  ok(r.tits.includes('OUTUBRO - Quarta semana - 26/10 ao dia 30/10'),'pedido atrasado de semana passada continua na planilha');
  ok(r.tits.includes('SETEMBRO - Última semana - 28/09 ao dia 02/10'),'semana que vira o mês sai como "Última semana"');
  ok(r.ordem===r.esperado,'entrega no sábado entra na semana da segunda anterior, em ordem de data');
  ok(r.la&&r.la.num==='6129'&&r.la.ent==='16/11'&&r.la.fichas===r.fichas&&r.la.fichas>0&&/^\d+ /.test(r.la.itens),'cada linha tem Nº pedido, quantas fichas, os itens com quantidade e a entrega');
  ok(r.lb&&r.lb.num==='-'&&r.lb.evento,'pedido sem número sai com "-"; pedido de evento é marcado');
  ok(!r.todos.includes(r.foraId),'pedido entregue não entra');
  ok(JSON.stringify(r.plur)===JSON.stringify(['polos','polo','calças de moletom','moletons','aventais','coletes refletivo']),'plural dos itens (10 polos, 3 calças de moletom...)');
  ok(r.tela,'a tela mostra as semanas com Baixar PDF e Imprimir');
  ok(r.doc,'a folha A4 sai no formato da planilha (Nº pedido, Cliente, Quant. Ficha, Itens, Entrega)');
  // Muitos pedidos: quebra em várias páginas, sem perder nenhum
  r=await A.evaluate(()=>{const W=semanasEntrega();const big=[{...W[0],linhas:Array.from({length:90},(_,i)=>({...W[0].linhas[0],num:'X'+i}))}];const pg=docEntregas(big);
    return {n:pg.length,todos:Array.from({length:90},(_,i)=>'X'+i).every(x=>pg.some(h=>h.includes('>'+x+'<'))),cont:/continuação/.test(pg[1]||'')}});
  ok(r.n>=3&&r.todos&&r.cont,'semana muito grande continua na página seguinte, sem perder pedido');
  await A.evaluate(()=>A.entPrint());await A.waitForTimeout(400);
  r=await A.evaluate(()=>window.__impresso||0);ok(r>0,'Imprimir manda a planilha para a impressora');
  ok(!erros.length,'sem erros na página'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
