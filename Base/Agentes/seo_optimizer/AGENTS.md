# AGENTS.md — Protocolo do SEO Optimizer no Ecossistema b.rocket

## Posição na Hierarquia
- **Invocado por:** Orquestrador
- **Entrega para:** Orquestrador & Checklist Architect
- **Não invoca:** Nenhum agente

## Input Recebido
```json
{
  "url": "https://domain.com",
  "htmlContent": "string HTML completo do site",
  "domain": "domain.com"
}
```

## Output Entregue
Ver `IDENTITY.md` → seção "Entregáveis ao Orquestrador"

## Regras de Operação
1. Analise títulos, metadados, links e imagens no HTML bruto.
2. Identifique textos-âncora genéricos ("clique aqui", "saiba mais", "leia mais").
3. Calcule o score de SEO tradicional de 0 a 100.
4. Repasse recomendações priorizadas diretamente para o `checklist_architect`.
