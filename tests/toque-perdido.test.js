// Teste da frente "toques que somem" (09/11/2026).
// Em 05/11 e 06/11, 28 toques ("Chegou", "Marcar todas como feitas") foram para o histórico, mas não para as peças:
// o primeiro toque em cada peça depois de abrir o app não era gravado (a cópia "já enviada" era o mesmo objeto da tela).
// Aqui dois aparelhos marcam ao mesmo tempo, no Supabase e no banco do Claude, e no fim o histórico tem que bater com as peças.
// Rodar: NODE_PATH=$(npm root -g) node tests/toque-perdido.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const docs=new Map(),users=new Map(),pages=[];const avisos=[];
const merge=(a,b)=>{if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){const o={...a};for(const k of Object.keys(b))o[k]=k in a?merge(a[k],b[k]):b[k];return o}return b};
const acesso=e=>!!e&&[...docs].some(([p,d])=>p.startsWith('usuarios/')&&String(d.email||'').toLowerCase()===String(e).toLowerCase());
// banco novo (migração 005): tabela de sinais. SEM_SINAL=true simula um banco antigo, sem ela.
const objs=new Map();let SEM_STORAGE=false;
// eventos (migração 007): só acrescenta; SEM_EVENTOS simula banco sem a tabela
const evs=new Map(),usoT=new Map();let SEM_EVENTOS=false,metricasPedidas=0;
const sinal=new Map();let relogio=0,SEM_SINAL=false;const bytes={},pedidos={},baixou={};
const sinaliza=(p,del)=>{const c=p.split('/')[0];if(c==='mockp'||c==='backupp')return;sinal.set(p,{path:p,col:c,upd:new Date(relogio=Math.max(Date.now(),relogio+1)).toISOString(),del:!!del})};
async function avisa(p){for(const pg of pages)await pg.evaluate(p=>window.__sbPush&&(window.__sbPush({t:'docs',new:{path:p}}),window.__sbPush({t:'docs_sinal',new:{path:p}})),p).catch(()=>{})}
const casa=(f,o)=>f.every(([c,v,k])=>{const x=c==='col'?o.path.split('/')[0]:o[c];return k==='in'?v.includes(x):k==='gt'?x>v:x===v});
async function sbop(k,a,b,quem){const r=await sbop0(k,a,b);if(quem&&k==='q'){bytes[quem]=(bytes[quem]||0)+JSON.stringify(r&&r.data||'').length;pedidos[quem]=(pedidos[quem]||0)+1}return r}
async function sbop0(k,a,b){
  if(k==='q'){const st=JSON.parse(b),pode=acesso(a);
    if(st.t==='docs_sinal'){if(SEM_SINAL)return {data:null,error:{code:'PGRST205',message:"Could not find the table 'public.docs_sinal' in the schema cache"}};if(!pode)return {data:[],error:null};
      let L=[...sinal.values()].filter(o=>casa(st.f,o)).map(o=>({...o}));L.sort((x,y)=>x.upd<y.upd?-1:1);if(st.ord&&!st.ord[1])L.reverse();if(st.range)L=L.slice(st.range[0],st.range[1]+1);if(st.lim)L=L.slice(0,st.lim);return {data:L,error:null}}
    if(st.t==='eventos'){if(SEM_EVENTOS)return {data:null,error:{code:'PGRST205',message:"Could not find the table 'public.eventos' in the schema cache"}};if(!pode)return {data:null,error:{code:'42501',message:'new row violates row-level security policy'}};
      if(st.op==='upsert'){(Array.isArray(st.payload)?st.payload:[st.payload]).forEach(e=>{if(!evs.has(e.id))evs.set(e.id,{...e,rec:new Date().toISOString()})});return {data:null,error:null}}
      let L=[...evs.values()].filter(e=>casa(st.f.filter(f=>f[0]!=='col'),e));L.sort((x,y)=>x.ts<y.ts?-1:1);return {data:L,error:null}}
    if(st.op==='select'){if(!pode)return {data:st.single?null:[],error:null};let L=[...docs].filter(([p])=>casa(st.f,{path:p})).sort((x,y)=>x[0]<y[0]?-1:1).map(([p,d])=>({path:p,data:JSON.parse(JSON.stringify(d))}));
      if(st.range)L=L.slice(st.range[0],st.range[1]+1);return {data:st.single?(L[0]||null):L,error:null}}
    if(!pode)return {data:null,error:{code:'42501',message:'new row violates row-level security policy'}};
    if(st.op==='upsert'){(Array.isArray(st.payload)?st.payload:[st.payload]).forEach(r=>{docs.set(r.path,r.data);sinaliza(r.path)});setTimeout(()=>avisa((Array.isArray(st.payload)?st.payload[0]:st.payload).path),10);return {data:null,error:null}}
    if(st.op==='delete'){const p=(st.f.find(f=>f[0]==='path')||[])[1];docs.delete(p);sinaliza(p,true);setTimeout(()=>avisa(p),10);return {data:null,error:null}}}
  if(k==='up'){const o=JSON.parse(b);if(SEM_STORAGE)return {data:null,error:{message:'Bucket not found',statusCode:'404'}};if(!acesso(a))return {data:null,error:{message:'new row violates row-level security policy',statusCode:'403'}};objs.set(o.bk+'/'+o.name,{type:o.type,buf:Buffer.from(o.b64,'base64')});return {data:{path:o.name},error:null}}
  if(k==='rm'){const o=JSON.parse(b);if(!acesso(a))return {data:null,error:{message:'rls'}};o.names.forEach(n=>objs.delete(o.bk+'/'+n));return {data:[],error:null}}
  if(k==='rpc'&&JSON.parse(b).fn==='metricas'){if(SEM_EVENTOS)return {data:null,error:{code:'PGRST202',message:'Could not find the function public.metricas'}};const g=[...docs].some(([p,d])=>p.startsWith('usuarios/')&&d.perfil==='gestao'&&String(d.email).toLowerCase()===String(a).toLowerCase());if(!g)return {data:null,error:null};
    metricasPedidas++;return {data:{periodo:{de:'2026-10-27',ate:'2026-11-02',fuso:'America/Sao_Paulo'},pedidos:{criados:4,entregues:3,no_prazo_pct:67,no_prazo_inicial_pct:33,dias_medio:6.5,cancelados:0},etapas:{feitas:40,pecas:900,horas:31.5,pct_depois:25},processos:[{processo:'Costura teste',feitas:10,pecas:200,horas:8,seg_por_peca:144,seg_padrao:100}],retrabalho:{pecas:5,motivos:{'Costura torta':5}},compras:{itens_em_falta:2,horas_medio_ate_comprar:18},adesao:{pct_na_hora:75,pct_depois:25},desfazer:[{tela:'fabrica/maq',acao:'etapa.concluida',n:3}],uso:[{tela:'fabrica/maq',n:120},{tela:'pedido',n:40}]},error:null}}
  if(k==='rpc'&&JSON.parse(b).fn==='uso_conta'){const {args}=JSON.parse(b);if(SEM_EVENTOS)return {data:null,error:{code:'PGRST202',message:'Could not find the function public.uso_conta'}};if(!acesso(a))return {data:null,error:null};(args.itens||[]).forEach(x=>{const k=[x.dia,x.usuario,x.dv,x.tela].join('|');usoT.set(k,(usoT.get(k)||0)+x.n)});return {data:null,error:null}}
  if(k==='rpc'){const {args}=JSON.parse(b);if(!acesso(a))return {data:null,error:{code:'42501',message:'row-level security'}};if(!docs.has(args.p))return {data:false,error:null};docs.set(args.p,merge(docs.get(args.p),args.patch));sinaliza(args.p);setTimeout(()=>avisa(args.p),10);return {data:true,error:null}}
  if(k==='login'){const u=users.get(a);if(!u||u.pass!==b)return {error:{message:'Invalid login credentials'}};if(!u.ok)return {error:{message:'Email not confirmed'}};return {}}
  if(k==='signup'){if(users.get(a)?.ok)return {error:{message:'User already registered'}};users.set(a,{pass:b,ok:false});avisos.push('confirmar:'+a);return {}}
  if(k==='reset'){avisos.push('reset:'+a);return {}}
  if(k==='setpass'){const u=users.get(a)||{};users.set(a,{...u,pass:b,ok:true});return {data:{},error:null}}}

// conferência histórico × peças: o último "feita"/"voltou" de cada etapa no histórico tem que estar na peça
function confere(evList,docOf){const ult=new Map(),dif=[];
  evList.filter(e=>e.lote&&e.ref&&['etapa.concluida','remessa.retornada'].includes(e.tipo)).sort((x,y)=>x.ts<y.ts?-1:1).forEach(e=>ult.set(e.lote+'|'+e.ref,e));
  ult.forEach(e=>{const l=docOf('lotes/'+e.lote);if(!l||!l.steps||!l.steps[e.ref]||l.steps[e.ref].st!=='ok')dif.push(e.lote+' '+e.ref+' ('+e.tipo+')')});return {n:ult.size,dif}}
// marca como na tela
const marcaTodas=async(P,id)=>{await P.evaluate(id=>{ui.sheet=null;A.etTodas({l:id})},id);await P.click('[data-a=confSim]')};
const pecas=(P,n,pula)=>P.evaluate(([n,pula])=>state.lotes.filter(l=>!l.rework&&!l.parent&&!pula.includes(l.id)&&etFaltam(l).length).slice(0,n).map(l=>l.id),[n,pula||[]]);
const externa=(P,pula)=>P.evaluate(pula=>{for(const l of state.lotes){if(l.rework||l.parent||pula.includes(l.id))continue;const z=topo(rp(l)).find(z=>isExt(z)&&stOf(l,z.id).st==='pend');if(z)return [l.id,z.id]}return null},pula||[]);
const temRetro=d=>Object.values((d&&d.steps)||{}).some(x=>x&&x.st==='ok'&&x.retro);
const espera=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const er=[];
  {{// gera uma base completa com os pedidos de exemplo do próprio app (banco do Claude simulado)
    const st=new Map(),list=c=>[...st].filter(([p])=>p.split('/')[0]===c&&p.split('/').length===2).map(([p,d])=>({id:p.split('/')[1],data:d}));
    const ctx=await b.newContext();await ctx.exposeFunction('__dbop',async(o,p,d)=>{if(o==='get')return {data:st.get(p)||null};if(o==='list')return list(p);if(o==='acquire')return {acquired:true};if(o==='set')st.set(p,JSON.parse(JSON.stringify(d)));if(o==='update'){if(!st.has(p))return {err:'invalid_argument'};st.set(p,merge(st.get(p),d))}if(o==='delete')st.delete(p);return {}});
    await ctx.addInitScript(fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8'));await ctx.addInitScript(()=>localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helena@exemplo.test'})));const p0=await ctx.newPage();await p0.goto('file://'+path.join(R,'app.html'));await p0.waitForTimeout(1200);
    await p0.evaluate(()=>{ui.sheet=null;render()});await p0.click('[data-a=inicio][data-v=exemplo]');await p0.waitForTimeout(2500);await ctx.close();
    st.forEach((d,p)=>{if(!/^(trava|backup|backupp)\//.test(p))docs.set(p,d)})}}
  docs.forEach((d,p)=>sinaliza(p));
  const fake=fs.readFileSync(path.join(__dirname,'fakesupabase.js'),'utf8'),app=fs.readFileSync(path.join(R,'app.html'),'utf8');
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>window.MARTINS_SB={url:'https://teste.supabase.co',key:'anon'}</script></head><body>${app}</body></html>`;
  async function aparelho(n){const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.exposeFunction('__sbop',(k,a,b)=>sbop(k,a,b,n));
    await ctx.route('https://app.martins.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
    await ctx.route('https://teste.supabase.co/storage/v1/object/public/**',r=>{const k=decodeURIComponent(new URL(r.request().url()).pathname.replace('/storage/v1/object/public/',''));const o=objs.get(k);if(n==='A'||n==='B')baixou[n]=(baixou[n]||0)+(o?o.buf.length:0);return o?r.fulfill({status:200,contentType:o.type,headers:{'access-control-allow-origin':'*'},body:o.buf}):r.fulfill({status:400,headers:{'access-control-allow-origin':'*'},body:'{}'})});
    await ctx.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'application/javascript',body:fake}));
    const p=await ctx.newPage();p.on('pageerror',e=>er.push(n+': '+e.message));pages.push(p);await p.goto('https://app.martins.test/');await p.waitForTimeout(1500);return p}

  async function entra(P,email,senha){users.set(email,{pass:senha,ok:true});await P.fill('#sbE',email);await P.fill('#sbS',senha);await P.click('[data-a=sbEntrar]');await P.waitForTimeout(2500)}

  console.log('1) Supabase: dois aparelhos acabaram de abrir e marcam ao mesmo tempo');
  const H=await aparelho('H'),Rg=await aparelho('R');await entra(H,'helena@exemplo.test','martins1');await entra(Rg,'roger@exemplo.test','roger12');
  ok(await H.evaluate(()=>NV.sinal===true&&!!usuarioAtual())&&await Rg.evaluate(()=>NV.sinal===true&&!!usuarioAtual()),'os dois entraram, usando os sinais (modo da fábrica)');
  // reabre os dois juntos e marca na hora: é o primeiro toque depois de abrir, antes de chegar qualquer mudança de fora
  await Promise.all([H.reload(),Rg.reload()]);await Promise.all([H.waitForTimeout(2500),Rg.waitForTimeout(2500)]);
  const pH=await pecas(H,2),pR=await pecas(Rg,2,pH);
  await Promise.all([(async()=>{for(const id of pH)await marcaTodas(H,id)})(),(async()=>{for(const id of pR)await marcaTodas(Rg,id)})()]);await espera(2500);
  const falta1=[...pH,...pR].filter(id=>!temRetro(docs.get('lotes/'+id)));
  ok(pH.length===2&&pR.length===2&&!falta1.length,'"Marcar todas como feitas" logo depois de abrir chega ao banco, nos dois aparelhos'+(falta1.length?' (faltou: '+falta1.join(', ')+')':''));
  const veH=await H.evaluate(ids=>ids.every(id=>!etFaltam(lote(id)).length),[...pH,...pR]),veR=await Rg.evaluate(ids=>ids.every(id=>!etFaltam(lote(id)).length),[...pH,...pR]);
  ok(veH&&veR,'os dois aparelhos veem as quatro peças feitas');

  console.log('2) "Chegou" do prestador: primeiro toque e outra mudança na mesma peça');
  const e1=await externa(H,[...pH,...pR]);
  if(e1){await H.evaluate(([l,s])=>A.levouVoltou({l,s}),e1);await espera(1500);
    ok(docs.get('lotes/'+e1[0])?.steps?.[e1[1]]?.st==='ok','"Chegou" logo depois de abrir chega ao banco');
    await H.evaluate(id=>{const l=lote(id);snap();l.obsTeste='outra mudança';commit()},e1[0]);await espera(1500);
    ok(docs.get('lotes/'+e1[0])?.steps?.[e1[1]]?.st==='ok'&&await H.evaluate(([id,s])=>stOf(lote(id),s).st==='ok',e1),'depois de outra mudança na mesma peça, o "Chegou" continua no banco e na tela')}
  else ok(false,'base de exemplo sem etapa no prestador para testar o "Chegou"');

  console.log('3) Reabrir o app (cópia guardada no aparelho) e marcar de novo, ao mesmo tempo');
  await H.reload();await H.waitForTimeout(2500);await Rg.reload();await Rg.waitForTimeout(2500);
  const usados=[...pH,...pR,...(e1?[e1[0]]:[])];const qH=await pecas(H,1,usados),qR=await pecas(Rg,1,[...usados,...qH]);
  await Promise.all([marcaTodas(H,qH[0]),marcaTodas(Rg,qR[0])]);await espera(2500);
  const falta3=[...qH,...qR].filter(id=>!temRetro(docs.get('lotes/'+id)));
  ok(qH.length&&qR.length&&!falta3.length,'depois de reabrir, o primeiro toque também chega'+(falta3.length?' (faltou: '+falta3.join(', ')+')':''));

  console.log('4) Conferência histórico × peças (Supabase)');
  await H.evaluate(()=>evEnvia());await Rg.evaluate(()=>evEnvia());await espera(800);
  const c1=confere([...evs.values()],p=>docs.get(p));
  ok(c1.n>0&&!c1.dif.length,`histórico e peças batem: ${c1.n} etapas conferidas, ${c1.dif.length} diferença(s)`+(c1.dif.length?': '+c1.dif.join('; '):''));

  console.log('5) Banco do Claude: dois aparelhos marcando ao mesmo tempo');
  const st=new Map(),cpages=[],listC=c=>[...st].filter(([p])=>p.split('/')[0]===c&&p.split('/').length===2).map(([p,d])=>({id:p.split('/')[1],data:d}));
  const bcC=async c=>{for(const p of cpages)await p.evaluate(([c,d])=>window.__push&&window.__push(c,d),[c,listC(c)]).catch(()=>{})};
  const dbopC=async(o,p,d)=>{if(o==='get')return {data:st.get(p)||null};if(o==='list')return listC(p);if(o==='acquire')return {acquired:true};const c=p.split('/')[0];
    if(o==='set')st.set(p,JSON.parse(JSON.stringify(d)));if(o==='update'){if(!st.has(p))return {err:'invalid_argument'};st.set(p,merge(st.get(p),d))}if(o==='delete')st.delete(p);setTimeout(()=>bcC(c),10);return {}};
  const fakedb=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');
  async function claude(n,primeiro){const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.exposeFunction('__dbop',dbopC);await ctx.addInitScript(fakedb);
    await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helena@exemplo.test'}))}catch(e){}});
    const p=await ctx.newPage();p.on('pageerror',e=>er.push(n+': '+e.message));cpages.push(p);await p.goto('file://'+path.join(R,'app.html'));await p.waitForTimeout(1500);await p.evaluate(()=>{ui.sheet=null;render()});
    if(primeiro){await p.click('[data-a=inicio][data-v=exemplo]');await p.waitForTimeout(2500)}return p}
  const C1=await claude('C1',true);const C2=await claude('C2');
  const cA=await pecas(C1,2),cB=await pecas(C2,2,cA);
  await Promise.all([(async()=>{for(const id of cA)await marcaTodas(C1,id)})(),(async()=>{for(const id of cB)await marcaTodas(C2,id)})()]);await espera(2500);
  const faltaC=[...cA,...cB].filter(id=>!temRetro(st.get('lotes/'+id)));
  ok(cA.length===2&&cB.length===2&&!faltaC.length,'no banco do Claude, os toques dos dois aparelhos chegam'+(faltaC.length?' (faltou: '+faltaC.join(', ')+')':''));

  ok(!er.length,'sem erros de JavaScript'+(er.length?': '+er.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
