# Introducao.md — A Metodologia b.rocket de GEO
> Documento de referência obrigatório para todos os agentes. Leia antes de qualquer análise.

---

## O Que É GEO

**Generative Engine Optimization (GEO)** é a prática de otimizar conteúdo, infraestrutura técnica, arquitetura semântica e presença externa de uma marca para que **motores de resposta generativos** — como ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google) e Perplexity — citem a empresa de forma orgânica, precisa e positiva em suas respostas.

Diferente do SEO tradicional (que foca em rankings de links azuis), o GEO foca em **ser a fonte factual** que a IA escolhe para construir sua resposta ao usuário.

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
- **Acessibilidade técnica:** O bot de IA consegue ler o conteúdo bruto (SSR e robots.txt)?
- **Qualidade do chunking & AEO:** O conteúdo está fragmentado em unidades independentes com respostas nas primeiras 60 palavras?
- **Cobertura Semântica (Content Gaps):** O site possui conteúdos específicos que respondem à intenção pesquisada?
- **Entidades reconhecidas (sameAs):** A marca está ligada a entidades conhecidas no Grafo de Conhecimento global (Wikidata, LinkedIn, Crunchbase)?

### Fase 2: Síntese (Geração)
Após recuperar os chunks relevantes, a IA os usa para construir sua resposta. O que determina se seu conteúdo será **citado explicitamente**:
- **Densidade factual:** O texto tem dados, números e referências verificáveis a cada 150 palavras?
- **Co-ocorrência em fontes externas:** O nome da marca é frequentemente citado ao lado da palavra-chave em portais de tecnologia e imprensa?
- **Autoridade do autor:** Há Schema Person e E-E-A-T validando quem escreveu?
- **Sentimento geral:** O corpus de menções à marca é positivo ou neutro?

---

## Os 7 Pilares do GEO (Framework b.rocket)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       GEO SCORE (0–100%)                                         │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬────────┤
│  PILAR 1     │  PILAR 2     │  PILAR 3     │  PILAR 4 🆕  │  PILAR 5     │  PILAR 6     │PILAR 7 │
│  GATEKEEPER  │  METADATA    │  CONTENT     │  SEO OPTIM   │  SEMANTIC    │  OFF-PAGE    │INTENT  │
│  (18 pts)    │  (15 pts)    │  (18 pts)    │  (14 pts)    │  (13 pts)    │  (10 pts)    │(12 pts)│
│              │              │              │              │              │              │        │
│ robots.txt   │ JSON-LD      │ AEO          │ Title/Meta   │ Content Gaps │ RP Digital   │Citation│
│ SSR          │ Organization │ Chunking     │ PageRank Link│ Topic Cluster│ Co-ocorrência│Share   │
│ Latência     │ Person       │ Stats (150w) │ Alt Images   │ Briefings    │ Wikidata     │Sentim. │
│ Preços HTML  │ sameAs       │ Tables HTML  │ Snippets     │ Pillar Pages │ Crunchbase   │LLMsTest│
│ HTTPS        │ /llms.txt    │ Princeton    │ Mobile View  │ PAA Intenções│ Portais Tech │OpenRtr │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴────────┘
```

---

## Fluxo de Trabalho do Ecossistema (9 Agentes)

```
LEAD CAPTURADO
      ↓
ORQUESTRADOR inicia pipeline de diagnóstico
      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ GATEKEEPER │ METADATA │ CONTENT │ SEO_OPTIMIZER │ SEMANTIC_EXPLORER │ OFF-PAGE │ ← 6 Agentes em Paralelo
└─────────────────────────────────────────────────────────────────────────────┘
      ↓
INTENT PROMPT (OpenRouter — 20 testes reais em 4 LLMs)
      ↓
CHECKLIST ARCHITECT (QA & Gerador de códigos JSON-LD/robots.txt e tutoriais CMS)
      ↓
ORQUESTRADOR consolida → GEO Score (7 pilares) → Relatórios HTML & PDF com Checklist Interativo
      ↓
GUILHERME envia diagnóstico ao lead / reunião estratégica
      ↓
LEAD converte → vira CLIENTE (Plano GEO Growth / Enterprise)
```

---

## Entregáveis por Tipo de Cliente

| Tipo | Duração | Foco Principal |
|---|---|---|
| Lead (gratuito) | Único | Diagnóstico de Raio-X e relatório de GEO Score nos 7 pilares |
| Implantação Premium R$ 497/mês | Pontual | Implantação completa inicial dos pilares de GEO |
| GEO Growth R$ 1.890/mês | Recorrente (6m) | Acompanhamento mensal, Topic Clusters, Citation Share & QA para Devs |

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
  "lastDiagnostic": { ...resultado completo dos 6 agentes... }
}
```
