import { useState, useCallback } from 'react';

const API_BASE = '/api';

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Lead {
  id: string;
  url: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  architecture?: string;
  scale?: string;
  createdAt: string;
  status: 'new' | 'processing' | 'completed' | 'converted';
  geoScore?: number;
  diagnosticId?: string;
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

  const editLead = useCallback(async (leadId: string, data: Partial<Lead>) => {
    return apiFetch<{ success: boolean }>(`/admin/leads/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }, []);

  const deleteLead = useCallback(async (leadId: string) => {
    return apiFetch<{ success: boolean }>(`/admin/leads/${leadId}`, {
      method: 'DELETE',
    });
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

  return { leads, loading, error, fetchLeads, editLead, deleteLead, runDiagnostic, sendReport, convertToClient };
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
    return apiFetch<{ success: boolean }>(`/admin/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }, []);

  const deleteClient = useCallback(async (clientId: string) => {
    return apiFetch<{ success: boolean }>(`/admin/clients/${clientId}`, {
      method: 'DELETE',
    });
  }, []);

  const runAgentForClient = useCallback(async (clientId: string, agentName: string, input?: Record<string, unknown>) => {
    return apiFetch<{ success: boolean; result: Record<string, unknown> }>('/admin/agent/run', {
      method: 'POST',
      body: JSON.stringify({ clientId, agentName, input }),
    });
  }, []);

  return { clients, loading, error, fetchClients, editClient, deleteClient, runAgentForClient };
}
