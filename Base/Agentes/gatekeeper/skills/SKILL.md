# SKILL.md — Skills do Technical Gatekeeper b.rocket
> Capacidades operacionais, templates de código e checklists de implantação

---

## Skill 1: Auditoria Completa de robots.txt

### Como executar manualmente

```bash
# Verificar robots.txt
curl -I https://domain.com/robots.txt
curl https://domain.com/robots.txt

# Testar se bot específico está bloqueado
# Procurar por: "Disallow: /" sob "User-agent: GPTBot"
```

### Interpretação

```
❌ BLOQUEADO (problema grave):
User-agent: *
Disallow: /

✅ CORRETO:
User-agent: *
Allow: /

❌ BOT ESPECÍFICO BLOQUEADO:
User-agent: GPTBot
Disallow: /

✅ CORRETO — Explícito por segurança:
User-agent: GPTBot
Allow: /
```

### Template de robots.txt otimizado para GEO

```txt
# b.rocket GEO-Optimized robots.txt
# Gerado em: {data}

# Rastreadores Gerais
User-agent: *
Allow: /
Crawl-delay: 1

# OpenAI (ChatGPT)
User-agent: OAI-SearchBot
Allow: /
User-agent: GPTBot
Allow: /

# Anthropic (Claude)
User-agent: Claude-SearchBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /

# Perplexity
User-agent: PerplexityBot
Allow: /

# Google (Gemini)
User-agent: Googlebot
Allow: /
User-agent: GoogleOther
Allow: /
User-agent: AdsBot-Google
Allow: /

# Microsoft (Copilot)
User-agent: Bingbot
Allow: /
User-agent: msnbot
Allow: /

# Apple
User-agent: AppleBot
Allow: /

# DuckDuckGo
User-agent: DuckDuckBot
Allow: /

Sitemap: https://{domain}/sitemap.xml
```

---

## Skill 2: Diagnóstico e Correção de SSR

### Como verificar SSR

```bash
# Verificar conteúdo HTML sem JavaScript
curl -s https://domain.com | grep -c "<p>"
curl -s https://domain.com | wc -c

# Se retornar < 500 bytes de conteúdo real, SSR não está ativo
```

### Soluções por Stack

**React SPA (sem SSR):**
```bash
# Opção 1: Migrar para Next.js (recomendado)
npx create-next-app@latest

# Opção 2: Adicionar pré-rendering com react-snap
npm install --save-dev react-snap
# Adicionar ao package.json: "postbuild": "react-snap"

# Opção 3: Rendertron (headless Chrome para pre-render)
# Configurar proxy nginx para bots específicos
```

**Next.js (verificar configuração):**
```javascript
// pages/index.js — Usar getServerSideProps ou getStaticProps
export async function getStaticProps() {
  return { props: { /* dados */ } }
}
```

**Nginx — Servir versão pré-renderizada para bots:**
```nginx
map $http_user_agent $is_bot {
  default 0;
  ~*GPTBot 1;
  ~*OAI-SearchBot 1;
  ~*PerplexityBot 1;
  ~*ClaudeBot 1;
}

server {
  if ($is_bot) {
    return 301 /prerendered$request_uri;
  }
}
```

---

## Skill 3: Otimização de Latência

### Diagnóstico

```bash
# Medir latência
curl -o /dev/null -s -w "%{time_total}\n" https://domain.com

# Verificar Time to First Byte (TTFB)
curl -o /dev/null -s -w "%{time_starttransfer}\n" https://domain.com
```

### Soluções

| Problema | Solução |
|---|---|
| TTFB > 800ms | Ativar cache de servidor (Redis / Nginx cache) |
| Hosting compartilhado lento | Migrar para VPS (Coolify, Railway, Render) |
| WordPress lento | WP Rocket + Cloudflare |
| Imagens pesadas | WebP + lazy loading |
| JS bundle grande | Code splitting + tree shaking |
| Sem CDN | Adicionar Cloudflare (gratuito) |

---

## Skill 4: Implementação de Sitemap

### WordPress
```php
// Yoast SEO gera automaticamente
// Verificar: /sitemap_index.xml ou /sitemap.xml
```

### Next.js
```javascript
// next-sitemap
npm install next-sitemap

// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://seudominio.com.br',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
    ]
  }
}
```

### HTML estático
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://domain.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://domain.com/servicos</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

## Skill 5: Checklist de Validação Pós-Implantação

```
[ ] robots.txt permite todos os 10 bots de IA
[ ] Verificado com: curl https://domain.com/robots.txt
[ ] SSR ativo: curl -s https://domain.com | grep -c "<p>" retorna > 5
[ ] Sitemap presente: https://domain.com/sitemap.xml retorna 200
[ ] Sitemap declarado no robots.txt
[ ] Canonical presente em todas as páginas principais
[ ] HTTPS ativo e redirecionamento de HTTP funcionando
[ ] Latência < 800ms (medida 3x para média)
[ ] Sem X-Robots-Tag: noindex nos headers
[ ] Sem <meta name="robots" content="noindex"> no HTML
[ ] Preços visíveis no HTML sem necessidade de JS
[ ] Datas de conteúdo atualizadas (< 6 meses)
```

---

## Skill 6: Geração de Relatório Gatekeeper

### Template de seção para relatório HTML

```html
<section class="agent-report gatekeeper">
  <h2>🛡️ Pilar 1: Infraestrutura Técnica</h2>
  <div class="score-badge">Score: {gatekeeperScore}/25</div>
  
  <h3>robots.txt</h3>
  <p class="{status}">
    {allBotsAllowed ? '✅ Todos os bots de IA estão permitidos' : 
      '❌ ' + blockedCrawlers.join(', ') + ' estão bloqueados'}
  </p>
  
  <h3>Server-Side Rendering</h3>
  <p class="{status}">
    {ssrActive ? '✅ Conteúdo visível sem JavaScript' : 
      '❌ Conteúdo depende de JavaScript para renderizar'}
  </p>
  
  <!-- ... -->
</section>
```
