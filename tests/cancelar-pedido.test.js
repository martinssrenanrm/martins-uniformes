// Teste: cancelar um pedido (com máquina trabalhando nele) e voltar o pedido depois.
// Rodar: NODE_PATH=$(npm root -g) node tests/cancelar-pedido.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map(),pages=[];
const merge=(a,b)=>{for(const k of Object.keys(b)){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k]}return a};
const list=c=>[...store.entries()].filter(([p])=>p.split('/').length===2&&p.split('/')[0]===c).map(([p,d])=>({id:p.split('/')[1],data:d}));
async function bc(c){for(const p of pages)await p.evaluate(([c,d])=>window.__push&&window.__push(c,d),[c,list(c)]).catch(()=>{})}
async function dbop(o,p,data){if(o==='get')return {data:store.get(p)||null};if(o==='list')return list(p);if(o==='acquire')return {acquired:true};
  const c=p.split('/')[0];if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='update'){if(!store.has(p))return {err:'invalid_argument'};merge(store.get(p),data)}if(o==='delete')store.delete(p);setTimeout(()=>bc(c),10);return {}}
(async()=>{const b=await chromium.launch();const fake=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');const erros=[];
  const ctx=await b.newContext({viewport:{width:360,height:640}});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fake);
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helenanenimga67@gmail.com'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));pages.push(A);await A.goto(APP);await A.waitForTimeout(1500);await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});
  const alvo=await A.evaluate(()=>{const P=plano();for(const [m,t] of Object.entries(P.uso))return {m,ped:t.l.ped,l:t.l.id,s:t.s.id};return null});
  ok(!!alvo,'achou um pedido com máquina trabalhando');if(!alvo){await b.close();process.exit(1)}
  const antes=await A.evaluate(a=>({tarefas:tarefasEsc().filter(t=>t.ped.id===a.ped).length,fila:prontas().filter(it=>it.l.ped===a.ped).length}),alvo);

  console.log('1) Cancelar pelo pedido, com confirmação');
  await A.evaluate(id=>A.pedido({id}),alvo.ped);await A.waitForTimeout(300);
  await A.click('[data-a=pedCancelar]');await A.waitForTimeout(200);
  ok(/Cancelar este pedido\?/.test(await A.textContent('body')),'pede confirmação antes de cancelar');
  await A.click('[data-a=pedCancN]');await A.waitForTimeout(200);
  ok(await A.evaluate(id=>!pedById(id).cancelado,alvo.ped),'tocar em Não não cancela');
  await A.click('[data-a=pedCancelar]');await A.fill('#cancMot','cliente desistiu');await A.click('[data-a=pedCancOk]');await A.waitForTimeout(800);
  let r=await A.evaluate(a=>{const p=pedById(a.ped),P=plano();return {canc:!!p.cancelado,mot:p.cancelado&&p.cancelado.motivo,u:info(p).u,livre:!P.uso[a.m],
    tarefas:tarefasEsc().filter(t=>t.ped.id===a.ped).length,fila:prontas().filter(it=>it.l.ped===a.ped).length,util:(lote(a.l).steps[a.s].partes||[]).some(x=>x.st==='ok'&&x.fim)}},alvo);
  ok(r.canc&&r.mot==='cliente desistiu'&&r.u==='cancel','pedido marcado como Cancelado, com o motivo');
  ok(r.livre,'a máquina que trabalhava nele ficou livre');ok(r.util,'o tempo já trabalhado ficou registrado');
  ok(r.tarefas===0&&r.fila===0,`saiu das tarefas (${antes.tarefas}→0) e da fila (${antes.fila}→0)`);
  ok(/Pedido cancelado/.test(await A.textContent('body')),'o pedido mostra que foi cancelado');
  ok(!!store.get('pedidos/'+alvo.ped).cancelado,'cancelamento salvo na nuvem');

  console.log('2) Aparece em Filtrar › Cancelados e não conta como entregue');
  await A.evaluate(()=>{ui.sheet=null;ui.tela='pedidos';ui.pf={st:'cancel',ord:'urg',q:'',inv:false};render()});await A.waitForTimeout(200);
  ok(await A.evaluate(id=>!!document.querySelector(`#pedLista [data-id="${id}"]`),alvo.ped),'aparece no filtro Cancelados');
  ok(await A.evaluate(id=>!gAtrasos(0).includes('Cancelado')&&state.pedidos.filter(p=>p.concluido&&!p.cancelado).every(p=>p.id!==id),alvo.ped),'não entra na conta de entregues');

  console.log('3) Voltar o pedido para a produção');
  await A.evaluate(id=>A.pedido({id}),alvo.ped);await A.waitForTimeout(300);await A.click('[data-a=pedReativar]');await A.waitForTimeout(600);
  r=await A.evaluate(a=>{const p=pedById(a.ped);return {canc:!!p.cancelado,conc:!!p.concluido,fila:prontas().filter(it=>it.l.ped===a.ped).length}},alvo);
  ok(!r.canc&&!r.conc,'o pedido voltou a ficar aberto');ok(r.fila>0,'o que faltava voltou para a fila');

  console.log('4) Central de dúvidas');
  ok(await A.evaluate(()=>ajBusca('como cancelo um pedido')[0]?.f.q==='Como cancelo um pedido?'),'"como cancelo um pedido" acha a resposta certa');
  ok(await A.evaluate(()=>ajBusca('cliente desistiu')[0]?.f.q==='Como cancelo um pedido?'),'"cliente desistiu" acha a resposta certa');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros[0]:''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
