-- 008: página pública do QR (02/11/2026).
-- 1) Não mostra mais o preço unitário (vinha do Conta Azul) nem o registro das etapas (quem fez e quando): a etiqueta vai para o prestador.
-- 2) Mockup que já foi para o Storage (006): devolve 'st:<nome>' e o app baixa direto de lá. Sem isso, a ficha do QR abriria sem o mockup.
-- Pode rodar de novo sem problema.
create or replace function public.ficha_publica(tok text) returns jsonb
language plpgsql stable security definer set search_path = public as $function$
declare l jsonb; p jsonb; cfg jsonb; pr jsonb; ti jsonb; ve jsonb; k text; mk text; r jsonb; ax jsonb; st text;
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
  -- mockup já no Storage (006): devolve só o nome; o app baixa direto de lá
  select data->>'st' into st from docs where path = 'mock/' || k || '~c';
  if st is null then select data->>'st' into st from docs where path = 'mock/' || k; end if;
  if st is not null then mk := 'st:' || st; end if;
  if mk is null then
  select string_agg(data->>'d', '' order by (regexp_replace(path, '^.*~', ''))::int) into mk from docs where col = 'mockp' and path ~ ('^mockp/' || regexp_replace(k, '([^A-Za-z0-9])', '\\\1', 'g') || '~c~[0-9]+$');
  if mk is null then
    select string_agg(data->>'d', '' order by (regexp_replace(path, '^.*~', ''))::int) into mk from docs where col = 'mockp' and path ~ ('^mockp/' || regexp_replace(k, '([^A-Za-z0-9])', '\\\1', 'g') || '~[0-9]+$');
  end if;
  end if;
  r := jsonb_build_object(
    'config/main', jsonb_build_object('v', 8, 'cores', cfg->'cores', 'cats', cfg->'cats', 'marca', cfg->'marca', 'posicoes', cfg->'posicoes', 'tamPadrao', cfg->'tamPadrao', 'fatorEsp', cfg->'fatorEsp', 'partesExtra', cfg->'partesExtra', 'feriados', cfg->'feriados', 'tecidos', cfg->'tecidos', 'v2610', 1, 'tamEspV', 1, 'avisosV', 1, 'donosV', 1, 'usersV', 2, 'insV', 1, 'nomesV', 1, 'alexV', 1),
    'lotes/' || (l->>'id'), (l - 'preco') || jsonb_build_object('steps', '{}'::jsonb),
    'pedidos/' || (p->>'id'), jsonb_build_object('id', p->>'id', 'cli', p->>'cli', 'cliente', p->>'cliente', 'ficha', p->>'ficha', 'vendedor', p->>'vendedor', 'chegada', p->'chegada', 'entrega', p->'entrega', 'obs', p->>'obs', 'cancelado', p->'cancelado', 'concluido', p->'concluido', 'evento', p->'evento', 'anexos', coalesce(p->'anexos','[]'::jsonb), 'materiais', '[]'::jsonb, 'artes', '{}'::jsonb)
  ) || ti || ax;
  if pr is not null then r := r || jsonb_build_object('produtos/' || (l->>'prod'), pr); end if;
  if ve is not null then r := r || jsonb_build_object('pessoas/' || (ve->>'id'), ve); end if;
  return jsonb_build_object('docs', r, 'mock', mk, 'mockId', k);
end $function$;
revoke execute on function public.ficha_publica(text) from public;
grant execute on function public.ficha_publica(text) to anon, authenticated;
