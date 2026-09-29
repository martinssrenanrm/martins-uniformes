# Mapa do app Martins Pro

**Fase 0 da revisão de usabilidade. Nenhuma tela foi alterada.**

- **Versão mapeada:** artefato v53 (commit `f4d30ac`), mais a correção da cor das mensagens de erro.
- **Fotos das telas:** celular pequeno, 360×640, em `docs/ux/prints/antes/`.
- **Medidas:** tiradas automaticamente com dados de exemplo.

---

## 1. Como o app é construído

- **Arquivo:** um só, `app.html`, com HTML, CSS e JavaScript puro. Não tem framework nem build.
- **Telas e ações:**
  - As telas são funções que montam HTML: `v…` são telas, `s…` são "folhas" que abrem por cima, em tela cheia.
  - Os botões chamam ações pelo atributo `data-a`, e as ações ficam no objeto `A`.
- **Dados:** ficam na nuvem do app, no banco do Claude, e sincronizam entre os aparelhos.
- **Design system:** não existe um formal. Os componentes são classes CSS reaproveitadas (seção 6).
- **Fonte:** Atkinson Hyperlegible, feita para leitura fácil. O corpo tem 19px, ou 18px no celular.

## 1b. Quem usa de verdade (respostas do Nico, 29/09)

| Pessoa | Papel | Onde usa | O que mais faz |
|---|---|---|---|
| **Helena** | Dona da empresa e **encarregada do chão de fábrica**. **Principal usuária** | Celular na fábrica e computador | Fábrica (Começar/Terminou/Hora extra/Conserto por todas as costureiras), Avisos, Painel, Estoque, Cadastros. Às vezes confere pedido ou leva coisa no prestador |
| **Roger** | Sócio. Vendas e **tudo que é de rua**: compras, entregas, levar e buscar no prestador de serviço | Computador e celular | Lista de compras, Logística, Na rua, Pedidos |
| **Vendedoras** (ex.: Laiara, Paula) | Lançam pedidos e liberam para a produção depois de concluir o que é delas (fichas e mockups, arte, aprovação do cliente) | Computador | Novo pedido, Importar ficha, Pedido, Escritório › Pedidos/Artes |
| **Costureiras e ajudantes** | **Hoje não usam o app.** No futuro terão acesso próprio | Celular (futuro) | Começar/Terminou na própria máquina |

- **Objetivo do negócio:** dar clareza de processo para a equipe ganhar autonomia e os sócios saírem do operacional.
- **Consequência para o desenho:** as telas precisam funcionar para quem **não conhece o histórico** do pedido.
- **Aparelhos:** Android, com a letra do sistema aumentada. Tem Wi-Fi na fábrica.
- **Travas já vividas:**
  - trocar a costureira de máquina;
  - dividir um mesmo processo entre 2 pessoas;
  - registrar o que faltava na conferência de insumos.

**Palavras da equipe:**

| No app hoje | Como a equipe fala |
|---|---|
| vias | **Fichas de produção e mockups** |
| insumos | **tecidos e aviamentos** |
| terceirizado | **prestador de serviço** |
| etapa | **processo** |
| arremate | **acabamento** |
| Fora (aba) | **Na rua** |
| conserto | conserto |
| personalização | personalização |

## 2. Perfis que já existem

| Perfil | Quem | O que vê |
|---|---|---|
| **Gestão** | Helena, Roger | Tudo: Fábrica, Pedidos, Novo pedido, Avisos, Painel do gestor, Cadastros, Empresas, acessos e cópias de segurança |
| **Operação** | ninguém cadastrado ainda | Fábrica, Pedidos, Novo pedido, Avisos, "Como usar" e "Sair". Não vê Painel do gestor, Cadastros nem Empresas pelo menu |

- **Login:** é por e-mail e senha. Na primeira vez, a pessoa cria a própria senha.
- **Onde o perfil é checado:**
  - na barra de baixo;
  - no Menu;
  - na navegação (`A.tela`);
  - nos cartões de Acessos, Avisos e Cópias.
- **O bloqueio é só visual:** os dados continuam no aparelho.
- **Nas telas de Pedidos não há nenhuma checagem de perfil:** a operação vê e altera tudo, inclusive entregar, corrigir e aprovar.

> Hoje **só existem logins de gestão**. Na prática, quem aperta Começar/Terminou no chão de fábrica entra com a conta da Helena ou do Roger.

## 3. Navegação

**Barra de baixo, sempre visível:**
- No celular: **Fábrica · Pedidos · (+) Novo · Avisos · Menu**.
- No computador, com 900px ou mais, aparecem também **Gestor** e **Cadastros**.

**O Menu leva a:**
- Painel do gestor, Cadastros e Empresas, só para a gestão;
- Como usar o app;
- Sair.

As folhas abrem em tela cheia, com o botão **Voltar**, **Fechar** ou **Cancelar** fixo no alto.

## 4. Telas

- **Freq.** é a frequência estimada.
- **Ações** é o número de alvos tocáveis medido na tela de exemplo.
- **Letra < 16px** conta os textos com letra menor que 16px.
- **Rolagem** diz quantas telas de altura a página tem num celular de 360×640.

### 4.1 Uso diário no chão de fábrica

| Tela | Para que serve | Quem | Freq. | Ações | Letra < 16px | Rolagem |
|---|---|---|---|---|---|---|
| **Fábrica › Máquinas** (`vFabrica`) | Ver cada máquina e Começar/Terminar etapas | todos | o dia todo | 36 | 22 de 118 | 6,7 telas |
| **Folha da máquina, parada** (`sMaq`) | Próximo trabalho sugerido, escolher quem faz, Começar, reservar | costureira e encarregada | várias vezes por hora | 16 | 7 de 65 | 6,3 |
| **Folha da máquina, trabalhando** (`sMaq`) | Terminou, Deu problema, escolher o próximo | costureira e encarregada | várias vezes por hora | 11 | 1 de 48 | 5,5 |
| **Deu problema** (`sProblema`) | Mandar peças para conserto, em 3 passos | costureira e encarregada | algumas vezes por dia | 7 a 10 | — | 1 a 2 |
| **Hora extra** (`sHE`) | Marcar quem continua e até que horas | encarregada | fim do dia | 2 + pessoas + horários | — | 1 a 2 |
| **Fábrica › Fora** | Peças no terceirizado; Chegou | encarregada e escritório | diário | 11 | 16 de 30 | 1,8 |
| **Como usar** (`sAjuda`) | 5 dicas | quem está começando | raro | 2 | 0 | 2,2 |

### 4.2 Uso diário no escritório (encarregada, vendas, compras)

| Tela | Para que serve | Quem | Freq. | Ações | Letra < 16px | Rolagem |
|---|---|---|---|---|---|---|
| **Fábrica › Escritório** (`vEscritorio`) | Tarefas por setor (Pedidos, Artes, Lista de compras, Logística), responsável e quem está no escritório | encarregada e escritório | várias vezes por dia | 35 | 39 de 63 | 3,9 |
| **Trocar quem faz** (`sTroca`) | Passar uma tarefa para outra pessoa | encarregada | diário | 4 | — | 1 |
| **Responsável do setor** (`sSetor`) | Dono fixo de cada tipo de tarefa | gestão | raro | 5 | 0 | 1 |
| **Pedidos** (`vPedidos`) | Achar um pedido: busca, 6 filtros de situação, 3 ordens | todos | várias vezes por dia | 20 | 25 de 82 | 5,8 |
| **Pedido** (`sPedido`) | Tudo do pedido: Antes de cortar, material, arte de cada personalização, mockups, peças e etapas, mapa de etapas, documentos, entregar | escritório e encarregada | várias vezes por dia | **82** | **153 de 264** | **10,5** |
| **Novo pedido, passos 1 a 4** (`sNovo`) | Lançar um pedido: empresa, peças (tecido, modelo, cor, outras cores, personalização, tamanhos), data e conferência | vendas e escritório | diário | 10 / **75** / 6 / 2 | 0 / 33 / 0 / 1 | 1,7 / **8,4** / 1,2 / 2 |
| **Corrigir pedido** (`sNovo` em modo correção) | O mesmo passo a passo, preenchido, com "O que vai mudar" | escritório | semanal | igual ao Novo | — | — |
| **Importar ficha** (`sImp`) | Ler o PDF da ficha e confirmar o que ficou em dúvida (⚠) | escritório | diário | dezenas por peça | muitos | longa |
| **Importar mockups** (`sMock`) | Ligar cada imagem a uma peça | escritório | semanal | 2 + lista | — | — |
| **Conferir insumos** (`sIns`) | Tem ou Falta item por item; incluir o que faltou | compras e encarregada | por pedido | 24 | 10 de 49 | 3,3 |
| **Documento: Pedido para o cliente / PDF de produção** (`sDoc`) | Prévia A4, Baixar PDF, Imprimir, Cliente aprovou | escritório e vendas | por pedido | 4 a 6 | 75 de 175 (prévia) | 3,8 |
| **Empresas** e **folha da empresa** (`vEmpresas`, `sCli`) | Pedidos da empresa, dados e arquivos (artes, bordados, mockups) | escritório | semanal | 11 / 9+ | 2 / 13 | 2,3 / 3 |
| **Avisos** (`vAvisos`) | Pedidos novos; Marcar todos como vistos | Helena (configurável) | diário | 2+ | 0 | 0,5 |
| **Menu** (`sMenu`) | Painel, Cadastros, Empresas, Como usar, Sair | todos | diário | 6 (gestão) / 3 (operação) | 5 de 12 | 1,1 |

### 4.3 Gestão

| Tela | Para que serve | Quem | Freq. | Ações | Letra < 16px | Rolagem |
|---|---|---|---|---|---|---|
| **Painel › Agora** (`gAgora`) | 4 números e "Precisa de atenção", com link para resolver | gestão | diário | 8 | 13 de 27 | 2 |
| **Painel › Equipe** (`gEquipe`) | 6 números, "Ranking de produção", ocupação, horas extras | gestão | semanal | 7 | 37 de 95 | 3,7 |
| **Painel › Atrasos** (`gAtrasos`) | Pedidos do mais apertado; terceirizados atrasados | gestão | diário | 14 | 24 de 55 | 3,9 |
| **Painel › Organização** (`gOrg`) | Quanto a equipe segue o sistema, tempos fora da realidade, consertos, últimos ajustes manuais | gestão | mensal | 7 | 40 de 193 | 8,5 |
| **Cadastros › Máquinas** (+ folha da máquina) | Quantas máquinas de cada tipo e quem sabe usar | gestão | raro | 40 | 17 | 4,1 |
| **Cadastros › Equipe** (+ folha da pessoa) | Pessoas, cargos, máquinas que sabe usar, ★, tarefas de escritório | gestão | mensal | 17 / 40 | 6 / 0 | 2,5 / 6,4 |
| **Cadastros › Terceirizados** (+ folha do fornecedor) | Serviços feitos fora e fornecedores | gestão | raro | 13 | 7 | 1,6 |
| **Cadastros › Produtos** (+ folha do produto e da etapa) | Catálogo e roteiro de produção de cada peça | gestão | raro | 21 / **60** | 6 / 34 | 6,3 / 9 |
| **Cadastros › Estoque** | Quantidade de tecidos e aviamentos | gestão e compras | **semanal ou diário** | 64 | 7 | 3,7 |
| **Cadastros › Ajustes** | Cerca de 21 cartões: exemplos, acessos, avisos, cópias, aparelho, marca, termos, posições, tamanhos das artes, apelidos, horário, prazos e cálculo, tempos do escritório, tamanhos, cores, detalhes, pesos, motivos de conserto, cargos | gestão | raro, mas é onde ficam **Sair, Acessos e Cópias** | **276** | **175 de 351** | **28,3** |
| **Cópias e lixeira** (`sSegLista`) | Restaurar uma cópia ou um item apagado | gestão | raro | — | — | — |

### 4.4 Entrada

| Tela | Para que serve |
|---|---|
| **Entrar / Primeiro acesso** (`vLogin`) | E-mail e senha; na primeira vez, criar a senha |
| **Abrindo… / Sem internet / Não está ligado à nuvem** (`vConectando`) | Estados antes de carregar os dados |
| **Vamos começar** (`vInicio`) | Só aparece uma vez, quando a nuvem ainda está vazia |

## 5. O que cada pessoa faz num turno (fluxos principais)

### Costureira ou ajudante
1. Abre o app e fica na **Fábrica › Máquinas**.
2. Acha o cartão da máquina. O amarelo com a marca "PRÓXIMO" traz a etapa, as peças, a empresa e a pessoa sugerida.
3. Toca em **Começar**. Vai com a pessoa sugerida. Para trocar a pessoa ou o trabalho, toca no cartão, escolhe e toca em **Começar com Fulana**.
4. O contador corre. Nas pausas e no almoço ele para sozinho.
5. Acabou: toca em **Terminou** e aparece "Pronto! Fulana terminou Pregar gola".
6. Peça com defeito: toca no cartão, depois em **Deu problema**, escolhe o motivo, a quantidade e a etapa para onde as peças voltam, e toca em **Mandar N peças para conserto**.
7. Errou: tem **9 segundos** para tocar em **Desfazer**.

> Não há confirmação em Começar e Terminou. Começar fora do horário liga a hora extra sozinho.

### Encarregada de produção
- Tudo o que a costureira faz, para várias máquinas.
- No fim do dia, na faixa **Expediente encerrado**, toca em **Hora extra**, marca as pessoas e o horário, e toca em **Confirmar hora extra**.
- Na aba **Fora**, marca **Chegou** quando as peças voltam do terceirizado.
- Na aba **Escritório**, vê as tarefas e troca quem faz.
- No **Pedido**, olha as peças e as etapas.

### Escritório, vendas e compras
1. **Pedido novo:** toca em **Novo**. Pode importar a ficha em PDF ou digitar tudo. São 4 passos, e depois **Criar pedido**.
2. Na **Fábrica › Escritório**, faz as tarefas de cada setor com um toque:
   - Separei (vias)
   - Pronta → Aprovada (arte)
   - Conferir (insumos) → Comprei → Chegou (material)
   - Enviei (arte para quem aplica)
   - Levei → Chegou (terceirizado)
   - Entregue
3. No **Pedido**, põe a arte e o arquivo de bordado em cada personalização, gera o **Pedido** para o cliente aprovar e o **PDF de produção**.
4. Para corrigir um erro: **✎ Corrigir pedido**.

### Gestão (Helena e Roger)
- Recebe **Avisos** de pedido novo.
- Olha o **Painel**: Agora e Atrasos todo dia, Equipe e Organização de vez em quando.
- Cuida dos **Cadastros**. Estoque é o mais frequente; o resto é raro.

## 6. Componentes compartilhados (aparecem em muitas telas)

| Componente | Onde | Letra | Altura aprox. | Observação |
|---|---|---|---|---|
| Barra de baixo `.nb` | global | **13px** no celular | 60 | o número dos Avisos também tem 13px |
| Abas `.zona` (Máquinas/Fora/Escritório; abas do Painel) | Fábrica, Painel, Pedidos | 15px, e **13px** no Painel | 48 | número da aba com 13px |
| Sub-abas `.subtab` | Cadastros | **13px** no celular | 50 | "Terceirizados" não cabe em 360px |
| Botão grande `.big` | ações principais | 22 a 26px | 62 a 78 | bom |
| Botão médio `.mbtn` | ações das tarefas, faixas | 18px (15 nas faixas) | 50 (**37** nas faixas) | — |
| Botão-link `.x` / `.x.azul` | Voltar do login, Tirar, Restaurar, Trocar pessoa, editar | 15 a 19px | **43** | parece texto, não botão |
| Chip `.pchip` / `.depc` | pessoas, filtros, opções | 15 a 17px (small 13/14) | **38 a 46** | escolhido = só cor e borda |
| "×" dentro de chips | apagar tecido, cor, posição… | 15px | **~30** | só ícone, sem confirmação |
| Dica `.dica` / `.sub-l` / `.lido` | explicações em todo lugar | **15px, cinza #687280** | — | contraste ~4,3:1 sobre o fundo (abaixo do AA) |
| Borda `--line` #D6DCE3 | todos os botões claros | — | — | contraste 1,3:1: o botão some |
| Faixa `.faixa` | topo da Fábrica | 15px no celular | 50 | — |
| Aviso de erro `.aviso` | formulários e login | 19px vermelho | — | estava sem cor desde a v52, **já corrigido** |
| Toast + **Desfazer** | depois de quase toda ação | 17px | botão de **45** | some em **9s**, desfaz só a última ação |
| Selo de situação `upill` | pedidos | 16px | 32 | cor + texto (bom) |
| Voltar / Fechar / Cancelar `.voltar` | todas as folhas | 20px | 56 | bom, fixo no alto |

## 7. Vocabulário que o app usa hoje

- **Situação do pedido:** Atrasando · Atenção · Em dia · Pronto · Entregue.
- **Situação da máquina:**
  - Trabalhando · Próximo · Reservado · Parado, fora do horário
  - Esperando alguém livre · Sem trabalho para esta máquina
  - Hora extra até … · +N na fila
- **Etapas do pedido (escritório):** Separar as vias · Preparar a arte · Aprovar a arte com o cliente · Conferir insumos · Comprar / Receber (material) · Enviar arte · Levar para / Buscar no (terceirizado) · Entregar ao cliente.
- **Botões das tarefas:** Separei · Pronta · Aprovada · Conferir · Comprei · Chegou · Enviei · Levei / Enviado · Entregue.
- **Botões da máquina:** Começar · Começar com Fulana · Terminou · Deu problema · Reservar para esta máquina · Tirar reserva · Parar a hora extra agora.
- **Setores do escritório:** Pedidos · Artes · Lista de compras · Logística · "Automático" (divide sozinho).
- **Peças e material:** peça, tecido, cor principal, outras cores, modelo, personalização, parte da peça, posição (esquerdo e direito = de quem veste), tamanhos, insumos, aviamentos, linha em cones, mockup, arte, arquivo de bordado.
- **Documentos:** Ficha de produção (1ª e 2ª via) · PDF de produção · Pedido (para o cliente aprovar).
- **Painel:** ranking, pontos, eficiência, ocupação, gargalo, processo, "seguem o sistema", ajustes manuais, reserva.
- **Termos de sistema que aparecem na tela:** nuvem, aparelho, "Só leitura", conta Claude, Chrome, "Fale com o Nico".

## 8. Achados importantes desta fase (vão para a auditoria)

1. **Tela do Pedido:**
   - 82 alvos de toque.
   - 10 telas de rolagem.
   - Mapa de etapas com rolagem para o lado.
2. **Novo pedido, passo 2:**
   - Mais de 40 alvos por peça.
   - O erro aparece só no fim da página.
3. **Ajustes:**
   - 276 alvos.
   - 28 telas de rolagem.
   - Mistura Sair, Acessos e Cópias com configuração de implantação.
4. **Ações sem confirmação:**
   - Entregue (encerra o pedido), Começar e Terminou.
   - Comprei, Chegou e Levei.
   - Restaurar de arquivo (troca tudo), o × do Estoque e o × dos cadastros.
   - Muitas dessas ações nem mostram Desfazer.
5. **Letra de 13px:** na barra de baixo, nas abas do Painel e nas sub-abas de Cadastros. A dica de 15px, cinza e de baixo contraste, aparece em todo lugar.
6. **Gesto escondido:**
   - O cartão inteiro da máquina abre a folha, e é ali que fica "Deu problema".
   - Tocar no título da tarefa abre o pedido.
   - Filtros e horários rolam para o lado sem mostrar que rolam.
7. **"Quem está usando este aparelho?"** nunca aparece desde o login (código parado).
8. **Pedidos não checam perfil:** a operação pode entregar, corrigir e aprovar.
9. **Primeiro acesso:** quem souber o e-mail de alguém que ainda não criou senha pode criá-la no lugar dessa pessoa. É uma questão de segurança, fora do escopo de interface.
