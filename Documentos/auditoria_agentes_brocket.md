# 🔬 Auditoria Técnica dos Agentes — Plataforma b.rocket GEO
> Análise profunda do código-fonte em `geo-diagnostic-engine.cjs` e `server.cjs`  
> Data: 07/08/2026 | Versão engine: GEO_CORE_V10  
> Baseada em leitura direta do código — sem suposições externas.

---

## 🏗️ Arquitetura Geral

A plataforma roda sobre **Node.js + Express** (`server.cjs`) com um motor de diagnóstico separado (`geo-diagnostic-engine.cjs`). Os dados são persistidos no **Firestore via REST API** (não via SDK — autenticação por JWT/Service Account próprio).

O pipeline central executa **8 agentes especializados** para cada diagnóstico:

```
fetchUrl (HTML real do site)
    │
    ├─► [1] GatekeeperAgent       (determinístico)
    ├─► [2] MetadataAgent         (determinístico)
    ├─► [3] ContentAgent          (determinístico)
    ├─► [4] SeoOptimizerAgent     (determinístico)
    ├─► [5] SemanticExplorerAgent (LLM real — requer OPENROUTER_API_KEY)
    ├─► [6] OffPageEntityAgent    (HTTP externo — heurístico)
    ├─► [7] IntentPromptAgent     (LLM real — requer OPENROUTER_API_KEY)
    └─► [8] ChecklistArchitect    (derivado dos 7 anteriores)

calculateGeoScore() ──► Score final (0–100%)
buildActionList()   ──► Plano de ação priorizado
generateHtmlReport()──► Relatório HTML entregável
```

---

## Legenda de Status

| Badge | Significado |
|-------|-------------|
| ✅ **VERIFICADO · REAL** | Dado extraído diretamente do site ou de API externa confiável |
| 🟡 **HEURÍSTICO** | Estimativa baseada em regras, pode variar |
| 🔵 **LLM REAL** | Resposta real de modelo de linguagem via OpenRouter |
| 🔴 **INDISPONÍVEL** | Agente desativado por falta de chave de API |
| ⚠️ **RISCO** | Ponto que exige atenção antes de entregar ao cliente |

---

## Agente 1 — Technical Gatekeeper
**Arquivo:** `geo-diagnostic-engine.cjs` L.113–186  
**Status: ✅ VERIFICADO · DETERMINÍSTICO**

### O que faz
Verifica se o site está acessível e "legível" para robôs de IA generativas.

### Como funciona
1. **Faz requisição HTTP real** ao `robots.txt` do site e verifica se bots críticos (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Googlebot`, `GPTBot`) estão bloqueados — via parsing linha a linha.
2. **Detecta SSR** (Server-Side Rendering): verifica se o HTML bruto contém `<p`, `<h1`, `<article>` + comprimento mínimo de 5000 chars.
3. **Detecta preços visíveis**: regex em HTML limpo (sem scripts/style) buscando padrões `R$ 999`, `12x de`, `199/mês`.
4. **Detecta timestamps antigos**: busca anos entre 2010–2022 no HTML.
5. **Latência real do servidor**: mede em ms a resposta do `robots.txt`.
6. **Core Web Vitals**: chama a **Google PageSpeed Insights API** se `GOOGLE_API_KEY` estiver configurada.

### Dado é real?
- **robots.txt** → ✅ 100% real (requisição HTTP real)
- **SSR detection** → ✅ real, mas imperfeito (não detecta SPAs que injetam conteúdo antes do carregamento)
- **Preços** → ✅ determinístico (regex no HTML real)
- **PageSpeed** → ✅ real se chave configurada; 🔴 indisponível sem chave
- **Timestamps** → 🟡 heurístico (busca strings de ano, pode haver falso positivo com números de telefone)

### Alucina?
**Não.** Todos os valores são extraídos de dados reais do site ou APIs verificáveis. Nenhuma inferência criativa.

### Limitações conhecidas
- Não detecta bloqueio de bots via `.htaccess`, firewall ou middleware JavaScript
- SSR check não executa JavaScript — sites 100% SPA serão marcados como não-SSR mesmo se renderizarem no servidor
- PageSpeed mede apenas mobile strategy

### O que falta
- Verificar `sitemap.xml` (presença e acessibilidade)
- Checar se existe `<meta name="robots" content="noindex">` no HTML

---

## Agente 2 — Metadata Entity Agent
**Arquivo:** `geo-diagnostic-engine.cjs` L.188–266  
**Status: ✅ VERIFICADO · DETERMINÍSTICO**

### O que faz
Analisa se o site tem identidade de entidade bem declarada para consumo de LLMs.

### Como funciona
1. **Extrai todos os blocos JSON-LD** (`<script type="application/ld+json">`) do HTML real e faz parse dos schemas encontrados.
2. **Verifica presença** de `Organization`/`LocalBusiness`, `Person`, `FAQPage`, `Service/Product`.
3. **Conta `sameAs`** no schema Organization (links para LinkedIn, Wikidata, Wikipedia).
4. **Requisição HTTP real** a `/llms.txt` do domínio (verifica 200 OK + conteúdo > 50 chars).
5. Gera `suggestedLlmsTxt` baseado no `<title>` e `<meta description>` reais do site.

### Dado é real?
- **JSON-LD schemas** → ✅ 100% real (parse do HTML real)
- **llms.txt** → ✅ real (requisição HTTP)
- **suggestedLlmsTxt** → 🟡 template genérico (usa title/description reais mas preenche links padrão `/sobre`, `/servicos`)

### Alucina?
**Não** no que detecta. O `suggestedLlmsTxt` gerado é um **template**, marcado claramente como sugestão — não é apresentado como realidade.

### Limitações conhecidas
- JSON-LD dentro de arquivos JavaScript externos não é detectado (só o inline no HTML)
- `sameAs` com valor único (string, não array) é contado corretamente

### O que falta
- Validar se os schemas encontrados são semanticamente corretos (não só presentes)
- Verificar Open Graph tags (`og:title`, `og:description`, `og:type`)
- Verificar se existe `<link rel="canonical">`

---

## Agente 3 — Content Absorption Agent
**Arquivo:** `geo-diagnostic-engine.cjs` L.268–347  
**Status: ✅ VERIFICADO · DETERMINÍSTICO**

### O que faz
Avalia se o conteúdo do site é "absorvível" por LLMs — denso, estruturado e factualmente rico.

### Como funciona
1. **Extrai texto visível** (remove `<script>`, `<style>`, `<nav>`, `<footer>`, tags HTML)
2. **Conta palavras** reais do conteúdo principal
3. **Answer-First** (`hasTldrAnswerFirstParagraph`): busca a primeira frase ≥40 chars que começa com letra maiúscula e NÃO começa com saudação/slogan (regex de exclusão)
4. **Estatísticas** (`hasStatisticsPer150Words`): regex complexa que captura `40%`, `3x mais`, `2 milhões de clientes` — excluindo anos e specs técnicas
5. **Citações especialistas** (`hasExpertQuotes`): detecta `<blockquote>`, "Segundo X...", "De acordo com X...", aspas com atribuição `– Fonte`
6. **Tabelas comparativas**: detecta `<table>` com `<td>` real no HTML
7. **Keyword stuffing**: detecta palavra repetida >2% das palavras totais
8. **Preços**: verifica menção de `R$`, `preço`, `valor` no texto

### Dado é real?
✅ **100% determinístico e real.** Opera exclusivamente sobre o HTML real do site.

### Alucina?
**Não.** Todos os checks são regex determinísticos sobre texto real.

### Risco de falso positivo/negativo
- `hasTldrAnswerFirstParagraph` pode ser `false` mesmo com bom conteúdo se a frase começa com palavra da lista de exclusão (ex: "Especialista em...")
- `hasStatisticsPer150Words` não capta estatísticas em formatos incomuns (ex: "dez por cento")
- `hasExpertQuotes` não detecta citações sem atribuição explícita

### O que falta
- Análise de legibilidade (Flesch-Kincaid)
- Detecção de FAQ markup (`<details>/<summary>`)
- Verificar densidade de headings H2/H3

---

## Agente 4 — SEO Optimizer Agent
**Arquivo:** `geo-diagnostic-engine.cjs` L.445–522  
**Status: ✅ VERIFICADO · DETERMINÍSTICO**

### O que faz
Avalia elementos clássicos de SEO que também impactam indexação por IA.

### Como funciona
1. Extrai e mede `<title>` (presença + comprimento ideal 20–70 chars)
2. Extrai e mede `<meta name="description">` (ideal 70–170 chars)
3. Verifica `<meta name="viewport">` (mobile-friendly)
4. Conta imagens sem atributo `alt`
5. Detecta anchors genéricos ("clique aqui", "saiba mais", "leia mais")
6. Calcula `seoScore` de 0–100 com penalizações por item ausente/incorreto

### Dado é real?
✅ **100% real.** Parse direto do HTML.

### Alucina?
**Não.**

### Limitações
- Não verifica duplicidade de title/description entre páginas
- Não verifica Core Web Vitals (feito pelo Gatekeeper)
- Não verifica estrutura de headings H1/H2

### O que falta
- Verificar canonical URL
- Hreflang para sites bilíngues
- Structured data para breadcrumbs

---

## Agente 5 — Intent Prompt Agent (Citation Share)
**Arquivo:** `geo-diagnostic-engine.cjs` L.1689–1823  
**Status: 🔵 LLM REAL (requer OPENROUTER_API_KEY) | 🔴 INDISPONÍVEL sem chave**

### O que faz
Mede o **Citation Share real** da marca — quantas vezes a marca é citada quando LLMs são perguntadas sobre o nicho da empresa.

### Como funciona
1. Detecta o nicho do site via `extractNicheAndServices()` (baseado em palavras-chave do HTML)
2. Envia **20 prompts reais** (5 prompts × 4 modelos) via OpenRouter:
   - `openai/gpt-4o-mini`
   - `anthropic/claude-haiku-4.5`
   - `google/gemini-2.5-flash`
   - `perplexity/sonar`
3. Para cada resposta, verifica se o nome da marca ou domínio aparece
4. Extrai concorrentes mencionados pelas LLMs (com filtro de falso-positivos via `isLegitimateCompetitor()`)
5. Calcula sentimento de marca (positivo/neutro/negativo) por análise de contexto local

### Dado é real?
🔵 **Respostas reais das LLMs** — quando `OPENROUTER_API_KEY` está configurada.  
🔴 **Completamente indisponível** sem a chave — retorna `null` e exclui o pilar do score.

### Alucina?
**Risco moderado a considerar:**
- As LLMs têm **conhecimento limitado pela data de corte** de treinamento. Uma marca nova ou com pouca presença online simplesmente não será citada — isso é **correto**, não é alucinação do sistema.
- Os **concorrentes listados** pelas LLMs podem ser fabricados pelas próprias LLMs — o sistema extrai o que os modelos respondem, mas não valida se esses concorrentes são reais. ⚠️
- O **sentimento** é inferido por palavras-chave de contexto (±100 chars) — pode ser impreciso em frases complexas.

### Validado?
✅ O mecanismo de chamada e registro de audit log está correto. Cada chamada é logada (`agentAuditLog`) com pergunta, resposta e flag de citação.

### O que falta
- ⚠️ **Validação dos concorrentes**: as empresas citadas pelas LLMs precisam ser verificadas como reais antes de serem apresentadas ao cliente
- Testar com mais modelos (Mistral, Llama)
- Aumentar o número de prompts por modelo para resultado mais confiável estatisticamente

---

## Agente 6 — Semantic Explorer Agent (Content Gaps)
**Arquivo:** `geo-diagnostic-engine.cjs` L.1825–1913  
**Status: 🔵 LLM REAL (requer OPENROUTER_API_KEY) | 🔴 INDISPONÍVEL sem chave**

### O que faz
Identifica lacunas de conteúdo (content gaps) que impedem a marca de ser citada por LLMs.

### Como funciona
1. Extrai os headings H1/H2 e texto visível do site (até 3000 chars)
2. Envia para `openai/gpt-4o-mini` via OpenRouter com prompt estruturado pedindo JSON com gaps, urgência e formato recomendado
3. Calcula `topicCoverageScore` (0–100) retornado pelo LLM
4. Sugere clusters semânticos baseados nos gaps identificados

### Dado é real?
- **Headings e texto base** → ✅ real do site
- **Gaps identificados** → 🔵 inferência de LLM sobre conteúdo real

### Alucina?
**Risco existente mas mitigado:**
- O LLM recebe o conteúdo real do site — não inventa sobre o que não existe
- O `topicCoverageScore` é **opinião do LLM**, não métrica verificável objetivamente
- Os gaps sugeridos são interpretações do LLM sobre o nicho — podem ser genéricos se o HTML enviado tiver pouco conteúdo

> ⚠️ **Ponto crítico para cliente:** O `topicCoverageScore` NÃO deve ser apresentado como métrica objetiva. É uma avaliação qualitativa de um modelo de linguagem.

### O que falta
- Comparar com concorrentes reais (análise de gap relativo)
- Validar gaps com volume de busca real (Google Trends / SEMrush)

---

## Agente 7 — Off-Page Entity Monitor
**Arquivo:** `geo-diagnostic-engine.cjs` L.349–443  
**Status: 🟡 HEURÍSTICO (verificação HTTP parcial)**

### O que faz
Verifica a presença da marca em plataformas de autoridade externa (LinkedIn, Crunchbase, Wikipedia).

### Como funciona
1. Extrai o nome da marca do `<title>` do site
2. Constrói URLs candidatas (`linkedin.com/company/nomemarca`, etc.)
3. Faz requisição HTTP a essas URLs e interpreta o status code:
   - `200` → `found`
   - `404` (só Wikipedia) → `not_found`
   - `403`, `999`, outros → `inconclusive`
4. Verifica se o próprio site **declara** links para LinkedIn/Wikidata/Wikipedia no HTML

### Dado é real?
🟡 **Heurístico com verificação real parcial.**

| Plataforma | Status |
|-----------|--------|
| Wikipedia | ✅ HTTP real confiável (404 é conclusivo) |
| LinkedIn | ⚠️ 403/999 sempre retorna `inconclusive` — LinkedIn bloqueia bots |
| Crunchbase | ⚠️ 403 sempre `inconclusive` |

### Alucina?
**Não — mas tem limitação estrutural crítica:**
- LinkedIn e Crunchbase retornam 403/999 para qualquer bot. O sistema **nunca pode confirmar** a ausência de perfil nessas plataformas via HTTP. Isso é documentado no `dataSourceDetail`.
- O `externalEntityScore` é calculado com base em verificações inconclusivas. Um score de `0%` para LinkedIn **não significa que não existe perfil** — apenas que não foi possível verificar.

> ⚠️ **Não apresentar LinkedIn/Crunchbase como "não encontrado"** ao cliente. Apresentar como "não verificável via automação".

### O que falta
- Usar a API oficial do LinkedIn (requer credenciais)
- Verificar Wikidata diretamente via API SPARQL
- Verificar perfil no Google Business Profile

---

## Agente 8 — Checklist Architect Agent
**Arquivo:** `geo-diagnostic-engine.cjs` L.524–643  
**Status: ✅ DERIVADO DOS AGENTES ANTERIORES**

### O que faz
Converte os resultados dos 7 agentes em um checklist técnico interativo com snippets de código prontos para implementar.

### Como funciona
- Analisa os outputs dos agentes 1–7 e gera tarefas concretas com:
  - `codeSnippet` (robots.txt, JSON-LD, llms.txt pronto para copiar)
  - `effortLevel` (Fácil 5 min / Médio 30 min / Complexo 2h)
  - `impactLevel` (Crítico / Alto / Médio)
  - `cmsInstruction` (como implementar no WordPress, etc.)
  - `verificationMethod` (como confirmar que foi feito)

### Dado é real?
✅ **Totalmente derivado de dados reais** — os snippets gerados usam o domínio real e os dados extraídos pelos agentes anteriores.

### Alucina?
**Não.** O checklist é gerado deterministicamente com base nos gaps reais encontrados.

### Limitação
- O `codeSnippet` do JSON-LD Organization usa o domínio como nome se não detectar o nome real da marca
- O `suggestedLlmsTxt` inclui links para `/sobre`, `/servicos`, `/contato` mesmo que essas páginas não existam

---

## 🎯 GEO Score — Cálculo Final
**Arquivo:** `geo-diagnostic-engine.cjs` L.645–736

### Como é calculado
O score é ponderado por 7 pilares. **Pilares LLM-dependentes só entram na base de cálculo se rodaram com dados reais:**

| Pilar | Pontos | Fonte |
|-------|--------|-------|
| Technical Gatekeeper | 18 pts | Determinístico |
| Metadata Entity | 15 pts | Determinístico |
| Content Absorption | 18 pts | Determinístico |
| SEO Optimizer | 14 pts | Determinístico |
| Semantic Explorer | 13 pts | LLM Real (excluído se offline) |
| Off-Page Entity | 10 pts | HTTP Heurístico |
| Intent Prompt | 12 pts | LLM Real (excluído se offline) |

**Total possível sem LLMs: 75 pts → normalizado para 0–100%**

> ✅ Isso é honesto: sem a chave OpenRouter, o score ainda é válido — calculado sobre os 65 pontos disponíveis e normalizado. **Não infla nem penaliza injustamente.**

---

## 🔍 LeadHunter — Mineração de Leads
**Arquivo:** `server.cjs` L.2521–3598

### O que faz
Encontra empresas/profissionais reais para prospecção via GEO.

### Fontes disponíveis

#### Fonte Google Maps (via Apify)
- **Requer `APIFY_API_TOKEN`** configurado
- Usa o actor `compass~crawler-google-places` — dados reais do Google Meu Negócio
- Complementa com busca orgânica no DuckDuckGo com filtros anti-agregador
- Faz crawling real das páginas de contato para extrair e-mail, telefone e LinkedIn

**Alucina?** ❌ **Não.** Dados vêm de APIs reais + crawling real.

**Limitações:**
- E-mail pode não ser encontrado se o site não o expõe publicamente
- `address` é extraído por regex de logradouro BR — pode não capturar todos os formatos
- `company` vem do título da página, pode ser nome genérico

#### Fonte LinkedIn (via Apify)
- **Requer `APIFY_API_TOKEN`** configurado
- Usa actor `harvestapi~linkedin-profile-search`
- Retorna perfis reais com nome, cargo, empresa e URL LinkedIn

**Alucina?** ❌ **Não para os dados de perfil.**  
⚠️ **Atenção:** O campo `domain` do lead LinkedIn é **construído** como `nomedaempresa.com.br` — isso é uma estimativa, NÃO é verificado se o domínio existe ou é correto.

#### Sem token Apify
O sistema **retorna erro** — não gera dados fictícios. Isso é correto e seguro.

### Auditoria GEO do Lead Hunter
Quando você clica em "Auditar" um lead no LeadHunter, o sistema **executa os mesmos 8 agentes** no domínio do lead. O diagnóstico completo é salvo no Firestore.

---

## 📤 Outreach Copies — Gerador de Mensagens
**Arquivo:** `server.cjs` L.3235–3346

### O que faz
Gera 9 frameworks de copywriting (PAS, BAB, PASTOR, QUEST, 4Ps, FAB, ACCA, 4Us, Falsa Lógica) personalizados com dados do diagnóstico.

### Dado é real?
- **Domínio, score, robots bloqueado** → ✅ real (vem do diagnóstico)
- **`citedCompetitor`** → ⚠️ **depende do Intent Agent**. Se o Intent Agent rodou com LLM real, é real. Se não rodou, o sistema usa `"Nicho Líder S/A"` como placeholder
- Textos dos frameworks → ✅ templates, não inventa fatos — usa variáveis reais

### Alucina?
**Não.** Os templates usam variáveis reais. O único risco é quando `citedCompetitor` é `"Nicho Líder S/A"` porque o Intent Agent não rodou.

---

## 📦 Deliverables Gerados

| Entregável | Fonte | Real? |
|-----------|-------|-------|
| `robots.txt` recomendado | Template com domínio real | ✅ Pronto para usar |
| JSON-LD Schema | Template + dados reais do site | ✅ Pronto para validar |
| `/llms.txt` | Template + nicho detectado | 🟡 Requer revisão manual |
| Template AEO | Template + fatos declarados pelo site | 🟡 Requer preenchimento |
| Checklist interativo | Derivado dos 8 agentes | ✅ Pronto para executar |
| Plano de ação Markdown | Derivado das ações priorizadas | ✅ Pronto para usar |
| Relatório HTML | Todos os agentes consolidados | ✅ Entregável ao cliente |

> ⚠️ O **FAQ template** no relatório HTML possui aviso explícito: `"As respostas abaixo são um modelo estrutural. Substitua pelos diferenciais reais e verificáveis da empresa antes de publicar."`. **Não entregue sem revisar.**

---

## 🚨 Riscos Críticos a Resolver Antes de Entregar a Clientes

### 1. Concorrentes citados pelas LLMs não são validados
**Agente afetado:** Intent Prompt Agent  
**Risco:** A LLM pode citar empresas que não existem ou não são concorrentes reais  
**Recomendação:** Revisar manualmente a lista de `topMentionedCompetitors` antes de usar no Outreach Copy

### 2. `topicCoverageScore` é uma opinião de LLM
**Agente afetado:** Semantic Explorer  
**Risco:** Pode variar entre execuções (+/- 15 pontos) para o mesmo site  
**Recomendação:** Apresentar como "estimativa qualitativa", não como métrica absoluta

### 3. LinkedIn/Crunchbase sempre "inconclusivos"
**Agente afetado:** Off-Page Entity Monitor  
**Risco:** Apresentar ao cliente como "sem perfil" quando o perfil pode existir  
**Recomendação:** Mostrar "não verificável automaticamente" — nunca "ausente"

### 4. `/llms.txt` e JSON-LD gerados são templates
**Agente afetado:** Checklist Architect / Metadata Agent  
**Risco:** Links para `/sobre`, `/servicos` podem não existir no site real  
**Recomendação:** Sempre revisar antes de entregar ao cliente

### 5. `domain` dos leads LinkedIn é estimado
**Agente afetado:** LeadHunter (LinkedIn)  
**Risco:** `empresanome.com.br` pode não ser o domínio correto  
**Recomendação:** Verificar domínio real antes de usar no Outreach

---

## ✅ O que funciona perfeitamente (sem risco de alucinação)

- **GEO Score** quando calculado com dados reais (determinístico e normalizado honestamente)
- **robots.txt analysis** — parse real, 100% confiável
- **JSON-LD detection** — parse real de schemas
- **SSR detection** — verificação real do HTML
- **llms.txt check** — requisição HTTP real
- **SEO fields** (title, meta, viewport, alt, anchors) — parse real
- **Preços visíveis** — regex no HTML real
- **Core Web Vitals** (quando `GOOGLE_API_KEY` configurado) — API real do Google
- **Calendar/Booking** — integração real com Google Calendar API
- **Email sending** — Nodemailer real com Gmail
- **Follow-up automático 48h** — cron real verificando Firestore
- **Google Maps mining** (quando Apify configurado) — dados reais de estabelecimentos

---

## 📋 Checklist de Configuração para Operação Completa

| Variável | Agente que habilita | Status recomendado |
|---------|--------------------|--------------------|
| `OPENROUTER_API_KEY` | Intent Agent + Semantic Explorer | 🔴 **Crítico** — sem ela 2 pilares ficam offline |
| `GOOGLE_API_KEY` | PageSpeed Insights (Core Web Vitals) | 🟡 Importante |
| `APIFY_API_TOKEN` | LeadHunter (Google Maps + LinkedIn) | 🟡 Para mineração ativa |
| `EMAIL_USER` + `EMAIL_PASS` | Emails, follow-up, relatórios | 🔴 **Crítico** para operação |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Calendar + Firestore | 🔴 **Crítico** para toda plataforma |
| `ADMIN_SECRET_KEY` | Auth admin | 🔴 **Crítico** para segurança |

---

## 🎯 Resumo Executivo

| Agente | Funciona? | Dado real? | Alucina? | Validado para cliente? |
|--------|-----------|-----------|----------|----------------------|
| Technical Gatekeeper | ✅ Sim | ✅ Sim | ❌ Não | ✅ Sim |
| Metadata Entity | ✅ Sim | ✅ Sim | ❌ Não | ✅ Sim |
| Content Absorption | ✅ Sim | ✅ Sim | ❌ Não | ✅ Sim |
| SEO Optimizer | ✅ Sim | ✅ Sim | ❌ Não | ✅ Sim |
| Intent Prompt (LLM) | ✅ Com chave | 🔵 LLM real | ⚠️ Competidores (revisar) | 🟡 Revisar concorrentes |
| Semantic Explorer (LLM) | ✅ Com chave | 🔵 LLM real | ⚠️ Score subjetivo | 🟡 Apresentar como qualitativo |
| Off-Page Entity | ✅ Sim | 🟡 HTTP parcial | ❌ Não | ⚠️ Nunca dizer "ausente" no LinkedIn |
| Checklist Architect | ✅ Sim | ✅ Derivado | ❌ Não | 🟡 Revisar URLs dos templates |
| LeadHunter (Google) | ✅ Com Apify | ✅ Sim | ❌ Não | ✅ Sim |
| LeadHunter (LinkedIn) | ✅ Com Apify | ✅ Sim + ⚠️ domínio estimado | ❌ Não | 🟡 Verificar domínio |
| Outreach Copies | ✅ Sim | ✅ Templates | ❌ Não | 🟡 Revisar competidor |
| GEO Score Final | ✅ Sim | ✅ Normalizado honestamente | ❌ Não | ✅ Sim |
