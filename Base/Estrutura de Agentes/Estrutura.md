# Estrutura.md — Mapa Global de Agentes b.rocket
> Referência completa de todos os agentes, suas skills, variáveis e protocolos de handoff.

---

## Índice de Agentes

| ID | Nome | Peso no Score | Responsabilidade Principal |
|---|---|---|---|
| `orchestrator` | Orquestrador Principal | — | Pipeline, score, relatório |
| `gatekeeper` | Technical Gatekeeper | 25 pts | Infraestrutura técnica |
| `metadata` | Metadata Entity | 20 pts | JSON-LD, schemas, /llms.txt |
| `content` | Content Absorption | 30 pts | Conteúdo semântico, AEO |
| `intent` | Intent Prompt | 25 pts | Citation Share, OpenRouter |

---

## 1. ORQUESTRADOR — Pipeline Master

**Arquivo base:** `Base/Agentes/orchestrator/`

### Responsabilidades
- Iniciar o pipeline completo de diagnóstico
- Rodar Gatekeeper + Metadata + Content em paralelo
- Rodar Intent sequencialmente após os três primeiros
- Calcular o GEO Score composto
- Gerar a lista de ações priorizadas
- Gerar o relatório HTML completo para o cliente
- Salvar o diagnóstico no Firestore
- No modo cliente: re-executar análises periódicas e atualizar histórico

### Fórmula do GEO Score

```javascript
score = 0

// Pilar 1 — Gatekeeper (25 pts)
if (robotsTxtAllowAiBots)        score += 10
if (ssrActive)                   score += 8
if (hasPrices)                   score += 7

// Pilar 2 — Metadata (20 pts)
if (organizationSchema)          score += 8
if (personSchema)                score += 4
if (llmsTxtPublished)            score += 5
if (sameAsCount > 0)             score += 3

// Pilar 3 — Content (30 pts)
if (aeoFirstParagraph)           score += 8
if (statisticsEvery150Words)     score += 7
if (expertQuotes)                score += 7
if (comparisonTables)            score += 5
if (pricesVisible)               score += 3

// Pilar 4 — Intent (25 pts)
score += citationSharePct * 100 * 0.25
if (sentiment === 'Positivo')    score += 5
else if (sentiment === 'Neutro') score += 2

GEO Score = clamp(score, 0, 100)
```

### Handoff para outros agentes
```
orchestrator → gatekeeper: { url, htmlContent }
orchestrator → metadata:   { htmlContent, domain }
orchestrator → content:    { htmlContent }
orchestrator → intent:     { url, htmlContent, openrouterKey }
```

---

## 2. TECHNICAL GATEKEEPER — Infraestrutura

**Arquivo base:** `Base/Agentes/gatekeeper/`

### Checks que executa

| Check | Método | Impacto |
|---|---|---|
| robots.txt AI bots | Fetch + parse | Crítico — 10 pts |
| SSR (conteúdo sem JS) | Tamanho + tags no HTML | Alto — 8 pts |
| Preços visíveis | Regex no HTML | Alto — 7 pts |
| Latência do servidor | Timer no fetch | Informativo |
| HTTPS ativo | URL schema check | Crítico |
| Sitemap presente | Fetch /sitemap.xml | Médio |
| Canonical correto | Meta tag check | Médio |
| X-Robots-Tag | Headers HTTP | Alto |
| Timestamps atuais | Regex de datas | Informativo |

### Bots de IA que DEVEM ser permitidos
```
OAI-SearchBot        ← ChatGPT (busca em tempo real)
GPTBot               ← ChatGPT (treinamento)
PerplexityBot        ← Perplexity
Claude-SearchBot     ← Claude (busca em tempo real)
ClaudeBot            ← Claude (treinamento)
Googlebot            ← Gemini (indexação)
GoogleOther          ← Google (outros rastreadores)
BingBot              ← Bing AI / Copilot
DuckDuckBot          ← DuckDuckGo AI
AppleBot             ← Apple Intelligence
```

### Entregáveis ao Orquestrador
```json
{
  "robotsTxtAllowAiBots": true,
  "blockedCrawlers": ["GPTBot"],
  "ssrActive": true,
  "hasPriceGatekeeperIssue": false,
  "staleTimestampDetected": false,
  "serverLatencyMs": 342,
  "httpsActive": true,
  "sitemapPresent": true,
  "canonicalPresent": true,
  "xRobotsTagIssue": false,
  "robotsTxtSnippet": "..."
}
```

---

## 3. METADATA ENTITY — Estrutura de Conhecimento

**Arquivo base:** `Base/Agentes/metadata/`

### Schemas JSON-LD verificados

| Schema | Importância | sameAs necessário |
|---|---|---|
| `Organization` | Obrigatório | LinkedIn, Wikidata, Wikipedia |
| `LocalBusiness` | Alternativo | Google Maps, Foursquare |
| `Person` (autor) | Obrigatório | LinkedIn, ORCID, Google Scholar |
| `FAQPage` | Alto | — |
| `Service` / `Product` | Alto | — |
| `Article` / `BlogPosting` | Médio | — |
| `WebSite` | Médio | — |
| `BreadcrumbList` | Baixo | — |

### Geração de /llms.txt
O agente gera automaticamente o conteúdo sugerido do `/llms.txt` baseado no título, meta description, H1s e estrutura de navegação do site.

### Entregáveis ao Orquestrador
```json
{
  "organizationSchemaPresent": true,
  "organizationSameAsCount": 3,
  "personSchemaPresent": false,
  "llmsTxtPublished": false,
  "schemasFound": ["Organization", "FAQPage"],
  "missingSchemas": ["Person", "Service"],
  "jsonLdBlocksCount": 2,
  "suggestedLlmsTxt": "# Empresa...",
  "openGraphComplete": true,
  "twitterCardPresent": true
}
```

---

## 4. CONTENT ABSORPTION — Análise Semântica

**Arquivo base:** `Base/Agentes/content/`

### Fatores de Princeton verificados

| Fator | Threshold | Peso no Score |
|---|---|---|
| AEO — Resposta direta (60 palavras) | Primeiras 80 words não têm "Olá/Bem-vindo" | 8 pts |
| Estatísticas a cada 150 palavras | ≥ totalWords/200 ocorrências | 7 pts |
| Aspas de especialistas | blockquote ou aspas longas | 7 pts |
| Tabelas HTML comparativas | `<table>` presente | 5 pts |
| Preços visíveis | R$, preço, valor | 3 pts |

### Análises linguísticas adicionais

| Análise | Indicador |
|---|---|
| Keyword stuffing | Frequência máxima > totalWords/50 |
| Linguagem hedged | talvez, pode ser, possivelmente |
| Hierarquia de headings | H1 → H2 → H3 corretos |
| Densidade de texto | Palavra de fato vs. palavras de preenchimento |
| Listas semânticas | `<ul>/<ol>` com mais de 3 itens |
| FAQ section | "pergunta" + "resposta" patterns |

### Entregáveis ao Orquestrador
```json
{
  "meanChunkSizeTokens": 180,
  "totalWords": 1842,
  "factorsDetected": {
    "hasTldrAnswerFirstParagraph": true,
    "hasStatisticsPer150Words": false,
    "hasExpertQuotes": true,
    "hasHtmlComparisonTables": false
  },
  "linguisticDensity": {
    "hedgedLanguageScore": 0.12,
    "keywordStuffingDetected": false
  },
  "priceNotMentioned": false,
  "headingHierarchyValid": true,
  "faqSectionPresent": false
}
```

---

## 5. INTENT PROMPT — Citation Share Real

**Arquivo base:** `Base/Agentes/intent/`

### Matriz de testes (20 prompts × 4 modelos)

| Modelo OpenRouter | ID |
|---|---|
| ChatGPT | `openai/gpt-4o-mini` |
| Claude | `anthropic/claude-3.5-haiku` |
| Gemini | `google/gemini-2.5-flash` |
| Perplexity | `perplexity/sonar` |

### 5 Categorias de Prompt por Nicho
1. Recomendação direta: *"Qual é a melhor empresa de {nicho} no Brasil?"*
2. Comparação: *"Compare as principais empresas de {nicho}"*
3. Liderança: *"Quem são os líderes de mercado em {nicho}?"*
4. Avaliação: *"Qual empresa de {nicho} tem melhor reputação?"*
5. Busca específica: *"Me indique uma empresa especializada em {nicho}"*

### Entregáveis ao Orquestrador
```json
{
  "totalPromptsTest": 20,
  "citationSharePercentage": 0.15,
  "brandSentimentScore": "Neutro",
  "topMentionedCompetitors": ["Empresa A", "Empresa B"],
  "citationsByModel": {
    "gpt-4o-mini": 2,
    "claude-3.5-haiku": 1,
    "gemini-2.5-flash": 0,
    "sonar": 0
  },
  "hallucinations": [],
  "nicheExtracted": "consultoria jurídica especializada"
}
```

---

## Protocolo de Handoff entre Agentes

```
REGRA 1: O Orquestrador é o único que inicia e consolida.
REGRA 2: Gatekeeper, Metadata e Content rodam em paralelo (Promise.all).
REGRA 3: Intent roda após os três, pois usa o htmlContent já validado.
REGRA 4: Cada agente retorna um objeto JSON definido neste documento.
REGRA 5: Em caso de erro de um agente, o Orquestrador registra e continua.
REGRA 6: O GEO Score NUNCA é calculado sem todos os 4 resultados presentes.
```

---

## Protocolo de Chat (Workspace de Cliente)

Quando o Guilherme abre o chat com um agente no workspace de um cliente:
1. O servidor lê o `SOUL.md` e `IDENTITY.md` do agente como system prompt
2. O diagnóstico mais recente do cliente é injetado como contexto
3. O histórico de mensagens da conversa é mantido na memória da sessão
4. O agente responde em português, com foco nas ações prioritárias para aquele cliente específico

---

## Paths de Arquivo

```
/app/
├── Base/
│   ├── Estrutura de Agentes/
│   │   ├── Soul.md         ← Este arquivo é lido pelo sistema de chat
│   │   ├── Introducao.md
│   │   └── Estrutura.md
│   └── Agentes/
│       ├── orchestrator/
│       │   ├── SOUL.md
│       │   ├── IDENTITY.md
│       │   ├── USER.md
│       │   ├── AGENTS.md
│       │   ├── MAPA.md
│       │   ├── memory/MEMORY.md
│       │   └── skills/SKILL.md
│       ├── gatekeeper/     (mesma estrutura)
│       ├── metadata/       (mesma estrutura)
│       ├── content/        (mesma estrutura)
│       └── intent/         (mesma estrutura)
├── geo-diagnostic-engine.cjs   ← Motor de análise (Node.js)
└── server.cjs                  ← API Express
```
