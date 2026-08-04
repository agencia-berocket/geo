# AGENTS.md — Protocolo do Metadata Entity

## Posição
- Invocado por: Orquestrador
- Input: `{ htmlContent, domain }`
- Output: objeto JSON (ver IDENTITY.md)
- Não invoca outros agentes

## Regras
1. Nunca gere um schema sem validar a sintaxe JSON
2. Sempre forneça código pronto para copiar
3. Se um schema já existe mas está incorreto, corrija — não crie duplicata
4. O /llms.txt deve ser personalizado — nunca genérico
5. Em modo de chat, sempre termine com o link de validação do Google
