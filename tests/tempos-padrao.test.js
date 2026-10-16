// Teste: tempos padrão calibrados pelo histórico (fase 2).
// Rodar: NODE_PATH=$(npm root -g) node tests/tempos-padrao.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage();A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  let r=await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;
    // monta histórico: 'Pregar mangas' da polo (5 medições a 2× o previsto, 1 absurda)
    const l=state.lotes.find(l=>!l.rework&&rp(l).steps.some(s=>!s.pers&&!isExt(s)&&s.min>0));const s=rp(l).steps.find(s=>!s.pers&&!isExt(s)&&s.min>0);const n=qtdEf(l),T=now();
    const st=etapaProd(l.prod,s.id);const min0=st.min;
    const fake=(mult,k)=>{const L={...l,id:l.id+'-t'+k,steps:{[s.id]:{st:'ok',ini:T-3*DIA,fim:T-2*DIA,op:'ana',util:Math.round(min0*mult*n)}}};state.lotes.push(L)};
    [2,2.1,1.9,2,2.05].forEach(fake);fake(9,'x');RC={};
    const E=calibTempos();const e=E.find(x=>x.k===l.prod+'|'+s.id);
    ui.tela='gestor';ui.gt='org';render();const card=!!document.getElementById('Tempos')&&!!document.querySelector('[data-a=tempoUsar]');
    A.tempoUsar({k:e.k,v:e.real});const depois=etapaProd(l.prod,s.id).min,hist=(state.temposHist||[]).length;
    const some=!calibTempos().some(x=>x.k===e.k);
    return {achou:!!e,n:e&&e.n,r:e&&Math.round(e.r*10)/10,card,depois,real:e&&e.real,min0,hist,some}});
  ok(r.achou&&r.n>=5,'mede a etapa pelas medições ('+r.n+') e descarta a absurda');ok(r.r===2,'real ≈ 2× o cadastrado (mediana)');
  ok(r.card,'aparece no Painel › Organização com "Usar o real"');ok(r.depois===r.real&&r.hist===1,'Usar o real troca o tempo e guarda o histórico');ok(r.some,'depois de ajustado, sai da lista');
  r=await A.evaluate(()=>{const e=calibTempos()[0];if(!e)return {sem:true};A.tempoManter({k:e.k});return {some:!calibTempos().some(x=>x.k===e.k)}});
  ok(r.sem||r.some,'Manter esconde por 30 dias');
  r=await A.evaluate(()=>{const T=now();const l=state.lotes.find(l=>!l.rework);const s=rp(l).steps[0];const base=registroConfiavel();
    state.lotes.push({...l,id:'zz-inst',steps:{[s.id]:{st:'ok',ini:T-1000,fim:T,op:'ana'}}});const dep=registroConfiavel();ui.tela='gestor';ui.gt='org';render();
    return {conta:dep.tot===base.tot+1&&dep.bom===base.bom,tela:/registro está confiável/.test(document.getElementById('app').innerText)}});
  ok(r.conta,'etapa marcada de uma vez (sem duração) não conta como registro confiável');ok(r.tela,'mostra quanto do registro está confiável');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
