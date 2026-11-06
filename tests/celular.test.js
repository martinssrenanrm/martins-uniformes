// Teste: celular primeiro (Onda UX 4, 11/2026): "voltar" do Android (Q5), lembrar a aba (Q6), Desfazer onde faltava (Q4),
// um padrão só de confirmação (Q12).
// Rodar: NODE_PATH=$(npm root -g) node tests/celular.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const ctx=await b.newContext({viewport:{width:360,height:640}});const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  const entra=perfil=>A.evaluate(perfil=>{if(!state.pessoas||!state.pessoas.length){seed();state=normalizar(state)}let u=state.usuarios.find(x=>x.perfil===perfil);
    if(!u){const pe=state.pessoas.find(p=>(p.funcoes||[]).length);u={id:'u-'+perfil,email:perfil+'@exemplo.com',nome:pe.nome,perfil,pessoa:pe.id};state.usuarios.push(u)}
    SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;ui.conf=null;ui.inicio=null;ui.tela='';ui.fz=null;render()},perfil);
  const volta=async()=>{await A.goBack({waitUntil:'commit'}).catch(()=>{});await A.waitForTimeout(250)};
  console.log('1) Voltar do Android');
  await entra('gestao');
  let r=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido);ui.tela='pedidos';render();openSheet({t:'pedido',id:p.id});return ui.sheet&&ui.sheet.t});
  ok(r==='pedido','abri um pedido a partir de Pedidos');
  await volta();r=await A.evaluate(()=>({s:ui.sheet,t:ui.tela,url:location.protocol}));
  ok(!r.s&&r.t==='pedidos','voltar fecha a folha e fica em Pedidos (não sai do app)');
  await volta();r=await A.evaluate(()=>ui.tela);ok(r==='hoje','voltar de novo leva para a primeira tela (Hoje)');
  r=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido);A.desEntregar;pedeConfirma('Teste?','Sim',()=>{});return !!ui.conf});
  await volta();r=await A.evaluate(()=>({c:!!ui.conf,t:ui.tela,u:location.href.startsWith('file:')}));
  ok(!r.c&&r.t==='hoje'&&r.u,'voltar fecha a confirmação sem fazer a ação');
  r=await A.evaluate(()=>{ui.tela='fabrica';render();A.maq({m:unidades()[0].id});return ui.sheet&&ui.sheet.t});
  await volta();r=await A.evaluate(()=>({s:!!ui.sheet,t:ui.tela}));ok(!r.s&&r.t==='fabrica','voltar fecha a folha da máquina e fica na Fábrica');
  r=await A.evaluate(()=>{ui.sheet=null;ui.tela='hoje';render();A.novo();wRead();const w=ui.sheet.w;w.cliente='Cliente de teste';w.step=2;render();return ui.sheet.w.step});
  await volta();r=await A.evaluate(()=>({s:ui.sheet&&ui.sheet.t,st:ui.sheet&&ui.sheet.w&&ui.sheet.w.step,cli:ui.sheet&&ui.sheet.w&&ui.sheet.w.cliente}));
  ok(r.s==='novo'&&r.st===1&&r.cli==='Cliente de teste','no Novo pedido, voltar volta um passo sem perder o que foi escrito');
  await A.evaluate(()=>{ui.sheet=null;render()});
  console.log('2) Lembrar a aba');
  r=await A.evaluate(()=>{try{localStorage.removeItem('fab-zona')}catch(e){}ui.fz=null;ui.tela='fabrica';render();const a=ui.fz;A.fz({v:'fora'});ui.fz=null;render();return {a,b:ui.fz}});
  ok(r.a==='maq'&&r.b==='fora','a Fábrica abre na última aba usada (Máquinas → Na rua)');
  await entra('escritorio');
  r=await A.evaluate(()=>{try{localStorage.removeItem('fab-zona')}catch(e){}ui.fz=null;ui.tela='fabrica';render();return ui.fz});
  ok(r==='esc','na primeira vez, o Escritório abre a Fábrica no Escritório');
  console.log('3) Desfazer onde faltava');
  await entra('gestao');
  r=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido&&!x.cancelado);A.pedCancOk({id:p.id});const temD=!!document.querySelector('#toast [data-a=desfazer]');const canc=!!p.cancelado;A.desfazer();const q=pedById(p.id);return {temD,canc,volta:!q.cancelado}});
  ok(r.temD&&r.canc,'cancelar pedido mostra "Desfazer"');ok(r.volta,'Desfazer volta o pedido para a produção');
  r=await A.evaluate(()=>{const l=state.lotes.find(l=>{const p=pedById(l.ped);return p&&!p.concluido&&(l.pers||[]).length});if(!l)return {sem:1};const p=pedById(l.ped);p.arte=true;const z=rp(l).steps.find(s=>s.pers);if(!z)return {sem:1};
    p.artes=p.artes||{};delete p.artes[l.id+':'+z.id];A.arteEnv({id:p.id,l:l.id,s:z.id});const temD=!!document.querySelector('#toast [data-a=desfazer]');const env=!!(p.artes||{})[l.id+':'+z.id];A.desfazer();const q=pedById(p.id);return {temD,env,volta:!((q.artes||{})[l.id+':'+z.id])}});
  ok(r.sem||r.temD&&r.env&&r.volta,'"Enviei a arte" agora tem Desfazer');
  console.log('4) Uma confirmação só');
  r=await A.evaluate(()=>{const a=(state.arquivos||[]).find(x=>usoArq(x).length);if(!a)return {sem:1};const q=CONF.arqRm({id:a.id});return {q:q&&q[1]}});
  ok(r.sem||r.q==='Sim, tirar','tirar arquivo usado em pedido pede confirmação na tela (não mais "toque de novo")');
  r=await A.evaluate(()=>{const q=CONF.segRest({v:'x'});return q&&q[1]});ok(r==='Sim, restaurar','restaurar cópia pede confirmação na tela');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
