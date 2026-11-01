-- 006: arquivos (mockups, artes, programas de bordado) no Storage, fora do banco (31/10/2026).
-- Antes: cada arquivo virava texto (base64, +33%) dentro da tabela docs, em pedaços (mockp). Isso enche os 500 MB do plano grátis.
-- Agora: o arquivo vai comprimido para o Storage (1 GB no plano grátis). O documento mock/<id> guarda só onde está: {st:'b/<nome aleatório>'}.
-- Os nomes são aleatórios e impossíveis de adivinhar; o bucket é público só para download direto (como o link do QR). Ninguém de fora lista os arquivos.
-- Pode rodar de novo sem problema.

insert into storage.buckets (id, name, public, file_size_limit)
values ('arquivos', 'arquivos', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists arquivos_ler on storage.objects;
drop policy if exists arquivos_enviar on storage.objects;
drop policy if exists arquivos_apagar on storage.objects;
create policy arquivos_ler on storage.objects for select to authenticated using (bucket_id = 'arquivos' and public.tem_acesso());
create policy arquivos_enviar on storage.objects for insert to authenticated with check (bucket_id = 'arquivos' and public.tem_acesso());
create policy arquivos_apagar on storage.objects for delete to authenticated using (bucket_id = 'arquivos' and public.tem_acesso());

-- Ficha pública do QR: se o arquivo já está no Storage, devolve 'st:<nome>' e o app baixa direto de lá.
create or replace function public.arquivo_publico(tok text, k text) returns text
language plpgsql stable security definer set search_path = public as $function$
declare l jsonb; p jsonb; ok boolean; d text; st text;
begin
  if tok is null or length(tok) < 20 or k is null or k = '' then return null; end if;
  select data into l from docs where col = 'lotes' and data->>'qr' = tok limit 1;
  if l is null then return null; end if;
  select data into p from docs where path = 'pedidos/' || (l->>'ped');
  select exists(select 1 from docs where col = 'arquivos' and data->>'id' = any(public.anexos_da_peca(l, coalesce(p,'{}'::jsonb))) and (data->>'bin' = k or data->>'vis' = k)) into ok;
  if not ok then return null; end if;
  select data->>'st' into st from docs where path = 'mock/' || k;
  if st is not null then return 'st:' || st; end if;
  select string_agg(data->>'d', '' order by (regexp_replace(path, '^.*~', ''))::int) into d from docs where col = 'mockp' and path ~ ('^mockp/' || regexp_replace(k, '([^A-Za-z0-9])', '\\\1', 'g') || '~[0-9]+$');
  return d;
end $function$;
revoke execute on function public.arquivo_publico(text, text) from public;
grant execute on function public.arquivo_publico(text, text) to anon, authenticated;
