---
name: geo-audit
description: Roda o motor de diagnóstico GEO localmente e verifica programaticamente que nenhum dado simulado ou fabricado escapa para o relatório antes de ser enviado a um cliente ou lead real. Use antes de qualquer envio de relatório/PDF de GEO, ou depois de qualquer alteração em geo-diagnostic-engine.cjs ou nas rotas de diagnóstico do server.cjs.
---

# GEO Audit — Guard-rail contra alucinação nos relatórios GEO

## Quando usar

- Antes de enviar um relatório ou e-mail com anexo de GEO a um lead ou cliente pagante, especialmente após qualquer mudança no motor de diagnóstico.
- Depois de editar `geo-diagnostic-engine.cjs` ou qualquer rota `/api/admin/diagnostic/*` ou `/api/admin/lead-hunter/*` em `server.cjs`.
- Quando o usuário pedir "audita o GEO", "confere se esse relatório é real" ou "roda os testes de alucinação".

## Contexto

Este motor teve um histórico de alucinação: agentes que apresentavam heurísticas fixas como "análise de IA" (ex: score base sempre 35, lista de concorrentes hardcoded), fallbacks que retornavam números fabricados (`citationSharePercentage: 0.05`) sem aviso de simulação no relatório real, e templates de conteúdo que inventavam fatos e citações fictícias sobre a empresa do cliente. Todos os agentes agora retornam um campo `dataSource` (`deterministic | heuristic | external_verified | llm_real | unavailable`) que o relatório usa para nunca apresentar um dado como real quando não é.

## Passos

1. Rodar `npm run test:geo` (executa `test-geo-engine.cjs`). Se qualquer teste falhar, PARE e corrija antes de continuar — não envie relatórios com o guard-rail vermelho.
2. Se for validar um caso específico: rodar `POST /api/admin/agent/run` com `agentName: 'orchestrator'` contra uma URL de teste, **sem** `OPENROUTER_API_KEY`/`GOOGLE_API_KEY` configuradas, e confirmar no HTML gerado (`GET /api/admin/diagnostic/html/:leadId`) que os cards de Intent Prompt e Semantic Explorer mostram o badge "INDISPONÍVEL · SEM CHAVE" e "N/D" em vez de qualquer percentual.
3. Repetir com as chaves configuradas e confirmar que os badges mudam para "RESPOSTA REAL DE LLM" / "VERIFICADO EXTERNAMENTE".
4. Antes de um envio de alto risco (cliente enterprise, primeira mensagem a um prospect), fazer uma segunda verificação manual: `grep` no HTML final por qualquer string da lista `KNOWN_FABRICATION_STRING_SMELLS` em `test-geo-engine.cjs`.
5. Reportar ao usuário: quais agentes rodaram com dado real (`llm_real`/`external_verified`/`deterministic`), quais ficaram `unavailable` e por quê (variável de ambiente faltante), e se algum smell de fabricação foi encontrado.

## Referências

- `test-geo-engine.cjs` — guard-rail automatizado com a lista de smells conhecidos e os testes de regressão.
- `geo-diagnostic-engine.cjs` — função `generateHtmlReport` (badges de `dataSource`) e `calculateGeoScore` (normalização de score por cobertura real).
- `server.cjs` — bloco de regras de honestidade técnica injetado no prompt do chat administrativo (`/api/admin/chat/send`), referência de tom para qualquer texto novo gerado por este sistema.
- `.env.example` — lista completa das variáveis de ambiente que habilitam cada agente com dado real.
