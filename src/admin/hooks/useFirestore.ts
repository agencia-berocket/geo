import { useState, useCallback } from 'react';
import { auth } from '../../lib/firebase';

const API_BASE = '/api';

// Obtém o Firebase ID Token do usuário autenticado.
// O ID Token é renovado automaticamente pelo Firebase SDK quando expira (a cada 1h).
async function getAdminToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    // Redirecionar para login se não autenticado
    window.location.href = '/admin';
    throw new Error('Usuário não autenticado.');
  }
  // forceRefresh=false usa o token em cache se ainda válido
  return user.getIdToken(false);
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let token: string;
  try {
    token = await getAdminToken();
  } catch {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
    ...options,
  });

  if (res.status === 401 || res.status === 403) {
    // Token inválido — redirecionar para login
    window.location.href = '/admin';
    throw new Error('Sessão inválida. Redirecionando para o login...');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export type LeadSource = 'lp' | 'mining_google' | 'mining_linkedin' | 'mining_auto' | 'mining_import' | 'direct';
export type LeadTemperature = 'cold' | 'warm' | 'hot' | 'converted' | 'lost';

export interface SentHistoryItem {
  copyKey: string;
  sentAt: string;
  channel: 'email' | 'linkedin';
  subject?: string;
  attachPdf?: boolean;
}

export interface Lead {
  id: string;
  url: string;
  domain?: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  architecture?: string;
  scale?: string;
  createdAt: string;
  status: 'new' | 'processing' | 'completed' | 'converted' | 'unscanned' | 'audited' | 'outreach_ready' | 'contacted';
  source?: LeadSource | string;
  sourceLabel?: string;
  contactName?: string;
  contactRole?: string;
  linkedinUrl?: string;
  niche?: string;
  location?: string;
  companySize?: string;
  temperature?: LeadTemperature;
  sequenceStage?: number;
  responded?: boolean;
  sentHistory?: SentHistoryItem[];
  outreachCopies?: Record<string, string>;
  geoScore?: number;
  geoScoreEstimado?: number;
  diagnosticId?: string;
  searchTerms?: string[];
  searchTermsStatus?: 'pending' | 'generated' | 'approved';
  companyOverview?: string;
  searchTermsAnalyzedAt?: string;
  searchTermsApprovedAt?: string;
  aiCrawlersBlocked?: boolean;
  hasBlog?: boolean;
  hasAnswerFirst?: boolean;
  citedCompetitor?: string;
}

export interface DiagnosticReport {
  id: string;
  leadId: string;
  clientUrl: string;
  niche?: string;
  overallGeoScore: number;
  gatekeeperStatus: {
    robotsTxtAllowAiBots: boolean;
    blockedCrawlers: string[];
    ssrActive: boolean;
    hasPriceGatekeeperIssue: boolean;
    staleTimestampDetected: boolean;
    serverLatencyMs: number;
  };
  metadataAnalysis: {
    organizationSchemaPresent: boolean;
    organizationSameAsCount: number;
    personSchemaPresent: boolean;
    llmsTxtPublished: boolean;
    schemasFound: string[];
    missingSchemas: string[];
  };
  contentReview: {
    meanChunkSizeTokens: number;
    factorsDetected: {
      hasTldrAnswerFirstParagraph: boolean;
      hasStatisticsPer150Words: boolean;
      hasExpertQuotes: boolean;
      hasHtmlComparisonTables: boolean;
    };
    linguisticDensity: {
      hedgedLanguageScore: number;
      keywordStuffingDetected: boolean;
    };
    priceNotMentioned: boolean;
  };
  visibilityBenchmarking: {
    totalPromptsTest: number;
    citationSharePercentage: number;
    brandSentimentScore: string;
    topMentionedCompetitors: string[];
    citationsByModel: Record<string, number>;
  };
  actionItemsPriorityList: Array<{
    step: number;
    agentOwner: string;
    impact: string;
    task: string;
  }>;
  generatedAt: string;
  htmlReportPath?: string;
  htmlReportContent?: string;
}

export interface Client {
  id: string;
  leadId: string;
  url: string;
  email: string;
  name: string;
  company: string;
  plan: 'premium' | 'enterprise';
  currentStage: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
  geoScoreHistory: Array<{ date: string; score: number }>;
  notes?: string;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ leads: Lead[] }>('/admin/leads');
      setLeads(data.leads);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addLead = useCallback(async (data: {
    url: string;
    email: string;
    name?: string;
    company?: string;
    phone?: string;
    architecture?: string;
    scale?: string;
    status?: string;
  }) => {
    const result = await apiFetch<{ success: boolean; leadId: string }>('/admin/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.success) {
      await fetchLeads();
    }
    return result;
  }, [fetchLeads]);

  const editLead = useCallback(async (leadId: string, data: Partial<Lead>) => {
    const result = await apiFetch<{ success: boolean }>(`/admin/leads/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (result.success) {
      setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, ...data } : l)));
    }
    return result;
  }, []);

  const deleteLead = useCallback(async (leadId: string) => {
    const result = await apiFetch<{ success: boolean }>(`/admin/leads/${leadId}`, {
      method: 'DELETE',
    });
    if (result.success) {
      setLeads(prev => prev.filter(l => l.id !== leadId));
    }
    return result;
  }, []);

  const runDiagnostic = useCallback(async (leadId: string) => {
    return apiFetch<{ success: boolean; diagnosticId: string }>('/admin/diagnostic/run', {
      method: 'POST',
      body: JSON.stringify({ leadId }),
    });
  }, []);

  const sendReport = useCallback(async (leadId: string) => {
    return apiFetch<{ success: boolean }>('/admin/diagnostic/send-report', {
      method: 'POST',
      body: JSON.stringify({ leadId }),
    });
  }, []);

  const convertToClient = useCallback(async (leadId: string, data: Partial<Client>) => {
    return apiFetch<{ success: boolean; clientId: string }>('/admin/clients', {
      method: 'POST',
      body: JSON.stringify({ leadId, ...data }),
    });
  }, []);

  const sendFollowup = useCallback(async (leadId: string) => {
    return apiFetch<{ success: boolean; message: string }>('/admin/leads/send-followup', {
      method: 'POST',
      body: JSON.stringify({ leadId }),
    });
  }, []);

  const downloadHtmlReport = useCallback(async (leadId: string, companyOrDomain?: string, mode: 'client' | 'audit' = 'client') => {
    const token = await auth.currentUser?.getIdToken(false);
    const res = await fetch(`${API_BASE}/admin/diagnostic/html/${leadId}?mode=${mode}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao baixar relatório HTML.' }));
      throw new Error(err.error || 'Falha ao baixar relatório HTML.');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const label = (companyOrDomain || leadId).replace(/[^a-z0-9_-]/gi, '_');
    const prefix = mode === 'audit' ? 'Relatorio_GEO_Auditoria_' : 'Relatorio_GEO_';
    a.download = `${prefix}${label}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  const updateDiagnostic = useCallback(async (leadId: string, patch: Record<string, unknown>) => {
    return apiFetch<{ success: boolean }>(`/admin/diagnostic/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }, []);

  const analyzeSearchTerms = useCallback(async (leadId: string) => {
    const res = await apiFetch<{
      success: boolean;
      searchTerms: string[];
      companyOverview: string;
      searchTermsStatus: 'generated';
      searchTermsAnalyzedAt: string;
    }>(`/admin/leads/${leadId}/analyze-search-terms`, {
      method: 'POST',
    });

    if (res.success) {
      setLeads(prev => prev.map(l => (l.id === leadId ? {
        ...l,
        searchTerms: res.searchTerms,
        companyOverview: res.companyOverview,
        searchTermsStatus: 'generated',
        searchTermsAnalyzedAt: res.searchTermsAnalyzedAt,
      } : l)));
    }
    return res;
  }, []);

  const saveSearchTerms = useCallback(async (leadId: string, searchTerms: string[]) => {
    const res = await apiFetch<{
      success: boolean;
      searchTerms: string[];
      searchTermsStatus: 'approved';
    }>(`/admin/leads/${leadId}/save-search-terms`, {
      method: 'POST',
      body: JSON.stringify({ searchTerms }),
    });

    if (res.success) {
      setLeads(prev => prev.map(l => (l.id === leadId ? {
        ...l,
        searchTerms: res.searchTerms,
        searchTermsStatus: 'approved',
      } : l)));
    }
    return res;
  }, []);

  return { leads, loading, error, fetchLeads, addLead, editLead, deleteLead, runDiagnostic, sendReport, sendFollowup, convertToClient, updateDiagnostic, downloadHtmlReport, analyzeSearchTerms, saveSearchTerms };
}

export function useDiagnostic(leadId: string | null) {
  const [diagnostic, setDiagnostic] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostic = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ diagnostic: DiagnosticReport }>(`/admin/diagnostic/${leadId}`);
      setDiagnostic(data.diagnostic);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  return { diagnostic, loading, error, fetchDiagnostic };
}

export interface ClientHistory {
  initialScore: number;
  latestScore: number;
  scoreDiff: number;
  evolutionPercentage: number;
  diagnosticsCount: number;
  diagnostics: DiagnosticReport[];
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ clients: Client[] }>('/admin/clients');
      setClients(data.clients);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const editClient = useCallback(async (clientId: string, data: Partial<Client>) => {
    const result = await apiFetch<{ success: boolean }>(`/admin/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (result.success) {
      setClients(prev => prev.map(c => (c.id === clientId ? { ...c, ...data } : c)));
    }
    return result;
  }, []);

  const deleteClient = useCallback(async (clientId: string) => {
    const result = await apiFetch<{ success: boolean }>(`/admin/clients/${clientId}`, {
      method: 'DELETE',
    });
    if (result.success) {
      setClients(prev => prev.filter(c => c.id !== clientId));
    }
    return result;
  }, []);

  const runAgentForClient = useCallback(async (clientId: string, agentName: string, input?: Record<string, unknown>) => {
    return apiFetch<{ success: boolean; result: Record<string, unknown> }>('/admin/agent/run', {
      method: 'POST',
      body: JSON.stringify({ clientId, agentName, input }),
    });
  }, []);

  const fetchClientHistory = useCallback(async (clientId: string) => {
    return apiFetch<{ success: boolean; clientHistory: ClientHistory }>(`/admin/clients/${clientId}/history`);
  }, []);

  return { clients, loading, error, fetchClients, editClient, deleteClient, runAgentForClient, fetchClientHistory };
}

export interface AgentHealth {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'unavailable';
  requiredEnv: string[];
  note?: string;
}

export function useAgentsHealth() {
  const [agents, setAgents] = useState<AgentHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ agents: AgentHealth[] }>('/admin/agents/health');
      setAgents(data.agents);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao verificar status dos agentes');
    } finally {
      setLoading(false);
    }
  }, []);

  return { agents, loading, error, fetchHealth };
}
