// Teste: reconhecimento do que foi feito (Onda UX 5, 11/2026). Sem ranking, pontos nem medalhas.
// Rodar: NODE_PATH=$(npm root -g) node tests/feito-hoje.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:360,height:640}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios.find(x=>x.perfil==='gestao');SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;ui.tela='hoje';render()});
  let r=await A.evaluate(()=>{const a=sod(now()).getTime();const salvo=JSON.stringify(state.lotes.map(l=>l.steps));
    state.lotes.forEach(l=>Object.values(l.steps).forEach(x=>{if(x.st==='ok'&&x.fim>=a)x.fim=a-3*DIA;(x.partes||[]).forEach(q=>{if(q.st==='ok'&&q.fim>=a)q.fim=a-3*DIA})}));RC={};render();
    const t=document.getElementById('hj-feito').innerText;window.__salvo=salvo;return {t,meta:/da meta/.test(t)}});
  ok(/ainda nada marcado hoje/i.test(r.t)&&!r.meta,'sem nada marcado hoje: diz que aparece conforme marcar, sem meta');
  r=await A.evaluate(()=>{const l=state.lotes.find(l=>{const p=pedById(l.ped);return p&&!p.concluido&&rp(l).steps.some(s=>!isExt(s)&&!isEsc(s)&&stOf(l,s.id).st==='pend')});const s=rp(l).steps.find(s=>!isExt(s)&&!isEsc(s)&&stOf(l,s.id).st==='pend');
    l.steps[s.id]={st:'ok',ini:now()-3600e3,fim:now()-60e3,op:state.pessoas[0].id};RC={};const F=feitoHoje();render();const t=document.getElementById('hj-feito').innerText;
    return {t,proc:F.H.proc,pecas:F.H.pecas,q:qtdEf(l),meta:/da meta/.test(t),alvo:F.alvo,nomes:state.pessoas.filter(p=>t.includes(p.nome)).map(p=>p.nome)}});
  ok(r.proc===1&&r.pecas===r.q&&/1 processo hoje/.test(r.t),'um processo marcado hoje aparece ("'+r.t.split('\n')[0]+'")');
  ok(r.alvo>0?r.meta:!r.meta,'meta do dia da produção aparece quando há pessoas da produção com horário');
  ok(!r.nomes.length,'não cita nem compara pessoas'+(r.nomes.length?': '+r.nomes.join(', '):''));
  ok(!/ponto|medalha|ranking|parab[eé]ns|oba/i.test(r.t),'sem pontos, medalhas nem infantilizar');
  r=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido&&!x.cancelado);p.concluido=now();const F=feitoHoje();render();const t=document.getElementById('hj-feito').innerText;p.concluido=null;return {ent:F.ent,t}});
  ok(r.ent>=1&&/entregues? na semana/.test(r.t),'pedidos entregues na semana aparecem');
  r=await A.evaluate(()=>[...document.querySelectorAll('#app > *')].map(e=>e.id).filter(x=>x==='hj-fila'||x==='hj-feito'));
  ok(r.join()==='hj-fila,hj-feito','o urgente (fila) vem antes do reconhecimento, na faixa verde do fim ('+r.join(', ')+')');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
