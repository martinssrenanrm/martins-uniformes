// Teste: registro de eventos (o que aconteceu, quem fez, quando) e correções de segurança dos dados (01/11/2026).
// Rodar: NODE_PATH=$(npm root -g) node tests/eventos.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map(),pages=[];
const merge=(a,b)=>{for(const k of Object.keys(b)){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k]}return a};
const list=c=>[...store.entries()].filter(([p])=>p.split('/').length===2&&p.split('/')[0]===c).map(([p,d])=>({id:p.split('/')[1],data:d}));
async function bc(c){for(const p of pages)await p.evaluate(([c,d])=>window.__push&&window.__push(c,d),[c,list(c)]).catch(()=>{})}
async function dbop(o,p,data){if(o==='get')return {data:store.get(p)||null};if(o==='list')return list(p);if(o==='acquire')return {acquired:true};
  const c=p.split('/')[0];if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='update'){if(!store.has(p))return {err:'invalid_argument'};merge(store.get(p),data)}if(o==='delete')store.delete(p);setTimeout(()=>bc(c),10);return {}}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
(async()=>{const b=await chromium.launch();const fake=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');const erros=[];
  const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fake);
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helena@exemplo.test'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));pages.push(A);await A.goto(APP);await A.waitForTimeout(1500);await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render();EV.fila=[]});

  console.log('1) Produção: passar para outra pessoa, terminar e começar');
  const alvo=await A.evaluate(()=>{const P=plano();for(const [m,t] of Object.entries(P.uso)){if(t.pai||(t.grupo&&t.grupo.length))continue;const tp=unidade(m).tipo;const gente=aptos(tp).filter(p=>!P.ocup.has(p.id)&&p.id!==t.x.op);if(gente.length)return {m,p2:gente[0].id,l:t.l.id,s:t.s.id,op:t.x.op,ped:t.l.ped}}return null});
  ok(!!alvo,'achou uma máquina trabalhando');if(!alvo){await b.close();process.exit(1)}
  let r=await A.evaluate(a=>{EV.acao=evUuid();const ac=EV.acao;A.passarPessoa({m:a.m,p:a.p2});const e=EV.fila.find(x=>x.tipo==='etapa.pessoa_trocada');
    A.terminou({m:a.m});const c=EV.fila.find(x=>x.tipo==='etapa.concluida');const l=lote(a.l),s=sMap(rp(l))[a.s];
    return {e,c,ac,qtd:qtdEf(l),proc:s.nome,padrao:Math.round(s.min*60)}},alvo);
  ok(r.e&&r.e.de===alvo.op&&r.e.para===alvo.p2&&r.e.pessoa===alvo.p2&&r.e.dados&&r.e.dados.dur_ate_aqui>=0,'passar para outra pessoa registra de quem para quem e o tempo até ali');
  ok(r.c&&r.c.pessoa===alvo.p2&&r.c.lote===alvo.l&&r.c.ref===alvo.s&&r.c.ped===alvo.ped&&r.c.q===r.qtd&&r.c.dur>=0,'terminar registra a etapa, a peça, quem fez, quantas peças e quanto tempo');
  ok(r.c&&r.c.dados.proc===r.proc&&r.c.dados.padrao===r.padrao&&!!r.c.dados.maq,'guarda a fotografia da etapa (nome, tempo padrão, máquina): mudar o cadastro depois não muda a métrica');
  ok(r.e&&r.e.acao===r.ac,'cada evento sabe de qual toque veio');
  r=await A.evaluate(()=>{EV.fila=[];const P=plano();for(const [m,pl] of Object.entries(P.plan)){if(!pl||!pl.l||P.uso[m]||!pl.pessoa)continue;A.comecar({m,l:pl.l.id,s:pl.s.id,p:pl.pessoa});return {e:EV.fila.find(x=>x.tipo==='etapa.iniciada'),p:pl.pessoa,l:pl.l.id,s:pl.s.id}}return null});
  ok(r&&r.e&&r.e.pessoa===r.p&&r.e.lote===r.l&&r.e.ref===r.s&&['sugerido','pessoa','outro','fora','reserva'].includes(r.e.dados.modo),'começar registra quem, onde e se seguiu a sugestão do sistema');

  console.log('2) Desfazer não apaga: marca a ação como desfeita');
  r=await A.evaluate(()=>{const p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&(p.materiais||[]).length);const k=0,st0=p.materiais[k].st;EV.acao=evUuid();const ac=EV.acao;A.insMarca({id:p.id,k,m:'falta'});const ev1=EV.fila[EV.fila.length-1];
    EV.acao=evUuid();A.desfazer();const d=EV.fila.filter(x=>x.tipo==='acao.desfeita').pop();return {ac,d,ev1:ev1.id,opVolta:pedById(p.id).materiais[k].st===st0}});
  ok(r&&r.d&&r.d.ref===r.ac&&r.d.dados.ids.length===1&&r.d.dados.ids[0]===r.ev1,'desfazer registra qual ação perdeu o valor (e só ela)');
  ok(r&&r.opVolta,'e o desfazer continua funcionando como antes');

  console.log('3) Insumos e estoque');
  r=await A.evaluate(()=>{EV.fila=[];const p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&(p.materiais||[]).length);const k=p.materiais.findIndex(m=>m.nec>0);const m=p.materiais[k];state.estoque[m.item]=m.nec*3;const e0=state.estoque[m.item];
    A.insMarca({id:p.id,k,m:'tem'});const e1=state.estoque[m.item],b1=p.materiais[k].baixa;const tem=EV.fila.find(x=>x.tipo==='material.do_estoque');
    // corrigir o pedido não pode perder o que saiu do estoque
    ui.sheet={t:'novo',w:wDoPedido(p)};ui.sheet.w.obs=(p.obs||'')+' x';salvarEdicao();const m2=pedById(p.id).materiais.find(x=>x.item===m.item);const baixaDepois=m2.baixa;const ed=EV.fila.find(x=>x.tipo==='pedido.editado');
    const k2=pedById(p.id).materiais.indexOf(m2);A.insMarca({id:p.id,k:k2,m:'tem'});const e2=state.estoque[m.item];
    A.insMarca({id:p.id,k:k2,m:'falta'});const e3=state.estoque[m.item];const fa=EV.fila.find(x=>x.tipo==='material.em_falta');
    A.insMarca({id:p.id,k:k2,m:'comprei'});const co=EV.fila.find(x=>x.tipo==='material.comprado');
    // conferência (Tem / Falta) com a mesma regra do estoque
    pedById(p.id).materiais[k2].st='comprar';ui.sheet={t:'ins',id:p.id};A.insTem({id:p.id,k:k2});const e4=state.estoque[m.item];ui.sheet={t:'ins',id:p.id,falta:k2,fq:'2',fu:m.un};A.insFaltaOk({id:p.id,k:k2});const e5=state.estoque[m.item];
    return {e0,e1,b1,baixaDepois,e2,e3,e4,e5,tem,fa,co,ed,ped:p.id,item:m.item,nec:m.nec}});
  ok(r.e1===r.e0-r.nec&&r.b1===r.nec,'"Já tem" tira do estoque o que o pedido usa');
  ok(r.baixaDepois===r.b1&&r.e2===r.e1,'corrigir o pedido guarda o que já saiu do estoque: "Já tem" de novo não tira duas vezes');
  ok(r.e3===r.e0,'"Em falta" devolve ao estoque o que tinha saído');
  ok(r.e4===r.e0-r.nec&&r.e5===r.e0,'a conferência (Tem / Falta) segue a mesma regra do estoque');
  ok(r.tem&&r.tem.ped===r.ped&&r.tem.ref===r.item&&r.tem.q===r.nec&&r.fa&&r.co&&r.co.dados.libera===1,'cada botão do insumo vira um evento com o pedido, o item e a quantidade');
  ok(r.ed&&Array.isArray(r.ed.dados.mud),'corrigir o pedido registra o que mudou');

  console.log('4) Pedido: entregar, desfazer entrega, conserto');
  r=await A.evaluate(()=>{EV.fila=[];const p=state.pedidos.find(p=>!p.concluido&&!p.cancelado);A.entregar({id:p.id});const en=EV.fila.find(x=>x.tipo==='pedido.entregue');A.desEntregar({id:p.id});const de=EV.fila.find(x=>x.tipo==='pedido.entrega_desfeita');
    const P=plano(),t=Object.entries(P.uso).map(([m,t])=>({m,t})).find(o=>!o.t.pai&&!(o.t.grupo&&o.t.grupo.length)&&topo(o.t.p).some(x=>x.id!==o.t.s.id&&anc(o.t.p,o.t.s.id).has(x.id)&&done(o.t.l,x.id)));let co=null,opOrig=null;
    if(t){const orig=topo(t.t.p).find(x=>x.id!==t.t.s.id&&anc(t.t.p,t.t.s.id).has(x.id)&&done(t.t.l,x.id));opOrig=t.t.l.steps[orig.id]?.op;ui.sheet={t:'prob',m:t.m,step:3,n:2,orig:orig.id,mot:state.probs[0].k};A.pOk();co=EV.fila.find(x=>x.tipo==='conserto.aberto')}
    return {en,de,co,opOrig,ped:p.id}});
  ok(r.en&&r.en.ped===r.ped&&r.en.q>0&&r.en.dados.prazo,'entregar registra o pedido, as peças e o prazo prometido');
  ok(r.de&&r.de.de,'desfazer a entrega registra a data que valia');
  ok(r.co&&r.co.q===2&&r.co.dados.motivo&&r.co.dados.pessoa_origem===r.opOrig,'conserto registra o motivo e quem fez a etapa de origem (não só quem achou)');

  console.log('5) Formato dos eventos');
  r=await A.evaluate(()=>{const todos=EV.fila;const fora=[...new Set(todos.map(e=>e.tipo).filter(t=>!EV_TIPOS[t]))];
    const ruins=todos.filter(e=>!e.id||!e.ts||!e.reg||!e.tipo||!e.dv||!e.usuario);return {n:todos.length,fora,ruins:ruins.length,ex:ruins[0]||todos[0],uuid:todos.every(e=>/^[0-9a-f-]{36}$/.test(e.id)),ids:new Set(todos.map(e=>e.id)).size===todos.length}});
  ok(r.fora.length===0,'todo evento usa um nome do catálogo'+(r.fora.length?': '+r.fora.join(', '):''));
  ok(r.n>=3&&r.ruins===0&&r.uuid&&r.ids,'todo evento tem id único, hora, quem estava com o app e o aparelho'+(r.ruins?' '+JSON.stringify(r.ex):''));
  await A.waitForTimeout(600);
  r=await A.evaluate(()=>{const f=JSON.parse(localStorage.getItem('ev-fila')||'[]');ui.sheet=null;ui.tela='pedidos';render();ui.tela='fabrica';ui.fz='esc';render();return {fila:f.length,uso:Object.keys(EV.uso).some(k=>k.endsWith('|pedidos'))&&Object.keys(EV.uso).some(k=>k.endsWith('|fabrica/esc'))}});
  ok(r.fila>0,'a fila fica guardada no aparelho até subir para o banco');
  ok(r.uso,'conta as telas usadas (só a contagem por dia)');

  console.log('6) Segurança dos dados');
  r=await A.evaluate(()=>{const p0=state.produtos[0];state.produtos.push({...JSON.parse(JSON.stringify(p0)),id:'pVelho',nome:'Produto que saiu de linha'});
    const ped0=state.pedidos[0];state.pedidos.push({...JSON.parse(JSON.stringify(ped0)),id:'88888',concluido:now()-30*DIA,cancelado:null});
    const l0=state.lotes.find(l=>l.ped===ped0.id);state.lotes.push({...JSON.parse(JSON.stringify(l0)),id:'88888-1',ped:'88888',prod:'pVelho',steps:{},rework:false,parent:null});RC={};save();
    let erro=null;try{A.rmProd({p:'pVelho'})}catch(e){erro=e.message}const ficou=!!prod('pVelho');let erroR=null;try{ui.tela='gestor';render();ui.tela='pedidos';render()}catch(e){erroR=e.message}
    const semRota=rota(undefined);return {erro,ficou,erroR,semRota:Array.isArray(semRota)&&semRota.length===0}});
  ok(!r.erro&&r.ficou&&!r.erroR,'produto que aparece em pedido entregue não pode ser apagado (o app não trava)');
  ok(r.semRota,'peça de produto que não existe mais não derruba o app');
  r=await A.evaluate(()=>{const s={clientes:[{id:'c1',nome:'Academia Pulse',cnpj:'11.111.111/0001-11'},{id:'c2',nome:'Academia Pulse',cnpj:'22.222.222/0001-22'},{id:'c3',nome:'Academia Pulse',cnpj:''}],pedidos:[{id:'1',cli:'c1'},{id:'2',cli:'c2'}],arquivos:[]};
    juntaClientes(s);const sobram=s.clientes.map(c=>c.id).sort();
    const s2={lotes:[{id:'9-1',ped:'9',prod:'x',cor:'Azul',mock:'data:image/jpeg;base64,AAAA'}],pedidos:[{id:'9',cli:'c9'}],produtos:[],arquivos:[]};const s3=JSON.parse(JSON.stringify(s2));
    mockNaBib(s2);mockNaBib(s3);mockNaBib(s2);
    const dup={arquivos:[{id:'a1',cli:'c',tipo:'mockup',bin:'5-1',ts:1},{id:'a2',cli:'c',tipo:'mockup',bin:'5-1',ts:2},{id:'a3',cli:'c',tipo:'mockup',bin:'5-2',ts:3}],lotes:[{id:'5-1',mockArq:'a2'},{id:'5-3',mockArq:'a1'}],pedidos:[{id:'5',anexos:['a1','a3']}]};
    MIGRACOES.find(m=>m.v===14).fn(dup);
    return {sobram,ids:[s2.arquivos.map(a=>a.id),s3.arquivos.map(a=>a.id)],nArq:s2.arquivos.length,dup:dup.arquivos.map(a=>a.id).sort(),mockArq:dup.lotes.map(l=>l.mockArq),anexos:dup.pedidos[0].anexos}});
  ok(r.sobram.join()==='c1,c2','empresas com o mesmo nome e CNPJ diferente não são juntadas (a sem CNPJ entra na primeira)');
  ok(r.nArq===1&&r.ids[0][0]===r.ids[1][0]&&r.ids[0][0]==='mk-9-1','mockup na biblioteca da empresa tem id fixo: aparelhos diferentes não criam cópias');
  ok(r.dup.length===2&&r.dup.includes('a3')&&r.mockArq[0]===r.mockArq[1]&&r.dup.includes(r.mockArq[0])&&r.anexos.join()===[r.mockArq[0],'a3'].join(),'os mockups repetidos que já existiam viram um só, sem perder as ligações');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
