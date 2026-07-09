import LegalPageLayout from './LegalPageLayout';

const privacySections = [
  {
    title: 'Introdução e Compromisso',
    content: [
      'A BE ROCKET AGENCIA DIGITAL LTDA ("b.rocket", "nós", "nosso"), inscrita no CNPJ sob o nº 37.375.164/0001-03, está comprometida com a proteção da privacidade e dos dados pessoais de todos os usuários ("você", "usuário") que acessam nosso site, plataformas e serviços digitais.',
      'Esta Política de Privacidade descreve como coletamos, usamos, armazenamos, compartilhamos e protegemos suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e demais legislações aplicáveis.'
    ]
  },
  {
    title: 'Dados que Coletamos',
    content: [
      'Coletamos informações que você nos fornece diretamente ao utilizar nossos serviços, incluindo: nome completo, endereço de e-mail, número de telefone, URL do site e informações profissionais fornecidas via formulários de contato, agendamento de reuniões ou inscrição em nossa newsletter.',
      'Também coletamos automaticamente dados de navegação, como endereço IP, tipo de navegador, sistema operacional, páginas visitadas, tempo de permanência, origem do tráfego (referral) e informações de cookies e tecnologias similares. Esses dados são utilizados exclusivamente para fins analíticos e de melhoria contínua da experiência do usuário.'
    ]
  },
  {
    title: 'Finalidade do Tratamento de Dados',
    content: [
      'Utilizamos seus dados pessoais para as seguintes finalidades: (i) prestação dos serviços contratados de GEO (Generative Engine Optimization), diagnósticos de presença digital e consultoria especializada; (ii) envio de comunicações relacionadas aos serviços, incluindo relatórios em PDF, acompanhamento de progresso e suporte técnico; (iii) envio de conteúdo informativo por meio de nossa newsletter, caso você tenha consentido expressamente.',
      'Adicionalmente, seus dados poderão ser tratados para: (iv) análise estatística e melhoria contínua de nossos serviços e plataformas; (v) cumprimento de obrigações legais, regulatórias ou judiciais; (vi) proteção dos direitos da b.rocket em processos administrativos, judiciais ou arbitrais.'
    ]
  },
  {
    title: 'Base Legal para o Tratamento',
    content: [
      'O tratamento dos seus dados pessoais pela b.rocket é fundamentado nas seguintes bases legais previstas na LGPD: consentimento do titular (Art. 7º, I) — especialmente para envio de newsletter e comunicações de marketing; execução de contrato ou procedimentos preliminares relacionados a contrato (Art. 7º, V); legítimo interesse do controlador (Art. 7º, IX) — para melhoria de serviços, análises estatísticas e prevenção de fraudes; e cumprimento de obrigação legal ou regulatória (Art. 7º, II).',
      'Você pode revogar seu consentimento a qualquer momento, sem prejuízo da legalidade do tratamento realizado anteriormente com base no consentimento.'
    ]
  },
  {
    title: 'Compartilhamento de Dados',
    content: [
      'A b.rocket não comercializa, aluga ou repassa seus dados pessoais a terceiros para fins publicitários sem o seu consentimento expresso.',
      'Seus dados poderão ser compartilhados com: (i) prestadores de serviços essenciais à operação, como plataformas de hospedagem (Firebase/Google Cloud), serviços de e-mail transacional, ferramentas de analytics e processadores de pagamento, todos submetidos a contratos de proteção de dados; (ii) autoridades governamentais ou judiciais, quando exigido por lei ou ordem judicial; (iii) assessores jurídicos e contábeis, sob estrita confidencialidade.'
    ]
  },
  {
    title: 'Armazenamento e Segurança',
    content: [
      'Adotamos medidas técnicas e organizacionais apropriadas para proteger seus dados pessoais contra acessos não autorizados, destruição, perda, alteração ou qualquer forma de tratamento inadequado. Isso inclui criptografia de dados em trânsito (SSL/TLS), controle de acesso baseado em função (RBAC), backups regulares e monitoramento contínuo de segurança.',
      'Os dados pessoais são armazenados pelo período necessário ao cumprimento das finalidades descritas nesta Política ou pelo prazo exigido por lei. Após esse período, os dados serão anonimizados ou eliminados de forma segura, salvo quando houver obrigação legal de conservação.'
    ]
  },
  {
    title: 'Cookies e Tecnologias de Rastreamento',
    content: [
      'Utilizamos cookies e tecnologias similares para melhorar a experiência de navegação, analisar métricas de uso e personalizar conteúdo. Os cookies que utilizamos incluem: cookies essenciais (necessários ao funcionamento do site), cookies analíticos (Google Analytics ou similares, para compreensão de tráfego e comportamento de navegação) e cookies de preferência (para armazenar configurações do usuário).',
      'Você pode gerenciar suas preferências de cookies diretamente nas configurações do seu navegador. A desativação de certos cookies poderá impactar funcionalidades do site.'
    ]
  },
  {
    title: 'Seus Direitos como Titular de Dados',
    content: [
      'Em conformidade com a LGPD, você possui os seguintes direitos: confirmação da existência de tratamento de dados; acesso aos dados pessoais tratados; correção de dados incompletos, inexatos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei; portabilidade dos dados a outro fornecedor de serviço; eliminação dos dados pessoais tratados com consentimento; informação sobre as entidades públicas e privadas com as quais compartilhamos seus dados; e revogação do consentimento.',
      'Para exercer qualquer um desses direitos, entre em contato conosco pelo e-mail berocket@berocket.com.br. Responderemos à sua solicitação dentro do prazo legal.'
    ]
  },
  {
    title: 'Transferência Internacional de Dados',
    content: 'Seus dados podem ser processados em servidores localizados fora do Brasil, especificamente em infraestrutura cloud da Google (Firebase/Google Cloud Platform). Nesses casos, garantimos que a transferência internacional de dados observa padrões adequados de proteção, em conformidade com o Capítulo V da LGPD, incluindo a adoção de cláusulas contratuais padrão e a verificação de que o país de destino oferece grau de proteção de dados pessoais adequado.'
  },
  {
    title: 'Alterações nesta Política',
    content: 'A b.rocket reserva-se o direito de atualizar esta Política de Privacidade a qualquer momento, para refletir mudanças em nossas práticas de tratamento de dados, alterações legislativas ou melhorias em nossos serviços. A versão mais recente estará sempre disponível nesta página, com a data da última atualização indicada no topo. Recomendamos que você revise esta Política periodicamente.'
  },
  {
    title: 'Contato e Encarregado de Dados (DPO)',
    content: [
      'Para dúvidas, solicitações ou reclamações relacionadas à privacidade e proteção de dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados:',
      'E-mail: berocket@berocket.com.br | Telefone: (11) 94059-5792',
      'Caso você entenda que o tratamento dos seus dados pessoais foi realizado em desacordo com a legislação, você tem o direito de apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).'
    ]
  }
];

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      subtitle="Transparência total sobre como coletamos, utilizamos e protegemos seus dados pessoais, em conformidade com a LGPD."
      lastUpdated="08 de Julho de 2026"
      sections={privacySections}
    />
  );
}
