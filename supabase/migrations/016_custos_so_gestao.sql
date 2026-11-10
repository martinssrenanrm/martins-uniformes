-- 016: o custo dos produtos (documentos custos/<id do produto>) é só da gestão: ler, criar, mudar e apagar.
-- Só fecha; não abre nada. Pode rodar de novo sem quebrar nada.
-- Por quê: custo é sensível (margem). O produto (produtos/*) é lido por todos para montar o roteiro, por isso o custo mora à parte.
-- O app não põe custos/* nas cópias de segurança (backup/*, lidas por todos); a história do custo fica nos eventos (só gestão lê, 007).
-- O sinal (docs_sinal) continua mostrando que custos/<id> mudou, sem o valor: quem não é da gestão tenta ler e não recebe nada.

alter policy docs_ler on public.docs
  using (public.tem_acesso() and (col <> 'custos' or public.eh_gestao()));
alter policy docs_criar on public.docs
  with check (public.tem_acesso() and (col not in ('usuarios', 'custos') or public.eh_gestao()));
alter policy docs_mudar on public.docs
  using (public.tem_acesso() and (col not in ('usuarios', 'custos') or public.eh_gestao()))
  with check (public.tem_acesso() and (col not in ('usuarios', 'custos') or public.eh_gestao()));
alter policy docs_apagar on public.docs
  using (public.tem_acesso() and (col not in ('usuarios', 'custos') or public.eh_gestao()));
