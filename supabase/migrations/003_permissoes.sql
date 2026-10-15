-- Permissões no banco (não só na tela):
-- 1) Só quem é da gestão cria, muda ou apaga acessos (documentos usuarios/*).
--    Antes, qualquer pessoa com acesso podia se dar perfil de gestão chamando o banco direto.
-- 2) Fecha as portas temporárias de importação/exportação usadas na migração.
-- 3) Função de atualização parcial só para quem está logado (as regras da tabela continuam valendo).
create or replace function public.eh_gestao() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.docs
    where col = 'usuarios' and data->>'perfil' = 'gestao'
      and lower(data->>'email') = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;
revoke execute on function public.eh_gestao() from public, anon;
grant execute on function public.eh_gestao() to authenticated;

alter policy docs_criar  on public.docs
  with check (public.tem_acesso() and (col <> 'usuarios' or public.eh_gestao()));
alter policy docs_mudar  on public.docs
  using (public.tem_acesso() and (col <> 'usuarios' or public.eh_gestao()))
  with check (public.tem_acesso() and (col <> 'usuarios' or public.eh_gestao()));
alter policy docs_apagar on public.docs
  using (public.tem_acesso() and (col <> 'usuarios' or public.eh_gestao()));

revoke execute on function public.importar_docs(text, jsonb) from public, anon, authenticated;
revoke execute on function public.exportar_docs(text, text[]) from public, anon, authenticated;

revoke execute on function public.doc_update(text, jsonb) from public, anon;
grant execute on function public.doc_update(text, jsonb) to authenticated;
