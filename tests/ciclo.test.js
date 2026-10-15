// Teste: Painel do gestor › Ciclo (tempo médio por fase, em dias úteis, e pedido por pedido).
// Rodar: NODE_PATH=$(npm root -g) node tests/ciclo.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map();
async function dbop(o,p,data){if(o==='get')return {data:store.get(p)||null};if(o==='list')return [...store.entries()].filter(([k])=>k.split('/')[0]===p).map(([k,d])=>({id:k.split('/')[1],data:d}));if(o==='acquire')return {acquired:true};
  if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='delete')store.delete(p);return {}}
(async()=>{const b=await chromium.launch();const fake=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');const erros=[];
  const ctx=await b.newContext({viewport:{width:1000,height:900}});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fake);
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helena@exemplo.test'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await A.goto(APP);await A.waitForTimeout(1500);await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});

  console.log('1) Dias úteis');
  let r=await A.evaluate(()=>({sexSeg:diasUteis(new Date(2026,9,16,12).getTime(),new Date(2026,9,19,12).getTime()),meio:diasUteis(new Date(2026,9,14,8).getTime(),new Date(2026,9,14,20).getTime())}));
  ok(Math.abs(r.sexSeg-1)<0.01,'de sexta meio-dia a segunda meio-dia conta 1 dia útil (pula o fim de semana)');ok(Math.abs(r.meio-0.5)<0.01,'12 horas num dia útil contam meio dia');

  console.log('2) Fases de um pedido feito do começo ao fim');
  r=await A.evaluate(()=>{const D=864e5,t0=new Date(2026,8,1,9).getTime();const ped=state.pedidos.find(p=>!p.concluido&&!p.cancelado);const ls=lotesDe(ped.id).filter(l=>!l.rework);
    ped.chegada=t0;ped.criado={ts:t0+D};ped.insOk=t0+3*D;delete ped.fonte;ped.marcos={};
    const grp=s=>s.pers?'pers':(tipo(s.posto)?.grupo||'');const fimDe={corte:t0+3*D+5*36e5,pers:t0+7*D,costura:t0+9*D,acab:t0+10*D};
    ls.forEach(l=>rp(l).steps.forEach(s=>{const g=grp(s);l.steps[s.id]={st:'ok',ini:fimDe[g]-3600e3,fim:fimDe[g]||t0+4*D}}));ped.concluido=t0+10*D;
    const c=cicloPed(ped);save();const M=ped.marcos;return {k:Object.fromEntries(Object.entries(c).map(([k,v])=>[k,v.d!=null?+v.d.toFixed(2):v.na?'na':null])),temPers:ls.some(l=>rp(l).steps.some(s=>s.pers)),
      corte:{fila:+c.corte.fila.toFixed(3),trab:+c.corte.trab.toFixed(3)},gravou:!!(M.corte&&M.corte.lib===t0+3*D&&M.corte.fim===t0+3*D+5*36e5&&M.cost&&M.cost.lib)}});
  ok(r.k.desp>0&&r.k.ins>0&&r.k.corte>0&&r.k.cost>0&&r.k.emb>0,'cada fase tem a sua duração: '+JSON.stringify(r.k));
  ok(r.temPers?r.k.pers>0:r.k.pers==='na','personalização conta só se o pedido tem personalização');
  ok(r.corte.fila>0&&r.corte.trab>0&&r.corte.trab<r.corte.fila,'corte separa fila (de liberado até começar) e trabalho (de começar até terminar): '+JSON.stringify(r.corte));
  ok(r.gravou,'os marcos (liberada, começou, terminou) ficam gravados no pedido');

  console.log('3) Tela do painel');
  await A.evaluate(()=>{ui.sheet=null;ui.tela='gestor';ui.gt='ciclo';ui.gc='tudo';render()});await A.waitForTimeout(300);
  r=await A.evaluate(()=>({barras:document.querySelectorAll('.cb').length,nomes:[...document.querySelectorAll('.cb-t b')].map(x=>x.textContent),gar:document.querySelector('.ciclo-gar')?.textContent||'',lista:document.querySelectorAll('.cp').length,tab:document.querySelector('.cp .cp-tab tr:nth-child(2)')?.textContent||''}));
  ok(r.barras===6&&r.nomes.join('|')==='Despacho para produção|Insumos e compras|Corte|Personalização|Costura|Embalagem','as 6 fases, na ordem');
  ok(/Maior gargalo agora/.test(r.gar),'aponta o maior gargalo');ok(r.lista>0&&/Despacho/.test(r.tab),'lista pedido por pedido, com a tabela de datas');

  console.log('4) Data dos insumos prontos');
  r=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido&&!x.cancelado&&(x.materiais||[]).length&&x.materiais.some(m=>!m.conf));delete p.insOk;p.materiais.forEach(m=>{m.conf=true;m.st='ok'});save();const a=!!p.insOk;p.materiais[0].conf=false;save();return {marcou:a,tirou:!p.insOk}});
  ok(r.marcou,'quando todos os insumos ficam prontos, guarda a data');
  ok(r.tirou,'se algum volta a faltar, a data sai');
  r=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido&&!x.cancelado&&(x.materiais||[]).length);const m=p.materiais[0];['tConf','tFalta','tComprado','tChegou'].forEach(k=>delete m[k]);m.conf=true;m.st='comprar';save();A.comprei({id:p.id,k:'0'});A.chegou({id:p.id,k:'0'});return ['tConf','tFalta','tComprado','tChegou'].map(k=>!!m[k])});
  ok(r.every(Boolean),'cada insumo guarda quando foi conferido, quando faltou, quando foi comprado e quando chegou');
  ok(await A.evaluate(()=>ajBusca('gargalo tempo de cada etapa')[0]?.f.q==='Como vejo quanto tempo os pedidos ficam em cada etapa?'),'"gargalo tempo de cada etapa" acha a resposta certa');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros[0]:''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
