// Teste: pedido de 12/11. A ficha de produção não traz mais as etapas; no lugar, o resumo das outras fichas do mesmo pedido.
// Rodar: NODE_PATH=$(npm root -g) node tests/ficha-outras.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:820,height:1100}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  const r=await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.inicio=null;
    const com=state.pedidos.find(p=>gruposFicha(lotesDe(p.id).filter(l=>!l.rework)).length>=2),so=state.pedidos.find(p=>gruposFicha(lotesDe(p.id).filter(l=>!l.rework)).length===1);
    const G=gruposFicha(lotesDe(com.id).filter(l=>!l.rework));const P=paginasDoc({id:com.id,tipo:'prod',vias:1,mocks:false,cinza:{},pb:false});
    const d=document.createElement('div');d.innerHTML=P[0];const cards=[...d.querySelectorAll('.fo-c')].map(c=>c.innerText.replace(/\s+/g,' '));
    const outro=G[1][0],q=G[1].reduce((t,l)=>t+(l.qtd||0),0);
    const P1=so?paginasDoc({id:so.id,tipo:'prod',vias:1,mocks:false,cinza:{},pb:false}):[''];const Pb=paginasDoc({id:com.id,tipo:'prod',vias:1,mocks:false,cinza:{},pb:true});
    return {semEt:!/ETAPAS/.test(P.join(''))&&!/marque ao terminar/.test(P.join('')),tit:/OUTRAS FICHAS DO MESMO PEDIDO/.test(P[0]),n:cards.length,esp:G.length-1,
      card:cards.some(c=>c.includes(nomePeca(outro))&&c.includes(String(q))&&c.includes(outro.cor)),naoEla:!cards.some(c=>c.includes('PEÇA 1 ')),tot:P[0].includes('em '+G.length+' fichas'),
      so:!so||!/OUTRAS FICHAS/.test(P1.join('')),pb:/OUTRAS FICHAS/.test(Pb[0])}});
  ok(r.semEt,'a ficha de produção não traz mais o quadro de etapas');
  ok(r.tit&&r.n===r.esp,'traz "Outras fichas do mesmo pedido" com um cartão para cada outra peça');
  ok(r.card,'cada cartão mostra o nome, a cor e a quantidade da peça');
  ok(r.naoEla,'a própria peça da ficha não se repete no quadro');
  ok(r.tot,'mostra o total do pedido e quantas fichas tem');
  ok(r.so,'pedido de uma peça só não tem o quadro');
  ok(r.pb,'a versão preto e branco também traz o quadro');
  // fichaVias (clientes/<id>.json): quantas vias vêm marcadas ao abrir o PDF de produção
  const v=await A.evaluate(async()=>{const ped=state.pedidos.find(p=>lotesDe(p.id).some(l=>!l.rework));delete CLIENTE.fichaVias;await abreDoc('prod',ped.id);const pad=[ui.sheet.vias,ui.sheet.mocks];
    CLIENTE.fichaVias=1;await abreDoc('prod',ped.id);const um=[ui.sheet.vias,ui.sheet.mocks];const t=document.getElementById('sheet').innerText;delete CLIENTE.fichaVias;ui.sheet=null;return {pad,um,pg:/Baixar PDF/.test(t)}});
  ok(v.pad[0]===2&&v.pad[1]===true,'sem configuração: abre com 1ª e 2ª via e mockups');
  ok(v.um[0]===1&&v.um[1]===true&&v.pg,'fábrica com fichaVias 1: abre com Só 1ª via e Incluir mockups');
  ok(!erros.length,'sem erros na página'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
