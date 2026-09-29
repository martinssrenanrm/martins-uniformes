# Auditoria de usabilidade: Martins Pro

**Como foi feita:**
- **Base:** app de 29/09/2026 (artefato v54).
- **Guia usado:** `GUIA-USABILIDADE.md`.
- **Medidas e fotos:** celular de 360×640, com os dados de exemplo (`prints/antes/`).

**Legenda:**

| Gravidade | Quer dizer |
|---|---|
| 🔴 **Impede** | a pessoa não consegue fazer, ou faz errado sem perceber |
| 🟠 **Atrapalha** | consegue, mas com esforço, dúvida ou risco |
| 🟡 **Incomoda** | cansa ou confunde um pouco |

- **Risco** é o risco de estranhamento da correção: baixo, médio ou alto.
- **Frequência** considera o uso real: a Helena no celular na fábrica, e Roger e vendedoras no computador.

---

## PARTE A: Problemas que aparecem em muitas telas (corrigir uma vez resolve em todo lugar)

| # | Problema | Por que atrapalha a Dona Cida | Grav. | Correção sugerida | Risco |
|---|---|---|---|---|---|
| A1 | **Letra de 13px** na barra de baixo, nos números das abas, nas abas do Painel e nas sub-abas de Cadastros (celular) | Com vista cansada, é o texto que ela usa para se localizar e é o menor da tela | 🟠 | Mínimo de 16px. Na barra de baixo, 15-16px com ícone de 28px (cabe em 360px). Sub-abas de Cadastros em 2 linhas de 3 | baixo |
| A2 | **Dicas e explicações em 15px e cinza claro** (`.dica`, `.sub-l`, `.lido`, `small`), com contraste de ~4,3:1 sobre o fundo | É onde o app explica as coisas, e é justamente o texto mais difícil de ler | 🟠 | 16px e cor `--ink2` (8:1) | baixo |
| A3 | **Borda dos botões claros quase invisível** (`--line`, 1,3:1): Voltar, Tirar, chips, filtros, botões neutros | Com vista cansada, o botão parece texto solto; ela não sabe onde tocar | 🟠 | Borda mais escura (≥3:1) e um pouco mais grossa nos botões claros | baixo |
| A4 | **Alvos abaixo de 48px:** `.x` (~43), chips `.pchip`/`.depc` (38-46), "×" dos chips (~30), responsável da tarefa (~34), dono do setor, botões das faixas no celular (~37), botão Desfazer (~45) | Com pressa ou mão ocupada, ela erra o toque; o "×" ao lado do nome apaga o item errado | 🟠 | Tudo com pelo menos 48px e 8px de espaço. O "×" vira área de 48px | baixo |
| A5 | **Escolhido = só cor e borda** (chips de tecido, cor, pessoa, dias, filtros, "Tem/Falta") | Ela não percebe o que ficou marcado, principalmente com a luz da fábrica | 🟠 | Item escolhido ganha ✓ e fundo mais forte | baixo |
| A6 | **Aviso de sucesso com Desfazer no meio da tela**, por 9s, cobrindo botões | Você relatou que isso atrapalha a navegação. E ela não sabe se precisa fazer algo com ele | 🟠 | Aviso de sucesso **compacto no alto da tela**, sem cobrir botões, some em ~4s, com "×" para fechar. O Desfazer fica só onde não há confirmação | médio |
| A7 | **Ações sem volta não pedem confirmação:** Entregue (encerra o pedido), Restaurar de arquivo (troca tudo), "×" do Estoque, "Tirar" (máquina, pessoa, produto, acesso), Sair, Descartar | Um toque errado desfaz trabalho de dias. É o medo que faz ela voltar para o papel | 🔴 | Confirmação na própria tela, com o verbo: "Entregar o pedido da Clínica Vitta? [Sim, entregar] [Não]" | baixo |
| A8 | **Remoções que nem mostram Desfazer:** tirar aviamento, modelo, personalização padrão, categoria, peso, motivo, posição, apelido, termo, logo, pausa, item do estoque, "−" até zero | Não há como voltar atrás | 🔴 | Entram na confirmação da A7 | baixo |
| A9 | **Gestos escondidos:** o cartão da máquina inteiro abre a folha (é lá que fica "Deu problema"); o título da tarefa abre o pedido; filtros e horários rolam para o lado sem aviso | Ela não descobre sozinha. "Deu problema" fica invisível | 🟠 | Botão visível "Abrir" ou "Mais" no cartão e na tarefa. Filtros e horários quebram linha em vez de rolar | baixo (botões); médio (filtros) |
| A10 | **Termos que a equipe não usa:** "vias", "insumos", "terceirizado", "etapa", "arremate", "Fora", "mockup" (este a equipe usa) | Ela tem que traduzir cada palavra | 🟠 | Usar os termos da equipe (Guia, seção 3). Durante a transição, o termo antigo aparece entre parênteses | médio |
| A11 | **Mensagens que citam "conta Claude", "Chrome", "Nico", "nuvem", "aparelho"** | Palavras de sistema; ela não sabe o que fazer | 🟡 | "Sem acesso ao sistema. Chame a Helena." (ou quem a gestão definir) | baixo |
| A12 | **Botão de ação em tempo passado** ("Separei", "Pronta", "Aprovada", "Chegou") | Parece uma situação, não um botão. Não fica claro se já foi feito | 🟡 | Verbo do que acontece: "Marcar como separado", "Arte pronta", "Cliente aprovou" (ou manter o curto com ✓ e "Marcar…") | médio |
| A13 | **Campos com rótulo só no placeholder:** buscas, "Nome do insumo", "Qtd.", "Nome do tecido/cor", "Outra parte", "Outro lugar", pausas, novo acesso | Quando ela começa a digitar, o nome do campo some | 🟠 | Rótulo visível acima | baixo |
| A14 | **Listas suspensas (`<select>`) com poucas opções:** unidade (unidades/metros/cones), perfil do acesso, posição da personalização, selects da folha do produto | Lista suspensa pequena é difícil de abrir e de ler no Android | 🟡 | Botões grandes | baixo |
| A15 | **Erro só no fim da página** (passo 2 do Novo pedido) | Ela toca em Próximo e não vê onde está o problema | 🟠 | Levar a tela até o campo com problema e marcar o campo | baixo |
| A16 | **Ícone "✎" solto e ícones sem texto** (zoom "⤢", "›") | Não se sabe o que fazem | 🟡 | Texto junto ("Corrigir", "Tamanho normal") | baixo |

---

## PARTE B: Tela por tela

### B1. Fábrica › Máquinas (Helena, o dia todo)

| Problema | Por que atrapalha | Grav. | Sugestão | Risco |
|---|---|---|---|---|
| **Deu problema** e **trocar pessoa ou trabalho** só existem dentro da folha, que abre ao tocar no cartão (sem indicação) | Ela não sabe que o cartão abre | 🟠 | Botão secundário visível no cartão: "Mais opções" | baixo |
| Selos "PRÓXIMO"/"Reservado" e "+1 na fila" com 14px em maiúsculas | Informação importante em letra miúda | 🟡 | 16px, sem maiúsculas | baixo |
| 6,7 telas de rolagem com 8+ máquinas; as paradas ficam no fim, com botões de 16px | Cansa. As paradas somem | 🟡 | Ver Onda 5: resumo "N para começar" leva direto às máquinas que pedem ação | médio |
| "Livres:" com nomes que não se tocam | Parece clicável | 🟡 | Deixar claro que é só informação (sem borda) | baixo |
| Começar fora do horário liga a hora extra sozinho, e só o aviso de 9s conta | Surpresa na hora de pagar | 🟠 | O botão diz "Começar em hora extra" quando está fora do horário | baixo |

### B2. Folha da máquina (Helena, várias vezes por hora)

| Problema | Por que atrapalha | Grav. | Sugestão | Risco |
|---|---|---|---|---|
| **Trocar a costureira de máquina:** quem está trabalhando aparece apagado "(na Galoneira 1)", sem explicar como liberar. O único jeito é **Terminou**, que registra o processo como pronto | **Trava relatada.** Ela registra errado para conseguir mudar | 🔴 | Parte de interface: explicar no chip "Está na Galoneira 1. Para trazer, termine lá primeiro." Parte de função: **"Trocar de máquina sem terminar"** não existe (ver Decisões) | baixo / **decisão** |
| **Dividir um processo entre 2 pessoas** não existe | **Trava relatada** | 🔴 | É função nova (ver Decisões) | **decisão** |
| Folha densa: sugestão, pessoas, reserva, "Opções para esta máquina", "Chegando depois" (até ~15 itens) | Depois de terminar uma peça, ela só quer o próximo | 🟠 | Deixar visível: trabalho sugerido, quem faz e Começar. "Reservar", "Outras opções" e "Chegando depois" ficam em "Mais opções" | médio |
| Chips de pessoa rolam para o lado sem barra | Nomes escondidos | 🟠 | Quebrar linha | baixo |
| "Fora da ordem", "sugerido", "reservado para", "Espera:" | Jargão | 🟡 | "Ainda falta o processo X. Só comece se as peças já estiverem aqui." | médio |
| Terminou não confirma | Toque errado marca pronto | 🟠 | Continua sem confirmação (é o gesto mais usado). O aviso "Pronto! Fulana terminou Pregar gola" fica claro e o "Desfazer" fica visível **dentro da folha**, sem cobrir a tela | baixo |

### B3. Deu problema (conserto)
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| "Outro problema" não abre campo; o motivo se perde | 🟡 | *(abrir campo = função nova, ver Decisões)* | decisão |
| Passo 3 "Voltar para qual processo?" é abstrato e já vem escolhido sem avisar | 🟡 | "Já escolhemos X (o mais provável). Toque em outro se for diferente." | baixo |
| O passo 1 avança sozinho | 🟡 | Manter (rápido) e mostrar o escolhido no alto dos passos 2 e 3 | baixo |

### B4. Hora extra
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| Os horários (até 11) rolam para o lado, escondidos | 🟠 | Grade de botões em 3 colunas | baixo |
| Só se abre fora do horário | 🟡 | *(abrir antes = mudança de fluxo, onda final, se necessário)* | alto |
| "Parar a hora extra agora" sem confirmação | 🟡 | Confirmação curta | baixo |

### B5. Fábrica › Fora ("Na rua") (Helena e Roger, diário)
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| Nome "Fora" | 🟠 | "Na rua" | médio |
| "Chegou" aparece com o mesmo nome para material e para peças do prestador | 🟡 | "As peças voltaram" / "Material chegou" | médio |
| Tocar no texto abre o pedido (escondido) | 🟡 | Botão "Ver pedido" | baixo |

### B6. Fábrica › Escritório (Helena, Roger, vendedoras, várias vezes por dia)
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| Em 360px o cabeçalho do setor espreme ("1 / pendente") e o botão do responsável corta ("Automát…") | 🟠 | Cabeçalho em 2 linhas: nome e contagem em cima, responsável embaixo | baixo |
| **Entregue encerra o pedido com 1 toque** | 🔴 | Confirmação (A7) | baixo |
| Chip do responsável com 15px e ~34px de altura; "ninguém tem esta função" com 13px | 🟠 | 48px / 16px (A1, A4) | baixo |
| Botões no passado (Separei, Pronta, Aprovada, Enviei, Levei, Chegou) | 🟡 | A12 | médio |
| "Separar as vias", "Conferir insumos", "Levar para/Buscar no terceirizado" | 🟠 | "Separar fichas e mockups", "Conferir tecidos e aviamentos", "Levar ao prestador" | médio |
| **Quem vê o quê:** a vendedora vê as tarefas da Logística, o Roger vê as da Artes. Tudo misturado | 🟡 | Ver Decisões ("Minhas tarefas primeiro") | decisão |
| "No escritório agora": tocar marca a pessoa como fora e **redistribui as tarefas sem avisar** | 🟠 | Confirmação: "Marcar Laiara como fora? As 3 tarefas dela vão para outras pessoas." | baixo |

### B7. Pedidos (lista) (todos, várias vezes por dia)
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| Busca sem rótulo e sem botão de limpar | 🟡 | Rótulo "Buscar pedido" e botão "Limpar" | baixo |
| "Ordenar por" com 3 botões e inversão escondida (tocar de novo) | 🟡 | Manter os 3; mostrar a seta e o texto "(toque de novo para inverter)" | baixo |
| Barrinha de progresso de cada peça sem número | 🟡 | "60% feito" ao lado | baixo |
| "Falta: vias, arte, material" | 🟡 | Termos da equipe | médio |

### B8. Pedido (folha) (vendedoras, Helena, Roger, várias vezes por dia)
**É a tela mais poluída do app:** 82 alvos, 10 telas de rolagem, 153 textos menores que 16px.

| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| Tudo aberto de uma vez: cabeçalho, Antes de cortar, material, arte por personalização (posição, tamanho, pôr arte, bordado, baixar, trocar, Enviei), mockups, peças, legenda, mapa de processos | 🟠 | Blocos com título que abrem e fecham. Fica aberto só o bloco que tem pendência. O mapa de processos vai para "Ver mapa de processos" | médio |
| **Entregar** sem confirmação | 🔴 | A7 | baixo |
| **Desmarcar** "Vias separadas" ou "Arte preparada" não avisa; "Arte preparada" desfaz a aprovação em silêncio | 🟠 | Confirmação ao desmarcar: "Desmarcar? A aprovação da arte também volta." | baixo |
| "Material" parece botão e não é | 🟡 | Visual de informação, ou leva ao bloco de material | baixo |
| "Enviei" fica apagado sem explicar | 🟡 | Texto: "Libera quando o cliente aprovar a arte" | baixo |
| Mapa de processos: nós de 14px, rolagem para o lado dentro da rolagem, só cor | 🟠 | Continua existindo, atrás de "Ver mapa de processos". Legenda com texto e ícone | médio |
| Botões do cabeçalho (Corrigir, Pedido, PDF de produção) + selo da aprovação misturados | 🟡 | Ação principal do momento em destaque; os documentos juntos em "Documentos" | médio |
| "PDF de produção", "mockup", "vias" | 🟡 | "Fichas de produção (PDF)" | médio |

### B9. Novo pedido e Corrigir pedido (vendedoras e Helena, diário)
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| **Passo 2: mais de 40 alvos por peça**, 8 telas de rolagem, tudo aberto (tecido, modelo, cor, 30 cores, outras cores, personalização, tamanhos) | 🟠 | Cada peça mostra primeiro tecido, cor e quantidades. "Outras cores" e "Personalização" ficam como botões que abrem. A grade de cores mostra as usadas antes e depois "Ver todas as cores" | médio |
| **Erro só no fim** | 🟠 | A15 | baixo |
| − e + andam de 10 em 10 sem dizer | 🟡 | "−10" e "+10" escritos no botão | baixo |
| "Tirar" peça sem confirmação | 🟠 | A7 | baixo |
| "Nova cor" é gravada no cadastro mesmo se o pedido for cancelado | 🟡 | *(regra de dados, fica como está)* | — |
| Nota do passo 4 com "consumo", "Cadastros → Ajustes" | 🟡 | Tirar a nota da vista (fica em "Como é calculado") | baixo |
| Corrigir: "Cancelar" no passo 1 descarta sem perguntar | 🟠 | "Sair sem salvar a correção?" | baixo |

### B10. Importar ficha (vendedoras, diário)
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| ✓/⚠ com 14px e só cor | 🟠 | 16px com texto "Confirmado" / "Confira" | baixo |
| Todos os produtos e todas as cores como botões (dezenas) | 🟡 | Sugestão em destaque; o resto em "Ver todos" | médio |
| Quantidades com `type=number` sem `inputmode` | 🟡 | Teclado numérico | baixo |
| O botão "Criar pedido" apagado não diz, perto do item, o que falta | 🟠 | Marcar os itens pendentes e levar até o primeiro | baixo |

### B11. Conferir insumos (Helena e Roger, por pedido)
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| **"Faltou algum item?": campos sem rótulo** ("Nome do insumo", "Qtd.") e **lista suspensa de unidade** | 🔴 **trava relatada** | Rótulos visíveis; unidade em 3 botões grandes (unidades / metros / cones); botão "Pôr na lista" | baixo |
| "Tem/Falta" escolhido só pela cor | 🟠 | ✓ e texto "Tem" / "Falta" | baixo |
| "Tudo conferido" parece situação, mas é o botão que fecha | 🟡 | "Pronto, voltar ao pedido" | baixo |
| "Aviamentos", "insumos" | 🟡 | "Tecidos e aviamentos" | médio |

### B12. Documentos (Pedido para o cliente / Fichas de produção)
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| Prévia A4 ilegível no celular (é reduzida) | 🟡 | Aviso "Toque em Baixar PDF para ver grande" | baixo |
| "Cliente aprovou este pedido" é interruptor sem confirmação | 🟠 | Confirmação | baixo |
| "1ª e 2ª via" / "Só 1ª via" | 🟡 | Manter (a equipe conhece "via") | — |

### B13. Empresas / folha da empresa
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| "×" de "Esquecer nome" sem confirmação, com 15px | 🟠 | A4 e A7 | baixo |
| Mistura consulta, arquivos e cadastro | 🟡 | Blocos com título, e o cadastro em "Dados da empresa" | médio |

### B14. Avisos e Menu
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| Faixa de pedido novo só aparece na Fábrica | 🟡 | Aparecer também em Pedidos | baixo |
| "Sair" sem confirmação e com a mesma seta das outras linhas | 🟡 | Ícone próprio e confirmação | baixo |

### B15. Painel do gestor (Helena e Roger)
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| Abas com 13px no celular | 🟠 | A1 | baixo |
| Jargão: "ranking", "pontos", "eficiência", "ocupação", "gargalo", "inícios manuais", "roteiro", "min/peça", "1,8×" | 🟠 | "Quem mais produziu", "rendimento", "tempo ocupado", "máquina que segura a produção", "decidido à mão" | médio |
| "folga 1", "~2" sem unidade | 🟡 | "sobra 1 dia", "faltam ~2 dias de trabalho" | baixo |
| Linha de tempos é uma `div` clicável, sem cara de botão | 🟡 | Botão "Corrigir tempo" | baixo |
| Tabela de 6 colunas rola para o lado no celular | 🟡 | Vira lista no celular | baixo |
| Texto desatualizado "tocando no nome, lá em cima" | 🟡 | Corrigir o texto | baixo |

### B16. Cadastros (gestão, raro; Estoque semanal)
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| **"×" do Estoque apaga na hora, colado ao campo de quantidade** | 🔴 | A7 e alvo de 48px separado do campo | baixo |
| **Ajustes:** 21 cartões, 276 alvos e 28 telas de rolagem; Acessos, Cópias e Sair no meio de fatores e pesos | 🟠 | Índice no alto. Os cartões raros ficam fechados ("Configuração da fábrica", "Documentos", "Cálculos"); Acessos e Cópias ficam em cima | médio |
| **"Restaurar de um arquivo" troca tudo sem confirmação** | 🔴 | Confirmação forte com o nome do arquivo e a data | baixo |
| "Restaurar" da nuvem confirma com "toque de novo", avisado só no toast | 🟠 | Confirmação na tela | baixo |
| Tempo por peça no − e + de 0,1 em 0,1, sem poder digitar | 🟡 | Campo numérico com − e + | baixo |
| Tamanhos com sintaxe "XXG:115" digitada | 🟡 | *(raro; fica)* Só explicar melhor | baixo |
| Folha da pessoa longa, com 7 grupos de chips; o cargo acrescenta coisas sozinho | 🟡 | Avisar "Ao marcar Costura, já marcamos as máquinas de costura. Desmarque o que não servir." | baixo |
| Folha do produto: 9 cartões e ~8 listas suspensas | 🟡 | Blocos que abrem e fecham; listas viram botões | médio |
| Sub-abas: "Terceirizados" não cabe em 360px | 🟠 | A1 | baixo |

### B17. Entrada (login e conexão)
| Problema | Grav. | Sugestão | Risco |
|---|---|---|---|
| Primeiro acesso: "digite só o e-mail" é pouco intuitivo | 🟡 | Botão separado "É meu primeiro acesso" | baixo |
| Sem "mostrar senha" | 🟡 | Botão "Mostrar senha" *(pequena função de interface; peço ok)* | decisão |
| Mensagens "conta Claude", "Chrome", "Nico" | 🟡 | A11 | baixo |
| *(Segurança, não é usabilidade)* Quem sabe o e-mail de alguém sem senha cria a senha no lugar da pessoa | — | Tratar na mudança para o Supabase | — |

---

## PARTE C: Decisões que dependem de você (função nova, fora da regra "não adicionar")

| # | O quê | Por quê |
|---|---|---|
| D1 | **Trocar a costureira de máquina sem terminar o processo:** "Pausar e passar para outra pessoa ou máquina", registrando quanto já foi feito | Trava relatada. Hoje obriga a registrar errado |
| D2 | **Dividir um processo entre 2 pessoas** (ex.: 174 peças, 90 na Reta 1 com a Ana e 84 na Reta 2 com a Leu) | Trava relatada. Não existe |
| D3 | **"Minhas tarefas primeiro"** no Escritório: cada pessoa vê primeiro o que é dela, com um botão "Ver de todos" | Clareza para cada um sem esconder nada. A Helena continua vendo tudo quando precisa. Não é permissão, é ordem da tela |
| D4 | Campo de texto em "Outro problema" (conserto) | O motivo se perde |
| D5 | "Mostrar senha" no login | Conforto de quem digita com a letra aumentada |
