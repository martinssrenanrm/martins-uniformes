// Teste: permissões por responsabilidade (Onda UX 1, 11/2026).
// Na tela: o Escritório não entra em Cadastros/Painel nem por atalho; cancelar e corrigir a produção somem e recusam (padrão);
// a gestão pode tudo e escolhe em Ajustes › Acessos o que o Escritório pode fazer.
// No banco (migração 011): a mesma regra, testada num Postgres de bolso (PGlite) quando ele estiver instalado.
// Rodar: NODE_PATH=$(npm root -g) node tests/permissoes.test.js   (PGLITE=<pasta com node_modules/@electric-sql/pglite> para o banco)
const { chromium } = require('playwright');const path=require('path'),fs=require('fs');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:360,height:640}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  const entra=perfil=>A.evaluate(perfil=>{if(!state.pessoas||!state.pessoas.length){seed();state=normalizar(state)}let u=state.usuarios.find(x=>x.perfil===perfil);
    if(!u){u={id:'u-'+perfil,email:perfil+'@exemplo.com',nome:'Pessoa '+perfil,perfil,pessoa:''};state.usuarios.push(u)}SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;ui.inicio=null;render()},perfil);
  console.log('1) Escritório: telas da gestão fechadas, inclusive por atalho');
  await entra('escritorio');
  let r=await A.evaluate(()=>{const tela=t=>{ui.tela=t;render();return ui.tela};const viaA=t=>{ui.tela='fabrica';A.tela({t});return ui.tela};
    const vis=s=>{const e=document.querySelector(s);return !!e&&getComputedStyle(e).display!=='none'};
    return {cad:tela('cadastros'),gest:tela('gestor'),aCad:viaA('cadastros'),navCad:vis('.nb[data-t=cadastros]'),navGest:vis('.nb[data-t=gestor]'),podeIr:podeAcao('irEquipe',{}),podeCad:podeAcao('ir',{to:'cad:estoque'}),podePed:podeAcao('ir',{to:'ped:1'})}});
  ok(r.cad==='fabrica'&&r.gest==='fabrica'&&r.aCad==='fabrica','Cadastros e Painel não abrem para o Escritório (vai para a Fábrica)');
  ok(!r.navCad&&!r.navGest,'barra de baixo sem Cadastros e Gestor');
  ok(!r.podeIr&&!r.podeCad&&r.podePed,'atalhos para Cadastros somem; atalho para pedido continua');
  console.log('2) Escritório: cancelar e corrigir a produção (padrão: só a gestão); entregar continua');
  r=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido&&!x.cancelado);ui.tela='pedidos';ui.sheet={t:'pedido',id:p.id};render();
    const cancel=!!document.querySelector('#sheet [data-a=pedCancelar]');const l=state.lotes.find(l=>Object.values(l.steps).some(x=>x.st==='ok'&&!x.forn));const s=Object.keys(l.steps).find(k=>l.steps[k].st==='ok'&&!l.steps[k].forn);
    ui.sheet={t:'etEd',l:l.id,s};render();const volta=!!document.querySelector('#sheet [data-a=etVolta]'),hora=!!document.querySelector('#sheet [data-a=etHora]'),dica=(document.querySelector('#sheet .perm-dica')||{}).textContent||'';
    return {pid:p.id,cancel,volta,hora,dica,ent:podeAcao('entregar'),canc:podeAcao('pedCancOk'),corr:podeAcao('etVolta')}});
  ok(!r.cancel,'"Cancelar pedido" não aparece para o Escritório');
  ok(!r.volta&&!r.hora&&/gestão/.test(r.dica),'"Voltar" e "Corrigir quem fez e o horário" não aparecem; a tela diz para chamar a gestão');
  ok(r.ent&&!r.canc&&!r.corr,'padrão neutro: Escritório entrega; cancelar e corrigir são da gestão');
  // um botão que escapasse ainda seria recusado no toque
  r=await A.evaluate(pid=>{const p=pedById(pid);const bt=document.createElement('button');bt.dataset.a='pedCancOk';bt.dataset.id=pid;document.getElementById('app').appendChild(bt);bt.click();const t=(document.querySelector('#toast')||{}).textContent||'';bt.remove();return {canc:!!p.cancelado,t}},r.pid);
  ok(!r.canc&&/gestão/.test(r.t),'toque em ação proibida é recusado com aviso ("'+r.t.replace(/×/g,'').trim()+'")');
  console.log('3) Gestão: pode tudo e escolhe o que o Escritório pode');
  await entra('gestao');
  r=await A.evaluate(()=>{ui.tela='cadastros';ui.cad='ajustes';ui.blk={'aj:Acessos ao sistema':true};render();const bts=[...document.querySelectorAll('[data-a=permTog]')];
    const antes=bts.map(x=>x.dataset.v+':'+x.getAttribute('aria-pressed'));const alto=Math.min(...bts.map(x=>x.getBoundingClientRect().height));
    document.querySelector('[data-a=permTog][data-v=cancelar]').click();const depois=(state.permissoes||{}).cancelar;
    const p=state.pedidos.find(x=>!x.concluido&&!x.cancelado);ui.sheet={t:'pedido',id:p.id};render();const cancelG=!!document.querySelector('#sheet [data-a=pedCancelar]');ui.sheet=null;
    return {antes,alto,depois,cancelG,gest:(ui.tela='gestor',render(),ui.tela)}});
  ok(r.antes.join()==='entregar:true,cancelar:false,corrigirProd:false','Ajustes › Acessos mostra as 3 escolhas com o padrão ('+r.antes.join(', ')+')');
  ok(r.alto>=48,'botões das escolhas com 48px ou mais ('+Math.round(r.alto)+'px)');
  ok(r.depois===true,'tocar liga "cancelar" para o Escritório');
  ok(r.cancelG&&r.gest==='gestor','gestão vê "Cancelar pedido" e entra no Painel');
  await entra('escritorio');
  r=await A.evaluate(()=>({canc:podeAcao('pedCancOk'),mud:(A.permTog({v:'corrigirProd'}),(state.permissoes||{}).corrigirProd)}));
  ok(r.canc,'com a escolha ligada, o Escritório pode cancelar');
  ok(r.mud==null,'o Escritório não muda as permissões');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();

  console.log('4) Banco (migração 011)');
  let PG=null;for(const d of [process.env.PGLITE,...(process.env.NODE_PATH||'').split(path.delimiter)].filter(Boolean)){try{PG=require(require.resolve('@electric-sql/pglite',{paths:[d,path.join(d,'node_modules')]}));break}catch(e){}}
  if(!PG){console.log('  – pulado: PGlite não instalado (defina PGLITE=<pasta> para testar o SQL)')}
  else{const db=new PG.PGlite();const M=f=>fs.readFileSync(path.join(__dirname,'../supabase/migrations',f),'utf8');
    await db.exec(`create role authenticated; create role anon; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('t.uid',true),'')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('t.email',true)) $$;`);
    await db.exec(M('001_base.sql').replace(/do \$\$ begin\s+alter publication[\s\S]*?end \$\$;/,''));await db.exec(M('003_permissoes.sql'));await db.exec(M('011_permissoes_responsabilidade.sql'));
    const velho=Date.now()-3600e3,novo=Date.now()-60e3;
    await db.query(`insert into docs(path,data) values ('usuarios/g','{"email":"g@x","perfil":"gestao"}'),('usuarios/e','{"email":"e@x","perfil":"escritorio"}'),
      ('config/main','{"seq":1}'),('pedidos/1','{"id":"1","concluido":null,"cancelado":null}'),
      ('lotes/1-1',$1)`,[JSON.stringify({id:'1-1',steps:{a:{st:'ok',ini:velho-6e5,fim:velho,op:'p1'},b:{st:'ok',ini:novo-6e4,fim:novo,op:'p1'},c:{st:'and',ini:velho,op:'p2'},f:{st:'ok',fim:velho,forn:'x'}}})]);
    const como=async(email,sql,params)=>{try{await db.exec(`select set_config('t.uid','00000000-0000-0000-0000-00000000000${email==='g@x'?1:2}',false),set_config('t.email','${email}',false)`);await db.query(sql,params);return 'ok'}catch(e){return e.message}};
    const L=async()=>JSON.parse(JSON.stringify((await db.query(`select data from docs where path='lotes/1-1'`)).rows[0].data));
    let x=await como('e@x',`update docs set data=data||'{"cancelado":{"ts":1}}' where path='pedidos/1'`);ok(/gestão cancela/.test(x),'banco: Escritório não cancela pedido (padrão) '+x);
    x=await como('e@x',`update docs set data=data||'{"concluido":1}' where path='pedidos/1'`);ok(x==='ok','banco: Escritório entrega pedido (padrão)');
    x=await como('e@x',`update docs set data=data||'{"permissoes":{"cancelar":true}}' where path='config/main'`);ok(/gestão muda/.test(x),'banco: Escritório não muda as permissões');
    let l=await L();l.steps.a.fim=velho+60e3;x=await como('e@x',`update docs set data=$1 where path='lotes/1-1'`,[JSON.stringify(l)]);ok(/corrige/.test(x),'banco: Escritório não corrige horário de processo antigo '+x);
    l=await L();delete l.steps.c;x=await como('e@x',`update docs set data=$1 where path='lotes/1-1'`,[JSON.stringify(l)]);ok(/começado/.test(x),'banco: Escritório não cancela começo antigo');
    l=await L();delete l.steps.b;l.steps.f.st='fora';l.steps.d={st:'and',ini:Date.now(),op:'p3'};x=await como('e@x',`update docs set data=$1 where path='lotes/1-1'`,[JSON.stringify(l)]);ok(x==='ok','banco: Desfazer recente, prestador e começar continuam livres');
    x=await como('g@x',`update docs set data=data||'{"permissoes":{"cancelar":true}}' where path='config/main'`);ok(x==='ok','banco: gestão muda as permissões');
    x=await como('e@x',`update docs set data=data||'{"cancelado":{"ts":2}}' where path='pedidos/1'`);ok(x==='ok','banco: com a escolha ligada, Escritório cancela');
    l=await L();l.steps.a.fim=velho+120e3;x=await como('g@x',`update docs set data=$1 where path='lotes/1-1'`,[JSON.stringify(l)]);ok(x==='ok','banco: gestão corrige a produção');
    await db.exec(M('011_permissoes_responsabilidade.sql'));ok(true,'banco: a migração roda de novo sem quebrar');
    await db.close()}
  console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
