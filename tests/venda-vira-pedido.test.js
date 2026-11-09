// Teste: venda do Conta Azul vira pedido "a completar" (Escritório › Vendas do Conta Azul sem pedido; migração 013). Nomes e números fictícios.
// Rodar: NODE_PATH=$(npm root -g) node tests/venda-vira-pedido.test.js
// PRINTS=<pasta> guarda os prints em 360×640. PGLITE=<pasta com node_modules/@electric-sql/pglite> testa também o SQL.
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
// vendedor e clientes 2 e 3 são preenchidos com dados do seed (nome de quem vende e de pedidos que já existem)
const VENDAS=(vend,cli2,cli3)=>{const it=(nome,descricao,quantidade,valor)=>({id_item:'x',nome,descricao,tipo:'PRODUTO',quantidade,valor});return [
  {id:'a1',numero:9201,data:'2026-11-03',situacao:'APROVADO',total:1000,cliente_id:'c1',cliente:'EMPRESA NOVA TESTE',vendedor:vend,
    itens:[it('PCPV - Camisa Polo Viena','Na cor MARINHO, com um bordado no peito esq. - UNISSEX: M/5 - G/4 - GG/6',15,63.33),it('MBORD - Matriz Bordado','cobrado apenas na primeira encomenda',1,50)],
    detalhe:{cliente:{nome:'EMPRESA NOVA TESTE',documento:'33.333.333/0001-33'},observacoes:'Entregar na portaria',composicao_valor:{valor_bruto:1050,desconto:50,frete:0,valor_liquido:1000},parcelas:[{numero:1,data_vencimento:'2026-12-03',valor:1000,descricao:'Venda 9201'}]}},
  {id:'a2',numero:9202,data:'2026-11-04',situacao:'FATURADO',total:500,cliente:cli2,vendedor:'Outra Pessoa',itens:[it('Camiseta','P/10',10,50)],detalhe:{}},
  {id:'a3',numero:9203,data:'2026-11-05',situacao:'APROVADO',total:700,cliente:cli3+' LTDA',vendedor:'Outra Pessoa',itens:[it('Jaleco','M/7',7,100)],detalhe:{}},
  {id:'a4',numero:9204,data:'2026-11-05',situacao:'APROVADO',total:80,cliente:'REVENDA TESTE',vendedor:'Outra Pessoa',itens:[it('Tecido brim (metro)','',20,4)],detalhe:{}},
  {id:'a5',numero:9205,data:'2026-11-06',situacao:'APROVADO',total:300,cliente:'ESCOLA SEM ITENS',vendedor:null,itens:null,detalhe:null}]};
(async()=>{const b=await chromium.launch();const er=[];
  const app=fs.readFileSync(path.join(R,'app.html'),'utf8');
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>window.MARTINS_SB={url:'https://teste.supabase.co',key:'anon'}</script></head><body>${app}</body></html>`;
  const ctx=await b.newContext({viewport:{width:360,height:640},timezoneId:'America/Sao_Paulo'});
  await ctx.route('https://app.martins.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
  await ctx.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){}}})}'}));
  const p=await ctx.newPage();p.on('pageerror',e=>er.push(e.message));
  await p.clock.setFixedTime(new Date('2026-11-09T10:00:00-03:00'));
  await p.goto('https://app.martins.test/');await p.waitForTimeout(1500);
  const abre=async(perfil,o={})=>{await p.evaluate(([perfil,o,VS])=>{seed();state=normalizar(state);
      const vend=state.pessoas[0],ps=state.pedidos.filter(x=>!x.concluido);ps[0].ficha='9202';ps[1].ficha='';window.P1=ps[1].id;window.P1orig=JSON.parse(JSON.stringify(ps[1]));
      const u=state.usuarios.find(u=>u.perfil==='gestao');u.perfil=perfil;u.pessoa=vend.id;SESSAO={id:u.id,email:u.email};NV.pronto=true;NV.erro='';ui.inicio=null;ui.sheet=null;ui.cav=null;
      const vs=eval(VS)(vend.nome+' Souza',ps[0].cliente,ps[1].cliente);window.VS=vs;
      window.NB=0;window.NL=0;NV.db=o.claude?null:{ev:{metricas:async()=>({}),vendasPedido:o.semFuncao?async()=>{throw {code:'sem-cav'}}:async desde=>{window.DESDE=desde;window.NL++;return JSON.parse(JSON.stringify(vs))},
        ...(o.est!==undefined?{caEstado:async()=>o.est,caBuscar:async()=>{window.NB++;await new Promise(r=>setTimeout(r,150));if(o.ocupado)throw {code:'ocupado'};return {vendas:2}}}:{})},
        sinal:{ouvir:cb=>{window.CB=cb}}};
      if(o.off)state.modOff=['cav'];EV.fila=[];ui.tela='fabrica';ui.fz='esc';ui.escVer='ped';render()},[perfil,o,VENDAS.toString()]);await p.waitForTimeout(300);await p.evaluate(()=>render());await p.waitForTimeout(100)};
  const botao=()=>p.evaluate(()=>{const e=document.querySelector('[data-a=cavAbrir]');return e?e.innerText.replace(/\s+/g,' ').trim():null});
  const cards=()=>p.evaluate(()=>[...document.querySelectorAll('#sheet .cav-v')].map(c=>c.id.replace('cav-','')));

  console.log('1) A lista no Escritório');
  await abre('gestao');
  let t=await botao();
  ok(t&&/Vendas do Conta Azul sem pedido/.test(t)&&/4 vendas para criar o pedido/.test(t),'botão "Vendas do Conta Azul sem pedido · 4 vendas" ('+t+')');
  ok(await p.evaluate(()=>{const c=document.querySelector('[data-a=compras]'),v=document.querySelector('[data-a=cavAbrir]');return !!c&&!!v&&(c.compareDocumentPosition(v)&Node.DOCUMENT_POSITION_FOLLOWING)}),'fica logo abaixo da Lista de compras (a Lista de compras não muda de lugar)');
  ok(await p.evaluate(()=>window.DESDE)==='2026-09-10','busca as vendas dos últimos 60 dias');
  await p.click('[data-a=cavAbrir]');await p.waitForTimeout(300);
  let c=await cards();
  ok(c.join(',')==='9201,9203,9204,9205','a venda já digitada à mão (9202, com o número no pedido) não aparece; a de quem está usando vem primeiro');
  t=await p.evaluate(()=>document.getElementById('cav-9201').innerText);
  ok(/EMPRESA NOVA TESTE/.test(t)&&/R\$ 1\.000,00/.test(t)&&/Venda 9201 · 03\/11/.test(t)&&/sua venda/.test(t)&&/15 Camisa Polo Viena/.test(t)&&!/Matriz/.test(t),'cartão: cliente, valor, nº, data, quem vendeu e as peças (sem a matriz)'+' ['+t.split(String.fromCharCode(10)).join(' / ')+']');
  ok(/chegam do Conta Azul na próxima madrugada/.test(await p.evaluate(()=>document.getElementById('cav-9205').innerText)),'venda ainda sem itens avisa que chegam de madrugada');
  if(process.env.PRINTS)await p.screenshot({path:path.join(process.env.PRINTS,'vendas-lista.png')});

  console.log('2) Criar pedido: a mesma conferência do Conta Azul, já preenchida');
  await p.click('[data-a=cavCriar][data-n="9201"]');await p.waitForTimeout(300);
  let r=await p.evaluate(()=>{const g=ui.sheet.grupos[0];return {t:ui.sheet.t,h:document.querySelector('#sheet h1').textContent,volta:!!document.querySelector('#sheet [data-a=cavAbrir]'),num:g.num,cli:g.cliente,cnpj:g.cnpj,vend:g.vend&&pNome(g.vend),
    ch:g.chegada&&new Date(g.chegada).toISOString().slice(0,10),n:g.itens.length,gr:g.itens[0]&&g.itens[0].g,gen:g.itens[0]&&g.itens[0].gen,extras:g.fin.extras.length,liq:g.fin.liquido,des:g.fin.desconto,obs:g.obs,cond:g.fin.cond.join('|'),pend:impPend(g)}});
  ok(r.t==='imp'&&/Criar pedido da venda 9201/.test(r.h)&&r.volta,'abre a conferência "Criar pedido da venda 9201", com "Voltar às vendas"');
  ok(r.num==='9201'&&r.cli==='EMPRESA NOVA TESTE'&&r.cnpj==='33.333.333/0001-33'&&r.ch==='2026-11-03','número, empresa, CNPJ e data da venda vêm prontos');
  ok(r.vend&&r.vend===await p.evaluate(()=>state.pessoas[0].nome),'quem vendeu vem pronto ('+r.vend+')');
  ok(r.n===1&&JSON.stringify(r.gr)==='{"M":5,"G":4,"GG":6}'&&r.gen==='U'&&r.extras===1,'peças e tamanhos vêm prontos; a matriz vai para os valores');
  ok(r.liq===1000&&r.des===50&&/Entregar na portaria/.test(r.obs)&&/Venda 9201/.test(r.cond),'valor líquido, desconto, observação e parcelas');
  ok(r.pend.includes('prazo de entrega'),'o que o Conta Azul não tem (prazo) fica para completar');
  if(process.env.PRINTS)await p.screenshot({path:path.join(process.env.PRINTS,'vendas-criar.png')});
  const n0=await p.evaluate(()=>state.pedidos.length);
  await p.evaluate(()=>{const g=ui.sheet.grupos[0];g.entrega=new Date('2026-11-30T17:00').getTime();g.itens.forEach(x=>{if(!x.prod)x.prod=state.produtos[0].id});A.impWizard();A.wCriar()});await p.waitForTimeout(300);
  r=await p.evaluate(()=>{const ps=state.pedidos.filter(x=>fichasDe(x).includes('9201')),x=ps[0];const ls=x?state.lotes.filter(l=>l.ped===x.id):[];const e=EV.fila.filter(e=>e.tipo==='pedido.criado').pop();
    return {n:ps.length,tot:state.pedidos.length,id:x&&x.id,fonte:x&&x.fonte,dv:x&&x.daVenda,pre:x&&x.pre&&x.pre.length,liq:x&&x.fin&&x.fin.liquido,q:ls.reduce((a,l)=>a+l.qtd,0),cli:x&&x.cliente,e:e&&e.dados}});
  ok(r.n===1&&r.tot===n0+1&&r.id==='9201','cria exatamente 1 pedido, com o número da venda');
  ok(r.fonte==='contaazul'&&r.dv==='9201'&&r.pre>0,'entra como pré-pedido do Conta Azul (falta completar)');
  ok(r.liq===1000&&r.q===15,'valor (R$ 1.000,00) e 15 peças batem com a venda');
  ok(r.e&&r.e.ficha==='9201'&&r.e.venda==='9201'&&r.e.fonte==='contaazul','evento pedido.criado leva o número da venda');
  ok(await p.evaluate(()=>tarefasEsc().some(t=>t.t==='Completar o pedido do Conta Azul'&&JSON.stringify(t).includes('9201'))),'aparece a tarefa "Completar o pedido do Conta Azul"');

  console.log('3) Nada duplicado');
  await p.evaluate(()=>{ui.sheet=null;ui.tela='fabrica';ui.fz='esc';render()});await p.waitForTimeout(100);t=await botao();
  ok(t&&/3 vendas/.test(t),'a venda some da lista: 3 vendas');
  await p.evaluate(()=>A.cavCriar({n:'9201'}));await p.waitForTimeout(200);
  ok(await p.evaluate(()=>state.pedidos.filter(x=>fichasDe(x).includes('9201')).length)===1&&await p.evaluate(()=>!ui.sheet||ui.sheet.t!=='imp'),'tentar criar de novo não abre a conferência nem cria outro');
  ok(await p.evaluate(()=>{const g=grupoCA(cavFicha(VS[0]));return impPend(g).includes('pedido já importado')}),'a conferência também trava "pedido já importado"');

  console.log('4) Já tem pedido no app: ligar sem mudar o pedido');
  await p.evaluate(()=>{ui.sheet=null;render()});await p.click('[data-a=cavAbrir]');await p.waitForTimeout(200);
  await p.click('[data-a=cavLiga][data-n="9203"]');await p.waitForTimeout(200);
  const prim=await p.evaluate(()=>{const e=document.querySelector('#cav-9203 [data-a=cavLigaOk]');return e&&e.dataset.id});
  ok(prim===await p.evaluate(()=>window.P1),'o primeiro sugerido é o pedido do mesmo cliente');
  if(process.env.PRINTS){await p.evaluate(()=>{document.getElementById('toast').innerHTML='';document.getElementById('cav-9203').scrollIntoView()});await p.screenshot({path:path.join(process.env.PRINTS,'vendas-ligar.png')})}
  await p.click(`#cav-9203 [data-a=cavLigaOk][data-id="${prim}"]`);await p.waitForTimeout(200);
  r=await p.evaluate(()=>{const x=pedById(window.P1),o=window.P1orig;const dif=Object.keys({...x,...o}).filter(k=>k!=='ficha'&&k!=='marcos'&&JSON.stringify(x[k])!==JSON.stringify(o[k]));const e=EV.fila.filter(e=>e.tipo==='venda.ligada').pop();return {f:x.ficha,dif,e:e&&[e.ped,e.ref,e.para]}});
  ok(r.f==='9203'&&!r.dif.length,'só o "Nº do pedido no Conta Azul" muda (nada mais do pedido; marcos de fase são do app)'+(r.dif.length?': '+r.dif.join(','):''));
  ok(JSON.stringify(r.e)===JSON.stringify([await p.evaluate(()=>window.P1),'9203','9203']),'evento venda.ligada');
  ok((await cards()).join(',')==='9204,9205','a venda ligada sai da lista');
  await p.evaluate(()=>A.desfazer());await p.waitForTimeout(200);
  ok(await p.evaluate(()=>!pedById(window.P1).ficha),'Desfazer tira o número do pedido');
  await p.evaluate(()=>A.cavLigaOk({n:'9203',id:window.P1}));

  console.log('5) Não vai para a produção');
  await p.evaluate(()=>{ui.sheet={t:'cav',lig:null};render()});await p.waitForTimeout(100);
  await p.click('[data-a=cavFora][data-n="9204"]');await p.waitForTimeout(150);
  t=await p.evaluate(()=>(document.getElementById('confirma')||{}).innerText||'');
  ok(/A venda 9204 \(REVENDA TESTE\) não vai para a produção\?/.test(t),'pede confirmação');
  await p.click('#confirma [data-a=confSim]');await p.waitForTimeout(200);
  r=await p.evaluate(()=>({m:state.cavenda.find(x=>x.id==='9204'),e:EV.fila.filter(e=>e.tipo==='venda.dispensada').map(e=>e.ref),c:[...document.querySelectorAll('#sheet .cav-v')].map(x=>x.id),txt:document.getElementById('sheet').innerText}));
  ok(r.m&&r.m.fora&&r.m.fora.por&&r.m.cliente==='REVENDA TESTE'&&r.e.join()==='9204','guarda em cavenda/9204 quem tirou, com o evento venda.dispensada');
  ok(r.c.join()==='cav-9205'&&/Não vão para a produção \(1\)/.test(r.txt),'sai da lista e fica em "Não vão para a produção (1)"');
  await p.evaluate(()=>A.cavVolta({n:'9204'}));await p.waitForTimeout(150);
  ok((await cards()).join(',')==='9204,9205'&&await p.evaluate(()=>EV.fila.some(e=>e.tipo==='venda.dispensa_desfeita'&&e.ref==='9204')),'"Voltar para a lista" traz de volta (evento venda.dispensa_desfeita)');
  ok(await p.evaluate(()=>COLS.includes('cavenda')),'cavenda é uma coleção sincronizada');

  console.log('6) Quem vê e quando aparece');
  await abre('escritorio');ok(!!await botao(),'Escritório vê a lista');
  await abre('operacao');ok(await p.evaluate(()=>!cavPode()),'chão de fábrica não vê');
  await abre('gestao',{off:true});ok(!await botao(),'módulo desligado em Ajustes: não aparece');
  await abre('gestao',{claude:true});ok(!await botao(),'no Claude (sem banco Supabase): não aparece, sem erro');
  await abre('gestao',{semFuncao:true});ok(!await botao(),'banco sem a migração 013: não aparece, sem erro');
  ok(await p.evaluate(()=>MODULOS.some(m=>m[0]==='cav')),'é um módulo que a fábrica liga e desliga');

  console.log('6b) Busca na hora (função do Supabase, 014/015)');
  await abre('gestao',{est:{ligado:false,ultima:null}});await p.click('[data-a=cavAbrir]');await p.waitForTimeout(200);
  ok(!await p.$('[data-a=cavBuscar]'),'agendador desligado: sem o botão "Buscar vendas agora" (a lista funciona igual)');
  await abre('gestao',{est:{ligado:true,ultima:'2026-11-09T12:57:00Z'}});await p.click('[data-a=cavAbrir]');await p.waitForTimeout(200);
  t=await p.evaluate(()=>document.getElementById('sheet').innerText);
  ok(/Buscar vendas agora/.test(t)&&/Conferido no Conta Azul às 09:57/.test(t)&&/a cada 3 minutos/.test(t),'ligado: botão "Buscar vendas agora" e a hora da última conferência');
  if(process.env.PRINTS){await p.evaluate(()=>{document.getElementById('toast').innerHTML='';document.querySelectorAll('.desf-flut,.desf-b,[class*=desf]').forEach(e=>{if(e.closest('#sheet'))return;e.style.display='none'})});await p.screenshot({path:path.join(process.env.PRINTS,'vendas-buscar-agora.png')})}
  const nl=await p.evaluate(()=>window.NL);await p.click('[data-a=cavBuscar]');await p.waitForTimeout(50);
  ok(await p.evaluate(()=>/Buscando no Conta Azul/.test(document.getElementById('sheet').innerText)&&document.querySelector('[data-a=cavBuscar]').disabled),'enquanto busca: "Buscando no Conta Azul…" e o botão não aceita outro toque');
  await p.evaluate(()=>A.cavBuscar());await p.waitForTimeout(400);
  ok(await p.evaluate(()=>window.NB)===1,'tocar de novo durante a busca não chama a função duas vezes');
  ok(/Conta Azul conferido: 2 vendas mudaram/.test(await p.evaluate(()=>document.getElementById('toast').innerText))&&await p.evaluate(()=>window.NL)>nl,'no fim: avisa e recarrega a lista');
  await abre('gestao',{est:{ligado:true},ocupado:true});await p.click('[data-a=cavAbrir]');await p.waitForTimeout(200);await p.click('[data-a=cavBuscar]');await p.waitForTimeout(400);
  ok(/já está buscando no Conta Azul/.test(await p.evaluate(()=>document.getElementById('toast').innerText)),'outra busca rodando: avisa para esperar');
  await p.evaluate(()=>{NV.sinal=true;nuvemOuvir()});const n1=await p.evaluate(()=>window.NL);
  await p.evaluate(()=>window.CB('cavsinal/vendas'));await p.waitForTimeout(700);
  ok(await p.evaluate(()=>window.NL)===n1+1,'venda nova no Conta Azul: o aviso da função recarrega a lista sozinho');
  await p.evaluate(()=>window.CB('pedidos/0001'));await p.waitForTimeout(700);ok(await p.evaluate(()=>window.NL)===n1+1,'outros avisos não recarregam a lista de vendas');

  console.log('7) Dona Cida: letra, botões e largura');
  await abre('gestao',{est:{ligado:true,ultima:'2026-11-09T12:57:00Z'}});await p.click('[data-a=cavAbrir]');await p.waitForTimeout(200);await p.click('[data-a=cavLiga][data-n="9203"]');await p.waitForTimeout(200);
  const med=await p.evaluate(()=>{const peq=[],alvo=[];const vis=e=>e.getBoundingClientRect().width>0;
    document.querySelectorAll('#sheet *').forEach(e=>{if(!vis(e))return;if([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<16)peq.push(e.tagName+':'+e.textContent.trim().slice(0,20))});
    document.querySelectorAll('#sheet [data-a], [data-a=cavAbrir]').forEach(e=>{if(vis(e)&&e.getBoundingClientRect().height<48)alvo.push(e.textContent.trim().slice(0,20)+':'+Math.round(e.getBoundingClientRect().height))});return {peq,alvo,w:document.documentElement.scrollWidth}});
  ok(!med.peq.length,'nenhum texto abaixo de 16px'+(med.peq.length?': '+med.peq.join(' | '):''));
  ok(!med.alvo.length,'todos os botões com 48px ou mais'+(med.alvo.length?': '+med.alvo.join(' | '):''));
  ok(med.w<=360,'nada passa da largura do celular (360px)');
  if(process.env.PRINTS){await p.evaluate(()=>{ui.sheet=null;render();document.getElementById('toast').innerHTML='';document.querySelector('[data-a=compras]').scrollIntoView();scrollBy(0,-90)});await p.waitForTimeout(100);await p.screenshot({path:path.join(process.env.PRINTS,'vendas-escritorio.png')})}
  ok(!er.length,'sem erros de JavaScript'+(er.length?': '+er.join(' | '):''));
  await b.close();

  console.log('8) Banco (migração 013)');
  let PG=null;for(const d of [process.env.PGLITE,...(process.env.NODE_PATH||'').split(path.delimiter)].filter(Boolean)){try{PG=require(require.resolve('@electric-sql/pglite',{paths:[d,path.join(d,'node_modules')]}));break}catch(e){}}
  if(!PG){console.log('  – pulado: PGlite não instalado (defina PGLITE=<pasta> para testar o SQL)')}
  else{const db=new PG.PGlite();const M=f=>fs.readFileSync(path.join(__dirname,'../supabase/migrations',f),'utf8');
    await db.exec(`create role authenticated; create role anon; create role service_role; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('t.uid',true),'')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('t.email',true)) $$;`);
    await db.exec(M('001_base.sql').replace(/do \$\$ begin\s+alter publication[\s\S]*?end \$\$;/,''));await db.exec(M('003_permissoes.sql'));await db.exec(M('009_conta_azul.sql'));
    await db.query(`insert into ca_vendas(id,numero,data,cliente_nome,situacao,total,dados) values
      (gen_random_uuid(),1,'2026-11-02','Escola A','APROVADO',100,'{}'),(gen_random_uuid(),2,'2026-11-03','Firma B','FATURADO',200,'{}'),
      (gen_random_uuid(),3,'2026-11-03','Firma C','ORCAMENTO',300,'{}'),(gen_random_uuid(),4,'2026-08-01','Velha D','APROVADO',400,'{}')`);
    await db.exec(M('013_vendas_viram_pedido.sql'));
    await db.query(`update ca_vendas set vendedor='Paula',itens='[{"nome":"Polo","quantidade":5,"valor":20}]',detalhe='{"observacoes":"x"}' where numero=1`);
    await db.query(`insert into docs(path,data) values ('usuarios/g','{"email":"g@x","perfil":"gestao"}'),('usuarios/e','{"email":"e@x","perfil":"escritorio"}'),('usuarios/o','{"email":"o@x","perfil":"operacao"}')`);
    const como=async email=>{await db.exec(`select set_config('t.email','${email}',false)`);return (await db.query(`select public.vendas_para_pedido('2026-09-10') r`)).rows[0].r};
    let x=await como('g@x');
    ok(Array.isArray(x)&&x.map(v=>v.numero).join()==='1,2','só aprovadas e faturadas desde a data (sem orçamento nem venda velha)');
    ok(x[0].vendedor==='Paula'&&x[0].itens[0].nome==='Polo'&&x[0].detalhe.observacoes==='x'&&+x[0].total===100&&x[1].itens===null,'vem com quem vendeu, itens e resumo (ou vazio, se ainda não chegou)');
    ok(!JSON.stringify(x).includes('"dados"'),'não devolve a resposta inteira do Conta Azul');
    x=await como('e@x');ok(Array.isArray(x)&&x.length===2,'escritório vê');
    ok(await como('o@x')===null&&await como('ninguem@x')===null,'chão de fábrica e quem não tem acesso não veem');
    await db.exec(M('013_vendas_viram_pedido.sql'));ok((await db.query(`select vendedor from ca_vendas where numero=1`)).rows[0].vendedor==='Paula','a migração roda de novo sem quebrar nem apagar nada');
    console.log('9) Banco (migração 014: trava, estado, quem pode buscar)');
    await db.exec(M('014_conta_azul_na_hora.sql'));
    await db.query(`insert into integracoes(nome,segredo,info) values ('conta-azul','rt','{"ultima_sincronizacao":"2026-11-09T13:00:00Z","acesso":"at-secreto"}') on conflict (nome) do nothing`);
    const pega=async(d,s)=>(await db.query(`select public.ca_trava_pega('${d}',${s}) r`)).rows[0].r;
    ok(await pega('a',60)===true&&await pega('b',60)===false,'trava: a primeira busca pega, a segunda espera');
    ok(await pega('a',60)===true,'quem tem a trava pode renovar');
    await db.query(`select public.ca_trava_solta('b')`);ok(await pega('b',60)===false,'quem não tem a trava não solta a dos outros');
    await db.query(`select public.ca_trava_solta('a')`);ok(await pega('b',1)===true,'soltou: a próxima pega');
    await db.query(`update ca_trava set ate=clock_timestamp()-interval '1 second'`);ok(await pega('c',60)===true,'trava vencida (busca que caiu) não prende as outras');
    const est=async email=>{await db.exec(`select set_config('t.email','${email}',false)`);return (await db.query(`select public.ca_estado() r`)).rows[0].r};
    let e=await est('e@x');ok(e&&e.ligado===false&&e.ultima==='2026-11-09T13:00:00Z','estado: desligado (sem agendador) e a hora da última busca');
    ok(!JSON.stringify(e).includes('at-secreto'),'o estado não mostra o acesso guardado');
    ok(await est('o@x')===null,'chão de fábrica não vê o estado');
    await db.exec(`select set_config('t.email','e@x',false)`);ok((await db.query(`select public.ca_pode_buscar() r`)).rows[0].r===true,'escritório pode tocar em Buscar vendas agora');
    await db.exec(`select set_config('t.email','o@x',false)`);ok((await db.query(`select public.ca_pode_buscar() r`)).rows[0].r===false,'chão de fábrica não pode');
    ok((await db.query(`select public.ca_cron_confere('qualquer-coisa-com-mais-de-20') r`)).rows[0].r===false,'sem o segredo do agendador no Vault, ninguém passa por agendador');
    await db.exec(M('014_conta_azul_na_hora.sql'));ok(true,'a 014 roda de novo sem quebrar');
    await db.close();await new Promise(r=>setTimeout(r,300))}
  console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
