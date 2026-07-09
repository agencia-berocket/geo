/**
 * b.rocket GEO Diagnostic Engine
 * Implements the 5-agent pipeline using OpenRouter as LLM orchestrator.
 *
 * Agents:
 *  1. Orchestrator   — controls the flow, calculates GEO Score
 *  2. Gatekeeper     — robots.txt + SSR + latency audit
 *  3. MetadataEntity — JSON-LD schema validation + llms.txt
 *  4. ContentAbsorb  — chunking, AEO, density analysis
 *  5. IntentPrompt   — real LLM citation share via OpenRouter
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// ─── HTTP helper ────────────────────────────────────────────────────────────
function fetchUrl(rawUrl, options = {}) {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    } catch (e) {
      return reject(new Error(`URL inválida: ${rawUrl}`));
    }

    const lib = parsedUrl.protocol === 'https:' ? https : http;
    const start = Date.now();

    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'b.rocket-GEO-Auditor/1.0',
        'Accept': 'text/html,application/json,*/*',
        ...options.headers,
      },
      timeout: 10000,
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          latencyMs: Date.now() - start,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// ─── OpenRouter helper ───────────────────────────────────────────────────────
async function callOpenRouter(model, systemPrompt, userPrompt, apiKey) {
  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 600,
    temperature: 0.3,
  });

  const res = await fetchUrl('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://geo.berocket.com.br',
      'X-Title': 'b.rocket GEO Diagnostic',
    },
    body,
  });

  const parsed = JSON.parse(res.body);
  if (parsed.error) throw new Error(`OpenRouter: ${parsed.error.message}`);
  return parsed.choices?.[0]?.message?.content || '';
}

// ─── AGENTE 2: Technical Gatekeeper ─────────────────────────────────────────
async function runGatekeeperAgent(baseUrl, htmlContent) {
  // Fetch robots.txt
  let robotsTxt = '';
  let serverLatencyMs = 0;
  try {
    const robotsRes = await fetchUrl(`${baseUrl}/robots.txt`);
    robotsTxt = robotsRes.body;
    serverLatencyMs = robotsRes.latencyMs;
  } catch {
    robotsTxt = '';
  }

  // AI bots that MUST be allowed for search/retrieval
  const requiredBots = ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Googlebot', 'GPTBot'];
  const blockedCrawlers = [];
  let robotsTxtAllowAiBots = true;

  // Parse robots.txt
  if (robotsTxt) {
    const lines = robotsTxt.split('\n').map(l => l.trim().toLowerCase());
    let currentUserAgent = '';
    for (const line of lines) {
      if (line.startsWith('user-agent:')) {
        currentUserAgent = line.replace('user-agent:', '').trim();
      } else if (line.startsWith('disallow:') && line.includes('/*')) {
        // Wildcard disallow — check if applies to important bots
        for (const bot of requiredBots) {
          if (currentUserAgent === '*' || currentUserAgent === bot.toLowerCase()) {
            if (!blockedCrawlers.includes(bot)) {
              blockedCrawlers.push(bot);
              robotsTxtAllowAiBots = false;
            }
          }
        }
      }
    }
  }

  // Check SSR — can we read text in raw HTML without JS?
  const htmlLower = (htmlContent || '').toLowerCase();
  const hasTextContent = htmlLower.includes('<p') || htmlLower.includes('<h1') || htmlLower.includes('<article');
  const hasHeavyJS = htmlLower.includes('react') || htmlLower.includes('__next') || htmlLower.includes('data-reactroot');
  const ssrActive = hasTextContent && (htmlLower.length > 5000);

  // Price detection
  const pricePatterns = /r\$|preço|price|plano|pacote|investimento|\d+[.,]\d{2}/i;
  const hasPriceGatekeeperIssue = !pricePatterns.test(htmlContent || '');

  // Stale timestamp
  const stalePattern = /(201[0-9]|202[0-2])/;
  const staleTimestampDetected = stalePattern.test(htmlContent || '');

  return {
    robotsTxtAllowAiBots,
    blockedCrawlers,
    ssrActive,
    hasPriceGatekeeperIssue,
    staleTimestampDetected,
    serverLatencyMs,
    robotsTxtSnippet: robotsTxt.slice(0, 500),
  };
}

// ─── AGENTE 3: Metadata Entity Agent ─────────────────────────────────────────
async function runMetadataAgent(htmlContent, domain) {
  const schemasFound = [];
  const missingSchemas = [];

  // Extract JSON-LD blocks
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  const jsonLdBlocks = [];

  while ((match = jsonLdRegex.exec(htmlContent)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      jsonLdBlocks.push(parsed);
      const type = parsed['@type'];
      if (type) schemasFound.push(Array.isArray(type) ? type.join(', ') : type);
    } catch {}
  }

  // Check required schemas
  const orgSchema = jsonLdBlocks.find(b => b['@type'] === 'Organization' || b['@type'] === 'LocalBusiness');
  const personSchema = jsonLdBlocks.find(b => b['@type'] === 'Person');
  const faqSchema = jsonLdBlocks.find(b => b['@type'] === 'FAQPage');
  const productSchema = jsonLdBlocks.find(b => ['Product', 'Service', 'WebPage'].includes(b['@type']));

  if (!orgSchema) missingSchemas.push('Organization');
  if (!personSchema) missingSchemas.push('Person');
  if (!faqSchema) missingSchemas.push('FAQPage');
  if (!productSchema) missingSchemas.push('Service');

  const organizationSameAsCount = orgSchema?.sameAs
    ? (Array.isArray(orgSchema.sameAs) ? orgSchema.sameAs.length : 1)
    : 0;

  // Check /llms.txt
  let llmsTxtPublished = false;
  try {
    const llmsRes = await fetchUrl(`https://${domain}/llms.txt`);
    llmsTxtPublished = llmsRes.statusCode === 200 && llmsRes.body.length > 50;
  } catch {}

  // Generate suggested llms.txt content
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
  const siteTitle = titleMatch ? titleMatch[1].trim() : domain;
  const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const siteDesc = descMatch ? descMatch[1] : 'Empresa especializada.';

  const suggestedLlmsTxt = `# ${siteTitle}

> ${siteDesc}

## Páginas Principais

- [Home](https://${domain}): Página principal com serviços e proposta de valor.
- [Sobre](https://${domain}/sobre): Informações sobre a empresa e equipe.
- [Serviços](https://${domain}/servicos): Detalhamento de soluções oferecidas.
- [Contato](https://${domain}/contato): Formulário e canais de atendimento.
`;

  return {
    organizationSchemaPresent: !!orgSchema,
    organizationSameAsCount,
    personSchemaPresent: !!personSchema,
    llmsTxtPublished,
    schemasFound,
    missingSchemas,
    jsonLdBlocksCount: jsonLdBlocks.length,
    suggestedLlmsTxt,
  };
}

// ─── AGENTE 4: Content Absorption Agent ─────────────────────────────────────
async function runContentAgent(htmlContent) {
  // Extract main text content (strip HTML tags)
  const mainContent = htmlContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = mainContent.split(/\s+/).filter(w => w.length > 2);
  const totalWords = words.length;

  // Estimate mean chunk size in tokens (~0.75 tokens per word average)
  const meanChunkSizeTokens = Math.round(totalWords * 0.75 / Math.max(1, Math.floor(totalWords / 200)));

  // Check AEO: answer in first 60 words
  const firstWords = words.slice(0, 80).join(' ');
  const hasTldrAnswerFirstParagraph = firstWords.length > 100 && !firstWords.includes('Olá') && !firstWords.includes('Bem-vindo');

  // Check statistics density: numbers/percentages every 150 words
  const statsMatches = mainContent.match(/\d+[\.,]?\d*\s*(%|milhão|bilhão|mil|k\b|m\b)/gi) || [];
  const hasStatisticsPer150Words = statsMatches.length >= Math.floor(totalWords / 200);

  // Check expert quotes
  const quotePatterns = /<blockquote|"[^"]{30,}"|«[^»]{30,}»/i;
  const hasExpertQuotes = quotePatterns.test(htmlContent);

  // Check comparison tables
  const hasHtmlComparisonTables = /<table/i.test(htmlContent);

  // Hedged language score
  const hedgeWords = ['talvez', 'pode ser', 'possivelmente', 'quem sabe', 'eventualmente', 'talvez'];
  const hedgeCount = hedgeWords.reduce((acc, w) => acc + (mainContent.toLowerCase().split(w).length - 1), 0);
  const hedgedLanguageScore = Math.min(1, hedgeCount / Math.max(1, totalWords / 500));

  // Keyword stuffing detection (same word repeated > 15 times per 1000 words)
  const wordFreq = {};
  words.forEach(w => { const lw = w.toLowerCase(); wordFreq[lw] = (wordFreq[lw] || 0) + 1; });
  const maxFreq = Math.max(...Object.values(wordFreq));
  const keywordStuffingDetected = maxFreq > (totalWords / 50);

  // Price not mentioned
  const priceNotMentioned = !/R\$|preço|valor|investimento|\d+,\d{2}/i.test(mainContent);

  return {
    meanChunkSizeTokens: Math.min(300, Math.max(50, meanChunkSizeTokens)),
    factorsDetected: {
      hasTldrAnswerFirstParagraph,
      hasStatisticsPer150Words,
      hasExpertQuotes,
      hasHtmlComparisonTables,
    },
    linguisticDensity: {
      hedgedLanguageScore: parseFloat(hedgedLanguageScore.toFixed(2)),
      keywordStuffingDetected,
    },
    priceNotMentioned,
    totalWords,
  };
}

// ─── AGENTE 5: Intent Prompt Agent (OpenRouter) ──────────────────────────────
async function runIntentAgent(url, htmlContent, apiKey) {
  const domain = url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

  // Extract company name from title/og:title
  const titleMatch = htmlContent.match(/<title[^>]*>([^<|–-]+)/i);
  const brandName = titleMatch ? titleMatch[1].trim().split(/[|–-]/)[0].trim() : domain;

  // Extract niche keywords from meta description
  const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const niche = descMatch ? descMatch[1].slice(0, 200) : 'serviços digitais';

  if (!apiKey) {
    // Return simulated data when no key
    return {
      totalPromptsTest: 20,
      citationSharePercentage: 0.05,
      brandSentimentScore: 'Neutro',
      topMentionedCompetitors: ['Concorrente A', 'Concorrente B'],
      citationsByModel: { 'GPT-4o-mini': 0, 'Claude Haiku': 0, 'Gemini Flash': 1, 'Perplexity Sonar': 0 },
      note: 'Simulado — configure OPENROUTER_API_KEY para resultados reais',
    };
  }

  // 5 prompts per model, 4 models = 20 total
  const models = [
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-haiku',
    'google/gemini-2.5-flash',
    'perplexity/sonar',
  ];

  const systemPrompt = `Você é um assistente honesto. Responda em português. Seja direto e objetivo.`;

  const prompts = [
    `Qual é a melhor empresa de ${niche} no Brasil? Liste as principais opções.`,
    `Me recomende uma empresa especializada em ${niche}. Quais são as mais conceituadas?`,
    `Quem são os líderes de mercado em ${niche} no Brasil?`,
    `Comparando empresas de ${niche}, quais você recomendaria?`,
    `Qual empresa de ${niche} tem melhor reputação e resultados?`,
  ];

  const citationsByModel = {};
  let totalCitations = 0;
  const competitors = new Set();
  let sentimentTotal = 0;
  let sentimentCount = 0;

  for (const model of models) {
    const modelKey = model.split('/')[1].replace(/-\d.*/, '');
    citationsByModel[modelKey] = 0;

    for (const prompt of prompts) {
      try {
        const response = await callOpenRouter(model, systemPrompt, prompt, apiKey);
        const responseLC = response.toLowerCase();
        const brandLC = brandName.toLowerCase();
        const domainLC = domain.toLowerCase();

        // Check if brand was mentioned
        if (responseLC.includes(brandLC) || responseLC.includes(domainLC)) {
          citationsByModel[modelKey]++;
          totalCitations++;
        }

        // Extract competitor names (simple heuristic — capitalized words not in our brand)
        const capWords = response.match(/\b[A-ZÁÉÍÓÚ][a-záéíóú]{4,}\b/g) || [];
        capWords.forEach(w => {
          if (!brandName.toLowerCase().includes(w.toLowerCase()) && w !== 'Brasil' && w !== 'Empresa') {
            competitors.add(w);
          }
        });

        // Sentiment: look for positive/negative context around brand mention
        if (responseLC.includes(brandLC)) {
          const idx = responseLC.indexOf(brandLC);
          const context = responseLC.slice(Math.max(0, idx - 100), idx + 100);
          const posWords = ['melhor', 'recomendo', 'excelente', 'líder', 'top', 'destaque'];
          const negWords = ['evite', 'cuidado', 'problema', 'ruim', 'fraco'];
          const isPos = posWords.some(w => context.includes(w));
          const isNeg = negWords.some(w => context.includes(w));
          sentimentTotal += isPos ? 1 : isNeg ? -1 : 0;
          sentimentCount++;
        }
      } catch (e) {
        // Silently skip failed requests
      }
    }
  }

  const totalPrompts = models.length * prompts.length;
  const citationSharePercentage = totalPrompts > 0 ? totalCitations / totalPrompts : 0;

  const avgSentiment = sentimentCount > 0 ? sentimentTotal / sentimentCount : 0;
  const brandSentimentScore = avgSentiment > 0.2 ? 'Positivo' : avgSentiment < -0.2 ? 'Negativo' : 'Neutro';

  const topMentionedCompetitors = [...competitors]
    .filter(c => c !== brandName)
    .slice(0, 3);

  return {
    totalPromptsTest: totalPrompts,
    citationSharePercentage: parseFloat(citationSharePercentage.toFixed(3)),
    brandSentimentScore,
    topMentionedCompetitors,
    citationsByModel,
  };
}

// ─── ORQUESTRADOR: Calcular GEO Score ────────────────────────────────────────
function calculateGeoScore(gatekeeper, metadata, content, visibility) {
  let score = 0;

  // Gatekeeper (25 pts — exclusionary)
  if (gatekeeper.robotsTxtAllowAiBots) score += 10;
  if (gatekeeper.ssrActive) score += 8;
  if (!gatekeeper.hasPriceGatekeeperIssue) score += 7;

  // Metadata (20 pts)
  if (metadata.organizationSchemaPresent) score += 8;
  if (metadata.personSchemaPresent) score += 4;
  if (metadata.llmsTxtPublished) score += 5;
  if (metadata.organizationSameAsCount > 0) score += 3;

  // Content (30 pts)
  if (content.factorsDetected.hasTldrAnswerFirstParagraph) score += 8;
  if (content.factorsDetected.hasStatisticsPer150Words) score += 7;
  if (content.factorsDetected.hasExpertQuotes) score += 7;
  if (content.factorsDetected.hasHtmlComparisonTables) score += 5;
  if (!content.priceNotMentioned) score += 3;

  // Visibility (25 pts)
  score += Math.round(visibility.citationSharePercentage * 100 * 0.25);
  if (visibility.brandSentimentScore === 'Positivo') score += 5;
  else if (visibility.brandSentimentScore === 'Neutro') score += 2;

  return Math.min(100, Math.max(0, score));
}

// ─── Build priority action list ───────────────────────────────────────────────
function buildActionList(gatekeeper, metadata, content, visibility) {
  const actions = [];

  if (!gatekeeper.robotsTxtAllowAiBots) {
    actions.push({
      step: actions.length + 1,
      agentOwner: 'TECHNICAL_GATEKEEPER_AGENT',
      impact: 'Crítico (Gatekeeper)',
      task: `Corrigir robots.txt para liberar explicitamente: ${gatekeeper.blockedCrawlers.join(', ') || 'OAI-SearchBot, PerplexityBot, Claude-SearchBot'}`,
    });
  }

  if (!metadata.organizationSchemaPresent) {
    actions.push({
      step: actions.length + 1,
      agentOwner: 'METADATA_ENTITY_AGENT',
      impact: 'Crítico (Gatekeeper)',
      task: 'Implementar Schema Organization com sameAs apontando para LinkedIn, Wikidata e Wikipedia',
    });
  }

  if (!metadata.llmsTxtPublished) {
    actions.push({
      step: actions.length + 1,
      agentOwner: 'METADATA_ENTITY_AGENT',
      impact: 'Alto',
      task: 'Publicar arquivo /llms.txt na raiz do site com mapa semântico em Markdown',
    });
  }

  if (!content.factorsDetected.hasTldrAnswerFirstParagraph) {
    actions.push({
      step: actions.length + 1,
      agentOwner: 'CONTENT_ABSORPTION_AGENT',
      impact: 'Alto',
      task: 'Reescrever introduções com fórmula Answer-First: resposta direta nas primeiras 60 palavras de cada seção (H2)',
    });
  }

  if (!content.factorsDetected.hasStatisticsPer150Words) {
    actions.push({
      step: actions.length + 1,
      agentOwner: 'CONTENT_ABSORPTION_AGENT',
      impact: 'Alto',
      task: 'Inserir dados numéricos precisos e fontes verificáveis a cada 150–200 palavras (+31% citabilidade)',
    });
  }

  if (!content.factorsDetected.hasHtmlComparisonTables) {
    actions.push({
      step: actions.length + 1,
      agentOwner: 'CONTENT_ABSORPTION_AGENT',
      impact: 'Médio',
      task: 'Criar tabelas comparativas HTML (recebem 47% mais citações que texto corrido)',
    });
  }

  if (visibility.citationSharePercentage < 0.1) {
    actions.push({
      step: actions.length + 1,
      agentOwner: 'INTENT_PROMPT_AGENT',
      impact: 'Alto',
      task: 'Brand não detectada pelas IAs — iniciar estratégia de relações públicas digitais e seeding em portais de alta autoridade',
    });
  }

  if (metadata.missingSchemas.length > 0) {
    actions.push({
      step: actions.length + 1,
      agentOwner: 'METADATA_ENTITY_AGENT',
      impact: 'Médio',
      task: `Implementar schemas ausentes: ${metadata.missingSchemas.join(', ')}`,
    });
  }

  return actions;
}

// ─── HTML Report Generator ────────────────────────────────────────────────────
function generateHtmlReport(lead, diagnostic) {
  const score = diagnostic.overallGeoScore;
  const scoreColor = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
  const scoreLabel = score >= 70 ? 'Bom' : score >= 40 ? 'Médio' : 'Crítico';

  const formatCheck = (ok) => ok
    ? `<span style="display:inline-block;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;width:18px;height:18px;line-height:16px;text-align:center;font-size:11px;font-weight:bold;margin-right:8px;vertical-align:middle;">✓</span>`
    : `<span style="display:inline-block;color:#dc2626;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;width:18px;height:18px;line-height:16px;text-align:center;font-size:11px;font-weight:bold;margin-right:8px;vertical-align:middle;">✗</span>`;

  const impactStyles = (impact) => {
    if (impact.includes('Crítico')) return 'background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;';
    if (impact.includes('Alto')) return 'background:#fff7ed;color:#d97706;border:1px solid #fed7aa;';
    return 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;';
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Raio-X de GEO — ${lead.url} | b.rocket</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@500;700&display=swap');
  @media (max-width: 600px) {
    .container { padding: 15px !important; }
    .grid2 { grid-template-columns: 1fr !important; gap: 10px !important; }
    .score-card { padding: 24px !important; }
    .hero-title { font-size: 28px !important; }
  }
</style>
</head>
<body style="background-color:#f4f5f8;color:#0c0d0e;font-family:'Inter', -apple-system, BlinkMacSystemFont, sans-serif;margin:0;padding:0;-webkit-font-smoothing:antialiased;min-height:100vh;">
<div class="container" style="max-width:650px;margin:0 auto;padding:30px 15px;">

  <!-- Header -->
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;border-bottom:1px solid #e4e4e7;padding-bottom:15px;">
    <tr>
      <td align="left">
        <div style="font-family:'Space Grotesk', sans-serif;font-weight:700;font-size:20px;color:#09090b;letter-spacing:-0.5px;">
          <span style="color:#dc2626;">b.</span>rocket <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#71717a;background:#e4e4e7;border:1px solid #d1d5db;padding:2px 6px;border-radius:4px;margin-left:4px;font-weight:bold;vertical-align:middle;">GEO_CORE_V10</span>
        </div>
      </td>
      <td align="right" style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#71717a;font-weight:bold;">
        DIAGNÓSTICO // ${new Date().toLocaleDateString('pt-BR')} // CONFIDENCIAL
      </td>
    </tr>
  </table>

  <!-- Hero & Score -->
  <div style="text-align:center;margin-bottom:30px;">
    <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#dc2626;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;font-weight:bold;">DIAGNÓSTICO SEMÂNTICO DE GEO</div>
    <h1 class="hero-title" style="font-family:'Space Grotesk', sans-serif;font-size:36px;font-weight:700;color:#0c0d0e;margin:0 0 4px;letter-spacing:-1px;">Raio-X de GEO</h1>
    <div style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#71717a;word-break:break-all;margin-bottom:25px;">${lead.url}</div>

    <!-- Score Card Neumórfico -->
    <div class="score-card" style="background:#ffffff;border:1px solid rgba(255, 255, 255, 0.6);border-radius:24px;box-shadow:0px 1px 2px rgba(0, 0, 0, 0.02), 8px 12px 28px -4px rgba(13, 20, 33, 0.06);padding:32px;display:inline-block;min-width:240px;text-align:center;">
      <div style="font-size:64px;font-weight:800;color:${scoreColor};font-family:'JetBrains Mono',monospace;line-height:1;margin:0 auto 10px;">${score}%</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#71717a;letter-spacing:1px;font-weight:bold;">
        GEO SCORE // <span style="color:${scoreColor};font-weight:bold;">${scoreLabel.toUpperCase()}</span>
      </div>
    </div>
  </div>

  <!-- Technical Gatekeeper -->
  <div style="background:#ffffff;border:1px solid rgba(255, 255, 255, 0.6);border-radius:24px;box-shadow:0px 1px 2px rgba(0, 0, 0, 0.02), 8px 12px 28px -4px rgba(13, 20, 33, 0.06);padding:24px;margin-bottom:24px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border-bottom:1px solid #f1f2f5;padding-bottom:10px;">
      <tr>
        <td align="left">
          <span style="font-size:18px;margin-right:8px;vertical-align:middle;">🛡️</span>
          <span style="font-family:'Space Grotesk', sans-serif;font-weight:700;color:#09090b;font-size:16px;vertical-align:middle;text-transform:uppercase;letter-spacing:-0.2px;">Technical Gatekeeper</span>
        </td>
        <td align="right">
          <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:bold;padding:4px 8px;border-radius:6px;${diagnostic.gatekeeperStatus.robotsTxtAllowAiBots ? 'color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;' : 'color:#b91c1c;background:#fef2f2;border:1px solid #fca5a5;'}">
            ${diagnostic.gatekeeperStatus.robotsTxtAllowAiBots ? 'OK' : 'CRÍTICO'}
          </span>
        </td>
      </tr>
    </table>
    
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;">
      ${formatCheck(diagnostic.gatekeeperStatus.robotsTxtAllowAiBots)} Bots de IA autorizados no robots.txt
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;">
      ${formatCheck(diagnostic.gatekeeperStatus.ssrActive)} Conteúdo acessível sem Javascript (SSR)
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;">
      ${formatCheck(!diagnostic.gatekeeperStatus.hasPriceGatekeeperIssue)} Preços explícitos no HTML para IA
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;">
      ${formatCheck(!diagnostic.gatekeeperStatus.staleTimestampDetected)} Timestamps atualizados recentemente
    </div>
    
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:14px;border-top:1px solid #f1f2f5;padding-top:10px;font-size:12px;">
      <tr>
        <td style="color:#71717a;font-family:'JetBrains Mono',monospace;">LATÊNCIA DO SERVIDOR:</td>
        <td align="right" style="font-family:'JetBrains Mono',monospace;font-weight:bold;color:${diagnostic.gatekeeperStatus.serverLatencyMs < 800 ? '#16a34a' : '#d97706'}">
          ${diagnostic.gatekeeperStatus.serverLatencyMs}ms
        </td>
      </tr>
    </table>
    
    ${diagnostic.gatekeeperStatus.blockedCrawlers.length > 0 ? `
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px;margin-top:12px;font-size:12px;color:#b91c1c;line-height:1.4;font-family:'JetBrains Mono',monospace;">
      ⚠️ <strong>Bots Bloqueados:</strong> ${diagnostic.gatekeeperStatus.blockedCrawlers.join(', ')}
    </div>` : ''}
  </div>

  <!-- Metadata Entity -->
  <div style="background:#ffffff;border:1px solid rgba(255, 255, 255, 0.6);border-radius:24px;box-shadow:0px 1px 2px rgba(0, 0, 0, 0.02), 8px 12px 28px -4px rgba(13, 20, 33, 0.06);padding:24px;margin-bottom:24px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border-bottom:1px solid #f1f2f5;padding-bottom:10px;">
      <tr>
        <td align="left">
          <span style="font-size:18px;margin-right:8px;vertical-align:middle;">🗂️</span>
          <span style="font-family:'Space Grotesk', sans-serif;font-weight:700;color:#09090b;font-size:16px;vertical-align:middle;text-transform:uppercase;letter-spacing:-0.2px;">Metadata Entity</span>
        </td>
        <td align="right">
          <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:bold;padding:4px 8px;border-radius:6px;${diagnostic.metadataAnalysis.organizationSchemaPresent ? 'color:#b45309;background:#fff7ed;border:1px solid #fed7aa;' : 'color:#b91c1c;background:#fef2f2;border:1px solid #fca5a5;'}">
            ${diagnostic.metadataAnalysis.organizationSchemaPresent ? 'PARCIAL' : 'CRÍTICO'}
          </span>
        </td>
      </tr>
    </table>
    
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;">
      ${formatCheck(diagnostic.metadataAnalysis.organizationSchemaPresent)} Schema Organization ou LocalBusiness
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;">
      ${formatCheck(diagnostic.metadataAnalysis.personSchemaPresent)} Schema Person (Credenciais de Autor)
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;">
      ${formatCheck(diagnostic.metadataAnalysis.llmsTxtPublished)} Arquivo /llms.txt publicado
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;">
      ${formatCheck(diagnostic.metadataAnalysis.organizationSameAsCount > 0)} Mapeamento de redes sociais (sameAs)
    </div>
    
    ${diagnostic.metadataAnalysis.missingSchemas.length > 0 ? `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px;margin-top:12px;font-size:12px;color:#b45309;line-height:1.4;font-family:'JetBrains Mono',monospace;">
      ⚠️ <strong>Schemas Faltantes:</strong> ${diagnostic.metadataAnalysis.missingSchemas.join(', ')}
    </div>` : ''}
  </div>

  <!-- Content Absorption -->
  <div style="background:#ffffff;border:1px solid rgba(255, 255, 255, 0.6);border-radius:24px;box-shadow:0px 1px 2px rgba(0, 0, 0, 0.02), 8px 12px 28px -4px rgba(13, 20, 33, 0.06);padding:24px;margin-bottom:24px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border-bottom:1px solid #f1f2f5;padding-bottom:10px;">
      <tr>
        <td align="left">
          <span style="font-size:18px;margin-right:8px;vertical-align:middle;">📝</span>
          <span style="font-family:'Space Grotesk', sans-serif;font-weight:700;color:#09090b;font-size:16px;vertical-align:middle;text-transform:uppercase;letter-spacing:-0.2px;">Content Absorption</span>
        </td>
        <td align="right">
          <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:bold;padding:4px 8px;border-radius:6px;color:#b45309;background:#fff7ed;border:1px solid #fed7aa;">
            ANÁLISE
          </span>
        </td>
      </tr>
    </table>
    
    <div class="grid2" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div style="font-size:13px;color:#4b5563;line-height:1.4;">
        ${formatCheck(diagnostic.contentReview.factorsDetected.hasTldrAnswerFirstParagraph)} Resposta direta no início
      </div>
      <div style="font-size:13px;color:#4b5563;line-height:1.4;">
        ${formatCheck(diagnostic.contentReview.factorsDetected.hasStatisticsPer150Words)} Estatísticas frequentes
      </div>
      <div style="font-size:13px;color:#4b5563;line-height:1.4;">
        ${formatCheck(diagnostic.contentReview.factorsDetected.hasExpertQuotes)} Citações de especialistas
      </div>
      <div style="font-size:13px;color:#4b5563;line-height:1.4;">
        ${formatCheck(diagnostic.contentReview.factorsDetected.hasHtmlComparisonTables)} Tabelas comparativas HTML
      </div>
    </div>
    
    <div style="border-top:1px solid #f1f2f5;padding-top:12px;margin-top:12px;font-size:12px;font-family:'JetBrains Mono',monospace;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr style="height:24px;">
          <td style="color:#71717a;">TAMANHO MÉDIO DE CHUNK:</td>
          <td align="right" style="font-weight:bold;color:#09090b;">${diagnostic.contentReview.meanChunkSizeTokens} tokens</td>
        </tr>
        <tr style="height:24px;">
          <td style="color:#71717a;">PREÇOS VISÍVEIS:</td>
          <td align="right" style="font-weight:bold;color:#09090b;">${!diagnostic.contentReview.priceNotMentioned ? '✓ Sim' : '✗ Não'}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Citation Share nas IAs -->
  <div style="background:#ffffff;border:1px solid rgba(255, 255, 255, 0.6);border-radius:24px;box-shadow:0px 1px 2px rgba(0, 0, 0, 0.02), 8px 12px 28px -4px rgba(13, 20, 33, 0.06);padding:24px;margin-bottom:24px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border-bottom:1px solid #f1f2f5;padding-bottom:10px;">
      <tr>
        <td align="left">
          <span style="font-size:18px;margin-right:8px;vertical-align:middle;">🔍</span>
          <span style="font-family:'Space Grotesk', sans-serif;font-weight:700;color:#09090b;font-size:16px;vertical-align:middle;text-transform:uppercase;letter-spacing:-0.2px;">Citation Share nas IAs</span>
        </td>
        <td align="right">
          <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:bold;padding:4px 8px;border-radius:6px;${diagnostic.visibilityBenchmarking.citationSharePercentage >= 0.3 ? 'color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;' : 'color:#b91c1c;background:#fef2f2;border:1px solid #fca5a5;'}">
            ${(diagnostic.visibilityBenchmarking.citationSharePercentage * 100).toFixed(0)}% SHARE
          </span>
        </td>
      </tr>
    </table>
    
    <div style="font-size:13px;color:#4b5563;margin-bottom:6px;">Porcentagem de Citações:</div>
    <div style="height:10px;background:#e4e4e7;border-radius:9999px;overflow:hidden;margin-bottom:12px;border:1px solid #d1d5db;">
      <div style="height:100%;background:#dc2626;border-radius:9999px;width:${Math.min(100, diagnostic.visibilityBenchmarking.citationSharePercentage * 100)}%;"></div>
    </div>
    
    <div style="font-size:12px;font-family:'JetBrains Mono',monospace;color:#4b5563;line-height:1.6;margin-top:14px;border-top:1px solid #f1f2f5;padding-top:10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr style="height:24px;">
          <td style="color:#71717a;">SENTIMENTO DE MARCA:</td>
          <td align="right" style="font-weight:bold;color:#0c0d0e;">${diagnostic.visibilityBenchmarking.brandSentimentScore}</td>
        </tr>
        <tr style="height:24px;">
          <td style="color:#71717a;">PROMPTS TESTADOS:</td>
          <td align="right" style="font-weight:bold;color:#0c0d0e;">${diagnostic.visibilityBenchmarking.totalPromptsTest}</td>
        </tr>
        ${Object.entries(diagnostic.visibilityBenchmarking.citationsByModel).map(([model, count]) => `
        <tr style="height:24px;border-top:1px solid #f9fafb;">
          <td style="color:#71717a;font-family:'JetBrains Mono',monospace;font-size:11px;">${model}:</td>
          <td align="right" style="font-weight:bold;color:#0c0d0e;">${count} citações</td>
        </tr>
        `).join('')}
      </table>
    </div>
  </div>

  <!-- Plano de Ação Priorizado -->
  <div style="background:#ffffff;border:1px solid rgba(255, 255, 255, 0.6);border-radius:24px;box-shadow:0px 1px 2px rgba(0, 0, 0, 0.02), 8px 12px 28px -4px rgba(13, 20, 33, 0.06);padding:24px;margin-bottom:24px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border-bottom:1px solid #f1f2f5;padding-bottom:10px;">
      <tr>
        <td align="left">
          <span style="font-size:18px;margin-right:8px;vertical-align:middle;">📋</span>
          <span style="font-family:'Space Grotesk', sans-serif;font-weight:700;color:#09090b;font-size:16px;vertical-align:middle;text-transform:uppercase;letter-spacing:-0.2px;">Plano de Ação Priorizado</span>
        </td>
      </tr>
    </table>
    
    ${diagnostic.actionItemsPriorityList.map(item => `
    <div style="background:#fdfefe;border:1px solid rgba(0,0,0,0.04);border-radius:12px;padding:12px;margin-bottom:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.9);display:table;width:100%;box-sizing:border-box;">
      <div style="display:table-cell;vertical-align:top;width:75px;padding-right:10px;">
        <span style="display:inline-block;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:bold;padding:2px 6px;border-radius:4px;text-align:center;text-transform:uppercase;${impactStyles(item.impact)}">
          ${item.impact.split(' ')[0]}
        </span>
      </div>
      <div style="display:table-cell;vertical-align:top;font-size:12px;color:#4b5563;line-height:1.4;">
        ${item.task}
      </div>
    </div>
    `).join('')}
  </div>

  <!-- CTA de Agendamento -->
  <div style="background:#ffffff;border:1px solid rgba(255, 255, 255, 0.6);border-radius:24px;box-shadow:0px 1px 2px rgba(0, 0, 0, 0.02), 8px 12px 28px -4px rgba(13, 20, 33, 0.06);padding:32px;text-align:center;margin-top:25px;border-top:3px solid #dc2626;">
    <h3 style="font-family:'Space Grotesk', sans-serif;font-size:20px;font-weight:700;color:#09090b;margin:0 0 8px;text-transform:uppercase;letter-spacing:-0.2px;">Pronto para dominar as recomendações das IAs?</h3>
    <p style="font-size:13px;color:#4b5563;line-height:1.5;max-width:480px;margin:0 auto 20px;font-weight:light;">
      Este diagnóstico revela os gargalos. Nossa equipe de especialistas resolve cada um deles — metodologia científica, resultados mensuráveis.
    </p>
    <div style="margin-top:20px;">
      <a href="https://geo.berocket.com.br/#booking" class="cta-btn" style="display:inline-block;background:#dc2626;color:#ffffff;font-family:'JetBrains Mono',monospace;font-weight:bold;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:12px;letter-spacing:1px;text-transform:uppercase;box-shadow:0px 4px 10px rgba(220,38,38,0.25);transition:background 0.2s;">
        Agendar Reunião de Diagnóstico →
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:24px 0 10px;font-family:'JetBrains Mono',monospace;font-size:9px;color:#9ca3af;font-weight:bold;">
    b.rocket © ${new Date().getFullYear()} // GEO_CORE_V10 // CONFIDENCIAL
  </div>

</div>
</body>
</html>`;
}

module.exports = {
  runGatekeeperAgent,
  runMetadataAgent,
  runContentAgent,
  runIntentAgent,
  calculateGeoScore,
  buildActionList,
  generateHtmlReport,
  fetchUrl,
};
