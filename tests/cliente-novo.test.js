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

  const store=new Map();
  const dbop=async(o,p,data)=>{if(o==='get')return {data:store.get(p)||null};if(o==='list')return [...store.entries()].filter(([k])=>k.split('/')[0]===p).map(([k,d])=>({id:k.split('/')[1],data:d}));if(o==='acquire')return {acquired:true};
    if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='delete')store.delete(p);return {}};
  const b=await chromium.launch();const erros=[];
  const ctx=await b.newContext({viewport:{width:1000,height:900}});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8'));
  await ctx.addInitScript(()=>{window.CLIENTE={id:'nova',nome:'Confecção Nova',admins:[{id:'u-ana',email:'ana@nova.test',nome:'Ana'}]};
    try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-ana',email:'ana@nova.test'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await A.goto(APP);await A.waitForTimeout(1500);
  ok(await A.evaluate(()=>!/Martins/.test(document.body.innerText)),'a primeira tela não fala da Martins');await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=vazia]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});
  console.log('2) Acessos vêm só da configuração do cliente');
  let r=await A.evaluate(()=>({us:state.usuarios.map(u=>u.email),av:state.avisarNovos,fotos:state.pessoas.filter(p=>p.foto).length,equipe:state.pessoas.length+state.forn.length,marca:marca().nome}));
  ok(r.equipe===0,'começar do zero não traz equipe nem fornecedores de outra fábrica');ok(r.marca==='Confecção Nova','nome da empresa vem da configuração do cliente');
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
  r=await A.evaluate(()=>({ex:ehExemplo({id:'0412',exemplo:true}),real:ehExemplo(state.pedidos.find(p=>p.cliente==='Cliente Real'))}));
  ok(r.ex&&!r.real,'pedido de exemplo tem marca; pedido real com o mesmo número não é exemplo');
  console.log('5) Atualizações dos dados em ordem, uma vez só');
  r=await A.evaluate(()=>{const vs=MIGRACOES.map(m=>m.v);const a=JSON.stringify(normalizar(JSON.parse(JSON.stringify(state))));const b=JSON.stringify(normalizar(JSON.parse(a)));
    let roda=0;const velho={...JSON.parse(a),schema:SCHEMA};const m0=MIGRACOES.map(m=>m.fn);MIGRACOES.forEach(m=>{const f=m.fn;m.fn=s=>{roda++;f(s)}});normalizar(velho);MIGRACOES.forEach((m,i)=>m.fn=m0[i]);
    return {ord:vs.every((v,i)=>v===i+1),schema:state.schema===SCHEMA,igual:a===b,roda}});
  ok(r.ord,'atualizações numeradas 1, 2, 3… sem pular');ok(r.schema,'o banco guarda a versão das atualizações');
  ok(r.igual,'abrir de novo não muda nada (atualizações não se repetem)');ok(r.roda===0,'banco já atualizado não roda nenhuma atualização');
  console.log('6) Modelo de fábrica');
  r=await A.evaluate(async()=>{state.pedidos=state.pedidos.filter(ehExemplo);const m=modeloFabrica();const txt=JSON.stringify(m);
    const semDados=!/"pedidos"|"pessoas"|"usuarios"|"estoque"|"clientes"/.test(txt);
    state.produtos=state.produtos.slice(0,2);await aplicarModelo(JSON.parse(txt));
    const r1={semDados,prods:state.produtos.length===m.produtos.length,tipos:state.tipos.length===m.tipos.length,cores:JSON.stringify(state.cores)===JSON.stringify(m.cfg.cores),
      limpo:!state.pedidos.length&&!state.pessoas.length&&!state.forn.length&&!Object.keys(state.estoque).length,acessos:state.usuarios.length===1};
    state.pedidos.push({id:'1',cliente:'Real',artes:{},materiais:[]});let recusou=false;try{await aplicarModelo(m)}catch(e){recusou=e.message==='tem pedidos'}
    state.pedidos=[];ui.tela='cadastros';ui.cad='ajustes';render();const card=!!document.getElementById('Modelo')&&!!document.getElementById('fModelo');
    ui.modPend=m;render();const conf=!!document.querySelector('[data-a=modAplicar]');ui.modPend=null;
    for(const t of ['fabrica','pedidos','cadastros','gestor']){ui.tela=t;render()}
    return {...r1,recusou,card,conf}});
  ok(r.semDados,'o modelo não leva pedidos, equipe, acessos, estoque nem empresas');ok(r.prods&&r.tipos&&r.cores,'aplicar o modelo traz máquinas, produtos e ajustes');
  ok(r.limpo,'equipe, fornecedores, estoque e pedidos começam em branco');ok(r.acessos,'acessos continuam');
  ok(r.recusou,'com pedido de verdade, o modelo não é aplicado');ok(r.card&&r.conf,'quadro Modelo de fábrica em Ajustes, com confirmação na tela');
  console.log('7) Fábrica sem equipe abre todas as telas');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
