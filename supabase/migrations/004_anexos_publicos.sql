-- Anexos no QR code (pedido de 29/10): quem tem o código secreto da peça vê e baixa os anexos DESSA peça
-- (arte, imagem e programa do bordado das personalizações da peça e os anexos do pedido). Nada de outros arquivos.
create or replace function public.anexos_da_peca(l jsonb, p jsonb) returns text[]
language sql immutable as $f$
  select coalesce(array_agg(distinct v), '{}') from (
    select x->>'arte' v from jsonb_array_elements(coalesce(l->'pers','[]'::jsonb)) x
    union all select x->>'bord' from jsonb_array_elements(coalesce(l->'pers','[]'::jsonb)) x
    union all select a #>> '{}' from jsonb_array_elements(coalesce(l->'pers','[]'::jsonb)) x, jsonb_array_elements(coalesce(x->'arqs','[]'::jsonb)) a
    union all select a #>> '{}' from jsonb_array_elements(coalesce(p->'anexos','[]'::jsonb)) a
  ) t where v is not null and v <> '';
$f$;

create or replace function public.ficha_publica(tok text) returns jsonb
language plpgsql stable security definer set search_path = public as $function$
declare l jsonb; p jsonb; cfg jsonb; pr jsonb; ti jsonb; ve jsonb; k text; mk text; r jsonb; ax jsonb;
begin
  if tok is null or length(tok) < 20 then return null; end if;
  select data into l from docs where col = 'lotes' and data->>'qr' = tok limit 1;
  if l is null then return null; end if;
  select data into p from docs where path = 'pedidos/' || (l->>'ped');
  if p is null then return null; end if;
  select data into cfg from docs where path = 'config/main';
  select data into pr from docs where path = 'produtos/' || (l->>'prod');
  select coalesce(jsonb_object_agg(path, jsonb_build_object('id', data->>'id', 'nome', data->>'nome', 'curto', data->>'curto', 'grupo', data->>'grupo', 'externo', data->'externo', 'i', data->>'i')), '{}') into ti from docs where col = 'tipos';
  select jsonb_build_object('id', data->>'id', 'nome', data->>'nome') into ve from docs where col = 'pessoas' and data->>'id' = p->>'vendedor' limit 1;
  select coalesce(jsonb_object_agg(path, jsonb_build_object('id', data->>'id', 'nome', data->>'nome', 'mime', data->>'mime', 'tam', data->'tam', 'tipo', data->>'tipo', 'ts', data->'ts', 'bin', data->>'bin', 'vis', data->>'vis', 'prev', data->>'prev', 'cli', data->>'cli')), '{}') into ax
    from docs where col = 'arquivos' and data->>'id' = any(public.anexos_da_peca(l, p));
  k := coalesce(l->>'mockBin', l->>'id');
  select string_agg(data->>'d', '' order by (regexp_replace(path, '^.*~', ''))::int) into mk from docs where col = 'mockp' and path ~ ('^mockp/' || regexp_replace(k, '([^A-Za-z0-9])', '\\\1', 'g') || '~c~[0-9]+$');
  if mk is null then
    select string_agg(data->>'d', '' order by (regexp_replace(path, '^.*~', ''))::int) into mk from docs where col = 'mockp' and path ~ ('^mockp/' || regexp_replace(k, '([^A-Za-z0-9])', '\\\1', 'g') || '~[0-9]+$');
  end if;
  r := jsonb_build_object(
    'config/main', jsonb_build_object('v', 8, 'cores', cfg->'cores', 'cats', cfg->'cats', 'marca', cfg->'marca', 'posicoes', cfg->'posicoes', 'tamPadrao', cfg->'tamPadrao', 'fatorEsp', cfg->'fatorEsp', 'partesExtra', cfg->'partesExtra', 'feriados', cfg->'feriados', 'tecidos', cfg->'tecidos', 'v2610', 1, 'tamEspV', 1, 'avisosV', 1, 'donosV', 1, 'usersV', 2, 'insV', 1, 'nomesV', 1, 'alexV', 1),
    'lotes/' || (l->>'id'), l,
    'pedidos/' || (p->>'id'), jsonb_build_object('id', p->>'id', 'cli', p->>'cli', 'cliente', p->>'cliente', 'ficha', p->>'ficha', 'vendedor', p->>'vendedor', 'chegada', p->'chegada', 'entrega', p->'entrega', 'obs', p->>'obs', 'cancelado', p->'cancelado', 'concluido', p->'concluido', 'evento', p->'evento', 'anexos', coalesce(p->'anexos','[]'::jsonb), 'materiais', '[]'::jsonb, 'artes', '{}'::jsonb)
  ) || ti || ax;
  if pr is not null then r := r || jsonb_build_object('produtos/' || (l->>'prod'), pr); end if;
  if ve is not null then r := r || jsonb_build_object('pessoas/' || (ve->>'id'), ve); end if;
  return jsonb_build_object('docs', r, 'mock', mk, 'mockId', k);
end $function$;

-- O arquivo em si (pedaços guardados em mockp/<bin>~N). Só entrega se o arquivo for anexo da peça daquele código.
create or replace function public.arquivo_publico(tok text, k text) returns text
language plpgsql stable security definer set search_path = public as $function$
declare l jsonb; p jsonb; ok boolean; d text;
begin
  if tok is null or length(tok) < 20 or k is null or k = '' then return null; end if;
  select data into l from docs where col = 'lotes' and data->>'qr' = tok limit 1;
  if l is null then return null; end if;
  select data into p from docs where path = 'pedidos/' || (l->>'ped');
  select exists(select 1 from docs where col = 'arquivos' and data->>'id' = any(public.anexos_da_peca(l, coalesce(p,'{}'::jsonb))) and (data->>'bin' = k or data->>'vis' = k)) into ok;
  if not ok then return null; end if;
  select string_agg(data->>'d', '' order by (regexp_replace(path, '^.*~', ''))::int) into d from docs where col = 'mockp' and path ~ ('^mockp/' || regexp_replace(k, '([^A-Za-z0-9])', '\\\1', 'g') || '~[0-9]+$');
  return d;
end $function$;

revoke execute on function public.anexos_da_peca(jsonb, jsonb) from public;
revoke execute on function public.ficha_publica(text) from public;
revoke execute on function public.arquivo_publico(text, text) from public;
grant execute on function public.ficha_publica(text) to anon, authenticated;
grant execute on function public.arquivo_publico(text, text) to anon, authenticated;
