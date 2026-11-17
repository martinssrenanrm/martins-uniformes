-- 018: espaço de arquivos fechado — só quem tem acesso ao app baixa (auditoria, 16/11/2026).
-- Antes (006) o espaço "arquivos" era público: quem tivesse o link de um arquivo baixava sem login.
-- Depois desta migração:
--   * no app, quem está logado baixa pelo próprio acesso (política arquivos_ler, que já existe desde a 006);
--   * no QR code (sem login), o app pede um link temporário à função arquivo-qr, que confere se o arquivo é da peça daquela etiqueta.
-- ORDEM OBRIGATÓRIA: 1) publicar o app novo; 2) publicar a função arquivo-qr (supabase/functions/arquivo-qr);
--   3) só então rodar esta migração. Rodar antes quebra o download no app antigo.
-- Volta atrás: update storage.buckets set public = true where id = 'arquivos';  (nada é apagado)
-- Pode rodar de novo sem problema.

-- Nome no Storage de um arquivo que o QR pode abrir: o mockup da própria peça ou um anexo da peça/pedido.
create or replace function public.arquivo_qr_nome(tok text, k text) returns text
language plpgsql stable security definer set search_path = public as $function$
declare l jsonb; p jsonb; ok boolean; mock boolean; st text;
begin
  if tok is null or length(tok) < 20 or k is null or k = '' then return null; end if;
  select data into l from docs where col = 'lotes' and data->>'qr' = tok limit 1;
  if l is null then return null; end if;
  select data into p from docs where path = 'pedidos/' || (l->>'ped');
  -- chaves do mockup da peça (nullif: um campo vazio nunca libera a chave "~c" sozinha)
  mock := k in (nullif(l->>'mockBin',''), nullif(l->>'mockBin','') || '~c', nullif(l->>'id',''), nullif(l->>'id','') || '~c', nullif(l->>'parent',''), nullif(l->>'parent','') || '~c');
  ok := coalesce(mock, false);
  if not ok then
    select exists(select 1 from docs where col = 'arquivos' and data->>'id' = any(public.anexos_da_peca(l, coalesce(p,'{}'::jsonb))) and (data->>'bin' = k or data->>'vis' = k)) into ok;
  end if;
  if not ok then return null; end if;
  -- mockup da peça: a versão comprimida (mock/<id>~c), como a ficha_publica mostra; senão, o original.
  -- anexo (arquivo enviado): exatamente o arquivo pedido.
  if ok and coalesce(mock, false) and right(k, 2) <> '~c' then select data->>'st' into st from docs where path = 'mock/' || k || '~c'; end if;
  if st is null then select data->>'st' into st from docs where path = 'mock/' || k; end if;
  return st;
end $function$;
revoke execute on function public.arquivo_qr_nome(text, text) from public, anon, authenticated;
grant execute on function public.arquivo_qr_nome(text, text) to service_role;

update storage.buckets set public = false where id = 'arquivos';
