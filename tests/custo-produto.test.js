// Teste: custo por peça do produto (Cadastros › Produtos; migração 016). Valores fictícios.
// Rodar: NODE_PATH=$(npm root -g) node tests/custo-produto.test.js
// PRINTS=<pasta> guarda os prints em 360×640. PGLITE=<pasta com node_modules/@electric-sql/pglite> testa também o banco.
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:360,height:640}});
  await ctx.exposeFunction('__dbop',async o=>o==='list'?[]:o==='get'?{data:null}:{});
  await ctx.addInitScript(fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8'));
  const p=await ctx.newPage();const er=[];p.on('pageerror',e=>er.push(e.message));
  await p.goto(APP);await p.waitForTimeout(1200);
  const entra=perfil=>p.evaluate(perfil=>{seed();state=normalizar(state);const u=state.usuarios.find(u=>u.perfil==='gestao');if(perfil!=='gestao'){u.perfil=perfil}
    SESSAO={id:u.id,email:u.email};NV.pronto=true;NV.erro='';ui.inicio=null;ui.sheet=null;EV.fila=[];ui.tela='cadastros';ui.cad='produtos';render()},perfil);
  const PID=()=>p.evaluate(()=>state.produtos[0].id);

  console.log('1) Lista de produtos mostra quem está sem custo');
  await entra('gestao');const pid=await PID();
  let t=await p.evaluate(()=>document.querySelector('.prods').innerText);
  ok(/Sem custo/.test(t),'produto sem custo aparece como "Sem custo"');
  if(process.env.PRINTS)await p.screenshot({path:path.join(process.env.PRINTS,'custo-lista-antes.png')});

  console.log('2) Abrir o produto e salvar o custo');
  await p.click(`.prodc[data-p="${pid}"]`);await p.waitForTimeout(200);
  ok(await p.evaluate(()=>!!document.getElementById('CustoProd')),'quadro "Custo por peça" na ficha do produto');
  t=await p.evaluate(()=>document.getElementById('CustoProd').innerText);ok(/Ainda sem custo/.test(t)&&/Só a gestão vê/.test(t),'diz que ainda não tem custo e que só a gestão vê');
  const alt=await p.evaluate(()=>{const r=e=>e.getBoundingClientRect().height;return {campo:r(document.getElementById('cu_total')),bot:r(document.querySelector('[data-a=cuSalvar]')),sep:r(document.querySelector('.cu-sep>summary')),
    fs:Math.min(...[...document.querySelectorAll('#CustoProd *')].filter(e=>e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>parseFloat(getComputedStyle(e).fontSize)))}});
  ok(alt.campo>=48&&alt.bot>=56&&alt.sep>=48,`alvos grandes (campo ${alt.campo}px, botão ${alt.bot}px, separar ${alt.sep}px)`);
  ok(alt.fs>=16,`letra de 16px ou mais (menor: ${alt.fs}px)`);
  ok(await p.evaluate(()=>document.getElementById('cu_total').inputMode==='decimal'),'teclado numérico');
  await p.evaluate(()=>document.getElementById('CustoProd').scrollIntoView());
  if(process.env.PRINTS)await p.screenshot({path:path.join(process.env.PRINTS,'custo-ficha-vazio.png')});
  await p.click('[data-a=cuSalvar]');await p.waitForTimeout(150);
  t=await p.evaluate(()=>document.getElementById('CustoProd').innerText);
  ok(/Escreva o custo por peça/.test(t)&&await p.evaluate(()=>document.getElementById('cu_total').getAttribute('aria-invalid')==='true'),'vazio: avisa ao lado do campo e não salva');
  ok(await p.evaluate(()=>!state.custos.length&&!EV.fila.some(e=>e.tipo==='custo.informado')),'nada gravado');
  await p.fill('#cu_total','abc');await p.click('[data-a=cuSalvar]');await p.waitForTimeout(150);
  ok(/só o valor em reais/.test(await p.evaluate(()=>document.getElementById('CustoProd').innerText)),'texto no lugar do número: avisa');
  await p.fill('#cu_total','32,50');await p.click('[data-a=cuSalvar]');await p.waitForTimeout(200);
  let r=await p.evaluate(pid=>({c:custoDe(pid),e:EV.fila.filter(e=>e.tipo==='custo.informado'),toast:document.getElementById('toast').innerText}),pid);
  ok(r.c&&r.c.total===32.5&&r.c.ts>0&&r.c.mat==null,'guarda R$ 32,50 com a data');
  ok(r.e.length===1&&r.e[0].ref===pid&&r.e[0].de===null&&r.e[0].para==='32.5'&&r.e[0].dados.produto&&r.e[0].dados.total===32.5,'evento custo.informado com a fotografia (de nada para 32,50)');
  ok(/Pronto! Custo de .*R\$ 32,50 por peça/.test(r.toast),'mensagem de sucesso');
  t=await p.evaluate(()=>document.getElementById('CustoProd').innerText);ok(/Hoje: R\$ 32,50 por peça/.test(t)&&/Informado em/.test(t),'mostra o custo e quando foi informado');
  if(process.env.PRINTS){await p.evaluate(()=>document.getElementById('CustoProd').scrollIntoView());await p.screenshot({path:path.join(process.env.PRINTS,'custo-ficha-salvo.png')})}

  console.log('3) Separar o custo em partes');
  await p.click('.cu-sep>summary');await p.waitForTimeout(100);
  await p.fill('#cu_total','');await p.fill('#cu_mat','20');await p.fill('#cu_mao','12,5');await p.fill('#cu_fora','5,25');
  if(process.env.PRINTS){await p.evaluate(()=>document.querySelector('.cu-sep').scrollIntoView());await p.screenshot({path:path.join(process.env.PRINTS,'custo-separar.png')})}
  await p.click('[data-a=cuSalvar]');await p.waitForTimeout(200);
  r=await p.evaluate(pid=>({c:custoDe(pid),e:EV.fila.filter(e=>e.tipo==='custo.informado').pop()}),pid);
  ok(r.c.total===37.75&&r.c.mat===20&&r.c.mao===12.5&&r.c.fora===5.25,'total vazio vira a soma das partes (R$ 37,75)');
  ok(r.e.de==='32.5'&&r.e.para==='37.75'&&r.e.dados.mat===20,'novo evento com o valor anterior e as partes');
  ok(await p.evaluate(()=>document.querySelector('.cu-sep').open),'com partes, "Separar o custo" já abre aberto');
  await p.fill('#cu_total','40');await p.click('[data-a=cuSalvar]');await p.waitForTimeout(150);
  t=await p.evaluate(()=>document.getElementById('CustoProd').innerText);
  ok(/As partes somam R\$ 37,75, mas o total está R\$ 40,00/.test(t)&&(await p.evaluate(pid=>custoDe(pid).total,pid))===37.75,'total diferente da soma: avisa e não salva');
  ok(await p.evaluate(()=>document.getElementById('cu_total').value==='40'),'não perde o que foi digitado');

  console.log('4) Desfazer, lista e cópia de segurança');
  await p.fill('#cu_total','');await p.fill('#cu_mat','');await p.fill('#cu_mao','');await p.fill('#cu_fora','');await p.fill('#cu_total','50');await p.click('[data-a=cuSalvar]');await p.waitForTimeout(150);
  ok((await p.evaluate(pid=>custoDe(pid)),pid)&&(await p.evaluate(pid=>custoDe(pid).total,pid))===50&&(await p.evaluate(pid=>custoDe(pid).mat,pid))==null,'apagar as partes e escrever só o total: guarda só o total');
  await p.evaluate(()=>A.desfazer());await p.waitForTimeout(200);
  ok((await p.evaluate(pid=>custoDe(pid).total,pid))===37.75,'Desfazer volta o custo anterior');
  await p.evaluate(()=>{ui.sheet=null;render()});await p.waitForTimeout(100);
  t=await p.evaluate(()=>document.querySelector('.prods').innerText);ok(/Custo: R\$ 37,75 por peça/.test(t),'lista de produtos mostra o custo');
  if(process.env.PRINTS)await p.screenshot({path:path.join(process.env.PRINTS,'custo-lista-depois.png')});
  r=await p.evaluate(()=>{const s=JSON.parse(snapshot());return {tem:'custos' in s,docs:Object.keys(paraDocs(state)).filter(k=>k.startsWith('custos/'))}});
  ok(!r.tem,'a cópia de segurança não leva o custo (é lida por todos)');
  ok(r.docs.length===1&&r.docs[0]==='custos/'+pid,'o custo vira o documento custos/<produto>, separado do produto');
  ok(await p.evaluate(()=>!JSON.stringify(paraDocs(state)['produtos/'+state.produtos[0].id]).includes('37.75')),'o documento do produto não leva o custo');
  await p.evaluate(async()=>{const s=JSON.parse(snapshot());NV.modo='local';await restaurar({...s,_app:'martins'})});await p.waitForTimeout(200);
  ok((await p.evaluate(pid=>custoDe(pid)?.total,pid))===37.75,'restaurar uma cópia mantém os custos atuais');

  console.log('5) Só a gestão');
  await entra('escritorio');
  ok(await p.evaluate(()=>!custoPode()),'Escritório não pode ver nem mudar custo');
  await p.evaluate(()=>{ui.tela='cadastros';ui.cad='produtos';ui.sheet={t:'produto',p:state.produtos[0].id};document.getElementById('sheet')&&render()});await p.waitForTimeout(150);
  ok(await p.evaluate(()=>!document.getElementById('CustoProd')&&!/Sem custo|Custo:/.test(document.body.innerText)),'Escritório não vê o quadro nem o custo na lista');
  await p.evaluate(()=>{state.custos=[];A.cuSalvar({p:state.produtos[0].id})});ok(await p.evaluate(()=>!state.custos.length),'mesmo chamando a ação, não grava');
  await entra('operacao');ok(await p.evaluate(()=>!custoPode()),'chão de fábrica também não');
  ok(await p.evaluate(()=>FAQ.some(f=>/custo de um produto/.test(f.q))&&ajBusca('onde coloco o custo do produto')[0].f.q.includes('custo')),'central de ajuda responde "onde coloco o custo"');
  ok(!er.length,'sem erros de JavaScript'+(er.length?': '+er.join(' | '):''));
  await b.close();

  console.log('6) Banco (migração 016)');
  let PG=null;for(const d of [process.env.PGLITE,...(process.env.NODE_PATH||'').split(path.delimiter)].filter(Boolean)){try{PG=require(require.resolve('@electric-sql/pglite',{paths:[d,path.join(d,'node_modules')]}));break}catch(e){}}
  if(!PG){console.log('  – pulado: PGlite não instalado (defina PGLITE=<pasta> para testar o SQL)')}
  else{const db=new PG.PGlite();const M=f=>fs.readFileSync(path.join(__dirname,'../supabase/migrations',f),'utf8');
    await db.exec(`create role authenticated; create role anon; create role service_role; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('t.uid',true),'')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('t.email',true)) $$;`);
    await db.exec(M('001_base.sql').replace(/do \$\$ begin\s+alter publication[\s\S]*?end \$\$;/,''));await db.exec(M('003_permissoes.sql'));await db.exec(M('016_custos_so_gestao.sql'));
    await db.query(`insert into docs(path,data) values ('usuarios/g','{"email":"g@x","perfil":"gestao"}'),('usuarios/e','{"email":"e@x","perfil":"escritorio"}'),('produtos/p1','{"id":"p1","nome":"Camiseta"}'),('custos/p1','{"id":"p1","total":32.5}')`);
    await db.exec(`grant usage on schema public to authenticated; grant select,insert,update,delete on public.docs to authenticated;`);
    const como=async email=>db.exec(`reset role; select set_config('t.uid','00000000-0000-0000-0000-00000000000${email==='g@x'?1:2}',false),set_config('t.email','${email}',false); set role authenticated;`);
    const tenta=async q=>{try{await db.query(q);return true}catch(e){return false}};
    await como('g@x');
    ok((await db.query(`select count(*)::int n from docs where col='custos'`)).rows[0].n===1,'gestão lê o custo');
    ok(await tenta(`update docs set data='{"id":"p1","total":40}' where path='custos/p1'`)&&await tenta(`insert into docs(path,data) values ('custos/p2','{"id":"p2","total":10}')`),'gestão muda e cria custo');
    await como('e@x');
    ok((await db.query(`select count(*)::int n from docs where col='custos'`)).rows[0].n===0,'Escritório não recebe nenhum custo do banco');
    ok((await db.query(`select count(*)::int n from docs where col='produtos'`)).rows[0].n===1,'Escritório continua lendo o produto');
    ok(!await tenta(`insert into docs(path,data) values ('custos/p3','{"id":"p3","total":1}')`),'Escritório não cria custo');
    await db.query(`update docs set data='{"total":0}' where path='custos/p1'`);await db.query(`delete from docs where path='custos/p2'`);
    await como('g@x');ok((await db.query(`select data->>'total' t from docs where path='custos/p1'`)).rows[0].t==='40'&&(await db.query(`select count(*)::int n from docs where col='custos'`)).rows[0].n===2,'Escritório não muda nem apaga custo');
    await db.exec(`reset role;`);await db.exec(M('016_custos_so_gestao.sql'));ok(true,'a migração roda de novo sem quebrar');
    await db.close()}
  console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
