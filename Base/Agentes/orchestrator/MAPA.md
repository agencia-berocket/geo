# MAPA.md — Mapa de Arquivos e Sandbox do Orquestrador

---

## Paths de Acesso

```
/app/
├── server.cjs                          ← API principal (Express)
├── geo-diagnostic-engine.cjs           ← Motor de diagnóstico (lógica dos 6 agentes)
├── Base/
│   ├── Estrutura de Agentes/
│   │   ├── Soul.md                     ← Essência unificada
│   │   ├── Introducao.md               ← Metodologia GEO (6 Pilares)
│   │   └── Estrutura.md                ← Este mapa global
│   └── Agentes/
│       ├── orchestrator/               ← VOCÊ ESTÁ AQUI
│       │   ├── SOUL.md
│       │   ├── IDENTITY.md
│       │   ├── USER.md
│       │   ├── AGENTS.md
│       │   ├── MAPA.md
│       │   ├── memory/MEMORY.md
│       │   └── skills/SKILL.md
│       ├── gatekeeper/                 ← Technical Gatekeeper Agent
│       ├── metadata/                   ← Metadata Entity Agent
│       ├── content/                    ← Content Absorption Agent
│       ├── intent/                     ← Intent Prompt Agent
│       ├── semantic_explorer/          ← Semantic Explorer Agent (Ideação & Gaps)
│       └── offpage/                    ← Off-Page Entity Monitor Agent (Autoridade & RP)
└── src/
    └── admin/
        ├── pages/
        │   ├── LeadsList.tsx           ← Lista de leads
        │   ├── ClientsList.tsx         ← Lista de clientes
        │   ├── DiagnosticView.tsx      ← Visualização de diagnósticos
        │   └── AgentConfig.tsx         ← Configuração de agentes
        └── hooks/
            └── useFirestore.ts         ← Comunicação com API
```

---

## Coleções Firestore

| Coleção | Documentos | Acesso |
|---|---|---|
| `leads` | Lead cadastrado pelo site | Leitura/Escrita |
| `diagnostics` | Resultado de diagnóstico completo | Leitura/Escrita |
| `clients` | Cliente convertido + histórico | Leitura/Escrita |
| `bookings` | Agendamentos Google Calendar | Leitura |
| `newsletter` | Inscritos na newsletter | Leitura |
| `newsletter_history` | Histórico de e-mails enviados | Leitura/Escrita |
| `agent_configs` | Configurações de UI dos agentes | Leitura/Escrita |

---

## Rotas de API Disponíveis e Testes de Validação

| Método | Rota | Função |
|---|---|---|
| `POST` | `/api/leads/capture` | Captura lead do site |
| `POST` | `/api/admin/diagnostic/run` | Executa diagnóstico completo (6 agentes) |
| `POST` | `/api/admin/agent/run` | Executa agente individual |
| `POST` | `/api/admin/chat/send` | Chat com agente via Gemini |
| `GET` | `/api/admin/leads` | Lista todos os leads |
| `GET` | `/api/admin/clients` | Lista todos os clientes |
| `GET` | `/api/admin/diagnostics` | Lista diagnósticos |
| `POST` | `/api/admin/convert-lead` | Converte lead em cliente |

---

## Payload de Retorno do Diagnóstico Completo (`POST /api/admin/diagnostic/run`)

```json
{
  "id": "diag_lead_12345_1722800000000",
  "leadId": "lead_12345",
  "clientUrl": "https://empresa.com.br",
  "overallGeoScore": 72,
  "gatekeeperStatus": {
    "robotsTxtAllowAiBots": true,
    "blockedCrawlers": [],
    "ssrActive": true,
    "hasPriceGatekeeperIssue": false,
    "serverLatencyMs": 280
  },
  "metadataAnalysis": {
    "organizationSchemaPresent": true,
    "personSchemaPresent": true,
    "llmsTxtPublished": true,
    "organizationSameAsCount": 3
  },
  "contentReview": {
    "meanChunkSizeTokens": 180,
    "factorsDetected": {
      "hasTldrAnswerFirstParagraph": true,
      "hasStatisticsPer150Words": true,
      "hasExpertQuotes": true,
      "hasHtmlComparisonTables": false
    }
  },
  "semanticAnalysis": {
    "topicCoverageScore": 75,
    "contentGapsCount": 2,
    "contentGaps": [
      {
        "topic": "Comparativo de Custos do Nicho",
        "searchIntent": "Qual o custo e ROI?",
        "urgency": "Alta",
        "recommendedFormat": "Pillar Page com Tabela HTML"
      }
    ]
  },
  "offpageAnalysis": {
    "externalEntityScore": 60,
    "externalFootprint": {
      "hasLinkedInCompanyPage": true,
      "hasCrunchbaseProfile": true,
      "hasWikipediaOrWikidataMention": false,
      "hasMajorNewsArticles": true
    }
  },
  "visibilityBenchmarking": {
    "totalPromptsTest": 20,
    "citationSharePercentage": 0.25,
    "brandSentimentScore": "Positivo"
  },
  "actionItemsPriorityList": [
    {
      "step": 1,
      "agentOwner": "SEMANTIC_EXPLORER_AGENT",
      "impact": "Alto",
      "task": "Preencher lacuna semântica de conteúdo: Criar 'Comparativo de Custos do Nicho' (Pillar Page)"
    }
  ],
  "generatedAt": "2026-08-04T17:00:00.000Z"
}
```

---

## Permissões de Sandbox

O Orquestrador não executa código diretamente. Ele coordena via API calls ao `server.cjs`. 

Em modo de chat, ele:
- ✅ Pode ler dados do contexto injetado (diagnóstico nos 6 pilares, cliente)
- ✅ Pode sugerir ações e gerar texto de implantação
- ❌ Não pode modificar o banco de dados diretamente
- ❌ Não pode executar análises técnicas (função dos agentes especializados)
