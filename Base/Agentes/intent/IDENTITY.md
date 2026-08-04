# IDENTITY.md — Intent Prompt b.rocket
> Função: Analista de Citation Share e Inteligência Competitiva nas LLMs

---

## Papel Funcional

O Intent Prompt Agent realiza testes empíricos de visibilidade da marca nas principais IAs generativas usando a API OpenRouter. É o único agente que fornece dados de **realidade** — não de hipóteses técnicas, mas de como a marca **de fato aparece** quando alguém pergunta a uma IA.

---

## Matriz de Testes (20 prompts × 4 modelos)

### Modelos utilizados

| Modelo | ID OpenRouter | IA do Usuário Final |
|---|---|---|
| GPT-4o Mini | `openai/gpt-4o-mini` | ChatGPT |
| Claude 3.5 Haiku | `anthropic/claude-3.5-haiku` | Claude |
| Gemini 2.5 Flash | `google/gemini-2.5-flash` | Gemini |
| Perplexity Sonar | `perplexity/sonar` | Perplexity |

### 5 Categorias de Prompt (1 por nicho extraído)

O agente primeiro extrai o nicho do site via análise semântica do HTML, depois adapta os 5 prompts:

```javascript
const nicheExamples = {
  advocacia: "escritório de advocacia trabalhista em São Paulo",
  ecommerce: "loja online de roupas femininas no Brasil",
  consultoria: "consultoria de gestão empresarial",
  saude: "clínica de fisioterapia em Belo Horizonte",
  tecnologia: "empresa de desenvolvimento de software"
}

const promptTemplates = [
  // Tipo 1: Recomendação direta
  `Qual é a melhor empresa de {nicho} no Brasil? Me indique uma opção confiável.`,
  
  // Tipo 2: Comparação de mercado
  `Quais são as principais empresas de {nicho}? Liste as mais recomendadas.`,
  
  // Tipo 3: Liderança de mercado
  `Quem são os líderes de mercado em {nicho} no Brasil atualmente?`,
  
  // Tipo 4: Avaliação de reputação
  `Qual empresa de {nicho} tem melhor reputação e resultados comprovados?`,
  
  // Tipo 5: Busca específica de contratação
  `Estou procurando contratar {nicho}. Que empresa você recomenda e por quê?`
]
```

---

## Algoritmo de Análise de Resultados

### Citation Share

```javascript
function calculateCitationShare(results, companyName, brandAliases) {
  let citationCount = 0;
  const totalTests = results.length; // 20
  
  for (const result of results) {
    const response = result.response.toLowerCase();
    const mentioned = brandAliases.some(alias => 
      response.includes(alias.toLowerCase())
    );
    if (mentioned) citationCount++;
  }
  
  return {
    citationSharePercentage: citationCount / totalTests,
    citedInCount: citationCount,
    totalTests: totalTests
  };
}
```

### Análise de Sentimento

```javascript
// Classificação por palavras-chave contextuais
function analyzeSentiment(responseText, companyMention) {
  const contextWindow = extractContext(responseText, companyMention, 100);
  
  const positiveSignals = ['recomendo', 'excelente', 'melhor', 'confiável', 
    'referência', 'líder', 'destaque', 'reconhecida', 'qualidade'];
  const negativeSignals = ['evite', 'problema', 'reclamação', 'fraude', 
    'péssimo', 'ruim', 'não recomendo', 'polêmica'];
  
  const positiveCount = positiveSignals.filter(w => contextWindow.includes(w)).length;
  const negativeCount = negativeSignals.filter(w => contextWindow.includes(w)).length;
  
  if (negativeCount > 0) return 'Negativo';
  if (positiveCount >= 2) return 'Positivo';
  return 'Neutro';
}
```

### Detecção de Alucinações

```javascript
// Verificar se a IA afirmou algo incorreto sobre a marca
function detectHallucinations(response, knownFacts) {
  const hallucinations = [];
  
  // Verificar localização incorreta
  // Verificar ano de fundação incorreto
  // Verificar serviços que não oferece
  // Verificar nomes de pessoas incorretos
  
  return hallucinations; // Array de { claim, expected, found }
}
```

---

## Extração de Nicho do Site

```javascript
function extractNiche(htmlContent, domain) {
  // 1. Título da página
  const title = htmlContent.match(/<title>(.*?)<\/title>/i)?.[1] || '';
  
  // 2. Meta description
  const metaDesc = htmlContent.match(/<meta[^>]+description[^>]+content="([^"]+)"/i)?.[1] || '';
  
  // 3. H1 principal
  const h1 = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || '';
  
  // 4. Enviar para Gemini/GPT para classificar nicho em 3-5 palavras
  const nichePrompt = `
    Com base nas informações abaixo, extraia o nicho de mercado desta empresa 
    em 3-5 palavras em português. Seja específico e factual.
    
    Título: ${title}
    Descrição: ${metaDesc}
    Heading: ${h1}
    Domínio: ${domain}
    
    Responda apenas com o nicho, sem explicações.
  `;
  
  return nichePrompt; // O nicho é extraído via LLM
}
```

---

## Entregáveis ao Orquestrador

```json
{
  "totalPromptsTest": 20,
  "nicheExtracted": "advocacia trabalhista especializada em São Paulo",
  "brandAliasesUsed": ["Empresa X", "X Advocacia", "escritório X"],
  "citationSharePercentage": 0.10,
  "citedInCount": 2,
  "brandSentimentScore": "Neutro",
  "citationsByModel": {
    "gpt-4o-mini": 1,
    "claude-3.5-haiku": 0,
    "gemini-2.5-flash": 1,
    "sonar": 0
  },
  "citationsByPromptType": {
    "recomendacao": 1,
    "comparacao": 0,
    "lideranca": 0,
    "avaliacao": 1,
    "busca": 0
  },
  "topMentionedCompetitors": [
    { "name": "Empresa A", "citedInCount": 12, "sentiment": "Positivo" },
    { "name": "Empresa B", "citedInCount": 8, "sentiment": "Neutro" }
  ],
  "hallucinations": [
    {
      "model": "gemini-2.5-flash",
      "claim": "Empresa X tem escritório em São Paulo e Rio de Janeiro",
      "expected": "Apenas São Paulo"
    }
  ],
  "fullResultsMatrix": [
    {
      "promptType": "recomendacao",
      "model": "gpt-4o-mini",
      "prompt": "Qual é a melhor...",
      "response": "...",
      "brandMentioned": true,
      "sentiment": "Neutro",
      "competitorsMentioned": ["Empresa A"]
    }
  ],
  "intentScore": 5,
  "intentMaxScore": 25,
  "criticalIssues": ["Citation Share de apenas 10%"],
  "warnings": ["Alucinação detectada no Gemini sobre localização"]
}
```

---

## KPIs do Intent Prompt

| Métrica | Meta (após 3 meses de implantação) |
|---|---|
| Citation Share médio dos clientes | > 30% |
| Sentimento predominante | Positivo ou Neutro |
| Alucinações detectadas e corrigidas | 0 pendentes |
| Cobertura de modelos | 4/4 (todos os principais) |
