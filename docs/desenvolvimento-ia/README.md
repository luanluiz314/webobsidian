# Desenvolvimento assistido por IA — WebObsidian

## Situação das oito referências

| Referência | Aplicação | Instalação do repositório original |
| --- | --- | --- |
| obra/superpowers | Planejamento, TDD, revisão e verificação via skills já disponíveis no ChatGPT | Não |
| github/spec-kit | Template de especificações + critérios de aceitação abaixo | Não |
| openai/codex | `AGENTS.md` compatível com agentes Codex | Codex CLI não instalado por este pacote |
| vercel/next.js | Diretrizes de React/performance sem migração de Vite | Não |
| shadcn-ui/ui | Padrões de componentes e acessibilidade; adoção seletiva, não automática | Não |
| supabase/supabase | Referência futura para Auth/Storage/DB; não substituir Express nem filesystem | Não |
| microsoft/playwright | Arquivos de configuração e smoke tests para browser desktop e iPhone WebKit | `@playwright/test` requer instalação abaixo |
| nextlevelbuilder/ui-ux-pro-max-skill | Checklist de UI/UX adaptado para o WebObsidian | Skill original não instalada |

## Instalar dependência e validar

Execute na raiz do projeto:

```bash
npm install --save-dev @playwright/test
npm run typecheck
npm run build
npx playwright install chromium webkit
```

Em um terminal, inicie o servidor de desenvolvimento conforme instruções do projeto, ou após o build `npm run start`. Em outro terminal, execute:

```bash
npx playwright test
```

O workflow Playwright foi definido para execução MANUAL, evitando alterar a CI existente antes da primeira rodada validada. O workflow automatiza apenas o Chromium por enquanto; rode WebKit (iPhone simulado) localmente em ambiente compatível.

## Padrão de especificação (inspirado no Spec Kit)

Para qualquer recurso, escreva: **problema, resultado desejado, requisitos funcionais, não requisitos, critérios de aceitação verificáveis, riscos e teste de regressão**. Use `MODELO-ESPECIFICACAO.md` nesta pasta.

## Condições para publicação

1. Todas as alterações devem preservar notas e dados do usuário.
2. `npm run typecheck` e `npm run build` devem concluir com sucesso em execução atual.
3. Testes automatizados e inspeção manual devem cobrir ao menos um navegador desktop e o Safari do iPhone.
4. Alterações de autenticação e sincronização precisam ser verificadas contra perda e vazamento de dados.
5. Não confunda teste responsivo Playwright com teste real em iPhone físico.
