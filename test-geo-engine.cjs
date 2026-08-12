// ─── Guard-rail de regressão contra alucinação nos agentes GEO ──────────────
// Roda: node test-geo-engine.cjs (ou npm run test:geo)
// Sem framework de teste — script standalone para não adicionar dependência nova.
//
// IMPORTANTE: alguns testes abaixo são escritos para o comportamento CORRETO
// (pós-correção). Se você está rodando isto antes de aplicar as correções do
// plano de eliminação de alucinação, é esperado que vários testes falhem —
// esse é o ponto do guard-rail: provar que o teste testa a coisa certa.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ENGINE_PATH = path.join(__dirname, 'geo-diagnostic-engine.cjs');
const engine = require('./geo-diagnostic-engine.cjs');

// Strings/números fabricados que NUNCA devem aparecer numa saída de agente
// quando não estiverem explicitamente marcados como dataSource: 'unavailable'.
const KNOWN_FABRICATION_STRING_SMELLS = [
  'Líder em Serviços',
  'Tecnologia de Ponta',
  'Referência Nacional',
  'Concorrente A',
  'Concorrente B',
  'Concorrente Direto do Setor',
  'Relatório de Inteligência de Mercado GEO, b.rocket Core',
  'uptime 99.9%',
];

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// ─── FASE 2: duplicação de funções ───────────────────────────────────────────
test('testNoDuplicateFunctionDefinitions', () => {
  const src = fs.readFileSync(ENGINE_PATH, 'utf8');
  const names = (src.match(/^(?:async )?function (\w+)/gm) || [])
    .map(s => s.replace(/^(?:async )?function /, ''));
  const counts = {};
  names.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
  const duplicated = Object.entries(counts).filter(([, c]) => c > 1).map(([n]) => n);
  assert.deepEqual(duplicated, [], `Funções duplicadas encontradas: ${duplicated.join(', ')}`);
});

// ─── FASE 5: Off-Page não deve ter score constante ──────────────────────────
test('testOffpageScoreIsNotConstant', async () => {
  const htmlEmpty = '<html><body></body></html>';
  const htmlLoremIpsum = `<html><body>${'lorem ipsum dolor sit amet '.repeat(200)}</body></html>`;
  const r1 = await engine.runOffPageEntityAgent('https://exemplo-a.com.br', htmlEmpty, '');
  const r2 = await engine.runOffPageEntityAgent('https://exemplo-b.com.br', htmlLoremIpsum, '');
  assert.notEqual(r1.externalEntityScore, 35, 'externalEntityScore não deve usar o antigo "base score" fixo de 35');
  assert.ok('dataSource' in r1, 'runOffPageEntityAgent deve retornar dataSource');
  assert.ok(!('coOccurrenceKeywords' in r1), 'coOccurrenceKeywords hardcoded deve ter sido removido');
});

// ─── FASE 4: Semantic Explorer honesto sem API key ──────────────────────────
test('testSemanticExplorerHonestWithoutApiKey', async () => {
  const html = '<html><body><h1>Bem-vindo</h1><p>Conteúdo de teste sem gaps declarados.</p></body></html>';
  const r = await engine.runSemanticExplorerAgent('https://exemplo.com.br', html, '');
  assert.equal(r.dataSource, 'unavailable', 'Sem apiKey, Semantic Explorer deve marcar dataSource unavailable');
  assert.deepEqual(r.contentGaps, [], 'Sem apiKey, não deve fabricar contentGaps via regex disfarçado de LLM');
});

// ─── FASE 3: Intent Agent nunca deve vazar número fabricado como real ───────
test('testIntentAgentNeverLeaksFabricatedNumber', async () => {
  const html = '<html><head><title>Empresa Teste</title></head><body><h1>Teste</h1></body></html>';
  const r = await engine.runIntentAgent('https://exemplo.com.br', html, '');
  assert.equal(r.dataSource, 'unavailable', 'Sem apiKey, Intent Agent deve marcar dataSource unavailable');
  assert.ok(
    r.citationSharePercentage === null || r.citationSharePercentage === undefined,
    'Sem apiKey, citationSharePercentage não deve ser um número fabricado (ex: 0.05)'
  );
});

// ─── FASE 1: relatório real deve propagar aviso de indisponibilidade ────────
test('testHtmlReportRendersUnavailableBadge', () => {
  const lead = { url: 'https://exemplo.com.br', company: 'Exemplo' };
  const diagnostic = {
    overallGeoScore: 50,
    gatekeeperStatus: { robotsTxtAllowAiBots: true, ssrActive: true, hasPriceGatekeeperIssue: false, staleTimestampDetected: false, serverLatencyMs: 100, blockedCrawlers: [], dataSource: 'deterministic' },
    metadataAnalysis: { organizationSchemaPresent: true, personSchemaPresent: false, llmsTxtPublished: false, organizationSameAsCount: 0, missingSchemas: [], dataSource: 'deterministic' },
    contentReview: { factorsDetected: { hasTldrAnswerFirstParagraph: true, hasStatisticsPer150Words: false, hasExpertQuotes: false, hasHtmlComparisonTables: false }, meanChunkSizeTokens: 150, priceNotMentioned: true },
    visibilityBenchmarking: { dataSource: 'unavailable', unavailableReason: 'missing_api_key', citationSharePercentage: null, brandSentimentScore: 'Neutro', totalPromptsTest: 0, citationsByModel: {} },
    semanticAnalysis: { dataSource: 'unavailable', topicCoverageScore: null, contentGapsCount: 0, contentGaps: [] },
    offpageAnalysis: { dataSource: 'unavailable', externalEntityScore: null, externalFootprint: {} },
    actionItemsPriorityList: [],
  };
  const html = engine.generateHtmlReport(lead, diagnostic);
  assert.ok(
    /INDISPON[ÍI]VEL/i.test(html) || /N\/D/.test(html),
    'generateHtmlReport deve exibir aviso de indisponibilidade quando um agente está unavailable'
  );
});

// ─── TESTE DE SEPARAÇÃO CLIENTE VS AUDITORIA INTERNA ───────────────────────
test('testHtmlReportClientVsInternal', () => {
  const lead = { url: 'https://exemplo.com.br', company: 'Exemplo Corp' };
  const diagnostic = {
    overallGeoScore: 65,
    gatekeeperStatus: { robotsTxtAllowAiBots: true, ssrActive: true, hasPriceGatekeeperIssue: false, serverLatencyMs: 120, blockedCrawlers: [], dataSource: 'deterministic' },
    metadataAnalysis: { organizationSchemaPresent: true, personSchemaPresent: false, llmsTxtPublished: true, organizationSameAsCount: 3, missingSchemas: [], dataSource: 'deterministic' },
    contentReview: { factorsDetected: { hasTldrAnswerFirstParagraph: true, hasStatisticsPer150Words: true, hasExpertQuotes: false, hasHtmlComparisonTables: true }, meanChunkSizeTokens: 140, priceNotMentioned: false },
    visibilityBenchmarking: { dataSource: 'heuristic', citationSharePercentage: 0.45, brandSentimentScore: 'Positivo', totalPromptsTest: 10, citationsByModel: { ChatGPT: 4, Gemini: 3 } },
    checklist: {
      quickWinsCount: 2,
      interactiveChecklist: [{ title: 'Adicionar Schema Person', category: 'SEO', impactLevel: 'Alto', effortLevel: 'Baixo', description: 'Teste de checklist', cmsInstruction: 'Cole no head' }],
      postImplementationQaChecklist: ['Validar com Google Rich Results']
    },
    actionItemsPriorityList: [{ impact: 'Crítico', task: 'Atualizar robots.txt para liberação de AI bots' }]
  };

  // Versão Comercial do Cliente (isInternal: false)
  const clientHtml = engine.generateHtmlReport(lead, diagnostic, { isInternal: false });
  assert.ok(!clientHtml.includes('Checklist Interativo b.rocket'), 'Relatório do Cliente NÃO deve conter Checklist Interativo');
  assert.ok(!clientHtml.includes('Plano de Ação Priorizado'), 'Relatório do Cliente NÃO deve conter Plano de Ação Priorizado');
  assert.ok(clientHtml.includes('Por que Fechar Contrato de Implantação com a b.rocket?'), 'Relatório do Cliente DEVE conter a nova Copy de Fechamento');

  // Versão de Auditoria Interna (isInternal: true)
  const internalHtml = engine.generateHtmlReport(lead, diagnostic, { isInternal: true });
  assert.ok(internalHtml.includes('Checklist Interativo b.rocket'), 'Relatório de Auditoria DEVE conter Checklist Interativo');
  assert.ok(internalHtml.includes('Plano de Ação Priorizado'), 'Relatório de Auditoria DEVE conter Plano de Ação Priorizado');
  assert.ok(internalHtml.includes('Por que Fechar Contrato de Implantação com a b.rocket?'), 'Relatório de Auditoria DEVE conter a Copy de Fechamento');
});

// ─── TESTE DE MENSAGEM DO USUÁRIO INCORPORADA NO E-MAIL ────────────────────
test('testHtmlReportIncorporatesUserMessage', () => {
  const lead = { url: 'https://exemplo.com.br', company: 'Exemplo Corp' };
  const diagnostic = {
    overallGeoScore: 50,
    gatekeeperStatus: { robotsTxtAllowAiBots: true, ssrActive: true, hasPriceGatekeeperIssue: false, serverLatencyMs: 120, blockedCrawlers: [], dataSource: 'deterministic' },
    metadataAnalysis: { organizationSchemaPresent: true, personSchemaPresent: false, llmsTxtPublished: true, organizationSameAsCount: 3, missingSchemas: [], dataSource: 'deterministic' },
    contentReview: { factorsDetected: { hasTldrAnswerFirstParagraph: true, hasStatisticsPer150Words: true, hasExpertQuotes: false, hasHtmlComparisonTables: true }, meanChunkSizeTokens: 140, priceNotMentioned: false },
    visibilityBenchmarking: { dataSource: 'heuristic', citationSharePercentage: 0.45, brandSentimentScore: 'Positivo', totalPromptsTest: 10, citationsByModel: { ChatGPT: 4, Gemini: 3 } },
    actionItemsPriorityList: []
  };

  const userMessage = 'Olá João, tudo bem?\n\nSeguem os dados estratégicos do seu domínio.';
  const htmlWithMessage = engine.generateHtmlReport(lead, diagnostic, { userMessage });

  assert.ok(htmlWithMessage.includes('MENSAGEM DE PROPOSTA &amp; ABORDAGEM') || htmlWithMessage.includes('MENSAGEM DE PROPOSTA & ABORDAGEM'), 'Relatório DEVE conter o bloco da mensagem');
  assert.ok(htmlWithMessage.includes('Olá João, tudo bem?'), 'Relatório DEVE incluir a mensagem do usuário formatada');
});

// ─── FASE 6: template AEO não deve ter citação fabricada ────────────────────
test('testAeoTemplateHasNoFabricatedQuoteSource', () => {
  const html = '<html><head><title>Empresa Teste</title></head><body></body></html>';
  const templates = engine.generateAeoContentTemplate('exemplo.com.br', html);
  const serialized = JSON.stringify(templates);
  assert.ok(!serialized.includes('b.rocket Core'), 'Template AEO não deve conter citação fictícia atribuída a "b.rocket Core"');
});

// ─── Varredura geral por smells conhecidos ──────────────────────────────────
test('testGrepKnownFabricationSmells', async () => {
  const html = '<html><head><title>Empresa Teste</title></head><body><h1>Bem-vindo</h1><p>Conteúdo de teste.</p></body></html>';
  const domain = 'exemplo.com.br';
  const url = `https://${domain}`;

  const outputs = await Promise.all([
    engine.runGatekeeperAgent(url, html),
    engine.runMetadataAgent(html, domain),
    engine.runContentAgent(html),
    engine.runIntentAgent(url, html, ''),
    engine.runSemanticExplorerAgent(url, html, ''),
    engine.runOffPageEntityAgent(url, html, ''),
    engine.runSeoOptimizerAgent(url, html),
  ]);

  const serialized = JSON.stringify(outputs);
  const found = KNOWN_FABRICATION_STRING_SMELLS.filter(s => serialized.includes(s));
  assert.deepEqual(found, [], `Smells de fabricação encontrados na saída dos agentes: ${found.join(', ')}`);
});

// ─── Runner ──────────────────────────────────────────────────────────────────
(async () => {
  let failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✓ ${t.name}`);
    } catch (e) {
      failed++;
      console.error(`✗ ${t.name}: ${e.message}`);
    }
  }
  console.log(`\n${tests.length - failed}/${tests.length} testes passaram.`);
  process.exitCode = failed > 0 ? 1 : 0;
})();
