# MEMORY.md — Memória do Technical Gatekeeper

## Dados Persistentes por Cliente

```json
{
  "clientId": "string",
  "robotsTxtHistory": [
    {
      "date": "2024-01-01T00:00:00Z",
      "blockedBots": ["GPTBot"],
      "score": 15
    },
    {
      "date": "2024-02-01T00:00:00Z",
      "blockedBots": [],
      "score": 23
    }
  ],
  "ssrStatus": "active",
  "lastLatencyMs": 342,
  "pendingFixes": ["Adicionar Bingbot ao robots.txt"],
  "completedFixes": ["Ativar SSR via Next.js", "Adicionar GPTBot"],
  "notes": "Cliente usa WordPress — WP Rocket instalado, cache funcional"
}
```

## Regras de Memória
1. `robotsTxtHistory` mantém versão de cada scan para mostrar evolução
2. `completedFixes` nunca é apagado — histórico de trabalho realizado
3. `notes` é editável pelo Guilherme via chat
