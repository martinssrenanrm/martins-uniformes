// Teste: feriados de São Paulo nos dias úteis; data de entrega lida da ficha em formatos diferentes;
// peça nova no pedido não ganha personalização sozinha.
// Rodar: NODE_PATH=$(npm root -g) node tests/feriados-entrega.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path'),os=require('os'),{execFileSync}=require('child_process');
const APP='file://'+path.resolve(__dirname,'../app.html');const FX=path.join(__dirname,'fixtures');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map();
async function dbop(o,p,data){if(o==='get')return {data:store.get(p)||null};if(o==='list')return [...store.entries()].filter(([k])=>k.split('/')[0]===p).map(([k,d])=>({id:k.split('/')[1],data:d}));if(o==='acquire')return {acquired:true};
  if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='delete')store.delete(p);return {}}
const cache=path.join(os.tmpdir(),'martins-cdn');fs.mkdirSync(cache,{recursive:true});
const cdn=url=>{const f=path.join(cache,url.replace(/[^a-z0-9.]+/gi,'_'));if(!fs.existsSync(f))execFileSync('curl',['-sfL','-o',f,url]);return fs.readFileSync(f)};
(async()=>{const b=await chromium.launch();const fake=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');const erros=[];
  const ctx=await b.newContext({viewport:{width:360,height:640}});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fake);
  await ctx.route(/cdnjs\.cloudflare\.com/,r=>r.fulfill({body:cdn(r.request().url()),contentType:'application/javascript'}));
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helenanenimga67@gmail.com'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await A.goto(APP);await A.waitForTimeout(1500);await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});

  console.log('1) Feriados de São Paulo, SP');
  let r=await A.evaluate(()=>{const f=(y,m,d)=>feriado(new Date(y,m-1,d));return {local:state.feriados.local,aniv:f(2027,1,25),revol:f(2026,7,9),corpus:f(2026,6,4),santa:f(2026,4,3),consc:f(2026,11,20),natal:f(2026,12,25),comum:f(2026,6,3),
    carnaval:f(2026,2,17)}});
  ok(r.local==='sp-sp','a empresa já vem configurada em São Paulo, SP');
  ok(!!r.aniv&&!!r.revol&&!!r.corpus,'feriados municipais e estaduais (25/01, 09/07, Corpus Christi)');
  ok(!!r.santa&&!!r.consc&&!!r.natal,'feriados nacionais, inclusive móveis (Sexta-feira Santa) e 20/11');
  ok(!r.comum&&!r.carnaval,'dia comum e Carnaval (ponto facultativo) contam como dia útil');
  r=await A.evaluate(()=>({d:new Date(addWD(new Date(2026,5,1,17).getTime(),10)).toISOString().slice(0,10),fer:!isWD(new Date(2026,5,4))}));
  ok(r.fer&&r.d==='2026-06-16','10 dias úteis a partir de 01/06/2026 pulam o Corpus Christi (16/06)');
  await A.evaluate(()=>A.ferFac({v:'carnaval'}));ok(await A.evaluate(()=>!!feriado(new Date(2026,1,17))),'dá para marcar que a fábrica para no Carnaval');
  await A.evaluate(()=>A.ferTrab({v:'2026-06-04'}));ok(await A.evaluate(()=>isWD(new Date(2026,5,4))),'"Vamos trabalhar" faz o feriado contar como dia útil');
  await A.evaluate(()=>A.ferTrab({v:'2026-06-04'}));ok(await A.evaluate(()=>!isWD(new Date(2026,5,4))),'e dá para voltar a ser feriado');
  await A.evaluate(()=>{openSheet&&0;ui.sheet=null;ui.tela='cadastros';ui.cad='ajustes';render()});
  ok(await A.evaluate(()=>/Feriados/.test(document.body.textContent)&&!!document.querySelector('select[data-sel=ferLocal]')),'Cadastros › Ajustes tem o quadro Feriados com o lugar da empresa');

  console.log('2) Data de entrega lida da ficha');
  await A.evaluate(()=>{ui.sheet=null;render()});
  await A.setInputFiles('#fImpF',[path.join(FX,'ficha-teste-5.docx')]);await A.waitForFunction(()=>ui.sheet&&ui.sheet.t==='imp',null,{timeout:30000});
  r=await A.evaluate(()=>{const g=ui.sheet.grupos[0];return g.entrega&&new Date(g.entrega).toISOString().slice(0,10)});
  ok(r==='2026-11-06','"PRAZO DE ENTREGA:" com a data na linha de baixo (06/11/2026)');
  await A.evaluate(()=>{ui.sheet=null;render()});
  await A.setInputFiles('#fImpF',[path.join(FX,'ficha-teste-6.docx')]);await A.waitForFunction(()=>ui.sheet&&ui.sheet.t==='imp',null,{timeout:30000});
  r=await A.evaluate(()=>{const g=ui.sheet.grupos[0];return g.entrega&&new Date(g.entrega).toISOString().slice(0,10)});
  ok(r==='2026-06-16','"Prazo: 10 dias úteis" conta a partir do fechamento e pula o feriado');

  console.log('3) Peça nova não ganha personalização sozinha');
  await A.evaluate(()=>{openSheet({t:'novo',w:{step:2,cliente:'Teste',cli:null,contato:'',cnpj:'',vend:state.pessoas[0].id,entrega:null,err:'',itens:[]}});A.wAdd({p:'blusa'})});
  r=await A.evaluate(()=>({pers:ui.sheet.w.itens[0].pers.length,sug:!!document.querySelector('[data-a=wPpad]'),padrao:(prod('blusa').persPadrao||[]).length}));
  ok(r.pers===0,'a Blusa entra sem estampa nas costas');ok(r.padrao===0||r.sug,'a personalização de sempre aparece só como sugestão');
  if(r.sug){await A.click('[data-a=wPpad]');ok(await A.evaluate(()=>ui.sheet.w.itens[0].pers.length>0),'tocando na sugestão, ela entra')}

  console.log('4) Central de dúvidas');
  ok(await A.evaluate(()=>ajBusca('feriado')[0]?.f.q==='Como o sistema conta os feriados?'),'"feriado" acha a resposta certa');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros[0]:''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
