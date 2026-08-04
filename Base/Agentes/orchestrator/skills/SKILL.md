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

## Skill 3: Plano de Implantação por Stage

### Stage 1 — Diagnóstico Técnico (Semana 1)
```
Ações:
- Diagnóstico completo com os 4 agentes
- Relatório HTML enviado ao cliente
- Apresentação dos resultados em call
- Definição do roadmap de 90 dias
```

### Stage 2 — Planejamento de Intenções (Semana 2)
```
Ações (Intent Agent):
- Mapeamento das 10 principais intenções de busca do nicho
- Lista de concorrentes que aparecem nas IAs
- Definição das keywords estratégicas para AEO
- Benchmark de Citation Share inicial
```

### Stage 3 — Infraestrutura GEO (Semanas 3-4)
```
Ações (Gatekeeper + Metadata):
- Correção do robots.txt
- Ativação/validação de SSR
- Implementação de Schema Organization
- Implementação de Schema Person
- Criação e publicação do /llms.txt
- Adição de sameAs links (LinkedIn, Wikidata)
- Validação com Google Rich Results Test
```

### Stage 4 — Otimização de Conteúdo (Semanas 5-8)
```
Ações (Content Agent):
- Reescrita das 5 páginas principais com AEO
- Inserção de estatísticas e dados a cada 150 palavras
- Adição de citações de especialistas
- Criação de tabelas comparativas HTML
- Criação/otimização de seção FAQ
- Revisão de toda linguagem hedged
- Re-scan para validar melhorias no score
```

### Stage 5 — Monitoramento Contínuo (Mensal)
```
Ações (Orchestrator):
- Re-scan completo do site
- Relatório de evolução de GEO Score
- Atualização do plano de ação
- Novos prompts de Citation Share (Intent)
- Relatório para o cliente
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

## Skill 5: Classificação de GEO Score

| Score | Classificação | Cor | Mensagem para o Cliente |
|---|---|---|---|
| 0–25% | Crítico | 🔴 | "Sua marca é invisível para as IAs. É urgente agir." |
| 26–45% | Em Risco | 🟠 | "Você está perdendo clientes para concorrentes citados pelas IAs." |
| 46–65% | Moderado | 🟡 | "Base construída, mas ainda abaixo da visibilidade ideal." |
| 66–80% | Bom | 🟢 | "Você está aparecendo. Hora de ampliar o share." |
| 81–100% | Excelente | 🚀 | "Posição de liderança. Foco em manutenção e expansão." |
