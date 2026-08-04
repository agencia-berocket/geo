# AGENTS.md — Governança e Protocolo entre Agentes
> Regras de colaboração, handoff e governança do ecossistema b.rocket

---

## Hierarquia de Agentes

```
ORQUESTRADOR (Master)
├── GATEKEEPER        (Especialista Técnico)
├── METADATA          (Especialista Semântico In-Site)
├── CONTENT           (Especialista de Conteúdo On-Page)
├── INTENT            (Especialista de Medição Empírica)
├── SEMANTIC_EXPLORER (Especialista de Ideação & Clustering)
└── OFFPAGE_MONITOR   (Especialista de Autoridade Externa & RP)
```

O Orquestrador é o **único agente que conversa diretamente com o cliente** no dashboard. Os demais agentes são invocados pelo Orquestrador e entregam seus resultados ao pipeline.

---

## Protocolos de Boot

### Diagnóstico de Lead (primeira análise)
```
1. Orquestrador recebe { url, leadId, htmlContent }
2. Promise.all([Gatekeeper, Metadata, Content, SemanticExplorer, OffPageMonitor])
3. Aguarda os 5 resultados paralelos
4. Executa Intent (uso sequencial do OpenRouter com dados validados)
5. Calcula GEO Score consolidado
6. Gera relatórios HTML e PDF com ações priorizadas
7. Salva em Firestore: diagnostics + atualiza leads
```

### Re-análise de Cliente (mensal)
```
1. Orquestrador recebe { clientId, clientUrl }
2. Executa fetch do HTML atual do site
3. Roda pipeline completo (6 agentes)
4. Compara score novo com histórico
5. Gera relatório de evolução (delta)
6. Atualiza Firestore: geoScoreHistory do cliente
```

### Chat no Workspace (modo consulta)
```
1. Sistema carrega SOUL.md + IDENTITY.md do agente selecionado
2. Injeta diagnóstico mais recente como contexto
3. Agente responde em modo consultor (não executa código)
4. Histórico é mantido na sessão
```

---

## Regras de Handoff

| Regra | Descrição |
|---|---|
| R1 — Um agente, uma responsabilidade | Cada agente entrega apenas seu escopo. Gatekeeper não comenta sobre conteúdo; Semantic Explorer foca em lacunas. |
| R2 — Nunca bloqueie o pipeline | Em caso de erro, retorne o objeto padrão com `error: true` e prossiga |
| R3 — Resultado sempre JSON | Toda entrega de agente especialista é um objeto JSON estruturado |
| R4 — Orquestrador é o único interlocutor | Agentes especialistas não respondem diretamente ao usuário final |
| R5 — Context-aware | Todo agente tem acesso ao diagnóstico anterior do cliente se disponível |
| R6 — Score nunca fabricado | Se o Intent Agent falhar, o score de visibilidade é 0, não estimado |

---

## Tabela de Responsabilidades por Ação de Implantação

| Ação | Agente Responsável |
|---|---|
| Corrigir robots.txt | Gatekeeper |
| Adicionar SSR / pre-rendering | Gatekeeper |
| Criar Schema Organization JSON-LD | Metadata |
| Criar Schema Person JSON-LD | Metadata |
| Criar e publicar /llms.txt | Metadata |
| Adicionar sameAs (LinkedIn, Wikidata) | Metadata |
| Reescrever parágrafos com AEO | Content |
| Inserir estatísticas a cada 150 palavras | Content |
| Adicionar citações de especialistas | Content |
| Criar tabela comparativa HTML | Content |
| Identificar lacunas de conteúdo (Content Gaps) | Semantic Explorer |
| Mapear clusters semânticos de tópicos | Semantic Explorer |
| Criar briefing de novos artigos e Pillar Pages | Semantic Explorer |
| Monitorar menções externas à marca | Off-Page Entity Monitor |
| Planejar pautas de PR Digital para LLMs | Off-Page Entity Monitor |
| Otimizar co-ocorrência de palavras-chave | Off-Page Entity Monitor |
| Monitorar Citation Share mensal nas LLMs | Intent |
| Identificar novos concorrentes nas IAs | Intent |
| Calcular GEO Score e gerar relatório | Orchestrator |
| Re-scan mensal completo | Orchestrator |
