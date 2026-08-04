# Introducao.md — A Metodologia b.rocket de GEO
> Documento de referência obrigatório para todos os agentes. Leia antes de qualquer análise.

---

## O Que É GEO

**Generative Engine Optimization (GEO)** é a prática de otimizar conteúdo, infraestrutura técnica e dados estruturados de um site para que **motores de resposta generativos** — como ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google) e Perplexity — citem a marca de forma orgânica, precisa e positiva em suas respostas.

Diferente do SEO tradicional (que foca em rankings de links), o GEO foca em **ser a fonte** que a IA escolhe para construir sua resposta ao usuário.

---

## A Pesquisa de Princeton (2023)

A metodologia da b.rocket é fundamentada no estudo:

> **"GEO: Generative Engine Optimization"**
> *Aggarwal, S., Mündler, N., Singh, A., et al.*
> *Princeton University / Cornell University / Georgia Tech, 2023*

Os pesquisadores identificaram empiricamente que 9 estratégias de otimização de conteúdo aumentam a probabilidade de citação em motores generativos:

| Estratégia | Aumento Médio de Citabilidade |
|---|---|
| Adicionar estatísticas e dados numéricos | +40,0% |
| Incluir citações de fontes externas | +37,2% |
| Adicionar citações de especialistas (aspas diretas) | +32,1% |
| Otimizar fluência linguística | +23,5% |
| Usar linguagem mais persuasiva | +21,0% |
| Adicionar informação técnica especializada | +19,8% |
| Simplificar a leitura (AEO) | +18,3% |
| Eliminar linguagem imprecisa/hedged | +15,2% |
| Criar tabelas comparativas HTML | +10,7% |

---

## Como as IAs Escolhem o que Citar

As LLMs modernas operam em duas fases quando respondem ao usuário:

### Fase 1: Recuperação (RAG)
A IA realiza uma busca semântica em sua memória de treinamento e/ou em índices de conteúdo em tempo real. Ela busca **fragmentos de texto** (chunks) que sejam semanticamente próximos à intenção do usuário, medida por **similaridade cosseno de embeddings**.

O que determina se seu conteúdo será recuperado:
- **Acessibilidade técnica:** O bot de IA consegue ler o conteúdo?
- **Qualidade do chunking:** O conteúdo está fragmentado em unidades independentes de significado?
- **Entidades reconhecidas:** A marca está ligada a entidades conhecidas (sameAs)?
- **Autoridade da fonte:** JSON-LD valida a marca como entidade confiável?

### Fase 2: Síntese (Geração)
Após recuperar os chunks relevantes, a IA os usa para construir sua resposta. O que determina se seu conteúdo será **citado explicitamente**:
- **Densidade factual:** O texto tem dados, números e referências verificáveis?
- **Clareza da resposta AEO:** A informação central está nas primeiras 60 palavras?
- **Autoridade do autor:** Há Schema Person e E-E-A-T validando quem escreveu?
- **Sentimento geral:** O corpus de menções à marca é positivo ou neutro?

---

## Os 4 Pilares do GEO (Framework b.rocket)

```
┌─────────────────────────────────────────────────────┐
│                   GEO SCORE (0–100%)                 │
├──────────────┬──────────────┬──────────┬────────────┤
│  PILAR 1     │  PILAR 2     │ PILAR 3  │  PILAR 4   │
│  GATEKEEPER  │  METADATA    │ CONTENT  │  INTENT    │
│  (25 pts)    │  (20 pts)    │ (30 pts) │  (25 pts)  │
│              │              │          │            │
│ robots.txt   │ JSON-LD      │ AEO      │ Citation   │
│ SSR          │ Organization │ Chunking │ Share      │
│ Latência     │ Person       │ Stats    │ Sentiment  │
│ HTTPS        │ FAQ/Service  │ Tables   │ Competitors│
│ Sitemap      │ sameAs       │ E-E-A-T  │ Hallucin.  │
│ Preços HTML  │ /llms.txt    │ Princeton│ OpenRouter │
└──────────────┴──────────────┴──────────┴────────────┘
```

---

## Fluxo de Trabalho dos Agentes

```
LEAD CAPTURADO
      ↓
ORQUESTRADOR inicia pipeline
      ↓
┌─────────────────────────────────────────┐
│  GATEKEEPER  │  METADATA  │  CONTENT   │  ← Paralelo
└─────────────────────────────────────────┘
      ↓
INTENT (OpenRouter — 20 testes reais)
      ↓
ORQUESTRADOR consolida → GEO Score → Relatório HTML
      ↓
GUILHERME envia relatório ao lead
      ↓
LEAD converte → vira CLIENTE
      ↓
WORKSPACE DE AGENTES (por cliente)
  Cada agente executa sua missão de implantação
  GEO Score é re-medido mensalmente
```

---

## Entregáveis por Tipo de Cliente

| Tipo | Duração | Foco Principal |
|---|---|---|
| Lead (gratuito) | Único | Diagnóstico e relatório de GEO Score |
| Premium R$ 497/mês | 3+ meses | Implantação completa dos 4 pilares |
| Enterprise (consulta) | Anual | Multi-idioma, API, SLA, squad dedicado |

---

## Variáveis de Contexto Disponíveis para os Agentes

Quando um agente é acionado para um cliente, ele recebe:

```json
{
  "clientUrl": "https://empresa.com.br",
  "clientName": "Nome do Contato",
  "companyName": "Nome da Empresa",
  "email": "contato@empresa.com.br",
  "plan": "premium | enterprise",
  "currentStage": 1,
  "geoScoreHistory": [{ "date": "...", "score": 34 }],
  "lastDiagnostic": { ...resultado completo dos 4 agentes... }
}
```
