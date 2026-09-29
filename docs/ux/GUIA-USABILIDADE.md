# Guia de usabilidade do Martins Pro

Este guia vale para **o app atual e para toda tela ou função nova**. Se uma regra daqui atrapalhar um caso real, o caso é discutido e o guia é atualizado. Não se quebra a regra em silêncio.

## Para quem desenhamos

**Dona Cida:**
- 62 anos, costureira há 30, não terminou o ensino médio.
- Usa um Android simples, de tela pequena e com a **letra aumentada**.
- Tem vista cansada, usa com pressa, em pé, com barulho em volta e às vezes com as mãos ocupadas.
- Tem medo de "apertar errado e estragar".
- Se ficar confusa, volta para o papel.

**Quem usa hoje:**
- **Helena:** dona e encarregada, no celular na fábrica e no computador. É a usuária principal.
- **Roger:** vendas e rua.
- **Vendedoras:** no computador.

As costureiras vão entrar depois. **Celular primeiro**, sem quebrar o computador.

---

## 1. Leitura e visão

| Regra | Número | Como aplicar no código (`app.html`) |
|---|---|---|
| Texto de corpo | **mínimo 16px**; **18px** nas telas da fábrica | Nunca `font-size` abaixo de 16px em texto que a pessoa precisa ler. Classes de apoio (`.dica`, `.sub-l`, `.lido`, `small`) também têm no mínimo 16px |
| Contraste | **AA (4,5:1)** em todo texto; **AAA (7:1)** em texto importante (situação, quantidades, nome da ação) | Texto secundário usa `--ink2` (#434D59, 8:1). `--muted` só para detalhe decorativo, e nunca em cima do fundo cinza |
| Borda de botão e campo | **3:1** contra o fundo | Borda de botão claro mais escura que `--line` |
| Informação não depende só de cor | cor + texto e/ou ícone | Situação sempre escrita ("Atrasando"). Item escolhido tem ✓ ou texto "Escolhido", não só borda verde |
| Nada fino ou miúdo | peso 400 ou mais; nada em maiúsculas pequenas | Selos em maiúsculas com no mínimo 16px |
| Exceção registrada | Barra de baixo com 5 rótulos: **15px só em telas com menos de 360px** de largura (ou letra do sistema muito aumentada), para as palavras não encostarem | — |
| Letra do celular aumentada | a tela funciona com **letra do sistema em 130%** | Nada de altura fixa em caixas com texto; textos longos quebram linha em vez de cortar com "…" |

## 2. Toque

| Regra | Número |
|---|---|
| Altura mínima de qualquer alvo | **48px** (alvo real, contando o padding) |
| Ação principal da tela | **56px** ou mais (`.big`) |
| Espaço entre alvos | **8px** no mínimo |
| Onde fica a ação principal | **metade de baixo** da tela ou fixa embaixo, ao alcance do polegar |
| Gesto escondido | proibido como único caminho. Se tocar no cartão abre algo, existe também um botão visível que diz isso ("Abrir", "Ver mais") |
| Rolagem para o lado | evitar. Se existir, precisa aparecer que continua (seta, "Arraste para o lado", última opção cortada pela metade) |
| "×" para apagar | alvo de 48px, com texto ("Tirar") sempre que couber |

## 3. Linguagem

- **Português da fábrica.** Frases curtas, uma ideia por frase.
- **Palavras da equipe:**
  - **processo** (não "etapa")
  - **prestador de serviço** (não "terceirizado")
  - **Na rua** (não "Fora")
  - **acabamento** (não "arremate")
  - **tecidos e aviamentos** (quando for "insumos")
  - **fichas de produção e mockups** (quando for "vias")
  - conserto, personalização
- **Proibido na tela:**
  - "dashboard", "status", "setup", "input", "submit", "sync", "backup", "ranking", "KPI", "rework";
  - nomes de ferramenta ("Claude", "Chrome");
  - códigos de erro.
- **Botão diz o que acontece, com verbo:**
  - "Terminei este processo", "Começar", "Salvar correção", "Entregar pedido";
  - nunca "OK", "Confirmar" ou "Processar" sozinhos.
- **Ícone sempre com texto.** Ícone sozinho só para Voltar e para os botões − e + (que já têm nome escondido para leitor de tela).
- **Respeito:** simples, mas adulto. Nada de "Oba!", nada de infantilizar.

## 4. Organização da tela

- **Uma ação principal por tela**, com o botão `.big` verde ou azul. O resto é visualmente secundário (`.mbtn neutro2`, `.x`).
- **Revelação progressiva:** o que é raro vai para **"Mais opções"**, que abre na mesma tela. Nada deixa de existir.
- **Consistência:** a mesma coisa tem sempre o mesmo nome, o mesmo ícone e fica no mesmo lugar.
- **Onde estou e como volto:** toda tela tem título claro. Toda folha tem **Voltar**, **Fechar** ou **Cancelar** fixo no alto.
- **Navegação principal:** no máximo **5 itens**, sempre com rótulo. O essencial do dia a dia nunca fica só no Menu.
- **Telas longas:** divididas em blocos com título. Se passar de 4 telas de rolagem, repense ou agrupe.

## 5. Formulários e entrada de dados

- **Poucos campos por vez.** Formulário longo vira passos com **"Passo 2 de 4"**.
- **Evitar digitação:**
  - botões grandes com as opções prontas;
  - valor mais comum já preenchido;
  - − e + para números pequenos.
- **Teclado numérico** para números (`inputmode="numeric"` ou `"decimal"`).
- **Até 6 opções: botões grandes**, não lista suspensa (`<select>`).
- **Rótulo sempre visível acima do campo.** Placeholder é só exemplo, nunca o nome do campo.
- **Erro ao lado do campo com problema**, além do resumo perto do botão.

## 6. Segurança e confiança

- **Toda ação diz que deu certo:** "Pronto! Processo registrado." A mensagem aparece perto de onde a pessoa tocou ou no alto da tela, **sem cobrir botões** nem atrapalhar a navegação.
- **Ações que apagam ou não têm volta** (Entregar pedido, Apagar, Tirar, Restaurar cópia, Sair) pedem **confirmação na própria tela**, dizendo o que vai acontecer:
  - Exemplo: "Entregar o pedido da Clínica Vitta? Ele sai da lista de abertos." Botões: **[Sim, entregar]** **[Não]**.
  - O botão de confirmar repete o verbo. Não se usa "OK".
- **Desfazer:** onde houver, fica no aviso de sucesso e não cobre a tela. **Não é o único jeito de corrigir** um erro importante.
- **Mensagem de erro:** diz o que aconteceu e o que fazer, sem código técnico.
- **Carregando, vazio e sem internet:** sempre com frase explicando.
- **Nunca perder o que a pessoa já preencheu** por erro ou por falta de conexão.

## 7. Teste da Dona Cida (aplicar em toda tela alterada)

| # | Pergunta | Passa se… |
|---|---|---|
| 1 | Em 5 segundos ela entende para que serve a tela? | O título e o primeiro bloco dizem isso |
| 2 | Ela acha a ação principal sem ler tudo? | Há um botão principal visível sem rolar, ou fixo embaixo |
| 3 | Ela toca no botão certo sem errar? | Alvos de 48px ou mais, 8px de espaço, nada destrutivo colado ao que se usa sempre |
| 4 | Depois de agir, ela sabe se deu certo? | Mensagem clara de sucesso |
| 5 | Se errar, ela volta ou corrige sem medo? | Confirmação no que não tem volta; Voltar sempre visível |
| 6 | Tem alguma palavra que ela não entenderia? | Nenhuma palavra da lista proibida; termos da equipe |

**Registrar o resultado:** tela, respostas de 1 a 6 (✅ ou ❌), print de 360×640 antes e depois.

## 8. Mudanças em telas que já estão em uso

| Risco de estranhamento | Exemplos | Regra |
|---|---|---|
| **Baixo** | letra maior, contraste, tamanho de botão, mensagem mais clara, confirmação nova | Pode ir numa onda aprovada |
| **Médio** | renomear um termo, reagrupar ações, mandar algo para "Mais opções" | Onda aprovada + nota em `NOVIDADES-PARA-EQUIPE.md` |
| **Alto** | mudar botão de lugar, mudar fluxo, mudar a navegação | Aprovação específica do Nico + aviso à equipe **antes** de publicar |

- **Nunca mudar o visual e o fluxo da mesma tela na mesma onda.**
- Prefira melhorar o elemento **no lugar dele** a mudá-lo de lugar.
- Botão que a equipe usa todo dia só muda de lugar com motivo forte e aprovado.
- Termos que a equipe já conhece ficam, a não ser que estejam realmente confusos. Ao trocar um termo, durante uma onda mostre o novo com o antigo entre parênteses: "Na rua (Fora)".

## 9. Checklist rápido para quem mexe no código

- [ ] Nenhum `font-size` abaixo de 16px em texto legível.
- [ ] Todo botão novo tem pelo menos 48px de altura e texto.
- [ ] A ação principal usa `.big`; as secundárias ficam visualmente menores.
- [ ] Nada de `<select>` com até 6 opções: use botões (`.pchip` / `.depc`).
- [ ] Campo com rótulo visível (`.rotulo`) e `inputmode` certo.
- [ ] Ação destrutiva com confirmação na tela.
- [ ] Mensagem de sucesso depois de salvar.
- [ ] Palavras da equipe (seção 3).
- [ ] Testado em 360×640 e no computador.
- [ ] Teste da Dona Cida registrado.
