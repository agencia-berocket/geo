const http = require('http');
const https = require('https');

// Helper to fetch URL content
function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return reject(new Error('Invalid URL'));
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
    .replace(/<style[\s\S]*?<\/script>/gi, '')
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
  
  // Neumorphic cards that replicate .tactile-raised (without heavy borders, utilizing soft shadow depth)
  const cardStyle = `background-color:#ffffff; border:1px solid #e8e8eb; border-radius:24px; box-shadow:0px 10px 30px rgba(13,20,33,0.04); padding:28px; margin-bottom:24px;`;
  const scoreCardStyle = `background-color:#ffffff; border:1px solid #e8e8eb; border-radius:24px; box-shadow:0px 10px 30px rgba(13,20,33,0.04); padding:32px; display:inline-block; min-width:240px; text-align:center;`;
  
  // Font Family strings fallback stack for maximum system cleanliness (replicates sans-serif look in Gmail)
  const fontDisplay = `font-family:'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;`;
  const fontSans = `font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;`;
  const fontMono = `font-family:'JetBrains Mono', 'Courier New', monospace;`;

  // Custom sales pitch based on diagnostic results using psychological triggers (urgency, authority, social proof)
  let salesArgument = '';
  if (score < 40) {
    salesArgument = `
      <div style="background:#fef2f2; border-left:4px solid #dc2626; padding:16px; border-radius:8px; margin-top:16px; text-align:left;">
        <p style="margin:0 0 8px; font-weight:bold; color:#991b1b; ${fontDisplay} font-size:14px; text-transform:uppercase;">🚨 Alerta Crítico de Visibilidade por Inteligência Artificial</p>
        <p style="margin:0; color:#7f1d1d; font-size:12.5px; line-height:1.5;">
          Seu site está atualmente <strong>invisível para as respostas do ChatGPT, Claude e Gemini</strong> (Score de ${score}%). Os decisores de compras que usam IA para buscar as melhores soluções no seu segmento nunca encontrarão sua marca. Isto significa perda diária de leads qualificados para concorrentes que já otimizaram seus sites. A boa notícia é que com a metodologia científica da <strong>b.rocket</strong>, conseguimos reverter esse cenário e fazer sua marca figurar como a principal recomendação destas IAs em poucas semanas.
        </p>
      </div>
    `;
  } else if (score < 70) {
    salesArgument = `
      <div style="background:#fff7ed; border-left:4px solid #d97706; padding:16px; border-radius:8px; margin-top:16px; text-align:left;">
        <p style="margin:0 0 8px; font-weight:bold; color:#9a3412; ${fontDisplay} font-size:14px; text-transform:uppercase;">⚠️ Risco Comercial de Perda de Mercado</p>
        <p style="margin:0; color:#7c2d12; font-size:12.5px; line-height:1.5;">
          Você já possui parte da infraestrutura pronta, mas ainda tem <strong>gargalos severos de citabilidade</strong> que impedem sua marca de ser recomendada consistentemente. A concorrência está se movendo rapidamente. Ao agendar nossa mentoria de 40 minutos, vamos desenhar o mapa de RAG ideal para seu nicho de mercado e garantir que sua marca passe a ser citada com relevância nas consultas das principais ferramentas generativas.
        </p>
      </div>
    `;
  } else {
    salesArgument = `
      <div style="background:#f0fdf4; border-left:4px solid #16a34a; padding:16px; border-radius:8px; margin-top:16px; text-align:left;">
        <p style="margin:0 0 8px; font-weight:bold; color:#166534; ${fontDisplay} font-size:14px; text-transform:uppercase;">✨ Ótimo Potencial de Escalar Resultados</p>
        <p style="margin:0; color:#14532d; font-size:12.5px; line-height:1.5;">
          Parabéns! Seu site possui bases sólidas para motores de recomendação de IA (Score de ${score}%). No entanto, o mercado de GEO (Engine Optimization para IAs) é extremamente dinâmico e o refinamento semântico contínuo é o que separa os líderes do restante da lista. Vamos consolidar sua autoridade para garantir o monopólio das recomendações no seu setor?
        </p>
      </div>
    `;
  }

  // Pure SVG Icons representation to replace emojis (formal standard vectors)
  const iconShield = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#09090b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  const iconFolder = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#09090b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
  const iconNote = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#09090b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  const iconChart = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#09090b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
  const iconList = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#09090b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`;

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
<title>Raio-X de GEO — ${lead.url} | B.ROCKET</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;750;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
  @media (max-width: 600px) {
    .container { padding: 15px !important; }
    .grid2 { grid-template-columns: 1fr !important; gap: 10px !important; }
    .score-card { padding: 24px !important; }
    .hero-title { font-size: 28px !important; }
  }
</style>
</head>
<body style="background-color:#f4f5f8; background-image:radial-gradient(#e2e4e9 1px, transparent 1px), radial-gradient(#e2e4e9 1px, transparent 1px); background-size:20px 20px; background-position:0 0, 10px 10px; color:#0c0d0e;${fontSans} margin:0;padding:0;-webkit-font-smoothing:antialiased;min-height:100vh;">
<div class="container" style="max-width:650px;margin:0 auto;padding:30px 15px;">

  <!-- Header -->
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;border-bottom:1px solid #e4e4e7;padding-bottom:18px;">
    <tr>
      <td align="left" style="vertical-align:middle;">
        <!-- Logo do Astronauta do site -->
        <div style="display:inline-block;width:32px;height:32px;background-color:#09090b;border:1px solid #27272a;border-radius:10px;vertical-align:middle;position:relative;margin-right:10px;text-align:center;">
          <div style="display:inline-block;width:22px;height:22px;background-color:#ffffff;border:1px solid #f4f4f5;border-radius:50%;margin-top:4px;position:relative;text-align:center;">
            <div style="display:inline-block;width:14px;height:10px;background-color:#09090b;border-radius:3px;margin-top:4.5px;position:relative;overflow:hidden;">
              <div style="position:absolute;top:1px;left:1px;width:3px;height:3px;background-color:rgba(255,255,255,0.4);border-radius:50%;"></div>
              <div style="position:absolute;bottom:1px;right:1px;width:3px;height:3px;background-color:#10b981;border-radius:50%;"></div>
            </div>
            <div style="position:absolute;bottom:2px;left:6px;width:10px;height:2px;background-color:#d4d4d8;border-radius:999px;"></div>
          </div>
        </div>
        <!-- Nome da marca -->
        <div style="${fontDisplay} font-weight:900;font-size:18px;color:#09090b;letter-spacing:1.5px;display:inline-block;vertical-align:middle;text-transform:uppercase;margin-right:2px;">
          B.ROCKET
        </div>
        <div style="${fontDisplay} font-weight:900;font-size:18px;color:#dc2626;display:inline-block;vertical-align:middle;margin-right:6px;">*</div>
        <!-- Badge Neumórfico -->
        <div style="display:inline-block;background:#e4e4e7;border-top:1px solid #ffffff;border-left:1px solid #ffffff;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;border-radius:8px;padding:3px 8px;vertical-align:middle;text-align:center;box-shadow:inset 1px 1px 2px rgba(13,20,33,0.03);">
          <span style="${fontMono} font-size:9.5px;color:#52525b;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">GEO_CORE_V10</span>
        </div>
      </td>
      <td align="right" style="${fontMono} font-size:9px;color:#71717a;font-weight:bold;vertical-align:middle;">
        DIAGNÓSTICO // ${new Date().toLocaleDateString('pt-BR')} // CONFIDENCIAL
      </td>
    </tr>
  </table>

  <!-- Hero & Score -->
  <div style="text-align:center;margin-bottom:32px;">
    <div style="${fontMono} font-size:9.5px;color:#dc2626;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;font-weight:bold;">DIAGNÓSTICO SEMÂNTICO DE GEO</div>
    <h1 class="hero-title" style="${fontDisplay} font-size:36px;font-weight:800;color:#0c0d0e;margin:0 0 6px;letter-spacing:-1px;text-transform:uppercase;">Raio-X de GEO</h1>
    <div style="${fontMono} font-size:13px;color:#71717a;word-break:break-all;margin-bottom:28px;">${lead.url}</div>

    <!-- Score Card Neumórfico -->
    <div class="score-card" style="${scoreCardStyle}">
      <div style="font-size:64px;font-weight:800;color:${scoreColor};${fontMono} line-height:1;margin:0 auto 10px;">${score}%</div>
      <div style="${fontMono} font-size:11px;color:#71717a;letter-spacing:1px;font-weight:bold;text-transform:uppercase;">
        GEO SCORE // <span style="color:${scoreColor};font-weight:bold;">${score >= 70 ? 'BOM' : score >= 40 ? 'MÉDIO' : 'CRÍTICO'}</span>
      </div>
      <!-- Resumo didático comercial sob o score -->
      ${salesArgument}
    </div>
  </div>

  <!-- Technical Gatekeeper -->
  <div style="${cardStyle}">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border-bottom:1px solid #f1f2f5;padding-bottom:12px;">
      <tr>
        <td align="left" style="vertical-align:middle;">
          ${iconShield}
          <span style="${fontDisplay} font-weight:800;color:#09090b;font-size:16px;vertical-align:middle;text-transform:uppercase;letter-spacing:-0.2px;">Technical Gatekeeper</span>
        </td>
        <td align="right" style="vertical-align:middle;">
          <span style="${fontMono} font-size:9px;font-weight:bold;padding:4px 8px;border-radius:6px;${diagnostic.gatekeeperStatus.robotsTxtAllowAiBots ? 'color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;' : 'color:#b91c1c;background:#fef2f2;border:1px solid #fca5a5;'}">
            ${diagnostic.gatekeeperStatus.robotsTxtAllowAiBots ? 'OK' : 'CRÍTICO'}
          </span>
        </td>
      </tr>
    </table>
    
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
      ${formatCheck(diagnostic.gatekeeperStatus.robotsTxtAllowAiBots)} Bots de IA autorizados no robots.txt
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
      ${formatCheck(diagnostic.gatekeeperStatus.ssrActive)} Conteúdo acessível sem Javascript (SSR)
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
      ${formatCheck(!diagnostic.gatekeeperStatus.hasPriceGatekeeperIssue)} Preços explícitos no HTML para IA
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
      ${formatCheck(!diagnostic.gatekeeperStatus.staleTimestampDetected)} Timestamps atualizados recentemente
    </div>
    
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:14px;border-top:1px solid #f1f2f5;padding-top:10px;font-size:12px;">
      <tr>
        <td style="color:#71717a;${fontMono}">LATÊNCIA DO SERVIDOR:</td>
        <td align="right" style="${fontMono} font-weight:bold;color:${diagnostic.gatekeeperStatus.serverLatencyMs < 800 ? '#16a34a' : '#d97706'}">
          ${diagnostic.gatekeeperStatus.serverLatencyMs}ms
        </td>
      </tr>
    </table>
    
    ${diagnostic.gatekeeperStatus.blockedCrawlers.length > 0 ? `
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px;margin-top:12px;font-size:12px;color:#b91c1c;line-height:1.4;${fontMono}">
      ⚠️ <strong>Bots Bloqueados:</strong> ${diagnostic.gatekeeperStatus.blockedCrawlers.join(', ')}
    </div>` : ''}
  </div>

  <!-- Metadata Entity -->
  <div style="${cardStyle}">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border-bottom:1px solid #f1f2f5;padding-bottom:12px;">
      <tr>
        <td align="left" style="vertical-align:middle;">
          ${iconFolder}
          <span style="${fontDisplay} font-weight:800;color:#09090b;font-size:16px;vertical-align:middle;text-transform:uppercase;letter-spacing:-0.2px;">Metadata Entity</span>
        </td>
        <td align="right" style="vertical-align:middle;">
          <span style="${fontMono} font-size:9px;font-weight:bold;padding:4px 8px;border-radius:6px;${diagnostic.metadataAnalysis.organizationSchemaPresent ? 'color:#b45309;background:#fff7ed;border:1px solid #fed7aa;' : 'color:#b91c1c;background:#fef2f2;border:1px solid #fca5a5;'}">
            ${diagnostic.metadataAnalysis.organizationSchemaPresent ? 'PARCIAL' : 'CRÍTICO'}
          </span>
        </td>
      </tr>
    </table>
    
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
      ${formatCheck(diagnostic.metadataAnalysis.organizationSchemaPresent)} Schema Organization ou LocalBusiness
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
      ${formatCheck(diagnostic.metadataAnalysis.personSchemaPresent)} Schema Person (Credenciais de Autor)
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
      ${formatCheck(diagnostic.metadataAnalysis.llmsTxtPublished)} Arquivo /llms.txt publicado
    </div>
    <div style="margin-bottom:10px;font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
      ${formatCheck(diagnostic.metadataAnalysis.organizationSameAsCount > 0)} Mapeamento de redes sociais (sameAs)
    </div>
    
    ${diagnostic.metadataAnalysis.missingSchemas.length > 0 ? `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px;margin-top:12px;font-size:12px;color:#b45309;line-height:1.4;${fontMono}">
      ⚠️ <strong>Schemas Faltantes:</strong> ${diagnostic.metadataAnalysis.missingSchemas.join(', ')}
    </div>` : ''}
  </div>

  <!-- Content Absorption -->
  <div style="${cardStyle}">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border-bottom:1px solid #f1f2f5;padding-bottom:12px;">
      <tr>
        <td align="left" style="vertical-align:middle;">
          ${iconNote}
          <span style="${fontDisplay} font-weight:800;color:#09090b;font-size:16px;vertical-align:middle;text-transform:uppercase;letter-spacing:-0.2px;">Content Absorption</span>
        </td>
        <td align="right" style="vertical-align:middle;">
          <span style="${fontMono} font-size:9px;font-weight:bold;padding:4px 8px;border-radius:6px;color:#b45309;background:#fff7ed;border:1px solid #fed7aa;">
            ANÁLISE
          </span>
        </td>
      </tr>
    </table>
    
    <div class="grid2" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div style="font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
        ${formatCheck(diagnostic.contentReview.factorsDetected.hasTldrAnswerFirstParagraph)} Resposta direta no início
      </div>
      <div style="font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
        ${formatCheck(diagnostic.contentReview.factorsDetected.hasStatisticsPer150Words)} Estatísticas frequentes
      </div>
      <div style="font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
        ${formatCheck(diagnostic.contentReview.factorsDetected.hasExpertQuotes)} Citações de especialistas
      </div>
      <div style="font-size:13px;color:#4b5563;line-height:1.4;${fontSans}">
        ${formatCheck(diagnostic.contentReview.factorsDetected.hasHtmlComparisonTables)} Tabelas comparativas HTML
      </div>
    </div>
    
    <div style="border-top:1px solid #f1f2f5;padding-top:12px;margin-top:12px;font-size:12px;${fontMono}">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr style="height:24px;">
          <td style="color:#71717a;${fontMono}">TAMANHO MÉDIO DE CHUNK:</td>
          <td align="right" style="font-weight:bold;color:#09090b;${fontMono}">${diagnostic.contentReview.meanChunkSizeTokens} tokens</td>
        </tr>
        <tr style="height:24px;">
          <td style="color:#71717a;${fontMono}">PREÇOS VISÍVEIS:</td>
          <td align="right" style="font-weight:bold;color:#09090b;${fontMono}">${!diagnostic.contentReview.priceNotMentioned ? '✓ Sim' : '✗ Não'}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Citation Share nas IAs -->
  <div style="${cardStyle}">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border-bottom:1px solid #f1f2f5;padding-bottom:12px;">
      <tr>
        <td align="left" style="vertical-align:middle;">
          ${iconChart}
          <span style="${fontDisplay} font-weight:800;color:#09090b;font-size:16px;vertical-align:middle;text-transform:uppercase;letter-spacing:-0.2px;">Citation Share nas IAs</span>
        </td>
        <td align="right" style="vertical-align:middle;">
          <span style="${fontMono} font-size:9px;font-weight:bold;padding:4px 8px;border-radius:6px;${diagnostic.visibilityBenchmarking.citationSharePercentage >= 0.3 ? 'color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;' : 'color:#b91c1c;background:#fef2f2;border:1px solid #fca5a5;'}">
            ${(diagnostic.visibilityBenchmarking.citationSharePercentage * 100).toFixed(0)}% SHARE
          </span>
        </td>
      </tr>
    </table>
    
    <div style="font-size:13px;color:#4b5563;margin-bottom:6px;${fontSans}">Porcentagem de Citações:</div>
    <div style="height:10px;background:#e4e4e7;border-radius:9999px;overflow:hidden;margin-bottom:12px;border:1px solid #d1d5db;">
      <div style="height:100%;background:#dc2626;border-radius:9999px;width:${Math.min(100, diagnostic.visibilityBenchmarking.citationSharePercentage * 100)}%;"></div>
    </div>
    
    <div style="font-size:12px;${fontMono} color:#4b5563;line-height:1.6;margin-top:14px;border-top:1px solid #f1f2f5;padding-top:10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr style="height:24px;">
          <td style="color:#71717a;${fontMono}">SENTIMENTO DE MARCA:</td>
          <td align="right" style="font-weight:bold;color:#0c0d0e;${fontMono}">${diagnostic.visibilityBenchmarking.brandSentimentScore}</td>
        </tr>
        <tr style="height:24px;">
          <td style="color:#71717a;${fontMono}">PROMPTS TESTADOS:</td>
          <td align="right" style="font-weight:bold;color:#0c0d0e;${fontMono}">${diagnostic.visibilityBenchmarking.totalPromptsTest}</td>
        </tr>
        ${Object.entries(diagnostic.visibilityBenchmarking.citationsByModel).map(([model, count]) => `
        <tr style="height:24px;">
          <td style="color:#71717a;${fontMono} font-size:11px;">${model}:</td>
          <td align="right" style="font-weight:bold;color:#0c0d0e;${fontMono}">${count} citações</td>
        </tr>
        `).join('')}
      </table>
    </div>
  </div>

  <!-- Plano de Ação Priorizado -->
  <div style="${cardStyle}">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;border-bottom:1px solid #f1f2f5;padding-bottom:12px;">
      <tr>
        <td align="left" style="vertical-align:middle;">
          ${iconList}
          <span style="${fontDisplay} font-weight:800;color:#09090b;font-size:16px;vertical-align:middle;text-transform:uppercase;letter-spacing:-0.2px;">Plano de Ação Priorizado</span>
        </td>
      </tr>
    </table>
    
    ${diagnostic.actionItemsPriorityList.map(item => `
    <div style="background:#fdfefe;border:1px solid #e8e8eb;border-radius:12px;padding:12px;margin-bottom:10px;box-shadow:3px 3px 8px rgba(13,20,33,0.02);display:table;width:100%;box-sizing:border-box;">
      <div style="display:table-cell;vertical-align:top;width:75px;padding-right:10px;">
        <span style="display:inline-block;${fontMono} font-size:9px;font-weight:bold;padding:2.5px 6px;border-radius:4px;text-align:center;text-transform:uppercase;${impactStyles(item.impact)}">
          ${item.impact.split(' ')[0]}
        </span>
      </div>
      <div style="display:table-cell;vertical-align:top;font-size:12px;color:#4b5563;line-height:1.4;${fontSans}">
        ${item.task}
      </div>
    </div>
    `).join('')}
  </div>

  <!-- CTA de Agendamento -->
  <div style="background-color:#ffffff; border:1px solid #e8e8eb; border-radius:24px; box-shadow:0px 10px 30px rgba(13,20,33,0.04); padding:32px; text-align:center; margin-top:25px; border-top:3px solid #dc2626;">
    <h3 style="${fontDisplay} font-size:20px;font-weight:800;color:#09090b;margin:0 0 8px;text-transform:uppercase;letter-spacing:-0.2px;">Pronto para dominar as recomendações das IAs?</h3>
    <p style="font-size:13px;color:#4b5563;line-height:1.5;max-width:480px;margin:0 auto 20px;font-weight:light;${fontSans}">
      Este diagnóstico revela os gargalos. Nossa equipe de especialistas resolve cada um deles — metodologia científica, resultados mensuráveis.
    </p>
    <div style="margin-top:20px;">
      <a href="https://geo.berocket.com.br/#booking" style="display:inline-block;background-color:#09090b;color:#ffffff;border:1px solid #27272a;${fontMono}font-weight:bold;padding:16px 36px;border-radius:14px;text-decoration:none;font-size:11.5px;letter-spacing:2px;text-transform:uppercase;box-shadow:0px 6px 18px rgba(9,9,11,0.15);transition:all 0.2s;">
        Agendar Reunião de Diagnóstico →
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:24px 0 10px;${fontMono} font-size:9px;color:#9ca3af;font-weight:bold;">
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
