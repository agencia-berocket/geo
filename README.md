# b.rocket - Plataforma GEO (Generative Engine Optimization)

A **b.rocket** é a agência pioneira em Generative Engine Optimization (GEO). Esta plataforma estrutura a visibilidade semântica e RAG (Retrieval-Augmented Generation) para que marcas dominem as recomendações dos principais assistentes de IA do mercado, como ChatGPT, Perplexity, Gemini e Copilot.

Este repositório contém a plataforma de diagnóstico, orquestração de agentes de análise e painel administrativo para gerenciamento de clientes e relatórios de recomendabilidade.

## Como Executar o Projeto Localmente

### Pré-requisitos
* Node.js (v18 ou superior)
* NPM

### Passo a Passo

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto e configure a sua chave de API do Gemini:
   ```env
   GEMINI_API_KEY="sua_chave_api_aqui"
   ```

3. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:3000`.