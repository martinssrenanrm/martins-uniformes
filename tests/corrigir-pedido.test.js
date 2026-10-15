// Teste: pedido lançado pode ser corrigido, sem perder o que a produção já fez.
// Rodar: NODE_PATH=$(npm root -g) node tests/corrigir-pedido.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map(),pages=[];
const merge=(a,b)=>{for(const k of Object.keys(b)){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k]}return a};
const list=c=>[...store.entries()].filter(([p])=>p.split('/').length===2&&p.split('/')[0]===c).map(([p,d])=>({id:p.split('/')[1],data:d}));
async function bc(c){for(const p of pages)await p.evaluate(([c,d])=>window.__push&&window.__push(c,d),[c,list(c)]).catch(()=>{})}
async function dbop(o,p,data){if(o==='get')return {data:store.get(p)||null};if(o==='list')return list(p);if(o==='acquire')return {acquired:true};
  const c=p.split('/')[0];if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='update'){if(!store.has(p))return {err:'invalid_argument'};merge(store.get(p),data)}if(o==='delete')store.delete(p);setTimeout(()=>bc(c),10);return {}}
(async()=>{const b=await chromium.launch();const fake=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');const erros=[];
  async function aparelho(n){const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fake);
    await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helena@exemplo.test'}))}catch(e){}});
    const p=await ctx.newPage();p.on('pageerror',e=>erros.push(n+': '+e.message));pages.push(p);await p.goto(APP);await p.waitForTimeout(1500);await p.evaluate(()=>{ui.sheet=null;render()});return p}
  const A=await aparelho('A');await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});
  console.log('1) Pedido novo, ainda sem produção: corrigir tudo');
  await A.evaluate(()=>{A.novo();const w=ui.sheet.w;w.cliente='Clinica Errada';w.vend=state.pessoas.find(p=>temPapel(p,'vendas')).id;w.step=2;render();A.wAdd({p:'cam-mc'});const it=ui.sheet.w.itens[0];it.cor='Marinho';it.tecido=prod('cam-mc').tecidos[0];it.g={M:10,G:5};ui.sheet.w.step=3;ui.sheet.w.entrega=Date.now()+20*864e5;A.wCriar()});await A.waitForTimeout(1500);
  const id=await A.evaluate(()=>state.pedidos.find(p=>p.cliente==='Clinica Errada').id);
  ok(await A.$('[data-a=pedEditar]')!==null,'pedido aberto tem o botão "Corrigir pedido"');
  await A.click('[data-a=pedEditar]');ok(await A.evaluate(()=>ui.sheet.t==='novo'&&ui.sheet.w.edit)&&await A.inputValue('#wCli')==='Clinica Errada','abre o passo a passo já preenchido');
  await A.fill('#wCli','Clínica Certa');await A.fill('#wFicha','9001');await A.click('[data-a=wNext]');
  await A.evaluate(()=>{const it=ui.sheet.w.itens[0];it.cor='Preto';it.g={M:12,G:5,GG:3};render()});await A.click('[data-a=wNext]');
  const nova=await A.evaluate(()=>{const d=new Date(Date.now()+25*864e5);d.setHours(17,0,0,0);ui.sheet.w.entrega=d.getTime();render();return d.getTime()});await A.click('[data-a=wNext]');
  const lista=await A.evaluate(()=>[...document.querySelectorAll('.mudou li')].map(l=>l.textContent));console.log('    mudanças:',lista.join(' | '));
  ok(lista.some(x=>/Clínica Certa/.test(x))&&lista.some(x=>/Preto/.test(x))&&lista.some(x=>/20 peças/.test(x))&&lista.some(x=>/Entrega/.test(x)),'mostra o que vai mudar antes de salvar');
  await A.click('[data-a=wSalvarEd]');await A.waitForTimeout(1500);
  const P=store.get('pedidos/'+id),L=store.get('lotes/'+id+'-1');
  ok(P.cliente==='Clínica Certa'&&P.ficha==='9001'&&P.entrega===nova,'empresa, ficha e entrega corrigidas na nuvem');
  ok(L.cor==='Preto'&&L.qtd===20&&L.grade.GG===3,'peça corrigida na nuvem (cor e grade)');
  ok(P.materiais.some(m=>/Preto/.test(m.item))&&!P.materiais.some(m=>/Marinho/.test(m.item)),'lista de material recalculada');
  ok(P.edicoes?.length===1&&/Regina/.test(P.edicoes[0].por),'fica registrado quem corrigiu');
  ok(await A.evaluate(()=>ui.sheet.t==='pedido'&&/Corrigido por/.test(document.querySelector('.sheet').innerText)),'volta para o pedido mostrando "Corrigido por"');
  console.log('2) Peça com produção começada: só quantidade e personalização');
  await A.evaluate(i=>{const l=lote(i+'-1');l.steps[rp(l).steps[0].id]={st:'ok',fim:now(),op:'fabio'};save()},id);await A.waitForTimeout(800);
  await A.evaluate(i=>A.pedEditar({id:i}),id);await A.click('[data-a=wNext]');
  ok(await A.evaluate(()=>ui.sheet.w.itens[0].travado&&!document.querySelector('[data-a=wRm]')&&!document.querySelector('[data-a=wCor]')),'peça começada: não deixa trocar cor nem tirar');
  await A.evaluate(()=>{A.wAdd({p:'cam-mc'});const it=ui.sheet.w.itens[1];it.cor='Branco';it.tecido=prod('cam-mc').tecidos[0];it.g={P:4};ui.sheet.w.itens[0].g={M:15,G:5,GG:3};render()});
  await A.click('[data-a=wNext]');await A.click('[data-a=wNext]');await A.click('[data-a=wSalvarEd]');await A.waitForTimeout(1500);
  const L1=store.get('lotes/'+id+'-1'),L2=store.get('lotes/'+id+'-2');
  ok(L1.qtd===23&&Object.keys(L1.steps).length===1,'quantidade mudou e a etapa feita continua marcada');ok(L2&&L2.cor==='Branco'&&L2.qtd===4,'peça nova entrou no pedido');
  const B=await aparelho('B');ok(await B.evaluate(i=>pedById(i).cliente==='Clínica Certa'&&lotesDe(i).length===2,id),'outro aparelho vê a correção');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
