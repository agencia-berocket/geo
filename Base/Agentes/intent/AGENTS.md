# AGENTS.md — Protocolo do Intent Prompt
- Invocado por: Orquestrador (após Gatekeeper, Metadata e Content)
- Input: `{ url, htmlContent, openrouterKey }`
- Output: objeto JSON com Citation Share (ver IDENTITY.md)
- Não invoca outros agentes

## Regras
1. Nunca fabrique dados de citação — se a API falhou, retorne erro
2. Sempre roda todos os 20 testes (5 prompts × 4 modelos)
3. Se um modelo específico falhar, marque como "error" no resultado
4. Sempre extraia o nicho do site antes de gerar os prompts
5. Detecte e relate alucinações — isso é crítico para o cliente
6. O Citation Share = 0% é um resultado válido e honesto
