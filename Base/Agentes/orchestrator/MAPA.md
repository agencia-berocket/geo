# MAPA.md — Mapa de Arquivos e Sandbox do Orquestrador

---

## Paths de Acesso

```
/app/
├── server.cjs                          ← API principal (Express)
├── geo-diagnostic-engine.cjs           ← Motor de diagnóstico (lógica dos agentes)
├── Base/
│   ├── Estrutura de Agentes/
│   │   ├── Soul.md                     ← Essência unificada
│   │   ├── Introducao.md               ← Metodologia GEO
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
│       ├── gatekeeper/
│       ├── metadata/
│       ├── content/
│       └── intent/
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
| `newsletter_history` | Histórico de e-mails enviados | Leitura |
| `agent_configs` | Configurações de UI dos agentes | Leitura/Escrita |

---

## Rotas de API Disponíveis

| Método | Rota | Função |
|---|---|---|
| `POST` | `/api/leads/capture` | Captura lead do site |
| `POST` | `/api/admin/diagnostic/run` | Executa diagnóstico completo |
| `POST` | `/api/admin/agent/run` | Executa agente individual |
| `POST` | `/api/admin/chat/send` | Chat com agente via Gemini |
| `GET` | `/api/admin/leads` | Lista todos os leads |
| `GET` | `/api/admin/clients` | Lista todos os clientes |
| `GET` | `/api/admin/diagnostics` | Lista diagnósticos |
| `POST` | `/api/admin/convert-lead` | Converte lead em cliente |

---

## Permissões de Sandbox

O Orquestrador não executa código diretamente. Ele coordena via API calls ao `server.cjs`. 

Em modo de chat, ele:
- ✅ Pode ler dados do contexto injetado (diagnóstico, cliente)
- ✅ Pode sugerir ações e gerar texto de implantação
- ❌ Não pode modificar o banco de dados diretamente
- ❌ Não pode executar análises técnicas (função dos agentes especializados)
