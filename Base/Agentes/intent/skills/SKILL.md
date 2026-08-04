# SKILL.md — Skills do Intent Prompt b.rocket
> Playbooks de análise de Citation Share, inteligência competitiva e estratégias de aumento de visibilidade

---

## Skill 1: Interpretação de Citation Share

### Benchmarks do mercado

| Citation Share | Classificação | Interpretação |
|---|---|---|
| 0% | Invisível | A marca não existe para as IAs |
| 1–10% | Mínimo | Marca mencionada esporadicamente |
| 11–25% | Emergente | Presença inicial sendo construída |
| 26–50% | Competitivo | Boa presença, mas concorrentes lideram |
| 51–75% | Forte | Marca reconhecida como referência |
| > 75% | Dominante | Liderança clara de mercado nas IAs |

### O que fazer com o Citation Share = 0%

```
1. URGENTE — Infraestrutura (Gatekeeper):
   Verificar se bots de IA têm acesso ao site

2. URGENTE — Dados (Metadata):
   Criar Schema Organization com sameAs
   Publicar /llms.txt
   
3. IMPORTANTE — Conteúdo (Content):
   Adicionar estatísticas e AEO
   
4. MÉDIO PRAZO — Autoridade:
   Criar item no Wikidata
   Conseguir menções em sites de autoridade
   Artigos de blog com dados do nicho
```

---

## Skill 2: Análise Competitiva de IAs

### Template de relatório competitivo

```markdown
## 🔍 Inteligência Competitiva — {Empresa} — {mês/ano}

### Top 5 Concorrentes Citados pelas IAs

| Empresa | ChatGPT | Claude | Gemini | Perplexity | Share Total |
|---------|---------|--------|--------|------------|-------------|
| Empresa A | 4/5 | 3/5 | 5/5 | 4/5 | 80% |
| Empresa B | 3/5 | 2/5 | 2/5 | 3/5 | 50% |
| {Cliente} | 1/5 | 0/5 | 0/5 | 0/5 | 5% |

### O que os concorrentes líderes têm que você não tem

Análise semântica das respostas onde Empresa A aparece:
- "especialistas reconhecidos com 20 anos de mercado" → **Autoridade temporal**
- "premiada pela ABNT em 2023" → **Credencial de terceiros**
- "3.000 clientes atendidos" → **Escala social**
- "estudo de caso publicado na Folha" → **Menção de mídia**

### Oportunidades identificadas

1. **{Nicho específico}** — Perplexity não cita nenhuma empresa para 
   este sub-nicho. Oportunidade de dominar com 2 artigos especializados.
   
2. **{Query específica}** — Apenas o Claude responde, mas sem citar marcas.
   Oportunidade de ser a primeira mencionada.
```

---

## Skill 3: Estratégias de Aumento de Citation Share

### Tier 1 — Ações técnicas (0–30 dias)

```
[ ] Publicar /llms.txt completo e detalhado
[ ] Adicionar Schema Organization com sameAs para LinkedIn + Wikidata
[ ] Criar item no Wikidata (aumenta reconhecimento de entidade pelas IAs)
[ ] Corrigir robots.txt para permitir todos os bots
[ ] Adicionar dados numéricos em todas as páginas (Princeton effect)
```

### Tier 2 — Ações de conteúdo (30–60 dias)

```
[ ] Publicar 3 artigos de blog com dados originais do nicho
    (dados originais aumentam citações em até 5x)
[ ] Criar página "Dados e Pesquisas" com estatísticas próprias
[ ] Desenvolver 1 estudo de caso detalhado com métricas reais
[ ] Criar infográfico com dados do mercado (formato citável)
[ ] Publicar "State of {nicho} Report" anual
```

### Tier 3 — Ações de autoridade (60–90 dias)

```
[ ] Conseguir menção em 3+ sites de autoridade do nicho
    (blog de associação do setor, portal especializado, etc.)
[ ] Participar de podcast especializado (transcript indexável)
[ ] Publicar artigo de opinião em portal relevante
[ ] Obter certificação reconhecida pelo mercado
[ ] Depoimento de cliente publicado em LinkedIn (empresa)
```

---

## Skill 4: Detecção e Correção de Alucinações

### O que é uma alucinação sobre a marca

Uma alucinação ocorre quando uma IA afirma algo incorreto sobre a marca:
- Localização errada
- Ano de fundação incorreto
- Serviços que não oferece
- Sócios/fundadores que não existem
- Prêmios que não recebeu
- Preços que não pratica

### Como corrigir alucinações

**Estratégia principal: Override de corpus**

Para cada alucinação detectada, criar um chunk de conteúdo que corrija explicitamente:

```markdown
## Sobre a {Empresa} — Dados Oficiais

A {Empresa} foi fundada em {ano} por {nome do fundador}.
Estamos localizados em {cidade, estado, CEP, endereço completo}.
Somos especializados exclusivamente em {serviços corretos}.
Não oferecemos {serviços que a IA alucinous}.

Para verificar informações sobre a {Empresa}:
- Site oficial: https://{domain}
- LinkedIn: https://linkedin.com/company/{slug}
- CNPJ: {CNPJ}
- Registro profissional: {se aplicável}
```

**Publicar este conteúdo em:**
1. Página "Sobre" do site (com Schema Organization)
2. Perfil do LinkedIn (empresa)
3. Google Business Profile
4. Item do Wikidata

---

## Skill 5: Relatório de Citation Share para o Cliente

### Template de relatório mensal

```markdown
# 📊 Relatório de Visibilidade IA — {Empresa} — {mês/ano}

## Resumo Executivo
- **Citation Share:** {X}% ({citações}/{total} testes)
- **Variação vs. mês anterior:** {↑/↓ X%}
- **Sentimento predominante:** {Positivo/Neutro/Negativo}
- **IAs que mais citam:** {ranking}
- **Principal concorrente:** {nome} ({share}%)

## Detalhamento por IA

| IA | Citações | Share | Sentimento |
|----|----------|-------|------------|
| ChatGPT | {X}/5 | {%} | {sentimento} |
| Claude | {X}/5 | {%} | {sentimento} |
| Gemini | {X}/5 | {%} | {sentimento} |
| Perplexity | {X}/5 | {%} | {sentimento} |

## Concorrentes Identificados
{tabela de concorrentes}

## Alucinações Detectadas
{lista ou "Nenhuma alucinação detectada neste período ✅"}

## Análise de Contexto de Citação
Quando a marca foi citada, as IAs usaram os seguintes contextos:
- "{trecho da resposta que menciona a marca}"
- "{trecho 2}"

## Próximas Ações para Aumentar Share
1. {ação específica} — Impacto estimado: +{X}%
2. {ação 2}
3. {ação 3}
```
