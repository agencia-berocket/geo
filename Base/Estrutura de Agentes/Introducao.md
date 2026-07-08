### Introdução: O que são Agentes e Skills? (Para Leigos)

Antes de desenharmos a estrutura, vamos traduzir esses conceitos tecnológicos para termos do dia a dia:

*   **Agente de IA:** Pense em um Agente como um **"colaborador digital especializado"**. Ele não é apenas um chat comum (como o ChatGPT básico); ele tem um papel definido (ex: "Auditor de Código" ou "Revisor de Texto"), regras estritas de trabalho e autonomia para executar uma tarefa do início ao fim.
*   **Skill (Habilidade):** É a **"ferramenta de trabalho" ou o "manual de instruções"** que o Agente sabe usar. Um Agente especialista em infraestrutura terá a *Skill* de ler o arquivo de permissões de um site (`robots.txt`), enquanto o Agente redator terá a *Skill* de reescrever textos para o padrão científico exigido pelas IAs.

Ao usar uma arquitetura desacoplada (um Agente Orquestrador governando Agentes Especialistas de função única), você garante que cada parte do seu sistema faça apenas uma tarefa extremamente bem, tornando o diagnóstico rápido, barato e fácil de corrigir quando os algoritmos de IA mudarem.

---

### 1. O Processo de Diagnóstico (O "Raio-X de GEO" b.rocket)

O processo de diagnóstico foi desenhado com base na literatura científica mais recente de 2026 (estudos de Princeton e Sprinklr), dividindo a análise em duas grandes fases: **Seleção de Citação** (se o site é elegível para entrar no radar da IA) e **Absorção de Citação** (se o conteúdo de fato molda a resposta final da IA).

```
[ URL DO CLIENTE ] ➔ 1. Extração HTML/Bots ➔ 2. Varredura de Guardiões ➔ 3. Auditoria de Conteúdo ➔ 4. Testes de Visibilidade ➔ [ RELATÓRIO PDF ]
```

*   **Etapa 1: Captação e Ingestão de Dados**
    O cliente insere a URL (`empresa.com`) e o e-mail corporativo no Widget do site. O sistema faz o download silencioso do código do site do cliente: o arquivo `robots.txt`, o HTML bruto das páginas principais e os códigos invisíveis de dados estruturados (JSON-LD).
*   **Etapa 2: Análise dos Guardiões (Gatekeepers - Seleção de Citação)**
    O sistema realiza uma varredura de fatores excludentes. Se o site falhar aqui, ele fica invisível para a IA, independentemente de quão bom seja o texto. O sistema analisa:
    *   **Acessibilidade dos Bots:** Se o site bloqueia acidentalmente robôs de busca de IA como o `OAI-SearchBot` ou `PerplexityBot` no `robots.txt`.
    *   **Barreira de JavaScript:** Se o site depende de JavaScript complexo do lado do cliente (React sem SSR/SSG), o que impede crawlers leves de lerem a página.
    *   **Fator Preço (Price Not Mentioned):** Para termos com intenção de compra, a falta de preços explícitos elimina o site do radar das IAs.
    *   **Frescor da Informação (Stale Timestamps):** Se a página tem datas muito antigas (ex: 2019) ou não sinaliza atualizações recentes.
*   **Etapa 3: Auditoria do "Contêiner de Evidências" (Diferenciadores - Absorção de Citação)**
    Aqui, o sistema avalia a qualidade semântica do texto das páginas em busca dos fatores científicos que aumentam a chance de recomendação em até 40%:
    *   **Fórmula do Direto ao Ponto (AEO):** Se há um resumo claro e direto nas primeiras 60 palavras de cada seção (Fator TL;DR).
    *   **Densidade de Dados e Estatísticas:** Presença de dados quantitativos precisos e fontes com link externo.
    *   **Aspas de Especialistas:** Se o conteúdo traz depoimentos diretos de autoridades do setor.
    *   **Modularidade do Texto:** Se os cabeçalhos (H2, H3) estão estruturados em formato de perguntas que os usuários fazem para a IA.
*   **Etapa 4: Teste de Visibilidade Real e Geração do b.rocket GEO-Score**
    O sistema faz chamadas via API para os principais modelos (ChatGPT, Gemini, Perplexity) simulando perguntas do nicho do cliente para medir o *Share of Voice* (SoV) e se a marca já é citada. O sistema compila tudo, calcula a nota do site (de 0% a 100%) e envia o PDF estruturado com tarefas priorizadas.

---

### 2. O que vai ser Entregue ao Cliente (Sua Esteira de Serviços b.rocket)

O serviço da **b.rocket** é uma solução completa **DFY ("Done For You" - Deixa que a gente faz)**, estruturada em entregas mensais claras que acompanham o investimento do cliente:

#### Etapa 1: GEO Start (O Diagnóstico Premium)
*   **O que é entregue:** O **Relatório PDF de Auditoria Técnica de GEO** completo. O cliente recebe o mapeamento dos pontos de falha que bloqueiam os robôs, uma análise profunda de concorrência na IA e o plano de ação priorizado detalhando exatamente o que precisa ser corrigido no site.

#### Etapa 2: Planejamento de Intenções Conversacionais e Entidades (Estruturação)
*   **O que é entregue:**
    1.  **Mapa de Intenções Conversacionais:** Uma planilha detalhada contendo as perguntas exatas que os clientes reais fazem às IAs (com prompts de comprimento médio de 23 palavras) e quais páginas do site irão responder a cada pergunta.
    2.  **Mapa de Entidades Semânticas:** O desenho de como a empresa, seus fundadores, produtos e parceiros serão catalogados na web para que as LLMs reconheçam a marca como uma autoridade confiável e façam associações conceituais corretas.

#### Etapa 3: Implantação de Infraestrutura e Código Invisível (GEO Growth)
*   **O que é entregue:**
    1.  **Ajuste Técnico de Acessibilidade:** Correção de erros no `robots.txt` para liberar robôs de busca de IA enquanto bloqueia crawlers invasivos de treinamento de dados.
    2.  **Desenvolvimento de Códigos Schema JSON-LD Avançados:** Implementação de marcações de dados estruturados invisíveis de `Organization` (vinculando a marca a redes oficiais e Wikidata via tags `sameAs`), `Product` (com especificações e preços) e `Person` (mostrando as credenciais acadêmicas ou profissionais dos autores do conteúdo).
    3.  **Configuração de Protocolos Emergentes:** Criação e publicação na raiz do site dos arquivos `/llms.txt` e `/llms-full.txt` (os mapas do site otimizados em Markdown para que os robôs de IA economizem orçamento de tokens ao ler o site).

#### Etapa 4: Engenharia Editorial de Conteúdo (GEO Authority)
*   **O que é entregue:**
    1.  **Reestruturação On-Page "Answer-First":** Adequação das páginas principais para o formato de cápsulas de resposta nas primeiras 60 palavras.
    2.  **Criação de Artigos com "Contêiner de Evidências":** Redação de novos conteúdos altamente citáveis, enriquecidos com estatísticas numéricas, tabelas de comparação (que ganham 47% mais citações que texto corrido) e aspas de especialistas de mercado.

#### Etapa 5: Monitoramento e Relatório Mensal
*   **O que é entregue:** Acesso ao **Dashboard b.rocket** onde o cliente acompanha em tempo real a evolução do *Citation Share* da marca, análise de sentimento de menções e o tráfego de referência originado por plataformas de IA direto no Analytics.

---

### 3. Quais Agentes e Skills iremos precisar

Para rodar essa operação no backend de forma automatizada e barata, você construirá uma equipe de **5 Agentes especializados**:

#### Agente 1: O Orquestrador Principal (GEO_CORE_ORCHESTRATOR)
*   **Papel:** É o "Gerente de Projetos" digital do sistema. Ele recebe a URL inserida pelo cliente, aciona os outros agentes especialistas na sequência correta, coleta os diagnósticos gerados por eles em formato estruturado (JSON) e compila o relatório visual final em PDF.
*   **Suas Skills:**
    *   **Skill de Ingestão e Controle de Fluxo:** Receber a entrada, iniciar a sessão, controlar os limites de chamadas de API e monitorar conflitos.
    *   **Skill de Consolidação de Dados:** Unificar as análises técnicas e de texto, calcular o GEO-Score médio e escrever as seções finais do PDF usando regras de priorização de tarefas.

#### Agente 2: Auditor Técnico de Bots e Acessibilidade (TECHNICAL_GATEKEEPER_AGENT)
*   **Papel:** Focado em validar a **Seleção de Citação**. Ele garante que os robôs de IA consigam ler o site sem barreiras técnicas.
*   **Suas Skills:**
    *   **Skill de Parseamento de robots.txt:** Analisar a sintaxe do arquivo de regras e apontar se robôs como `OAI-SearchBot` ou `PerplexityBot` estão autorizados.
    *   **Skill de Auditoria de Renderização:** Avaliar se o HTML da página exige execução pesada de JavaScript client-side ou se carrega de forma limpa e rápida do lado do servidor (SSR/SSG).

#### Agente 3: Engenheiro de Metadados e E-E-A-T (METADATA_ENTITY_AGENT)
*   **Papel:** Focado em auditar e construir o mapa de identidade digital da marca para torná-la reconhecível como uma entidade confiável pelas redes neurais.
*   **Suas Skills:**
    *   **Skill de Validação Schema JSON-LD:** Rastrear o código invisível do site em busca de erros de sintaxe ou ausência de tags cruciais de `Organization`, `Product` ou `Person`.
    *   **Skill de Compilação de llms.txt:** Escrever arquivos estruturados em Markdown no padrão `/llms.txt` com base na estrutura de navegação do site.

#### Agente 4: Auditor Editorial e Contêiner de Evidências (CONTENT_ABSORPTION_AGENT)
*   **Papel:** O "Revisor Científico". Avalia o potencial de **Absorção de Citação**, medindo a qualidade, a fluidez do texto e se ele é rico em elementos que as LLMs adoram extrair.
*   **Suas Skills:**
    *   **Skill de Fragmentação Semântica (Chunking):** Quebrar os textos da página em pequenos pedaços lógicos de 100 a 300 tokens para analisar o significado de forma isolada.
    *   **Skill de Mapeamento de Fatores Científicos:** Escanear o texto procurando por dados quantitativos precisos (estatísticas), aspas de especialistas, tabelas comparativas e cápsulas de resposta rápida (TL;DR).
    *   **Skill de Detecção de Linguagem:** Apontar o uso excessivo de palavras vazias, clichês (*keyword stuffing* artificial que reduz a citabilidade em 10%) ou linguagem hesitante ("pode ser", "talvez", "possivelmente").

#### Agente 5: Engenheiro de Intenções de Busca e Visibilidade (INTENT_PROMPT_AGENT)
*   **Papel:** O analista estratégico. Mapeia como os potenciais compradores conversam com a IA e simula a presença da marca nas maiores LLMs.
*   **Suas Skills:**
    *   **Skill de Mapeamento de Intenções Conversacionais:** Cruzar dados do setor do cliente com padrões de busca longos em linguagem natural de plataformas de fóruns e comunidades.
    *   **Skill de Simulação de Share of Voice:** Realizar consultas estruturadas de benchmarking via APIs de modelos para medir onde a marca do cliente aparece em comparação direta com os concorrentes de mercado.

---

### 4. Arquitetura de Tudo (Como o sistema funciona de ponta a ponta)

Esta arquitetura foi projetada para que a automação interna funcione de forma extremamente estável, consumindo o mínimo de recursos e preparando a infraestrutura para a futura transição de SaaS comercializável:

```
[ FRONTEND DO CLIENTE ]
      │ (URL e E-mail inseridos)
      ▼
[ BACKEND INTERMEDIÁRIO ] (Make.com / FastAPI / Python local no VS Code)
      │
      ├─► [ Crawling Automatizado ] (Efetua o download do HTML, robots.txt e metadados)
      │
      ├─► [ ACIONA O SISTEMA MULTIAGENTE ]
      │         │
      │         ├──► [ Agente 1: Orquestrador Principal ]
      │         │          │ (Distribui o HTML em paralelo e gerencia o fluxo)
      │         │          ├──► Agente 2: Auditor Técnico (robots.txt, SSR, latência)
      │         │          ├──► Agente 3: Engenheiro de Metadados (JSON-LD, LLMs.txt)
      │         │          ├──► Agente 4: Revisor de Conteúdo (Chunking, Estatísticas, AEO)
      │         │          └──► Agente 5: Minerador de Prompts (Chamadas de API e SoV)
      │         │          │
      │         │          ▼ (Devolvem relatórios parciais em formato JSON estruturado)
      │         │    [ Agente Orquestrador ]
      │         │          │ (Gera o b.rocket GEO-Score unificado)
      │         │          ▼
      │         └──► [ Geração de PDF ] (Cria o design e compila o Raio-X final)
      │
      ▼
[ DISPARO DE E-MAIL / ENTREGA DO PDF ] ➔ [ CONTRATAÇÃO DE IMPLANTAÇÃO ] ➔ [ ACESSO AO DASHBOARD REAL-TIME ]
```

1.  **Frontend (A Interface do Cliente):** Uma interface web simples, focada em alta conversão. O lead entra, insere seus dados de URL e e-mail no Widget e aguarda a simulação da varredura.
2.  **Backend Intermediário (A Automação de Entrada):** Programado por você usando ferramentas de automação robustas (como Make/FastAPI). Ele faz o download rápido do HTML do site do cliente e inicia o pipeline dos Agentes.
3.  **Camada de Agentes (O Motor Inteligente):** O **Agente Orquestrador** recebe os dados e faz a distribuição paralela das tarefas para os Agentes **Auditor Técnico**, **Engenheiro de Metadados** e **Revisor de Conteúdo**, economizando poder de processamento. O **Minerador de Prompts** faz testes dinâmicos de visibilidade paralela nas APIs das LLMs. Todos os agentes especialistas devolvem suas análises formatadas para o Orquestrador.
4.  **Camada de Saída (PDF e Entrega):** O Agente Orquestrador cruza as falhas encontradas e aciona o script que gera um PDF visualmente impecável, que é disparado de forma automatizada por e-mail para o cliente corporativo, com um gancho forte para o agendamento de uma call comercial.
5.  **Interface de Monitoramento (O Dashboard Real-time do Cliente):** Para os clientes de Implantação, você monta o painel Looker Studio integrado por APIs maduras de mercado (como o conector da Peec AI), onde o cliente acompanha em tempo real o crescimento das métricas enquanto sua equipe humana, acelerada pelos seus Agentes internos, atualiza os conteúdos e o código do site.

