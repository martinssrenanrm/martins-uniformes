// Teste: instalação de um cliente novo não carrega nada da Martins (acessos, fotos, dados fixos)
// e o que a fábrica apaga não volta sozinho.
// Rodar: NODE_PATH=$(npm root -g) node tests/cliente-novo.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const src=fs.readFileSync(path.resolve(__dirname,'../app.html'),'utf8');
  console.log('1) O código não traz dados da Martins');
  ok(!/helenanenimga|martinsuniformes|@gmail\.com/i.test(src),'nenhum e-mail real no código');
  ok(!/FOTOS0|aplicaFotos|EXEMPLO_IDS|NOMES_V1|USER_ROGER/.test(src),'sem fotos da equipe, sem lista fixa de exemplos, sem acessos fixos');
  const norm=src.slice(src.indexOf('function normalizar('),src.indexOf('const nCli='));
  ok(norm.length>100&&!/helena|roger|alexandra|layara|laiara|rafael|'0402'|Gola polo Marinho/i.test(norm),'as migrações não citam pessoas, pedidos ou estoque da Martins');

  const b=await chromium.launch();const erros=[];
  const ctx=await b.newContext({viewport:{width:1000,height:900}});
  await ctx.addInitScript(()=>{window.CLIENTE={id:'nova',nome:'Confecção Nova',admins:[{id:'u-ana',email:'ana@nova.test',nome:'Ana'}]};
    try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-ana',email:'ana@nova.test'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await A.goto(APP);await A.waitForTimeout(1500);
  console.log('2) Acessos vêm só da configuração do cliente');
  let r=await A.evaluate(()=>({us:state.usuarios.map(u=>u.email),av:state.avisarNovos,fotos:state.pessoas.filter(p=>p.foto).length}));
  ok(r.us.length===1&&r.us[0]==='ana@nova.test','só o administrador do cliente tem acesso');
  ok(JSON.stringify(r.av)==='["u-ana"]','aviso de pedido novo vai para o administrador do cliente');
  ok(r.fotos===0,'ninguém ganha foto de outra fábrica');
  console.log('3) O que a fábrica apaga não volta');
  r=await A.evaluate(()=>{state.pedidos.push({id:'0412',cliente:'Cliente Real',contato:'',cnpj:'',artes:{},materiais:[]});
    const c=Object.keys(state.cores)[0];delete state.cores[c];const p=state.produtos.find(p=>p.golaItem);if(p)p.golaItem='';Object.keys(state.estoque).filter(k=>/^Gola/.test(k)).forEach(k=>delete state.estoque[k]);
    const s2=normalizar(JSON.parse(JSON.stringify(state)));const p2=p&&s2.produtos.find(x=>x.id===p.id);
    return {cont:s2.pedidos.find(x=>x.cliente==='Cliente Real').contato,cor:c in s2.cores,gola:p2?p2.golaItem:'',est:Object.keys(s2.estoque).filter(k=>/^Gola/.test(k)).length,us:s2.usuarios.length}});
  ok(r.cont==='','pedido real 0412 não ganha contato inventado');
  ok(!r.cor,'cor apagada não volta');ok(!r.gola,'gola tirada do produto não volta');ok(r.est===0,'estoque de gola apagado não volta');ok(r.us===1,'acessos não são duplicados');
  console.log('4) Exemplos são marcados, não escolhidos pelo número');
  r=await A.evaluate(()=>({ex:state.pedidos.filter(ehExemplo).length,real:ehExemplo(state.pedidos.find(p=>p.cliente==='Cliente Real'))}));
  ok(r.ex>0&&!r.real,'pedido de exemplo tem marca; pedido real com o mesmo número não é exemplo');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
