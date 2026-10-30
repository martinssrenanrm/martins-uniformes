// Supabase de mentira para os testes: o mesmo jeito de chamar do supabase-js, guardando tudo no Node (window.__sbop).
window.supabase={createClient(){
  const SK='fsb-ses';let ses=null;try{ses=JSON.parse(localStorage.getItem(SK)||'null')}catch(e){}
  const cbs=[],op=(...a)=>window.__sbop(...a),tok=()=>ses?ses.user.email:null,chans=[];
  window.__sbPush=pl=>chans.forEach(c=>c.h&&(!c.t||!pl.t||c.t===pl.t)&&c.h(pl));
  window.__sbRecovery=email=>{ses={user:{email}};localStorage.setItem(SK,JSON.stringify(ses));cbs.forEach(f=>f('PASSWORD_RECOVERY',ses))};
  const qb=t=>{const st={t,f:[],op:'select',range:null,single:false,payload:null,ord:null,lim:null};
    const b={select(){return b},eq(c,v){st.f.push([c,v]);return b},in(c,v){st.f.push([c,v,'in']);return b},gt(c,v){st.f.push([c,v,'gt']);return b},
      order(c,o){st.ord=[c,!(o&&o.ascending===false)];return b},limit(n){st.lim=n;return b},range(a,z){st.range=[a,z];return b},maybeSingle(){st.single=true;return b},
      upsert(p){st.op='upsert';st.payload=p;return b},delete(){st.op='delete';return b},then(ok,ruim){return op('q',tok(),JSON.stringify(st)).then(ok,ruim)}};return b};
  return {from:qb,rpc:(fn,args)=>op('rpc',tok(),JSON.stringify({fn,args})),
    channel(){const c={on(ev,f,h){c.h=h;c.t=f&&f.table;return c},subscribe(){return c}};chans.push(c);return c},removeChannel(){},
    auth:{getSession:async()=>({data:{session:ses}}),onAuthStateChange(f){cbs.push(f);return {data:{subscription:{unsubscribe(){}}}}},
      async signInWithPassword({email,password}){const r=await op('login',email,password);if(r.error)return {data:{},error:r.error};ses={user:{email}};localStorage.setItem(SK,JSON.stringify(ses));return {data:{session:ses},error:null}},
      async signUp({email,password}){const r=await op('signup',email,password);return r.error?{data:{},error:r.error}:{data:{session:null,user:{email}},error:null}},
      async resetPasswordForEmail(email){await op('reset',email);return {error:null}},
      async updateUser({password}){return op('setpass',tok(),password)},
      async signOut(){ses=null;localStorage.removeItem(SK);return {}}}}}};
