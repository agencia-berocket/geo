# MAPA.md — Mapa de Arquivos do Lead Hunter

## Localização
```
Base/Agentes/lead_hunter/    ← VOCÊ ESTÁ AQUI
├── SOUL.md
├── IDENTITY.md
├── MAPA.md
└── skills/
    ├── MAPA.md
    ├── minerar-leads/
    │   └── SKILL.md
    ├── auditar-geoready/
    │   └── SKILL.md
    └── gerar-outreach/
        └── SKILL.md
```

## Recursos de Sistema Utilizados
- **server.cjs:** rotas `/api/admin/lead-hunter/*` (`mine`, `audit`, `outreach`, `leads`, `push-to-main`)
- **Painel Admin:** aba "Lead Hunter" (`src/admin/pages/LeadHunter.tsx`)
- **APIs Conectadas:** Apify REST API, OpenRouter (Gemini / Claude / GPT-4o), Google Custom Search / Maps API
- **Firestore:** Coleções `hunter_leads` e `leads`
