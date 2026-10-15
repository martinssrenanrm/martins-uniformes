// Teste: a central "Como usar o app" acha a resposta certa para as perguntas do dia a dia.
// Rodar: NODE_PATH=$(npm root -g) node tests/ajuda.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const CASOS=[['como faço hora extra','hora extra'],['esqueci a senha','Esqueci minha senha'],['onde fica o estoque','Onde fica o estoque'],['como apago um pedido','apagar um pedido'],
 ['mudar costureira de máquina','Galoneira'],['dividir processo pra duas pessoas','divido'],['parar no meio e retomar depois','pauso'],['peça com defeito','conserto'],['levar no terceirizado','Levei peças'],
 ['as peças voltaram da bordadeira','voltaram'],['como coloco a logo','logo'],['como entrego o pedido','entrego'],['cadastrar funcionária nova','pessoa nova'],
 ['como imprimo a ficha','fichas de produção'],['errei o pedido','corrijo'],['cor nova','cor que preciso'],['como dou acesso pra vendedora','acesso'],['backup','cópia de segurança'],
 ['faltou zíper na conferência','Faltou um item'],['comprei o tecido','Comprei'],['sair do app','saio'],['sininho','sininho'],['onde fica na rua','prestador'],['insumos','insumos']];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();await ctx.exposeFunction('__dbop',async o=>o==='list'?[]:o==='get'?{data:null}:{});
  await ctx.addInitScript(fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8'));const p=await ctx.newPage();const er=[];p.on('pageerror',e=>er.push(e.message));
  await p.goto(APP);await p.waitForTimeout(1200);
  const r=await p.evaluate(C=>C.map(([q,esp])=>{const R=ajBusca(q);return [q,esp,R[0]?R[0].f.q:'']}),CASOS);
  r.forEach(([q,esp,top])=>ok(top.toLowerCase().includes(esp.toLowerCase()),`“${q}” → ${top||'(nada)'}`));
  const semIr=await p.evaluate(()=>FAQ.filter(f=>f.ir&&!/^(fab:(maq|fora|esc)|ped|emp|novo|sino|eu|cad:(maquinas|equipe|forn|produtos|estoque|ajustes)(#.+)?|gest:(agora|ciclo|equipe|atrasos|org))$/.test(f.ir)).map(f=>f.q));
  ok(!semIr.length,'todo "Me leve até lá" aponta para um lugar que existe'+(semIr.length?': '+semIr.join(' | '):''));
  ok(!er.length,'sem erros de JavaScript'+(er.length?': '+er.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
