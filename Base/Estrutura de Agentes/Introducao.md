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

## Os 6 Pilares do GEO (Framework b.rocket)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   GEO SCORE (0–100%)                                    │
├──────────────┬──────────────┬──────────────┬──────────────────┬──────────────┬──────────┤
│  PILAR 1     │  PILAR 2     │  PILAR 3     │  PILAR 4         │  PILAR 5     │ PILAR 6  │
│  GATEKEEPER  │  METADATA    │  CONTENT     │  SEMANTIC        │  OFF-PAGE    │ INTENT   │
│  (20 pts)    │  (15 pts)    │  (20 pts)    │  EXPLORER(15pts) │  (10 pts)    │ (20 pts) │
│              │              │              │                  │              │          │
│ robots.txt   │ JSON-LD      │ AEO          │ Content Gaps     │ RP Digital   │ Citation │
│ SSR          │ Organization │ Chunking     │ Topic Clusters   │ Co-ocorrência│ Share    │
│ Latência     │ Person       │ Stats (150w) │ Briefings        │ Wikidata     │ Sentiment│
│ Preços HTML  │ sameAs       │ Tables HTML  │ Pillar Pages     │ Crunchbase   │ LLMs Test│
│ HTTPS        │ /llms.txt    │ Princeton    │ PAA Intenções    │ Portais Tech │ OpenRouter
└──────────────┴──────────────┴──────────────┴──────────────────┴──────────────┴──────────┘
```

---

## Fluxo de Trabalho dos Agentes

```
LEAD CAPTURADO
      ↓
ORQUESTRADOR inicia pipeline de diagnóstico
      ↓
┌─────────────────────────────────────────────────────────────────┐
│ GATEKEEPER │ METADATA │ CONTENT │ SEMANTIC_EXPLORER │ OFF-PAGE  │ ← 5 Agentes em Paralelo
└─────────────────────────────────────────────────────────────────┘
      ↓
INTENT PROMPT (OpenRouter — 20 testes reais em 4 LLMs)
      ↓
ORQUESTRADOR consolida → GEO Score (6 pilares) → Relatórios HTML & PDF
      ↓
GUILHERME envia diagnóstico ao lead / reunião estratégica
      ↓
LEAD converte → vira CLIENTE
      ↓
WORKSPACE DE AGENTES (por cliente)
  Cada agente executa sua missão de implantação técnica e semântica
  GEO Score é re-medido mensalmente com histórico de evolução
```

---

## Entregáveis por Tipo de Cliente

| Tipo | Duração | Foco Principal |
|---|---|---|
| Lead (gratuito) | Único | Diagnóstico de Raio-X e relatório de GEO Score nos 6 pilares |
| Premium R$ 497/mês | 3+ meses | Implantação completa dos 6 pilares de GEO |
| Enterprise (consulta) | Anual | Multi-idioma, API, SLA, squad dedicado e PR Digital continuada |

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
