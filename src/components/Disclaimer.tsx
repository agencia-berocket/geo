import LegalPageLayout from './LegalPageLayout';

const disclaimerSections = [
  {
    title: 'Declaração Geral de Isenção',
    content: [
      'A BE ROCKET AGENCIA DIGITAL LTDA ("b.rocket"), inscrita no CNPJ sob o nº 37.375.164/0001-03, disponibiliza este documento com o objetivo de esclarecer as limitações, o escopo e a natureza dos serviços e conteúdos oferecidos por meio de seu site, plataformas e materiais digitais.',
      'Ao acessar nosso site ou contratar nossos serviços, você reconhece e aceita as limitações descritas neste documento. Recomendamos a leitura integral antes de tomar qualquer decisão com base em informações ou serviços fornecidos pela b.rocket.'
    ]
  },
  {
    title: 'Natureza dos Serviços de GEO',
    content: [
      'Os serviços de Generative Engine Optimization (GEO) oferecidos pela b.rocket são de natureza técnica e consultiva, baseados em metodologias fundamentadas em estudos científicos (incluindo pesquisas publicadas por instituições como Princeton, Georgia Tech e IIT Delhi) e em nossa experiência prática no mercado.',
      'O GEO é uma disciplina emergente que evolui rapidamente conforme os avanços das plataformas de inteligência artificial. As recomendações e estratégias implementadas refletem o estado atual da tecnologia e do conhecimento na data de execução e podem necessitar de ajustes conforme a evolução dos algoritmos de IA.'
    ]
  },
  {
    title: 'Ausência de Garantia de Resultados',
    content: [
      'A b.rocket NÃO garante resultados específicos, incluindo, mas não se limitando a: posições de destaque em respostas geradas por ChatGPT, Claude, Gemini, Perplexity ou qualquer outra plataforma de IA; volume determinado de citações, menções ou recomendações por modelos de linguagem; aumento específico de tráfego, leads, conversões ou faturamento; manutenção permanente de resultados obtidos após a implementação.',
      'As plataformas de inteligência artificial são controladas por empresas terceiras (OpenAI, Anthropic, Google, Perplexity AI) que alteram seus algoritmos, modelos de treinamento e políticas de indexação de forma independente e sem aviso prévio. A b.rocket não possui controle, influência ou acesso privilegiado sobre essas plataformas.'
    ]
  },
  {
    title: 'Conteúdo Informativo e Educacional',
    content: [
      'Todo o conteúdo publicado no site da b.rocket — incluindo artigos, posts de blog, estudos de caso, infográficos, vídeos, materiais de newsletter e apresentações — tem caráter estritamente informativo e educacional. Nenhum conteúdo deve ser interpretado como aconselhamento profissional definitivo, garantia de performance ou recomendação personalizada.',
      'As análises de mercado, dados estatísticos e projeções apresentados em nossos materiais baseiam-se em fontes consideradas confiáveis na data de publicação, mas podem tornar-se desatualizados. A b.rocket não se responsabiliza por decisões tomadas exclusivamente com base nesses conteúdos sem consultoria personalizada.'
    ]
  },
  {
    title: 'Diagnósticos e Relatórios',
    content: [
      'Os diagnósticos gratuitos e relatórios em PDF gerados pela b.rocket representam uma análise pontual (snapshot) da presença digital do seu negócio no momento da execução. Os resultados podem variar significativamente em períodos curtos devido a atualizações de algoritmos, mudanças no corpus de treinamento das LLMs e alterações feitas por terceiros nos conteúdos da web.',
      'Os relatórios não substituem uma auditoria técnica completa realizada por profissionais especializados em cada área específica (desenvolvimento web, segurança da informação, direito digital, etc.). Recomendamos sempre a validação com especialistas complementares para implementação de mudanças críticas.'
    ]
  },
  {
    title: 'Links e Serviços de Terceiros',
    content: [
      'Nosso site pode conter links para websites, plataformas e serviços de terceiros. Esses links são fornecidos apenas por conveniência e não implicam endosso, patrocínio, afiliação ou responsabilidade da b.rocket sobre o conteúdo, políticas de privacidade, práticas ou disponibilidade desses sites externos.',
      'A b.rocket não se responsabiliza por danos, prejuízos ou perdas que possam decorrer do acesso ou uso de qualquer site, plataforma ou serviço de terceiros acessado a partir do nosso site. O acesso é feito por conta e risco exclusivo do usuário.'
    ]
  },
  {
    title: 'Limitação de Responsabilidade',
    content: [
      'Na extensão máxima permitida pela legislação brasileira, a b.rocket, seus sócios, colaboradores, parceiros e prestadores de serviços não serão responsáveis por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação: perda de lucros, receitas, dados, oportunidades de negócio ou boa vontade comercial; custos de aquisição de serviços substitutos; interrupção de negócios ou indisponibilidade de sistemas; e danos à reputação decorrentes de resultados não alcançados.',
      'A responsabilidade total e acumulada da b.rocket, em qualquer hipótese, estará limitada ao valor efetivamente pago pelo cliente pelos serviços nos 12 (doze) meses anteriores ao evento que deu origem à reclamação.'
    ]
  },
  {
    title: 'Força Maior e Caso Fortuito',
    content: 'A b.rocket não será responsável por falhas, atrasos ou impossibilidade de cumprimento de obrigações decorrentes de eventos de força maior ou caso fortuito, incluindo, sem limitação: desastres naturais, epidemias, pandemias, atos governamentais, guerras, atos de terrorismo, falhas generalizadas de infraestrutura de telecomunicações ou internet, ataques cibernéticos (DDoS, ransomware), alterações unilaterais e sem aviso prévio nas APIs, políticas ou algoritmos das plataformas de IA, e greves ou paralisações que afetem a prestação dos serviços.'
  },
  {
    title: 'Uso Ético e Responsável',
    content: [
      'A b.rocket está comprometida com práticas éticas e transparentes de otimização digital. Nossos serviços NÃO incluem: manipulação artificial de resultados de IA por meios ilícitos; criação de conteúdo falso, enganoso ou que induza ao erro; práticas de spam, link farming ou esquemas de black-hat; violação de termos de serviço das plataformas de IA.',
      'Caso identifiquemos que um cliente pretende utilizar nossos serviços para fins antiéticos, fraudulentos ou ilegais, reservamo-nos o direito de encerrar imediatamente a relação comercial, sem direito a reembolso proporcional.'
    ]
  },
  {
    title: 'Atualizações desta Isenção',
    content: 'Este documento de Isenção de Responsabilidade poderá ser atualizado periodicamente para refletir mudanças em nossos serviços, na tecnologia ou na legislação aplicável. A versão mais recente estará sempre disponível nesta página, com a data da última atualização indicada no topo. Recomendamos a revisão periódica deste documento.'
  },
  {
    title: 'Contato',
    content: [
      'Para dúvidas, esclarecimentos ou solicitações relacionadas a este documento de Isenção de Responsabilidade, entre em contato conosco:',
      'BE ROCKET AGENCIA DIGITAL LTDA — CNPJ: 37.375.164/0001-03 | E-mail: berocket@berocket.com.br | Telefone: (11) 94059-5792'
    ]
  }
];

export default function Disclaimer() {
  return (
    <LegalPageLayout
      title="Isenção de Responsabilidade"
      subtitle="Limitações, escopo e natureza dos nossos serviços de Generative Engine Optimization e conteúdos informativos."
      lastUpdated="08 de Julho de 2026"
      sections={disclaimerSections}
    />
  );
}
