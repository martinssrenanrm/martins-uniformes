# Arquitetura do Martins Pro

Atualizado em 02/11/2026. Vale para a Martins e para qualquer confecção que use o mesmo código.
Base: auditoria do código em 01/11/2026 (telas e jornadas, ações e registros, modelo de dados), com testes que confirmam cada achado.

---

## 1. Regras da casa (para quem mexe no código)

1. **Estado, eventos e métricas são coisas diferentes.**
   - O **estado** (`state` → tabela `docs`) diz **como está agora**. Ele sincroniza entre os aparelhos.
   - O **evento** (tabela `eventos`) diz **o que aconteceu, quem fez, onde e quando**. Ele só se acrescenta e nunca volta para os aparelhos.
   - A **métrica** é calculada no banco a partir dos eventos. O painel recebe só os números.
2. **Uma operação de negócio = uma função de domínio = um evento.** Quem registra é a função que muda o dado (ex.: `marcaIns`, `terminou`), nunca o botão. Assim o mesmo evento sai de qualquer tela (pedido, Kanban, lista de compras).
3. **Nada apaga a história.** Corrigir, voltar ou desfazer gera um evento novo, que aponta o antigo. Desfazer registra `acao.desfeita` com o toque que perdeu o valor.
4. **O evento guarda a fotografia do momento:** nome da etapa, tempo padrão por peça, máquina, prestador. Mudar o cadastro depois não muda a métrica de ontem.
5. **Tráfego e espaço são limitados** (plano grátis: 5 GB/mês de tráfego, 500 MB de banco, 1 GB de arquivos).
   - Nunca baixar coleções inteiras em intervalo, nem ouvir a tabela `docs` inteira.
   - Arquivos ficam no Storage, comprimidos.
   - Eventos não sincronizam.
6. **Permissão vale no banco**, não só na tela. Quem não é da gestão não lê eventos nem métricas.
7. **Replicável:** nenhum nome de cliente no código. O que outra fábrica faria diferente vira configuração com padrão neutro (ver CLAUDE.md).
8. **Toda mudança no banco** é um arquivo numerado em `supabase/migrations/` e pode rodar de novo sem quebrar nada.

---

## 2. Camadas

```
  Telas  (v* = abas, s* = folhas, g* = painel)        o que a pessoa vê
     │  data-a / data-sel
  Ações  (objeto A)                                    traduz o toque; cada toque ganha um id (EV.acao)
     │
  Domínio (funções que mudam o dado)                   regra de negócio + ev('entidade.acao', {...})
     │                                   │
  Estado: state → docs (Supabase)        Eventos: fila no aparelho (localStorage) → tabela eventos
  sincroniza por docs_sinal (005)        sobe em lotes, não volta para os aparelhos (007)
  arquivos: Storage, comprimidos (006)          │
                                         Métricas: views m_* + metricas(de, ate) no banco
                                                │
                                         Painel (só gestão): recebe só os números
```

**Onde está cada coisa no `app.html`:**

| Peça | Onde |
|---|---|
| Emissor de eventos | `ev()`, `evEtapa()`, `EV_TIPOS`, `evEnvia()`, `evUsoTela()` |
| Sincronização do estado | `sbDB` (camada Supabase), `nuvemSalvar`/`nuvemEnviar`, `nuvemRefrescarSinal` |
| Arquivos | `arqPut`, `arqBaixa`, `comprimeImg`, `mockMigra` |
| Desfazer | `snap`, `guardaUndo`, `A.desfazer` |

---

## 3. Modelo de dados (estado)

| Entidade | Documento | O essencial | Atenção |
|---|---|---|---|
| **Pedido** | `pedidos/<nº>` | cliente, vendedor, `chegada`, `entrega` (dia às 17h), `vias`/`artePrep`/`arte`, `materiais[]`, `concluido`, `cancelado` | `concluido` vale para **entregue e cancelado**; o histórico está nos eventos |
| **Peça do pedido (lote)** | `lotes/<pedido>-<n>` | produto, cor, tecido, grade (M/F), `pers[]`, `steps{}` (execução), `terc{}`, `qr` | o **roteiro não é guardado**: é recalculado do produto atual (`rp`) |
| **Etapa em execução** | dentro do lote (`steps[etapa]`) | `st`, `ini`, `fim`, `op` (pessoa), `maq`, `util` (min), `he[]`, `partes[]` | `op` é sobrescrito ao passar para outra pessoa; o evento guarda a troca |
| **Insumo** | dentro do pedido (`materiais[]`) | `item`, `nec`, `st` (ok/comprar/pedido/recebido), `baixa` (o que saiu do estoque) | "Comprei" libera na hora (`recebido`), a pedido da fábrica |
| **Conserto** | `consertos/<lote>-C<k>` | peça de origem, etapa onde achou, etapa a refazer, motivo, quantas | o evento guarda também quem fez a etapa de origem |
| **Empresa (cliente)** | `clientes/<id>` | nome, CNPJ, contato | mesmo nome com CNPJ diferente = empresas diferentes |
| **Arquivo** | `arquivos/<id>` + Storage | tipo (mockup/arte/bordado), `bin` (onde está), `prev` (miniatura) | só mockup é comprimido; arte e programa vão no tamanho original |
| **Produto e roteiro** | `produtos/<id>` | etapas (`posto`, `deps`, `min` por peça), tecidos, aviamentos | produto usado em pedido não pode ser apagado |
| **Máquina/serviço** | `tipos/<id>` | nome, quantas máquinas, setor, se é feito fora | |
| **Pessoa** | `pessoas/<id>` | o que sabe fazer, cargos, disponível | |
| **Prestador** | `forn/<id>` | serviço, prazo (dias), quem leva | |
| **Acesso** | `usuarios/<id>` | e-mail, perfil (`gestao`, `escritorio`, `operacao` = chão de fábrica), pessoa ligada | o banco só deixa a gestão mudar acessos |
| **Configuração** | `config/main` | setores, expediente, feriados, cores, termos, estoque, `fuso` | documento muito disputado: separar é a fase 5 |

**Números de produção (01/11):** 75 pedidos, 189 peças, 167 arquivos. As peças pesam ~9 KB cada, por causa da miniatura do mockup dentro do documento.

---

## 4. Eventos

**Envelope** (tabela `eventos`, migração 007):

| Campo | O que é |
|---|---|
| `id` | criado no aparelho; reenviar não duplica |
| `ts` | quando o fato aconteceu; no registro feito depois, é a hora informada |
| `reg` | quando foi registrado no aparelho |
| `rec` | quando chegou ao banco |
| `acao` | o toque que gerou o evento |
| `tipo` | `entidade.acao` |
| `usuario` | quem estava com o app |
| `pessoa` | de quem é o trabalho |
| `dv` | o aparelho |
| `tela` | onde a ação foi feita |
| `ped`, `lote`, `ref` | pedido, peça e outro alvo (etapa, item, arquivo) |
| `de`, `para` | situação antes e depois |
| `q` | quantidade |
| `dur` | segundos de trabalho, sem pausas |
| `retro` | marcado depois do fato |
| `dados` | a fotografia do momento |
| `v`, `app` | versão do formato e do app |

**Catálogo** (fonte: `EV_TIPOS` no app; um teste confere que todo evento usa um nome do catálogo):

| Etapa da jornada | Eventos |
|---|---|
| Pedido | `pedido.criado`, `pedido.editado`, `pedido.prazo_alterado`, `pedido.aprovado` / `pedido.aprovacao_desfeita`, `pedido.entregue` / `pedido.entrega_desfeita`, `pedido.cancelado` / `pedido.reativado` |
| Escritório | `vias.separadas` / `vias.desmarcadas`, `arte.preparada` / `arte.preparo_desmarcado`, `arte.aprovada` / `arte.aprovacao_desmarcada`, `arte.enviada`, `tarefa.atribuida` |
| Compras | `material.do_estoque`, `material.comprado`, `material.em_falta`, `compras.lista_enviada` |
| Produção | `etapa.iniciada`, `etapa.concluida`, `etapa.pessoa_trocada`, `etapa.pausada`, `etapa.dividida`, `etapa.inicio_cancelado`, `etapa.revertida`, `etapa.horario_corrigido`, `hora_extra.autorizada` / `hora_extra.encerrada` |
| Prestador | `etapa.terceirizada` / `etapa.terceirizacao_desfeita`, `remessa.enviada`, `remessa.retornada`, `remessa.cancelada`, `fornecedor.trocado` |
| Qualidade | `conserto.aberto` (com quem fez a etapa de origem) |
| Pessoas e cadastros | `pessoa.ausente` / `pessoa.disponivel`, `tempo_padrao.alterado`, `acesso.alterado` |
| Sistema | `app.aberto`, `acao.desfeita`; a contagem de telas fica na tabela `uso` (por dia, sem registrar o que a pessoa viu) |

**Como acrescentar um evento:**
1. Nome novo em `EV_TIPOS`.
2. `ev()` (ou `evEtapa()` para etapas) **dentro da função que muda o dado**, depois da mudança.
3. Teste em `tests/eventos.test.js`.
4. Se a métrica precisar, view em migração nova.

**Volume:** cerca de 300 bytes por evento. Com ~1.000 eventos/dia, são ~10 MB/mês. Gravar não conta como tráfego.

---

## 5. Métricas (no banco, migração 007)

| View | Responde |
|---|---|
| `ev_validos` | eventos que valem (sem os desfeitos), com o dia no fuso da fábrica |
| `m_etapas` | tempo de cada processo feito: quem, máquina, peças, segundos, tempo padrão da época; sem etapas que voltaram para "não feita" |
| `m_pedidos` | dias da entrada à entrega; no prazo final e no prazo **prometido**; cancelados |
| `m_compras` | quando faltou, quando comprou, quando saiu do estoque, por pedido e item |
| `m_retrabalho` | conserto por motivo, etapa de origem e **quem fez a etapa de origem** |
| `m_adesao` | por pessoa e dia, quanto do trabalho foi registrado na hora (e não depois) |
| `m_desfazer` | o que mais se desfaz e em que tela: é onde a equipe se perde |
| `metricas(de, ate)` | resumo em JSON para o painel (só gestão) |

**Cuidado:** os dados da implantação ainda têm muita etapa marcada depois. Por isso `m_adesao` vem antes das outras métricas: primeiro medir quanto do registro é confiável.

---

## 6. Jornadas por perfil

| Perfil | Hoje | Problema principal | Para onde ir |
|---|---|---|---|
| **Gestão** (dona/encarregada, sócio) | entra em Fábrica › Máquinas; faz chão, escritório, painel e cadastros | Painel lê o estado (que se sobrescreve), não a história | Painel lê `metricas()`; tela "Hoje" com meta (ROTEIRO) |
| **Escritório / vendas** | entra em Fábrica › Máquinas e precisa tocar em "Escritório" todo dia | as tarefas dela são uma sub-aba da tela da produção; vê tarefas de todo mundo | abrir direto nas próprias tarefas (D3) |
| **Chão de fábrica** | Minha vez (Começar / Terminei / Deu problema) | depois de "Terminei" a folha completa da máquina abre por cima; pela ajuda chega no Novo pedido | ficar na Minha vez (Q2) |
| **Prestador (QR)** | lê a ficha e baixa os anexos | não confirma recebimento nem "pronto" | confirmar pelo QR (função nova) |

---

## 7. Problemas encontrados e plano

### Fase 0: segurança dos dados (feita em 02/11)
- Corrigir pedido apagava o que já tinha saído do estoque, e o "Já tem" descontava duas vezes. Agora guarda a baixa e as datas da compra.
- A conferência (Tem / Falta) e os 3 botões tinham regras diferentes de estoque. Agora é uma só.
- Apagar um produto usado em pedido entregue travava o app. Agora não deixa apagar, e uma peça sem produto não derruba o app.
- Cada aparelho criava uma cópia do mesmo mockup na biblioteca da empresa (11 cópias em produção). Agora o id é fixo, e uma migração junta as cópias.
- Empresas com o mesmo nome e CNPJ diferente eram juntadas. Agora não são mais.
- Ao abrir, o app baixava a lixeira inteira duas vezes. Agora lê só a lista.
- O QR mostrava ao prestador o preço unitário e quem fez cada etapa (008). Já não mostra. O mockup do QR também passa a vir do Storage.

### Fase 1: eventos (feita em 02/11)
Tabela de eventos, contagem de telas, métricas no banco e 37 tipos de evento ligados nas funções de domínio.

### Fase 2: o painel lê as métricas (feita em 02/11)
Aba **Resultados** no Painel do gestor, lendo `metricas()`: quanto dá para confiar (registro na hora), prazo final e prometido, tempo por processo comparado com o padrão da época, retrabalho por motivo, compras, onde a equipe desfaz e telas mais usadas. Só acrescenta; as abas antigas continuam iguais. Próximo passo: as abas antigas (Equipe, Ciclo) passam a ler os eventos em vez do estado.

### Fase 3: interface sem mudar nada de lugar (baixo risco)
| # | O quê |
|---|---|
| Q1 | trava de perfil: Escritório não entra em Cadastros/Gestor por atalhos (**feito na branch das ondas UX de 11/2026**, com permissões por responsabilidade e migração 011) |
| Q2 | o chão fica na Minha vez depois de "Terminei" |
| Q4 | "Desfazer" onde falta: conserto, pausar, dividir, hora extra, "Enviei", cancelar (**feito, ondas UX 11/2026**) |
| Q5 | o "voltar" do Android fecha a folha em vez de sair do app (**feito, ondas UX 11/2026**) |
| Q6 | o app lembra a aba da Fábrica (e o Escritório abre no Escritório) (**feito, ondas UX 11/2026**) |
| Q7 | os nomes configurados das etapas do escritório valem em todos os lugares |
| Q10 | o alerta do Painel abre o pedido sem trocar de tela |
| Q11 | tirar código morto e o caminho duplicado de criar pedido |
| Q12 | um padrão só de confirmação (**feito para arquivo e restaurar cópia; cancelar pedido segue com o quadro próprio, que pede o motivo**) |

Cada item é publicado fora do expediente, com nota em `NOVIDADES-PARA-EQUIPE.md`.

### Fase 4: estrutura (precisa de aprovação, uma por vez)
- Navegação por perfil (ROTEIRO): "Hoje · Pedidos · + Novo · Resultados · Mais".
- Uma porta só para insumos, com o estoque perto da Lista de compras.
- Um fluxo só para prestador: hoje está em 5 lugares, com dois "Chegou" diferentes.
- Pedido mais enxuto, com uma "aprovação do cliente" só. Hoje são duas, e a do documento não trava nada.
- Conserto registrado depois da etapa (revisão, embalagem, devolução do cliente).
- Prestador confirma recebimento e "pronto" pelo QR.

### Fase 5: enxugar os dados (tráfego e espaço)
- Miniaturas fora dos documentos (peça, arquivo, foto, logo), no Storage.
- Parar de gravar `_o`: tirar um item reescreve todos os seguintes.
- Separar `config/main` (estoque, reservas e atribuições mudam toda hora).
- Arquivar pedidos fechados.
- **Número de pedido sem colisão:** hoje, dois aparelhos criando pedido ao mesmo tempo podem pegar o mesmo número, e um some. A saída é criar com "inserir" (falha se existir) e renumerar, ou pedir o número ao banco.

### Riscos ainda abertos (conhecidos)
- Número de pedido duplicado entre aparelhos (fase 5): raro, mas perde um pedido.
- Estoque: dois aparelhos mexendo no mesmo item ao mesmo tempo, vale o último.
- O perfil Escritório pode cancelar, entregar e corrigir o histórico de produção: **resolvido na tela** (ondas UX 11/2026, `PERMS`); no banco, a migração `011_permissoes_responsabilidade.sql` está escrita e testada em PGlite, **falta aplicar**.
- `usuarios.hash/salt` (login do modo antigo) ficam legíveis para quem tem acesso; no Supabase não são usados e podem ser apagados.
