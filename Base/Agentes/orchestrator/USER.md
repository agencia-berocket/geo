# USER.md — Contexto b.rocket e Preferências do Guilherme
> Este arquivo é comum a todos os agentes. Define como o Guilherme trabalha.

---

## Sobre o Fundador

**Nome:** Guilherme C. Rossi
**Empresa:** b.rocket — GEO (Generative Engine Optimization)
**E-mail:** berocket@berocket.com.br
**Website:** https://geo.berocket.com.br
**Perfil:** Especialista em estratégias de visibilidade digital com foco em IA generativa. Background em SEO, marketing digital, UX e automações.

---

## Modelo de Negócio

A b.rocket opera como **agência de GEO premium** com os seguintes planos:

| Plano | Valor | Público |
|---|---|---|
| GEO Diagnóstico | Grátis | Leads (isca) |
| Implantação Premium | R$ 497/mês (3 meses mínimo) | PMEs |
| Enterprise | Sob consulta (contrato anual) | Grandes empresas |

**Fase atual:** Conquistar os primeiros clientes para gerar prova social. Preços serão reajustados conforme casos de sucesso são construídos.

---

## Como o Guilherme prefere receber informações

1. **Bullet points numerados** com impacto claro
2. **Dados antes de opiniões** — sempre fundamente com o diagnóstico
3. **Próximo passo ao final** — nunca encerre sem uma ação clara
4. **Linguagem técnica precisa** — ele entende os termos, não precisa de simplificação excessiva
5. **Estimativas de tempo** sempre que possível para cada ação proposta

---

## Ferramentas e Infraestrutura

| Ferramenta | Uso |
|---|---|
| Coolify | Deploy e gerenciamento de variáveis de ambiente |
| Google Firestore | Banco de dados principal |
| Google Calendar API | Agendamentos de clientes |
| OpenRouter | Testes de Citation Share com múltiplas LLMs |
| Gemini API | Chat dos agentes no workspace |
| Nodemailer + Gmail | Envio de relatórios e comunicações |
| GitHub | Versionamento dos arquivos de agentes |

---

## Variáveis de Ambiente (produção)

| Variável | Função |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Credenciais do Firestore e Google Calendar |
| `EMAIL_USER` | Remetente dos e-mails (Gmail) |
| `EMAIL_PASS` | Senha de app do Gmail |
| `OPENROUTER_API_KEY` | API para testes de Citation Share |
| `GEMINI_API_KEY` | API para chat dos agentes |
| `ADMIN_SECRET_KEY` | Chave secreta para autenticação do painel admin |

---

## Padrões de Formatação para Respostas

- **Idioma:** Sempre português do Brasil
- **Tom:** Técnico mas acessível
- **Títulos:** Use `##` e `###` para hierarquia clara
- **Dados:** Sempre em tabelas Markdown quando possível
- **Código:** Use blocos de código com linguagem especificada
- **Ações:** Liste no formato `[ ] Ação — Impacto esperado — Responsável`
