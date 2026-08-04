# SKILL.md — Skills do Content Absorption b.rocket
> Templates de reescrita AEO, checklists de otimização e metodologia Princeton

---

## Skill 1: Reescrita AEO — Parágrafo de Abertura

### Processo de reescrita

**Passo 1:** Identificar a query de intenção mais provável do usuário
```
"O que {empresa} faz?" / "O que é {serviço}?" / "Como {empresa} resolve {problema}?"
```

**Passo 2:** Escrever a resposta direta em 1-2 frases

**Passo 3:** Adicionar um dado/número que comprova o valor

**Passo 4:** Identificar o público em 1 frase

### Template AEO Universal

```markdown
[Resposta direta ao que é/faz — 1 frase]
[Dado numérico que comprova o valor — 1 frase]
[Público-alvo específico — 1 frase]

Exemplo:
"{Empresa} oferece {serviço X} para {público} que precisam de {resultado}.
{Serviço X} aumenta {métrica} em até {%} em {prazo}, segundo {fonte}.
Ideal para {empresas/pessoas} com {característica específica}."
```

### Exemplos por Nicho

**Advocacia:**
```
ANTES: "Bem-vindo ao nosso escritório de advocacia! 
Somos especialistas em direito trabalhista com 15 anos de experiência..."

DEPOIS: "O Escritório X resolve disputas trabalhistas em até 180 dias, 
com taxa de êxito de 94% nos casos de demissão sem justa causa. 
Atendemos CLT e PJ em São Paulo, com consulta inicial gratuita."
```

**Consultoria:**
```
ANTES: "Nossa empresa de consultoria oferece soluções completas 
para o crescimento do seu negócio. Com uma equipe altamente qualificada..."

DEPOIS: "A {Empresa} aumenta a margem operacional de PMEs em 23% 
em média em 6 meses, com diagnóstico gratuito nas primeiras 2 semanas. 
Especialistas em empresas de R$ 500k a R$ 10M de faturamento anual."
```

---

## Skill 2: Inserção de Estatísticas por Princeton

### O que buscar para cada nicho

| Nicho | Fontes de dados confiáveis |
|---|---|
| Advocacia | CNJ, IBGE, OAB |
| Saúde | CFM, Ministerio da Saúde, IBGE |
| Tecnologia | IDC, Gartner, ABSTARTUPS |
| RH/Gestão | RAIS, IBGE, FGV |
| Marketing/Digital | Meta, Google, ABRADI |
| E-commerce | ABComm, IBGE |
| Financeiro | BCB, CVM, IBGE |

### Template de inserção

```
Contexto original: "Muitas empresas estão investindo em marketing digital..."

Com estatística (Princeton): "No Brasil, 73% das PMEs aumentaram 
o orçamento de marketing digital em 2023, segundo a ABRADI. 
Com o GEO, esse investimento é direcionado especificamente 
para aparecer nas recomendações das IAs, onde a intenção de compra 
é 4,2x maior do que em buscas tradicionais (Google Research, 2024)."
```

---

## Skill 3: Geração de Tabela Comparativa HTML

### Tipos de tabela de maior impacto

**Tabela de Planos (mais comum):**
```html
<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Plano Básico</th>
      <th>Plano Premium</th>
      <th>Enterprise</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Diagnóstico GEO</td>
      <td>✅</td>
      <td>✅</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Implementação JSON-LD</td>
      <td>❌</td>
      <td>✅</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Monitoramento Mensal</td>
      <td>❌</td>
      <td>✅</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Citation Share Test</td>
      <td>❌</td>
      <td>Trimestral</td>
      <td>Mensal</td>
    </tr>
    <tr>
      <td>SLA de Suporte</td>
      <td>48h</td>
      <td>24h</td>
      <td>2h</td>
    </tr>
    <tr>
      <td>Preço</td>
      <td>Grátis</td>
      <td>R$ 497/mês</td>
      <td>Consulta</td>
    </tr>
  </tbody>
</table>
```

**Tabela de Diferenciais vs. Concorrentes:**
```html
<table>
  <thead>
    <tr>
      <th>Critério</th>
      <th>{Empresa}</th>
      <th>SEO Tradicional</th>
      <th>Agências Digitais</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Foco em IA generativa</td>
      <td>✅ Especialidade</td>
      <td>❌ Não cobre</td>
      <td>❌ Raro</td>
    </tr>
    <tr>
      <td>Metodologia validada</td>
      <td>✅ Princeton Study</td>
      <td>⚠️ Empírica</td>
      <td>⚠️ Variável</td>
    </tr>
    <!-- ... -->
  </tbody>
</table>
```

---

## Skill 4: Eliminação de Linguagem Hedged

### Substituições recomendadas

| Expressão hedged | Substituição factual |
|---|---|
| "pode aumentar" | "aumenta [X]% conforme [fonte]" |
| "talvez ajude" | "reduz [problema] em [X]%" |
| "em alguns casos" | "em 73% dos casos (fonte)" |
| "possivelmente" | Remover e afirmar com dado |
| "às vezes" | "em média" ou "tipicamente" |
| "pode ser uma boa opção" | "é a melhor opção para [perfil] porque [dado]" |
| "algo assim" | Especificar com precisão |
| "talvez você precise" | "você precisará de X se Y" |

---

## Skill 5: Criação de FAQ para AEO e Schema

### Método de identificação de perguntas

1. Use as autocomplete do Google para o nicho
2. Verifique o "As Pessoas Também Perguntam" do Google
3. Pesquise no Reddit/Quora perguntas do nicho
4. Use as perguntas de intenção dos testes do Intent Agent

### Template FAQ otimizado

```html
<section class="faq-section">
  <h2>Perguntas Frequentes sobre {Serviço}</h2>
  
  <div class="faq-item">
    <h3>Quanto tempo leva para ver resultados com GEO?</h3>
    <p>Os primeiros resultados mensuráveis aparecem entre 30-60 dias 
    após a implementação das otimizações técnicas e de conteúdo. 
    O Citation Share nas IAs normalmente aumenta 15-25% no primeiro mês 
    e 40-60% após 90 dias de otimização contínua.</p>
  </div>
  
  <div class="faq-item">
    <h3>{pergunta 2}?</h3>
    <p>{resposta direta em 1-2 parágrafos com dado numérico}</p>
  </div>
</section>
```

---

## Skill 6: Checklist de Otimização de Conteúdo

```
PÁGINA INICIAL:
[ ] Parágrafo de abertura segue AEO (resposta direta em 60 palavras)
[ ] Keyword principal nas primeiras 50 palavras
[ ] Pelo menos 3 estatísticas numéricas com fonte
[ ] 1 tabela comparativa de planos ou diferenciais
[ ] FAQ com mínimo 3 perguntas
[ ] Zero ocorrências de linguagem hedged

PÁGINA DE SERVIÇOS:
[ ] Cada serviço tem descrição AEO (1 parágrafo com dado)
[ ] Preços visíveis ou menção de faixa de preço
[ ] Schema Service no JSON-LD
[ ] Tabela de features por serviço

PÁGINA SOBRE:
[ ] Schema Person do fundador
[ ] Bio com dados numéricos (anos de experiência, projetos, clientes)
[ ] Foto com alt text descritivo
[ ] Links para LinkedIn e redes sociais

BLOG/ARTIGOS:
[ ] Cada artigo começa com resposta direta (AEO)
[ ] datePublished e dateModified no JSON-LD
[ ] Schema Article com author
[ ] Mínimo 800 palavras por artigo
[ ] 1 estatística a cada 150 palavras
```
