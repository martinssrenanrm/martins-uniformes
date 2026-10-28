// Teste: pedido da Martins de 28/10. Na máquina, "Mais opções": passar o trabalho para outra pessoa que sabe fazer,
// ou mandar a etapa para um terceirizado, que segue o caminho de sempre (para levar, Levei, Chegou).
// Rodar: NODE_PATH=$(npm root -g) node tests/terc-pessoa.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:820,height:1100}});A.on('pageerror',e=>erros.push(e.message));
  await A.clock.install({time:new Date('2026-10-14T15:30:00')});
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.inicio=null;
    state.pedidos.forEach(p=>{p.vias=true;p.arte=true;p.artePrep=true;p.materiais.forEach(m=>{m.conf=true;m.st='ok'})});RC={};
    if(!state.forn.some(f=>faseT(f.servico)==='costura')){const t=state.tipos.find(x=>x.externo&&faseG(x.grupo)==='costura')||state.tipos.find(x=>x.externo);state.forn.push({id:'ffac',nome:'Facção Teste',servico:t.id,prazo:4,leva:state.pessoas[0].id})}render()});
  console.log('1) Passar para outra pessoa');
  let r=await A.evaluate(()=>{const P=plano();const m=Object.keys(P.uso).find(k=>{const t=P.uso[k];return !t.pai&&!(t.grupo||[]).length&&aptos(unidade(k).tipo).some(p=>p.id!==t.x.op&&!P.ocup.has(p.id))});
    if(!m){const u=unidades().find(x=>{if(P.uso[x.id]||!opcoesTipo(x.tipo).pr.length)return false;const ap=aptos(x.tipo).filter(p=>!P.ocup.has(p.id));return ap.length>=2});ui.sheet={t:'maq',m:u.id};render();document.querySelector('#sheet [data-a=comecar]').click();return {m:u.id}}return {m}});
  r=await A.evaluate(m=>{ui.sheet={t:'maq',m};ui.blk={['maqmais'+m]:true};render();const t=plano().uso[m];const de=t.x.op;const bt=[...document.querySelectorAll('#sheet [data-a=passarPessoa]')].find(b=>!b.disabled);if(!bt)return {sem:1};const para=bt.dataset.p;bt.click();
    const t2=plano().uso[m];return {de,para,agora:t2&&t2.x.op,mesma:!!t2&&t2.s.id===t.s.id,m}},r.m);
  ok(!r.sem,'"Mais opções" mostra quem mais sabe fazer o processo');
  ok(r.agora===r.para&&r.para!==r.de&&r.mesma,'o trabalho passa para a outra pessoa, na mesma máquina');
  console.log('2) Mandar para um terceirizado');
  r=await A.evaluate(m=>{ui.sheet={t:'maq',m};ui.blk={['maqmais'+m]:true};render();const t=plano().uso[m];const l=t.l,sid=t.s.id;const bt=document.querySelector('#sheet [data-a=tercAbre]');if(!bt)return {semBt:1};bt.click();
    const tela=document.getElementById('sheet').innerText;const f=document.querySelector('#sheet [data-a=tercOk]');const fid=f.dataset.f;f.click();
    RC={};const z=sMap(rp(l))[sid];const livre=!plano().uso[m];const tar=tarefasEsc().find(x=>x.a==='levei'&&x.l===l.id&&x.s===sid);const naMaq=opcoesTipo(unidade(m).tipo).pr.some(it=>it.l.id===l.id&&it.s.id===sid);
    ui.sheet=null;A.fz({v:'fora'});const lev=!!document.querySelector(`.forn[data-forn="${fid}"] [data-a=levei][data-l="${l.id}"][data-s="${sid}"]`);
    A.levei({l:l.id,s:sid,id:l.ped});const fora=stOf(l,sid).st==='fora'&&stOf(l,sid).forn===fid;A.buscou({l:l.id,s:sid});const feita=done(l,sid);
    const prox=rp(l).steps.filter(y=>y.deps.includes(sid));const libera=prox.some(y=>ready(l,y,pedById(l.ped)))||!prox.length||prox.every(y=>y.deps.some(d=>!done(l,d)));
    return {tela:/Fora › para levar/.test(tela),ext:isExt(z),livre,tar:!!tar,tarF:tar&&tar.forn&&tar.forn.id===fid,naMaq,lev,fora,feita,libera}},r.m);
  ok(!r.semBt&&r.tela,'"Mandar para um terceirizado" abre a lista de fornecedores e explica o caminho');
  ok(r.ext&&r.livre&&!r.naMaq,'a etapa sai da máquina (que fica livre) e não volta para a fila das máquinas');
  ok(r.tar&&r.tarF&&r.lev,'aparece para levar ao fornecedor escolhido (Escritório e Fora)');
  ok(r.fora&&r.feita&&r.libera,'segue o caminho de sempre: Levei, Chegou e a próxima etapa libera');
  console.log('3) Máquina parada e voltar para a fábrica');
  r=await A.evaluate(()=>{const u=unidades().find(x=>{if(plano().uso[x.id]||!opcoesTipo(x.tipo).pr.length)return false;ui.sheet={t:'maq',m:x.id};render();return !!document.querySelector('#sheet [data-a=tercAbre]')});if(!u)return {sem:1};
    const bt=document.querySelector('#sheet [data-a=tercAbre]');const l=lote(bt.dataset.l),sid=bt.dataset.s;bt.click();document.querySelector('#sheet [data-a=tercOk]').click();const foi=!!(l.terc&&l.terc[sid]);
    A.etEd({l:l.id,s:sid});const tem=!!document.querySelector('#sheet [data-a=tercVolta]');A.tercVolta({l:l.id,s:sid});RC={};return {foi,tem,volta:!(l.terc&&l.terc[sid])&&!isExt(sMap(rp(l))[sid])}});
  ok(!r.sem&&r.foi,'máquina parada: também dá para mandar o trabalho escolhido para um terceirizado');
  ok(r.tem&&r.volta,'em Corrigir, a etapa pode voltar a ser feita na fábrica');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
