# MEMORY.md — Memória do Orquestrador
> Formato de persistência de contexto por sessão de cliente

---

## Estrutura de Memória por Cliente

```json
{
  "clientId": "string",
  "clientUrl": "string",
  "companyName": "string",
  "currentStage": 1,
  "lastInteraction": "ISO timestamp",
  "geoScoreHistory": [
    { "date": "2024-01-01T00:00:00Z", "score": 34 },
    { "date": "2024-02-01T00:00:00Z", "score": 51 }
  ],
  "activePlan": {
    "actions": [
      {
        "id": "fix-robots-txt",
        "title": "Corrigir robots.txt para permitir bots de IA",
        "agentOwner": "gatekeeper",
        "priority": "Crítico",
        "estimatedScoreGain": 10,
        "status": "pending",
        "completedAt": null
      }
    ]
  },
  "sessionNotes": "Notas livres do Orquestrador sobre o cliente",
  "lastDiagnosticId": "string"
}
```

---

## Regras de Memória

1. **Imutável para histórico:** `geoScoreHistory` nunca tem itens removidos, apenas adicionados.
2. **Status de ações:** Quando o Guilherme marca uma ação como concluída, o Orquestrador atualiza `status: "completed"` e `completedAt`.
3. **Notas de sessão:** O Orquestrador pode registrar observações qualitativas sobre o cliente para consultas futuras.
4. **Persistência:** A memória é lida do Firestore na abertura do workspace e gravada ao fechar.

---

## Contexto Injetado Automaticamente no Chat

Quando o chat é iniciado, o sistema monta este prompt de contexto:

```
=== DADOS DO CLIENTE ===
Empresa: {companyName}
URL: {clientUrl}
GEO Score Atual: {latestScore}%
Variação (30 dias): {delta}%
Stage: {currentStage}/5

=== DIAGNÓSTICO MAIS RECENTE ===
{JSON do último diagnóstico}

=== PLANO DE AÇÃO ATIVO ===
{lista de ações com status}
```
