// Teste: pausar um processo no meio e retomar depois; dividir um processo entre 2 pessoas.
// Rodar: NODE_PATH=$(npm root -g) node tests/pausar-dividir.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map(),pages=[];
const merge=(a,b)=>{for(const k of Object.keys(b)){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k]}return a};
const list=c=>[...store.entries()].filter(([p])=>p.split('/').length===2&&p.split('/')[0]===c).map(([p,d])=>({id:p.split('/')[1],data:d}));
async function bc(c){for(const p of pages)await p.evaluate(([c,d])=>window.__push&&window.__push(c,d),[c,list(c)]).catch(()=>{})}
async function dbop(o,p,data){if(o==='get')return {data:store.get(p)||null};if(o==='list')return list(p);if(o==='acquire')return {acquired:true};
  const c=p.split('/')[0];if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='update'){if(!store.has(p))return {err:'invalid_argument'};merge(store.get(p),data)}if(o==='delete')store.delete(p);setTimeout(()=>bc(c),10);return {}}
(async()=>{const b=await chromium.launch();const fake=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');const erros=[];
  const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fake);
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helenanenimga67@gmail.com'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));pages.push(A);await A.goto(APP);await A.waitForTimeout(1500);await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});
  // escolhe uma máquina trabalhando que tenha outra máquina do mesmo tipo livre
  const alvo=await A.evaluate(()=>{const P=plano();for(const [m,t] of Object.entries(P.uso)){const tp=unidade(m).tipo;const livres=unidades().filter(u=>u.tipo===tp&&!P.uso[u.id]);const gente=aptos(tp).filter(p=>!P.ocup.has(p.id));if(livres.length&&gente.length&&qtdDe(t)>=20)return {m,m2:livres[0].id,p2:gente[0].id,l:t.l.id,s:t.s.id,op:t.x.op,tot:qtdDe(t)}}return null});
  ok(!!alvo,'achou uma máquina trabalhando com outra livre do mesmo tipo');if(!alvo){await b.close();process.exit(1)}
  console.log('1) Pausar no meio');
  await A.evaluate(m=>A.pausar({m}),alvo.m);await A.fill('#pzN','15');await A.click('[data-a=pzOk]');await A.waitForTimeout(1200);
  let r=await A.evaluate(a=>{const l=lote(a.l),x=l.steps[a.s],P=plano();return {st:x.st,partes:x.partes&&x.partes.map(p=>[p.n,p.st,p.op]),livre:!P.uso[a.m],resta:restante(l,a.s),naFila:prontas().some(it=>it.l.id===a.l&&it.s.id===a.s)}},alvo);
  ok(r.st==='pend'&&r.partes&&r.partes[0][0]===15&&r.partes[0][1]==='ok','registrou 15 prontas e pausou');
  ok(r.livre,'a máquina ficou livre para outro serviço');ok(r.resta===alvo.tot-15&&r.naFila,`o resto (${alvo.tot-15}) voltou para a fila`);
  ok(store.get('pedidos/'+(await A.evaluate(a=>lote(a.l).ped,alvo)))!==undefined&&!!store.get('lotes/'+alvo.l).steps[alvo.s].partes,'pausa salva na nuvem');
  console.log('2) Retomar com outra pessoa em outra máquina');
  await A.evaluate(a=>A.comecar({m:a.m2,l:a.l,s:a.s,p:a.p2}),alvo);await A.waitForTimeout(800);
  r=await A.evaluate(a=>{const P=plano(),t=P.uso[a.m2];return {rod:!!t&&t.x.op===a.p2&&qtdDe(t),st:lote(a.l).steps[a.s].st}},alvo);
  ok(r.rod===alvo.tot-15&&r.st==='and',`retomou as ${alvo.tot-15} que faltavam`);
  await A.evaluate(m=>A.terminou({m}),alvo.m2);await A.waitForTimeout(800);
  r=await A.evaluate(a=>{const x=lote(a.l).steps[a.s];const R=gDados(0).rank,pp=q=>Object.values((R.find(z=>z.p.id===q)||{}).pp||{}).find(e=>e.et===sMap(rp(lote(a.l)))[a.s].nome);return {st:x.st,op1:pp(a.op)?.pecas,op2:pp(a.p2)?.pecas}},alvo);
  ok(r.st==='ok','processo completo quando a última parte termina');ok(r.op1>=15&&r.op2>=alvo.tot-15,`relatório: cada pessoa com as suas peças (${r.op1} e ${r.op2})`);
  console.log('3) Dividir entre 2 pessoas agora');
  const alvo2=await A.evaluate(()=>{const P=plano();for(const [m,t] of Object.entries(P.uso)){const tp=unidade(m).tipo;const livres=unidades().filter(u=>u.tipo===tp&&!P.uso[u.id]);const gente=aptos(tp).filter(p=>!P.ocup.has(p.id));if(livres.length&&gente.length&&qtdDe(t)>=4&&!t.pai)return {m,m2:livres[0].id,p2:gente[0].id,l:t.l.id,s:t.s.id,tot:qtdDe(t)}}return null});
  ok(!!alvo2,'achou outra máquina trabalhando para dividir');
  if(alvo2){await A.evaluate(m=>A.dividir({m}),alvo2.m);await A.fill('#dvN',String(Math.floor(alvo2.tot/2)));await A.evaluate(a=>{A.dvM({v:a.m2});A.dvP({v:a.p2})},alvo2);await A.click('[data-a=dvOk]');await A.waitForTimeout(800);
    r=await A.evaluate(a=>{const P=plano();return {m1:P.uso[a.m]&&qtdDe(P.uso[a.m]),m2:P.uso[a.m2]&&qtdDe(P.uso[a.m2])}},alvo2);
    const h=Math.floor(alvo2.tot/2);ok(r.m1===alvo2.tot-h&&r.m2===h,`duas máquinas trabalhando ao mesmo tempo (${r.m1} + ${r.m2})`);
    await A.evaluate(m=>A.terminou({m}),alvo2.m);await A.waitForTimeout(500);
    ok(await A.evaluate(a=>lote(a.l).steps[a.s].st==='and',alvo2),'com uma parte pronta, o processo continua em andamento');
    await A.evaluate(m=>A.terminou({m}),alvo2.m2);await A.waitForTimeout(500);
    ok(await A.evaluate(a=>lote(a.l).steps[a.s].st==='ok',alvo2),'com as duas prontas, o processo fica completo');}
  console.log('4) Dividir e deixar a outra parte para depois');
  const alvo3=await A.evaluate(()=>{const P=plano();for(const [m,t] of Object.entries(P.uso)){if(qtdDe(t)>=4&&!t.pai)return {m,l:t.l.id,s:t.s.id,tot:qtdDe(t)}}return null});
  if(alvo3){await A.evaluate(m=>A.dividir({m}),alvo3.m);await A.fill('#dvN','2');await A.evaluate(()=>A.dvM({v:'depois'}));await A.click('[data-a=dvOk]');await A.waitForTimeout(600);
    r=await A.evaluate(a=>({rod:qtdDe(plano().uso[a.m]),fila:prontas().some(it=>it.l.id===a.l&&it.s.id===a.s),resta:restante(lote(a.l),a.s)}),alvo3);
    ok(r.rod===alvo3.tot-2&&r.fila&&r.resta===2,'2 peças ficaram na fila para quando uma máquina liberar')}
  await A.evaluate(()=>{ui.sheet=null;ui.tela='fabrica';render()});ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
