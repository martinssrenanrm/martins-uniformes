-- 009: vendas do Conta Azul (05/11/2026). Só leitura do Conta Azul: o app nunca escreve lá.
-- Quem grava aqui é a sincronização noturna (GitHub Actions, chave de serviço); o app só lê.
-- Guarda tudo o que a busca de vendas devolve, inclusive orçamentos (EM_ORCAMENTO, ORCAMENTO_ACEITO...):
-- faturamento e conversão saem da mesma tabela. Pode rodar de novo sem problema.

create table if not exists public.ca_vendas (
  id             uuid primary key,          -- id da venda no Conta Azul
  numero         integer,
  data           date,                      -- data da venda (emissão)
  criado_em      timestamp,                 -- horário de São Paulo, como o Conta Azul devolve
  alterado_em    timestamp,
  cliente_id     text,
  cliente_nome   text,
  situacao       text,                      -- nome da situação no Conta Azul
  tipo           text,
  origem         text,
  total          numeric(14, 2),
  dados          jsonb not null,            -- a resposta inteira, para o que ainda não virou coluna
  sincronizado   timestamptz not null default now()
);
create index if not exists ca_vendas_data_idx on public.ca_vendas (data);
create index if not exists ca_vendas_cliente_idx on public.ca_vendas (cliente_id);

alter table public.ca_vendas enable row level security;
drop policy if exists ca_vendas_ler on public.ca_vendas;
create policy ca_vendas_ler on public.ca_vendas for select to authenticated using (public.eh_gestao());
revoke all on public.ca_vendas from anon;
revoke insert, update, delete, truncate on public.ca_vendas from authenticated;
grant select on public.ca_vendas to authenticated;

-- Credenciais de integração (o refresh_token do Conta Azul muda a cada uso e precisa ser guardado na hora).
-- Sem nenhuma política: só a chave de serviço lê e escreve. Nem a gestão vê.
create table if not exists public.integracoes (
  nome        text primary key,
  segredo     text not null,
  atualizado  timestamptz not null default now(),
  info        jsonb
);
alter table public.integracoes enable row level security;
revoke all on public.integracoes from anon, authenticated;
