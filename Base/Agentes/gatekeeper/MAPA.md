# MAPA.md — Mapa de Arquivos do Gatekeeper

## Localização
```
Base/Agentes/gatekeeper/    ← VOCÊ ESTÁ AQUI
├── SOUL.md
├── IDENTITY.md
├── USER.md
├── AGENTS.md
├── MAPA.md
├── memory/MEMORY.md
└── skills/SKILL.md
```

## Recursos de Sistema Utilizados
- **geo-diagnostic-engine.cjs:** função `runGatekeeperAgent(baseUrl, htmlContent)` — linha ~200
- **Saída:** `gatekeeperStatus` no objeto de diagnóstico do Orquestrador
- **Firestore:** Não acessa diretamente — dados gravados pelo Orquestrador
