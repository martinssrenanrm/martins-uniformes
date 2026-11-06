// Teste: bloco "Faturamento" no Painel › Resultados (vendas do Conta Azul, migração 010). Números fictícios.
// Rodar: NODE_PATH=$(npm root -g) node tests/faturamento.test.js
// PRINTS=<pasta> guarda os prints em 360×640.
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const meses=(fim,vals)=>vals.map((v,i)=>{const d=new Date(Date.UTC(2026,fim-12+i,1));return {mes:d.toISOString().slice(0,7),total:v,vendas:10}});
const OUT={periodo:{de:'2026-10-01',ate:'2026-10-31'},total:121244.74,vendas:38,media_mensal:147909.63,atualizado:'2026-11-06T05:30:00Z',
  meses:meses(9,[136672.23,144314.54,136793.72,212850.89,155822.93,160702.59,192231.76,140919.36,179121.52,139083.55,101749.84,74652.61,121244.74]),
  clientes:[{nome:'Escola Exemplo',total:13105.2,vendas:1},{nome:'Empresa Teste Dois',total:8939.4,vendas:2}]};
const NOV={...OUT,periodo:{de:'2026-11-01',ate:'2026-11-06'},total:29577.26,vendas:7,media_mensal:144187.42,meses:meses(10,[...OUT.meses.slice(1).map(m=>m.total),29577.26]),clientes:[]};
(async()=>{const b=await chromium.launch();const er=[];
  const app=fs.readFileSync(path.join(R,'app.html'),'utf8');
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>window.MARTINS_SB={url:'https://teste.supabase.co',key:'anon'}</script></head><body>${app}</body></html>`;
  const ctx=await b.newContext({viewport:{width:360,height:640}});
  await ctx.route('https://app.martins.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
  await ctx.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){}}})}'}));
  const p=await ctx.newPage();p.on('pageerror',e=>er.push(e.message));
  await p.clock.setFixedTime(new Date('2026-11-06T10:00:00-03:00'));
  await p.goto('https://app.martins.test/');await p.waitForTimeout(1500);
  // modo do banco próprio, gestão logada; o banco devolve o que a função faturamento() devolveria
  const abre=async(resp,mes)=>{await p.evaluate(([resp,mes])=>{seed();state=normalizar(state);const u=state.usuarios.find(u=>u.perfil==='gestao');SESSAO={id:u.id,email:u.email};NV.pronto=true;NV.erro='';ui.inicio=null;ui.sheet=null;
      window.__ped=[];NV.db={ev:{metricas:async()=>({}),faturamento:async(de,ate)=>{__ped.push([de,ate]);if(resp==='sem')throw {code:'sem-fat'};if(resp==='rede')throw new Error('fetch');return resp}}};
      ui.fat=null;ui.fatMes=mes;ui.tela='gestor';ui.gt='res';render()},[resp,mes]);await p.waitForTimeout(300)};
  const txt=async()=>p.evaluate(()=>{const c=document.getElementById('Faturamento');return c?c.innerText:''});

  console.log('1) Mês passado (outubro): total, vendas e comparação com a média');
  await abre(OUT,'passado');let t=await txt();
  ok(JSON.stringify(await p.evaluate(()=>__ped))==='[["2026-10-01","2026-10-31"]]','pede ao banco de 01/10 a 31/10');
  ok(t.includes('R$ 121.244,74')&&/38\s*vendas/.test(t),'mostra R$ 121.244,74 em 38 vendas');
  ok(/18% abaixo/.test(t)&&t.includes('R$ 147.909,63'),'diz que ficou 18% abaixo da média (R$ 147.909,63)');
  ok(/out\/26/.test(t)&&/out\/25/.test(t)&&(t.match(/\/2\d/g)||[]).length===13,'mostra os últimos 13 meses');
  ok(t.includes('Escola Exemplo')&&t.includes('R$ 13.105,20')&&/Quem mais comprou em outubro/.test(t),'mostra quem mais comprou em outubro');
  ok(/Conta Azul/.test(t)&&/Orçamentos e cancelados não entram/.test(t),'explica de onde vêm os números');
  if(process.env.PRINTS){await p.evaluate(()=>document.getElementById('Faturamento').scrollIntoView());await p.screenshot({path:path.join(process.env.PRINTS,'faturamento-mes-passado.png')})}

  console.log('2) Este mês: até hoje, em relação à média');
  await abre(NOV,'atual');t=await txt();
  ok(JSON.stringify(await p.evaluate(()=>__ped))==='[["2026-11-01","2026-11-06"]]','pede ao banco de 01/11 até hoje');
  ok(/Até hoje, dia 6, já é 21%/.test(t),'diz quanto da média o mês já fez');
  ok(/Nenhuma venda em novembro/.test(t),'sem clientes no mês, diz isso');
  if(process.env.PRINTS){await p.evaluate(()=>document.getElementById('Faturamento').scrollIntoView());await p.screenshot({path:path.join(process.env.PRINTS,'faturamento-este-mes.png')})}

  console.log('3) Botões Este mês / Mês passado');
  await p.click('[data-a=fatMes][data-v=passado]');await p.waitForTimeout(300);
  ok((await p.evaluate(()=>__ped)).some(x=>x[0]==='2026-10-01'),'tocar em Mês passado busca outubro');
  ok(await p.evaluate(()=>[...document.querySelectorAll('[data-a=fatMes]')].every(e=>e.getBoundingClientRect().height>=48)),'botões com 48px ou mais');

  console.log('4) Letra e lugar');
  const peq=await p.evaluate(()=>{const c=document.getElementById('Faturamento'),o=[];c.querySelectorAll('*').forEach(e=>{if([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<16)o.push(e.tagName+':'+e.textContent.trim().slice(0,20))});return o});
  ok(!peq.length,'nenhum texto abaixo de 16px'+(peq.length?': '+peq.join(' | '):''));
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=360),'nada passa da largura do celular (360px)');
  ok(await p.evaluate(()=>{const cs=[...document.querySelectorAll('.card h2')].map(h=>h.textContent);return cs[cs.length-1]==='Faturamento'&&cs.indexOf('Quanto dá para confiar nos números')<cs.indexOf('Faturamento')}),'fica no fim de Resultados; os outros quadros continuam no lugar');

  console.log('5) Quando não deve aparecer');
  await abre({vazio:true},'passado');ok(!(await txt()),'fábrica sem vendas do Conta Azul: o bloco não aparece');
  await abre(null,'passado');ok(!(await txt()),'quem não é da gestão (o banco devolve nada): não aparece');
  await abre('sem','passado');ok(!(await txt()),'banco sem a migração 010: não aparece');
  await abre('rede','passado');t=await txt();ok(/Confira a internet/.test(t),'sem internet: diz o que fazer');

  ok(!er.length,'sem erros de JavaScript'+(er.length?': '+er.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
