// Teste: vários cortes ao mesmo tempo na mesma mesa, com o mesmo cortador (pedido da Martins, 16/10).
// Rodar: NODE_PATH=$(npm root -g) node tests/cortar-junto.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:820,height:1100}});A.on('pageerror',e=>erros.push(e.message));
  // relógio fixo num dia útil, no meio do expediente: o tempo útil não depende do dia em que o teste roda
  await A.clock.install({time:new Date('2026-10-14T15:30:00')});
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  let r=await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;
    // libera os pedidos para haver vários cortes prontos
    state.pedidos.forEach(p=>{p.vias=true;p.arte=true;p.artePrep=true;p.materiais.forEach(m=>{m.conf=true;m.st='ok'})});RC={};
    const m=unidades().find(x=>faseT(x.tipo)==='corte').id;ui.sheet={t:'maq',m};render();
    const sel=document.querySelector('#sheet [data-a=comecar]');const lid=sel.dataset.l,sid=sel.dataset.s;
    const vs=[...document.querySelectorAll('#sheet [data-a=mJunto]')].slice(0,2).map(c=>c.dataset.v);if(vs.length<2)return {poucos:vs.length};
    vs.forEach(v=>document.querySelector(`#sheet [data-a=mJunto][data-v="${v}"]`).click());const btn=document.querySelector('#sheet [data-a=comecar]');const lab=btn.textContent;btn.click();
    const P=plano(),t=P.uso[m];return {m,lab,grupo:t&&t.grupo.length,mesmo:t&&[t,...t.grupo].every(g=>g.x.op===t.x.op&&g.x.ini===t.x.ini&&g.x.maq===m),lid,sid}});
  ok(!r.poucos,'aparecem cortes para juntar'+(r.poucos!=null?' ('+r.poucos+')':''));
  if(!r.poucos){ok(/Começar 3 cortes juntos/.test(r.lab),'botão mostra "Começar 3 cortes juntos"');ok(r.grupo===2&&r.mesmo,'os 3 cortes começam juntos: mesma mesa, pessoa e hora');
    r=await A.evaluate(m=>{const t=plano().uso[m];const G=[t,...t.grupo];G.forEach(g=>{g.x.ini-=3600000});ui.sheet={t:'maq',m};render();const txt=/Cortando junto \(3 cortes\)/.test(document.getElementById('sheet').innerText);const pausa=!!document.querySelector('#sheet [data-a=pausar]');
      const esp=Math.round(tempoUtil(t.x,now())/MIN);A.terminou({m});const fe=G.every(g=>g.x.st==='ok'&&g.x.fim===G[0].x.fim);const u=G.map(g=>g.x.util),tot=u.reduce((a,b)=>a+b,0);return {txt,pausa,fe,tot,esp,u,livre:!plano().uso[m]}},r.m);
    ok(r.txt&&!r.pausa,'máquina mostra os 3 cortes juntos (sem Pausar/Dividir)');ok(r.fe&&r.livre,'um Terminou fecha os 3 e libera a mesa');ok(r.esp>0&&Math.abs(r.tot-r.esp)<=2&&r.u.every(x=>x>0),`o tempo útil (${r.esp} min) é dividido entre os cortes: `+r.u.join(' + '));}
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
