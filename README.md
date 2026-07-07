# b.rocket - GEO (Generative Engine Optimization)

Plataforma de diagnóstico e otimização para motores de busca generativos (GEO), projetada para posicionar marcas e conteúdos no topo das recomendações de IAs como ChatGPT, Gemini e Perplexity.

## 🔗 Link de Produção

O site está publicado e pode ser acessado em:
👉 **[http://geo.berocket.com.br/](http://geo.berocket.com.br/)**

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
*   [Node.js](https://nodejs.org/) instalado.

### Passo a Passo

1. **Instalar as dependências:**
   ```bash
   npm install
   ```

2. **Configurar as variáveis de ambiente:**
   *   Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como base).
   *   Configure a chave da API do Gemini (`GEMINI_API_KEY`) e demais variáveis necessárias.

3. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O projeto iniciará localmente, por padrão em `http://localhost:3000`.

---

## 🚀 Estrutura de Agentes (Arquitetura)

O backend do projeto é desenhado sob a arquitetura multiagente para processar o diagnóstico de GEO (Raio-X):

1.  **`GEO_CORE_ORCHESTRATOR`**: Controla o fluxo de dados, chama os especialistas em paralelo e consolida o score final.
2.  **`TECHNICAL_GATEKEEPER_AGENT`**: Analisa barreiras de rastreamento (robots.txt, SSR, latência).
3.  **`METADATA_ENTITY_AGENT`**: Valida a marcação JSON-LD/Schema e compila o `llms.txt`.
4.  **`CONTENT_ABSORPTION_AGENT`**: Avalia o potencial de citação com base nos fatores científicos de Princeton (AEO, densidade estatística, aspas).
5.  **`INTENT_PROMPT_AGENT`**: Simula a presença da marca nas APIs das LLMs e calcula o *Share of Voice* (SoV).

---

## 📦 Deploy & Publicação

O deploy do projeto está configurado de forma contínua no **Coolify**:
*   **Servidor:** Localhost Docker
*   **Repositório:** [https://github.com/agencia-berocket/geo.git](https://github.com/agencia-berocket/geo.git)
*   **Branch:** `main`
*   **Buildpack:** Nixpacks (porta exposed `80`)
*   **Webhook:** Toda alteração commitada e empurrada para a branch `main` dispara automaticamente um novo build e deploy no Coolify.
