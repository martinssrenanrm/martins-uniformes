// Teste: faturamento por tipo de cliente (Gestor › Resultados › Faturamento; migração 012). Números e nomes fictícios.
// Rodar: NODE_PATH=$(npm root -g) node tests/tipo-cliente.test.js
// PRINTS=<pasta> guarda os prints em 360×640. PGLITE=<pasta com node_modules/@electric-sql/pglite> testa também o SQL.
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const meses=vals=>vals.map((v,i)=>{const d=new Date(Date.UTC(2026,9-12+i,1));return {mes:d.toISOString().slice(0,7),total:v,vendas:10}});
// outubro fictício: 4 clientes, 38 vendas, R$ 121.244,74 (mesmo total do mês real, para a conta de soma)
const CLI=[{id:'c-emp3',nome:'Empresa Três',total:94200.14,vendas:34,tipo:null},{id:'c-esc1',nome:'Escola Exemplo',total:13105.2,vendas:1,tipo:'Escola'},
  {id:'c-emp2',nome:'Empresa Teste Dois',total:8939.4,vendas:2,tipo:null},{id:'c-col',nome:'Colégio Teste',total:5000,vendas:1,tipo:null}];
const OUT={periodo:{de:'2026-10-01',ate:'2026-10-31'},total:121244.74,vendas:38,media_mensal:147909.63,atualizado:'2026-11-08T05:30:00Z',
  meses:meses([1,1,1,1,1,1,1,1,1,1,1,1,121244.74].map(v=>v*1)),clientes:CLI.slice(0,5).map(({nome,total,vendas})=>({nome,total,vendas})),tipos:['Escola','Empresa'],por_cliente:CLI};
const brl=v=>'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
(async()=>{const b=await chromium.launch();const er=[];
  const app=fs.readFileSync(path.join(R,'app.html'),'utf8');
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>window.MARTINS_SB={url:'https://teste.supabase.co',key:'anon'}</script></head><body>${app}</body></html>`;
  const ctx=await b.newContext({viewport:{width:360,height:640}});
  await ctx.route('https://app.martins.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
  await ctx.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){}}})}'}));
  const p=await ctx.newPage();p.on('pageerror',e=>er.push(e.message));
  await p.clock.setFixedTime(new Date('2026-11-08T10:00:00-03:00'));
  await p.goto('https://app.martins.test/');await p.waitForTimeout(1500);
  const abre=async(resp,tipos)=>{await p.evaluate(([resp,tipos])=>{seed();state=normalizar(state);if(tipos)state.tiposCli=tipos;const u=state.usuarios.find(u=>u.perfil==='gestao');SESSAO={id:u.id,email:u.email};NV.pronto=true;NV.erro='';ui.inicio=null;ui.sheet=null;
      NV.db={ev:{metricas:async()=>({}),faturamento:async()=>JSON.parse(JSON.stringify(resp))}};EV.fila=[];
      ui.fat=null;ui.fatMes='passado';ui.tela='gestor';ui.gt='res';render()},[resp,tipos]);await p.waitForTimeout(300)};
  const linhas=()=>p.evaluate(()=>{const c=document.getElementById('Faturamento');if(!c)return null;const r=[...c.querySelectorAll('.rotulo')].find(x=>/Por tipo/.test(x.textContent));if(!r)return null;
    const o={};let e=r.nextElementSibling;while(e&&e.classList.contains('fat-c')){o[e.querySelector('span').firstChild.textContent.trim()]={v:e.querySelector('b').textContent,s:e.querySelector('small').textContent};e=e.nextElementSibling}return o});
  const num=t=>+t.replace(/[^\d,]/g,'').replace(',','.');

  console.log('1) Outubro dividido por tipo; a soma é o total');
  await abre(OUT,['Escola','Empresa']);let L=await linhas();
  ok(L&&L.Escola&&L.Escola.v===brl(13105.2),'Escola: o cliente já marcado no banco conta (R$ 13.105,20)');
  ok(L&&L.Empresa&&L.Empresa.v==='R$ 0,00','Empresa: R$ 0,00 enquanto ninguém foi marcado');
  ok(L&&L['Sem tipo']&&L['Sem tipo'].v===brl(108139.54)&&/37 vendas/.test(L['Sem tipo'].s),'Sem tipo: R$ 108.139,54 em 37 vendas');
  ok(L&&Math.abs(Object.values(L).reduce((a,x)=>a+num(x.v),0)-121244.74)<0.005,'Escola + Empresa + Sem tipo = R$ 121.244,74');
  let t=await p.evaluate(()=>document.getElementById('Faturamento').innerText);
  ok(/Marcar o tipo de 3 clientes/.test(t),'botão "Marcar o tipo de 3 clientes"');
  ok(/A soma dos tipos é o total do mês/.test(t),'diz que a soma é o total');
  if(process.env.PRINTS){await p.evaluate(()=>[...document.querySelectorAll('#Faturamento .rotulo')].find(x=>/Por tipo/.test(x.textContent)).scrollIntoView());await p.evaluate(()=>scrollBy(0,-120));await p.screenshot({path:path.join(process.env.PRINTS,'tipo-cliente-faturamento.png')})}

  console.log('2) Marcar o tipo, cliente por cliente');
  await p.click('[data-a=tipoCliAbrir]');await p.waitForTimeout(200);
  const ordem=()=>p.evaluate(()=>[...document.querySelectorAll('#sheet .tc-item>b')].map(x=>x.textContent));
  const o0=await ordem();
  ok(o0.join('|')==='Empresa Três|Empresa Teste Dois|Colégio Teste|Escola Exemplo','os sem tipo vêm primeiro; o já marcado por último');
  t=await p.evaluate(()=>document.getElementById('sheet').innerText);ok(/Faltam 3 de 4/.test(t)&&/vendas antigas e as próximas/.test(t),'diz quantos faltam e que vale para as vendas antigas e as próximas');
  if(process.env.PRINTS)await p.screenshot({path:path.join(process.env.PRINTS,'tipo-cliente-marcar.png')});
  const toca=async(id,v)=>{await p.click(`#sheet [data-a=tipoCli][data-id="${id}"][data-v="${v}"]`);await p.waitForTimeout(150)};
  await toca('c-col','Escola');
  ok((await ordem()).join('|')===o0.join('|'),'marcar não muda a ordem da lista (nada pula na tela)');
  ok(await p.evaluate(()=>document.querySelector('#sheet [data-id="c-col"][data-v="Escola"]').getAttribute('aria-pressed')==='true'),'o botão marcado fica destacado');
  let r=await p.evaluate(()=>({m:state.catcli.find(x=>x.id==='c-col'),e:EV.fila.filter(e=>e.tipo==='cliente.tipo_marcado').map(e=>[e.ref,e.de,e.para])}));
  ok(r.m&&r.m.tipo==='Escola'&&r.m.nome==='Colégio Teste','guarda o tipo no cliente (catcli)');
  ok(JSON.stringify(r.e)==='[["c-col",null,"Escola"]]','registra o evento cliente.tipo_marcado (de nada para Escola)');
  await toca('c-emp3','Empresa');await toca('c-emp2','Empresa');
  t=await p.evaluate(()=>document.getElementById('sheet').innerText);ok(/Todos marcados/.test(t),'no fim: "Todos marcados"');
  await p.click('#sheet .acoes [data-a=fechar]');await p.waitForTimeout(200);
  L=await linhas();
  ok(L&&L.Escola.v===brl(18105.2)&&L.Empresa.v===brl(103139.54)&&!L['Sem tipo'],'Escola R$ 18.105,20 · Empresa R$ 103.139,54 · sem a linha Sem tipo');
  ok(L&&Math.abs(num(L.Escola.v)+num(L.Empresa.v)-121244.74)<0.005,'Escola + Empresa = total do mês');
  ok(L&&/15% · 2 vendas/.test(L.Escola.s)&&/85% · 36 vendas/.test(L.Empresa.s),'mostra a parte de cada tipo (15% e 85%) e as vendas');
  t=await p.evaluate(()=>document.getElementById('Faturamento').innerText);ok(/Mudar o tipo de um cliente/.test(t),'todos marcados: o botão vira "Mudar o tipo de um cliente"');

  console.log('3) Desfazer e trocar');
  await p.evaluate(()=>A.desfazer());await p.waitForTimeout(200);
  L=await linhas();ok(L&&L['Sem tipo']&&L['Sem tipo'].v===brl(8939.4),'Desfazer volta o último cliente para "Sem tipo"');
  await p.click('[data-a=tipoCliAbrir]');await p.waitForTimeout(200);await toca('c-esc1','Empresa');
  r=await p.evaluate(()=>EV.fila.filter(e=>e.tipo==='cliente.tipo_marcado').pop());ok(r.de==='Escola'&&r.para==='Empresa','trocar Escola por Empresa registra de e para');
  await p.click('#sheet .acoes [data-a=fechar]');await p.waitForTimeout(200);

  console.log('4) Lista de tipos é da fábrica (Cadastros › Ajustes)');
  await abre(OUT,[]);ok(await linhas()===null,'sem tipos cadastrados (padrão neutro): a divisão não aparece');
  ok(await p.evaluate(()=>!!document.getElementById('Faturamento')),'o resto do Faturamento continua');
  await abre(OUT,['Empresa','Pessoa física']);L=await linhas();
  ok(L&&!L.Escola&&L['Pessoa física']&&L['Sem tipo'].v===brl(108139.54+13105.2),'tipo que saiu da lista conta como "Sem tipo"; tipo novo aparece');
  await abre({...OUT,tipos:undefined,por_cliente:undefined},['Escola','Empresa']);ok(await linhas()===null,'banco ainda sem a migração 012: a divisão não aparece, sem erro');
  await p.evaluate(()=>{seed();state=normalizar(state);ok0=state.tiposCli;state.tiposCli=['Escola','Empresa'];state.catcli=[{id:'x',nome:'X',tipo:'Escola'}];const u=state.usuarios.find(u=>u.perfil==='gestao');SESSAO={id:u.id,email:u.email};ui.inicio=null;ui.sheet=null;ui.tela='cadastros';ui.cad='ajustes';render()});
  ok(await p.evaluate(()=>!!document.getElementById('TiposCli')&&document.querySelectorAll('#TiposCli [data-tcli]').length===2),'Ajustes mostra o quadro "Tipos de cliente"');
  ok(await p.evaluate(()=>Array.isArray(ok0)&&ok0.length===0),'app sem configuração do cliente: começa sem tipos');
  await p.evaluate(()=>document.getElementById('TiposCli').scrollIntoView());await p.waitForTimeout(200);
  await p.evaluate(()=>{document.getElementById("tcliN").value="Pessoa física";document.querySelector("[data-a=addTipoCli]").click()});await p.waitForTimeout(150);
  ok(await p.evaluate(()=>state.tiposCli.join('|'))==='Escola|Empresa|Pessoa física','"Adicionar" põe um tipo novo');
  await p.evaluate(()=>{document.getElementById("tcliN").value="pessoa fisica";document.querySelector("[data-a=addTipoCli]").click()});await p.waitForTimeout(150);
  ok(await p.evaluate(()=>state.tiposCli.length)===3,'não repete tipo (mesmo nome sem acento)');
  await p.evaluate(()=>{const e=document.querySelector("[data-tcli=\"0\"]");e.value="Escolas";e.dispatchEvent(new Event("change",{bubbles:true}))});await p.waitForTimeout(150);
  ok(await p.evaluate(()=>state.tiposCli[0]==='Escolas'&&state.catcli[0].tipo==='Escolas'),'mudar o nome do tipo leva junto os clientes marcados');
  await p.evaluate(()=>document.querySelector("[data-a=rmTipoCli][data-i=\"0\"]").click());await p.waitForTimeout(150);
  t=await p.evaluate(()=>(document.getElementById('confirma')||{}).innerText||'');ok(/Tirar o tipo "Escolas"\?/.test(t)&&/fica sem tipo/.test(t),'tirar pede confirmação e avisa quem fica sem tipo');
  await p.evaluate(()=>document.querySelector("#confirma [data-a=confSim]").click());await p.waitForTimeout(150);
  ok(await p.evaluate(()=>state.tiposCli.join('|'))==='Empresa|Pessoa física','confirmado: o tipo sai da lista');
  if(process.env.PRINTS){await p.evaluate(()=>{document.getElementById('toast').innerHTML='';ui.blk={...(ui.blk||{}),'aj:Tipos de cliente':true};render();document.getElementById('TiposCli').scrollIntoView();scrollBy(0,-90)});await p.screenshot({path:path.join(process.env.PRINTS,'tipo-cliente-ajustes.png')})}

  console.log('5) Dona Cida: letra, botões e largura');
  await abre(OUT,['Escola','Empresa']);await p.click('[data-a=tipoCliAbrir]');await p.waitForTimeout(200);
  const med=await p.evaluate(()=>{const peq=[],alvo=[];const vis=e=>e.getBoundingClientRect().width>0;
    document.querySelectorAll('#Faturamento *, #sheet *').forEach(e=>{if(!vis(e))return;if([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<16)peq.push(e.tagName+':'+e.textContent.trim().slice(0,20))});
    document.querySelectorAll('#sheet [data-a], #Faturamento [data-a=tipoCliAbrir]').forEach(e=>{if(vis(e)&&e.getBoundingClientRect().height<48)alvo.push(e.textContent.trim().slice(0,20)+':'+Math.round(e.getBoundingClientRect().height))});return {peq,alvo,w:document.documentElement.scrollWidth}});
  ok(!med.peq.length,'nenhum texto abaixo de 16px'+(med.peq.length?': '+med.peq.join(' | '):''));
  ok(!med.alvo.length,'todos os botões com 48px ou mais'+(med.alvo.length?': '+med.alvo.join(' | '):''));
  ok(med.w<=360,'nada passa da largura do celular (360px)');
  ok(await p.evaluate(()=>!podeAcao('tipoCli',{})||ehGestao()),'marcar tipo é ação da gestão');
  ok(!er.length,'sem erros de JavaScript'+(er.length?': '+er.join(' | '):''));
  await b.close();

  console.log('6) Banco (migração 012)');
  let PG=null;for(const d of [process.env.PGLITE,...(process.env.NODE_PATH||'').split(path.delimiter)].filter(Boolean)){try{PG=require(require.resolve('@electric-sql/pglite',{paths:[d,path.join(d,'node_modules')]}));break}catch(e){}}
  if(!PG){console.log('  – pulado: PGlite não instalado (defina PGLITE=<pasta> para testar o SQL)')}
  else{const db=new PG.PGlite();const M=f=>fs.readFileSync(path.join(__dirname,'../supabase/migrations',f),'utf8');
    await db.exec(`create role authenticated; create role anon; create role service_role; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('t.uid',true),'')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('t.email',true)) $$;`);
    await db.exec(M('001_base.sql').replace(/do \$\$ begin\s+alter publication[\s\S]*?end \$\$;/,''));await db.exec(M('003_permissoes.sql'));await db.exec(M('009_conta_azul.sql'));await db.exec(M('010_faturamento.sql'));await db.exec(M('012_faturamento_tipo_cliente.sql'));
    await db.query(`insert into docs(path,data) values ('usuarios/g','{"email":"g@x","perfil":"gestao"}'),('usuarios/e','{"email":"e@x","perfil":"escritorio"}'),
      ('config/main','{"tiposCli":["Escola","Empresa"]}'),('catcli/c1','{"id":"c1","nome":"Escola A","tipo":"Escola"}'),('catcli/c2','{"id":"c2","nome":"Firma B","tipo":"Empresa"}'),
      ('catcli/c3','{"id":"c3","nome":"Velho C","tipo":"Tipo antigo"}')`);
    await db.query(`insert into ca_vendas(id,numero,data,cliente_id,cliente_nome,situacao,total,dados) values
      (gen_random_uuid(),1,'2026-10-02','c1','Escola A','FATURADO',1000.10,'{}'),(gen_random_uuid(),2,'2026-10-05','c1','Escola A','APROVADO',500.05,'{}'),
      (gen_random_uuid(),3,'2026-10-07','c2','Firma B','FATURADO',2000.00,'{}'),(gen_random_uuid(),4,'2026-10-09','c3','Velho C','FATURADO',300.33,'{}'),
      (gen_random_uuid(),5,'2026-10-10','c4','Nova D','FATURADO',99.99,'{}'),(gen_random_uuid(),6,'2026-10-11','c4','Nova D','EM_ORCAMENTO',777,'{}'),
      (gen_random_uuid(),7,'2026-09-30','c1','Escola A','FATURADO',50,'{}'),(gen_random_uuid(),8,'2026-10-12',null,'Sem Cadastro','FATURADO',10,'{}')`);
    const como=async email=>{await db.exec(`select set_config('t.uid','00000000-0000-0000-0000-00000000000${email==='g@x'?1:2}',false),set_config('t.email','${email}',false)`);return (await db.query(`select public.faturamento('2026-10-01','2026-10-31') r`)).rows[0].r};
    let x=await como('g@x');const pc=Object.fromEntries((x.por_cliente||[]).map(c=>[c.id,c]));
    ok(+x.total===3910.47&&x.vendas===6,'total de outubro: R$ 3.910,47 em 6 vendas (orçamento e setembro fora)');
    ok(Math.abs((x.por_cliente||[]).reduce((a,c)=>a+ +c.total,0)-x.total)<0.005&&(x.por_cliente||[]).reduce((a,c)=>a+c.vendas,0)===x.vendas,'a soma dos clientes é o total (valor e vendas)');
    ok(pc.c1&&pc.c1.tipo==='Escola'&&+pc.c1.total===1500.15&&pc.c2.tipo==='Empresa','cada cliente vem com o tipo marcado no app');
    ok(pc.c3&&pc.c3.tipo===null&&pc.c4&&pc.c4.tipo===null,'tipo fora da lista e cliente não marcado vêm sem tipo');
    ok(pc['Sem Cadastro']&&+pc['Sem Cadastro'].total===10,'venda sem id de cliente entra pelo nome (não some da soma)');
    ok(JSON.stringify(x.tipos)==='["Escola","Empresa"]','devolve a lista de tipos da fábrica');
    ok((x.clientes||[]).length<=5&&x.meses&&x.meses.length===13,'o resto continua igual à 010 (5 maiores, 13 meses)');
    ok(await como('e@x')===null,'quem não é da gestão não vê');
    await db.exec(`update docs set data='{}' where path='config/main'`);x=await como('g@x');ok(JSON.stringify(x.tipos)==='[]'&&x.por_cliente.every(c=>c.tipo===null),'fábrica sem tipos: lista vazia, todos sem tipo');
    await db.exec(M('012_faturamento_tipo_cliente.sql'));ok(true,'a migração roda de novo sem quebrar');
    await db.close()}
  console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
