### SKILL.md — Mineração e Coleta Multicanais (Apify & Google)
Objetivo: Gerar uma base de leads qualificados por semana sem intervenção manual

--------------------------------------------------------------------------------

#### Processo de Execução
1.  **Parâmetros de Entrada:** Receber `{ nicho, localizacao, cargo_alvo, tamanho_empresa, limite }` do Orquestrador/Painel.
2.  **Mapeamento de Empresas via Google:**
    *   Rodar pesquisa no Google Search por: *"Melhores soluções de [nicho] em [localizacao]"*.
    *   Fazer scrap das 2 primeiras páginas e coletar os domínios corporativos.
3.  **Execução de Scrapers Apify (LinkedIn):**
    *   Enviar a lista de domínios/nomes ao Actor `LinkedIn Company URL - Mass Profile Finder`.
    *   Obter a URL oficial da página da empresa no LinkedIn.
    *   Consultar a lista de funcionários e identificar cargos-alvo: **CEO, CMO, Founder ou Diretor de Marketing**.
    *   Enviar o nome do decisor para o Actor `LinkedIn People URL - Mass Profile Finder` para obter o perfil individual do decisor.
4.  **Consolidação no Firestore:**
    *   Verificar se a empresa atende aos critérios de perfil desejados (ex: 20 a 200 funcionários).
    *   Salvar o objeto estruturado na coleção `hunter_leads` com o status `unscanned`.
