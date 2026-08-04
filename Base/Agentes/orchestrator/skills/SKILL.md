# SKILL.md — Skills do Orquestrador b.rocket
> Capacidades operacionais e modelos de entrega do agente Orquestrador

---

## Skill 1: Análise de GEO Score e Diagnóstico

### Trigger
Quando um diagnóstico completo é fornecido no contexto.

### Processo
1. Leia o `overallGeoScore` e `actionItemsPriorityList`
2. Identifique os 3 problemas com maior `estimatedScoreGain`
3. Escreva a análise em formato executivo

### Template de Resposta
```
## 🎯 Diagnóstico GEO — {companyName}
**GEO Score atual: {score}%** ({classificação: Crítico / Em Risco / Moderado / Bom / Excelente})

### Os 3 Gargalos Principais

1. **[Problema]** — Custo: -{pts} pontos no score
   - Agente responsável: {agentOwner}
   - Solução: {ação específica}
   - Impacto esperado: +{gain}pts no GEO Score

2. **[Problema]** — ...
3. **[Problema]** — ...

### Plano de Ação — 30 dias
[Tabela com ação / responsável / prazo / impacto]

### Próximo passo recomendado
{uma única ação clara para o Guilherme tomar agora}
```

---

## Skill 2: Relatório de Evolução (Re-scan)

### Trigger
Quando há pelo menos 2 entradas em `geoScoreHistory`.

### Processo
1. Calcular delta entre o score mais recente e o anterior
2. Identificar quais ações do plano foram concluídas
3. Identificar novas oportunidades que surgiram
4. Gerar o relatório de progresso

### Template
```
## 📈 Evolução GEO — {companyName} — {mês/ano}

### Score
- Mês anterior: {score_anterior}%
- Score atual: {score_atual}%
- Variação: {delta > 0 ? '↑' : '↓'} {|delta|}%

### Ações Concluídas (✅)
{lista}

### Ações Pendentes (⏳)
{lista}

### Novas Oportunidades Identificadas
{lista baseada no diagnóstico mais recente}

### Projeção próximos 30 dias
Se {ação}, o score tende a ir de {atual}% para ~{projeção}%
```

---

## Skill 3: Plano de Implantação por Stage (6 Pilares)

### Stage 1 — Diagnóstico Técnico & Mapeamento (Semana 1)
```
Ações:
- Diagnóstico completo com os 6 agentes especialistas
- Relatório HTML e PDF enviado ao cliente
- Apresentação dos resultados e mapa de RAG em call
- Definição do roadmap de 90 dias
```

### Stage 2 — Planejamento Semântico e Intenções (Semana 2)
```
Ações (Intent Agent + Semantic Explorer):
- Mapeamento das 10 principais intenções de busca do nicho
- Identificação dos Content Gaps e arquitetura de Topic Clusters
- Benchmark de Citation Share inicial em 4 LLMs via OpenRouter
- Briefing de Pillar Pages e artigos satélites
```

### Stage 3 — Infraestrutura GEO e Metadados (Semanas 3-4)
```
Ações (Gatekeeper + Metadata):
- Correção do robots.txt para liberar crawlers de IA
- Ativação/validação de SSR
- Implementação de Schemas JSON-LD (Organization, Person, Service, FAQ)
- Criação e publicação do /llms.txt
- Adição de sameAs links (LinkedIn, Wikidata, Crunchbase)
```

### Stage 4 — Otimização de Conteúdo On-Page (Semanas 5-6)
```
Ações (Content Agent):
- Reescrita das páginas principais com Answer-First AEO (primeiras 60 palavras)
- Inserção de estatísticas e dados a cada 150 palavras (Princeton)
- Adição de citações de especialistas
- Criação de tabelas comparativas HTML
- Eliminação total de linguagem hedged
```

### Stage 5 — Autoridade Externa & RP Digital (Semanas 7-8)
```
Ações (Off-Page Entity Monitor):
- Execução de pauta de RP Digital em portais de tecnologia e negócios
- Otimização de co-ocorrência da marca com palavras-chave do nicho
- Auditoria de unlinked brand mentions
```

### Stage 6 — Monitoramento Contínuo e Re-scan (Mensal)
```
Ações (Orchestrator):
- Re-scan completo do site nos 6 pilares
- Relatório de evolução de GEO Score e Citation Share
- Ajustes contínuos no mapa de RAG
```

---

## Skill 4: Geração de Briefing para o Guilherme

Quando pedido, o Orquestrador gera um briefing completo de cliente para uso em reunião:

```markdown
## Briefing Executivo — {companyName}

### Situação Atual
- GEO Score: {score}% ({classificação})
- Principal problema: {problema #1}
- Concorrentes citados pelas IAs: {lista}

### O que já foi feito
{lista de ações concluídas}

### Próximas 3 ações prioritárias
1. {ação} — Impacto: +{pts}pts — Responsável: {agente}
2. ...
3. ...

### Pontos de atenção para a reunião
- {observações do cliente}
- {histórico de objeções}
- {próximo milestone de score}
```

---

## Skill 5: Dupla Lógica de Classificação do GEO Score

O ecossistema b.rocket utiliza **duas réguas complementares** de classificação de score, cada uma aplicada ao seu canal correspondente:

### 1. Régua Técnica de Maturidade (5 Faixas — Painel Técnico & Diagnósticos)
*Usada no dashboard admin, relatórios técnicos e análises internas do sistema:*

| Score | Classificação | Cor | Mensagem para o Cliente |
|---|---|---|---|
| 0–25% | Crítico | 🔴 | "Sua marca é invisível para as IAs. É urgente agir." |
| 26–45% | Em Risco | 🟠 | "Você está perdendo clientes para concorrentes citados pelas IAs." |
| 46–65% | Moderado | 🟡 | "Base construída, mas ainda abaixo da visibilidade ideal." |
| 66–80% | Bom | 🟢 | "Você está aparecendo. Hora de ampliar o share." |
| 81–100% | Excelente | 🚀 | "Posição de liderança. Foco em manutenção e expansão." |

### 2. Classificação Persuasiva de Vendas (3 Faixas — E-mail & Copys do Relatório)
*Usada exclusivamente pelo Orquestrador no texto persuasivo do e-mail e cabeçalho comercial:*

| Faixa | Classificação | Tom da Comunicação Comercial |
|---|---|---|
| `< 40%` | 🚨 Alerta Crítico | Foco em Urgência e Risco Comercial de ser invisível |
| `40–69%` | ⚠️ Risco de Perda | Foco em Oportunidade e Gargalos de Citabilidade |
| `≥ 70%` | ✨ Potencial de Escala | Foco em Parceria e Monopólio das Recomendações |
