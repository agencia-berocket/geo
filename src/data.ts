import { Project, Service, Stat, ProcessStep, TeamMember, PricingPlan, FAQItem } from './types';

export const projects: Project[] = [
  {
    id: 'p1',
    title: 'VARREDURA',
    subtitle: 'Análise de Citação e Varredura',
    category: 'Diagnóstico 01',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800&sat=-100',
    color: '#EF4444', // red
    client: 'ChatGPT, Claude, Gemini, Perplexity',
    year: '2026',
    description: 'Mapeamos em tempo real a presença, a percepção e o volume de recomendações espontâneas que a sua marca possui nos principais motores de IA.',
    detailedAnalysis: {
      whyItIsCritical: 'Se o seu negócio não for citado no ChatGPT, Gemini, Perplexity e Claude, você deixa de existir para os clientes que utilizam essas plataformas para decidir compras.',
      howWeAudit: 'Realizamos testes práticos com dezenas de cenários de prompts reais de clientes e medimos em tempo real a taxa de recomendação.',
      metricsDelivered: [
        'Share of Model (SoM): A porcentagem de recomendação da sua empresa em comparação direta com os seus principais concorrentes de mercado.',
        'Atributos de Marca: Quais características diferenciais a inteligência artificial reconhece e associa ao seu produto ou serviço.',
        'Alinhamento Semântico: Verificação se as respostas geradas pelas LLMs estão em sintonia com a identidade real da sua empresa.'
      ],
      recommendedActions: [
        'Criamos roteiros práticos de relações públicas digitais para atualizar e enriquecer as bases de dados que servem de fontes primárias para as IAs.',
        'Otimizamos estruturas de perguntas e respostas (Q&As) mapeando as exatas intenções dos usuários.'
      ]
    }
  },
  {
    id: 'p2',
    title: 'CRAWLERS',
    subtitle: 'Acessibilidade de Crawlers e Servidor',
    category: 'Diagnóstico 02',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800&sat=-100',
    color: '#18181B', // dark gray
    client: 'ChatGPT, Claude, Gemini, Perplexity',
    year: '2026',
    description: 'Verificamos se as configurações do seu servidor e arquivos de controle estão impedindo ou facilitando a varredura das IAs.',
    detailedAnalysis: {
      whyItIsCritical: 'Muitas empresas configuram incorretamente suas ferramentas de segurança e acabam bloqueando acidentalmente os robôs de busca das IAs generativas.',
      howWeAudit: 'Testamos a acessibilidade do seu site simulando os robôs rastreadores mais rápidos do mercado.',
      metricsDelivered: [
        'Acessibilidade do Agente: Status de permissão detalhado para mais de 12 rastreadores oficiais de inteligência artificial.',
        'Velocidade de Resposta: Tempo necessário de entrega de dados do seu servidor para evitar que o robô desista de indexar sua página.',
        'Estruturação Dinâmica: Identificação se o seu conteúdo interativo está sendo processado de forma adequada para leitura imediata dos algoritmos.'
      ],
      recommendedActions: [
        'Ajustamos as permissões do seu arquivo robots.txt, garantindo o livre acesso para indexadores rápidos e protegendo dados sensíveis.',
        'Apoiamos na implementação de Server-Side Rendering (SSR) e ajustes de segurança na sua CDN para eliminar barreiras.'
      ]
    }
  },
  {
    id: 'p3',
    title: 'ON-PAGE',
    subtitle: 'Arquitetura On-Page e Semântica',
    category: 'Diagnóstico 03',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800&sat=-100',
    color: '#3B82F6', // blue
    client: 'Schema JSON-LD & Entity Markup',
    year: '2026',
    description: 'Medimos a estrutura informativa do seu HTML e implementamos códigos JSON-LD invisíveis que alimentam a base das redes neurais.',
    detailedAnalysis: {
      whyItIsCritical: 'Os algoritmos de IA decifram o seu site buscando dados estatísticos concretos e conexões hierárquicas claras. Se o seu texto for institucional ou confuso, o algoritmo o descarta.',
      howWeAudit: 'Analisamos a densidade informativa e rastreamos o código do seu site em busca de erros semânticos.',
      metricsDelivered: [
        'Índice de Legibilidade por LLM: Avaliação matemática de quão fácil e sem ruídos é a leitura do seu site pelas inteligências artificiais.',
        'Densidade de Dados: Proporção exata entre dados numéricos e substantivos concretos em relação a palavras de preenchimento ou adjetivos redundantes.',
        'Validação de Schema: Detecção de ausências ou erros nos códigos invisíveis JSON-LD do seu site.'
      ],
      recommendedActions: [
        'Reescrevemos trechos de copy baseando-nos nas metodologias científicas de Princeton, garantindo respostas estruturadas de alto impacto.',
        'Implementamos esquemas JSON-LD com marcadores avançados direcionando a verbetes consolidados (Wikipedia/Wikidata), criando uma autoridade semântica instantânea para sua marca.'
      ]
    }
  },
  {
    id: 'p4',
    title: 'SENTIMENTO',
    subtitle: 'Brand Sentiment & Reputação',
    category: 'Diagnóstico 04',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800&sat=-100',
    color: '#EF4444', // red
    client: 'Análise de Reputação Vetorial',
    year: '2026',
    description: 'Identificação cirúrgica de como as LLMs descrevem sua marca em comparações diretas de mercado e posicionamento.',
    detailedAnalysis: {
      whyItIsCritical: 'Ao recomendar uma marca, os modelos de IA consideram o sentimento geral associado a ela em todas as fontes indexadas e seu peso no espaço vetorial.',
      howWeAudit: 'Utilizamos técnicas de análise de sentimento baseadas em embeddings de linguagem natural para medir a distância vetorial cosseno entre o nome do seu negócio e conceitos de autoridade.',
      metricsDelivered: [
        'Índice de Similaridade Cosseno: Proximidade vetorial com atributos de "líder de mercado" ou "marca recomendada".',
        'Polaridade de Sentimento das LLMs: Proporção de respostas positivas, neutras ou com ressalvas negativas.',
        'Benchmark de Competitividade: Comparação de relevância e autoridade vetorial contra 3 concorrentes diretos.'
      ],
      recommendedActions: [
        'Coordenar uma estratégia de assessoria de imprensa digital para semear menções de marca em portais de alta reputação.',
        'Resolver pontualmente focos de reputação negativa que alimentam o corpus de treinamento das IAs.'
      ]
    }
  }
];

export const services: Service[] = [
  {
    id: 's1',
    title: 'E-E-A-T Avançado',
    technicalLabel: 'Otimização de Autoridade e Confiança Científica',
    index: '.01',
    description: 'As inteligências artificiais priorizam fontes escritas por especialistas com autoridade verificável. Nós inserimos dados estatísticos, referências e criamos marcações avançadas para provar a veracidade das informações apresentadas.',
    details: [
      'Criação de Perfil de Autor estruturado via Schema Markup',
      'Enriquecimento de copy com estatísticas e dados numéricos verificáveis',
      'Validação de referências de mercado e tom de escrita neutro e transparente'
    ],
    graphicType: 'nodes'
  },
  {
    id: 's2',
    title: 'Fragmentação Eficiente',
    technicalLabel: 'Otimização de Chunks de Texto',
    index: '.02',
    description: 'Dividimos o conteúdo do seu site de forma que os robôs consigam "recortar e colar" trechos lógicos isolados de forma limpa, selecionando a sua empresa no momento de responder ao prompt de busca do usuário.',
    details: [
      'Organização lógica de cabeçalhos HTML (Hierarquia de H1 > H2 > H3)',
      'Divisão de conteúdo em blocos independentes de significado (Chunking Inteligente)',
      'Construção de listas e tabelas semânticas para indexação imediata pelas LLMs'
    ],
    graphicType: 'geometrics'
  },
  {
    id: 's3',
    title: 'Fórmula Direto ao Ponto',
    technicalLabel: 'Otimização para Respostas Rápidas',
    index: '.03',
    description: 'Se o seu site não fornecer a resposta exata para as principais dúvidas do usuário nas primeiras 60 palavras do parágrafo, as IAs generativas descartam a leitura e recomendam outra marca.',
    details: [
      'Reformulação de parágrafos fundamentais sob o padrão de busca direta (AEO)',
      'Criação de respostas altamente específicas para os anseios do usuário',
      'Eliminação de expressões institucionais, redundâncias e termos clichês que diluem a copy'
    ],
    graphicType: 'spheres'
  },
  {
    id: 's4',
    title: 'Estruturação de Entidades',
    technicalLabel: 'Mapeamento de Embeddings',
    index: '.04',
    description: 'Conectamos o seu site ao mapa de conhecimento mundial das IAs, utilizando vetores matemáticos multidimensionais (embeddings) para que os robôs entendam a relevância semântica da sua empresa por associação e contexto de busca.',
    details: [
      'Calibração de similaridade vetorial cosseno do seu site',
      'Configuração avançada de Schema JSON-LD de Organização, Personas e Serviços',
      'Criação de arquivos de metadados focados em LLMs, como o arquivo llms.txt'
    ],
    graphicType: 'circuits'
  }
];

export const stats: Stat[] = [
  {
    id: 'st1',
    value: 40,
    suffix: '%',
    title: 'Citação nas LLMs',
    description: 'O aumento médio verificado na chance de recomendação ativa pelas maiores inteligências artificiais do mundo após a aplicação do método de GEO de Princeton.'
  },
  {
    id: 'st2',
    value: 65,
    suffix: '%',
    title: 'Transição nas Buscas',
    description: 'A porcentagem de tomadores de decisão B2B e de consumidores premium que já estão utilizando assistentes virtuais de IA no lugar do Google para pesquisar soluções.'
  },
  {
    id: 'st3',
    value: 0,
    suffix: ' Cliques',
    title: 'Google Clássico',
    description: 'A fração crescente de pesquisas diárias que são resolvidas integralmente dentro da caixa do ChatGPT, Claude ou Gemini, eliminando a chance do usuário clicar em links tradicionais.'
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
    title: 'Preencha Seus Dados',
    timeframe: 'Rápido e Confidencial',
    description: 'Envie o endereço do seu site corporativo e o seu e-mail profissional. Validamos o seu domínio instantaneamente para preparar a análise.',
    bullets: [
      'Inserção segura da URL do site corporativo.',
      'E-mail profissional para entrega do relatório.',
      'Validação instantânea de domínio.'
    ],
    color: '#71717A' // zinc-500
  },
  {
    id: 'pr2',
    index: '/02',
    title: 'Auditoria de GEO',
    timeframe: 'Realizada em até 2 horas',
    description: 'Guilherme Rossi e nossa equipe de engenharia semântica analisam suas páginas contra as permissões dos crawlers, estruturas JSON-LD e fatores do estudo científico de Princeton.',
    bullets: [
      'Análise de acesso aos robôs no robots.txt.',
      'Avaliação de estruturas de Schema JSON-LD.',
      'Cruze com os fatores científicos de Princeton.'
    ],
    color: '#3B82F6' // blue-500
  },
  {
    id: 'pr3',
    index: '/03',
    title: 'Plano de Ação em Arquivo HTML',
    timeframe: 'Entrega Direta por E-mail',
    description: 'Você recebe um e-mail estruturado contendo o relatório em formato Arquivo HTML, detalhando o seu GEO-Score de partida e as principais orientações técnicas e de copy para começar a ser recomendado pelas IAs.',
    bullets: [
      'Relatório detalhado em formato Arquivo HTML.',
      'GEO-Score de partida da sua marca.',
      'Orientações técnicas e de copy prioritárias.'
    ],
    color: '#EF4444' // red-500
  }
];

export const team: TeamMember[] = [
  {
    id: 't1',
    name: 'Guilherme C. Rossi',
    role: 'FUNDADOR & ESPECIALISTA EM GEO',
    bio: 'Especialista em estratégias de visibilidade digital, arquitetura semântica de dados e otimização para a era das buscas sintetizadas por Inteligência Artificial.',
    description: 'Ao longo da minha trajetória profissional, dediquei minha carreira a compreender a arquitetura informativa da web, desenvolvendo estratégias sólidas de SEO, posicionamento corporativo de marcas e redação de experiência para produtos digitais. Diante da rápida transição dos motores de busca clássicos para as respostas diretas sintetizadas, decidi fundar a b.rocket. O meu objetivo pessoal é claro: preparar as marcas e infraestruturas técnicas de dados das empresas para que elas se adaptem e prosperem de forma ética nesse novo ecossistema, gerando confiança e clareza de dados onde o futuro das buscas de alta conversão já está acontecendo.',
    image: '/guilherme.jpg',
    socials: {
      linkedin: 'https://www.linkedin.com/in/guilhermecrossi/'
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
      'Varredura e auditoria básica de menções de marca nas IAs',
      'Análise de compatibilidade de robôs no robots.txt de IA',
      'Diagnóstico básico de copy e conformidade AEO',
      'Relatório técnico completo em formato Arquivo HTML enviado por e-mail',
      'Suporte técnico complementar via e-mail corporativo'
    ],
    buttonText: 'Solicitar meu diagnóstico de GEO Gratuito ➔',
    cardImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=100'
  },
  {
    id: 'pl2',
    name: 'Implantação Premium',
    price: 'R$ 497,00',
    billing: '/mês',
    duration: 'Mínimo de 3 meses',
    color: '#3B82F6',
    bullets: [
      'Mapeamento detalhado e reestruturação semântica de entidades',
      'Reescrita profissional de copy com os fatores de recomendação de Princeton',
      'Desenvolvimento e aplicação de marcações avançadas Schema Markup JSON-LD',
      'Monitoramento e acompanhamento mensal do GEO-Score da sua marca',
      'Otimização completa sob as diretrizes de AEO para os seus 10 serviços ou produtos principais',
      'Suporte técnico e estratégico direto com Guilherme Rossi'
    ],
    buttonText: 'Agendar reunião técnica com o especialista ➔',
    cardImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=100'
  },
  {
    id: 'pl3',
    name: 'GEO Growth',
    price: 'R$ 1.890,00',
    billing: '/mês',
    duration: 'Mínimo de 6 meses',
    color: '#EF4444',
    bullets: [
      'Tudo incluído no plano Implantação Premium',
      'Auditoria de Crawlability Técnica e correções no robots.txt',
      'Otimização Integrada de SEO Clássico (Title, Meta Tags, Alt Tags)',
      'Esquema de Autoridade Avançado (Schema Organization/Person, llms.txt)',
      'Criação de Conteúdo GEO (1 novo Topic Cluster mensal com Princeton)',
      'Relações Públicas Semânticas (Perfil Wikidata e Briefing trimestral)',
      'Scan Mensal de Citation Share (20 prompts em 4 LLMs com auditoria de alucinações)',
      'Checklist Técnico Interativo com códigos prontos para desenvolvedores'
    ],
    buttonText: 'Contratar o plano GEO Growth ➔',
    cardImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=100'
  }
];

export const faqs: FAQItem[] = [
  {
    id: 'fq1',
    question: 'Qual é a diferença real entre SEO e GEO?',
    answer: 'O SEO (Search Engine Optimization) tradicional foca em ranquear o seu site em uma lista estática de links azuis no Google. Isso exige que o usuário clique no seu link para ler o conteúdo. O GEO (Generative Engine Optimization) prepara toda a estrutura técnica de código, dados e copy do seu site para que ele seja a resposta sintetizada diretamente na tela de assistentes de IA como o ChatGPT, Gemini e Claude, citando e recomendando o seu negócio de forma direta ao tomador de decisão.'
  },
  {
    id: 'fq2',
    question: 'Como a Inteligência Artificial decide qual empresa citar ou recomendar?',
    answer: 'Diferente dos buscadores antigos que dependiam do uso excessivo de palavras-chave exatas, as inteligências artificiais utilizam a busca semântica por embeddings (coordenadas matemáticas). Os robôs priorizam marcas que oferecem conteúdos com alta autoridade verificável (E-E-A-T), dados estatísticos concretos, parágrafos objetivos que respondam às dores das primeiras 60 palavras e marcações invisíveis Schema Markup JSON-LD que facilitam a catalogação dos dados.'
  },
  {
    id: 'fq3',
    question: 'Como funciona o diagnóstico de Raio-X de GEO? Ele é realmente gratuito?',
    answer: 'Sim, o diagnóstico em Arquivo HTML é 100% gratuito e não exige nenhum compromisso de contratação. Guilherme Rossi e nosso time de engenharia de dados analisam o seu robots.txt, menções ativas de marca nas LLMs e clareza informativa. O relatório em formato Arquivo HTML de autoavaliação guiada serve para revelar as principais falhas técnicas de visibilidade do seu site. Se você identificar problemas complexos e quiser nossa assessoria estratégica para resolvê-los, poderá agendar uma conversa conosco.'
  },
  {
    id: 'fq4',
    question: 'O que é o processamento de RAG e como ele afeta meu site?',
    answer: 'RAG significa Geração de Respostas Aumentada por Recuperação (Retrieval-Augmented Generation). Quando um usuário faz uma pergunta no ChatGPT, Claude ou Gemini, o robô faz uma varredura em tempo real pela internet buscando fontes seguras de informação (fase de recuperação), lê e sintetiza as páginas selecionadas e responde ao usuário citando os sites utilizados. Se a estrutura ou copy do seu site não forem compatíveis para uma rápida leitura e recuperação semântica, o robô simplesmente nunca citará a sua marca.'
  },
  {
    id: 'fq5',
    question: 'Quais assistentes e plataformas de inteligência artificial são analisados no diagnóstico b.rocket?',
    answer: 'Monitoramos a presença e a qualidade das menções da sua empresa nas quatro maiores plataformas de inteligência artificial gerativa do mercado: ChatGPT, Claude, Gemini e Perplexity.'
  },
  {
    id: 'fq6',
    question: 'Após preencher o formulário no site, quando serei contatado? Vocês enviam spam?',
    answer: 'Nós odiamos spam. Após preencher o seu formulário, Guilherme Rossi enviará o diagnóstico técnico em Arquivo HTML diretamente para o seu e-mail corporativo em até 2 horas úteis. Se os dados informados precisarem de algum detalhamento técnico para a varredura, Guilherme enviará uma mensagem curta e respeitosa em seu WhatsApp profissional para alinhar as prioridades de GEO do seu segmento de mercado. Nenhum dado de contato será utilizado para fins promocionais indesejados.'
  }
];
