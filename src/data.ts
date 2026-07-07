import { Project, Service, Stat, ProcessStep, TeamMember, PricingPlan, FAQItem } from './types';

export const projects: Project[] = [
  {
    id: 'p1',
    title: 'VARREDURA',
    subtitle: 'Menções em Tempo Real',
    category: 'Diagnóstico 01',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800&sat=-100',
    color: '#EF4444', // red
    client: 'ChatGPT, Claude, Gemini, Perplexity',
    year: '2026',
    description: 'Testamos e mapeamos em tempo real a presença, a percepção e o volume de citações espontâneas da sua marca diretamente nas respostas sintetizadas das maiores LLMs do mundo.',
    detailedAnalysis: {
      whyItIsCritical: 'As inteligências artificiais gerativas não usam mais os "links azuis" tradicionais. Elas agem como recomendadoras diretas. Se um cliente em potencial pergunta ao ChatGPT, Claude, Gemini ou Perplexity sobre uma solução no seu nicho e a sua marca não é citada espontaneamente nas respostas estruturadas, seu negócio deixa de existir comercialmente para essa nova parcela gigantesca de usuários.',
      howWeAudit: 'Executamos uma varredura semântica automatizada utilizando mais de 150 variações de prompts de intenção de compra, prompts neutros e prompts comparativos direcionados às principais LLMs comerciais do mercado (ChatGPT, Claude, Gemini e Perplexity). Mapeamos a frequência de citação e a precisão das informações fornecidas sobre sua empresa.',
      metricsDelivered: [
        'Share of Model (SoM): % de recomendação comparado aos principais concorrentes.',
        'Características Reconhecidas: Quais diferenciais e qualidades a IA atribui à sua marca.',
        'Grau de Alinhamento Semântico: Se a descrição da IA condiz com o posicionamento real da marca.',
        'Taxa de Co-ocorrência: Em quais listas de categorias ou clusters setoriais você é agrupado.'
      ],
      recommendedActions: [
        'Mapear e corrigir alucinações ou dados incorretos que a IA replique de fontes desatualizadas.',
        'Desenvolver estratégias ativas de relações públicas digitais focadas em sites que as LLMs usam como fonte primária.',
        'Enriquecer canais oficiais com estruturas limpas de perguntas e respostas (Q&As) mapeadas para intenções de busca.'
      ]
    }
  },
  {
    id: 'p2',
    title: 'CRAWLERS',
    subtitle: 'Robots.txt & Acesso de Agentes',
    category: 'Diagnóstico 02',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800&sat=-100',
    color: '#18181B', // dark gray
    client: 'ChatGPT, Claude, Gemini, Perplexity',
    year: '2026',
    description: 'Verificação profunda para identificar se suas configurações de servidor estão impedindo ou facilitando a leitura de conteúdo pelos rastreadores oficiais de inteligência artificial.',
    detailedAnalysis: {
      whyItIsCritical: 'Muitos servidores e administradores de TI bloqueiam erroneamente todos os novos bots de busca ou limitam o "crawl budget" (orçamento de rastreamento) por medo de sobrecarga ou cópias de conteúdo. No entanto, bloquear os rastreadores oficiais do ChatGPT, Claude, Gemini e Perplexity impede que as respostas sintetizadas de IA em tempo real tenham acesso às suas páginas, resultando em exclusão imediata.',
      howWeAudit: 'Analisamos em detalhes as diretrizes do arquivo robots.txt, as configurações do seu webserver (Nginx, Apache, Vercel), os cabeçalhos HTTP de controle e possíveis bloqueios silenciosos no nível de CDN (como filtros automáticos contra bots do Cloudflare, AWS CloudFront ou Akamai).',
      metricsDelivered: [
        'Acessibilidade do Agente: Status de permissão explícita para mais de 12 bots de IA.',
        'Latência de Resposta do Servidor: Se a entrega de dados excede o limite aceitável para indexadores rápidos.',
        'Estruturação de Rastreamento de API: Identificação se o conteúdo dinâmico (JavaScript/React) está sendo renderizado no servidor para fácil leitura.'
      ],
      recommendedActions: [
        'Otimizar o robots.txt separando regras para scrapers de treinamento de modelos (GPTBot) de bots de resposta em tempo real (OAI-SearchBot).',
        'Implementar Server-Side Rendering (SSR) ou pré-renderização estática eficiente para que os bots de IA leiam a página instantaneamente.',
        'Ajustar as políticas de segurança de CDNs para evitar falsos positivos que barram agentes automatizados de IA legítimos.'
      ]
    }
  },
  {
    id: 'p3',
    title: 'ON-PAGE',
    subtitle: 'AEO & Dados Estruturados',
    category: 'Diagnóstico 03',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800&sat=-100',
    color: '#3B82F6', // blue
    client: 'Schema JSON-LD & Entity Markup',
    year: '2026',
    description: 'Medimos a arquitetura semântica das suas páginas e a presença de blocos de dados estruturados invisíveis para humanos, mas que alimentam a rede neural das IAs.',
    detailedAnalysis: {
      whyItIsCritical: 'As inteligências artificiais utilizam processos de processamento de linguagem natural (NLP) para transformar o texto do seu site em vetores numéricos. Se o seu conteúdo for vago, recheado de adjetivos publicitários vazios ou estruturado de forma confusa, o algoritmo falhará em extrair fatos claros. Além disso, a falta de marcação estruturada JSON-LD avançada (esquemas de produtos, FAQ, organizações) impede a catalogação perfeita dos seus serviços nos bancos de dados vetoriais.',
      howWeAudit: 'Avaliamos a hierarquia dos cabeçalhos HTML (H1-H4), a clareza e precisão das respostas dadas em parágrafos iniciais (Answer Engine Optimization), e a cobertura e validação técnica de todos os Schemas JSON-LD presentes no seu código fonte.',
      metricsDelivered: [
        'Fator de Legibilidade por LLM: Nota de legibilidade e extração sintática do texto.',
        'Densidade Informativa: Proporção de dados concretos/numéricos em relação a palavras de preenchimento.',
        'Validação de JSON-LD: Detecção de erros de sintaxe ou propriedades obrigatórias ausentes nos metadados.'
      ],
      recommendedActions: [
        'Reescrever trechos chaves da copy utilizando a técnica de "Resposta Direta" (AEO) — colocando definições exatas nas primeiras frases.',
        'Implementar códigos JSON-LD customizados contendo referências explícitas "sameAs" (apontando para verbetes confiáveis como Wikipedia ou Wikidata) para conectar sua marca a entidades consolidadas.',
        'Eliminar elementos redundantes e layouts não semânticos que poluam o DOM analisado pelos bots.'
      ]
    }
  },
  {
    id: 'p4',
    title: 'SENTIMENTO',
    subtitle: 'Brand Sentiment & Similaridade',
    category: 'Diagnóstico 04',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800&sat=-100',
    color: '#EF4444', // red
    client: 'Análise de Reputação Vetorial',
    year: '2026',
    description: 'Identificação cirúrgica de como as LLMs descrevem sua marca em comparações diretas de mercado (positivo, neutro ou se você simplesmente é excluído do radar de escolhas).',
    detailedAnalysis: {
      whyItIsCritical: 'Ao recomendar uma marca, os modelos de IA consideram o sentimento geral associado a ela em todas as fontes indexadas e seu peso no espaço vetorial. Se a marca possui avaliações desatualizadas, discussões críticas em fóruns ou escassez de menções elogiosas de terceiros confiáveis, ela herda um vetor de polaridade neutra ou negativa, perdendo posições nos rankings de recomendações sintéticas.',
      howWeAudit: 'Utilizamos técnicas de análise de sentimento baseadas em embeddings de linguagem natural para medir a distância vetorial cosseno entre o nome do seu negócio e conceitos de autoridade, liderança, confiabilidade e satisfação. Simulamos queries de comparação direta de mercado ("Marca X vs. Concorrente Y") para analisar o viés do algoritmo.',
      metricsDelivered: [
        'Índice de Similaridade Cosseno: Proximidade vetorial com atributos de "líder de mercado" ou "marca recomendada".',
        'Polaridade de Sentimento das LLMs: Proporção de respostas positivas, neutras ou com ressalvas negativas.',
        'Benchmark de Competitividade: Comparação de relevância e autoridade vetorial contra 3 concorrentes diretos.'
      ],
      recommendedActions: [
        'Coordenar uma estratégia de assessoria de imprensa digital para semear menções de marca com forte contexto positivo em portais de alta reputação e fóruns catalogados.',
        'Resolver pontualmente focos de reputação negativa que alimentam o corpus de treinamento ou os índices de tempo real das IAs.',
        'Criar conteúdos técnicos comparativos profundos em canais próprios para dar subsídio analítico de qualidade aos robôs que realizam varreduras de mercado.'
      ]
    }
  }
];

export const services: Service[] = [
  {
    id: 's1',
    title: 'E-E-A-T Avançado',
    technicalLabel: 'Otimização de Autoridade e Confiança',
    index: '.01',
    description: 'As IAs priorizam de forma implacável fontes escritas por especialistas reais, com alta autoridade verificável e referências enriquecidas com dados numéricos exatos.',
    details: [
      'Construção de Perfil de Autor (Schema)',
      'Inserção de Estatísticas Verificáveis',
      'Validação de Referências Cruzadas',
      'Neutralidade e Coerência de Tom'
    ],
    graphicType: 'nodes'
  },
  {
    id: 's2',
    title: 'Fragmentação Eficiente',
    technicalLabel: 'Otimização de Fragmentação de Conteúdo',
    index: '.02',
    description: 'Seu site estruturado de forma que os robôs consigam "recortar e colar" o conteúdo isoladamente (Chunking) para alimentar o prompt do usuário de maneira limpa.',
    details: [
      'Estruturação de Tópicos (Header Hierarchy)',
      'Otimização de Chunks de Texto',
      'Blocos Independentes de Significado',
      'Listas e Tabelas Semânticas'
    ],
    graphicType: 'geometrics'
  },
  {
    id: 's3',
    title: 'Fórmula Direto ao Ponto',
    technicalLabel: 'Otimização para Respostas da IA',
    index: '.03',
    description: 'Se a sua página não responder às dúvidas mais críticas nas primeiras 60 palavras do parágrafo, a IA simplesmente desiste de indexar e resumir seu conteúdo.',
    details: [
      'Formulação AEO (Answer Engine)',
      'Micro-copys Diretas e Objetivas',
      'Eliminação de Clichês e Adjetivos',
      'Arquitetura de Resposta Rápida'
    ],
    graphicType: 'spheres'
  },
  {
    id: 's4',
    title: 'Estruturação de Entidades',
    technicalLabel: 'Integração de Rede de Conhecimento',
    index: '.04',
    description: 'Conectamos seu negócio ao mapa global de conhecimento e criamos JSON-LD Schemas avançados para que as buscas vetoriais encontrem sua marca por proximidade conceitual.',
    details: [
      'Embeddings e Similaridade Vetorial',
      'JSON-LD Avançado de Organização/Serviços',
      'Eliminação de Bloqueios no robots.txt',
      'Mapeamento de Entidades Co-relacionadas'
    ],
    graphicType: 'circuits'
  }
];

export const stats: Stat[] = [
  {
    id: 'st1',
    value: 40,
    suffix: '%',
    title: 'Chance de Recomendação',
    description: 'Aumento real nas chances de citações ativas pelas LLMs após aplicação estrita das metodologias de GEO desenvolvidas em Princeton.'
  },
  {
    id: 'st2',
    value: 65,
    suffix: '%',
    title: 'Migração de Busca',
    description: 'Do tráfego de busca tradicional que está migrando para assistentes de resposta direta de IA nos setores de alta decisão B2B e serviços premium.'
  },
  {
    id: 'st3',
    value: 0,
    suffix: ' Cliques',
    title: 'Cenário Zero-Click',
    description: 'Pesquisas que são resolvidas inteiramente dentro de plataformas como ChatGPT, Claude, Gemini e Perplexity, eliminando a chance do usuário clicar em links tradicionais do Google.'
  },
  {
    id: 'st4',
    value: 100,
    suffix: '%',
    title: 'Invisibilidade de IA',
    description: 'De marcas que se apoiam apenas no SEO tradicional de palavras-chave repetitivas e continuam invisíveis para os robôs de busca modernos.'
  }
];

export const processSteps: ProcessStep[] = [
  {
    id: 'pr1',
    index: '/01',
    title: 'Insira os Dados',
    timeframe: 'Instantâneo',
    description: 'Forneça a URL do seu negócio e o e-mail corporativo para onde o relatório estruturado em PDF de GEO deve ser enviado.',
    bullets: [
      'Inserção segura da URL do site.',
      'E-mail profissional para entrega.',
      'Validação rápida de domínio.'
    ],
    color: '#71717A' // zinc-500
  },
  {
    id: 'pr2',
    index: '/02',
    title: 'Análise Rápida',
    timeframe: 'Em menos de 3 minutos',
    description: 'Nosso algoritmo próprio simula a varredura das IAs e cruza os critérios do estudo de Princeton para avaliar as falhas técnicas de RAG.',
    bullets: [
      'Teste de robots.txt com rastreadores.',
      'Auditoria de similaridade semântica.',
      'Cálculo do GEO-Score inicial.'
    ],
    color: '#3B82F6' // blue-500
  },
  {
    id: 'pr3',
    index: '/03',
    title: 'Plano de Ação GEO',
    timeframe: 'Envio Imediato',
    description: 'Você recebe um PDF detalhando o seu diagnóstico completo e o passo a passo prioritário para começar a ser recomendado pelos robôs.',
    bullets: [
      'Relatório PDF completo no e-mail.',
      'Passo a passo técnico prático e direto.',
      'Comparativo de presença vs rivais.'
    ],
    color: '#EF4444' // red-500
  }
];

export const team: TeamMember[] = [
  {
    id: 't1',
    name: 'Guilherme C. Rossi',
    role: 'FUNDADOR & ESPECIALISTA EM GEO',
    bio: 'Especialista em estratégias de visibilidade digital e posicionamento na nova era das buscas impulsionadas por IA.',
    description: 'Ao longo da minha trajetória, desenvolvi experiência em SEO, marketing digital, produção de conteúdo, estratégia de posicionamento e otimização de presença online. Hoje, aplico esse conhecimento em GEO (Generative Engine Optimization), criando estratégias para aumentar as chances de marcas, produtos e serviços serem encontrados, compreendidos e recomendados por plataformas de IA generativa, como ChatGPT, Claude, Gemini e Perplexity.\n\nMeu objetivo é preparar empresas para um cenário em que as respostas geradas por inteligência artificial influenciam cada vez mais as decisões de compra e a descoberta de marcas. Mais do que melhorar rankings, trabalho para construir autoridade, relevância e presença onde o futuro da busca já está acontecendo.',
    // Para usar sua própria foto: salve o arquivo de imagem na pasta 'public' do projeto com o nome 'guilherme.jpg' e altere este caminho abaixo para '/guilherme.jpg'
    image: '/guilherme.jpg',
    socials: {
      linkedin: '#'
    }
  }
];

export const pricingPlans: PricingPlan[] = [
  {
    id: 'pl1',
    name: 'GEO Diagnóstico',
    price: 'Grátis',
    billing: '',
    duration: 'Relatório imediato',
    color: '#71717A',
    bullets: [
      'Varredura de Menções Inicial',
      'Análise de robots.txt de IA',
      'Análise Básica de Conteúdo e AEO',
      'Relatório PDF enviado por e-mail',
      'Suporte via e-mail corporativo'
    ],
    buttonText: 'Solicitar Grátis',
    cardImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=100'
  },
  {
    id: 'pl2',
    name: 'Implantação Premium',
    price: 'R$ 497,00',
    billing: '/mês',
    duration: 'Mínimo de 6 meses',
    color: '#EF4444',
    bullets: [
      'Mapeamento Completo de Entidades',
      'Reescrita de Conteúdo para Princeton Study',
      'Desenvolvimento de Schema Markup JSON-LD',
      'Acompanhamento Mensal de GEO-Score',
      'Otimização AEO para Top 10 Produtos/Serviços',
      'Suporte direto com Guilherme C. Rossi'
    ],
    buttonText: 'Falar com Especialista',
    cardImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=100'
  },
  {
    id: 'pl3',
    name: 'b.rocket Enterprise',
    price: 'Sob Consulta',
    billing: '',
    duration: 'Anual corporativo',
    color: '#18181B',
    bullets: [
      'GEO focado em Múltiplos Idiomas',
      'Acesso Imediato à API de Mapeamento b.rocket',
      'Consultoria Técnica e de RAG com Guilherme',
      'Customização de Crawlers e Servidor',
      'Garantia Contratual de Indexação Corporativa',
      'SLA de 2 Horas para Ajustes Críticos'
    ],
    buttonText: 'Agendar Reunião',
    cardImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=100'
  }
];

export const faqs: FAQItem[] = [
  {
    id: 'fq1',
    question: 'Qual é a diferença real entre SEO e GEO?',
    answer: 'O SEO foca em posicionar links azuis em uma lista estática de buscas. O GEO (Generative Engine Optimization) prepara toda a estrutura técnica, de linguagem e dados estruturados do seu site para que ele seja a matéria-prima utilizada e citada pelas IAs para responder aos usuários.'
  },
  {
    id: 'fq2',
    question: 'O diagnóstico é realmente gratuito?',
    answer: 'Sim. O nosso objetivo com o Raio-X de GEO é revelar os pontos cegos de posicionamento do seu negócio. Se você identificar riscos graves e desejar nossa ajuda de especialistas para reestruturar suas páginas, dados estruturados ou arquitetura de conteúdo, podemos apresentar nossos serviços de implantação premium. Mas o relatório é seu, sem qualquer compromisso.'
  },
  {
    id: 'fq3',
    question: 'Como a Inteligência Artificial decide quem citar?',
    answer: 'As LLMs não buscam por correspondências exatas de palavras-chave repetidas como o Google antigo fazia. Elas usam Busca Vetorial (embeddings) para aproximar conceitos semânticos e priorizam fontes com alta autoridade (E-E-A-T), dados de estatísticas numéricas reais e estruturas escaneáveis de fácil processamento (JSON-LD Schemas e tabelas).'
  },
  {
    id: 'fq4',
    question: 'Como funciona o processamento RAG de IA?',
    answer: 'RAG significa Retrieval-Augmented Generation (Geração Aumentada de Recuperação). Quando o usuário faz uma pergunta, plataformas como ChatGPT, Claude, Gemini e Perplexity primeiro fazem uma busca rápida em tempo real nos sites indexados (Fase de Recuperação). Em seguida, elas leem o conteúdo recuperado, sintetizam-no e respondem ao usuário citando a fonte. Se seu site não for recuperável, você nunca será citado.'
  },
  {
    id: 'fq5',
    question: 'Quais ferramentas de busca por IA são analisadas no Raio-X?',
    answer: 'Analisamos a presença da sua marca nas respostas estruturadas das quatro principais plataformas do mercado atual: ChatGPT, Claude, Gemini e Perplexity.'
  }
];
