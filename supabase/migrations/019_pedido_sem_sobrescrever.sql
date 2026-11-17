-- 019: gravar pedido sem passar por cima do que outro aparelho acabou de gravar (auditoria, 16/11/2026).
-- doc_update_se só aplica a mudança se o documento no banco ainda for o que o aparelho leu (comparação exata do jsonb).
-- Se outro aparelho gravou antes, devolve false: o app lê de novo, junta as duas versões (mescla3) e tenta outra vez.
-- Sem esta migração o app continua funcionando: lê, junta e grava (com uma janela pequena entre ler e gravar).
-- Pode rodar de novo sem problema. Não muda nenhum dado.
create or replace function public.doc_update_se(p text, patch jsonb, esperado jsonb) returns boolean
language plpgsql security invoker set search_path = public as $$
begin
  update public.docs set data = public.jsonb_junta(data, patch) where path = p and data = esperado;
  return found;
end $$;
revoke execute on function public.doc_update_se(text, jsonb, jsonb) from public, anon;
grant execute on function public.doc_update_se(text, jsonb, jsonb) to authenticated;

-- doc_set_se: o mesmo, para quando a mudança tira um campo do pedido (troca o documento inteiro, também só se ninguém gravou no meio).
create or replace function public.doc_set_se(p text, novo jsonb, esperado jsonb) returns boolean
language plpgsql security invoker set search_path = public as $$
begin
  update public.docs set data = novo where path = p and data = esperado;
  return found;
end $$;
revoke execute on function public.doc_set_se(text, jsonb, jsonb) from public, anon;
grant execute on function public.doc_set_se(text, jsonb, jsonb) to authenticated;
-- doc_criar_se: cria o documento só se ele não existir (pedido apagado em outro aparelho e editado neste: volta, mas nunca por cima de quem criou no meio).
create or replace function public.doc_criar_se(p text, novo jsonb) returns boolean
language plpgsql security invoker set search_path = public as $$
begin
  insert into public.docs(path, data) values (p, novo) on conflict (path) do nothing;
  return found;
end $$;
revoke execute on function public.doc_criar_se(text, jsonb) from public, anon;
grant execute on function public.doc_criar_se(text, jsonb) to authenticated;
-- Voltar atrás: drop function public.doc_update_se(text, jsonb, jsonb); drop function public.doc_set_se(text, jsonb, jsonb); drop function public.doc_criar_se(text, jsonb);
-- (o app passa sozinho para a proteção parcial e avisa em Ajustes › Onde ficam os dados)
