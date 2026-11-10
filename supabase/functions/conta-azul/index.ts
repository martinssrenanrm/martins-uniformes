// Função "conta-azul" do Supabase: traz as vendas do Conta Azul para ca_vendas (núcleo em nucleo.js).
// Quem pode chamar: o agendador (cabeçalho x-agendador = segredo do Vault, migração 015) ou quem é da gestão/escritório
// logado no app ("Buscar vendas agora"). Publicar com verify_jwt desligado: a conferência é feita aqui.
// Segredos da função (painel do Supabase › Edge Functions › Secrets): CA_CLIENT_ID e CA_CLIENT_SECRET.
// SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY o Supabase já põe sozinho.
import { sincronizar, Falha } from './nucleo.js';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const resp = (status: number, o: unknown) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const env = Deno.env.toObject();

async function rpc(nome: string, args: unknown, token: string, chave: string) {
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${nome}`, { method: 'POST', headers: { apikey: chave, ...(token.startsWith('eyJ') ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  return r.ok ? r.json() : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resp(405, { erro: 'use POST' });
  let corpo: { modo?: string; desde?: string } = {};
  try { corpo = await req.json(); } catch { /* sem corpo */ }

  const agendador = req.headers.get('x-agendador');
  let modo = 'rapida', desde: string | null = null;
  if (agendador) {
    if (!(await rpc('ca_cron_confere', { segredo: agendador }, env.SUPABASE_SERVICE_ROLE_KEY, env.SUPABASE_SERVICE_ROLE_KEY))) return resp(401, { erro: 'agendador não reconhecido' });
    if (['rapida', 'noite', 'completa'].includes(String(corpo.modo))) modo = String(corpo.modo);
    if (modo === 'completa' && /^\d{4}-\d{2}-\d{2}$/.test(String(corpo.desde || ''))) desde = String(corpo.desde);
  } else {
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token || !(await rpc('ca_pode_buscar', {}, token, env.SUPABASE_ANON_KEY))) return resp(403, { erro: 'só a gestão e o escritório buscam as vendas' });
  }
  try {
    const r = await sincronizar({ modo, desde, env });
    return resp(r.ocupado ? 409 : 200, r);
  } catch (e) {
    console.error(e);
    return resp(502, { erro: e instanceof Falha ? e.message : 'falha ao buscar no Conta Azul' });
  }
});
