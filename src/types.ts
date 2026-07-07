export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  color: string;
  client: string;
  year: string;
  description: string;
  detailedAnalysis?: {
    whyItIsCritical: string;
    howWeAudit: string;
    metricsDelivered: string[];
    recommendedActions: string[];
  };
}

export interface Service {
  id: string;
  title: string;
  technicalLabel: string;
  index: string;
  description: string;
  details: string[];
  graphicType: 'spheres' | 'nodes' | 'circuits' | 'geometrics';
}

export interface Award {
  id: string;
  organization: string;
  award: string;
  recipient: string;
}

export interface Stat {
  id: string;
  value: number;
  suffix: string;
  title: string;
  description: string;
}

export interface ProcessStep {
  id: string;
  index: string;
  title: string;
  timeframe: string;
  description: string;
  bullets: string[];
  color: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  description: string;
  image: string;
  socials: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  billing: string;
  duration: string;
  bullets: string[];
  color: string;
  buttonText: string;
  cardImage: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  image: string;
}
