# SKILL.md — Skills do Metadata Entity b.rocket
> Templates completos, ferramentas de validação e workflows de implantação

---

## Skill 1: Geração Automática de Schema Organization

### Dados necessários para coletar do cliente

```
- Nome oficial da empresa (CNPJ)
- URL canônica
- URL do logo (300x100px ideal)
- Descrição de 150-300 chars (não publicitária — factual)
- Ano de fundação
- Número de funcionários
- Telefone oficial
- URLs de redes sociais (LinkedIn, Instagram, Facebook, Google Business)
```

### Processo de geração

1. Coletar dados acima via chat ou diagnóstico
2. Verificar se já existe item no Wikidata (buscar nome no wikidata.org)
3. Gerar o JSON-LD completo com todos os campos
4. Validar em: https://validator.schema.org
5. Validar em: https://search.google.com/test/rich-results

### Onde inserir no site

```html
<!-- Inserir no <head> da página inicial -->
<script type="application/ld+json">
{
  // Schema Organization gerado
}
</script>
```

**Por CMS:**
- **WordPress:** Plugin "Schema Pro" ou inserção manual via functions.php
- **Next.js:** Componente `<Script>` com `type="application/ld+json"`
- **Webflow:** Custom Code → Head tag
- **Shopify:** Liquid template: `{{ content_for_header }}`

---

## Skill 2: Criação de Item no Wikidata

### Por que Wikidata é crucial

Wikidata é o banco de dados público que alimenta diretamente o Google Knowledge Panel e os embeddings de entidades das LLMs. Uma empresa com item no Wikidata tem probabilidade de citação **2-3x maior** nas respostas de IA.

### Processo passo a passo

```
1. Acesse: https://www.wikidata.org
2. Crie conta gratuita
3. Clique em "Create a new item"
4. Adicione:
   - Label (pt): Nome da empresa
   - Label (en): Nome da empresa em inglês
   - Description (pt): "empresa brasileira de {setor}"
   
5. Adicione statements:
   - instance of (P31): business (Q4830453)
   - country (P17): Brazil (Q155)
   - official website (P856): https://domain.com
   - LinkedIn personal profile (P6634): [URL]
   - founded by (P112): [Person item]
   - inception (P571): [ano]
   - industry (P452): [setor relevante]
   
6. Copie o ID do item (ex: Q123456789)
7. Adicione ao sameAs do Schema Organization
```

---

## Skill 3: Geração de /llms.txt Personalizado

### Análise do site para gerar o llms.txt

```javascript
// O que extrair automaticamente do HTML:
const data = {
  title: document.title,
  metaDescription: document.querySelector('meta[name="description"]')?.content,
  h1: document.querySelector('h1')?.textContent,
  h2s: [...document.querySelectorAll('h2')].map(h => h.textContent),
  navLinks: [...document.querySelectorAll('nav a')].map(a => ({
    text: a.textContent.trim(),
    href: a.href
  })),
  footerText: document.querySelector('footer')?.textContent?.slice(0, 500)
}
```

### Checklist de conteúdo do /llms.txt

```
[ ] Nome e descrição clara da empresa (1 parágrafo)
[ ] Lista de serviços com breve descrição
[ ] Diferenciais competitivos (2-3 bullets)
[ ] Dados numéricos (anos de experiência, clientes, projetos)
[ ] Links para páginas principais
[ ] Informações de contato
[ ] Credenciais e autoridade (certificações, prêmios)
[ ] FAQ em formato pergunta/resposta
[ ] Palavras-chave do nicho naturalmente integradas
```

---

## Skill 4: Auditoria e Validação de JSON-LD Existente

### Erros comuns encontrados

| Erro | Causa | Solução |
|---|---|---|
| JSON inválido | Vírgula extra, aspas erradas | Validar em jsonlint.com |
| URL relativa em `logo` | Usar `/logo.png` em vez de URL absoluta | Usar URL completa com https:// |
| `sameAs` como string | `"sameAs": "url"` em vez de array | `"sameAs": ["url1", "url2"]` |
| Falta de `@context` | Schema incompleto | Adicionar `"@context": "https://schema.org"` |
| Tipo errado | `"@type": "Org"` | `"@type": "Organization"` |
| datePublished sem formato | `"2024"` | `"2024-01-15T00:00:00Z"` |

### Ferramentas de validação

```
1. Schema.org Validator: https://validator.schema.org
2. Google Rich Results Test: https://search.google.com/test/rich-results
3. JSON-LD Playground: https://json-ld.org/playground/
4. Structured Data Linter: https://linter.structured-data.org
```

---

## Skill 5: Open Graph Completo para Todas as Páginas

### Tags obrigatórias por tipo de página

**Página institucional:**
```html
<meta property="og:type" content="website" />
<meta property="og:title" content="{Título - máx 70 chars}" />
<meta property="og:description" content="{Descrição - máx 155 chars}" />
<meta property="og:image" content="https://{domain}/og-{page}.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://{domain}/{page}" />
<meta property="og:locale" content="pt_BR" />
<meta property="og:site_name" content="{Nome}" />
```

**Blog post / artigo:**
```html
<meta property="og:type" content="article" />
<meta property="article:author" content="{Nome do Autor}" />
<meta property="article:published_time" content="{ISO date}" />
<meta property="article:modified_time" content="{ISO date}" />
<meta property="article:section" content="{Categoria}" />
<meta property="article:tag" content="{tag1}" />
```

### Tamanho ideal da imagem OG
- Dimensões: **1200 × 630 px**
- Formato: JPG ou PNG
- Tamanho máximo: 8MB (recomendado < 1MB)
- Texto na imagem: máximo 20% da área

---

## Skill 6: Checklist de Implantação de Metadata

```
[ ] Schema Organization criado e validado
[ ] Schema Person criado para o fundador/autor principal
[ ] Schema FAQPage adicionado à página de FAQ ou home
[ ] Schema Service/Product para serviços principais
[ ] Item criado no Wikidata e ID obtido
[ ] sameAs atualizado com Wikidata, LinkedIn e Google Business
[ ] /llms.txt criado e publicado
[ ] Open Graph tags em todas as páginas (mínimo: home, serviços, sobre)
[ ] Twitter/X Card tags em todas as páginas
[ ] Meta description em todas as páginas (máx 155 chars)
[ ] Title tag otimizado (máx 70 chars com keyword principal)
[ ] Canonical URL em todas as páginas
[ ] Schemas validados em search.google.com/test/rich-results
[ ] GEO Score re-calculado após implantação
```
