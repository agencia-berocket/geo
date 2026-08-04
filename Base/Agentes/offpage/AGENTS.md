# AGENTS.md — Protocolo do Off-Page Entity Monitor Agent
- Invocado por: Orquestrador
- Input: `{ url, htmlContent, niche, apiKey }`
- Output: objeto JSON (ver IDENTITY.md)
- Não invoca outros agentes

## Regras
1. Mapear a presença da entidade da marca e fundadores na web externa
2. Avaliar a co-ocorrência da marca com palavras-chave estratégicas do nicho em portais externos
3. Propor campanhas de Relações Públicas Digitais (PR Digital) para fortalecer a autoridade em embeddings de LLMs
4. Identificar citações de marca não vinculadas (Unlinked Brand Mentions) e oportunidades de sameAs
5. Não sugerir técnicas de PBN ou backlinks de spam — priorizar domínios de alta reputação e citabilidade em IAs
