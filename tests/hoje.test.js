// Teste: tela "Hoje" por perfil (Onda UX 2, 11/2026).
// Abre em Hoje; gestão vê riscos → rua → máquinas → vendas; escritório vê as próprias tarefas primeiro; cada linha leva à ação;
// desligando o módulo, a barra volta a ser a de antes. Celular 360×640: nada passa da largura, alvos ≥ 48px, letra ≥ 16px.
// Rodar: NODE_PATH=$(npm root -g) node tests/hoje.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:360,height:640}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  const entra=perfil=>A.evaluate(perfil=>{if(!state.pessoas||!state.pessoas.length){seed();state=normalizar(state)}let u=state.usuarios.find(x=>x.perfil===perfil);
    if(!u){const pe=state.pessoas.find(p=>(p.funcoes||[]).length);u={id:'u-'+perfil,email:perfil+'@exemplo.com',nome:pe.nome,perfil,pessoa:pe.id};state.usuarios.push(u)}
    SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;ui.inicio=null;ui.tela='';render();window.scrollTo(0,0)},perfil);
  const medidas=()=>A.evaluate(()=>{const app=document.getElementById('app');const largo=[...app.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>window.innerWidth+1}).map(e=>e.className).slice(0,3);
    const peq=[...app.querySelectorAll('button')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<48).map(e=>e.textContent.trim().slice(0,20));
    const letra=[...app.querySelectorAll('.hj-sec *,.hj-nota *')].filter(e=>e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<16).map(e=>e.textContent.trim().slice(0,20));
    return {largo,peq,letra}});
  console.log('1) Gestão');
  await entra('gestao');
  let r=await A.evaluate(()=>({tela:ui.tela,secs:[...document.querySelectorAll('#app .hj-sec')].map(s=>s.id).filter(x=>x!=='hj-sug'),nav:[...document.querySelectorAll('.nav .nb')].filter(n=>getComputedStyle(n).display!=='none').map(n=>n.textContent.trim())}));
  ok(r.tela==='hoje','o app abre em Hoje');
  ok(r.secs.join()==='hj-riscos,hj-rua,hj-maq,hj-vendas','ordem: riscos, rua, máquinas, vendas ('+r.secs.join(', ')+')');
  ok(r.nav.join('|')==='Hoje|Fábrica|Pedidos|Novo pedido|Mais'||r.nav.length===5&&r.nav[0]==='Hoje'&&r.nav[4]==='Mais','barra com 5 itens: Hoje … Mais ('+r.nav.join(' · ')+')');
  r=await A.evaluate(()=>{const R=hojeRiscos();const nP=document.querySelectorAll('#hj-riscos .hj-ped').length;const prim=document.querySelector('#hj-riscos .hj-ped b')?.textContent;
    const P=plano(),M=hojeMaquinas(P);const nM=document.querySelectorAll('#hj-maq [data-a=maq]').length;
    return {nR:R.length,nP,prim,esp:R[0]?.p.cliente,nM,M:M.length,crit:R.every((x,i)=>!i||R[i-1].i.score<=x.i.score)}});
  ok(r.nR>0&&r.nP===Math.min(5,r.nR)&&r.prim===r.esp&&r.crit,`pedidos com risco, o mais urgente primeiro (${r.nR}; primeiro: ${r.prim})`);
  ok(r.M>0&&r.nM===Math.min(6,r.M),`máquinas livres com o próximo trabalho e botão Abrir (${r.nM})`);
  r=await A.evaluate(()=>{document.querySelector('#hj-maq [data-a=maq]').click();const s=ui.sheet&&ui.sheet.t;ui.sheet=null;render();
    document.querySelector('#hj-rua [data-a=compras]')?.click();const c=ui.sheet&&ui.sheet.t;ui.sheet=null;render();
    document.querySelector('#hj-vendas [data-a=hojeIr]').click();const g=ui.tela+'/'+ui.gt;ui.tela='hoje';render();
    document.querySelector('#hj-riscos [data-a=pedido]').click();const p=ui.sheet&&ui.sheet.t;ui.sheet=null;ui.tela='hoje';render();return {s,c,g,p}});
  ok(r.s==='maq'&&r.c==='compras'&&r.p==='pedido'&&r.g==='gestor/res','cada linha leva à ação (máquina, lista de compras, pedido, faturamento)');
  r=await A.evaluate(()=>{document.querySelector('.nav .mais-nb').click();const m=ui.sheet&&ui.sheet.t,txt=document.querySelector('#sheet').innerText;ui.sheet=null;render();return {m,cad:/Cadastros/.test(txt),gest:/Painel do gestor/.test(txt)}});
  ok(r.m==='menu'&&r.cad&&r.gest,'"Mais" abre Painel do gestor e Cadastros');
  let m=await medidas();ok(!m.largo.length,'nada passa da largura de 360px'+(m.largo.length?': '+m.largo.join(', '):''));
  ok(!m.peq.length,'botões com 48px ou mais'+(m.peq.length?': '+m.peq.join(' | '):''));ok(!m.letra.length,'letra de 16px ou mais'+(m.letra.length?': '+m.letra.join(' | '):''));
  console.log('2) Escritório');
  await entra('escritorio');
  r=await A.evaluate(()=>{const u=usuarioAtual(),mine=tarefasEsc().filter(t=>t.resp===u.pessoa);return {tela:ui.tela,secs:[...document.querySelectorAll('#app .hj-sec')].map(s=>s.id).filter(x=>x!=='hj-sug'),n:document.querySelectorAll('#hj-minhas .tar2').length,mine:mine.length,
    nav:[...document.querySelectorAll('.nav .nb')].filter(n=>getComputedStyle(n).display!=='none').map(n=>n.textContent.trim()),novo:document.querySelector('.nav .nb.novo').getBoundingClientRect().right<=window.innerWidth}});
  ok(r.tela==='hoje'&&r.secs[0]==='hj-minhas','Escritório abre em Hoje com as próprias tarefas primeiro');
  ok(r.n===Math.min(6,r.mine),`só as tarefas da pessoa (${r.n} de ${r.mine})`);
  ok(!r.secs.includes('hj-rua')&&!r.secs.includes('hj-vendas')&&!r.nav.includes('Mais'),'sem blocos da gestão nem "Mais"');
  ok(r.novo,'botão Novo inteiro na tela (antes saía cortado)');
  m=await medidas();ok(!m.largo.length&&!m.peq.length,'360px sem cortes e alvos de 48px');
  console.log('3) Desligar o módulo');
  await entra('gestao');
  r=await A.evaluate(()=>{state.modOff=[...(state.modOff||[]),'hoje'];ui.tela='';render();const nav=[...document.querySelectorAll('.nav .nb')].filter(n=>getComputedStyle(n).display!=='none').map(n=>n.textContent.trim());state.modOff=state.modOff.filter(x=>x!=='hoje');return {tela:ui.tela,nav}});
  ok(r.tela==='fabrica'&&r.nav.join('|').includes('Gestor')&&!r.nav.includes('Hoje')&&!r.nav.includes('Mais'),'Tela Hoje desligada: abre na Fábrica e a barra volta a ser a de antes ('+r.nav.join(' · ')+')');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
