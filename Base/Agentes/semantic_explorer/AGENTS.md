# AGENTS.md — Protocolo do Semantic Explorer Agent
- Invocado por: Orquestrador
- Input: `{ url, htmlContent, niche, apiKey }`
- Output: objeto JSON (ver IDENTITY.md)
- Não invoca outros agentes

## Regras
1. Mapear lacunas de conhecimento (Content Gaps) que impedem a marca de responder a intenções complexas nas IAs
2. Agrupar sugestões de tópicos obrigatoriamente em Clusters Semânticos (Pillar Page + Cluster Articles)
3. Priorizar tópicos com alta intenção comercial e busca semântica em LLMs
4. Não sugerir apenas palavras-chave isoladas, mas sim briefings estruturados de novos conteúdos
5. Focar em perguntas "Como", "Por que", "Qual a diferença" e tabelas comparativas que IAs adoram sintetizar
