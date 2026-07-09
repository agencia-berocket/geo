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
    'google/gemini-1.5-flash',
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
  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 70 ? 'Bom' : score >= 40 ? 'Médio' : 'Crítico';
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - score / 100);

  const formatCheck = (ok) => ok
    ? `<span style="color:#22c55e">✅</span>`
    : `<span style="color:#ef4444">❌</span>`;

  const impactColor = (impact) => {
    if (impact.includes('Crítico')) return '#ef4444';
    if (impact.includes('Alto')) return '#f59e0b';
    return '#3b82f6';
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Raio-X de GEO — ${lead.url} | b.rocket</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#09090b;color:#e4e4e7;font-family:'Inter',sans-serif;min-height:100vh}
  .container{max-width:860px;margin:0 auto;padding:40px 20px}
  .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:40px;padding-bottom:24px;border-bottom:1px solid #27272a}
  .brand{display:flex;align-items:center;gap:10px}
  .brand-icon{width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#7c3aed);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff}
  .brand-name{font-weight:700;font-size:18px;color:#fff}
  .brand-tag{font-size:10px;color:#52525b;font-family:'JetBrains Mono',monospace;background:#1c1c1f;border:1px solid #3f3f46;padding:2px 6px;border-radius:4px;margin-left:4px}
  .sys-info{font-family:'JetBrains Mono',monospace;font-size:10px;color:#3f3f46}
  .hero{text-align:center;padding:48px 0 32px}
  .hero-tag{font-family:'JetBrains Mono',monospace;font-size:11px;color:#3b82f6;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
  .hero-title{font-size:28px;font-weight:800;color:#fff;margin-bottom:8px;letter-spacing:-0.5px}
  .hero-url{font-size:14px;color:#71717a;font-family:'JetBrains Mono',monospace;margin-bottom:32px}
  .score-card{background:#111113;border:1px solid #27272a;border-radius:20px;padding:32px;display:inline-block;margin-bottom:48px}
  .score-label{font-size:11px;color:#52525b;font-family:'JetBrains Mono',monospace;letter-spacing:1px;text-align:center;margin-top:12px}
  .section{background:#111113;border:1px solid #27272a;border-radius:16px;padding:24px;margin-bottom:20px}
  .section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #1c1c1f}
  .section-icon{font-size:20px}
  .section-title{font-weight:700;color:#fff;font-size:15px}
  .section-status{margin-left:auto;font-size:10px;font-family:'JetBrains Mono',monospace;padding:3px 8px;border-radius:9999px;border:1px solid}
  .status-ok{color:#22c55e;border-color:#166534;background:#052e16}
  .status-warn{color:#f59e0b;border-color:#92400e;background:#1c0a00}
  .status-crit{color:#ef4444;border-color:#991b1b;background:#1c0000}
  .check-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1c1c1f;font-size:13px;color:#a1a1aa}
  .check-row:last-child{border-bottom:none}
  .metric{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1c1c1f;font-size:13px;color:#a1a1aa}
  .metric:last-child{border-bottom:none}
  .metric-val{font-weight:600;color:#e4e4e7}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .action-item{background:#1c1c1f;border-radius:10px;padding:14px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start}
  .impact-tag{font-size:10px;font-family:'JetBrains Mono',monospace;padding:3px 8px;border-radius:9999px;font-weight:600;white-space:nowrap;flex-shrink:0;color:#fff}
  .action-text{font-size:12px;color:#a1a1aa;line-height:1.5}
  .citation-bar{height:6px;background:#1c1c1f;border-radius:9999px;overflow:hidden;margin-top:6px}
  .citation-fill{height:100%;background:linear-gradient(90deg,#3b82f6,#7c3aed);border-radius:9999px;transition:width 0.5s}
  .cta{background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:16px;padding:32px;text-align:center;margin-top:40px}
  .cta-title{font-size:20px;font-weight:800;color:#fff;margin-bottom:8px}
  .cta-sub{font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:24px}
  .cta-btn{display:inline-block;background:#fff;color:#1d4ed8;font-weight:700;padding:12px 28px;border-radius:9999px;text-decoration:none;font-size:14px}
  .footer{text-align:center;padding:32px 0;font-family:'JetBrains Mono',monospace;font-size:10px;color:#3f3f46}
  @media(max-width:600px){.grid2{grid-template-columns:1fr}.header{flex-direction:column;gap:12px}}
</style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon">b.</div>
      <span class="brand-name">rocket</span>
      <span class="brand-tag">GEO_CORE_V10</span>
    </div>
    <div class="sys-info">RAIO-X DE GEO // ${new Date().toLocaleDateString('pt-BR')} // CONFIDENCIAL</div>
  </div>

  <!-- Hero -->
  <div class="hero">
    <div class="hero-tag">DIAGNÓSTICO COMPLETO GEO</div>
    <h1 class="hero-title">Raio-X de GEO</h1>
    <div class="hero-url">${lead.url}</div>

    <!-- Score gauge -->
    <div class="score-card">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <circle cx="70" cy="70" r="54" fill="none" stroke="#27272a" stroke-width="10"
          stroke-dasharray="${circumference / 2} ${circumference / 2}" stroke-linecap="round"
          transform="rotate(-180 70 70)"/>
        <circle cx="70" cy="70" r="54" fill="none" stroke="${scoreColor}" stroke-width="10"
          stroke-dasharray="${(circumference / 2) * (score / 100)} ${circumference}" stroke-linecap="round"
          transform="rotate(-180 70 70)"/>
        <text x="70" y="72" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800"
          font-size="28" fill="${scoreColor}">${score}</text>
      </svg>
      <div class="score-label">GEO SCORE // ${scoreLabel.toUpperCase()}</div>
    </div>
  </div>

  <!-- Agente 2: Gatekeeper -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">🛡️</span>
      <span class="section-title">Technical Gatekeeper</span>
      <span class="section-status ${diagnostic.gatekeeperStatus.robotsTxtAllowAiBots ? 'status-ok' : 'status-crit'}">
        ${diagnostic.gatekeeperStatus.robotsTxtAllowAiBots ? 'OK' : 'CRÍTICO'}
      </span>
    </div>
    <div class="check-row">${formatCheck(diagnostic.gatekeeperStatus.robotsTxtAllowAiBots)} Bots de IA liberados no robots.txt</div>
    <div class="check-row">${formatCheck(diagnostic.gatekeeperStatus.ssrActive)} Conteúdo acessível sem JavaScript (SSR)</div>
    <div class="check-row">${formatCheck(!diagnostic.gatekeeperStatus.hasPriceGatekeeperIssue)} Preços explícitos para tomada de decisão</div>
    <div class="check-row">${formatCheck(!diagnostic.gatekeeperStatus.staleTimestampDetected)} Timestamps recentes (conteúdo atualizado)</div>
    <div class="metric">
      <span>Latência do servidor</span>
      <span class="metric-val" style="color:${diagnostic.gatekeeperStatus.serverLatencyMs < 800 ? '#22c55e' : '#f59e0b'}">${diagnostic.gatekeeperStatus.serverLatencyMs}ms</span>
    </div>
    ${diagnostic.gatekeeperStatus.blockedCrawlers.length > 0 ? `
    <div style="background:#1c0000;border:1px solid #991b1b;border-radius:8px;padding:10px;margin-top:12px;font-size:12px;color:#fca5a5">
      ⚠️ Bots bloqueados: ${diagnostic.gatekeeperStatus.blockedCrawlers.join(', ')}
    </div>` : ''}
  </div>

  <!-- Agente 3: Metadata -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">🗂️</span>
      <span class="section-title">Metadata Entity</span>
      <span class="section-status ${diagnostic.metadataAnalysis.organizationSchemaPresent ? 'status-warn' : 'status-crit'}">
        ${diagnostic.metadataAnalysis.organizationSchemaPresent ? 'PARCIAL' : 'CRÍTICO'}
      </span>
    </div>
    <div class="check-row">${formatCheck(diagnostic.metadataAnalysis.organizationSchemaPresent)} Schema Organization (JSON-LD)</div>
    <div class="check-row">${formatCheck(diagnostic.metadataAnalysis.personSchemaPresent)} Schema Person (autor com credenciais)</div>
    <div class="check-row">${formatCheck(diagnostic.metadataAnalysis.llmsTxtPublished)} Arquivo /llms.txt publicado</div>
    <div class="check-row">${formatCheck(diagnostic.metadataAnalysis.organizationSameAsCount > 0)} Links sameAs (Wikidata, LinkedIn, etc.)</div>
    ${diagnostic.metadataAnalysis.missingSchemas.length > 0 ? `
    <div style="margin-top:12px;font-size:12px;color:#f59e0b">
      Schemas ausentes: ${diagnostic.metadataAnalysis.missingSchemas.join(', ')}
    </div>` : ''}
  </div>

  <!-- Agente 4: Content -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">📝</span>
      <span class="section-title">Content Absorption</span>
      <span class="section-status status-warn">ANÁLISE</span>
    </div>
    <div class="grid2">
      <div>
        <div class="check-row">${formatCheck(diagnostic.contentReview.factorsDetected.hasTldrAnswerFirstParagraph)} Resposta direta nos primeiros 60 tokens</div>
        <div class="check-row">${formatCheck(diagnostic.contentReview.factorsDetected.hasStatisticsPer150Words)} Dados numéricos a cada 150 palavras</div>
      </div>
      <div>
        <div class="check-row">${formatCheck(diagnostic.contentReview.factorsDetected.hasExpertQuotes)} Aspas de especialistas citadas</div>
        <div class="check-row">${formatCheck(diagnostic.contentReview.factorsDetected.hasHtmlComparisonTables)} Tabelas comparativas HTML</div>
      </div>
    </div>
    <div class="metric"><span>Tamanho médio de chunk</span><span class="metric-val">${diagnostic.contentReview.meanChunkSizeTokens} tokens</span></div>
    <div class="metric"><span>Preços visíveis</span><span class="metric-val">${!diagnostic.contentReview.priceNotMentioned ? '✅ Sim' : '❌ Não'}</span></div>
  </div>

  <!-- Agente 5: Intent -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">🔍</span>
      <span class="section-title">Citation Share nas IAs</span>
      <span class="section-status ${diagnostic.visibilityBenchmarking.citationSharePercentage >= 0.3 ? 'status-ok' : 'status-crit'}">
        ${(diagnostic.visibilityBenchmarking.citationSharePercentage * 100).toFixed(0)}% SHARE
      </span>
    </div>
    <div class="metric">
      <span>Citation Share</span>
      <span class="metric-val" style="color:${diagnostic.visibilityBenchmarking.citationSharePercentage >= 0.3 ? '#22c55e' : '#ef4444'}">
        ${(diagnostic.visibilityBenchmarking.citationSharePercentage * 100).toFixed(1)}%
      </span>
    </div>
    <div class="citation-bar"><div class="citation-fill" style="width:${Math.min(100, diagnostic.visibilityBenchmarking.citationSharePercentage * 100)}%"></div></div>
    <div class="metric" style="margin-top:12px"><span>Sentimento de Marca</span><span class="metric-val">${diagnostic.visibilityBenchmarking.brandSentimentScore}</span></div>
    <div class="metric"><span>Prompts testados</span><span class="metric-val">${diagnostic.visibilityBenchmarking.totalPromptsTest}</span></div>
    ${Object.entries(diagnostic.visibilityBenchmarking.citationsByModel).map(([model, count]) => `
    <div class="metric"><span style="font-family:JetBrains Mono,monospace;font-size:11px">${model}</span><span class="metric-val">${count} citações</span></div>
    `).join('')}
  </div>

  <!-- Plano de Ação -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">📋</span>
      <span class="section-title">Plano de Ação Priorizado</span>
    </div>
    ${diagnostic.actionItemsPriorityList.map(item => `
    <div class="action-item">
      <span class="impact-tag" style="background:${impactColor(item.impact)}20;color:${impactColor(item.impact)};border:1px solid ${impactColor(item.impact)}40">
        ${item.impact.split(' ')[0]}
      </span>
      <div class="action-text">${item.task}</div>
    </div>
    `).join('')}
  </div>

  <!-- CTA -->
  <div class="cta">
    <div class="cta-title">Pronto para dominar as recomendações das IAs?</div>
    <div class="cta-sub">Este diagnóstico revela os gargalos. Nossa equipe de especialistas resolve cada um deles — metodologia de Princeton, resultados mensuráveis.</div>
    <a href="https://geo.berocket.com.br#pricing" class="cta-btn">Falar com Guilherme →</a>
  </div>

  <div class="footer">
    b.rocket © ${new Date().getFullYear()} // GEO_CORE_V10 // RELATÓRIO GERADO EM ${new Date().toISOString()} // CONFIDENCIAL
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
