# SKILL.md — Skills do Semantic Explorer b.rocket
> Metodologia de Ideação GEO-First, Mapeamento de Content Gaps e Arquitetura de Clusters Semânticos

---

## Skill 1: Identificação de Content Gaps GEO-First

### Processo de Análise

1. **Extração de Tópicos Atuais:** Analisar títulos, H1, H2 e meta description da página/site do cliente.
2. **Mapeamento do Ecossistema do Nicho:** Mapear os 5 vetores essenciais de intenção comercial do nicho:
   - Definição & O que é
   - Custos, Preços e ROI
   - Comparativos (Marca A vs Marca B)
   - Resolução de Problemas Técnicos / Manuais de Uso
   - Métricas, Estatísticas e Casos de Uso
3. **Cruzamento de Lacunas:** Identificar quais dos 5 vetores não possuem páginas dedadas ou parágrafos AEO estruturados.

---

## Skill 2: Arquitetura de Clusters Semânticos (Topic Cluster Blueprint)

### Estrutura de Cluster Recomendada

```markdown
# Pillar Page (Página Pilar - Nível 1)
URL: /guia-definitivo-[topico-principal]
Foco: Abranger o tema de forma holística com seções H2 para cada sub-tema.

## Artigos Satélites (Nível 2)
1. URL: /artigos/[sub-topico-1-especifico]
   Link interno apontando para a Pillar Page com âncora exata.
2. URL: /artigos/[sub-topico-2-comparativo]
   Tabela HTML comparativa + link para Pillar Page.
3. URL: /artigos/[sub-topico-3-calculo-roi]
   Ferramenta / Guia numérico com dados Princeton.
```

---

## Skill 3: Gerador de Briefing de Conteúdo para IA (Content Brief GEO)

### Template de Briefing

```markdown
### Briefing de Conteúdo GEO
- **Título da Página:** [Título H1 contendo Keyword + Métrica]
- **URL Alvo:** /[slug-seo-clean]
- **Intenção de Busca RAG:** [Pergunta exata que o usuário faz no ChatGPT/Perplexity]
- **Parágrafo AEO Inicial (60 palavras):** [Texto de abertura pronto com resposta factual]
- **Estatística Recomendada:** [Inserir dado numérico de fonte confiável]
- **Tabela HTML Requerida:** [Descrição do comparativo]
- **Perguntas FAQ Schema:**
  1. [Pergunta 1]? -> [Resposta direta]
  2. [Pergunta 2]? -> [Resposta direta]
```
