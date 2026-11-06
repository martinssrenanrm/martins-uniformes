// Teste: tela "Hoje" (Onda UX 2) no formato de fila de ações (Onda UX 6, direção B escolhida pelo Renan).
// Abre em Hoje; uma linha por coisa a fazer, do mais urgente para o menos (vermelho → amarelo → azul → cinza), com o botão dela;
// só o 1º botão é azul cheio; sem repetir a mesma coisa; faixa verde, vendas e "Configurar a fábrica" no fim.
// Escritório: as próprias tarefas primeiro. Desligando o módulo, a barra volta a ser a de antes. 360×640: sem cortes, alvos ≥ 48px, letra ≥ 16px.
// Rodar: NODE_PATH=$(npm root -g) node tests/hoje.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:360,height:640}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  const entra=perfil=>A.evaluate(perfil=>{if(!state.pessoas||!state.pessoas.length){seed();state=normalizar(state)}let u=state.usuarios.find(x=>x.perfil===perfil);
    if(!u){const pe=state.pessoas.find(p=>(p.funcoes||[]).length);u={id:'u-'+perfil,email:perfil+'@exemplo.com',nome:pe.nome,perfil,pessoa:pe.id};state.usuarios.push(u)}
    SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;ui.inicio=null;ui.filaTodas=false;ui.tela='';render();window.scrollTo(0,0)},perfil);
  const fila=()=>A.evaluate(()=>[...document.querySelectorAll('#hj-fila .fl-i')].map(e=>({k:e.dataset.k,sev:['crit','warn','azul','cinza'].find(s=>e.classList.contains('fl-'+s)),p:e.querySelector('.fl-bt').classList.contains('p'),a:e.querySelector('.fl-bt').dataset.a})));
  const medidas=()=>A.evaluate(()=>{const app=document.getElementById('app');const largo=[...app.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>window.innerWidth+1}).map(e=>e.className).slice(0,3);
    const peq=[...app.querySelectorAll('button')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<48).map(e=>e.textContent.trim().slice(0,20));
    const letra=[...app.querySelectorAll('.fl *,.fl-ok *,.fl-sec *,.fl-cfg *,.fl-res')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<16).map(e=>e.textContent.trim().slice(0,20));
    return {largo,peq,letra}});
  const ORD={crit:0,warn:1,azul:2,cinza:3};
  console.log('1) Gestão');
  await entra('gestao');
  let r=await A.evaluate(()=>({tela:ui.tela,nav:[...document.querySelectorAll('.nav .nb')].filter(n=>getComputedStyle(n).display!=='none').map(n=>n.textContent.trim())}));
  ok(r.tela==='hoje','o app abre em Hoje');
  ok(r.nav.length===5&&r.nav[0]==='Hoje'&&r.nav[4]==='Mais','barra com 5 itens: Hoje … Mais ('+r.nav.join(' · ')+')');
  let F=await fila();
  ok(F.length>=4,`fila com uma linha por coisa a fazer (${F.length})`);
  ok(F.every((x,i)=>!i||ORD[F[i-1].sev]<=ORD[x.sev]),'ordem por urgência: vermelho → amarelo → azul → cinza ('+F.map(x=>x.sev).join(' ')+')');
  ok(F[0].p&&F.slice(1).every(x=>!x.p),'só o primeiro botão é azul cheio; o resto é contorno');
  ok(new Set(F.map(x=>x.k)).size===F.length,'nenhuma coisa aparece duas vezes');
  r=await A.evaluate(()=>{const R=hojeRiscos();const ks=[...document.querySelectorAll('#hj-fila .fl-i')].map(e=>e.dataset.k);return {riscos:R.every(x=>ks.includes('ped:'+x.p.id)),prim:ks[0]===('ped:'+(R[0]&&R[0].p.id)),
    maq:hojeMaquinas(plano()).slice(0,4).every(x=>ks.includes('maq:'+x.m)),compras:ks.includes('compras'),
    ordem:[...document.querySelectorAll('#app > *')].map(e=>e.id||e.className).filter(Boolean).join(' ')}});
  ok(r.riscos&&r.prim,'os pedidos com risco viram linhas, o mais urgente primeiro');
  ok(r.maq&&r.compras,'máquinas livres e compras viram linhas (antes eram blocos separados)');
  ok(/hj-fila.*hj-feito.*hj-vendas.*fl-cfg/.test(r.ordem),'no fim: faixa verde, vendas e "Configurar a fábrica" ('+r.ordem.replace(/\s+/g,' ').slice(0,120)+')');
  r=await A.evaluate(()=>!document.querySelector('#app .cfg-av'));ok(r,'o cartão "Vamos deixar o app com a cara da sua fábrica" saiu do topo');
  r=await A.evaluate(()=>document.querySelector('#hj-fila .fl-i .fl-bt').getBoundingClientRect().bottom<=640-74);ok(r,'o item mais urgente e o botão dele cabem sem rolar');
  r=await A.evaluate(()=>{const go=k=>{const e=document.querySelector(`#hj-fila .fl-i[data-k^="${k}"] .fl-bt`);if(!e)return 'sem';e.click();const s=ui.sheet&&ui.sheet.t;ui.sheet=null;ui.tela='hoje';render();return s||ui.tela};
    const p=go('ped:'),m=go('maq:'),c=go('compras');document.querySelector('#hj-vendas .fl-bt').click();const g=ui.tela+'/'+ui.gt;ui.tela='hoje';render();return {p,m,c,g}});
  ok(r.p==='pedido'&&r.m==='maq'&&r.c==='compras'&&r.g==='gestor/res','cada botão leva à ação (pedido, máquina, lista de compras, faturamento)');
  r=await A.evaluate(()=>{document.querySelector('.nav .mais-nb').click();const m=ui.sheet&&ui.sheet.t,txt=document.querySelector('#sheet').innerText;ui.sheet=null;render();return {m,cad:/Cadastros/.test(txt),gest:/Painel do gestor/.test(txt)}});
  ok(r.m==='menu'&&r.cad&&r.gest,'"Mais" abre Painel do gestor e Cadastros');
  let m=await medidas();ok(!m.largo.length,'nada passa da largura de 360px'+(m.largo.length?': '+m.largo.join(', '):''));
  ok(!m.peq.length,'botões com 48px ou mais'+(m.peq.length?': '+m.peq.join(' | '):''));ok(!m.letra.length,'letra de 16px ou mais'+(m.letra.length?': '+m.letra.join(' | '):''));
  r=await A.evaluate(()=>{const n=filaHoje(plano(),tarefasEsc(),null,true).length;const vis=document.querySelectorAll('#hj-fila .fl-i').length;return {n,vis,mais:!!document.querySelector('[data-a=filaTodas]')}});
  ok(r.vis===Math.min(8,r.n)&&(r.n>8)===r.mais,`mostra até 8 linhas (${r.vis} de ${r.n}); o resto em "Ver mais"`);
  console.log('2) Escritório');
  await entra('escritorio');
  r=await A.evaluate(()=>{const u=usuarioAtual(),mine=tarefasEsc().filter(t=>t.resp===u.pessoa);const ks=[...document.querySelectorAll('#hj-fila .fl-i')].map(e=>e.dataset.k);
    const nT=ks.filter(k=>k.startsWith('tar:')).length,primeiras=ks.slice(0,nT).every(k=>k.startsWith('tar:'));
    return {tela:ui.tela,nT,mine:mine.length,primeiras,gest:ks.some(k=>/^(maq:|sempessoa|fila|esc$)/.test(k)),vendas:!!document.getElementById('hj-vendas'),cfg:!!document.querySelector('.fl-cfg'),
    nav:[...document.querySelectorAll('.nav .nb')].filter(n=>getComputedStyle(n).display!=='none').map(n=>n.textContent.trim()),novo:document.querySelector('.nav .nb.novo').getBoundingClientRect().right<=window.innerWidth,
    bt:Object.assign({},(document.querySelector('#hj-fila .fl-i[data-k^="tar:"] .fl-bt')||{}).dataset)}});
  ok(r.tela==='hoje'&&r.nT===Math.min(8,r.mine)&&r.primeiras,`Escritório: as próprias tarefas primeiro (${r.nT} de ${r.mine})`);
  ok(r.bt&&r.bt.a&&r.bt.id,'cada tarefa tem o botão dela (o mesmo do Escritório: '+(r.bt&&r.bt.a)+')');
  ok(!r.gest&&!r.vendas&&!r.cfg&&!r.nav.includes('Mais'),'sem linhas da gestão, vendas, configuração nem "Mais"');
  ok(r.novo,'botão Novo inteiro na tela');
  m=await medidas();ok(!m.largo.length&&!m.peq.length&&!m.letra.length,'360px sem cortes, alvos de 48px e letra de 16px');
  console.log('3) Desligar o módulo');
  await entra('gestao');
  r=await A.evaluate(()=>{state.modOff=[...(state.modOff||[]),'hoje'];ui.tela='';render();const nav=[...document.querySelectorAll('.nav .nb')].filter(n=>getComputedStyle(n).display!=='none').map(n=>n.textContent.trim());state.modOff=state.modOff.filter(x=>x!=='hoje');return {tela:ui.tela,nav}});
  ok(r.tela==='fabrica'&&r.nav.join('|').includes('Gestor')&&!r.nav.includes('Hoje')&&!r.nav.includes('Mais'),'Tela Hoje desligada: abre na Fábrica e a barra volta a ser a de antes ('+r.nav.join(' · ')+')');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
