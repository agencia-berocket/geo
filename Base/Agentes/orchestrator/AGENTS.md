# AGENTS.md — Governança e Protocolo entre Agentes
> Regras de colaboração, handoff e governança do ecossistema b.rocket

---

## Hierarquia de Agentes (9 Agentes)

```
ORQUESTRADOR (Master)
├── GATEKEEPER        (Especialista em Infraestrutura & Bots)
├── METADATA          (Especialista Semântico In-Site & Schemas)
├── CONTENT           (Especialista de Copy & Fatores Princeton)
├── SEO_OPTIMIZER     (Especialista em Snippets & Tráfego de Transição) 🆕
├── SEMANTIC_EXPLORER (Especialista de Ideação & Content Gaps)
├── OFFPAGE_MONITOR   (Especialista de Autoridade Externa & RP)
├── INTENT            (Especialista de Medição Empírica de Citation Share)
└── CHECKLIST_ARCHITECT (Garantia de Qualidade QA & Tutoriais de Código) 🆕
```

O Orquestrador é o **único agente que conversa diretamente com o cliente** no dashboard. Os demais agentes são invocados pelo Orquestrador e entregam seus resultados ao pipeline.

---

## Protocolos de Boot

### Diagnóstico de Lead (primeira análise)
```
1. Orquestrador recebe { url, leadId, htmlContent }
2. Promise.all([Gatekeeper, Metadata, Content, SeoOptimizer, SemanticExplorer, OffPageMonitor])
3. Aguarda os 6 resultados paralelos
4. Executa Intent (uso sequencial do OpenRouter com dados validados)
5. Executa ChecklistArchitect (gera tutoriais de código, CMS e checklists de QA)
6. Calcula GEO Score consolidado (7 pilares)
7. Gera relatórios HTML e PDF com ações priorizadas e checklist interativo
8. Salva em Firestore: diagnostics + atualiza leads
```

### Re-análise de Cliente (mensal)
```
1. Orquestrador recebe { clientId, clientUrl }
2. Executa fetch do HTML atual do site
3. Roda pipeline completo (8 agentes especialistas)
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
| R1 — Um agente, uma responsabilidade | Cada agente entrega apenas seu escopo. Gatekeeper não comenta sobre conteúdo; Checklist Architect compila QA sem calcular score. |
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
| Otimizar Title Tags e Meta Descriptions clássicas | SEO Optimizer 🆕 |
| Eliminar textos-âncora genéricos ("clique aqui") | SEO Optimizer 🆕 |
| Garantir responsividade e tags mobile viewport | SEO Optimizer 🆕 |
| Auditar atributo Alt em imagens do site | SEO Optimizer 🆕 |
| Identificar lacunas de conteúdo (Content Gaps) | Semantic Explorer |
| Mapear clusters semânticos de tópicos | Semantic Explorer |
| Criar briefing de novos artigos e Pillar Pages | Semantic Explorer |
| Monitorar menções externas à marca | Off-Page Entity Monitor |
| Planejar pautas de RP Digital para LLMs | Off-Page Entity Monitor |
| Otimizar co-ocorrência de palavras-chave | Off-Page Entity Monitor |
| Monitorar Citation Share mensal nas LLMs | Intent |
| Identificar novos concorrentes nas IAs | Intent |
| Traduzir falhas de agentes em snippets de código validados | Checklist Architect 🆕 |
| Gerar tutoriais de instalação por CMS (WordPress/Next) | Checklist Architect 🆕 |
| Criar checklist de validação pós-implantação (QA) | Checklist Architect 🆕 |
| Calcular GEO Score consolidado e gerar relatório final | Orchestrator |
| Re-scan mensal completo | Orchestrator |
