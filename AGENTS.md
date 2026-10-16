# WebObsidian — instruções para agentes de IA

Estas instruções valem para Codex e agentes compatíveis com AGENTS.md.

## Projeto existente
- Preserve a arquitetura atual: frontend React 18 + TypeScript + Vite; servidor Express; desktop Electron.
- Não migre para Next.js, Supabase ou outra stack sem solicitação explícita e plano aprovado.
- Interface e mensagens voltadas aos usuários devem estar em português brasileiro (pt-BR).
- Mantenha o tema escuro como padrão sem remover a opção clara.
- Priorize acessibilidade e layouts adaptáveis a iPhone (Safari/WebKit) e Windows.
- Notas pessoais pertencem ao usuário: não sobrescreva, traduza ou renomeie conteúdo de cofre para localizar a interface.

## Método de trabalho: Superpowers + Spec Kit
1. Compreenda o pedido e redija escopo, critérios de aceitação e riscos antes de modificar código.
2. Escolha a menor alteração reversível; não instale tecnologias só porque estão disponíveis.
3. Use desenvolvimento orientado a testes quando possível: teste que falha → correção → teste aprovado.
4. Faça revisão de segurança, acessibilidade, desempenho e riscos de sincronização.
5. Verifique os comandos reais antes de alegar que algo funciona.
6. Apresente diffs e peça aprovação antes de deploy, migração de dados ou alterações com cobrança.

## Verificações
- `npm run typecheck`
- `npm run build`
- `npx playwright test --project=chromium-desktop` (depois da configuração de testes)
- `npx playwright test --project=webkit-iphone` (requer WebKit instalado)
- Nos testes E2E, o servidor deve estar rodando em `http://127.0.0.1:8787` ou via `E2E_BASE_URL`.

## Dados e segurança
- Não publique cofre privado ou credenciais em GitHub, artefatos de CI ou logs.
- Nunca inclua tokens GitHub, chaves Supabase/Railway ou senhas em commits.
- Para hospedagem, use HTTPS, senha forte, armazenamento persistente e backups verificados.
- Não confunda `webobsidian` (código do aplicativo) com repositório de notas/sincronização Git.
- Modificações em configuração, autenticação, instalação de plugins e sincronização exigem testes.

## Interface
- Use as práticas de React, design acessível, componentes reutilizáveis e consistência de UX inspiradas em shadcn/ui e UI UX Pro Max.
- Não introduza Tailwind, Next.js ou shadcn automaticamente; avalie custo de migração.
- Teste estados vazios, foco de teclado, texto longo PT-BR, iPhone e preferência por movimento reduzido.
