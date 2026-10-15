-- QR code da etiqueta do corte: quem tem o código secreto da peça (30 letras/números) vê só a ficha dessa peça, sem login.
-- Devolve: cores/tamanhos/marca da empresa, o lote, um resumo do pedido (sem valores, sem materiais, sem contato), o produto,
-- os tipos de máquina, o nome da vendedora e o mockup. Nada de usuários, estoque, clientes ou outros pedidos.
create or replace function public.ficha_publica(tok text) returns jsonb
language plpgsql stable security definer set search_path = public as $function$
declare l jsonb; p jsonb; cfg jsonb; pr jsonb; ti jsonb; ve jsonb; k text; mk text; r jsonb;
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
  k := coalesce(l->>'mockBin', l->>'id');
  select string_agg(data->>'d', '' order by (regexp_replace(path, '^.*~', ''))::int) into mk from docs where col = 'mockp' and path ~ ('^mockp/' || regexp_replace(k, '([^A-Za-z0-9])', '\\\1', 'g') || '~c~[0-9]+$');
  if mk is null then
    select string_agg(data->>'d', '' order by (regexp_replace(path, '^.*~', ''))::int) into mk from docs where col = 'mockp' and path ~ ('^mockp/' || regexp_replace(k, '([^A-Za-z0-9])', '\\\1', 'g') || '~[0-9]+$');
  end if;
  r := jsonb_build_object(
    'config/main', jsonb_build_object('v', 8, 'cores', cfg->'cores', 'cats', cfg->'cats', 'marca', cfg->'marca', 'posicoes', cfg->'posicoes', 'tamPadrao', cfg->'tamPadrao', 'fatorEsp', cfg->'fatorEsp', 'partesExtra', cfg->'partesExtra', 'feriados', cfg->'feriados', 'tecidos', cfg->'tecidos', 'v2610', 1, 'tamEspV', 1, 'avisosV', 1, 'donosV', 1, 'usersV', 2, 'insV', 1, 'nomesV', 1, 'alexV', 1),
    'lotes/' || (l->>'id'), l,
    'pedidos/' || (p->>'id'), jsonb_build_object('id', p->>'id', 'cli', p->>'cli', 'cliente', p->>'cliente', 'ficha', p->>'ficha', 'vendedor', p->>'vendedor', 'chegada', p->'chegada', 'entrega', p->'entrega', 'obs', p->>'obs', 'cancelado', p->'cancelado', 'concluido', p->'concluido', 'materiais', '[]'::jsonb, 'artes', '{}'::jsonb)
  ) || ti;
  if pr is not null then r := r || jsonb_build_object('produtos/' || (l->>'prod'), pr); end if;
  if ve is not null then r := r || jsonb_build_object('pessoas/' || (ve->>'id'), ve); end if;
  return jsonb_build_object('docs', r, 'mock', mk, 'mockId', k);
end $function$;
revoke execute on function public.ficha_publica(text) from public;
grant execute on function public.ficha_publica(text) to anon, authenticated;
