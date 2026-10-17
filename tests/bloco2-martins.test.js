// Teste: pedidos da Martins (16/10) — juntar em qualquer máquina, filtro por cliente na Fábrica, estampa com a peça pronta.
// Rodar: NODE_PATH=$(npm root -g) node tests/bloco2-martins.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:820,height:1100}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;
    state.pedidos.forEach(p=>{p.vias=true;p.arte=true;p.artePrep=true;p.materiais.forEach(m=>{m.conf=true;m.st='ok'})});
    // corte e personalização feitos: a costura tem vários trabalhos prontos
    state.lotes.forEach(l=>{if(l.rework)return;RC={};rp(l).steps.forEach(z=>{if((faseT(z.posto)==='corte'||z.pers)&&stOf(l,z.id).st==='pend')l.steps[z.id]={st:'ok',ini:now()-7200000,fim:now()-3600000,op:'x'}})});
    Object.values(state.atrib||{});state.reservas={};RC={};render()});
  console.log('1) juntar na costura');
  let r=await A.evaluate(()=>{const P=plano();const u=P.us.find(x=>faseT(x.tipo)==='costura'&&!P.uso[x.id]&&opcoesTipo(x.tipo).pr.length>=3);if(!u)return {sem:1};
    // libera quem sabe usar a máquina (os exemplos já deixam todos ocupados)
    Object.keys(P.uso).forEach(m=>{const x=P.uso[m].x;x.st='ok';x.fim=now()});RC={};
    ui.sheet={t:'maq',m:u.id};render();const blk=document.querySelector('#sheet [data-blk^=jout] summary')?.innerText||'';
    const v=document.querySelector('#sheet .junto-outros [data-a=mJunto]')?.dataset.v;if(!v)return {blk,semItem:1};document.querySelector(`#sheet [data-a=mJunto][data-v="${v}"]`).click();
    const btn=document.querySelector('#sheet [data-a=comecar]');const lab=btn.textContent;btn.click();const t=plano().uso[u.id];
    const r={m:u.id,blk,lab,grupo:t&&t.grupo.length,mesmo:t&&[t,...t.grupo].every(g=>g.x.op===t.x.op&&g.x.ini===t.x.ini)};
    ui.sheet={t:'maq',m:u.id};render();r.txt=/Fazendo junto \(2 trabalhos\)/.test(document.getElementById('sheet').innerText);
    t.x.ini-=1800000;t.grupo[0].x.ini-=1800000;A.terminou({m:u.id});r.fim=[t,...t.grupo].every(g=>g.x.st==='ok');r.livre=!plano().uso[u.id];return r});
  ok(!r.sem&&!r.semItem,'máquina de costura mostra "Juntar outros pedidos"'+(r.blk?' ('+r.blk.replace(/\s+/g,' ').trim()+')':''));
  ok(/Começar 2 trabalhos juntos/.test(r.lab||''),'botão mostra "Começar 2 trabalhos juntos"');
  ok(r.grupo===1&&r.mesmo&&r.txt,'os 2 começam juntos, mesma pessoa e hora, e aparecem como "Fazendo junto"');
  ok(r.fim&&r.livre,'um Terminou fecha os 2 e libera a máquina');
  console.log('2) filtro por cliente');
  r=await A.evaluate(()=>{ui.sheet=null;ui.fz='maq';render();const sel=document.getElementById('fCliS');if(!sel)return {sem:1};const ops=[...sel.options].map(o=>o.value).filter(v=>v!=='*');
    const alvo=ops.find(c=>prontas().some(it=>it.ped.cliente===c&&!isExt(it.s)))||ops[0];sel.value=alvo;sel.dispatchEvent(new Event('change',{bubbles:true}));
    const tela=document.getElementById('app')?.innerText||document.body.innerText;const outros=ops.filter(c=>c!==alvo&&c.length>4&&!alvo.includes(c)&&tela.includes(c)&&!document.getElementById('fCliS').innerText.includes(c)===false);
    const cards=[...document.querySelectorAll('[data-a=maqSel]')];const c0=cards.find(c=>!c.disabled);let abre=false;if(c0){c0.click();abre=ui.sheet&&ui.sheet.t==='maq'&&ui.sheet.sel===c0.dataset.v}
    ui.sheet=null;A.fCli({v:'*'});const volta=!ui.fCli&&!!document.querySelector('.grid');return {n:ops.length,alvo,cards:cards.length,grid:0,abre,volta,titulo:tela.includes(alvo)}});
  ok(!r.sem&&r.n>=2,'aparece "Ver só um cliente" com os clientes da fábrica ('+r.n+')');
  ok(r.cards>0&&r.titulo,'mostra só os trabalhos de '+r.alvo+' ('+r.cards+')');
  ok(r.abre,'tocar no trabalho abre a máquina com ele escolhido');
  ok(r.volta,'"Todos os clientes" volta para a tela normal');
  console.log('3) estampa com a peça pronta');
  r=await A.evaluate(()=>{const l=state.lotes.find(x=>!x.rework&&(x.pers||[]).length&&rp(x).steps.some(z=>faseT(z.posto)==='acab'));if(!l)return {sem:1};
    Object.keys(l.steps).forEach(k=>delete l.steps[k]);RC={};const c0=rp(l).steps[0];l.steps[c0.id]={st:'ok',ini:now()-7200000,fim:now()-3600000,op:'x'};RC={};
    const pz=rp(l).steps.find(z=>z.pers),antes=rp(l).steps.filter(z=>!z.pers&&z.deps.includes(pz.id)).map(z=>z.nome);
    A.persFech({l:l.id,s:pz.id,v:'1'});RC={};const R=rp(l),pz2=R.steps.find(z=>z.id===pz.id),ped=pedById(l.ped);
    const cost=R.steps.filter(z=>!z.pers&&faseT(z.posto)!=='acab'&&z.id!==c0.id);
    const naoTrava=cost.every(z=>!z.deps.includes(pz.id)),liberou=antes.length?R.steps.filter(z=>antes.includes(z.nome)).every(z=>z.deps.every(d=>d===c0.id||done(l,d))?ready(l,z,ped):true):true;
    const acab=R.steps.filter(z=>faseT(z.posto)==='acab').some(z=>z.deps.includes(pz.id)),depoisCost=pz2.deps.length&&pz2.deps.every(d=>R.steps.find(y=>y.id===d)&&faseT(R.steps.find(y=>y.id===d).posto)!=='acab');
    A.persFech({l:l.id,s:pz.id,v:'0'});RC={};const volta=rp(l).steps.some(z=>!z.pers&&z.deps.includes(pz.id))===!!antes.length;
    // padrão pela máquina: ligado no cadastro do tipo vale para itens sem escolha
    const x=l.pers.find((y,k)=>(y.id||'pz'+k)===pz.id);delete x.fechada;tipo(x.tipo).fechada=true;RC={};const porTipo=!!rp(l).steps.find(z=>z.id===pz.id).fechada;delete tipo(x.tipo).fechada;RC={};
    return {antes,naoTrava,liberou,acab,depoisCost,volta,porTipo}});
  ok(!r.sem,'achou um pedido com personalização');
  ok(r.naoTrava&&r.liberou,'com a peça pronta, a costura não espera a estampa (antes esperava: '+(r.antes||[]).join(', ')+')');
  ok(r.depoisCost&&r.acab,'a estampa vem depois da costura e antes do acabamento');
  ok(r.volta,'"Antes de costurar" volta como era');
  ok(r.porTipo,'ligar no cadastro da máquina vale como padrão');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
