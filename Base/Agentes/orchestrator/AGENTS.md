# AGENTS.md — Governança e Protocolo entre Agentes
> Regras de colaboração, handoff e governança do ecossistema b.rocket

---

## Hierarquia de Agentes

```
ORQUESTRADOR (Master)
├── GATEKEEPER    (Especialista Técnico)
├── METADATA      (Especialista Semântico)
├── CONTENT       (Especialista de Conteúdo)
└── INTENT        (Especialista de Visibilidade)
```

O Orquestrador é o **único agente que conversa diretamente com o cliente** no dashboard. Os demais agentes são invocados pelo Orquestrador e entregam seus resultados ao pipeline.

---

## Protocolos de Boot

### Diagnóstico de Lead (primeira análise)
```
1. Orquestrador recebe { url, leadId, htmlContent }
2. Promise.all([Gatekeeper, Metadata, Content])
3. Aguarda os 3 resultados
4. Executa Intent (sequencial — usa htmlContent validado)
5. Calcula GEO Score
6. Gera relatório HTML
7. Salva em Firestore: diagnostics + atualiza leads
```

### Re-análise de Cliente (mensal)
```
1. Orquestrador recebe { clientId, clientUrl }
2. Executa fetch do HTML atual do site
3. Roda pipeline completo (igual ao diagnóstico)
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
| R1 — Um agente, uma responsabilidade | Cada agente entrega apenas seu escopo. Gatekeeper não comenta sobre conteúdo. |
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
| Monitorar Citation Share mensal | Intent |
| Identificar novos concorrentes nas IAs | Intent |
| Calcular GEO Score e gerar relatório | Orchestrator |
| Re-scan mensal completo | Orchestrator |
