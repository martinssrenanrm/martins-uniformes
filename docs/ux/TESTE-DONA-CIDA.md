# Teste da Dona Cida: resultados por onda

**Perguntas:**
1. Entende a tela em 5 segundos?
2. Acha a ação principal sem ler tudo?
3. Toca no botão certo sem errar?
4. Sabe se deu certo?
5. Se errar, volta ou corrige sem medo?
6. Alguma palavra que ela não entenderia?

**Legenda:**
- ✅ passa.
- 🔜 ainda não passa, e a onda indicada resolve.
- ❌ não passa e ainda não tem onda prevista.

---

## Onda 1: ler e tocar (29/09/2026)

- **Medida:** celular de 360×640 com os dados de exemplo; computador em 1280×800.
- **Prints:** `prints/onda-1/`; comparações antes e depois em `prints/onda-1/comparacao-*.jpg`.

### Medidas antes → depois

| Tela | Textos < 16px | Alvos < 44px | Ações (não pode mudar) |
|---|---|---|---|
| Fábrica › Máquinas | 22 → 5* | 12 → 0 | 36 → 36 |
| Fábrica › Escritório | 39 → 3* | 22 → 0 | 35 → 35 |
| Folha da máquina (parada) | 7 → 2* | 4 → 0 | 16 → 16 |
| Pedidos | 25 → 0 | 9 → 0 | 20 → 20 |
| Pedido | 153 → 0** | 8 → 0 | 82 → 82 |
| Novo pedido, passo 2 | 33 → 0 | 2 → 0 | 75 → 75 |
| Conferir insumos | 10 → 0 | 0 → 0 | 24 → 24 |
| Cadastros › Estoque | 7 → 0 | 27 → 0 | 64 → 64 |
| Cadastros › Ajustes | 175 → 1*** | 111 → 0 | 276 → 276 |
| Painel › Equipe | 37 → 2* | 0 → 0 | 7 → 7 |

- \* O que sobra é a letra dentro do avatar redondo (inicial do nome, decorativa) e os números das abas.
- \*\* A folha do Pedido inclui a prévia A4 do documento, que é papel e continua como está.
- \*\*\* Sobra o slogan da marca ("UNIFORMES PROFISSIONAIS"), decorativo.
- **Exceção:** em telas com menos de 360px, a barra de baixo usa 15px para os 5 nomes não encostarem (registrado no guia).

### Teste por tela

| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Fábrica › Máquinas | ✅ | ✅ | ✅ | 🔜 Onda 2 | 🔜 Onda 2 | ✅ |
| Folha da máquina | ✅ | 🔜 Onda 5b (muita coisa junta) | ✅ | 🔜 Onda 2 | ✅ | 🔜 Onda 3 ("fora da ordem", "reservar") |
| Fábrica › Escritório | ✅ | ✅ | ✅ | 🔜 Onda 2 | 🔜 Onda 2 (Entregue sem confirmação) | 🔜 Onda 3 ("vias", "insumos") |
| Fábrica › Fora | ✅ | ✅ | ✅ | 🔜 Onda 2 | ✅ | 🔜 Onda 3 ("Fora" → "Na rua") |
| Pedidos | ✅ | ✅ | ✅ | ✅ | ✅ | 🔜 Onda 3 ("vias") |
| Pedido | 🔜 Onda 5a (10 telas de rolagem) | 🔜 Onda 5a | ✅ | 🔜 Onda 2 | 🔜 Onda 2 | 🔜 Onda 3 |
| Novo pedido | ✅ | ✅ (Próximo) | ✅ | 🔜 Onda 2 (erro longe do campo) | ✅ | ✅ |
| Conferir insumos | ✅ | ✅ | ✅ | ✅ | ✅ | 🔜 Onda 4 (campos sem nome) / Onda 3 |
| Cadastros › Estoque | ✅ | ✅ | ✅ (× agora com 48px) | ✅ | 🔜 Onda 2 (× apaga sem perguntar) | ✅ |
| Cadastros › Ajustes | 🔜 Onda 5d | 🔜 Onda 5d | ✅ | ✅ | 🔜 Onda 2 | 🔜 Onda 3 |
| Painel | ✅ | ✅ | ✅ | ✅ | ✅ | 🔜 Onda 3 ("ranking", "eficiência") |
| Barra de baixo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Resultado da Onda 1:**
- A pergunta **3 (tocar sem errar) passa em todas as telas**.
- As perguntas 1 e 2 melhoraram na leitura, mas o excesso de coisas só se resolve na Onda 5.
- As perguntas 4 e 5 (confirmação e aviso de sucesso) são a Onda 2.
- A pergunta 6 (palavras) é a Onda 3.


## Onda 2: confirmações e aviso (15/10/2026)

- **Pergunta 4 (o que acontece se errar):** passa nas telas com ação sem volta. Entregar, tirar, restaurar, sair, parar hora extra, marcar "fora" e desmarcar vias/arte pedem confirmação na tela, com o verbo no botão ("Sim, entregar").
- **Pergunta 5 (sabe se deu certo):** passa. O aviso aparece no alto, curto, com o que aconteceu ("Pronto! Ana começou Pregar gola na Reta 1"), some em 4 s (8 s com Desfazer) e tem ×.
- Novo pedido: o erro leva até a peça com problema e marca em vermelho.
- Fora do horário: "Começar em hora extra".
- Prints conferidos em 360×640: janela de confirmação e aviso no alto.

## Onda 5a: Pedido em blocos (15/10/2026)

- **Perguntas 1 e 2 (entende o que fazer / acha sem procurar) na tela Pedido:** melhoraram. Blocos com título e resumo; abre sozinho só o que tem pendência; mapa de processos atrás de "Ver mapa de processos".
- Medida com 8 pedidos reais em 360×640: de 4,7–23,6 telas de rolagem para 4,3–9,3 (média ≈ 11 → ≈ 7).
- Ainda pesa: o cartão de cada peça (≈ 1 tela por peça). Fica para uma próxima etapa, sem misturar com esta.

## Ondas 5b, 5c, 5d e visual novo (16/10/2026)

- **Folha da máquina (5b):** à vista só trabalho, quem faz e Começar/Terminou/Deu problema; o resto em "Mais opções". 7,4 → 4,7 telas (livre), 5,8 → 4,5 (ocupada).
- **Novo pedido (5c):** "Outras cores" e "Personalização" em blocos; abre sozinho quando a peça costuma ter personalização; cores mais usadas primeiro.
- **Ajustes (5d):** blocos que abrem e fecham; ≈ 32 → 5 telas. Perguntas 1 e 2 passam.
- **Visual novo:** tipografia Inter, superfícies leves, hierarquia de botões. Mantidos: letra ≥ 16px, alvos ≥ 48px, contraste AA, botão sempre com contorno.

## Ondas de 11/2026 (rascunho, não publicado). Prints em `prints/ondas-2026-11/`

### Onda 1: permissões por responsabilidade
| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Corrigir processo (Escritório) | ✅ diz que é da gestão | ✅ nada para errar | ✅ | n/a | ✅ Voltar no alto | ✅ |
| Pedido (Escritório) | ✅ | ✅ | ✅ Cancelar não fica mais perto de Corrigir | ✅ | ✅ | ✅ |
| Ajustes › Acessos › O que o Escritório pode fazer | ✅ título diz | ✅ toque liga/desliga | ✅ 56px+ | ✅ "Pronto! …" | ✅ toque de novo volta | ✅ |

### Onda 2: tela Hoje
| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Hoje (gestão) | ✅ "Bom dia" + blocos com título | ✅ cada linha tem o botão dela | ✅ 48px, 360px sem corte (teste) | n/a (só leva à ação) | ✅ voltar pela barra | ✅ sem palavra proibida |
| Hoje (Escritório) | ✅ "Suas tarefas" primeiro | ✅ botão da tarefa igual ao do Escritório | ✅ | ✅ (mesmo aviso de antes) | ✅ | 🔜 Onda 3 de vocabulário ("vias") |
| Mais (gestão) | ✅ | ✅ | ✅ | n/a | ✅ Fechar no alto | ✅ |

### Onda 3: sugestões para agora
| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Hoje › Sugestões | ✅ frase curta + porquê | ✅ um botão por sugestão | ✅ 48px (teste) | n/a | ✅ só leva à tela, não muda nada | ✅ sem "IA" nem termo técnico (teste) |

### Onda 4: celular primeiro
| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Qualquer folha (voltar do celular) | ✅ | ✅ | ✅ | ✅ | ✅ voltar fecha a folha, não o app (teste) | ✅ |
| Aviso depois de cancelar/pausar/dividir/conserto/hora extra/arte | ✅ | ✅ Desfazer no aviso | ✅ | ✅ | ✅ Desfazer (teste) | ✅ |
| Fábrica (Escritório, 1ª vez) | ✅ abre no Escritório | ✅ | ✅ | n/a | ✅ | ✅ |
Varredura em 360×640 (Hoje, Máquinas, Fora, Escritório, Pedidos, Pedido, folha da máquina, Painel, Estoque): nada passa da largura; único alvo abaixo de 44px era o nome da empresa no Pedido (corrigido).

### Onda 5: o que foi feito
| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Hoje › quadro verde | ✅ frase curta | n/a (só leitura) | n/a | ✅ cresce conforme marca | ✅ | ✅ sem "ranking"/pontos (teste) |

### Onda 6: visual da Hoje em fila de ações (direção B)
| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Hoje (gestão) | ✅ "8 coisas para resolver" | ✅ 1º item com botão azul, sem rolar (teste) | ✅ 48px, 360px sem corte (teste) | ✅ | ✅ | ✅ |
| Hoje (Escritório) | ✅ tarefas dela primeiro | ✅ botão da própria tarefa | ✅ | ✅ (mesmo aviso do Escritório) | ✅ Desfazer | 🔜 Onda 3 de vocabulário ("vias") |

### Faturamento por tipo de cliente (função nova, 08/11/2026)
| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Resultados › Faturamento › Por tipo de cliente | ✅ "Por tipo de cliente em outubro" | ✅ botão azul "Marcar o tipo de N clientes" logo abaixo | ✅ 52px, 360px sem corte (teste) | ✅ a linha "Sem tipo" diminui | n/a (só leitura) | ✅ "Sem tipo" explicado embaixo |
| Folha "Tipo de cliente" | ✅ título + "Marque uma vez" | ✅ um botão por tipo em cada cliente | ✅ 56px, 8px entre botões; a lista não pula ao marcar (teste) | ✅ botão fica azul com ✓ e aviso no alto | ✅ Desfazer no aviso; trocar é tocar no outro tipo | ✅ |
| Ajustes › Tipos de cliente | ✅ frase diz para que serve | ✅ Adicionar | ✅ mesmo padrão de Motivos de conserto | ✅ "Tipo … adicionado" | ✅ Tirar pede confirmação e diz quem fica sem tipo | ✅ |
Prints: `docs/ux/prints/tipo-cliente/`. Antes: o quadro Faturamento sem o bloco (prints da publicação de 06/11).

### Quadro de pedidos, estilo Trello (função nova, 16/11/2026)
Risco de estranhamento: **baixo**. A lista de Pedidos abre igual; o Quadro é uma chave nova ao lado de Pedidos e Empresas, e o bloco novo do pedido abre fechado (só abre sozinho quando se chega pelo Quadro).
| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Pedidos › Quadro | ✅ colunas com nome e número; frase "muda de coluna sozinho" | ✅ o cartão é o toque; "Adicionar pedido" em Início | ✅ 48px, letra ≥ 16px, 360px sem corte fora do quadro (teste); no celular a próxima coluna aparece pela metade + "Arraste para o lado" | n/a (só leitura) | ✅ Voltar | ✅ sem "status"/"Kanban" |
| Pedido › Quadro: etiquetas e checklist | ✅ "No quadro: Costura. Muda sozinho" | ✅ toque no item marca | ✅ itens com 52px, 360px sem corte (teste) | ✅ item fica verde com "Marcado por … em …" | ✅ tocar de novo desmarca; Tirar item ou grupo pede confirmação; Desfazer | ✅ palavras do Trello da equipe |
| Pedido › Histórico | ✅ | n/a | ✅ | n/a | n/a (não muda nem apaga) | ✅ |
| Ajustes › Quadro de pedidos (gestão) | ✅ frase diz para que serve | ✅ Salvar / Pôr | ✅ mesmo padrão de Setores | ✅ aviso no alto | ✅ Tirar pede confirmação | ✅ |
Prints: `docs/ux/prints/quadro/` (antes: a lista de Pedidos não mudou).

### Arquivos do pedido e comentários (fase 2 do quadro, 16/11/2026)
Risco de estranhamento: **baixo**. O bloco Anexos fica no mesmo lugar, com os mesmos botões; cada arquivo ganhou mais informação e o botão Mudar. Comentários é um bloco novo, fechado.
| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Pedido › Anexos | ✅ frase diz o que vai ali | ✅ Anexar ao pedido; no computador, quadro "Arraste os arquivos para cá" | ✅ 48px, letra ≥ 16px, 360px sem corte (teste) | ✅ aviso "Arquivo guardado"; selo "editado" | ✅ Tirar pede confirmação e o arquivo fica em "Arquivos tirados" com Pôr de volta; versão anterior guardada | ✅ "Trocar por uma versão nova", "Tirar do pedido" |
| Pedido › Comentários | ✅ | ✅ Enviar comentário (verde) | ✅ (teste) | ✅ aviso diz quem vai ver | ✅ Mudar o próprio comentário; texto anterior guardado | ✅ "Avisar quem precisa ver" |
Prints: `docs/ux/prints/quadro/anexos-*.png`, `versoes-*.png`, `comentarios-*.png`.

### Quadro, fase 3 (16/11/2026)
Risco de estranhamento: **baixo**. Telas novas (Calendário, Caixa de entrada) e um bloco novo na ficha do QR; nada mudou de lugar.
| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| QR code › Cartão do pedido | ✅ "Cartão do pedido · Agora em: Costura" | n/a (só leitura) | ✅ | n/a | ✅ diz que para marcar precisa entrar no app | ✅ |
| Sininho › Para você | ✅ frase diz o que aconteceu | ✅ toque abre o pedido | ✅ | ✅ o aviso deixa de ser novo | ✅ Fechar | ✅ |
| Pedidos › Calendário | ✅ mês e número de entregas | ✅ toque no pedido abre | ✅ 48px; no celular vira lista por dia (teste) | n/a | ✅ Hoje volta ao mês atual | ✅ |
| Quadro › Caixa de entrada | ✅ | ✅ Guardar anotação / Virar pedido | ✅ (teste) | ✅ aviso | ✅ Tirar pede confirmação e não apaga | ✅ |
| Ajustes › Importar do Trello | ✅ explica onde exportar | ✅ Importar (verde) | ✅ | ✅ aviso com o que entrou | ✅ mostra antes; "Não importar"; importar de novo não repete | ✅ |
Prints: `docs/ux/prints/quadro/qr-cartao-*.png`, `para-voce-*.png`, `calendario-*.png`, `caixa-*.png`.

### Correções da auditoria (16/11/2026)
Risco de estranhamento: **médio** no quadro do computador (muda o visual, não o fluxo) e **baixo** no resto. O botão "Pedidos" da chave de vistas passou a se chamar "Lista".
| Tela | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Quadro no PC | ✅ 8 colunas em 1.920 px; nome das que faltam | ✅ "Próximas colunas" com texto | ✅ 48 px; página não escorrega (teste em 8 tamanhos) | n/a | ✅ Voltar | ✅ |
| Cartão | ✅ número + cliente + "Atrasado N dias úteis" / "Pronto, falta entregar" / "Falta: …" | ✅ o cartão inteiro abre o pedido | ✅ | n/a | ✅ | ✅ |
| Pedidos (cabeçalho 360–1.099 px) | ✅ Lista · Quadro · Calendário · Empresas escritos | ✅ | ✅ 48 px, sininho sempre visível | n/a | ✅ | ✅ |
| Calendário no celular | ✅ lista por dia | ✅ | ✅ nada espremido | n/a | ✅ Hoje | ✅ |
| Sininho | ✅ "Avisos · N novos" | ✅ Marcar todos como vistos | ✅ | ✅ aviso "Avisos marcados como vistos" | ✅ | ✅ |
| Ajustes › Quadro | ✅ | ✅ botões com texto; checklist em campos | ✅ | ✅ | ✅ Tirar pede confirmação | ✅ |
Prints antes e depois: `docs/ux/prints/auditoria/`.
