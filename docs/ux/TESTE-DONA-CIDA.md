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
