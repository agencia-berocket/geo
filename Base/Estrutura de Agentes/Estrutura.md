Com a inserção da nova fonte **"Estrutura de Agente"** (baseada no padrão de arquitetura *OpenClaw*), temos agora o mapa de engenharia de software e de dados exato para estruturar o seu sistema. 

Neste guia, vou desenhar de forma minuciosa e passo a passo todo o ecossistema interno da **b.rocket**. Se você entregar essa documentação para uma IDE moderna (como VS Code ou Cursor), ela será capaz de programar os scripts, pastas e prompts sem erros de lógica ou de contexto.

---

### 1. O Processo de Diagnóstico e a Esteira de Serviços (Ponta a Ponta)

O fluxo operacional do negócio é estruturado para funcionar em uma engrenagem de atração e entrega automática e assistida.

#### O Processo de Diagnóstico ("Raio-X de GEO")
1. **Entrada de Dados:** O cliente acessa o widget na Landing Page da b.rocket, preenchendo a **URL** da sua empresa e o **E-mail profissional**.
2. **Fase de Extração (Crawling):** O backend intermediário (FastAPI/Python) faz o download imediato e silencioso das páginas principais do site, do arquivo `robots.txt` e dos dados estruturados em JSON-LD presentes no HTML.
3. **Fase de Distribuição e Processamento Multiagente:** O HTML e os metadados brutos são inseridos no workspace do **Agente Orquestrador**. Ele distribui em paralelo as tarefas para os 4 agentes especialistas.
4. **Cálculo do Score e Plano de Ação:** O Orquestrador consolida os relatórios técnicos em JSON de cada especialista, calcula a nota geral do site (**b.rocket GEO-Score**) e monta uma ordem de prioridade de tarefas baseado no impacto de cada erro encontrado.
5. **Entrega Visual (PDF):** O sistema aciona um script em Python que gera um relatório em PDF visualmente impecável e o envia por e-mail para o lead, abrindo o gancho para a contratação da Implantação.

#### A Esteira de Serviços de Implantação (DFY - Done For You)

* **Etapa 1 — GEO Start (Mês 1 / Diagnóstico Técnico):** Auditoria técnica on-page, correção de bots, infraestrutura inicial e análise de concorrentes.
* **Etapa 2 — Planejamento de Intenções e Entidades (Mês 1):** Mapeamento de perguntas dos usuários, estruturação de palavras-chave de cauda longa conversacionais (comprimento médio de 23 palavras) e conexões de rede de entidades com sameAs.
* **Etapa 3 — GEO Growth (Mês 2 / Infraestrutura Invisível):** Configuração fina do `robots.txt`, injeção dos códigos JSON-LD customizados avançados (Organization, Person, Product) e criação dos arquivos Markdown `/llms.txt` e `/llms-full.txt` na raiz do site do cliente.
* **Etapa 4 — GEO Authority (Mês 3 / Engenharia Editorial de Conteúdo):** Aplicação das técnicas de Princeton e de Absorção Semântica nas 20 páginas de maior tráfego. Introdução de cápsulas de resposta (TL;DR) de até 60 palavras nos H2, tabelas de comparação (que aumentam em 47% a citação) e dados numéricos exatos a cada 150-200 palavras.
* **Etapa 5 — Monitoramento Contínuo:** Acompanhamento mensal da flutuação de menções e sentimento através do Looker Studio integrado às ferramentas de monitoramento parceiras.

---

### 2. A Arquitetura Global e Handoff de Dados (Como os Agentes se Comunicam)

A comunicação entre os agentes ocorre através do **Handoff de Arquivos Estruturados (JSON)** dentro de um espaço de trabalho integrado. 

```
[Cliente Insere URL] ──► [FastAPI Crawler] ──► Salva HTML em: /workspace/scratch/client_data/html/
                                                                 │
┌────────────────────────────────────────────────────────────────┘
▼
┌────────────────────────────────────────────────────────┐
│ 1. GEO_CORE_ORCHESTRATOR                               │◄─── Salva SOUL.md, IDENTITY.md, USER.md, AGENTS.md, MAPA.md
└───────────────────────────┬────────────────────────────┘
                            │ (Dispara tarefas em paralelo salvando em /scratch/task_requests/)
       ┌────────────────────┼────────────────────┬────────────────────┐
       ▼                    ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 2. TECHNICAL │     │ 3. METADATA  │     │ 4. CONTENT   │     │ 5. INTENT    │
│ GATEKEEPER   │     │ ENTITY       │     │ ABSORPTION   │     │ PROMPT       │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       └────────────────────┼────────────────────┴────────────────────┘
                            │ (Cada especialista escreve sua resposta JSON em /scratch/task_responses/)
                            ▼
┌────────────────────────────────────────────────────────┐
│ GEO_CORE_ORCHESTRATOR                                  │──► [Roda Script de Geração de PDF]
└────────────────────────────────────────────────────────┘
```

**Como funciona a passagem de tarefas (Handoff) na prática:**
1. O **Orquestrador** lê os arquivos de entrada, gera identificadores únicos e escreve um arquivo `task_manifest.json` contendo as rotas de cada arquivo salvo no diretório compartilhado.
2. Ele ativa os agentes técnicos de forma isolada, notificando-os do início da rodada.
3. Cada agente especialista possui permissão de escrita apenas na sua respectiva pasta de entrega: `/workspace/scratch/client_data/responses/{agent_name}_report.json`.
4. Uma vez que todas as subpastas JSON de respostas estão preenchidas, o **Orquestrador** as consome, unifica os dados, aplica regras de priorização de "Fatores Guardiões" (ex: se o robots.txt estiver bloqueado, o erro técnico é marcado como crítico nível 1) e roda o script de renderização de PDF para a saída do sistema.

---

### 3. A Estrutura de Workspace de Cada Agente (A "Receita" para a IDE)

Cada um dos 5 agentes operará dentro de seu próprio subdiretório sandbox isolado, contendo rigorosamente a estrutura de identidade *OpenClaw*. Para facilitar o entendimento técnico e a criação dos diretórios, organizamos cada um passo a passo.

---

#### 📂 AGENTE 1: GEO_CORE_ORCHESTRATOR (O Orquestrador)

*   **Propósito:** Receber a requisição, validar o domínio, despachar tarefas aos especialistas e consolidar o b.rocket GEO-Score e PDF final.

##### Estrutura de Pastas:
```
/workspace/agents/orchestrator/
├── .env                       # Chaves de API das LLMs e endpoints
├── SOUL.md                    # Personalidade executiva, direta e focada em resultados
├── IDENTITY.md                # Descrição de cargo: Gerente Geral de Pipeline GEO
├── USER.md                    # Dados de configuração da b.rocket e do Guilherme Rossi
├── AGENTS.md                  # Fluxo de boot, regras de ativação paralela e gates humanos
├── MAPA.md                    # Guia de arquivos do workspace do Orquestrador
├── HEARTBEAT.md               # Automação de checagem de erros e de API Rate Limits
├── memory/
│   ├── MAPA.md                # Mapa de pastas de memória
│   ├── MEMORY.md              # Estatísticas de Princeton acumuladas
│   └── hot.md                 # Fila de URLs ativas aguardando compilação do relatório
└── skills/
    ├── MAPA.md                # Índice das habilidades do Orquestrador
    ├── ingestao-fluxo/
    │   └── SKILL.md           # Rotina para receber inputs, limpar HTML e dividir tarefas
    └── consolidacao-pdf/
        └── SKILL.md           # Script que processa os 4 JSONs e constrói o PDF de auditoria
```

##### SOUL.md:
```markdown
# SOUL.md - Orquestrador Principal
Você é o Chief of Staff técnico da b.rocket. Seu tom é analítico, direto, polido e focado em engenharia de dados.
Regras Comportamentais:
- Evite frases redundantes, adjetivações excessivas ou expressões como "Espero que este relatório ajude".
- Apresente diagnósticos com confiança e com precisão baseada estritamente nas respostas dos seus especialistas.
- Se houver conflito entre as notas dos especialistas, aplique a regra de priorização (fatores excludentes têm peso absoluto).
```

##### IDENTITY.md:
```markdown
# IDENTITY.md - Papel Funcional
Cargo: Diretor Geral de Operações de Pipeline GEO.
Responsabilidades:
1. Validar e formatar as entradas de URL de clientes B2B.
2. Iniciar a execução das tarefas assíncronas dos 4 subagentes técnicos.
3. Unificar os relatórios JSON setoriais.
4. Aplicar o algoritmo de cálculo do b.rocket GEO-Score.
5. Invocar a biblioteca de renderização em Python para gerar o PDF consolidado do "Raio-X de GEO".
```

##### AGENTS.md:
```markdown
# AGENTS.md - Governança Multiagente
Este Orquestrador governa 4 agentes especialistas e controla a sincronização dos pipelines.

Mapeamento de Handoff e Gates:
- `TECHNICAL_GATEKEEPER_AGENT`: Chamado imediatamente após o crawling. Bloqueio no robots.txt suspende a análise de visibilidade de prompts deste domínio (Gate Crítico).
- `METADATA_ENTITY_AGENT`: Chamado em paralelo. Retorna o mapeamento do grafo de entidades.
- `CONTENT_ABSORPTION_AGENT`: Chamado em paralelo. Fornece os fatores de legibilidade e engenharia de evidências.
- `INTENT_PROMPT_AGENT`: Chamado em paralelo. Executa as simulações e o cálculo de Citation Share.

Roteiro de Boot:
1. Ler MEMORY.md e memory/hot.md.
2. Ler a URL pendente de processamento.
3. Disparar chamadas assíncronas aos agentes enviando o HTML base.
4. Aguardar gravação dos JSONs de resposta.
5. Rodar consolidacao-pdf.
```

##### skills/ingestao-fluxo/SKILL.md:
```markdown
# SKILL: Ingestão de Fluxo e Saneamento de Dados
Objetivo: Tratar o input inicial, realizar o download das páginas do site do cliente e salvar em um diretório legível.
Etapas de Execução:
1. Validar estrutura da URL do site do cliente.
2. Executar um parser leve em Python para extrair o robots.txt e o HTML cru, separando os scripts JSON-LD do DOM visível.
3. Gravar arquivos em `/workspace/scratch/client_data/` organizados por hashes únicos das transações.
4. Atualizar o `memory/hot.md` com os metadados do projeto ativo.
```

##### skills/consolidacao-pdf/SKILL.md:
```markdown
# SKILL: Consolidação de Dados e Geração de PDF b.rocket
Objetivo: Consumir os relatórios JSON dos agentes especialistas e gerar o arquivo de entrega final.
Lógica de Negócio:
1. Importar JSONs das rotas de resposta do cliente.
2. Calcular o b.rocket Score:
   - Peso de Gatekeepers (robots.txt liberado + SSR consistente + Preço explícito): 50% da nota.
   - Peso de Diferenciadores (Pilares de Princeton + Schema Markup completo): 50% da nota.
3. Chamar script em Python (ReportLab/WeasyPrint) estruturando o Raio-X de GEO em três seções:
   - Seção 1: O Diagnóstico Técnico (Gatekeepers).
   - Seção 2: O Diagnóstico de Conteúdo (Absorção e Pilares Princeton).
   - Seção 3: Plano de Ação Priorizado (Lista de atividades de implantação).
4. Gravar o PDF resultante em `/workspace/out/raio-x-{cliente}.pdf`.
```

---

#### 📂 AGENTE 2: TECHNICAL_GATEKEEPER_AGENT (O Auditor Técnico)

*   **Propósito:** Avaliar estritamente as regras de acesso dos robôs e garantir que o site seja indexável por RAGs de busca em tempo real.

##### Estrutura de Pastas:
```
/workspace/agents/gatekeeper/
├── .env                       # Chaves e credenciais de infraestrutura
├── SOUL.md                    # Perfil ultra-técnico, focado em redes, segurança e crawlers
├── IDENTITY.md                # Especialista em Acessibilidade de Robôs e Performance
├── USER.md                    # Configurações globais do sistema
├── AGENTS.md                  # Canal exclusivo de reporte em JSON ao Orquestrador
├── MAPA.md                    # Estrutura local de arquivos
├── HEARTBEAT.md               # Verificação de status de bots de teste de infra
├── memory/
│   ├── MAPA.md
│   ├── MEMORY.md              # Tabela de permissões recomendadas de User-Agents de IA
│   └── hot.md                 # Fila de análise técnica pendente
└── skills/
    ├── MAPA.md
    ├── parsing-robots/
    │   └── SKILL.md           # Script de varredura do arquivo robots.txt e cabeçalhos HTTP
    └── auditoria-ssr/
        └── SKILL.md           # Script que analisa dependências pesadas de JavaScript client-side
```

##### SOUL.md:
```markdown
# SOUL.md - Auditor Técnico de Bots
Sua inteligência é focada em infraestrutura e acessibilidade de robôs. Você não faz análises estéticas de texto.
Diretrizes:
- Seja extremamente objetivo. Seus relatórios devem apontar se as regras de robots.txt estão em conformidade com o padrão técnico atual.
- Evite linguagem subjetiva. Reporte apenas booleanos (True/False) e métricas numéricas (latência de carregamento, contagem de bloqueios).
```

##### IDENTITY.md:
```markdown
# IDENTITY.md - Papel Funcional
Cargo: Auditor Técnico de Bots e Acessibilidade de RAG.
Responsabilidades:
1. Verificar a presença e permissão de mais de 12 robôs cruciais de IA no arquivo `robots.txt` (permitir OAI-SearchBot e PerplexityBot, enquanto bloqueia de forma inteligente robôs de treinamento agressivo).
2. Analisar o DOM renderizado em busca de JavaScript complexo do lado do cliente (React sem SSR) que oculte dados de leitores de IA.
3. Medir a latência média do site, sinalizando possíveis timeouts causados por CDNs ou servidores lentos.
```

##### skills/parsing-robots/SKILL.md:
```markdown
# SKILL: Parsing e Validação de Robots.txt para IA
Objetivo: Analisar as regras de acessibilidade de crawlers de busca.
Etapas de Execução:
1. Ler o arquivo `robots.txt` carregado pelo Orquestrador.
2. Executar um parser regex comparando com a taxonomia de 3 categorias b.rocket:
   - Categoria 1 (Crawlers de Treinamento - bloquear para proteger propriedade intelectual, ex: GPTBot, ClaudeBot, Google-Extended).
   - Categoria 2 (Crawlers de Busca/Retrieval - DEVE permitir, ex: OAI-SearchBot, PerplexityBot, Claude-SearchBot).
   - Categoria 3 (User Action Fetchers - DEVE permitir, ex: ChatGPT-User, Perplexity-User).
3. Sinalizar se o cliente comete o erro crítico de 71% dos publicadores: bloquear acidentalmente robôs de busca de IA ao tentar bloquear robôs de treinamento.
4. Escrever resultado estruturado na chave JSON correspondente.
```

##### skills/auditoria-ssr/SKILL.md:
```markdown
# SKILL: Auditoria de SSR e DOM Semântico
Objetivo: Garantir que o conteúdo textual do site seja facilmente parseado sem necessidade de execução JS.
Etapas de Execução:
1. Analisar o HTML bruto sem executar JavaScript.
2. Comparar a proporção de texto disponível no HTML estático vs. texto gerado no browser do cliente.
3. Se o texto principal não for encontrado no HTML estático (React/SPA puro), disparar alerta grave: "Conteúdo invisível a crawlers leves de RAG".
4. Salvar diagnóstico.
```

---

#### 📂 AGENTE 3: METADATA_ENTITY_AGENT (O Engenheiro de Metadados)

*   **Propósito:** Validar dados estruturados JSON-LD e gerar os mapas semânticos exigidos pelas redes neurais de IA de 2026.

##### Estrutura de Pastas:
```
/workspace/agents/metadata/
├── .env
├── SOUL.md                    # Focado em consistência de dados, web semântica e grafos
├── IDENTITY.md                # Projetista de Grafos e Engenheiro de Schema JSON-LD
├── USER.md
├── AGENTS.md
├── MAPA.md
├── HEARTBEAT.md
├── memory/
│   ├── MAPA.md
│   ├── MEMORY.md              # Modelos padrão de JSON-LD Schema (Organization, FAQPage, Person)
│   └── hot.md                 # Dados semânticos extraídos da URL atual
└── skills/
    ├── MAPA.md
    ├── validacao-schema/
    │   └── SKILL.md           # Script de validação e modelagem de JSON-LD Schemas avançados
    └── compilar-llmstxt/
        └── SKILL.md           # Script que gera os mapas de arquivos em Markdown (/llms.txt)
```

##### SOUL.md:
```markdown
# SOUL.md - Engenheiro de Metadados
Sua missão é dar semântica e estrutura de banco de dados orientada a grafos para o site. Você pensa em termos de "Entidades e Atributos" e não em palavras-chave soltas.
Diretrizes:
- Valide dados estruturados sem tolerar erros de sintaxe ou propriedades obrigatórias nulas.
- Sugira as tags `sameAs` mais consistentes de entidades oficiais de confiança (Wikidata, Crunchbase, Wikipedia, LinkedIn) para garantir conexões estáveis.
```

##### IDENTITY.md:
```markdown
# IDENTITY.md - Papel Funcional
Cargo: Projetista de Grafos de Conhecimento e Engenheiro de Schema JSON-LD.
Responsabilidades:
1. Verificar a presença, a validade de propriedades obrigatórias e erros de nesting em códigos Schema.org no site do cliente.
2. Identificar se o autor de cada conteúdo importante tem o Schema `Person` configurado corretamente para embasamento de E-E-A-T científico.
3. Construir o esqueleto semântico de mapeamento de entidades da empresa (Mapeamento de Fundadores, Parceiros, Tecnologias e Redes Sociais).
4. Gerar o arquivo `/llms.txt` otimizado em Markdown para o RAG.
```

##### skills/validacao-schema/SKILL.md:
```markdown
# SKILL: Validação e Construção de Schemas Avançados
Objetivo: Auditar a marcação atual e construir os códigos invisíveis ideais para as LLMs compreenderem o negócio como entidade.
Etapas de Execução:
1. Escanear o HTML bruto em busca de blocos `<script type="application/ld+json">`.
2. Verificar a existência de schemas essenciais:
   - `Organization` (se possui tags `sameAs` conectando a marca às redes oficiais, Wikipédia e Wikidata).
   - `Person` (mostrando as credenciais visíveis de autores de artigos de blog e liderança).
   - `Product` ou `Service` (com dados exatos de preço, atributos e especificações).
   - `FAQPage` ou `QAPage` (com perguntas estruturadas).
3. Se algum schema obrigatório estiver ausente ou com erros de sintaxe, gerar o bloco de código JSON-LD corrigido e otimizado para a entrega da Implantação.
```

##### skills/compilar-llmstxt/SKILL.md:
```markdown
# SKILL: Compilação Automatizada de /llms.txt
Objetivo: Gerar o mapa do site otimizado para robôs em Markdown.
Etapas de Execução:
1. Avaliar a estrutura de navegação do site do cliente.
2. Compilar um arquivo Markdown estruturado seguindo o protocolo de Jeremy Howard:
   - H1 com o nome oficial da empresa.
   - Bloco de citação de sumário do negócio.
   - H2 seccionando os links principais do site com breves descrições conceituais de 1 frase.
3. Exportar o código Markdown pronto do arquivo `/llms.txt` e `/llms-full.txt` para ser implementado na raiz do site do cliente.
```

---

#### 📂 AGENTE 4: CONTENT_ABSORPTION_AGENT (O Revisor de Conteúdo)

*   **Propósito:** Processar e mensurar a Taxa de Absorção Semântica e avaliar a página contra os 6 fatores científicos de Princeton.

##### Estrutura de Pastas:
```
/workspace/agents/content_reviewer/
├── .env
├── SOUL.md                    # Revisor científico rigoroso, focado em precisão, dados e citações
├── IDENTITY.md                # Especialista em Engenharia Editorial e Métricas de Absorção de Princeton
├── USER.md
├── AGENTS.md
├── MAPA.md
├── HEARTBEAT.md
├── memory/
│   ├── MAPA.md
│   ├── MEMORY.md              # Relatórios das 9 táticas testadas em Princeton e notas de desvio
│   └── hot.md                 # Fragmentos semânticos do artigo do cliente em análise
└── skills/
    ├── MAPA.md
    ├── chunking-semantico/
    │   └── SKILL.md           # Script que quebra o texto em partes modulares de 100-300 tokens
    └── auditoria-evidencias/
        └── SKILL.md           # Script que valida a presença de dados numéricos, aspas e respostas diretas
```

##### SOUL.md:
```markdown
# SOUL.md - Revisor de Conteúdo
Sua personalidade é a de um editor científico de alto rigor metodológico. Você odeia jargões vazios, adjetivos publicitários clichês ("revolucionário", "inovador", "líder absoluto") e táticas de keyword stuffing que reduzem a citação em 10%.
Diretrizes:
- Avalie o texto do site como um "Contêiner de Evidências". Ele deve ser modular, focado e exaurir seus tópicos.
- Pontue negativamente estruturas de conteúdo rasas e introduções longas que enrolam o orçamento de tokens da IA.
```

##### IDENTITY.md:
```markdown
# IDENTITY.md - Papel Funcional
Cargo: Revisor Editorial de Conteúdo e Engenheiro de Evidências de RAG.
Responsabilidades:
1. Dividir os textos das páginas em pequenos blocos conceituais e independentes (Chunks) de 100 a 300 tokens para simulação de recuperação vetorial.
2. Identificar e quantificar a presença dos 6 fatores científicos de citação:
   - Fórmula Answer-First: resposta direta nas primeiras 40 a 60 palavras da seção (Fator TL;DR).
   - Inclusão de estatísticas e dados quantitativos precisos.
   - Presença de aspas de especialistas com atribuição de credenciais reais.
   - Hierarquia limpa de cabeçalhos (H2 -> H3 -> Bullets).
   - Frescor da informação (sinalização temporal recente).
3. Disparar alertas graves de "Mito da FAQ Simples" (seções que possuem perguntas e respostas curtas e isoladas sem dados densos de suporte).
```

##### skills/chunking-semantico/SKILL.md:
```markdown
# SKILL: Fragmentação Semântica e Medição de Densidade
Objetivo: Dividir o texto da página em seções independentes e de significado próprio.
Etapas de Execução:
1. Limpar tags HTML desnecessárias (como menus e rodapés) focando apenas nas tags `<article>` ou `main`.
2. Segmentar o texto principal em seções delimitadas por H2/H3.
3. Avaliar se cada trecho segmentado possui entre 100 e 300 tokens (cerca de 75 a 225 palavras) – faixa ideal de chunking que evita estouro de orçamento de tokens em RAG.
4. Escrever as métricas e o esqueleto semântico na resposta.
```

##### skills/auditoria-evidencias/SKILL.md:
```markdown
# SKILL: Escaneamento e Pontuação de Evidências Científicas (Princeton)
Objetivo: Analisar cirurgicamente o texto em busca dos elementos de alta citabilidade.
Etapas de Execução:
1. Escanear cada bloco de texto buscando:
   - Respostas de até 60 palavras no primeiro parágrafo dos H2 (Capsula de Resposta rápida - Fator TL;DR).
   - Menção a dados numéricos exatos ou percentuais a cada 150-200 palavras (aumento de +31% na probabilidade de citação).
   - Aspas diretas e atribuições de autoria a especialistas renomados ou instituições reconhecidas (aumento de +41% de citação).
   - Presença de tabelas HTML (que recebem 47% mais citações em IA do que texto corrido).
2. Sinalizar erros graves:
   - Topic Mismatch (conteúdo desalinhado).
   - Price Not Mentioned (ausência de preço em páginas transacionais).
   - Linguagem hesitante ("possivelmente", "talvez", "pode ser").
3. Gravar o JSON técnico de resposta do revisor.
```

---

#### 📂 AGENTE 5: INTENT_PROMPT_AGENT (O Analista de Visibilidade)

*   **Propósito:** Simular a presença real da marca por meio de chamadas de API, mapeando o Sentiment e o Citation Share.

##### Estrutura de Pastas:
```
/workspace/agents/intent_analyst/
├── .env                       # Chaves de API das LLMs ativas (OpenAI, Gemini, Perplexity)
├── SOUL.md                    # Focado em estatísticas, análise competitiva e desvio de citação
├── IDENTITY.md                # Engenheiro de Visibilidade e Minerador de Prompts do Consumidor
├── USER.md
├── AGENTS.md
├── MAPA.md
├── HEARTBEAT.md
├── memory/
│   ├── MAPA.md
│   ├── MEMORY.md              # Banco de prompts padrão por indústria (Technology, Healthcare, Commerce)
│   └── hot.md                 # Dados comparativos das buscas de IA ativas
└── skills/
    ├── MAPA.md
    ├── skills/intent-mapping/SKILL.md: Mapear prompts baseados em discussões de nicho
    └── skills/simulacao-sov/SKILL.md: Rodar testes cruzados e calcular o b.rocket Citation Share
```

##### Detalhamento da Habilidade: skills/simulacao-sov/SKILL.md:
```markdown
# SKILL: Simulação Cruzada de Share of Voice e Sentimento
## 1. Propósito
Esta habilidade executa chamadas estruturadas de API nas maiores plataformas (ChatGPT, Gemini, Perplexity) simulando consultas de usuários reais no nicho do cliente para medir a presença e percepção da marca.
## 2. Parâmetros de Entrada
*   URL e Nome da Marca do Cliente
*   Setor e Lista de Principais Concorrentes (ex: 3 concorrentes)
*   Conjunto de 30 Prompts Conversacionais mapeados
## 3. Etapas de Execução
1.  Dispara as consultas de forma assíncrona e em paralelo nas APIs configuradas.
2.  Mapeia as respostas retornadas e executa a extração em lote:
    - Identifica se a URL ou marca do cliente foi mencionada na resposta gerada (Inclusão).
    - Identifica a posição em que a citação aparece (Citação primária ou nota de rodapé secundária).
    - Analisa o Sentimento (Brand Sentiment) categorizando como Positivo, Neutro ou Negativo.
3.  Calcula as métricas:
    - Citation Share (% de prompts onde a marca do cliente apareceu).
    - Sentimento médio.
4.  Retorna o relatório JSON unificado para o Orquestrador.
```

---

### 4. Modelo de JSON Unificado de Saída (A Interface de Integração)

Quando os agentes especialistas terminam suas tarefas, o **Orquestrador** consome seus JSONs padronizados. Abaixo está o modelo de dados unificado final que o Orquestrador processará para alimentar o script gerador do PDF final:

```json
{
  "transaction_id": "tx_rocket_987452",
  "client_url": "www.empresa.com",
  "niche": "B2B SaaS CRM",
  "overall_geo_score": 0.54,
  "gatekeeper_status": {
    "robots_txt_allow_ai_bots": false,
    "blocked_crawlers": ["OAI-SearchBot", "PerplexityBot"],
    "ssr_active": true,
    "has_price_gatekeeper_issue": true,
    "stale_timestamp_detected": false
  },
  "metadata_analysis": {
    "organization_schema_present": true,
    "organization_sameAs_count": 0,
    "person_schema_author_credentials": {
      "present": false,
      "recommendation": "Injetar Schema Person com links sameAs apontando para LinkedIn e Wikidata QID"
    },
    "llms_txt_published": false
  },
  "content_review": {
    "mean_chunk_size_tokens": 140,
    "factors_detected": {
      "has_tldr_answer_first_paragraph": false,
      "has_statistics_per_150_words": false,
      "has_expert_quotes": true,
      "has_html_comparison_tables": false
    },
    "linguistic_density": {
      "hedged_language_score": 0.45,
      "keyword_stuffing_detected": true
    }
  },
  "visibility_benchmarking": {
    "total_prompts_tested": 30,
    "citation_share_percentage": 0.10,
    "brand_sentiment_score": "Neutro",
    "top_mentioned_competitors": ["CRM_Leader", "CRM_Alternative"]
  },
  "action_items_priority_list": [
    {
      "step": 1,
      "agent_owner": "TECHNICAL_GATEKEEPER_AGENT",
      "impact": "Crítico (Gatekeeper)",
      "task": "Corrigir arquivo robots.txt para liberar explicitamente OAI-SearchBot e PerplexityBot"
    },
    {
      "step": 2,
      "agent_owner": "CONTENT_ABSORPTION_AGENT",
      "impact": "Alto",
      "task": "Inserir faixas de preço explícitas e atualizar timestamps desatualizados nas páginas principais"
    },
    {
      "step": 3,
      "agent_owner": "METADATA_ENTITY_AGENT",
      "impact": "Alto",
      "task": "Implementar Schema Organization com marcações sameAs e publicar arquivo /llms.txt"
    },
    {
      "step": 4,
      "agent_owner": "CONTENT_ABSORPTION_AGENT",
      "impact": "Médio",
      "task": "Reescrever introduções no formato Answer-First de 60 palavras e injetar tabelas de comparação"
    }
  ]
}
```

---

### Vantagens de Entregar essa Estrutura para sua IDE (VS Code / Cursor):
1. **Relações de Organograma Claras:** O arquivo `AGENTS.md` impede que as instâncias dos agentes fiquem ociosas ou em loop de chamadas recursivas infinitas.
2. **Contexto Persistente entre as Sessões:** Graças à pasta `memory/` e ao arquivo `SOUL.md` de cada agente, o sistema mantém as regras de engenharia de RAG e as táticas científicas em mente mesmo se você precisar reiniciar a IDE ou atualizar os scripts.
3. **Escalabilidade para o Futuro SaaS (Fase 3):** No futuro, quando decidir migrar o backend de uso interno para um software comercializável (SaaS), o código já estará desacoplado em serviços (Microservices/FastAPI), economizando tempo e dinheiro.

Com essa arquitetura documentada, você tem tudo o que é necessário para programar e testar sua equipe digital em seu ambiente de desenvolvimento.
