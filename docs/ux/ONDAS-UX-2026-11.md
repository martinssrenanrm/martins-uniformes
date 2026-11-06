# Ondas de usabilidade de 11/2026: perfis, tela Hoje, sugestões e celular

Feito em 05/11/2026, numa branch separada (`claude/ux-perfis-celular-f4ded2`), em 5 commits locais, um por onda.
**Nada foi publicado, nada foi enviado ao GitHub e nada foi aplicado no banco.**

## O pedido e como ele foi lido

O Renan pediu: usabilidade e experiência melhores, visão de design para celular, acessos e permissões pelas responsabilidades, funções restritas pelo nível de permissão, visão hierárquica, "inteligência" no app, e um app mais fluido e motivador.

Quase tudo isso já estava no plano do projeto (ARQUITETURA §7 Q1–Q12, ROTEIRO passos 1 e 4). A leitura foi:

| O pedido | Virou |
|---|---|
| Acessos e permissões pelas responsabilidades; restrição por nível | **Onda 1**: cada perfil vê e faz o que é dele. A regra é escolha de cada fábrica, com padrão neutro, e se repete no banco |
| Visão hierárquica das coisas | **Onda 2**: a primeira tela de cada perfil é a **Hoje**, com o mais urgente primeiro |
| Inteligência no app | **Onda 3**: sugestões calculadas pelo próprio app, com o porquê e um botão. Nada de serviço de IA, nada de chave, custo zero |
| Celular primeiro, fluido | **Onda 4**: voltar do Android, aba lembrada, Desfazer onde faltava, confirmação única, varredura de cortes em 360px |
| Motivador | **Onda 5**: quadro do que a produção fez hoje e na semana, sem ranking, pontos ou medalhas |

Vale para tudo: o chão de fábrica não usa o app (decisão de 05/11); quem registra é a encarregada. Nenhuma função de negócio foi tirada.

## Onda 1: cada um vê o que é da sua responsabilidade

**Risco de estranhamento: médio** (para o Escritório, dois botões somem; para a gestão, nada muda).

- O Escritório não entra em **Cadastros** nem no **Painel do gestor**, nem pelos atalhos ("Ver cadastro da equipe", "Ir para fornecedores", links do painel). Antes, alguns atalhos abriam.
- Três escolhas por fábrica em **Cadastros › Ajustes › Acessos ao sistema › O que o Escritório pode fazer**:

  | Escolha | Padrão |
  |---|---|
  | Entregar pedido ao cliente (e desfazer a entrega) | Escritório pode |
  | Cancelar pedido (e voltar um cancelado) | só a gestão |
  | Corrigir o que a produção já fez (voltar processo, mudar horário, cancelar um começo) | só a gestão |

- Sem permissão, o botão some e a tela diz "chame quem é da gestão (nomes)". Se um botão escapasse, o toque é recusado com aviso.
- **No banco:** `supabase/migrations/011_permissoes_responsabilidade.sql` repete a regra (gatilho na tabela `docs`). Os 15 minutos do Desfazer continuam livres, e o que é do prestador também. **Não aplicada.** Testada num Postgres de bolso (PGlite): 10 verificações, inclusive rodar duas vezes.
- Achado no caminho: no gatilho "antes de gravar", a coluna `col` ainda vem vazia; a 011 usa o `path`. As migrações anteriores (003) não têm esse problema, porque usam `col` nas regras de acesso, onde ela já está calculada.
- Prints: `prints/ondas-2026-11/antes/escritorio-pedido.png`, `escritorio-corrigir-etapa.png` e `gestao-acessos.png` → os mesmos nomes em `onda-1-depois/`.
- Teste: `tests/permissoes.test.js`.

## Onda 2: tela Hoje

**Risco de estranhamento: alto.** A barra de baixo muda e o app abre em outra tela. **Precisa da sua aprovação.**

- O app abre em **Hoje**, com "Bom dia, Helena" e a data.
- **Gestão**, nesta ordem:
  1. pedidos com risco de atraso, com a barra do quanto já foi feito;
  2. o que precisa ir para a rua (prestador atrasado, compras, pacotes para levar);
  3. o que pôr em cada máquina livre;
  4. tarefas do escritório;
  5. vendas da semana, com o botão "Ver faturamento", que abre o bloco da outra frente sem mexer nele.
- **Escritório:** **as suas tarefas primeiro**, com os mesmos botões do Escritório; depois, quantas estão com outras pessoas; depois, os pedidos com risco de atraso.
- **Barra da gestão:** Hoje · Fábrica · Pedidos · Novo · **Mais**. Painel do gestor, Cadastros e Empresas ficam dentro de **Mais**. **Isso tira de lugar dois botões usados todo dia.**
- **Barra do Escritório:** Hoje · Fábrica · Pedidos · Novo.
- **Volta atrás com um toque:** é o módulo "Tela Hoje" em Cadastros › Ajustes › Partes do app. Desligado, o app abre na Fábrica e a barra volta a ser a de antes (o teste confere).
- Bug antigo corrigido: no celular do Escritório, o botão **Novo** saía cortado na borda.
- Prints: `antes/gestao-fabrica.png` e `antes/escritorio-fabrica.png` (a primeira tela de antes) → `onda-2-depois/gestao-hoje.png`, `escritorio-hoje.png` e `gestao-mais.png`.
- Teste: `tests/hoje.test.js`. Quatro testes antigos contavam com a abertura na Fábrica; agora eles dizem a tela que querem.

## Onda 3: sugestões para agora

**Risco de estranhamento: baixo** (só acrescenta, no alto da Hoje).

Sete regras sobre o que já está no app, cada uma com o porquê e um botão:

| Regra | Exemplo | Para quem |
|---|---|---|
| Vence esta semana e está abaixo da metade | "2 pedidos vencem esta semana e estão abaixo da metade" | gestão e escritório |
| O mesmo item falta em 2 ou mais pedidos | "Zíper 20cm falta em 3 pedidos. Comprando de uma vez, libera todos" | gestão e escritório |
| Tarefa do escritório que trava o corte de pedido em risco | "Separar as vias: Clínica Vitta está atrasando" | gestão e escritório |
| Próxima máquina | "Próximo para a Overlock 2: Pregar gola. A Rosa está livre e sabe fazer" | gestão |
| Fila (onde a produção segura) / máquina livre sem ninguém que saiba | "5 trabalhos esperando Galoneira" | gestão |
| Prestador atrasado | "1 pacote passou do prazo no prestador: vale ligar para cobrar" | gestão e escritório |
| Pronto e não entregue | "Transportes Rota Sul está pronto esperando entrega" | gestão e escritório |

- Aparecem até 3, das mais urgentes para as menos; as outras ficam em "Ver mais".
- O teste confere que nada sai do aparelho.
- Prints: `onda-3-depois/`. Teste: `tests/sugestoes.test.js`.

## Onda 4: celular primeiro

**Risco de estranhamento: baixo.** Nenhum botão mudou de lugar.

- **Voltar do Android (Q5):**
  - fecha a confirmação, a janelinha ou a folha;
  - numa aba que não é a primeira, volta para a Hoje;
  - no Novo pedido, volta um passo sem perder o que foi escrito;
  - só sai do app quando já está na primeira tela, sem nada aberto.
- **Aba lembrada (Q6):** a Fábrica abre na última aba usada no aparelho. Na primeira vez, o Escritório abre no Escritório.
- **Desfazer onde faltava (Q4):** cancelar pedido, pausar, dividir, conserto, marcar e parar hora extra, "Enviei a arte".
- **Confirmação única (Q12):** tirar arquivo usado em pedido e restaurar cópia agora perguntam na tela, e não mais com "toque de novo". O cancelar pedido manteve o quadro próprio, porque pede o motivo.
- **Varredura em 360×640** (Hoje, Máquinas, Fora, Escritório, Pedidos, Pedido, folha da máquina, Painel, Estoque): nada passa da largura. O único alvo pequeno era o nome da empresa no alto do Pedido, que foi corrigido para 48px.
- Prints: `onda-4-depois/`. Teste: `tests/celular.test.js`.

## Onda 5: o que a produção fez hoje

**Risco de estranhamento: baixo** (só acrescenta).

- Quadro verde na Hoje:
  - "15 processos terminados hoje", contando o que foi marcado no app;
  - meta do dia da produção, quando há equipe com horário;
  - na semana: processos terminados e pedidos entregues.
- Não cita nem compara pessoas. Não tem pontos nem medalhas.
- Fica **depois** das sugestões, para o urgente vir primeiro.
- Prints: `onda-5-depois/`. Teste: `tests/feito-hoje.test.js`.

## Testes

- `NODE_PATH=$(npm root -g) bash tests/rodar-todos.sh` passou **verde ao fim de cada onda** (39 arquivos).
- São 5 testes novos.
- A parte de banco de `tests/permissoes.test.js` só roda com o PGlite instalado (`PGLITE=<pasta>`). No GitHub ela é pulada e avisa.
- `site/` **não** foi gerado, porque isso é passo de publicação.
- A FAQ ganhou 9 perguntas, e `tests/ajuda.test.js` foi atualizado.

## O que precisa do Renan

1. **Aprovar a Onda 2 (risco alto):** a tela Hoje como primeira tela e Gestor/Cadastros dentro de "Mais". Se preferir só a Hoje sem mexer na barra, dá para manter "Hoje" e deixar Gestor/Cadastros na barra, mas são 6 botões, acima do limite de 5 do guia. É uma decisão sua.
2. **Aprovar o padrão das permissões:** "cancelar pedido" e "corrigir o que a produção já fez" passam a ser **só da gestão** na Martins. Se hoje alguma vendedora cancela pedido, ligue a escolha em Ajustes › Acessos antes de publicar.
3. **Aplicar a migração 011** no Supabase, fora do expediente, **depois** de publicar o app novo (o app antigo não esconde os botões, e o banco recusaria). Ordem: publicar → aplicar 011 → conferir um cancelamento feito pelo Escritório (deve recusar) e um pela gestão (deve passar).
4. **Juntar com a frente do Faturamento:** as duas branches mexem na FAQ e em `NOVIDADES-PARA-EQUIPE.md` (as duas acrescentam no fim). Sem conflito no código do Faturamento: esta branch só tem um botão que leva até ele.
5. **Publicar**, com a nota pronta em `NOVIDADES-PARA-EQUIPE.md` (seção "RASCUNHO").

## Ficou de fora (anotado)

- **Cadastros no banco:** o Escritório ainda pode gravar em `pessoas`, `tipos`, `produtos` e `forn` chamando o banco direto. A tela não deixa. Fechar por campo exige cuidado, porque o Escritório marca quem saiu (`pessoas.disp`).
- **Meta por setor** (ROTEIRO passo 1, "pessoas × horas × tempo padrão" por setor): a Onda 5 mostra a meta da produção inteira. Por setor fica para a próxima fase.
- **Letra do sistema em 130%:** a medida foi feita com a letra padrão. Falta conferir num Android real com a letra aumentada.
- **Teste no celular de verdade** com a Helena: os prints são do navegador em 360×640.
