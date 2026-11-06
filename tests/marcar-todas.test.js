// Teste: "Marcar todas como feitas" em O que foi feito · corrigir (pedido de 06/11/2026).
// Rodar: NODE_PATH=$(npm root -g) node tests/marcar-todas.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:360,height:640}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios.find(x=>x.perfil==='gestao');SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;ui.tela='hoje';render()});
  let r=await A.evaluate(()=>{const l=state.lotes.find(l=>{const p=pedById(l.ped);return p&&!p.concluido&&!p.cancelado&&!l.rework&&etFaltam(l).length>1});
    window.__l=l.id;ui.tela='pedidos';ui.sheet={t:'pedido',id:l.ped};render();
    const and=topo(rp(l)).filter(z=>stOf(l,z.id).st==='and').map(z=>z.id);window.__and=and;
    return {botao:!!document.querySelector(`[data-a=etTodas][data-l="${l.id}"]`),faltam:etFaltam(l).length}});
  ok(r.botao,'gestão vê "Marcar todas como feitas" na peça com '+r.faltam+' etapas faltando');
  r=await A.evaluate(()=>{const l=lote(window.__l),n=etFaltam(l).length;document.querySelector(`[data-a=etTodas][data-l="${l.id}"]`).click();
    const pergunta=!!document.querySelector('[data-a=confSim]');const antes=etFaltam(l).length;document.querySelector('[data-a=confSim]').click();
    const evs=EV.fila.filter(e=>e.lote===l.id&&e.tipo==='etapa.concluida'&&e.dados&&e.dados.todas).length;
    return {n,pergunta,antes,depois:etFaltam(lote(window.__l)).length,evs,andIgual:window.__and.every(s=>stOf(lote(window.__l),s).st==='and'),
      retro:etFaltam(l).length===0&&Object.values(lote(window.__l).steps).filter(x=>x.retro).length>=n}});
  ok(r.pergunta&&r.antes===r.n,'pergunta antes de marcar (nada muda até confirmar)');
  ok(r.depois===0,'depois de confirmar, nenhuma etapa fica em "Ainda não"');
  ok(r.andIgual,'o que está sendo feito agora continua como está');
  ok(r.evs===r.n,'registra um evento etapa.concluida por etapa ('+r.evs+' de '+r.n+')');
  ok(r.retro,'as etapas ficam marcadas como informadas depois');
  r=await A.evaluate(()=>{document.querySelector('#toast [data-a]').click();return etFaltam(lote(window.__l)).length});
  ok(r>1,'Desfazer volta as etapas para "Ainda não"');
  r=await A.evaluate(()=>{const g=state.usuarios.find(x=>x.perfil==='gestao');state.usuarios.push({...g,id:'t-esc',email:'esc@exemplo.test',perfil:'escritorio'});SESSAO={id:'t-esc',email:'esc@exemplo.test'};render();
    const v=!!document.querySelector('[data-a=etTodas]'),p=podeAcao('etTodas');
    SESSAO={id:g.id,email:g.email};A.permTog({v:'corrigirProd'});SESSAO={id:'t-esc',email:'esc@exemplo.test'};ui.sheet={t:'pedido',id:lote(window.__l).ped};render();const v2=!!document.querySelector('[data-a=etTodas]');return {v,p,v2}});
  ok(!r.v&&!r.p,'padrão neutro: Escritório não vê o botão (é de quem corrige a produção)');
  ok(r.v2,'liberando "Corrigir o que a produção já fez", o Escritório vê o botão');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
