// Função "arquivo-qr" do Supabase (preparada na auditoria de 16/11/2026; só funciona depois da migração 018).
// Quem lê o QR code da etiqueta não tem login. Com o espaço de arquivos fechado (018), o arquivo só abre com um link temporário.
// Esta função confere, no banco, se o arquivo pedido pertence à peça daquele QR (arquivo_qr_nome) e devolve um link que vale 2 minutos.
// A chave de serviço fica só aqui (o Supabase põe sozinho em SUPABASE_SERVICE_ROLE_KEY); nunca vai para o app.
// Publicar com verify_jwt desligado: quem chama não tem login; a conferência é o código secreto da etiqueta.
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const resp = (status: number, o: unknown) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const env = Deno.env.toObject();
const srv = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resp(405, { erro: 'use POST' });
  let c: { tok?: string; k?: string } = {};
  try { c = await req.json(); } catch { return resp(400, { erro: 'corpo inválido' }); }
  const tok = String(c.tok || ''), k = String(c.k || '');
  if (!/^[0-9a-f]{20,64}$/.test(tok) || !k || k.length > 200) return resp(400, { erro: 'pedido inválido' });
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/arquivo_qr_nome`, { method: 'POST', headers: srv, body: JSON.stringify({ tok, k }) });
  const nome = r.ok ? await r.json() : null;
  if (!nome || typeof nome !== 'string') return resp(404, { erro: 'arquivo não encontrado para esta etiqueta' });
  const s = await fetch(`${env.SUPABASE_URL}/storage/v1/object/sign/arquivos/${nome.split('/').map(encodeURIComponent).join('/')}`, { method: 'POST', headers: srv, body: JSON.stringify({ expiresIn: 120 }) });
  if (!s.ok) return resp(502, { erro: 'não consegui gerar o link' });
  const j = await s.json();
  return resp(200, { url: `${env.SUPABASE_URL}/storage/v1${j.signedURL || j.signedUrl}` });
});
