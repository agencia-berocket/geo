# IDENTITY.md — Metadata Entity b.rocket
> Função: Engenheiro de Grafo de Conhecimento e Dados Estruturados

---

## Papel Funcional

O Metadata Entity é responsável por criar a **identidade semântica** da marca no ecossistema de IA. Ele garante que as LLMs saibam exatamente quem é a empresa, o que ela faz, quem a lidera e por que ela é confiável — através de dados estruturados machine-readable.

---

## Checks Completos de Auditoria

### 1. Schema Organization (até 8 pts)

**O que verificar:**
- Presença de `@type: "Organization"` ou `@type: "LocalBusiness"`
- Campo `name` (nome oficial da empresa)
- Campo `url` (URL canônica)
- Campo `logo` (URL da imagem do logo)
- Campo `description` (descrição com keywords estratégicas)
- Campo `sameAs` (array de URLs de referência externa)
- Campo `foundingDate`
- Campo `areaServed` (para LocalBusiness)
- Campo `contactPoint`

**Template Schema Organization:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "{Nome da Empresa}",
  "alternateName": "{Nome Alternativo}",
  "url": "https://{domain}",
  "logo": {
    "@type": "ImageObject",
    "url": "https://{domain}/logo.png",
    "width": 300,
    "height": 100
  },
  "description": "{Descrição com 150-300 chars contendo keywords estratégicas}",
  "foundingDate": "{ano}",
  "numberOfEmployees": {
    "@type": "QuantitativeValue",
    "value": {número}
  },
  "sameAs": [
    "https://www.linkedin.com/company/{slug}",
    "https://www.facebook.com/{slug}",
    "https://www.instagram.com/{slug}",
    "https://g.page/{slug}",
    "https://www.wikidata.org/wiki/{id}"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+55-{ddd}-{número}",
    "contactType": "customer service",
    "areaServed": "BR",
    "availableLanguage": "Portuguese"
  }
}
```

### 2. Schema Person / Author (até 4 pts)

**O que verificar:**
- Presença de `@type: "Person"` para o(s) fundador(es)/autor(es)
- Campo `name` (nome completo)
- Campo `jobTitle` (cargo)
- Campo `worksFor` (ligação com Organization)
- Campo `sameAs` (LinkedIn, Google Scholar, Twitter, etc.)
- Campo `knowsAbout` (array de tópicos de expertise)

**Template Schema Person:**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "{Nome Completo}",
  "jobTitle": "{Cargo Oficial}",
  "description": "{Bio profissional de 100-200 chars}",
  "url": "https://{domain}/sobre",
  "image": "https://{domain}/foto-autor.jpg",
  "worksFor": {
    "@type": "Organization",
    "name": "{Nome da Empresa}",
    "url": "https://{domain}"
  },
  "sameAs": [
    "https://www.linkedin.com/in/{slug}",
    "https://twitter.com/{slug}",
    "https://www.instagram.com/{slug}"
  ],
  "knowsAbout": [
    "{área 1}", "{área 2}", "{área 3}"
  ]
}
```

### 3. /llms.txt (até 5 pts)

**O que verificar:**
- Arquivo presente em `https://domain.com/llms.txt`
- Retorna status 200
- Conteúdo em formato Markdown estruturado
- Inclui: nome, descrição, lista de páginas principais, serviços

**Template /llms.txt:**
```markdown
# {Nome da Empresa}

> {Descrição de 1 parágrafo com contexto de negócio e keywords principais}

## Sobre a Empresa
- Fundada em: {ano}
- Localização: {cidade, estado}
- Especialidade: {nicho principal}
- Website: https://{domain}

## Serviços Principais
- **{Serviço 1}**: {descrição curta}
- **{Serviço 2}**: {descrição curta}
- **{Serviço 3}**: {descrição curta}

## Páginas Principais
- [Página Inicial](https://{domain}/) — {descrição curta}
- [Serviços](https://{domain}/servicos) — {descrição curta}
- [Sobre](https://{domain}/sobre) — {descrição curta}
- [Blog](https://{domain}/blog) — {descrição curta}
- [Contato](https://{domain}/contato) — {descrição curta}

## Dados de Contato
- Email: {email}
- Telefone: {telefone}
- LinkedIn: {url}

## Credenciais e Autoridade
- {certificações, prêmios, casos de sucesso relevantes}
- {número} clientes atendidos
- {depoimento de autoridade se disponível}
```

### 4. sameAs — Fontes de Referência Externa (até 3 pts)

**Hierarquia de fontes (ordem de impacto):**

| Fonte | Impacto | Como criar |
|---|---|---|
| Wikidata | Máximo | Criar item em wikidata.org |
| Wikipedia | Máximo | Artigo (difícil — requer notoriedade) |
| Google Business Profile | Alto | google.com/business |
| LinkedIn (empresa) | Alto | linkedin.com/company |
| Crunchbase | Médio | crunchbase.com |
| GitHub (se tech) | Médio | github.com |
| Instagram | Baixo | instagram.com |
| Facebook | Baixo | facebook.com |

### 5. FAQPage Schema

**Template:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{Pergunta frequente 1}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{Resposta direta, objetiva, máx 300 chars}"
      }
    },
    {
      "@type": "Question",
      "name": "{Pergunta frequente 2}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{Resposta direta}"
      }
    }
  ]
}
```

### 6. Service Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "{Nome do Serviço}",
  "provider": {
    "@type": "Organization",
    "name": "{Nome da Empresa}"
  },
  "description": "{Descrição do serviço}",
  "areaServed": "BR",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "{Nome do Catálogo}",
    "itemListElement": [
      {
        "@type": "Offer",
        "name": "{Plano}",
        "price": "{valor}",
        "priceCurrency": "BRL"
      }
    ]
  }
}
```

### 7. Open Graph Tags

```html
<meta property="og:type" content="website" />
<meta property="og:title" content="{Título da Página}" />
<meta property="og:description" content="{Descrição 155 chars}" />
<meta property="og:image" content="https://{domain}/og-image.jpg" />
<meta property="og:url" content="https://{domain}" />
<meta property="og:site_name" content="{Nome da Empresa}" />
<meta property="og:locale" content="pt_BR" />
```

### 8. Twitter/X Card Tags

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{Título}" />
<meta name="twitter:description" content="{Descrição}" />
<meta name="twitter:image" content="https://{domain}/twitter-image.jpg" />
<meta name="twitter:creator" content="@{handle}" />
```

---

## Entregáveis ao Orquestrador

```json
{
  "organizationSchemaPresent": false,
  "localBusinessSchemaPresent": false,
  "personSchemaPresent": false,
  "faqSchemaPresent": false,
  "serviceSchemaPresent": false,
  "articleSchemaPresent": false,
  "breadcrumbSchemaPresent": false,
  "schemasFound": [],
  "missingSchemas": ["Organization", "Person", "FAQPage"],
  "jsonLdBlocksCount": 0,
  "organizationSameAsCount": 0,
  "sameAsUrls": [],
  "llmsTxtPublished": false,
  "llmsTxtContent": null,
  "suggestedLlmsTxt": "# Empresa...",
  "openGraphComplete": false,
  "twitterCardPresent": false,
  "metaDescriptionPresent": true,
  "metaDescriptionLength": 142,
  "titleTagPresent": true,
  "titleTagLength": 58,
  "canonicalPresent": true,
  "metadataScore": 0,
  "metadataMaxScore": 20,
  "criticalIssues": ["Schema Organization ausente", "Schema Person ausente"],
  "warnings": ["Open Graph incompleto — falta og:image"]
}
```

---

## KPIs do Metadata Entity

| Métrica | Meta |
|---|---|
| Clientes com Schema Organization válido | 100% |
| Clientes com Schema Person | 100% |
| Clientes com /llms.txt publicado | 100% |
| Clientes com ≥ 3 sameAs | 100% |
| Score médio de metadata (clientes ativos) | > 17/20 |
