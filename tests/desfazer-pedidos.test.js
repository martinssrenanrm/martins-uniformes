// Teste: pedido de 11/2026: botão Desfazer no alto de Pedidos, faixa "Última ação", até 5 ações em 15 minutos, Refazer e Ctrl+Z / Ctrl+Y.
// Rodar: NODE_PATH=$(npm root -g) node tests/desfazer-pedidos.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:1000,height:1100}});A.on('pageerror',e=>erros.push(e.message));
  await A.clock.install({time:new Date('2026-10-14T15:30:00')});
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.inicio=null;
    state.pedidos.forEach(p=>{p.vias=true;p.arte=true;p.artePrep=true;p.materiais.forEach(m=>{m.conf=true;m.st='ok'})});RC={};render()});
  const naTela=()=>A.evaluate(()=>{ui.sheet=null;ui.tela='pedidos';render();const b=document.getElementById('desfP'),f=document.getElementById('ultP');
    return {existe:!!b,off:!!b&&b.disabled,faixa:f&&!f.hidden?f.innerText.replace(/\s+/g,' '):'',solto:!!document.querySelector('#undoF [data-a=desfazer]'),n:UNDO.length}});
  // "Começar" em várias máquinas: cada toque é uma ação que dá para desfazer
  const comeca=n=>A.evaluate(n=>{const feitos=[];for(const u of unidades()){if(feitos.length>=n)break;ui.sheet={t:'maq',m:u.id};render();const bt=document.querySelector('#sheet [data-a=comecar]');if(!bt)continue;
      const l=bt.dataset.l,s=bt.dataset.s;bt.click();feitos.push({l,s})}ui.sheet=null;return feitos},n);
  const st=x=>A.evaluate(x=>stOf(lote(x.l),x.s).st,x);

  console.log('1) Sem nada para desfazer');
  let r=await naTela();ok(r.existe&&r.off,'o botão Desfazer já aparece no alto de Pedidos, cinza');ok(!r.faixa,'sem faixa de Última ação');

  console.log('2) Depois de 3 ações');
  const F=await comeca(3);ok(F.length===3,'3 máquinas começaram');
  r=await naTela();ok(r.existe&&!r.off,'o botão fica ativo');ok(/Última ação/.test(r.faixa)&&/3 ações/.test(r.faixa),'a faixa diz a última ação e que dá para desfazer 3 ('+r.faixa+')');
  ok(!r.solto,'em Pedidos não aparece o botão solto do canto (só o do alto)');

  console.log('3) Botão, Ctrl+Z, Refazer e Ctrl+Y');
  await A.click('#desfP');ok(await st(F[2])==='pend'&&await st(F[1])==='and','o botão desfaz só a última (a 3ª máquina volta)');
  ok(await A.evaluate(()=>/Desfeito/.test(document.getElementById('toast').innerText)&&!!document.querySelector('#toast [data-a=refazer]')),'o aviso diz "Desfeito" e tem Refazer');
  await A.evaluate(()=>document.activeElement&&document.activeElement.blur());await A.keyboard.press('Control+z');
  ok(await st(F[1])==='pend'&&await st(F[0])==='and','Ctrl+Z desfaz a anterior');
  await A.keyboard.press('Control+y');ok(await st(F[1])==='and','Ctrl+Y refaz');
  await A.click('#toast [data-a=toastX]').catch(()=>{});
  r=await naTela();ok(r.n===2,'sobram 2 ações para desfazer');
  await A.focus('#pedBusca');await A.keyboard.type('abc');await A.keyboard.press('Control+z');
  ok(await A.evaluate(()=>UNDO.length)===2&&await st(F[1])==='and','digitando na busca, Ctrl+Z não mexe nos pedidos');
  await A.evaluate(()=>{ui.sheet={t:'novo',w:{step:1,itens:[]}};render()});await A.evaluate(()=>document.activeElement&&document.activeElement.blur());await A.keyboard.press('Control+z');
  ok(await A.evaluate(()=>UNDO.length===2&&ui.sheet&&ui.sheet.t==='novo'),'com o Novo pedido aberto, Ctrl+Z não fecha nem desfaz');

  console.log('4) Até 5 ações, por 15 minutos');
  // 6 ações seguidas (cada uma muda a observação de um pedido, como faria qualquer botão com Desfazer)
  const nU=await A.evaluate(()=>{for(let i=1;i<=6;i++){snap();state.pedidos[0].obs='anotação '+i;commit();toast('Pronto! Anotação '+i,true)}return {n:UNDO.length,ult:UNDO[UNDO.length-1].msg,prim:UNDO[0].msg}});
  ok(nU.n===5&&/Anotação 6/.test(nU.ult)&&/Anotação 2/.test(nU.prim),'guarda só as 5 últimas (da 2ª à 6ª)');
  await A.clock.runFor(16*60000);r=await naTela();ok(r.off&&!r.faixa,'depois de 15 minutos o botão fica cinza e a faixa some');
  await A.evaluate(()=>A.desfazer());ok(await A.evaluate(()=>/nada para desfazer/i.test(document.getElementById('toast').innerText)),'sem nada para desfazer, avisa');

  console.log('5) Central de dúvidas');
  ok(await A.evaluate(()=>ajBusca('ctrl z')[0]?.f.q==='Apertei errado. Como desfaço?'),'"ctrl z" acha a resposta certa');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros[0]:''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
