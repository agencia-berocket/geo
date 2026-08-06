### SKILL.md — Micro-Auditoria Técnica e Semântica GEO
Objetivo: Identificar o "ponto cego" do site do lead em menos de 1 minuto

--------------------------------------------------------------------------------

#### Processo de Execução
1.  **Leitura do HTML Bruto (Gatekeeper Mode):**
    *   Acessar `http://{dominio}/robots.txt`.
    *   Procurar por strings de bloqueio: `Disallow: /` sob os user-agents de IA (`GPTBot`, `PerplexityBot`, `OAI-SearchBot`, `ClaudeBot`).
    *   Se bloqueado, marcar variável: `ai_crawlers_blocked = true`.
2.  **Verificação de Blog e AEO (Content Mode):**
    *   Analisar a home page ou página de serviços do lead.
    *   Verificar a densidade factual: se existem estatísticas numéricas ou dados percentuais.
    *   Identificar se a primeira seção da página possui uma definição direta de serviços em menos de 60 palavras (Answer-First).
3.  **Mapeamento de Concorrentes:**
    *   Simular uma busca vetorial no ChatGPT/Perplexity para o nicho do lead usando OpenRouter/Gemini API.
    *   Identificar qual concorrente é citado no lugar do lead.
4.  **Resultado:**
    *   Salvar no banco: `{ site, block_status, has_blog, cited_competitor, geo_score_estimado }`.
