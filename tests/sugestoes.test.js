// Teste: sugestões calculadas pelo próprio app (Onda UX 3, 11/2026). Sem chamar nenhum serviço de fora.
// Cada regra: aparece quando o caso existe, some quando não existe, diz o porquê e leva à ação; o mais urgente vem primeiro.
// Rodar: NODE_PATH=$(npm root -g) node tests/sugestoes.test.js
const { chromium } = require('playwright');const path=require('path'),fs=require('fs');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[],rede=[];const A=await b.newPage({viewport:{width:360,height:640}});A.on('pageerror',e=>erros.push(e.message));
  A.on('request',r=>{if(!/^(file|data|blob):/.test(r.url())&&!/fonts.(googleapis|gstatic).com/.test(r.url()))rede.push(r.url())});
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios.find(x=>x.perfil==='gestao');SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;ui.tela='hoje';render()});
  const sug=g=>A.evaluate(g=>{RC={};const P=plano(),E=tarefasEsc(),u=usuarioAtual();return sugestoes(P,E,u&&u.pessoa,g).map(s=>({k:s.k,peso:s.peso,txt:s.txt,por:s.por,bt:s.bt}))},g);
  console.log('1) Regras');
  let S=await sug(true);const ks=S.map(s=>s.k);
  ok(S.length>0&&S.every(s=>s.txt&&s.por),'com os dados de exemplo há sugestões, cada uma com o porquê ('+ks.join(', ')+')');
  ok(S.every((s,i)=>!i||S[i-1].peso>=s.peso),'o mais urgente vem primeiro');
  ok(S.every(s=>/data-a="/.test(s.bt)||!s.bt),'cada sugestão leva a uma ação');
  // 1: vence esta semana abaixo da metade
  let r=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido&&!x.cancelado&&lotesDe(x.id).some(l=>!loteDone(l))&&info(x).prog<.5);p.entrega=Math.min(fimSemana()-3600e3,Math.max(now()+3600e3,p.entrega));RC={};
    const S=sugestoes(plano(),tarefasEsc(),null,true);const s=S.find(x=>x.k==='semana');return {s:!!s,txt:s&&s.txt,cli:p.cliente,id:p.id,bt:s&&s.bt}});
  ok(r.s&&r.bt.includes(`data-id="${r.id}"`)||r.s&&/data-a="pedido"/.test(r.bt),'pedido que vence esta semana abaixo da metade vira sugestão ("'+r.txt+'")');
  // 2: o mesmo item falta em 2 pedidos
  r=await A.evaluate(()=>{const ps=state.pedidos.filter(x=>!x.concluido&&!x.cancelado).slice(0,2);ps.forEach(p=>{p.materiais=p.materiais||[];p.materiais.push({item:'Zíper de teste 20cm',nec:10,est:0,un:'un',conf:true,st:'comprar'})});RC={};
    const s=sugestoes(plano(),tarefasEsc(),null,true).find(x=>x.k==='falta');ps.forEach(p=>{p.materiais=p.materiais.filter(m=>m.item!=='Zíper de teste 20cm')});RC={};const sem=sugestoes(plano(),tarefasEsc(),null,true).find(x=>x.k==='falta'&&/Zíper de teste/.test(x.txt));
    return {txt:s&&s.txt,bt:s&&s.bt,sem:!!sem}});
  ok(/falta em \d+ pedidos/.test(r.txt||'')&&/data-a="compras"/.test(r.bt||''),'item que falta em 2+ pedidos vira sugestão com a lista de compras ("'+r.txt+'")');
  ok(!r.sem,'resolvida a falta, a sugestão some');
  // 4: próxima máquina
  r=await A.evaluate(()=>{RC={};const P=plano(),M=hojeMaquinas(P);const s=sugestoes(P,tarefasEsc(),null,true).find(x=>x.k==='maq');return {M:M.length,txt:s&&s.txt,m:M[0]&&M[0].m,bt:s&&s.bt}});
  ok(r.M?(r.txt&&r.bt.includes(`data-m="${r.m}"`)):!r.txt,'próximo trabalho para a máquina livre ("'+r.txt+'")');
  // 6: prestador atrasado
  r=await A.evaluate(()=>{const l=state.lotes.find(l=>{const p=pedById(l.ped);return p&&!p.concluido&&rp(l).steps.some(isExt)});if(!l)return {sem:1};const z=rp(l).steps.find(isExt);const f=fornEtapa(l,z)||state.forn[0];
    l.steps[z.id]={st:'fora',forn:f.id,op:f.leva,saiu:now()-30*DIA};RC={};const s=sugestoes(plano(),tarefasEsc(),null,true).find(x=>x.k==='prestador');delete l.steps[z.id];RC={};return {txt:s&&s.txt,bt:s&&s.bt}});
  ok(r.sem||/prazo/.test(r.txt||'')&&/data-v="fora"/.test(r.bt||''),'pacote que passou do prazo no prestador vira sugestão ("'+r.txt+'")');
  // 7: pronto e não entregue
  r=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido&&!x.cancelado&&lotesDe(x.id).length);const salvo=JSON.stringify(lotesDe(p.id).map(l=>l.steps));
    lotesDe(p.id).forEach(l=>rp(l).steps.forEach(z=>{l.steps[z.id]={st:'ok',ini:now()-7200e3,fim:now()-3600e3,op:state.pessoas[0].id}}));RC={};const s=sugestoes(plano(),tarefasEsc(),null,true).find(x=>x.k==='pronto');
    const back=JSON.parse(salvo);lotesDe(p.id).forEach((l,i)=>l.steps=back[i]);RC={};return {txt:s&&s.txt,cli:p.cliente}});
  ok(r.txt&&r.txt.includes(r.cli)||/prontos esperando/.test(r.txt||''),'pedido pronto e não entregue vira sugestão ("'+r.txt+'")');
  console.log('2) Por perfil e na tela');
  S=await sug(false);ok(!S.some(s=>['maq','fila','sempessoa'].includes(s.k)),'Escritório não recebe sugestões de máquina nem de equipe ('+S.map(s=>s.k).join(', ')+')');
  r=await A.evaluate(()=>{ui.sugTodas=false;render();const n=document.querySelectorAll('#hj-sug .hsug').length,tot=sugestoes(plano(),tarefasEsc(),null,true).length,prim=document.querySelector('#app .hj-sec')?.id;
    const bt=document.querySelector('#hj-sug .hsug button[data-a]');const alto=bt?bt.getBoundingClientRect().height:0;const larg=[...document.querySelectorAll('#hj-sug *')].some(e=>e.getBoundingClientRect().right>window.innerWidth+1);
    const txt=document.getElementById('hj-sug').innerText;return {n,tot,prim,alto,larg,ia:/\b(IA|intelig|Claude|algoritmo)/i.test(txt)}});
  ok(r.prim==='hj-sug','as sugestões ficam no alto da tela Hoje');
  ok(r.n===Math.min(3,r.tot),`mostra até 3 (${r.n} de ${r.tot}); o resto em "Ver mais"`);
  ok(r.alto>=48&&!r.larg,'botões com 48px e nada passa de 360px');
  ok(!r.ia,'sem palavras técnicas ("IA", "algoritmo")');
  ok(!rede.length,'nenhuma chamada para fora do aparelho'+(rede.length?': '+rede.slice(0,3).join(' '):''));
  ok(!/fetch\(|XMLHttpRequest/.test(fs.readFileSync(path.join(__dirname,'../app.html'),'utf8').split('/* ================= Sugestões')[1].split('function hojeTopo')[0]),'o código das sugestões não chama a rede');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
