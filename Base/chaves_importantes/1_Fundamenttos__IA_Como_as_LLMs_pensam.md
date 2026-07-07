# Fundamenttos & IA (Como as LLMs pensam)

## Antes de otimizar, você precisa entender como os "motores" funcionam.

### LLMs (Large Language Models): O que são e como processam texto.


### RAG (Retrieval-Augmented Generation): Como o ChatGPT/Gemini busca informações na web em tempo real para responder ao usuário (o coração do GEO).


### Fontes de Dados: De onde as IAs extraem informação (Reddit, Wikipédia, portais de notícias, sites indexados).



## 1.1 O Mecanismo de Busca: O que é RAG?

### Os buscadores antigos (Google tradicional) apenas linkavam páginas. Os buscadores de IA usam uma tecnologia chamada RAG (Retrieval-Augmented Generation). Você precisa entender esse fluxo:

- Fase de Recuperação (Retrieval): Quando o usuário faz uma pergunta, a IA busca na internet os pedaços de textos (chunks) mais relevantes sobre o assunto.
- Fase de Geração (Generation): A IA lê esses pedaços, resume tudo e gera uma resposta única, citando as fontes.
- Por que isso importa para o GEO? Se o seu conteúdo não for capturado na fase de Recuperação, você nunca aparecerá na fase de Geração.


## 1.2 O Ecossistema dos LLMs (Quem é Quem)

### Você precisa mapear quais são as ferramentas que dominam o mercado e como elas se comportam, pois o GEO muda ligeiramente para cada uma:

- Perplexity AI: O pioneiro em busca conversacional. Focado em respostas diretas e fontes acadêmicas/jornalísticas.
- OpenAI (ChatGPT Search / SearchGPT): Muito focado em intenção de compra e respostas contextuais profundas.
- Google (AI Overviews / Gemini): Integra o ecossistema Google (Mapas, Youtube, Shopping). Otimizar para ele exige entender a base do SEO tradicional + IA.
- Microsoft Copilot: Bebe da fonte do Bing. Muito forte no ambiente corporativo e buscas de desktop.


## 1.3 Os Critérios de Rank (Como as IAs escolhem as fontes)

### Diferente do Google antigo, que olhava muito para "palavras-chave repetidas" e "quantidade de backlinks", os LLMs avaliam o texto de forma humana. Você deve estudar:

- E-E-A-T (Experiência, Expertise, Autoridade e Confiança): O Google e outras IAs priorizam conteúdos escritos por especialistas reais.
- Citações Co-ocorrentes: Se o seu site fala sobre "Melhor Software de CRM", a IA busca ver se outros sites na internet também associam o nome da sua marca à palavra "CRM".
- Fragmentação de Dados (Chunking): Como estruturar seu texto (títulos, listas, tabelas) para que os robôs de IA consigam "recortar e colar" seu conteúdo facilmente na resposta final.


## Plano de Estudos

### 1. O Conceito de "Embeddings" e Busca Vetorial

- O que é: O Google antigo buscava por correspondência exata de palavras (se você digitava "tênis vermelho", ele procurava a palavra "tênis" e "vermelho"). As IAs usam Busca Vetorial. Elas transformam palavras, frases e sites inteiros em números (vetores) que representam o significado do texto.
- Onde focar o estudo: Entenda como a IA aproxima conceitos por similaridade semântica. Se o usuário busca "como resolver dor nas costas", a IA sabe que um artigo falando sobre "exercícios para postura" é semanticamente próximo, mesmo que não tenha a palavra "dor".
- Por que importa para o GEO: Você não otimiza mais para uma "palavra-chave", você otimiza para um contexto/conceito.

### 2. O Estudo Pioneiro: "From SEO to GEO" (Princeton/Georgia Tech)

- O que é: Este é o artigo científico que praticamente fundou o termo GEO. Pesquisadores de grandes universidades americanas testaram várias técnicas para ver o que fazia o ChatGPT e o Perplexity citarem mais um site.
- Onde focar o estudo: Eles descobriram que algumas técnicas aumentam a chance de citação em até 40%. As principais são:
  - Citações de Autoridade: Incluir fontes confiáveis e dados estatísticos no seu texto.
  - Otimização de Fluidez: Textos fáceis de serem lidos por humanos também são mais fáceis para os LLMs processarem.
  - Uso de Termos Técnicos (Niche Terms): Usar o jargão correto do seu mercado.
- Por que importa para o GEO: É a primeira prova científica do que funciona e do que não funciona nesse novo cenário.

### 3. Entender o Fluxo do RAG (Retrieval-Augmented Generation) na Prática

- O que é: Como vimos, o RAG é o processo onde a IA pesquisa no "Google interno" dela antes de responder.
- Onde focar o estudo: Entenda as três fases: Ingestão (como a IA lê e guarda o conteúdo do seu site), Recuperação (como ela puxa o seu site quando o usuário pergunta) e Geração (como ela te cita na resposta).
- Por que importa para o GEO: Se o robô de IA (como o OAI-SearchBot da OpenAI ou o PerplexityBot) estiver bloqueado no arquivo robots.txt do seu site, o RAG nunca vai te encontrar. Esse tipo de detalhe técnico é o que o expert precisa saber.



