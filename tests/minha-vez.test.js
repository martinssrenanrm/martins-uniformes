// Teste: perfis (Gestão, Escritório, Chão de fábrica) e a tela "Minha vez" da operadora.
// Rodar: NODE_PATH=$(npm root -g) node tests/minha-vez.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map();
const dbop=async(o,p,data)=>{if(o==='get')return {data:store.get(p)||null};if(o==='list')return [...store.entries()].filter(([k])=>k.split('/')[0]===p).map(([k,d])=>({id:k.split('/')[1],data:d}));if(o==='acquire')return {acquired:true};
  if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='delete')store.delete(p);return {}};
(async()=>{const b=await chromium.launch();const erros=[];
  const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8'));
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helena@exemplo.test'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await A.goto(APP);await A.waitForTimeout(1500);await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});

  console.log('1) Perfis');
  let r=await A.evaluate(()=>{const s=JSON.parse(JSON.stringify(state));s.usuarios.push({id:'u-velho',email:'v@x.test',nome:'Velho',perfil:'operacao'});s.schema=11;normalizar(s);
    return {p:Object.keys(PERFIS).join(','),mig:s.usuarios.find(u=>u.id==='u-velho').perfil,gest:state.usuarios.filter(u=>u.perfil==='gestao').length}});
  ok(r.p==='gestao,escritorio,operacao','três perfis: Gestão, Escritório e Chão de fábrica');ok(r.mig==='escritorio','quem era "Operação" antes continua com o mesmo acesso (vira Escritório)');
  r=await A.evaluate(()=>{state.usuarios.push({id:'u-ana',email:'ana@x.test',nome:'Ana',perfil:'escritorio',pessoa:'ana'});save();ui.tela='cadastros';ui.cad='ajustes';render();
    A.acsPerfilSel({id:'u-ana',v:'operacao'});const ana=state.usuarios.find(u=>u.id==='u-ana').perfil;
    const so=state.usuarios.filter(u=>u.perfil==='gestao');so.slice(1).forEach(u=>u.perfil='escritorio');A.acsPerfilSel({id:so[0].id,v:'escritorio'});const trava=so[0].perfil==='gestao';so.slice(1).forEach(u=>u.perfil='gestao');save();
    return {ana,trava}});
  ok(r.ana==='operacao','gestão muda o perfil numa lista');ok(r.trava,'não deixa ficar sem ninguém na gestão');

  console.log('2) Operadora com acesso próprio vê só a Minha vez');
  r=await A.evaluate(()=>{SESSAO={id:'u-ana',email:'ana@x.test'};ui.tela='fabrica';ui.sheet=null;render();
    const nav=getComputedStyle(document.querySelector('.nav')).display;const txt=document.getElementById('app').innerText;
    return {nav,ola:/Olá,\s*Ana/.test(txt),meta:/Sua meta de hoje/.test(txt),troca:!!document.querySelector('[data-a=mvTroca]')}});
  ok(r.nav==='none'&&r.ola,'tela única, sem a barra de baixo, com o nome dela');ok(r.meta,'mostra a meta de hoje');ok(!r.troca,'acesso dela: não tem "Não sou eu"');

  console.log('3) Terminei e Começar pela Minha vez');
  r=await A.evaluate(()=>{const txt=()=>document.getElementById('app').innerText;render();const out={};
    if(/Você está fazendo/.test(txt())){const a=metaPessoaDia('ana').pecas;document.querySelector('.mv [data-a=terminou]').click();out.term=metaPessoaDia('ana').pecas>a}
    else out.term=null;
    render();const b=document.querySelector('.mv [data-a=comecar]');if(b){b.click();out.comecou=/Você está fazendo/.test(txt())}else out.comecou=null;return out});
  ok(r.term!==false,'Terminei conta as peças na meta do dia');ok(r.comecou!==false,'Começar leva para "Você está fazendo"');ok(r.term!==null||r.comecou!==null,'a operadora tem trabalho na tela');
  console.log('4) Acesso da produção sem pessoa: escolhe o nome');
  r=await A.evaluate(()=>{state.usuarios.push({id:'u-prod',email:'prod@x.test',nome:'Produção',perfil:'operacao'});SESSAO={id:'u-prod',email:'prod@x.test'};ui.mvP=null;try{localStorage.removeItem('martins-mv')}catch(e){}render();
    const quem=/Quem é você/.test(document.getElementById('app').innerText);document.querySelector('[data-a=mvQuem]').click();const esc=/Olá,/.test(document.getElementById('app').innerText)&&!!document.querySelector('[data-a=mvTroca]');
    SESSAO={id:'u-helena',email:'helena@exemplo.test'};ui.mvP=null;render();return {quem,esc}});
  ok(r.quem&&r.esc,'mostra "Quem é você?" e depois a tela da pessoa, com "Não sou eu"');

  console.log('5) Gestão pode ver a tela do chão');
  r=await A.evaluate(()=>{ui.eu=true;render();const b=!!document.querySelector('[data-a=chaoVer]');A.chaoVer();const chao=document.body.classList.contains('chao');A.chaoSair();return {b,chao,volta:!document.body.classList.contains('chao')}});
  ok(r.b&&r.chao&&r.volta,'menu da foto › Ver a tela do chão de fábrica, e volta ao app completo');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
