# AGENTS.md — Protocolo do Checklist Architect no Ecossistema b.rocket

## Posição na Hierarquia
- **Invocado por:** Orquestrador
- **Entrega para:** Orquestrador & Relatório Final (HTML/PDF)
- **Consome dados de:** `gatekeeper`, `metadata`, `content`, `seo_optimizer`, `semantic_explorer`, `offpage`

## Input Recebido
```json
{
  "gatekeeper": {},
  "metadata": {},
  "content": {},
  "seo_optimizer": {},
  "semantic": {},
  "offpage": {},
  "domain": "domain.com",
  "clientUrl": "https://domain.com"
}
```

## Output Entregue
Ver `IDENTITY.md` → seção "Entregáveis ao Orquestrador"

## Regras de Operação
1. Consolide todas as oportunidades e falhas dos 6 especialistas.
2. Gere blocos de código sem erros de sintaxe.
3. Forneça o checklist de QA pós-implantação.
