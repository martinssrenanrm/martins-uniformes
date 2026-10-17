// Teste: etapas do produto em lista — mudar a ordem, inserir, excluir (pedido da Martins, 17/10).
// Rodar: NODE_PATH=$(npm root -g) node tests/etapas-produto.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:820,height:1100}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  const r=await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;state.lotes=[];
    const valido=p=>p.steps.every((z,i)=>z.deps.every(d=>p.steps.slice(0,i).some(y=>y.id===d)))&&topo(p).length===p.steps.length;
    const p=state.produtos.find(x=>x.steps.length>=8);p.steps=ordemEt(p);const R={nome:p.nome};
    ui.sheet={t:'produto',p:p.id};render();R.linhas=document.querySelectorAll('#sheet .etl-i').length===p.steps.length;
    R.setas=!!document.querySelector('#sheet [data-a=etMov]')&&!!document.querySelector('#sheet [data-a=etRm]')&&!!document.querySelector('#sheet [data-a=addEtapa][data-s]');
    // subir uma etapa que espera a de cima
    const i=p.steps.findIndex((z,k)=>k>=2&&z.deps.length===1&&z.deps[0]===p.steps[k-1].id);const X=p.steps[i],W=p.steps[i-1];
    document.querySelector(`#sheet [data-a=etMov][data-s="${X.id}"][data-d="-1"]`).click();
    R.subiu=p.steps.indexOf(X)===i-1&&W.deps.includes(X.id)&&!X.deps.includes(W.id)&&valido(p);R.subiuTxt=`${X.nome} antes de ${W.nome}`;
    // descer de volta
    A.etMov({p:p.id,s:X.id,d:'1'});R.desceu=p.steps.indexOf(X)===i&&X.deps.includes(W.id)&&valido(p);
    // excluir etapa do meio: quem esperava ela passa a esperar o que ela esperava
    const M=p.steps.find((z,k)=>k>0&&p.steps.some(y=>y.deps.includes(z.id)));const filhos=p.steps.filter(y=>y.deps.includes(M.id));const n0=p.steps.length;
    A.etRm({p:p.id,s:M.id});document.querySelector('[data-a=confSim]')?.click();
    R.exclui=p.steps.length===n0-1&&!sMap(p)[M.id]&&filhos.every(f=>M.deps.every(d=>f.deps.includes(d)))&&valido(p);R.excluiTxt=M.nome;
    // inserir depois de uma etapa
    const Y=p.steps[2],fY=p.steps.filter(z=>z.deps.includes(Y.id));ui.sheet={t:'produto',p:p.id};render();
    document.querySelector(`#sheet [data-a=addEtapa][data-s="${Y.id}"]`).click();document.getElementById('eNome').value='Pregar etiqueta nova';A.eP({v:Y.posto});A.eOk();
    const N=p.steps.find(z=>z.nome==='Pregar etiqueta nova');R.insere=!!N&&p.steps.indexOf(N)===p.steps.indexOf(Y)+1&&N.deps.includes(Y.id)&&fY.every(f=>f.deps.includes(N.id)&&!f.deps.includes(Y.id))&&valido(p);
    // adicionar no fim entra antes do acabamento
    A.addEtapa({p:p.id});document.getElementById('eNome').value='Travete';A.eP({v:Y.posto});A.eOk();const T=p.steps.find(z=>z.nome==='Travete');
    const ac=p.steps.findIndex(z=>faseT(z.posto)==='acab');R.fim=!!T&&(ac<0||p.steps.indexOf(T)<ac)&&valido(p);
    // não exclui etapa em andamento
    const l={id:'tx-1',ped:state.pedidos[0].id,prod:p.id,cor:'Branca',qtd:5,grade:{},steps:{[T.id]:{st:'and',ini:now(),op:'x',maq:'x'}},pers:[],opcoes:[]};state.lotes.push(l);
    A.etRm({p:p.id,s:T.id});R.bloqueia=!!sMap(p)[T.id]&&!document.querySelector('[data-a=confSim]');state.lotes=[];
    // a rota do pedido continua válida
    RC={};R.rota=valido(rota(p,[],[]));return R});
  ok(r.linhas&&r.setas,`${r.nome}: etapas em lista com ↑ ↓, Excluir e Inserir`);
  ok(r.subiu,'↑ sobe a etapa e a de cima passa a esperar ela ('+r.subiuTxt+')');
  ok(r.desceu,'↓ volta como era');
  ok(r.exclui,'Excluir tira a etapa e religa quem vinha depois ('+r.excluiTxt+')');
  ok(r.insere,'Inserir depois desta: entra no meio e o que vinha depois espera a nova');
  ok(r.fim,'Adicionar etapa entra antes do acabamento');
  ok(r.bloqueia,'não deixa excluir etapa que está sendo feita agora');
  ok(r.rota,'roteiro do pedido continua válido');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
