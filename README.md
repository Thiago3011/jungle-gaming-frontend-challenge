# Kurio — Marketplace de NFTs

Marketplace demonstrativo em React, TypeScript, Vite, TanStack Router, TanStack Query, Axios e MSW.

> Autenticação, carteiras, cotações e compras são simuladas no navegador. Não há conexão com blockchain, transferência de NFT ou movimentação financeira real.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm
- Chromium para Playwright
- Chrome/Chromium para Lighthouse

## Instalação

    npm install
    npm run dev

MSW fica habilitado por padrão em desenvolvimento. Para executar sem mocks: VITE_ENABLE_MOCKS=false npm run dev.

## Contas de demonstração

| E-mail | Senha | Perfil |
| --- | --- | --- |
| thiago@kurio.demo | Kurio123! | Thiago Colecionador |
| bia@kurio.demo | Kurio123! | Beatriz Colecionadora |

## Scripts

| Comando | Descrição |
| --- | --- |
| npm run dev | Servidor de desenvolvimento |
| npm run build | TypeScript + build de produção |
| npm run typecheck | Verificação TypeScript |
| npm run lint | Oxlint |
| npm run preview | Preview de produção |
| npm run test:e2e | Playwright desktop e mobile |
| npm run test:e2e:report | Abre relatório HTML |
| npm run audit:lighthouse:mobile | Lighthouse mobile em localhost:4173 |
| npm run audit:lighthouse:desktop | Lighthouse desktop em localhost:4173 |

Primeira execução E2E: npx playwright install chromium. Os testes iniciam Vite automaticamente na porta 4173.

Para Lighthouse, execute npm run build e depois npm run preview -- --host 127.0.0.1 --port 4173 em um terminal. Em outro terminal, rode os scripts Lighthouse. Faça três execuções por combinação e registre a mediana.

## Cenários demonstrativos

- Login, cadastro, logout e sessão local com expiração em oito horas.
- Isolamento por conta de perfil, carteiras, favoritos, carrinho e último pedido.
- Carrinho visitante mesclado no login/cadastro, com limite de dez unidades por NFT.
- Favoritos REST por conta autenticada; favoritos de visitante armazenados localmente.
- Cotação REST com subtotal, desconto, taxa e total em wei inteiro.
- Cupom KURIO10 (10%), código inválido e KURIOEXPIRED (expirado).
- Idempotência de pedidos por Idempotency-Key: mesma chave e conteúdo recupera o mesmo pedido; conteúdo diferente retorna HTTP 409.
- Socket.IO simulado via MSW para nft.updated e order.updated.
- Playwright em Chromium desktop e mobile, com trace e screenshot em falhas.

## Arquitetura

Consulte ARCHITECTURE.md para contratos REST, sessão, propriedade dos dados, carrinho, cotação, idempotência e eventos.

## Limitações conhecidas

- Os dados são simulados no navegador pelo MSW; não existe backend persistente.
- Credenciais e sessão no localStorage são apenas para demonstração, não autenticação de produção.
- O Socket.IO é interceptado pelo MSW e não representa um serviço remoto de tempo real.
- O fluxo de compra é simulado; não há conexão real com MetaMask, WalletConnect, Coinbase Wallet ou blockchain.
- A suíte Playwright ainda é uma base inicial e precisa ser ampliada para cobrir todos os cenários de negócio, falhas, acessibilidade, eventos e regressão visual do desafio.
- A integração de cotação e reconciliação de eventos em todos os estados da interface precisa de validação.
- Não há relatório Lighthouse ou URL de deploy declarado como concluído até que sejam executados e verificados.

## Segurança

Não use os mocks como autenticação ou autorização em produção. Uma versão real exige backend confiável, hashing de senhas, validação de propriedade no servidor, gestão segura de sessão e persistência atômica de idempotência.