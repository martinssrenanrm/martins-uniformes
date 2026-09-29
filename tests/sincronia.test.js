// Teste de regressão: todos os aparelhos veem os mesmos dados, sempre.
// Rodar: NODE_PATH=$(npm root -g) node tests/sincronia.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map(),pages=[];
const merge=(a,b)=>{for(const k of Object.keys(b)){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k]}return a};
const list=c=>[...store.entries()].filter(([p])=>p.split('/').length===2&&p.split('/')[0]===c).map(([p,d])=>({id:p.split('/')[1],data:d}));
async function bc(c){for(const p of pages)await p.evaluate(([c,d])=>window.__push&&window.__push(c,d),[c,list(c)]).catch(()=>{})}
const dbop=modo=>async(o,p,data)=>{if(o==='get')return {data:store.get(p)||null};if(o==='list')return list(p);if(o==='acquire')return {acquired:true};
  if(modo==='ler')return {err:'invalid_argument'};
  const c=p.split('/')[0];if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='update'){if(!store.has(p))return {err:'invalid_argument'};merge(store.get(p),data)}if(o==='delete')store.delete(p);setTimeout(()=>bc(c),10);return {}};
(async()=>{const b=await chromium.launch();const fake=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');const erros=[];
  async function aparelho(n,{modo='ok',sessao='u-helena',semDb=false,local=null}={}){const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.exposeFunction('__dbop',dbop(modo));await ctx.addInitScript(fake);
    if(semDb)await ctx.addInitScript(()=>{window.claude={use:async()=>null}});
    await ctx.addInitScript(([s,l])=>{try{if(s&&!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:s,email:s==='u-helena'?'helenanenimga67@gmail.com':'roger@martinsuniformes.com.br'}));if(l&&!localStorage.getItem('martins-v8'))localStorage.setItem('martins-v8',l)}catch(e){}},[sessao,local]);
    const p=await ctx.newPage();p.on('pageerror',e=>erros.push(n+': '+e.message));pages.push(p);await p.goto(APP);await p.waitForTimeout(1500);await p.evaluate(()=>{ui.sheet=null;render()});return p}
  console.log('1) Aparelho principal começa a nuvem e a Helena cria a senha');
  const A=await aparelho('A');await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);
  await A.evaluate(async()=>{const u=state.usuarios.find(x=>x.id==='u-helena');u.salt=novoSalt();u.hash=await hashSenha('martins123',u.salt);save()});await A.waitForTimeout(1500);
  ok(!!store.get('usuarios/u-helena')?.hash,'senha da Helena está na nuvem');
  const localVelho=await A.evaluate(()=>{const s=JSON.parse(JSON.stringify(state));s.usuarios.forEach(u=>{u.hash=null;u.salt=null});s.pedidos.push({...s.pedidos[0],id:'7777',cliente:'Pedido Só Do Celular'});return JSON.stringify(s)});

  console.log('2) Celular com cópia antiga guardada (caso da Helena)');
  const C=await aparelho('C',{sessao:null,local:localVelho});
  ok(await C.evaluate(()=>!!document.getElementById('lgS')&&!document.getElementById('lgS1')),'login pede a SENHA (não pede para criar de novo)');
  await C.fill('#lgE','helenanenimga67@gmail.com');await C.fill('#lgS','martins123');await C.click('[data-a=lgEntrar]');await C.waitForTimeout(1200);
  ok(await C.evaluate(()=>!!usuarioAtual()),'Helena entra com a senha que já tinha');
  ok(await C.evaluate(()=>!!soAqui()&&soAqui().pedidos.some(p=>p.id==='7777')),'pedido que só existia no celular foi guardado para enviar');
  ok(await C.evaluate(()=>!pedById('7777')),'a tela mostra só o que está na nuvem');
  await C.evaluate(()=>{ui.tela='fabrica';render()});ok(await C.$('[data-a=soAquiEnviar]')!==null,'aparece o aviso para enviar o pedido esquecido');
  await C.click('[data-a=soAquiEnviar]');await C.waitForTimeout(1500);ok(list('pedidos').some(x=>x.data.cliente==='Pedido Só Do Celular'),'pedido esquecido chegou na nuvem');
  ok(await A.evaluate(()=>state.pedidos.some(p=>p.cliente==='Pedido Só Do Celular')),'e aparece no outro aparelho');

  console.log('3) Aparelho sem nuvem não abre dados separados');
  const S=await aparelho('S',{semDb:true});
  ok(await S.evaluate(()=>/não está ligado à nuvem/.test(document.body.innerText)&&!document.querySelector('.ped-l')),'mostra "não está ligado à nuvem" e nenhum dado');

  console.log('4) Acesso só de leitura não finge que salvou');
  const L=await aparelho('L',{modo:'ler'});const antes=list('pedidos').length;
  ok(await L.evaluate(()=>state.pedidos.length>0),'vê os pedidos da nuvem');
  await L.evaluate(()=>{snap();state.pedidos.push({...state.pedidos[0],id:'8888',cliente:'Não pode salvar'});save()});await L.waitForTimeout(1500);
  ok(list('pedidos').length===antes,'nada novo na nuvem');ok(await L.evaluate(()=>!pedById('8888')),'a tela volta ao que está na nuvem');
  ok(await L.evaluate(()=>/só pode ver|Só leitura/.test(document.body.innerText)),'avisa que este acesso só pode ver');

  console.log('5) Celular que dormiu confere de novo ao voltar');
  const r=list('pedidos')[0];store.get('pedidos/'+r.id).cliente='Mudou Sem Aviso';
  await C.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await C.waitForTimeout(1500);
  ok(await C.evaluate(id=>pedById(id).cliente==='Mudou Sem Aviso',r.id),'dados atualizados ao voltar para o app');

  console.log('6) Escritório por setor e responsáveis');
  const T=await A.evaluate(()=>tarefasEsc().map(t=>({f:t.f,r:t.resp,c:t.como})));
  ok(T.filter(t=>t.f==='comprar'||t.f==='levar').every(t=>t.r==='roger'),'compras e buscar/levar no terceiro vão para o Roger');
  ok(T.every(t=>t.r),'toda tarefa tem responsável');
  await A.evaluate(()=>{state.pessoas.forEach(p=>{p.funcoes=(p.funcoes||[]).filter(f=>f!=='vias')});save()});await A.waitForTimeout(800);
  const vias=await A.evaluate(()=>tarefasEsc().filter(t=>t.f==='vias').map(t=>[t.resp,t.como]));
  ok(vias.length&&vias.every(([r,c])=>r&&c==='reserva'),'sem ninguém com a função, vai para a gestão');
  await A.evaluate(()=>{ui.sheet=null;ui.tela='fabrica';ui.fz='esc';render()});
  ok(await A.evaluate(()=>['Pedidos','Artes','Lista de compras','Logística'].every(n=>[...document.querySelectorAll('.setor-t b')].some(b=>b.textContent===n))),'Escritório mostra os setores');

  console.log('7) Aviso de pedido novo para a Helena');
  const R=await aparelho('R',{sessao:'u-roger'});await R.evaluate(()=>{const u=state.usuarios.find(x=>x.id==='u-roger');SESSAO={id:u.id,email:u.email}});
  await R.evaluate(()=>{A.novo();const w=ui.sheet.w;w.cliente='Cliente Aviso';w.vend=state.pessoas[0].id;w.step=2;render();A.wAdd({p:state.produtos[0].id});const it=ui.sheet.w.itens[0];it.cor='Marinho';it.tecido='Malha PV';it.g={M:10};ui.sheet.w.step=3;ui.sheet.w.entrega=Date.now()+20*864e5;A.wCriar()});await R.waitForTimeout(2000);
  const novo=list('pedidos').find(x=>x.data.cliente==='Cliente Aviso');ok(!!novo&&novo.data.criado&&/Roger/.test(novo.data.criado.por||''),'pedido novo guarda quem cadastrou');
  ok(await C.evaluate(()=>avisos().some(p=>p.cliente==='Cliente Aviso')),'Helena recebe o aviso');
  ok(await C.evaluate(()=>{ui.sheet=null;ui.tela='fabrica';render();return document.querySelector('.sino em')?.textContent==='1'}),'sininho com número no alto da tela');
  ok(await R.evaluate(()=>avisos().length===0),'quem não recebe avisos não vê');
  await C.evaluate(id=>A.pedido({id}),novo.id);await C.waitForTimeout(1200);
  ok(!!store.get('pedidos/'+novo.id).vistoPor?.['u-helena'],'abrir o pedido marca como visto na nuvem');
  ok(await A.evaluate(()=>avisos().length===0),'visto em um aparelho, some nos outros');

  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
