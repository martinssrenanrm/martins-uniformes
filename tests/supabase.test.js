// Teste: o app no endereço próprio (Supabase) — login de verdade, regras de acesso, dados ao vivo entre aparelhos.
// Rodar: NODE_PATH=$(npm root -g) node tests/supabase.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const docs=new Map(),users=new Map(),pages=[];const avisos=[];
const merge=(a,b)=>{if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){const o={...a};for(const k of Object.keys(b))o[k]=k in a?merge(a[k],b[k]):b[k];return o}return b};
const acesso=e=>!!e&&[...docs].some(([p,d])=>p.startsWith('usuarios/')&&String(d.email||'').toLowerCase()===String(e).toLowerCase());
// banco novo (migração 005): tabela de sinais. SEM_SINAL=true simula um banco antigo, sem ela.
const sinal=new Map();let relogio=0,SEM_SINAL=false;const bytes={},pedidos={};
const sinaliza=(p,del)=>{const c=p.split('/')[0];if(c==='mockp'||c==='backupp')return;sinal.set(p,{path:p,col:c,upd:new Date(relogio=Math.max(Date.now(),relogio+1)).toISOString(),del:!!del})};
async function avisa(p){for(const pg of pages)await pg.evaluate(p=>window.__sbPush&&(window.__sbPush({t:'docs',new:{path:p}}),window.__sbPush({t:'docs_sinal',new:{path:p}})),p).catch(()=>{})}
const casa=(f,o)=>f.every(([c,v,k])=>{const x=c==='col'?o.path.split('/')[0]:o[c];return k==='in'?v.includes(x):k==='gt'?x>v:x===v});
async function sbop(k,a,b,quem){const r=await sbop0(k,a,b);if(quem&&k==='q'){bytes[quem]=(bytes[quem]||0)+JSON.stringify(r&&r.data||'').length;pedidos[quem]=(pedidos[quem]||0)+1}return r}
async function sbop0(k,a,b){
  if(k==='q'){const st=JSON.parse(b),pode=acesso(a);
    if(st.t==='docs_sinal'){if(SEM_SINAL)return {data:null,error:{code:'PGRST205',message:"Could not find the table 'public.docs_sinal' in the schema cache"}};if(!pode)return {data:[],error:null};
      let L=[...sinal.values()].filter(o=>casa(st.f,o)).map(o=>({...o}));L.sort((x,y)=>x.upd<y.upd?-1:1);if(st.ord&&!st.ord[1])L.reverse();if(st.range)L=L.slice(st.range[0],st.range[1]+1);if(st.lim)L=L.slice(0,st.lim);return {data:L,error:null}}
    if(st.op==='select'){if(!pode)return {data:st.single?null:[],error:null};let L=[...docs].filter(([p])=>casa(st.f,{path:p})).sort((x,y)=>x[0]<y[0]?-1:1).map(([p,d])=>({path:p,data:JSON.parse(JSON.stringify(d))}));
      if(st.range)L=L.slice(st.range[0],st.range[1]+1);return {data:st.single?(L[0]||null):L,error:null}}
    if(!pode)return {data:null,error:{code:'42501',message:'new row violates row-level security policy'}};
    if(st.op==='upsert'){(Array.isArray(st.payload)?st.payload:[st.payload]).forEach(r=>{docs.set(r.path,r.data);sinaliza(r.path)});setTimeout(()=>avisa((Array.isArray(st.payload)?st.payload[0]:st.payload).path),10);return {data:null,error:null}}
    if(st.op==='delete'){const p=(st.f.find(f=>f[0]==='path')||[])[1];docs.delete(p);sinaliza(p,true);setTimeout(()=>avisa(p),10);return {data:null,error:null}}}
  if(k==='rpc'){const {args}=JSON.parse(b);if(!acesso(a))return {data:null,error:{code:'42501',message:'row-level security'}};if(!docs.has(args.p))return {data:false,error:null};docs.set(args.p,merge(docs.get(args.p),args.patch));sinaliza(args.p);setTimeout(()=>avisa(args.p),10);return {data:true,error:null}}
  if(k==='login'){const u=users.get(a);if(!u||u.pass!==b)return {error:{message:'Invalid login credentials'}};if(!u.ok)return {error:{message:'Email not confirmed'}};return {}}
  if(k==='signup'){if(users.get(a)?.ok)return {error:{message:'User already registered'}};users.set(a,{pass:b,ok:false});avisos.push('confirmar:'+a);return {}}
  if(k==='reset'){avisos.push('reset:'+a);return {}}
  if(k==='setpass'){const u=users.get(a)||{};users.set(a,{...u,pass:b,ok:true});return {data:{},error:null}}}
// dados: cópia dos dados reais, se existir; senão os exemplos são criados pelo próprio app num banco do Claude simulado
const REAL=process.env.REAL||path.resolve(__dirname,'../../claude-code-scratch-real2');
(async()=>{const b=await chromium.launch();const er=[];
  if(fs.existsSync(REAL))for(const col of fs.readdirSync(REAL))for(const f of fs.readdirSync(path.join(REAL,col)))docs.set(col+'/'+f.replace(/\.json$/,''),JSON.parse(fs.readFileSync(path.join(REAL,col,f),'utf8')));
  else{// gera uma base completa com os pedidos de exemplo do próprio app (banco do Claude simulado)
    const st=new Map(),list=c=>[...st].filter(([p])=>p.split('/')[0]===c&&p.split('/').length===2).map(([p,d])=>({id:p.split('/')[1],data:d}));
    const ctx=await b.newContext();await ctx.exposeFunction('__dbop',async(o,p,d)=>{if(o==='get')return {data:st.get(p)||null};if(o==='list')return list(p);if(o==='acquire')return {acquired:true};if(o==='set')st.set(p,JSON.parse(JSON.stringify(d)));if(o==='update'){if(!st.has(p))return {err:'invalid_argument'};st.set(p,merge(st.get(p),d))}if(o==='delete')st.delete(p);return {}});
    await ctx.addInitScript(fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8'));await ctx.addInitScript(()=>localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helena@exemplo.test'})));const p0=await ctx.newPage();await p0.goto('file://'+path.join(R,'app.html'));await p0.waitForTimeout(1200);
    await p0.evaluate(()=>{ui.sheet=null;render()});await p0.click('[data-a=inicio][data-v=exemplo]');await p0.waitForTimeout(2500);await ctx.close();
    st.forEach((d,p)=>{if(!/^(trava|backup|backupp)\//.test(p))docs.set(p,d)})}
  docs.forEach((d,p)=>sinaliza(p));
  const fake=fs.readFileSync(path.join(__dirname,'fakesupabase.js'),'utf8'),app=fs.readFileSync(path.join(R,'app.html'),'utf8');
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>window.MARTINS_SB={url:'https://teste.supabase.co',key:'anon'}</script></head><body>${app}</body></html>`;
  async function aparelho(n){const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.exposeFunction('__sbop',(k,a,b)=>sbop(k,a,b,n));
    await ctx.route('https://app.martins.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
    await ctx.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'application/javascript',body:fake}));
    const p=await ctx.newPage();p.on('pageerror',e=>er.push(n+': '+e.message));pages.push(p);await p.goto('https://app.martins.test/');await p.waitForTimeout(1500);return p}
  console.log('1) Abre em qualquer navegador, sem conta Claude');
  const A=await aparelho('A');ok(await A.$('#sbE')!==null&&/Entrar/.test(await A.textContent('.login h1')),'mostra a tela Entrar do app');
  console.log('2) Primeiro acesso da Regina');
  await A.click('[data-a=sbPasso][data-v=primeiro]');await A.fill('#sbE','helena@exemplo.test');await A.fill('#sbS1','martins1');await A.fill('#sbS2','martins1');await A.click('[data-a=sbCriar]');await A.waitForTimeout(500);
  ok(avisos.includes('confirmar:helena@exemplo.test')&&/Confira seu e-mail/.test(await A.textContent('.login')),'pede para confirmar pelo e-mail');
  await A.click('[data-a=sbPasso][data-v=entrar]');await A.fill('#sbE','helena@exemplo.test');await A.fill('#sbS','martins1');await A.click('[data-a=sbEntrar]');await A.waitForTimeout(500);
  ok(/confirmar o e-mail/.test(await A.textContent('.login')),'sem confirmar, avisa que falta confirmar');
  users.get('helena@exemplo.test').ok=true;await A.fill('#sbS','martins1');await A.click('[data-a=sbEntrar]');await A.waitForTimeout(2500);
  const nP=await A.evaluate(()=>state.pedidos.length);ok(await A.evaluate(()=>!!usuarioAtual()&&usuarioAtual().nome==='Regina'),'Regina entrou');ok(nP>0,`dados do Supabase carregados (${nP} pedidos)`);
  console.log('3) Senha errada e e-mail sem acesso');
  const B=await aparelho('B');await B.fill('#sbE','helena@exemplo.test');await B.fill('#sbS','errada');await B.click('[data-a=sbEntrar]');await B.waitForTimeout(400);
  ok(/E-mail ou senha errados/.test(await B.textContent('.login')),'senha errada: mensagem clara');
  users.set('estranho@x.com',{pass:'123456',ok:true});await B.fill('#sbE','estranho@x.com');await B.fill('#sbS','123456');await B.click('[data-a=sbEntrar]');await B.waitForTimeout(1500);
  ok(/ainda não tem acesso/.test(await B.textContent('#app')),'e-mail fora da lista não vê nada');
  const antes=docs.size;await B.evaluate(async()=>{try{await sbDB(SB.c).doc('pedidos/hack').set({x:1})}catch(e){}});ok(docs.size===antes&&!docs.has('pedidos/hack'),'e-mail fora da lista não consegue gravar');
  console.log('4) Marcos entra e vê ao vivo o que a Regina faz');
  users.set('roger@exemplo.test',{pass:'roger12',ok:true});await B.click('[data-a=sbSair]');await B.click('[data-a=confSim]');await B.waitForTimeout(1500);
  await B.fill('#sbE','roger@exemplo.test');await B.fill('#sbS','roger12');await B.click('[data-a=sbEntrar]');await B.waitForTimeout(2500);
  ok(await B.evaluate(()=>usuarioAtual()?.nome==='Marcos'),'Marcos entrou');
  const pid=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido)||state.pedidos[0];snap();p.contato='Contato Novo Supabase';commit();return p.id});await A.waitForTimeout(1500);
  ok(docs.get('pedidos/'+pid)?.contato==='Contato Novo Supabase','mudança da Regina gravada no Supabase');
  ok(await B.evaluate(id=>pedById(id)?.contato==='Contato Novo Supabase',pid),'Marcos vê a mudança sem recarregar');
  console.log('4b) Tráfego: só baixa o que mudou');
  ok(await B.evaluate(()=>NV.sinal===true),'usa os sinais de mudança (banco com a migração 005)');
  // um doc grande de imagem não pode viajar para quem não abriu
  let b0=bytes.B||0;await A.evaluate(async()=>{await NV.db.doc('mockp/teste~0').set({d:'x'.repeat(150000)})});await B.waitForTimeout(800);await B.evaluate(()=>nuvemRefrescar());await B.waitForTimeout(500);
  ok((bytes.B||0)-b0<3000,`imagem gravada por um aparelho não vai para os outros (${(bytes.B||0)-b0} bytes)`);
  b0=bytes.B||0;let n0=pedidos.B||0;for(let i=0;i<5;i++)await B.evaluate(()=>nuvemRefrescar());await B.waitForTimeout(400);
  ok((bytes.B||0)-b0<1500,`parado, conferir mudanças custa quase nada (${(bytes.B||0)-b0} bytes em 5 conferências)`);
  const tam=[...docs].filter(([p])=>!/^(mockp|backupp)\//.test(p)).reduce((t,[p,d])=>t+JSON.stringify(d).length,0);
  b0=bytes.B||0;const lid=await A.evaluate(()=>{const l=state.lotes.find(x=>!x.rework);snap();l.obsTeste='mudou '+Date.now();commit();return l.id});await A.waitForTimeout(1500);
  const vb=(bytes.B||0)-b0;ok(await B.evaluate(id=>!!state.lotes.find(l=>l.id===id&&l.obsTeste),lid)&&vb<tam/5,`mudança numa peça chega ao outro aparelho baixando só ela (${vb} bytes; o banco todo tem ${tam})`);
  // reabrir: usa a cópia do aparelho e baixa só o que mudou
  b0=bytes.B||0;await B.reload();await B.waitForTimeout(2500);const vr=(bytes.B||0)-b0;
  ok(await B.evaluate(id=>NV.pronto&&!!state.lotes.find(l=>l.id===id&&l.obsTeste),lid)&&vr<tam/5,`reabrir o app usa a cópia do aparelho (${vr} bytes em vez de ${tam})`);
  const pid2=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido);snap();p.contato='Depois de reabrir';commit();return p.id});await A.waitForTimeout(1500);
  ok(await B.evaluate(id=>pedById(id)?.contato==='Depois de reabrir',pid2),'depois de reabrir continua vendo ao vivo');
  await A.evaluate(()=>{const l=state.lotes.find(x=>!x.rework&&!x.parent);snap();state.lotes=state.lotes.filter(x=>x!==l);commit();window.__apagado=l.id});const apag=await A.evaluate(()=>window.__apagado);await A.waitForTimeout(1500);
  ok(await B.evaluate(id=>!state.lotes.some(l=>l.id===id),apag),'o que um apaga some no outro');
  console.log('4c) Banco antigo, sem a migração 005');
  SEM_SINAL=true;const D=await aparelho('D');await D.fill('#sbE','roger@exemplo.test');await D.fill('#sbS','roger12');await D.click('[data-a=sbEntrar]');await D.waitForTimeout(2500);
  ok(await D.evaluate(()=>NV.pronto&&NV.sinal===false&&state.pedidos.length>0),'sem a tabela de sinais, abre do jeito antigo');
  b0=bytes.D||0;for(let i=0;i<3;i++)await D.evaluate(()=>nuvemRefrescar());await D.waitForTimeout(300);ok((bytes.D||0)-b0===0,'e não baixa tudo de novo a cada 2 minutos (só a cada 10)');
  SEM_SINAL=false;
  console.log('5) Esqueci a senha');
  const C=await aparelho('C');await C.click('[data-a=sbPasso][data-v=esqueci]');await C.fill('#sbE','roger@exemplo.test');await C.click('[data-a=sbEsqueci]');await C.waitForTimeout(400);
  ok(avisos.includes('reset:roger@exemplo.test')&&/Confira seu e-mail/.test(await C.textContent('.login')),'manda o link de senha nova');
  await C.evaluate(()=>window.__sbRecovery('roger@exemplo.test'));await C.waitForTimeout(300);await C.fill('#sbS1','novaSenha9');await C.fill('#sbS2','novaSenha9');await C.click('[data-a=sbNova]');await C.waitForTimeout(2500);
  ok(users.get('roger@exemplo.test').pass==='novaSenha9'&&await C.evaluate(()=>usuarioAtual()?.nome==='Marcos'),'senha nova salva e já entra');
  console.log('6) Sair');
  await A.evaluate(()=>sair());await A.waitForTimeout(1500);ok(await A.$('#sbE')!==null,'sair volta para a tela Entrar');
  ok(!er.length,'sem erros de JavaScript'+(er.length?': '+er.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
