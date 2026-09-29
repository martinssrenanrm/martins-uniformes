# Plano em ondas: usabilidade do Martins Pro

**Princípios:**
- Ondas pequenas, cada uma aprovada antes de começar.
- Primeiro, ganhos grandes com risco baixo, principalmente nos **componentes compartilhados**: corrigindo uma vez, vale para todas as telas.
- Prioridade: o que a **Helena usa no celular todo dia** (Fábrica, folha da máquina, Escritório, Pedido). Depois, o que as vendedoras usam no computador.
- Em cada onda:
  - prints de 360×640 e do computador, antes e depois;
  - todos os testes automáticos rodando;
  - Teste da Dona Cida;
  - nota em `NOVIDADES-PARA-EQUIPE.md`.
- Nenhuma função entra ou sai. As funções novas estão separadas no fim (Decisões D1 a D5).

---

## Onda 1: Ler e tocar sem esforço (componentes)
**Risco: baixo.** Nada muda de lugar, nada muda de nome.

| O que muda | Onde aparece |
|---|---|
| Letra mínima de 16px: barra de baixo, abas, sub-abas, selos, números das abas, dicas, subtítulos, legendas | todas as telas |
| Dicas e explicações em cor mais escura (contraste 8:1) | todas |
| Borda dos botões claros mais escura, para o botão "aparecer" | todas |
| Todo alvo com 48px ou mais e 8px de espaço: chips, filtros, "×", Trocar pessoa, dono do setor, botões das faixas, "Como usar", link "editar" | todas |
| Item escolhido com ✓, além da cor (tecido, cor, pessoa, dias, Tem/Falta, filtros) | Novo pedido, folha da máquina, Conferir insumos, Cadastros |
| Chips de pessoa e horários da hora extra quebram linha (sem rolagem escondida) | folha da máquina, Hora extra |
| Sub-abas de Cadastros em 2 linhas, sem cortar "Terceirizados"; cabeçalho dos setores do Escritório sem espremer em 360px | Cadastros, Escritório |

- **Telas:** todas, com efeito maior em Fábrica, Escritório, folha da máquina e Pedido.
- **A equipe precisa saber:** "A letra ficou maior e os botões mais fáceis de acertar. Nada mudou de lugar."

## Onda 2: Nada se perde por um toque errado (confirmações e avisos)
**Risco: baixo.** A pedido seu, o Desfazer longo sai do meio da tela e as ações sem volta ganham confirmação.

| O que muda | Onde |
|---|---|
| **Confirmação na tela**, com o verbo, em: **Entregar pedido**; Restaurar cópia (arquivo e nuvem); todo "Tirar", "×" e "Excluir" de cadastro; "×" do Estoque; Tirar peça no Novo pedido; Sair; Descartar; Parar a hora extra; marcar pessoa "fora" (redistribui tarefas); desmarcar Fichas separadas / Arte preparada; Cliente aprovou; Cancelar uma correção de pedido | Escritório, Pedido, Novo pedido, Cadastros, Menu, Fábrica |
| **Aviso de sucesso novo:** compacto, **no alto da tela**, sem cobrir botões, some em ~4s, com "×". Diz o que aconteceu: "Pronto! Leu começou Pregar gola na Reta 1" | global |
| **Desfazer** fica só nas ações frequentes e sem confirmação (Começar, Terminou, Comprei, Chegou, Levei), **dentro do aviso do alto** | global |
| Erro do Novo pedido: a tela vai até o campo com problema e o marca | Novo pedido, Importar ficha |
| "Começar" fora do horário vira **"Começar em hora extra"** | Fábrica, folha da máquina |

- **A equipe precisa saber:** "Agora o app pergunta antes de entregar, apagar ou restaurar. O aviso de 'Pronto!' aparece em cima e some sozinho."

## Onda 3: As palavras da equipe (vocabulário)
**Risco: médio.** Só textos mudam; lugares e fluxos ficam iguais. Durante esta onda, o termo antigo aparece entre parênteses.

| Hoje | Passa a ser |
|---|---|
| Fora (aba) | **Na rua** |
| Separar as vias / Vias separadas | **Separar fichas e mockups** / **Fichas e mockups separados** |
| Conferir insumos / Insumos conferidos | **Conferir tecidos e aviamentos** |
| Terceirizado(s) | **Prestador(es) de serviço** |
| etapa(s) | **processo(s)** |
| Arremate | **Acabamento** (ver observação) |
| Botões no passado: Separei, Pronta, Aprovada, Enviei, Levei, Chegou | Com verbo claro: **Separei ✓**, **Arte pronta**, **Cliente aprovou**, **Enviei a arte**, **Levei ao prestador**, **As peças voltaram** / **Material chegou** |
| Painel: ranking, pontos, eficiência, ocupação, gargalo, inícios manuais | **Quem mais produziu**, pontos, **rendimento**, **tempo ocupado**, **máquina que segura a produção**, **decidido à mão** |
| Mensagens com "conta Claude", "Chrome", "Nico" | "Sem acesso ao sistema. Chame a Helena." |

> **Observação sobre "Arremate":** os nomes de máquina e de processo ("Mesa de arremate") estão no **cadastro**, e a Helena pode trocar. Na Onda 3 mudo só os textos fixos do app. Se você quiser, troco também os nomes cadastrados, mas isso mexe em dados e peço ok antes.

- **A equipe precisa saber:** um cartão com a tabela acima.

## Onda 4: As três travas do dia a dia (só interface)
**Risco: baixo a médio.**

| O que muda | Onde |
|---|---|
| **"Faltou algum item?"**: campos com nome visível ("Qual item?", "Quantos?"), unidade em 3 botões grandes (unidades / metros / cones), botão **"Pôr na lista de compras"** | Conferir tecidos e aviamentos |
| **Trocar a costureira de máquina:** quem está ocupado aparece com a explicação "Está na Galoneira 1: termine lá ou troque" e um botão **"Ir para a Galoneira 1"** | folha da máquina |
| Cartão da máquina ganha o botão visível **"Mais opções"** (Deu problema, trocar pessoa, reservar) | Fábrica |
| Tarefas e itens "Na rua" ganham o botão **"Ver pedido"** (hoje só tocando no título) | Escritório, Na rua |

- Dividir um processo entre 2 pessoas e pausar sem terminar dependem de **D1/D2**.
- **A equipe precisa saber:** "Para tirar alguém de uma máquina, abra a máquina onde ela está."

## Onda 5: Telas pesadas ficam leves (revelação progressiva)
**Risco: médio.** Nada some; o raro vai para "Mais opções" ou para blocos que abrem e fecham. **Uma tela por vez**, sem mudar visual e fluxo juntos.

| Etapa | Tela | O que muda |
|---|---|---|
| 5a | **Pedido** | Blocos com título ("Antes de cortar", "Material", "Arte de cada personalização", "Peças e processos", "Documentos"). Fica aberto o que tem pendência. **Mapa de processos** atrás de "Ver mapa de processos" |
| 5b | **Folha da máquina** | Visível: trabalho sugerido, quem faz, **Começar** ou **Terminei**. "Reservar", "Outras opções" e "Chegando depois" ficam em "Mais opções" |
| 5c | **Novo pedido, passo 2** | Cada peça mostra primeiro tecido, cor e quantidades. "Outras cores" e "Personalização" abrem quando tocadas. As cores já usadas aparecem primeiro, e o resto fica em "Ver todas as cores" |
| 5d | **Ajustes** | Índice no alto. Em cima: Acessos, Aviso de pedido novo, Cópias. Os raros ficam fechados: Horário, Cálculos, Documentos, Tamanhos e cores, Nomes aprendidos |

- **A equipe precisa saber:** "Alguns blocos agora abrem e fecham. Toque no título para ver."

## Onda 6: Navegação (só se ainda for necessário)
**Risco: alto.** Precisa de aprovação específica e aviso antes.

| Possível mudança | Por quê |
|---|---|
| **Estoque** com atalho fora de Cadastros (ex.: no bloco Material do pedido) | É a coisa mais frequente de Cadastros |
| No celular, **Painel** acessível pela barra para a gestão | Hoje fica só no Menu |
| Hora extra marcável antes do fim do expediente | Hoje só abre fora do horário |

---

## Decisões que dependem de você (funções novas)
Ficam **fora das ondas** até você decidir. Posso detalhar custo e fluxo de cada uma.

| # | Função | Relação com as travas |
|---|---|---|
| D1 | Pausar um processo e passar para outra pessoa ou máquina, registrando quanto já foi feito | trava "mudar costureira de máquina" |
| D2 | Dividir um processo entre 2 pessoas ou máquinas | trava "dividir o mesmo processo" |
| D3 | "Minhas tarefas primeiro" no Escritório, com "Ver de todos" | clareza para Helena, Roger e vendedoras sem esconder nada |
| D4 | Campo de texto em "Outro problema" no conserto | motivo não se perde |
| D5 | "Mostrar senha" no login | conforto |

## Ordem recomendada

**Onda 1 → Onda 2 → Onda 4 → Onda 3 → Onda 5 (a→d) → Onda 6.**

A Onda 4 vem antes do vocabulário porque ataca as travas que vocês já sentem, com risco baixo.
