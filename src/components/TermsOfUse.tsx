import LegalPageLayout from './LegalPageLayout';

const termsSections = [
  {
    title: 'Aceitação dos Termos',
    content: [
      'Ao acessar, navegar ou utilizar qualquer funcionalidade do site e dos serviços oferecidos pela BE ROCKET AGENCIA DIGITAL LTDA ("b.rocket"), inscrita no CNPJ sob o nº 37.375.164/0001-03, você declara que leu, compreendeu e concorda integralmente com os presentes Termos de Uso.',
      'Caso você não concorde com qualquer disposição destes Termos, solicitamos que interrompa imediatamente o uso do site e dos serviços. A utilização continuada do site após eventuais modificações constitui aceitação tácita dos Termos atualizados.'
    ]
  },
  {
    title: 'Descrição dos Serviços',
    content: [
      'A b.rocket é uma agência digital especializada em Generative Engine Optimization (GEO), oferecendo serviços que incluem, mas não se limitam a: diagnósticos de presença digital em plataformas de inteligência artificial (ChatGPT, Claude, Gemini, Perplexity); auditoria técnica de robots.txt, dados estruturados e arquitetura semântica; otimização de conteúdo para Answer Engine Optimization (AEO); desenvolvimento de Schema Markup JSON-LD avançado; consultoria estratégica de posicionamento em buscas vetoriais e por IA.',
      'Os serviços são prestados conforme os planos e condições descritos em nosso site e/ou em contratos específicos firmados entre as partes.'
    ]
  },
  {
    title: 'Cadastro e Informações do Usuário',
    content: [
      'Para utilizar determinados serviços, como o diagnóstico gratuito de GEO ou o agendamento de reuniões, poderá ser necessário fornecer informações pessoais e profissionais, incluindo nome, e-mail corporativo e URL do seu site.',
      'Você se compromete a fornecer informações verdadeiras, atualizadas e completas. A b.rocket não se responsabiliza por problemas decorrentes de informações incorretas, falsas ou desatualizadas fornecidas pelo usuário.'
    ]
  },
  {
    title: 'Propriedade Intelectual',
    content: [
      'Todo o conteúdo presente no site da b.rocket — incluindo, sem limitação, textos, logotipos, marcas, ícones, imagens, vídeos, animações, códigos-fonte, layouts, design gráfico, metodologias proprietárias e relatórios — é de propriedade exclusiva da BE ROCKET AGENCIA DIGITAL LTDA ou de seus licenciadores, estando protegido pelas leis brasileiras e tratados internacionais de propriedade intelectual.',
      'É expressamente proibida a reprodução, distribuição, modificação, engenharia reversa, descompilação ou criação de obras derivadas baseadas em qualquer material da b.rocket sem autorização prévia e por escrito. A metodologia GEO proprietária da b.rocket, incluindo frameworks de diagnóstico, algoritmos de análise e processos de otimização, constitui segredo comercial e know-how protegido.'
    ]
  },
  {
    title: 'Obrigações do Usuário',
    content: [
      'Ao utilizar os serviços da b.rocket, o usuário se compromete a: utilizar o site e os serviços de forma lícita, ética e em conformidade com a legislação brasileira vigente; não tentar acessar áreas restritas do sistema, bancos de dados ou informações confidenciais sem autorização; não utilizar ferramentas automatizadas (bots, scrapers) para coletar dados do site sem autorização expressa; não reproduzir, copiar ou distribuir conteúdo protegido por direitos de propriedade intelectual da b.rocket.',
      'O descumprimento de qualquer dessas obrigações poderá resultar na suspensão ou encerramento imediato do acesso aos serviços, sem prejuízo das medidas legais cabíveis.'
    ]
  },
  {
    title: 'Condições de Pagamento',
    content: [
      'Os valores, formas de pagamento, periodicidade de cobrança e condições comerciais dos serviços pagos oferecidos pela b.rocket são os descritos nas páginas de preços do site ou em propostas comerciais e contratos específicos firmados entre as partes.',
      'O não pagamento dos valores devidos nas datas acordadas poderá resultar na suspensão dos serviços, aplicação de juros moratórios de 1% ao mês, multa de 2% e correção monetária pelo IPCA, sem prejuízo da cobrança judicial ou extrajudicial dos débitos.'
    ]
  },
  {
    title: 'Prazo e Rescisão',
    content: [
      'Os serviços de implantação premium da b.rocket estão sujeitos a um prazo mínimo de vigência conforme especificado no plano contratado (por exemplo, 6 meses para o Plano de Implantação Premium). A rescisão antecipada pelo cliente, sem justa causa, poderá implicar a cobrança de multa rescisória equivalente a 50% do valor restante do contrato.',
      'A b.rocket reserva-se o direito de rescindir contratos em caso de inadimplência, fornecimento de informações falsas, violação destes Termos ou de disposições legais, mediante notificação prévia por escrito.'
    ]
  },
  {
    title: 'Disponibilidade e Manutenção',
    content: [
      'A b.rocket empreende esforços razoáveis para manter o site e seus serviços disponíveis de forma ininterrupta. No entanto, não garantimos disponibilidade contínua, podendo ocorrer interrupções para manutenção preventiva, corretiva, atualizações de sistema ou por motivos de força maior.',
      'A b.rocket não será responsável por indisponibilidades temporárias causadas por falhas em serviços de terceiros, incluindo provedores de hospedagem, provedores de internet ou plataformas de inteligência artificial utilizadas nos diagnósticos.'
    ]
  },
  {
    title: 'Limitação de Responsabilidade',
    content: [
      'A b.rocket não garante resultados específicos de posicionamento, tráfego ou citações em plataformas de IA, uma vez que tais resultados dependem de algoritmos e políticas de terceiros sobre os quais não temos controle direto. Nossos serviços visam maximizar as chances de visibilidade e recomendação, com base em metodologias técnicas fundamentadas em estudos científicos.',
      'Em nenhuma hipótese a b.rocket será responsável por danos indiretos, incidentais, consequenciais, punitivos ou especiais, incluindo, sem limitação, lucros cessantes, perda de dados, interrupção de negócios ou danos à reputação decorrentes do uso ou impossibilidade de uso dos serviços.'
    ]
  },
  {
    title: 'Modificações dos Termos',
    content: 'A b.rocket reserva-se o direito de alterar, modificar ou atualizar estes Termos de Uso a qualquer momento, a seu exclusivo critério. As alterações entrarão em vigor imediatamente após a publicação da versão atualizada no site. A data da última atualização será sempre indicada no topo desta página. Recomendamos que os usuários revisem estes Termos periodicamente.'
  },
  {
    title: 'Lei Aplicável e Foro',
    content: [
      'Estes Termos de Uso são regidos e interpretados de acordo com as leis da República Federativa do Brasil. As partes elegem o foro da Comarca de São Paulo, Estado de São Paulo, como competente para dirimir quaisquer controvérsias oriundas destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.',
      'Antes de recorrer ao Poder Judiciário, as partes se comprometem a buscar a resolução amigável de eventuais conflitos no prazo de 30 (trinta) dias a partir da notificação formal do litígio.'
    ]
  }
];

export default function TermsOfUse() {
  return (
    <LegalPageLayout
      title="Termos de Uso"
      subtitle="Condições gerais que regulam o uso dos nossos serviços digitais, plataformas e soluções de GEO."
      lastUpdated="08 de Julho de 2026"
      sections={termsSections}
    />
  );
}
