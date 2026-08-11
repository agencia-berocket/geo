# Estrutura.md — Mapa Global de Agentes b.rocket
> Referência completa de todos os agentes, suas skills, variáveis e protocolos de handoff.

---

## Índice de Agentes (Ecossistema de 9 Agentes)

| ID | Nome | Peso no Score | Responsabilidade Principal |
|---|---|---|---|
| `orchestrator` | Orquestrador Principal | — | Pipeline master, score consolidado, relatórios HTML/PDF |
| `gatekeeper` | Technical Gatekeeper | 18 pts | Infraestrutura técnica, robots.txt, SSR, latência |
| `metadata` | Metadata Entity | 15 pts | JSON-LD, schemas, sameAs, /llms.txt |
| `content` | Content Absorption | 18 pts | Conteúdo semântico, AEO, estatísticas Princeton |
| `seo_optimizer` 🆕 | SEO Optimizer | 14 pts | Snippets clássicos, Title/Meta, PageRank interno, Alt tags |
| `semantic_explorer` | Semantic Explorer | 13 pts | Mapeamento de Content Gaps e Topic Clusters |
| `offpage` | Off-Page Entity Monitor | 10 pts | Autoridade de Entidade Externa & RP Digital |
| `intent` | Intent Prompt | 12 pts | Citation Share real nas LLMs via OpenRouter |
| `checklist_architect` 🆕 | Checklist Architect | — | QA, tradução de código (JSON-LD/robots.txt) e checklists CMS |

---

## 1. ORQUESTRADOR — Pipeline Master

**Arquivo base:** `Base/Agentes/orchestrator/`

### Responsabilidades
- Iniciar o pipeline completo de diagnóstico
- Rodar Gatekeeper + Metadata + Content + SEO Optimizer + Semantic Explorer + Off-Page Entity Monitor em paralelo
- Rodar Intent e Checklist Architect sequencialmente após os 6 especialistas
- Calcular o GEO Score composto (7 pilares)
- Gerar a lista de ações priorizadas e o checklist de QA
- Gerar o relatório HTML e PDF completo para o cliente
- Salvar o diagnóstico no Firestore

### Fórmula do GEO Score Composto (7 Pilares)

```javascript
score = 0

// Pilar 1 — Gatekeeper (18 pts)
if (robotsTxtAllowAiBots)        score += 7
if (ssrActive)                   score += 6
if (hasPrices)                   score += 5

// Pilar 2 — Metadata (15 pts)
if (organizationSchema)          score += 6
if (personSchema)                score += 3
if (llmsTxtPublished)            score += 4
if (sameAsCount > 0)             score += 2

// Pilar 3 — Content (18 pts)
if (aeoFirstParagraph)           score += 5
if (statisticsEvery150Words)     score += 5
if (expertQuotes)                score += 4
if (comparisonTables)            score += 2
if (pricesVisible)               score += 2

// Pilar 4 — SEO Optimizer (14 pts) 🆕
score += Math.round((seoScore / 100) * 14)

// Pilar 5 — Semantic Explorer (13 pts)
score += Math.round((topicCoverageScore / 100) * 13)

// Pilar 6 — Off-Page Entity Monitor (10 pts)
score += Math.round((externalEntityScore / 100) * 10)

// Pilar 7 — Intent Prompt (12 pts)
score += citationSharePct * 100 * 0.08
if (sentiment === 'Positivo')    score += 4
else if (sentiment === 'Neutro') score += 2

GEO Score = clamp(score, 0, 100)
```

### Handoff para outros agentes
```
orchestrator → gatekeeper:        { url, htmlContent }
orchestrator → metadata:          { htmlContent, domain }
orchestrator → content:           { htmlContent }
orchestrator → seo_optimizer:     { url, htmlContent }
orchestrator → semantic_explorer: { url, htmlContent, apiKey }
orchestrator → offpage:           { url, htmlContent, apiKey }
orchestrator → intent:            { url, htmlContent, openrouterKey }
orchestrator → checklist_architect:{ gatekeeper, metadata, content, seo, semantic, offpage, domain, clientUrl }
```

---

## 2. TECHNICAL GATEKEEPER — Infraestrutura

**Arquivo base:** `Base/Agentes/gatekeeper/`

### Checks que executa

| Check | Método | Impacto |
|---|---|---|
| robots.txt AI bots | Fetch + parse | Crítico — 8 pts |
| SSR (conteúdo sem JS) | Tamanho + tags no HTML | Alto — 6 pts |
| Preços visíveis | Regex no HTML | Alto — 6 pts |
| Latência do servidor | Timer no fetch | Informativo |
| HTTPS ativo | URL schema check | Crítico |
| Sitemap presente | Fetch /sitemap.xml | Médio |

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

---

## 4. CONTENT ABSORPTION — Análise Semântica

**Arquivo base:** `Base/Agentes/content/`

### Fatores de Princeton verificados

| Fator | Threshold | Peso no Score |
|---|---|---|
| AEO — Resposta direta (60 palavras) | Primeiras 80 words sem "Olá/Bem-vindo" | 5 pts |
| Estatísticas a cada 150 palavras | ≥ totalWords/200 ocorrências | 5 pts |
| Aspas de especialistas | blockquote ou aspas longas | 5 pts |
| Tabelas HTML comparativas | `<table>` presente | 3 pts |
| Preços visíveis | R$, preço, valor | 2 pts |

---

## 5. SEMANTIC EXPLORER — Ideação e Content Gaps

**Arquivo base:** `Base/Agentes/semantic_explorer/`

### Checks e Entregáveis

| Análise | Descrição |
|---|---|
| Mapeamento de Content Gaps | Identifica sub-tópicos essenciais ausentes no site do cliente |
| Topic Clusters | Estrutura sugestões em Pillar Page + Artigos de Cluster |
| Briefing de Conteúdo | Gera briefings prontos para criação de novos conteúdos |

```json
{
  "topicCoverageScore": 60,
  "contentGapsCount": 3,
  "contentGaps": [
    {
      "topic": "Comparativo de Custos do Nicho",
      "searchIntent": "Qual a diferença de preço entre soluções?",
      "urgency": "Alta",
      "recommendedFormat": "Pillar Page com Tabela HTML"
    }
  ],
  "suggestedClusters": [
    {
      "clusterName": "Cluster Semântico: Autoridade de Nicho",
      "pillarTopic": "Guia Definitivo do Nicho",
      "subTopics": ["Comparativo de Custos", "Calculadora de ROI"]
    }
  ]
}
```

---

## 6. OFF-PAGE ENTITY MONITOR — Autoridade Externa & RP

**Arquivo base:** `Base/Agentes/offpage/`

### Checks e Entregáveis

| Análise | Descrição |
|---|---|
| External Footprint | Mede a presença da marca no Wikidata, LinkedIn, Crunchbase e Imprensa |
| Co-Ocorrência Semântica | Avalia a associação do nome da marca com palavras-chave do nicho |
| RP Digital para LLMs | Projeta pautas de relações públicas em portais de alta autoridade |

```json
{
  "externalEntityScore": 55,
  "externalFootprint": {
    "hasLinkedInCompanyPage": true,
    "hasCrunchbaseProfile": false,
    "hasWikipediaOrWikidataMention": false,
    "hasMajorNewsArticles": false
  },
  "digitalPrOpportunities": [
    {
      "portalType": "Portais de Notícias de Tecnologia",
      "suggestedTopic": "Pesquisa de Mercado sobre Tendências do Nicho",
      "expectedImpact": "Gera co-ocorrência vetorial nas LLMs"
    }
  ]
}
```

---

## 7. INTENT PROMPT — Citation Share Real

**Arquivo base:** `Base/Agentes/intent/`

### Matriz de testes (20 prompts × 4 modelos)

| Modelo OpenRouter | ID |
|---|---|
| ChatGPT | `openai/gpt-4o-mini` |
| Claude | `anthropic/claude-haiku-4.5` |
| Gemini | `google/gemini-2.5-flash` |
| Perplexity | `perplexity/sonar` |

---

## Protocolo de Handoff entre Agentes

```
REGRA 1: O Orquestrador é o único que inicia e consolida.
REGRA 2: Gatekeeper, Metadata, Content, Semantic Explorer e Off-Page rodam em paralelo (Promise.all).
REGRA 3: Intent roda após os cinco, pois usa o htmlContent já validado.
REGRA 4: Cada agente retorna um objeto JSON definido neste documento.
REGRA 5: Em caso de erro de um agente, o Orquestrador registra e continua.
REGRA 6: O GEO Score NUNCA é calculado sem os resultados dos agentes especialistas presentes.
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
│       ├── orchestrator/       (SOUL.md, IDENTITY.md, USER.md, AGENTS.md, MAPA.md, memory, skills)
│       ├── gatekeeper/         (mesma estrutura)
│       ├── metadata/           (mesma estrutura)
│       ├── content/            (mesma estrutura)
│       ├── intent/             (mesma estrutura)
│       ├── semantic_explorer/  (mesma estrutura)
│       └── offpage/            (mesma estrutura)
├── geo-diagnostic-engine.cjs   ← Motor de análise (Node.js)
└── server.cjs                  ← API Express
```
